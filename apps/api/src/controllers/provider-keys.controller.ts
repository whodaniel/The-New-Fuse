import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../decorators/current-user.decorator';
import { SaveProviderKeyDto } from '../dto/provider-keys.dto';
import {
  JwtAuth,
  RateLimitTier,
  SecureAuthGuard,
  SetRateLimitTier,
} from '../guards/secure-auth.guard';
import { ProviderKeyListItem, ProviderKeysService } from '../services/provider-keys.service';

@ApiTags('provider-keys')
@Controller('provider-keys')
@UseGuards(SecureAuthGuard)
@JwtAuth()
@SetRateLimitTier(RateLimitTier.API)
export class ProviderKeysController {
  constructor(private readonly providerKeysService: ProviderKeysService) {}

  @Get()
  @ApiOperation({ summary: 'List current user provider API key metadata' })
  @ApiResponse({ status: 200, description: 'Provider key metadata list' })
  async list(@CurrentUser() user: { id: string }): Promise<ProviderKeyListItem[]> {
    return this.providerKeysService.listForUser(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create or update provider API key for current user' })
  @ApiResponse({ status: 201, description: 'Provider key metadata' })
  async save(
    @CurrentUser() user: { id: string },
    @Body() dto: SaveProviderKeyDto
  ): Promise<ProviderKeyListItem> {
    return this.providerKeysService.saveForUser(user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete provider API key for current user' })
  @ApiResponse({ status: 200, description: 'Provider key deleted' })
  async remove(
    @CurrentUser() user: { id: string },
    @Param('id') id: string
  ): Promise<{ success: true }> {
    await this.providerKeysService.deleteForUser(user.id, id);
    return { success: true };
  }
}
