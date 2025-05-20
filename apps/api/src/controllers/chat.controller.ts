import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ChatService } from '../services/chat.service.js';
import { CreateMessageDto } from '../dtos/message.dto.js';
import { AuthGuard } from '../guards/auth.guard.js';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('chat')
@Controller('chat')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  @ApiOperation({ summary: 'Get all chat rooms' })
  @ApiResponse({ status: 200, description: 'Return all chat rooms' })
  async getRooms() {
    return this.chatService.getRooms();
  }

  @Get('rooms/:roomId')
  @ApiOperation({ summary: 'Get chat room by id' })
  @ApiResponse({ status: 200, description: 'Return chat room by id' })
  async getRoom(@Param('roomId') roomId: string) {
    return this.chatService.getRoom(roomId);
  }

  @Get('rooms/:roomId/messages')
  @ApiOperation({ summary: 'Get messages in room' })
  @ApiResponse({ status: 200, description: 'Return messages in room' })
  async getMessages(
    @Param('roomId') roomId: string,
    @Query('limit') limit: number,
    @Query('offset') offset: number,
  ) {
    return this.chatService.getMessages(roomId, { limit, offset });
  }

  @Post('rooms/:roomId/messages')
  @ApiOperation({ summary: 'Send message to room' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  async sendMessage(
    @Param('roomId') roomId: string,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return this.chatService.sendMessage(roomId, createMessageDto);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get chat analytics' })
  @ApiResponse({ status: 200, description: 'Return chat analytics' })
  async getAnalytics() {
    return this.chatService.getAnalytics();
  }
}
