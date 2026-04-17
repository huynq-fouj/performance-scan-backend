import { Controller, Get, UseGuards, Request, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { UserResponseDto } from './dto/user-response.dto';

@Controller('users')
export class UsersController {
  @UseGuards(JwtAuthGuard)
  @Get('owner-info')
  async getOwnerInfo(@Request() req: any): Promise<ApiResponse<UserResponseDto>> {
    // req.user is populated by Passport after JwtStrategy.validate()
    const user = req.user;
    
    const userData = new UserResponseDto({
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
      role: user.role,
      plan: user.plan,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
    });

    return {
      message: 'User profile retrieved successfully',
      data: userData,
      status: 'success',
      code: HttpStatus.OK,
    };
  }
}
