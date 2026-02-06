import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdvancedLLMProviderService } from './advanced-llm-provider.service';
import {
  ProviderDefinition,
  AuthProfile,
  ProviderConfig
} from '@the-new-fuse/types';

@ApiTags('llm-advanced')
@Controller('api/advanced-llm/providers')
export class AdvancedLLMProviderController {
  constructor(private readonly providerService: AdvancedLLMProviderService) {}

  @Get()
  @ApiOperation({ summary: 'List all LLM providers (Built-in + Custom)' })
  async listProviders(): Promise<ProviderDefinition[]> {
    return this.providerService.listProviders();
  }

  @Get('auth-profiles')
  @ApiOperation({ summary: 'Get all authentication profiles' })
  async getAuthProfiles(): Promise<AuthProfile[]> {
    return this.providerService.getAuthProfiles();
  }

  @Post('auth-profiles')
  @ApiOperation({ summary: 'Add or update an authentication profile' })
  async addAuthProfile(@Body() profile: AuthProfile): Promise<void> {
    return this.providerService.addAuthProfile(profile);
  }

  @Delete('auth-profiles/:id')
  @ApiOperation({ summary: 'Remove an authentication profile' })
  async removeAuthProfile(@Param('id') id: string): Promise<void> {
    return this.providerService.removeAuthProfile(id);
  }

  @Get('config')
  @ApiOperation({ summary: 'Get global LLM provider configuration' })
  async getConfig(): Promise<ProviderConfig> {
    return this.providerService.getConfig();
  }

  @Put('config')
  @ApiOperation({ summary: 'Save global LLM provider configuration' })
  async saveConfig(@Body() config: ProviderConfig): Promise<void> {
    return this.providerService.saveConfig(config);
  }
}
