/**
 * Browser Streaming Controller
 *
 * REST API endpoints for managing browser sessions
 */

import { Body, Controller, Delete, Get, Logger, Param, Post } from '@nestjs/common';
import { BrowserCommand, BrowserStreamingService } from './browser-streaming.service';

@Controller('api/browser-streaming')
export class BrowserStreamingController {
  private readonly logger = new Logger(BrowserStreamingController.name);

  constructor(private readonly browserService: BrowserStreamingService) {}

  /**
   * Create a new browser session
   */
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
    this.logger.log(`Creating session: ${body.id}`);
    const session = await this.browserService.createSession(
      body.id,
      body.name,
      body.url,
      body.viewportWidth,
      body.viewportHeight
    );
    return {
      success: true,
      session: {
        id: session.id,
        name: session.name,
        url: session.url,
        status: session.status,
      },
    };
  }

  /**
   * Get all active sessions
   */
  @Get('sessions')
  getAllSessions() {
    return {
      success: true,
      sessions: this.browserService.getAllSessions(),
    };
  }

  /**
   * Get a specific session
   */
  @Get('sessions/:id')
  getSession(@Param('id') id: string) {
    const session = this.browserService.getSession(id);
    if (!session) {
      return {
        success: false,
        error: 'Session not found',
      };
    }
    return {
      success: true,
      session: {
        id: session.id,
        name: session.name,
        url: session.url,
        status: session.status,
        lastUpdate: session.lastUpdate,
        viewportWidth: session.viewportWidth,
        viewportHeight: session.viewportHeight,
      },
    };
  }

  /**
   * Execute a command on a session
   */
  @Post('sessions/:id/command')
  async executeCommand(
    @Param('id') id: string,
    @Body() command: Omit<BrowserCommand, 'sessionId'>
  ) {
    try {
      await this.browserService.executeCommand({
        sessionId: id,
        ...command,
      });
      return {
        success: true,
        message: `Command ${command.type} executed on session ${id}`,
      };
    } catch (error) {
      this.logger.error(`Command execution failed:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Master Clock: Broadcast message to all sessions
   */
  @Post('broadcast')
  async broadcast(@Body() body: { message: string }) {
    this.logger.log(`Broadcasting: "${body.message}"`);
    try {
      await this.browserService.broadcastToAll(body.message);
      return {
        success: true,
        message: `Broadcasted to all sessions`,
      };
    } catch (error) {
      this.logger.error(`Broadcast failed:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Stop a session
   */
  @Delete('sessions/:id')
  async stopSession(@Param('id') id: string) {
    await this.browserService.stopSession(id);
    return {
      success: true,
      message: `Session ${id} stopped`,
    };
  }

  /**
   * Stop all sessions
   */
  @Delete('sessions')
  async stopAllSessions() {
    await this.browserService.stopAllSessions();
    return {
      success: true,
      message: 'All sessions stopped',
    };
  }

  /**
   * Health check
   */
  @Get('health')
  getHealth() {
    return {
      success: true,
      ...this.browserService.getHealthStatus(),
    };
  }
}
