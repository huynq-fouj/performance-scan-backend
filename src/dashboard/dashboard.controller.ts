import { Controller, Get, UseGuards, Request, HttpStatus } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { DashboardSummaryDto } from './dto/dashboard-response.dto';

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
}
