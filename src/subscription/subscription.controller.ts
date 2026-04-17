import { Controller, Get, UseGuards, Request, HttpStatus } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/interfaces/api-response.interface';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('status')
  async getStatus(@Request() req: any): Promise<ApiResponse<any>> {
    const userId = req.user._id || req.user.id;
    const data = await this.subscriptionService.getSubscription(userId);
    return {
      message: 'Subscription status retrieved successfully',
      data,
      status: 'success',
      code: HttpStatus.OK,
    };
  }
}
