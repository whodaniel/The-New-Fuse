/**
 * Chat Gateway Controller
 * Unified endpoint for chat and real-time communication
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Headers,
  Res,
  HttpStatus,
  Version,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { ProxyService } from '../proxy/proxy.service';

@Controller('chat')
@ApiTags('chat')
export class ChatGatewayController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get('sessions')
  @Version('1')
  @ApiOperation({ summary: 'Get chat sessions' })
  @ApiResponse({ status: 200, description: 'Chat sessions retrieved successfully' })
  async getChatSessions(
    @Headers() headers: Record<string, string>,
    @Res() res: Response,
  ) {
    try {
      const response = await this.proxyService.proxyRequest(
        'backend',
        '/api/chat/sessions',
        'GET',
        headers
      );
      return res.status(response.status).json(response.data);
    } catch (error) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'Chat service unavailable',
        error: error.message,
      });
    }
  }

  @Post('sessions')
  @Version('1')
  @ApiOperation({ summary: 'Create a new chat session' })
  @ApiResponse({ status: 201, description: 'Chat session created successfully' })
  async createChatSession(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response,
  ) {
    try {
      const response = await this.proxyService.proxyRequest(
        'backend',
        '/api/chat/sessions',
        'POST',
        headers,
        body
      );
      return res.status(response.status).json(response.data);
    } catch (error) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'Chat service unavailable',
        error: error.message,
      });
    }
  }

  @Get('sessions/:id/messages')
  @Version('1')
  @ApiOperation({ summary: 'Get messages for a chat session' })
  @ApiParam({ name: 'id', description: 'Chat session ID' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  async getChatMessages(
    @Param('id') id: string,
    @Headers() headers: Record<string, string>,
    @Res() res: Response,
  ) {
    try {
      const response = await this.proxyService.proxyRequest(
        'backend',
        `/api/chat/sessions/${id}/messages`,
        'GET',
        headers
      );
      return res.status(response.status).json(response.data);
    } catch (error) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'Chat service unavailable',
        error: error.message,
      });
    }
  }

  @Post('sessions/:id/messages')
  @Version('1')
  @ApiOperation({ summary: 'Send a message to a chat session' })
  @ApiParam({ name: 'id', description: 'Chat session ID' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  async sendChatMessage(
    @Param('id') id: string,
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response,
  ) {
    try {
      const response = await this.proxyService.proxyRequest(
        'backend',
        `/api/chat/sessions/${id}/messages`,
        'POST',
        headers,
        body
      );
      return res.status(response.status).json(response.data);
    } catch (error) {
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'Chat service unavailable',
        error: error.message,
      });
    }
  }
}