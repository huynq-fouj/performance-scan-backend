import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  async create(userId: string, createProjectDto: CreateProjectDto): Promise<ProjectResponseDto> {
    const newProject = new this.projectModel({
      ...createProjectDto,
      userId: new Types.ObjectId(userId),
    });
    const saved = await newProject.save();
    return this.mapToResponseDto(saved);
  }

  async findAll(userId: string): Promise<ProjectResponseDto[]> {
    const projects = await this.projectModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
    return projects.map(p => this.mapToResponseDto(p));
  }

  async findOne(userId: string, id: string): Promise<ProjectResponseDto> {
    const project = await this.projectModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    }).exec();

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }
    return this.mapToResponseDto(project);
  }

  async update(userId: string, id: string, updateProjectDto: UpdateProjectDto): Promise<ProjectResponseDto> {
    const project = await this.projectModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { $set: updateProjectDto },
      { new: true },
    ).exec();

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }
    return this.mapToResponseDto(project);
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.projectModel.deleteOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    }).exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Project not found or access denied');
    }
  }

  private mapToResponseDto(doc: ProjectDocument): ProjectResponseDto {
    return {
      id: doc._id.toString(),
      name: doc.name,
      url: doc.url,
      description: doc.description,
      logo: doc.logo,
      isActive: doc.isActive,
      autoScanFrequency: doc.autoScanFrequency,
      lastScanAt: doc.lastScanAt,
      lastScore: doc.lastScore,
      lastAccessibilityScore: doc.lastAccessibilityScore,
      lastBestPracticesScore: doc.lastBestPracticesScore,
      lastSeoScore: doc.lastSeoScore,
      lastScreenshot: doc.lastScreenshot,
      includeSeo: doc.includeSeo,
      includeAccessibility: doc.includeAccessibility,
      includeBestPractices: doc.includeBestPractices,
      storageItems: doc.storageItems,
      createdAt: (doc as any).createdAt,
      updatedAt: (doc as any).updatedAt,
    };
  }
}
