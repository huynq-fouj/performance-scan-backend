import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Model, Types } from 'mongoose';
import { Scan, ScanDocument } from './entities/scan.entity';
import { Project, ProjectDocument } from '../projects/entities/project.entity';
import { CreateScanDto } from './dto/create-scan.dto';
import { ScanResponseDto } from './dto/scan-response.dto';

@Injectable()
export class ScanService {
  constructor(
    @InjectModel(Scan.name) private scanModel: Model<ScanDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectQueue('lighthouse-scan') private lighthouseQueue: Queue,
  ) {}

  private mapToResponseDto(scan: ScanDocument): ScanResponseDto {
    const obj = scan.toObject();
    return {
      id: obj._id.toString(),
      projectId: obj.projectId.toString(),
      status: obj.status,
      device: obj.device,
      performanceScore: obj.performanceScore,
      fcp: obj.fcp,
      lcp: obj.lcp,
      cls: obj.cls,
      tbt: obj.tbt,
      inp: obj.inp,
      speedIndex: obj.speedIndex,
      fcpScore: obj.fcpScore,
      lcpScore: obj.lcpScore,
      clsScore: obj.clsScore,
      tbtScore: obj.tbtScore,
      speedIndexScore: obj.speedIndexScore,
      jsSizeKb: obj.jsSizeKb,
      cssSizeKb: obj.cssSizeKb,
      requestCount: obj.requestCount,
      screenshotUrl: obj.screenshotUrl,
      recommendations: obj.recommendations || [],
      errorMessage: obj.errorMessage,
      startedAt: obj.startedAt,
      completedAt: obj.completedAt,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    };
  }

  async create(userId: string, createScanDto: CreateScanDto): Promise<ScanResponseDto> {
    const { projectId } = createScanDto;

    // Verify project belongs to user
    const project = await this.projectModel.findOne({
      _id: new Types.ObjectId(projectId),
      userId: new Types.ObjectId(userId),
    });

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    const newScan = new this.scanModel({
      projectId: new Types.ObjectId(projectId),
      userId: new Types.ObjectId(userId),
      status: 'queued',
      device: createScanDto.device || 'mobile',
      startedAt: new Date(),
    });

    const saved = await newScan.save();
    
    // Dispatch job to queue
    await this.lighthouseQueue.add('scan', {
      scanId: saved._id.toString(),
      projectId: saved.projectId.toString(),
      url: project.url,
      device: saved.device,
    });

    return this.mapToResponseDto(saved);
  }

  async findAllByProject(
    userId: string,
    projectId: string,
    query: { status?: string; startDate?: string; endDate?: string; page?: number; limit?: number },
  ): Promise<{ data: ScanResponseDto[]; total: number }> {
    const { status, startDate, endDate, page = 1, limit = 10 } = query;
    const filter: any = {
      projectId: new Types.ObjectId(projectId),
      userId: new Types.ObjectId(userId),
    };

    if (status && ['queued', 'running', 'success', 'failed'].includes(status)) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.startedAt = {};
      if (startDate) filter.startedAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.startedAt.$lte = end;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [scans, total] = await Promise.all([
      this.scanModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .exec(),
      this.scanModel.countDocuments(filter).exec(),
    ]);

    return {
      data: scans.map((scan) => this.mapToResponseDto(scan)),
      total,
    };
  }

  async findOne(userId: string, id: string): Promise<ScanResponseDto> {
    const scan = await this.scanModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    }).exec();

    if (!scan) {
      throw new NotFoundException('Scan not found or access denied');
    }
    return this.mapToResponseDto(scan);
  }

  async cancel(userId: string, id: string): Promise<ScanResponseDto> {
    const scan = await this.scanModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    }).exec();

    if (!scan) {
      throw new NotFoundException('Scan not found or access denied');
    }

    if (scan.status === 'success' || scan.status === 'failed') {
      return this.mapToResponseDto(scan); // Already finished
    }

    scan.status = 'failed';
    scan.errorMessage = 'Manually cancelled by user';
    scan.completedAt = new Date();
    
    const updated = await scan.save();

    // Also update project to clear lastScanAt if needed, or leave it. We'll just return.
    return this.mapToResponseDto(updated);
  }

  async findAll(
    userId: string,
    query: { status?: string; projectId?: string; startDate?: string; endDate?: string; page?: number; limit?: number },
  ): Promise<{ data: ScanResponseDto[]; total: number }> {
    const { status, projectId, startDate, endDate, page = 1, limit = 10 } = query;
    const filter: any = {
      userId: new Types.ObjectId(userId),
    };

    if (projectId) {
      filter.projectId = new Types.ObjectId(projectId);
    }

    if (status && ['queued', 'running', 'success', 'failed'].includes(status)) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [scans, total] = await Promise.all([
      this.scanModel
        .find(filter)
        .populate('projectId', 'name url')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .exec(),
      this.scanModel.countDocuments(filter).exec(),
    ]);

    return {
      data: scans.map((scan) => {
        const obj = scan.toObject();
        const dto = this.mapToResponseDto(scan);
        // Attach populated project info
        if (obj.projectId && typeof obj.projectId === 'object' && (obj.projectId as any).name) {
          const proj = obj.projectId as any;
          dto.project = {
            id: proj._id.toString(),
            name: proj.name,
            url: proj.url,
          };
          dto.projectId = proj._id.toString();
        }
        return dto;
      }),
      total,
    };
  }
}
