import {
  Body,
  Controller,
  Delete,
  Get,
  Put,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { PersonalIntelligenceService } from './personal-intelligence.service';
import type { UnifiedPersonalIntelPayload } from './personal-intelligence.types';

type AuthUser = { id?: string; sub?: string };

@ApiTags('personal-intelligence')
@Controller('personal-intelligence')
@UseGuards(JwtAuthGuard)
export class PersonalIntelligenceController {
  constructor(private readonly personalIntelligence: PersonalIntelligenceService) {}

  private requireUserId(user: AuthUser | undefined): string {
    const userId = user?.id || user?.sub;
    if (!userId) throw new UnauthorizedException('Missing authenticated user');
    return userId;
  }

  @Get()
  @ApiOperation({
    summary: 'Get owner-scoped Personal Intelligence unified index (auth required)',
  })
  getIndex(@CurrentUser() user: AuthUser) {
    return this.personalIntelligence.getIndex(this.requireUserId(user));
  }

  @Put()
  @ApiOperation({
    summary: 'Replace owner-scoped Personal Intelligence unified index (auth required)',
  })
  putIndex(@CurrentUser() user: AuthUser, @Body() body: Partial<UnifiedPersonalIntelPayload>) {
    return this.personalIntelligence.upsertIndex(this.requireUserId(user), body || {});
  }

  @Delete()
  @ApiOperation({ summary: 'Clear owner-scoped Personal Intelligence index' })
  clearIndex(@CurrentUser() user: AuthUser) {
    return this.personalIntelligence.clearIndex(this.requireUserId(user));
  }
}
