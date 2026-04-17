import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  async create(userId: string, createProjectDto: CreateProjectDto): Promise<ProjectDocument> {
    const newProject = new this.projectModel({
      ...createProjectDto,
      userId: new Types.ObjectId(userId),
    });
    return newProject.save();
  }

  async findAll(userId: string): Promise<ProjectDocument[]> {
    return this.projectModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).exec();
  }

  async findOne(userId: string, id: string): Promise<ProjectDocument> {
    const project = await this.projectModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    }).exec();

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }
    return project;
  }

  async update(userId: string, id: string, updateProjectDto: UpdateProjectDto): Promise<ProjectDocument> {
    const project = await this.projectModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { $set: updateProjectDto },
      { new: true },
    ).exec();

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }
    return project;
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
}
