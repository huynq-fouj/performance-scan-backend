import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { AuthData } from './interfaces/auth-data.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<ApiResponse<AuthData>> {
    const data = await this.authService.register(registerDto);
    return {
      message: 'User registered successfully',
      data,
      status: 'success',
      code: HttpStatus.CREATED,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<ApiResponse<AuthData>> {
    const data = await this.authService.login(loginDto);
    return {
      message: 'Login successful',
      data,
      status: 'success',
      code: HttpStatus.OK,
    };
  }
}

