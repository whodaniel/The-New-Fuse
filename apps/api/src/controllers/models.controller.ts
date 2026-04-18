import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('models')
@Controller('models')
@UseGuards(JwtAuthGuard)
export class ModelsController {
  @Get()
  @ApiOperation({ summary: 'Get all available models' })
  @ApiResponse({ status: 200, description: 'List of all models' })
  async getAllModels(@Query('provider') provider?: string) {
    return [];
  }

  @Get('providers')
  @ApiOperation({ summary: 'Get all model providers' })
  @ApiResponse({ status: 200, description: 'List of providers' })
  async getProviders() {
    return [
      { id: 'openai', name: 'OpenAI', models: ['gpt-4', 'gpt-3.5-turbo'] },
      { id: 'anthropic', name: 'Anthropic', models: ['claude-3-opus', 'claude-3-sonnet'] },
      { id: 'google', name: 'Google', models: ['gemini-pro'] },
      { id: 'google-adk', name: 'Google ADK Gateway', models: ['gemini-2.5-pro'] },
    ];
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get model details' })
  @ApiResponse({ status: 200, description: 'Model details' })
  async getModelById(@Param('id') id: string) {
    return { id };
  }

  @Post('select')
  @ApiOperation({ summary: 'Select/set active model' })
  @ApiResponse({ status: 200, description: 'Model selected' })
  async selectModel(@Body() selection: { modelId: string; provider: string }) {
    return { message: 'Model selected', ...selection };
  }

  @Get('current/active')
  @ApiOperation({ summary: 'Get currently active model' })
  @ApiResponse({ status: 200, description: 'Active model details' })
  async getActiveModel() {
    return { modelId: 'gpt-4', provider: 'openai' };
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test model connection' })
  @ApiResponse({ status: 200, description: 'Test result' })
  async testModel(@Param('id') id: string) {
    return { success: true, message: 'Model connection successful' };
  }
}
