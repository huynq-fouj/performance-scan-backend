export interface TrendDataPoint {
  date: string;
  score: number;
}

export interface ActivityLog {
  id: string;
  projectId: string;
  projectName: string;
  action: string; // e.g. "Scan completed", "Score dropped"
  timeAgo: string;
  date: Date;
}

export interface DashboardAlert {
  id: string;
  projectId: string;
  projectName: string;
  message: string;
  severity: 'critical' | 'high' | 'medium';
  date: Date;
}

export interface ProjectHealthItem {
  id: string;
  name: string;
  score: number;
  status: 'Healthy' | 'Warning' | 'Critical';
  lastScanAt: Date | string | null;
  trend: 'up' | 'down' | 'flat';
}

export class DashboardSummaryDto {
  portfolio: {
    totalProjects: number;
    healthyProjects: number;
    warningProjects: number;
    criticalProjects: number;
    scansThisMonth: number;
  };
  projectHealthList: ProjectHealthItem[];
  alerts: DashboardAlert[];
  recentActivity: ActivityLog[];
  trends: TrendDataPoint[];
}

export interface AggregatedIssue {
  title: string;
  count: number;
  severity: string;
  affectedProjects: string[];
}

export interface ExecutiveReportDto {
  averageScore: number;
  healthDistribution: {
    good: { count: number; percent: number };
    average: { count: number; percent: number };
    poor: { count: number; percent: number };
  };
  commonIssues: AggregatedIssue[];
  topPerformers: any[];
  needsAttention: any[];
  totalScansAnalyzed: number;
}
