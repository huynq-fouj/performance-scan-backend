import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, HttpStatus, Query } from '@nestjs/common';
import { ScanService } from './scan.service';
import { CreateScanDto } from './dto/create-scan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { ScanResponseDto } from './dto/scan-response.dto';
import { ScanCompareResponseDto } from './dto/compare-response.dto';

@Controller('scans')
@UseGuards(JwtAuthGuard)
export class ScanController {
  constructor(private readonly scanService: ScanService) {}

  @Post()
  async create(@Request() req: any, @Body() createScanDto: CreateScanDto): Promise<ApiResponse<ScanResponseDto>> {
    const userId = req.user._id || req.user.id;
    const data = await this.scanService.create(userId, createScanDto);
    return {
      message: 'Scan triggered successfully',
      data,
      status: 'success',
      code: HttpStatus.CREATED,
    };
  }

  @Get('all')
  async findAll(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('projectId') projectId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ApiResponse<ScanResponseDto[]>> {
    const userId = req.user._id || req.user.id;
    const { data, total } = await this.scanService.findAll(userId, {
      status,
      projectId,
      page,
      limit,
      startDate,
      endDate,
    });
    return {
      message: 'All scans retrieved successfully',
      data,
      count: total,
      status: 'success',
      code: HttpStatus.OK,
    };
  }

  @Get('project/:projectId')
  async findAllByProject(
    @Request() req: any,
    @Param('projectId') projectId: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ApiResponse<ScanResponseDto[]>> {
    const userId = req.user._id || req.user.id;
    const { data, total } = await this.scanService.findAllByProject(userId, projectId, {
      status,
      page,
      limit,
      startDate,
      endDate,
    });
    return {
      message: 'Scans retrieved successfully',
      data,
      count: total,
      status: 'success',
      code: HttpStatus.OK,
    };
  }

  @Get('compare/:scanAId/:scanBId')
  async compareScans(
    @Request() req: any, 
    @Param('scanAId') scanAId: string,
    @Param('scanBId') scanBId: string
  ): Promise<ApiResponse<ScanCompareResponseDto>> {
    const userId = req.user._id || req.user.id;
    const data = await this.scanService.compareScans(userId, scanAId, scanBId);
    return {
      message: 'Scans compared successfully',
      data,
      status: 'success',
      code: HttpStatus.OK,
    };
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string): Promise<ApiResponse<ScanResponseDto>> {
    const userId = req.user._id || req.user.id;
    const data = await this.scanService.findOne(userId, id);
    return {
      message: 'Scan details retrieved successfully',
      data,
      status: 'success',
      code: HttpStatus.OK,
    };
  }

  @Patch(':id/cancel')
  async cancel(@Request() req: any, @Param('id') id: string): Promise<ApiResponse<ScanResponseDto>> {
    const userId = req.user._id || req.user.id;
    const data = await this.scanService.cancel(userId, id);
    return {
      message: 'Scan cancelled successfully',
      data,
      status: 'success',
      code: HttpStatus.OK,
    };
  }

  @Post(':id/delete') // Using Post for delete to avoid some browser restrictions if any, or just @Delete
  async remove(@Request() req: any, @Param('id') id: string): Promise<ApiResponse<void>> {
    const userId = req.user._id || req.user.id;
    await this.scanService.remove(userId, id);
    return {
      message: 'Scan deleted successfully',
      status: 'success',
      code: HttpStatus.OK,
    };
  }

  @Post('project/:projectId/import')
  async import(
    @Request() req: any,
    @Param('projectId') projectId: string,
    @Body() lhr: any,
  ): Promise<ApiResponse<ScanResponseDto>> {
    const userId = req.user._id || req.user.id;
    const data = await this.scanService.importScan(userId, projectId, lhr);
    return {
      message: 'Lighthouse report imported successfully',
      data,
      status: 'success',
      code: HttpStatus.CREATED,
    };
  }

  // Alternative standard Delete
  // @Delete(':id')
  // ...
}
