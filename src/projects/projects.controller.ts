import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, HttpStatus } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/interfaces/api-response.interface';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(@Request() req: any, @Body() createProjectDto: CreateProjectDto): Promise<ApiResponse<ProjectResponseDto>> {
    const userId = req.user._id || req.user.id;
    const data = await this.projectsService.create(userId, createProjectDto);
    return {
      message: 'Project created successfully',
      data,
      status: 'success',
      code: HttpStatus.CREATED,
    };
  }

  @Get()
  async findAll(@Request() req: any): Promise<ApiResponse<ProjectResponseDto[]>> {
    const userId = req.user._id || req.user.id;
    const data = await this.projectsService.findAll(userId);
    return {
      message: 'Projects retrieved successfully',
      data,
      status: 'success',
      code: HttpStatus.OK,
    };
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string): Promise<ApiResponse<ProjectResponseDto>> {
    const userId = req.user._id || req.user.id;
    const data = await this.projectsService.findOne(userId, id);
    return {
      message: 'Project retrieved successfully',
      data,
      status: 'success',
      code: HttpStatus.OK,
    };
  }

  @Patch(':id')
  async update(@Request() req: any, @Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto): Promise<ApiResponse<ProjectResponseDto>> {
    const userId = req.user._id || req.user.id;
    const data = await this.projectsService.update(userId, id, updateProjectDto);
    return {
      message: 'Project updated successfully',
      data,
      status: 'success',
      code: HttpStatus.OK,
    };
  }

  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string): Promise<ApiResponse<void>> {
    const userId = req.user._id || req.user.id;
    await this.projectsService.remove(userId, id);
    return {
      message: 'Project deleted successfully',
      status: 'success',
      code: HttpStatus.OK,
    };
  }
}
