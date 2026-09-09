import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { hasAuthorizationLevel } from '../../auth/auth-policy';
import { AuthLevel, RequireAuthLevel } from '../../guards/secure-auth.guard';
import { LocalRuntimeService } from './local-runtime.service';

/**
 * Host-machine reads (~/.tnf goals, operator crontab, terminal heartbeat).
 * Multi-tenant hardening: this surface is operator-only (admin/system) and is
 * removed from the multi-tenant API surface entirely when
 * TNF_LOCAL_RUNTIME_API=off|0|false|disabled.
 */
@ApiTags('local-runtime')
@Controller('local-runtime')
@RequireAuthLevel(AuthLevel.ADMIN)
export class LocalRuntimeController {
  constructor(private readonly localRuntimeService: LocalRuntimeService) {}

  private assertApiEnabled(): void {
    const flag = String(process.env.TNF_LOCAL_RUNTIME_API || '')
      .trim()
      .toLowerCase();
    if (['0', 'false', 'off', 'disabled'].includes(flag)) {
      throw new NotFoundException('local-runtime surface is disabled on this deployment');
    }
  }

  @Get('goals')
  @ApiOperation({ summary: 'Local CLI goals from ~/.tnf/goals/goals.json' })
  @ApiOkResponse({ description: 'Local goals list; {available:false} when the file is absent.' })
  async getGoals() {
    this.assertApiEnabled();
    return this.localRuntimeService.getGoals();
  }

  @Get('cron')
  @ApiOperation({ summary: "Scheduled jobs from the operator's crontab" })
  @ApiOkResponse({
    description: 'Parsed crontab entries with human schedule and next fire time.',
  })
  async getCron() {
    this.assertApiEnabled();
    return this.localRuntimeService.getCron();
  }

  @Get('terminal-mirror')
  @ApiOperation({
    summary: 'Spatial snapshot of local terminal agent windows (bounds, busy state, agents)',
  })
  @ApiOkResponse({
    description: 'Terminal windows with screen bounds from the heartbeat pulse state file.',
  })
  async getTerminalMirror(
    @Query('includeContents') includeContents: string | undefined,
    @Req()
    req: Request & {
      user?: {
        id?: string;
        email?: string | null;
        role?: string | null;
        roles?: unknown;
        permissions?: unknown;
      };
    }
  ) {
    this.assertApiEnabled();
    const wantsContents = includeContents === 'true';
    if (wantsContents && !hasAuthorizationLevel(req.user || {}, 'admin')) {
      throw new ForbiddenException(
        'includeContents=true requires admin or system authorization level'
      );
    }
    return this.localRuntimeService.getTerminalMirror({ includeContents: wantsContents });
  }

  @Get('summary')
  @ApiOperation({ summary: 'One-shot Mission Control payload: goals + cron + terminal mirror' })
  @ApiOkResponse({ description: 'Combined landing payload for the Mission Control surface.' })
  async getSummary() {
    this.assertApiEnabled();
    return this.localRuntimeService.getSummary();
  }
}
