import {
  Body,
  Controller,
  Post,
  Req,
  Put,
  Get,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ProfileDto } from './dtos/profile.dto';
import { ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('createProfile')
  @ApiResponse({ status: 201, description: 'Profile created successfully' })
  async createProfile(@Body() profileDto: ProfileDto, @Req() req) {
    return this.userService.createProfile(req.userId, profileDto);
  }

  @Put('updateProfile')
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(@Body() profileDto: ProfileDto, @Req() req) {
    return this.userService.updateProfile(req.userId, profileDto);
  }

  @Get('getProfile')
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@Req() req) {
    return this.userService.getProfile(req.userId);
  }
}
