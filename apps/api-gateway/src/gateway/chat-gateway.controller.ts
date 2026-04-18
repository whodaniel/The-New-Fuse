/**
 * Chat Gateway Controller
 * Unified endpoint for chat and real-time communication
 */

import { Body, Controller, Get, Headers, HttpStatus, Param, Post, Res } from '@nestjs/common';
// @ts-ignore
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ProxyService } from '../proxy/proxy.service.js';

@Controller('chat')
@ApiTags('chat')
export class ChatGatewayController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get('sessions')
  @ApiOperation({ summary: 'Get chat sessions' })
  @ApiResponse({ status: 200, description: 'Chat sessions retrieved successfully' })
  async getChatSessions(@Headers() headers: Record<string, string>, @Res() res: Response) {
    try {
      const response = await this.proxyService.proxyRequest(
        'backend',
        '/api/chat/sessions',
        'GET',
        headers
      );
      return res.status(response.status).json(response.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'Chat service unavailable',
        error: errorMessage,
      });
    }
  }

  @Post('sessions')
  @ApiOperation({ summary: 'Create a new chat session' })
  @ApiResponse({ status: 201, description: 'Chat session created successfully' })
  async createChatSession(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'Chat service unavailable',
        error: errorMessage,
      });
    }
  }

  @Get('sessions/:id/messages')
  @ApiOperation({ summary: 'Get messages for a chat session' })
  @ApiParam({ name: 'id', description: 'Chat session ID' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  async getChatMessages(
    @Param('id') id: string,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'Chat service unavailable',
        error: errorMessage,
      });
    }
  }

  @Post('sessions/:id/messages')
  @ApiOperation({ summary: 'Send a message to a chat session' })
  @ApiParam({ name: 'id', description: 'Chat session ID' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  async sendChatMessage(
    @Param('id') id: string,
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'Chat service unavailable',
        error: errorMessage,
      });
    }
  }
}
