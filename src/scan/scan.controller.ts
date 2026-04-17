import { Controller, Get, Post, Body, Param, UseGuards, Request, HttpStatus, Query } from '@nestjs/common';
import { ScanService } from './scan.service';
import { CreateScanDto } from './dto/create-scan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/interfaces/api-response.interface';

@Controller('scans')
@UseGuards(JwtAuthGuard)
export class ScanController {
  constructor(private readonly scanService: ScanService) {}

  @Post()
  async create(@Request() req: any, @Body() createScanDto: CreateScanDto): Promise<ApiResponse<any>> {
    const userId = req.user._id || req.user.id;
    const data = await this.scanService.create(userId, createScanDto);
    return {
      message: 'Scan triggered successfully',
      data,
      status: 'success',
      code: HttpStatus.CREATED,
    };
  }

  @Get('project/:projectId')
  async findAllByProject(
    @Request() req: any,
    @Param('projectId') projectId: string
  ): Promise<ApiResponse<any[]>> {
    const userId = req.user._id || req.user.id;
    const data = await this.scanService.findAllByProject(userId, projectId);
    return {
      message: 'Scans retrieved successfully',
      data,
      status: 'success',
      code: HttpStatus.OK,
    };
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string): Promise<ApiResponse<any>> {
    const userId = req.user._id || req.user.id;
    const data = await this.scanService.findOne(userId, id);
    return {
      message: 'Scan details retrieved successfully',
      data,
      status: 'success',
      code: HttpStatus.OK,
    };
  }
}
