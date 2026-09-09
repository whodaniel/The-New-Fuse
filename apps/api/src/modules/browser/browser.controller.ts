import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminOnly, JwtAuth } from '../../guards/secure-auth.guard';
import { BrowserInteractDto, BrowserService } from './browser.service';

type AuthedRequest = Request & {
  user?: {
    id?: string;
    sub?: string;
    userId?: string;
    email?: string | null;
    role?: string | null;
    roles?: unknown;
    permissions?: unknown;
  };
};

@Controller('browser')
export class BrowserController {
  constructor(private readonly browser: BrowserService) {}

  /**
   * Multi-tenant hardening: browser sessions are keyed by the authenticated
   * userId from the JWT — never by request-supplied identity.
   */
  private requireUserId(req: AuthedRequest): string {
    const userId = [req.user?.id, req.user?.sub, req.user?.userId]
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim())
      .find((value) => value.length > 0);
    if (!userId) {
      throw new UnauthorizedException('Missing authenticated user');
    }
    return userId;
  }

  @Get('status')
  @JwtAuth()
  async status(@Req() req: AuthedRequest) {
    const userId = this.requireUserId(req);
    const available = await this.browser.available(userId);
    return {
      success: true,
      data: {
        ...this.browser.getSession(userId, false),
        available,
        engine: 'agent-browser',
        canonicalEntry: 'tnf computer-use (desktop) · /computer-use (web) · POST /api/browser/task',
      },
    };
  }

  @Get('preview')
  @JwtAuth()
  async preview(@Req() req: AuthedRequest) {
    const userId = this.requireUserId(req);
    const result = await this.browser.interact(userId, { operation: 'screenshot' });
    return {
      success: result.code === 0,
      data: {
        ...this.browser.getSession(userId, true),
        screenshotDataUrl: (result as { dataUrl?: string }).dataUrl ?? null,
      },
    };
  }

  @Post('interact')
  @JwtAuth()
  async interact(@Req() req: AuthedRequest, @Body() body: BrowserInteractDto) {
    const userId = this.requireUserId(req);
    const result = await this.browser.interact(userId, body);
    return { success: result.code === 0, data: result };
  }

  @Post('task')
  @JwtAuth()
  async task(@Req() req: AuthedRequest, @Body() body: { message: string }) {
    const userId = this.requireUserId(req);
    const data = await this.browser.runNaturalLanguageTask(userId, body.message || '');
    return { success: data.ok, data };
  }

  @Post('start')
  @AdminOnly()
  async start(@Req() req: AuthedRequest, @Body() body: { headed?: boolean } = {}) {
    const userId = this.requireUserId(req);
    const result = await this.browser.ensureStarted(userId, body.headed !== false);
    return { success: result.code === 0, data: result };
  }
}
