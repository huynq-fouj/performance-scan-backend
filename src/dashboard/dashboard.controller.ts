import { Controller, Get, UseGuards, Request, HttpStatus } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { DashboardSummaryDto, ExecutiveReportDto } from './dto/dashboard-response.dto';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary(@Request() req: any): Promise<ApiResponse<DashboardSummaryDto>> {
    const userId = req.user._id || req.user.id;
    const data = await this.dashboardService.getSummary(userId);
    return {
      message: 'Dashboard summary retrieved successfully',
      data,
      status: 'success',
      code: HttpStatus.OK,
    };
  }

  @Get('analytics')
  async getAnalytics(@Request() req: any): Promise<ApiResponse<ExecutiveReportDto>> {
    const userId = req.user._id || req.user.id;
    // Extract query params for filters
    const device = req.query.device as string;
    const daysStr = req.query.days as string;
    let days: number | undefined;
    if (daysStr && !isNaN(parseInt(daysStr))) {
      days = parseInt(daysStr);
    }

    const data = await this.dashboardService.getExecutiveReport(userId, { device, days });
    return {
      message: 'Executive analytics retrieved successfully',
      data,
      status: 'success',
      code: HttpStatus.OK,
    };
  }
}
