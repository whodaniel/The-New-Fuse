import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
// @ts-ignore
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MessageRole } from '@the-new-fuse/database';
import { AuthLevel, RequireAuthLevel, SecureAuthGuard } from '../../guards/secure-auth.guard';
import { ChatService } from './chat.service';

@ApiTags('chat')
@Controller('chat')
@UseGuards(SecureAuthGuard)
@RequireAuthLevel(AuthLevel.USER)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  private requireUserId(req: any): string {
    const userId = req?.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user context is required');
    }
    return userId;
  }

  @Get()
  @ApiOperation({ summary: 'Get all chats for user' })
  async getChats(@Request() req: any) {
    const userId = this.requireUserId(req);
    return this.chatService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get chat by ID' })
  async getChat(@Param('id') id: string, @Request() req: any) {
    const userId = this.requireUserId(req);
    return this.chatService.findOne(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new chat with an agent' })
  async createChat(
    @Body() createChatDto: { agentId: string; title?: string },
    @Request() req: any
  ) {
    const userId = this.requireUserId(req);
    return this.chatService.create(userId, createChatDto.agentId, createChatDto.title);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a chat' })
  async deleteChat(@Param('id') id: string, @Request() req: any) {
    const userId = this.requireUserId(req);
    return this.chatService.delete(id, userId);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages for a chat with pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  async getMessages(
    @Param('id') chatId: string,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string
  ) {
    return this.chatService.getMessages(chatId, {
      limit: limit ? Number(limit) : undefined,
      cursor,
    });
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Add message to chat' })
  async addMessage(
    @Param('id') chatId: string,
    @Body()
    messageData: {
      content: string;
      role?: 'USER' | 'AGENT' | 'SYSTEM';
      agentId?: string;
      metadata?: Record<string, unknown>;
    },
    @Request() req: any
  ) {
    const userId = this.requireUserId(req);
    return this.chatService.addMessage(
      chatId,
      messageData.content,
      (messageData.role as MessageRole) || ('USER' as MessageRole),
      {
        senderId: userId,
        agentId: messageData.agentId,
        metadata: messageData.metadata,
      }
    );
  }

  @Post(':id/generate-response')
  @ApiOperation({ summary: 'Generate agent response for a prompt' })
  async generateResponse(
    @Param('id') chatId: string,
    @Body() generateDto: { prompt: string; agentId: string },
    @Request() req: any
  ) {
    const userId = this.requireUserId(req);
    const response = await this.chatService.generateAgentResponse(
      generateDto.prompt,
      generateDto.agentId,
      userId
    );

    return { response, chatId };
  }

  // ============================================================================
  // TODO: Future Endpoints - Requires Schema Updates
  // ============================================================================
  //
  // The following endpoints are planned but require Drizzle schema updates:
  //
  // POST /chat/:id/automate - Start automated conversation between agents
  // POST /chat/rules - Create conversation routing rules
  // GET /chat/rules/all - Get all conversation rules
  // POST /chat/synthesis - Create AI synthesis/summary job
  // GET /chat/synthesis/all - Get all synthesis jobs
  //
  // See ChatService for schema requirements.
  // ============================================================================
}
