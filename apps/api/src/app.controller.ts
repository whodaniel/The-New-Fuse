import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { User } from '../decorators/user.decorator.js';

@ApiTags('app')
@Controller()
export class AppController {
  constructor() {}

  @Get()
  @ApiOperation({ summary: 'Get API status' })
  @ApiResponse({ status: 200, description: 'API is running' })
  getStatus() {
    return {
      message: 'The New Fuse API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'API health status' })
  getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  }
}
