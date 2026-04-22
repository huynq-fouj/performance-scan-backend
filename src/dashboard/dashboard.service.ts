import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DashboardSummaryDto, ProjectHealthItem, DashboardAlert, ActivityLog, TrendDataPoint } from './dto/dashboard-response.dto';
import { ProjectDocument } from '../projects/entities/project.entity';
import { ScanDocument } from '../scan/entities/scan.entity';
import { formatDistanceToNow } from 'date-fns';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectModel('Project') private projectModel: Model<ProjectDocument>,
    @InjectModel('Scan') private scanModel: Model<ScanDocument>,
  ) {}

  async getSummary(userId: string): Promise<DashboardSummaryDto> {
    const userObjId = new Types.ObjectId(userId);
    
    // 1. Fetch all projects for user
    const projects = await this.projectModel.find({ userId: userObjId }).exec();
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Scans this month
    const scansThisMonth = await this.scanModel.countDocuments({
      userId: userObjId,
      createdAt: { $gte: startOfMonth }
    }).exec();

    let healthyCount = 0;
    let warningCount = 0;
    let criticalCount = 0;

    const projectHealthList: ProjectHealthItem[] = [];

    // Categorize projects
    for (const p of projects) {
      const score = p.lastScore || 0;
      let status: 'Healthy' | 'Warning' | 'Critical' = 'Healthy';
      
      if (!p.isActive || !p.lastScanAt) {
          // If no scan, let's just count as Warning for now or ignore from counts
          status = 'Warning';
      } else if (score >= 90) {
        status = 'Healthy';
        healthyCount++;
      } else if (score >= 50) {
        status = 'Warning';
        warningCount++;
      } else {
         status = 'Critical';
         criticalCount++;
      }

      // Compute trend. Need the last 2 scans
      const lastTwoScans = await this.scanModel
        .find({ projectId: p._id, status: 'success' })
        .sort({ createdAt: -1 })
        .limit(2)
        .select('performanceScore')
        .exec();

      let trend: 'up' | 'down' | 'flat' = 'flat';
      if (lastTwoScans.length === 2) {
         const latest = lastTwoScans[0].performanceScore || 0;
         const previous = lastTwoScans[1].performanceScore || 0;
         if (latest > previous + 2) trend = 'up';
         else if (latest < previous - 2) trend = 'down';
         else trend = 'flat';
      } else if (lastTwoScans.length === 1) {
         trend = 'up'; // First scan inherently an improvement
      }

      projectHealthList.push({
        id: p._id.toString(),
        name: p.name,
        score,
        status,
        lastScanAt: p.lastScanAt || null,
        trend
      });
    }

    // 2. Alerts (Identify recent drops or failures)
    const alerts: DashboardAlert[] = [];
    const recentFailedScans = await this.scanModel.find({ 
      userId: userObjId, 
      status: 'failed',
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // last 7 days
    }).sort({ createdAt: -1 }).limit(5).populate('projectId', 'name').exec();

    recentFailedScans.forEach(scan => {
        const projName = scan.projectId ? (scan.projectId as any).name : 'Unknown';
        alerts.push({
            id: scan._id.toString() + '-fail',
            projectId: scan.projectId._id.toString(),
            projectName: projName,
            message: `Scan failed to complete.`,
            severity: 'high',
            date: scan.createdAt
        });
    });

    // Score drops
    for (const p of projectHealthList) {
        if (p.trend === 'down' && p.status === 'Critical') {
            alerts.push({
                id: p.id + '-drop',
                projectId: p.id,
                projectName: p.name,
                message: `Performance degraded to Critical (${p.score} pts)`,
                severity: 'critical',
                date: p.lastScanAt ? new Date(p.lastScanAt) : new Date()
            });
        }
    }

    // Sort alerts
    alerts.sort((a, b) => b.date.getTime() - a.date.getTime());

    // 3. Recent Activity (last 10 scans)
    const recentScans = await this.scanModel.find({ userId: userObjId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate<{ projectId: ProjectDocument }>('projectId', 'name')
      .exec();

    const recentActivity: ActivityLog[] = recentScans.map(scan => {
        const projName = scan.projectId ? scan.projectId.name : 'Unknown';
        let action = `Scan queued`;
        if (scan.status === 'success') action = `Scan completed with score ${scan.performanceScore}`;
        if (scan.status === 'failed') action = `Scan failed`;

        return {
            id: scan._id.toString(),
            projectId: scan.projectId ? scan.projectId._id.toString() : '',
            projectName: projName,
            action,
            timeAgo: formatDistanceToNow(scan.createdAt, { addSuffix: true }),
            date: scan.createdAt
        };
    });

    // 4. Trends (Mocking or aggregating avg score per day over last 14 days)
    const trends: TrendDataPoint[] = [];
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const matchStage: any = { 
        userId: userObjId, 
        status: 'success',
        createdAt: { $gte: fourteenDaysAgo }
    };

    const aggregatedTrends = await this.scanModel.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            avgScore: { $avg: "$performanceScore" }
          }
        },
        { $sort: { _id: 1 } }
    ]);

    aggregatedTrends.forEach(t => {
        trends.push({
            date: t._id,
            score: Math.round(t.avgScore)
        });
    });

    return {
      portfolio: {
        totalProjects: projects.length,
        healthyProjects: healthyCount,
        warningProjects: warningCount,
        criticalProjects: criticalCount,
        scansThisMonth
      },
      projectHealthList,
      alerts: alerts.slice(0, 10), // Limit total alerts
      recentActivity,
      trends
    };
  }
}
