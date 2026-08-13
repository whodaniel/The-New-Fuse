import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
// @ts-ignore
// @ts-ignore
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DatabaseService } from '@the-new-fuse/database';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('user-management')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserManagementController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of all users' })
  async getAllUsers() {
    const users = await this.db.users.findAll();
    return users.map((user: any) => this.sanitizeUser(user));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string) {
    const user = await this.db.users.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return this.sanitizeUser(user);
  }

  @Post()
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() userData: any) {
    const user = await this.db.users.create(userData);
    return this.sanitizeUser(user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async updateUser(@Param('id') id: string, @Body() userData: any) {
    const user = await this.db.users.update(id, userData);
    if (!user) throw new NotFoundException('User not found');
    return this.sanitizeUser(user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async deleteUser(@Param('id') id: string) {
    const deleted = await this.db.users.delete(id); // Soft delete by default
    if (!deleted) throw new NotFoundException('User not found');
    return { message: 'User deleted successfully' };
  }

  @Get(':id/profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'User profile details' })
  async getUserProfile(@Param('id') id: string) {
    const user = await this.db.users.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return this.sanitizeUser(user);
  }

  @Put(':id/profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateUserProfile(@Param('id') id: string, @Body() profileData: any) {
    const user = await this.db.users.update(id, profileData);
    if (!user) throw new NotFoundException('User not found');
    return this.sanitizeUser(user);
  }

  private sanitizeUser(user: any) {
    const { hashedPassword, refreshToken, ...rest } = user;
    return rest;
  }
}
