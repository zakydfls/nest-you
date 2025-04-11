import {
  Body,
  Controller,
  Post,
  Req,
  Put,
  Get,
  UseGuards,
  Delete,
  Param,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ProfileDto } from './dtos/profile.dto';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('createProfile')
  @ApiBearerAuth('JWT')
  @ApiResponse({ status: 201, description: 'Profile created successfully' })
  async createProfile(@Body() profileDto: ProfileDto, @Req() req) {
    return this.userService.createProfile(req.userId, profileDto);
  }

  @Put('updateProfile')
  @ApiBearerAuth('JWT')
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(@Body() profileDto: ProfileDto, @Req() req) {
    return this.userService.updateProfile(req.userId, profileDto);
  }
  @Get('getProfile')
  @ApiBearerAuth('JWT')
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@Req() req) {
    return this.userService.getProfile(req.userId);
  }

  @Delete('deleteUser/:id')
  @ApiBearerAuth('JWT')
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }

  @Get('getUser/:id')
  @ApiBearerAuth('JWT')
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  async getUser(@Param('id') id: string) {
    return this.userService.oneById(id);
  }
}
