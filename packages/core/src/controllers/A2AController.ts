import { Controller, Get, Post, Body, Param, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AgentCardService } from '../services/AgentCardService.js';
import { A2AProtocolHandler, A2AMessage } from '../protocols/A2AProtocolHandler.js';
import { ProtocolAdapterService } from '../protocols/ProtocolAdapterService.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@ApiTags('a2a')
@Controller('a2a')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class A2AController {
  constructor(
    private readonly agentCardService: AgentCardService,
    private readonly protocolHandler: A2AProtocolHandler,
    private readonly protocolAdapter: ProtocolAdapterService
  ) {}

  @Post('messages')
  @ApiOperation({ summary: 'Send an A2A message' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  async sendMessage(
    @Body() message: A2AMessage,
    @Headers('x-protocol-version') protocolVersion = 'a2a-v2.0'
  ) {
    if (protocolVersion !== 'a2a-v2.0') {
      message = await this.protocolAdapter.adaptMessage(
        message,
        protocolVersion,
        'a2a-v2.0'
      );
    }
    return this.protocolHandler.handleMessage(message);
  }

  @Get('agents')
  @ApiOperation({ summary: 'List all available agents' })
  @ApiResponse({ status: 200, description: 'List of agent cards' })
  async listAgents() {
    return this.agentCardService.getDiscoveredAgents();
  }

  @Get('agents/:id')
  @ApiOperation({ summary: 'Get agent details' })
  @ApiResponse({ status: 200, description: 'Agent card details' })
  async getAgent(@Param('id') id: string) {
    return this.agentCardService.getAgentById(id);
  }

  @Get('agents/:id/capabilities')
  @ApiOperation({ summary: 'Get agent capabilities' })
  @ApiResponse({ status: 200, description: 'Agent capabilities' })
  async getAgentCapabilities(@Param('id') id: string) {
    const agent = await this.agentCardService.getAgentById(id);
    return agent?.capabilities || [];
  }

  @Post('broadcast')
  @ApiOperation({ summary: 'Broadcast message to multiple agents' })
  @ApiResponse({ status: 201, description: 'Message broadcasted successfully' })
  async broadcastMessage(
    @Body() message: A2AMessage,
    @Headers('x-protocol-version') protocolVersion = 'a2a-v2.0'
  ) {
    if (protocolVersion !== 'a2a-v2.0') {
      message = await this.protocolAdapter.adaptMessage(
        message,
        protocolVersion,
        'a2a-v2.0'
      );
    }
    const agents = this.agentCardService.getDiscoveredAgents();
    return Promise.all(
      agents.map(agent => {
        const targetedMessage = {
          ...message,
          header: { ...message.header, target: agent.id }
        };
        return this.protocolHandler.handleMessage(targetedMessage);
      })
    );
  }

  @Post('request')
  @ApiOperation({ summary: 'Send request and wait for response' })
  @ApiResponse({ status: 201, description: 'Response received' })
  async sendRequest(
    @Body() message: A2AMessage,
    @Headers('x-protocol-version') protocolVersion = 'a2a-v2.0'
  ) {
    if (protocolVersion !== 'a2a-v2.0') {
      message = await this.protocolAdapter.adaptMessage(
        message,
        protocolVersion,
        'a2a-v2.0'
      );
    }
    return new Promise((resolve, reject) => {
      const timeout = message.body.metadata.timeout || 30000;
      const timeoutId = setTimeout(() => {
        reject(new Error('Request timed out'));
      }, timeout);

      this.protocolHandler.handleMessage(message)
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timeoutId));
    });
  }
}