import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { UserBotsService } from './user-bots.service.js';

@ApiTags('User Bots')
@ApiBearerAuth()
@Controller('api/user-bots')
@UseGuards(JwtAuthGuard)
export class UserBotsController {
  constructor(private readonly service: UserBotsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all user poker bots' })
  async getBots(@CurrentUser() user: any) {
    return { ok: true, data: await this.service.getBots(user.id) };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new poker bot' })
  async createBot(@CurrentUser() user: any, @Body() data: any) {
    return { ok: true, data: await this.service.createBot(user.id, data) };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing poker bot' })
  async updateBot(@CurrentUser() user: any, @Param('id') id: string, @Body() data: any) {
    return { ok: true, data: await this.service.updateBot(user.id, id, data) };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a poker bot' })
  async deleteBot(@CurrentUser() user: any, @Param('id') id: string) {
    await this.service.deleteBot(user.id, id);
    return { ok: true };
  }
}
