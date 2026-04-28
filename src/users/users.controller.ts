import { Controller, Get, Patch, Body, UseGuards, Request, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}
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

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Request() req: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ApiResponse<UserResponseDto>> {
    const userId = req.user._id.toString();
    const updatedUser = await this.usersService.updateProfile(userId, updateProfileDto);
    
    const userData = new UserResponseDto({
      id: updatedUser!._id.toString(),
      email: updatedUser!.email,
      fullName: updatedUser!.fullName,
      avatar: updatedUser!.avatar,
      role: updatedUser!.role,
      plan: updatedUser!.plan,
      isActive: updatedUser!.isActive,
      lastLoginAt: updatedUser!.lastLoginAt,
    });

    return {
      message: 'Profile updated successfully',
      data: userData,
      status: 'success',
      code: HttpStatus.OK,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('password')
  async changePassword(
    @Request() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<ApiResponse<null>> {
    const userId = req.user._id.toString();
    await this.usersService.changePassword(
      userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );

    return {
      message: 'Password changed successfully',
      data: null,
      status: 'success',
      code: HttpStatus.OK,
    };
  }
}
