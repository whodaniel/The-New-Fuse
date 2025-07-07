import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';

// Mock auth guard for compatibility - replace with actual auth guard
class MockAuthGuard {
  canActivate() {
    return true;
  }
}

@ApiTags('chat')
@Controller('chat')
@UseGuards(MockAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @ApiOperation({ summary: 'Get all chats for user' })
  async getChats(@Request() req) {
    const userId = req.user?.id || 'default-user'; // Fallback for development
    return this.chatService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get chat by ID' })
  async getChat(@Param('id') id: string, @Request() req) {
    const userId = req.user?.id || 'default-user';
    return this.chatService.findOne(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new chat' })
  async createChat(@Body() createChatDto: any, @Request() req) {
    const userId = req.user?.id || 'default-user';
    return this.chatService.create(userId, createChatDto);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Add message to chat' })
  async addMessage(
    @Param('id') chatId: string, 
    @Body() messageData: any,
    @Request() req
  ) {
    const userId = req.user?.id || 'default-user';
    return this.chatService.addMessage(chatId, userId, messageData);
  }

  @Post(':id/automate')
  @ApiOperation({ summary: 'Start automated conversation' })
  async automateConversation(
    @Param('id') chatId: string,
    @Body() automateDto: { conversationGoal?: string },
    @Request() req
  ) {
    const userId = req.user?.id || 'default-user';
    return this.chatService.automateConversation(chatId, userId, automateDto.conversationGoal);
  }

  @Post('rules')
  @ApiOperation({ summary: 'Create conversation rule' })
  async createConversationRule(@Body() ruleData: any, @Request() req) {
    const userId = req.user?.id || 'default-user';
    return this.chatService.createConversationRule(userId, ruleData);
  }

  @Get('rules/all')
  @ApiOperation({ summary: 'Get all conversation rules' })
  async getConversationRules(@Request() req) {
    const userId = req.user?.id || 'default-user';
    return this.chatService.getConversationRules(userId);
  }

  @Post('synthesis')
  @ApiOperation({ summary: 'Create synthesis job' })
  async createSynthesisJob(@Body() jobData: any, @Request() req) {
    const userId = req.user?.id || 'default-user';
    return this.chatService.createSynthesisJob(userId, jobData);
  }

  @Get('synthesis/all')
  @ApiOperation({ summary: 'Get all synthesis jobs' })
  async getSynthesisJobs(@Request() req) {
    const userId = req.user?.id || 'default-user';
    return this.chatService.getSynthesisJobs(userId);
  }

  @Post(':id/generate-response')
  @ApiOperation({ summary: 'Generate agent response' })
  async generateResponse(
    @Param('id') chatId: string,
    @Body() generateDto: { prompt: string; agentId: string },
    @Request() req
  ) {
    const userId = req.user?.id || 'default-user';
    const response = await this.chatService.generateAgentResponse(
      generateDto.prompt, 
      generateDto.agentId, 
      userId
    );
    
    return { response };
  }
}
