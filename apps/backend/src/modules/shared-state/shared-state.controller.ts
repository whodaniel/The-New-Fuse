import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { SharedStateService } from './shared-state.service.js';
import { Receipt } from './shared-state.types.js';

@ApiTags('Shared State')
@Controller('shared-state')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SharedStateController {
  constructor(private readonly sharedStateService: SharedStateService) {}

  @Get('health')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Check health of Cloudflare SharedState worker' })
  async checkHealth() {
    return this.sharedStateService.checkHealth();
  }

  @Post('deposit')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Deposit a receipt to SharedState' })
  async deposit(@Body() receipt: Partial<Receipt>) {
    return this.sharedStateService.deposit(receipt);
  }

  @Get('context/:runtime')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get latest context for a runtime' })
  async getContext(@Param('runtime') runtime: string) {
    return this.sharedStateService.getContext(runtime);
  }
}
