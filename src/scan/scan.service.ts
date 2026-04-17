import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Scan, ScanDocument } from './entities/scan.entity';
import { Project, ProjectDocument } from '../projects/entities/project.entity';
import { CreateScanDto } from './dto/create-scan.dto';

@Injectable()
export class ScanService {
  constructor(
    @InjectModel(Scan.name) private scanModel: Model<ScanDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  async create(userId: string, createScanDto: CreateScanDto): Promise<ScanDocument> {
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
      url: project.url,
      status: 'queued',
    });

    return newScan.save();
  }

  async findAllByProject(userId: string, projectId: string): Promise<ScanDocument[]> {
    return this.scanModel.find({
      projectId: new Types.ObjectId(projectId),
      userId: new Types.ObjectId(userId),
    }).sort({ createdAt: -1 }).exec();
  }

  async findOne(userId: string, id: string): Promise<ScanDocument> {
    const scan = await this.scanModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    }).exec();

    if (!scan) {
      throw new NotFoundException('Scan not found or access denied');
    }
    return scan;
  }
}
