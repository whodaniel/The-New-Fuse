import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  Req,
  ForbiddenException
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto.js';
import { UpdateProfileDto, ProfileResponseDto } from './dto/profile.dto.js';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create new user' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all users with pagination' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50
  ) {
    return this.usersService.findAll(Number(page), Number(limit));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request
  ) {
    // 🛡️ Sentinel: IDOR Protection
    // Ensure user can only update their own account
    const user = req.user as any;
    if (user.id !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }

    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user' })
  async delete(@Param('id') id: string) {
    await this.usersService.delete(id);
  }

  // User Profile Management Endpoints
  @Get(':id/profile')
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Retrieve detailed user profile information'
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: ProfileResponseDto
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getProfile(@Param('id') id: string): Promise<ProfileResponseDto> {
    return this.usersService.getProfile(id);
  }

  @Put(':id/profile')
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Update user profile information including bio, avatar, and preferences'
  })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    type: ProfileResponseDto
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateProfile(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileDto,
    @Req() req: Request
  ): Promise<ProfileResponseDto> {
    // 🛡️ Sentinel: IDOR Protection
    // Ensure user can only update their own profile
    const user = req.user as any;
    if (user.id !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }

    return this.usersService.updateProfile(id, updateProfileDto);
  }
}
