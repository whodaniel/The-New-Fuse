import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ChatService } from './chat.service.js';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @ApiOperation({ summary: 'Get all chats' })
  async getChats() {
    return this.chatService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get chat by ID' })
  async getChat(@Param('id') id: string) {
    return this.chatService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new chat' })
  async createChat(@Body() createChatDto: any) {
    return this.chatService.create(createChatDto);
  }
}
