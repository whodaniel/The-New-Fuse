import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('history')
  async getChatHistory(
    @CurrentUser() user: any,
    @Query('page') page: number = 1
  ) {
    return this.chatService.getChatHistory(user.id, page);
  }

  @Post('message')
  async addMessage(
    @CurrentUser() user: any,
    @Body('role') role: string,
    @Body('content') content: string
  ) {
    return this.chatService.addMessage(user.id, role, content);
  }

  @Post('clear')
  async clearHistory(@CurrentUser() user: any) {
    return this.chatService.clearChatHistory(user.id);
  }
}