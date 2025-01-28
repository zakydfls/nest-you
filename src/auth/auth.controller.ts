import { Body, Controller, Post } from '@nestjs/common';
import { RegisterUserDto } from './dtos/requests/register.dto';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dtos/requests/login.dto';
import { RefreshDto } from './dtos/requests/refresh.dto';
import { ApiResponse } from 'src/common/decorators/api-response/api-response.decorator';
import { ApiOperation } from '@nestjs/swagger';
import { LoginResponseDto } from './dtos/responses/login-response.dto';
import { RegisterResponseDto } from './dtos/responses/register-response.dto';
import { RefreshResponseDto } from './dtos/responses/refresh-response.dto';

@Controller('')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse(201, 'User registered successfully', RegisterResponseDto)
  async register(@Body() registerDto: RegisterUserDto) {
    return this.authService.register(registerDto);
  }
  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse(200, 'User logged in successfully', LoginResponseDto)
  async login(@Body() loginDto: LoginUserDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh token' })
  @ApiResponse(200, 'Token refreshed successfully', RefreshResponseDto)
  async refresh(@Body() refreshDto: RefreshDto) {
    return this.authService.refreshToken(refreshDto);
  }
}
