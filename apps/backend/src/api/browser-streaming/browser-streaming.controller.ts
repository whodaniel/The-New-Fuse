/**
 * Browser Streaming Controller
 */

import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { BrowserStreamingService } from './browser-streaming.service';

@Controller('browser-streaming')
export class BrowserStreamingController {
  constructor(private readonly browserService: BrowserStreamingService) {}

  @Post('sessions')
  async createSession(
    @Body()
    body: {
      id: string;
      name: string;
      url: string;
      viewportWidth?: number;
      viewportHeight?: number;
    }
  ) {
    try {
      const session = await this.browserService.createSession(
        body.id,
        body.name,
        body.url,
        body.viewportWidth || 800,
        body.viewportHeight || 600
      );

      return {
        success: true,
        session: {
          id: session.id,
          name: session.name,
          url: session.url,
          status: session.status,
          lastUpdate: session.lastUpdate,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to create session',
      };
    }
  }

  @Get('sessions')
  async getAllSessions() {
    const sessions = this.browserService.getAllSessions();
    return {
      success: true,
      sessions,
    };
  }

  @Post('broadcast')
  async broadcast(@Body() body: { message: string }) {
    try {
      await this.browserService.broadcastToAll(body.message);
      return {
        success: true,
        message: 'Broadcast sent',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Delete('sessions/:id')
  async stopSession(@Param('id') id: string) {
    try {
      await this.browserService.stopSession(id);
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('health')
  async getHealth() {
    const health = this.browserService.getHealthStatus();
    return {
      success: true,
      ...health,
    };
  }
}
