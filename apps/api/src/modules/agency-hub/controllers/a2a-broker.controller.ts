import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { A2AMessageBrokerService, A2AMessageType, A2APriority } from '../services/a2a-message-broker.service';
import { RequireAuthLevel, AuthLevel } from '../../../guards/secure-auth.guard';

@ApiTags('a2a-broker')
@Controller('a2a')
@RequireAuthLevel(AuthLevel.PUBLIC)  // Make public for testing
export class A2AMessageBrokerController {
  constructor(
    private readonly brokerService: A2AMessageBrokerService
  ) {}

  // ==================== MESSAGING ====================

  @Post('messages/send')
  @ApiOperation({ summary: 'Send a direct message to an agent' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  async sendMessage(
    @Body() body: {
      from: string;
      to: string;
      type: A2AMessageType;
      payload: any;
      priority?: A2APriority;
      correlationId?: string;
      ttl?: number;
    }
  ) {
    const messageId = await this.brokerService.sendMessage({
      type: body.type,
      from: body.from,
      to: body.to,
      payload: body.payload,
      priority: body.priority || A2APriority.MEDIUM,
      correlationId: body.correlationId,
      ttl: body.ttl
    });

    return { success: true, messageId };
  }

  @Post('messages/broadcast')
  @ApiOperation({ summary: 'Broadcast a message to all agents' })
  @ApiResponse({ status: 201, description: 'Broadcast sent successfully' })
  async broadcastMessage(
    @Body() body: {
      from: string;
      type: A2AMessageType;
      payload: any;
      priority?: A2APriority;
    }
  ) {
    const messageId = await this.brokerService.sendMessage({
      type: body.type,
      from: body.from,
      to: 'broadcast',
      payload: body.payload,
      priority: body.priority || A2APriority.MEDIUM
    });

    return { success: true, messageId };
  }

  @Get('messages/:agentId')
  @ApiOperation({ summary: 'Get pending messages for an agent' })
  @ApiResponse({ status: 200, description: 'Messages retrieved' })
  async getPendingMessages(
    @Param('agentId') agentId: string,
    @Query('limit') limit: number = 50
  ) {
    const messages = await this.brokerService.getPendingMessages(agentId, limit);
    return { agentId, count: messages.length, messages };
  }

  @Get('messages/:agentId/peek')
  @ApiOperation({ summary: 'Peek at pending messages without consuming them' })
  @ApiResponse({ status: 200, description: 'Messages peeked' })
  async peekMessages(
    @Param('agentId') agentId: string,
    @Query('limit') limit: number = 10
  ) {
    const messages = await this.brokerService.peekMessages(agentId, limit);
    return { agentId, count: messages.length, messages };
  }

  // ==================== CHANNELS ====================

  @Post('channels')
  @ApiOperation({ summary: 'Create a new communication channel' })
  @ApiResponse({ status: 201, description: 'Channel created' })
  async createChannel(
    @Body() body: { name: string; participants?: string[] }
  ) {
    const channel = await this.brokerService.createChannel(body.name, body.participants || []);
    return { success: true, channel };
  }

  @Post('channels/:channelName/join')
  @ApiOperation({ summary: 'Join a communication channel' })
  @ApiResponse({ status: 200, description: 'Joined channel' })
  async joinChannel(
    @Param('channelName') channelName: string,
    @Body() body: { agentId: string }
  ) {
    await this.brokerService.joinChannel(body.agentId, channelName);
    return { success: true, channel: channelName, agentId: body.agentId };
  }

  @Post('channels/:channelName/leave')
  @ApiOperation({ summary: 'Leave a communication channel' })
  @ApiResponse({ status: 200, description: 'Left channel' })
  async leaveChannel(
    @Param('channelName') channelName: string,
    @Body() body: { agentId: string }
  ) {
    await this.brokerService.leaveChannel(body.agentId, channelName);
    return { success: true, channel: channelName, agentId: body.agentId };
  }

  @Post('channels/:channelName/send')
  @ApiOperation({ summary: 'Send a message to a channel' })
  @ApiResponse({ status: 201, description: 'Message sent to channel' })
  async sendToChannel(
    @Param('channelName') channelName: string,
    @Body() body: {
      from: string;
      type: A2AMessageType;
      payload: any;
      priority?: A2APriority;
    }
  ) {
    const messageId = await this.brokerService.sendToChannel(channelName, {
      type: body.type,
      from: body.from,
      payload: body.payload,
      priority: body.priority || A2APriority.MEDIUM
    });

    return { success: true, messageId, channel: channelName };
  }

  // ==================== CONVERSATIONS ====================

  @Post('conversations')
  @ApiOperation({ summary: 'Start a new conversation between agents' })
  @ApiResponse({ status: 201, description: 'Conversation started' })
  async startConversation(
    @Body() body: {
      initiatorId: string;
      participantIds: string[];
      topic?: string;
    }
  ) {
    const conversationId = await this.brokerService.startConversation(
      body.initiatorId,
      body.participantIds,
      body.topic
    );

    return { success: true, conversationId };
  }

  @Post('conversations/:conversationId/message')
  @ApiOperation({ summary: 'Send a message in a conversation' })
  @ApiResponse({ status: 201, description: 'Conversation message sent' })
  async sendConversationMessage(
    @Param('conversationId') conversationId: string,
    @Body() body: { fromAgent: string; content: any }
  ) {
    const messageId = await this.brokerService.sendConversationMessage(
      conversationId,
      body.fromAgent,
      body.content
    );

    return { success: true, messageId, conversationId };
  }

  // ==================== PRESENCE ====================

  @Post('presence/online')
  @ApiOperation({ summary: 'Register agent as online' })
  @ApiResponse({ status: 200, description: 'Agent registered as online' })
  async registerOnline(@Body() body: { agentId: string }) {
    await this.brokerService.registerPresence(body.agentId);
    return { success: true, agentId: body.agentId, status: 'online' };
  }

  @Post('presence/offline')
  @ApiOperation({ summary: 'Register agent as offline' })
  @ApiResponse({ status: 200, description: 'Agent registered as offline' })
  async registerOffline(@Body() body: { agentId: string }) {
    await this.brokerService.unregisterPresence(body.agentId);
    return { success: true, agentId: body.agentId, status: 'offline' };
  }

  @Get('presence/online')
  @ApiOperation({ summary: 'Get list of online agents' })
  @ApiResponse({ status: 200, description: 'Online agents retrieved' })
  async getOnlineAgents() {
    const agents = this.brokerService.getOnlineAgents();
    return { count: agents.length, agents };
  }

  // ==================== STATUS & METRICS ====================

  @Get('status')
  @ApiOperation({ summary: 'Get broker status' })
  @ApiResponse({ status: 200, description: 'Broker status retrieved' })
  async getStatus() {
    return this.brokerService.getStatus();
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get broker metrics' })
  @ApiResponse({ status: 200, description: 'Broker metrics retrieved' })
  async getMetrics() {
    return this.brokerService.getMetrics();
  }
}
