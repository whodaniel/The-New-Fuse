import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger
} from '@nestjs/common';
import { A2AService } from './a2a.service.js';
import {
  AgentRegistration,
  A2AMessage,
  AgentHeartbeat,
  AgentStatus,
  A2AMessageType,
  A2APriority
} from './types.js';

@Controller('a2a')
export class A2AController {
  private readonly logger = new Logger(A2AController.name);

  constructor(private readonly a2aService: A2AService) {}

  // Agent Management
  @Post('agents/register')
  @HttpCode(HttpStatus.CREATED)
  async registerAgent(@Body() registration: AgentRegistration) {
    this.logger.log(`Registering agent: ${registration.agentId}`);
    await this.a2aService.registerAgent(registration);
    return { success: true, message: 'Agent registered successfully' };
  }

  @Delete('agents/:agentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unregisterAgent(@Param('agentId') agentId: string) {
    this.logger.log(`Unregistering agent: ${agentId}`);
    await this.a2aService.unregisterAgent(agentId);
  }

  @Put('agents/:agentId/status')
  async updateAgentStatus(
    @Param('agentId') agentId: string,
    @Body() body: { status: AgentStatus }
  ) {
    await this.a2aService.updateAgentStatus(agentId, body.status);
    return { success: true, message: 'Agent status updated' };
  }

  @Get('agents')
  async discoverAgents(
    @Query('type') type?: string,
    @Query('capabilities') capabilities?: string,
    @Query('status') status?: AgentStatus
  ) {
    const criteria: any = {};
    
    if (type) criteria.type = type;
    if (status) criteria.status = status;
    if (capabilities) {
      criteria.capabilities = capabilities.split(',').map(c => c.trim());
    }

    const agents = await this.a2aService.discoverAgents(criteria);
    return { agents, count: agents.length };
  }

  @Get('agents/online')
  async getOnlineAgents() {
    const agents = await this.a2aService.getOnlineAgents();
    return { agents, count: agents.length };
  }

  @Get('agents/:agentId/health')
  async getAgentHealth(@Param('agentId') agentId: string) {
    const health = await this.a2aService.getAgentHealth(agentId);
    if (!health) {
      return { status: 'unknown', message: 'No health data available' };
    }
    return health;
  }

  // Messaging
  @Post('messages/send')
  async sendMessage(@Body() message: A2AMessage) {
    await this.a2aService.sendMessage(message);
    return { success: true, messageId: message.id };
  }

  @Post('messages/request')
  async sendRequest(@Body() body: {
    fromAgent: string;
    toAgent: string;
    payload: any;
    timeout?: number;
    priority?: A2APriority;
    conversationId?: string;
  }) {
    const response = await this.a2aService.sendRequest(
      body.fromAgent,
      body.toAgent,
      body.payload,
      {
        timeout: body.timeout,
        priority: body.priority,
        conversationId: body.conversationId
      }
    );
    return { response };
  }

  @Post('messages/broadcast')
  async broadcast(@Body() body: {
    fromAgent: string;
    payload: any;
    channel?: string;
    topic?: string;
    priority?: A2APriority;
  }) {
    await this.a2aService.broadcast(body.fromAgent, body.payload, {
      channel: body.channel,
      topic: body.topic,
      priority: body.priority
    });
    return { success: true, message: 'Broadcast sent' };
  }

  @Post('messages/response')
  async sendResponse(@Body() body: {
    originalMessage: A2AMessage;
    responsePayload: any;
    fromAgent: string;
  }) {
    await this.a2aService.sendResponse(
      body.originalMessage,
      body.responsePayload,
      body.fromAgent
    );
    return { success: true, message: 'Response sent' };
  }

  // Conversations
  @Post('conversations')
  async startConversation(@Body() body: {
    initiator: string;
    participants: string[];
    topic?: string;
  }) {
    const conversationId = await this.a2aService.startConversation(
      [body.initiator, ...body.participants],
      { topic: body.topic }
    );
    return { conversationId };
  }

  @Post('conversations/:conversationId/join')
  async joinConversation(
    @Param('conversationId') conversationId: string,
    @Body() body: { agentId: string }
  ) {
    await this.a2aService.joinConversation(conversationId, body.agentId);
    return { success: true, message: 'Joined conversation' };
  }

  @Post('conversations/:conversationId/leave')
  async leaveConversation(
    @Param('conversationId') conversationId: string,
    @Body() body: { agentId: string }
  ) {
    await this.a2aService.leaveConversation(conversationId, body.agentId);
    return { success: true, message: 'Left conversation' };
  }

  // Advanced Features
  @Post('agents/handshake')
  async facilitateHandshake(@Body() body: {
    agent1Id: string;
    agent2Id: string;
  }) {
    await this.a2aService.facilitateAgentHandshake(body.agent1Id, body.agent2Id);
    return { success: true, message: 'Handshake facilitated' };
  }

  @Post('messages/route-by-capability')
  async routeMessageByCapability(@Body() body: {
    fromAgent: string;
    targetCapability: string;
    payload: any;
    priority?: A2APriority;
    preferredAgent?: string;
  }) {
    await this.a2aService.routeMessageByCapability(
      body.fromAgent,
      body.targetCapability,
      body.payload,
      {
        priority: body.priority,
        preferredAgent: body.preferredAgent
      }
    );
    return { success: true, message: 'Message routed by capability' };
  }

  @Post('agents/channel')
  async createCommunicationChannel(@Body() body: {
    agentIds: string[];
    topic?: string;
  }) {
    const conversationId = await this.a2aService.createAgentCommunicationChannel(
      body.agentIds,
      body.topic
    );
    return { conversationId };
  }

  // Health and Monitoring
  @Post('agents/:agentId/heartbeat')
  async sendHeartbeat(
    @Param('agentId') agentId: string,
    @Body() heartbeat: Omit<AgentHeartbeat, 'agentId' | 'timestamp'>
  ) {
    const fullHeartbeat: AgentHeartbeat = {
      ...heartbeat,
      agentId,
      timestamp: new Date().toISOString()
    };
    
    await this.a2aService.sendHeartbeat(fullHeartbeat);
    return { success: true, message: 'Heartbeat sent' };
  }

  @Get('system/stats')
  async getSystemStats() {
    const stats = await this.a2aService.getSystemStats();
    return stats;
  }

  @Get('system/connections')
  async getConnectionStatus() {
    const websocketAgents = this.a2aService.getConnectedWebSocketAgents();
    return {
      websocketConnections: websocketAgents,
      totalConnected: websocketAgents.length
    };
  }

  @Post('payment')
  async createPayment(@Body() paymentDetails: { amount: number; currency: string; recipient: string }) {
    return this.a2aService.createPayment(paymentDetails);
  }

  // Utility endpoints
  @Get('agents/capabilities/:capabilityName')
  async findAgentsByCapability(@Param('capabilityName') capabilityName: string) {
    const agents = await this.a2aService.findAgentsByCapability(capabilityName);
    return { agents, count: agents.length };
  }

  @Get('agents/:agentId/connected')
  async isAgentConnected(@Param('agentId') agentId: string) {
    const connected = this.a2aService.isAgentConnectedViaWebSocket(agentId);
    return { agentId, connected };
  }
}
