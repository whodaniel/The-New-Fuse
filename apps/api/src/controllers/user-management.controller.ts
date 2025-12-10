import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '@the-new-fuse/database';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('user-management')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserManagementController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of all users' })
  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() userData: any) {
    return this.prisma.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async updateUser(@Param('id') id: string, @Body() userData: any) {
    return this.prisma.user.update({
      where: { id },
      data: userData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true,
      },
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async deleteUser(@Param('id') id: string) {
    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted successfully' };
  }

  @Get(':id/profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'User profile details' })
  async getUserProfile(@Param('id') id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        // Add relations as needed
      },
    });
  }

  @Put(':id/profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateUserProfile(@Param('id') id: string, @Body() profileData: any) {
    return this.prisma.user.update({
      where: { id },
      data: profileData,
    });
  }
}
