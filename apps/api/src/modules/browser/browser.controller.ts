import { Body, Controller, Get, Post } from '@nestjs/common';
import { AdminOnly, JwtAuth } from '../../guards/secure-auth.guard';
import { BrowserInteractDto, BrowserService } from './browser.service';

@Controller('browser')
export class BrowserController {
  constructor(private readonly browser: BrowserService) {}

  @Get('status')
  @JwtAuth()
  async status() {
    const available = await this.browser.available();
    return {
      success: true,
      data: {
        ...this.browser.getSession(false),
        available,
        engine: 'agent-browser',
        canonicalEntry: 'tnf computer-use (desktop) · /computer-use (web) · POST /api/browser/task',
      },
    };
  }

  @Get('preview')
  @JwtAuth()
  async preview() {
    const result = await this.browser.interact({ operation: 'screenshot' });
    return {
      success: result.code === 0,
      data: {
        ...this.browser.getSession(true),
        screenshotDataUrl: (result as { dataUrl?: string }).dataUrl ?? null,
      },
    };
  }

  @Post('interact')
  @JwtAuth()
  async interact(@Body() body: BrowserInteractDto) {
    const result = await this.browser.interact(body);
    return { success: result.code === 0, data: result };
  }

  @Post('task')
  @JwtAuth()
  async task(@Body() body: { message: string }) {
    const data = await this.browser.runNaturalLanguageTask(body.message || '');
    return { success: data.ok, data };
  }

  @Post('start')
  @AdminOnly()
  async start(@Body() body: { headed?: boolean } = {}) {
    const result = await this.browser.ensureStarted(body.headed !== false);
    return { success: result.code === 0, data: result };
  }
}
