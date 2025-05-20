import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisService } from './RedisService.js';
import { AgentService } from './agent.service.js';

@Injectable()
export class ComposerService implements OnModuleInit {
  constructor(
    private readonly redisService: RedisService,
    private readonly agentService: AgentService
  ) {}

  async onModuleInit() {
    // Subscribe to agent messages using the public method instead of directly accessing subClient
    await this.redisService.subscribeToChannel('agent:messages', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        // Process the agent message
        console.log('Received agent message:', data);
        
        // Handle different message types
        if (data.type === 'status_update') {
          await this.handleStatusUpdate(data);
        } else if (data.type === 'communication') {
          await this.handleCommunication(data);
        }
      } catch (error) {
        console.error('Error processing agent message:', error);
      }
    });
  }

  async handleStatusUpdate(data: any) {
    const { agentId, status, userId } = data;
    
    try {
      // Update the agent status
      await this.agentService.updateAgentStatus(agentId, status, userId);
      console.log(`Updated agent ${agentId} status to ${status}`);
    } catch (error) {
      console.error('Error updating agent status:', error);
    }
  }

  async handleCommunication(data: any) {
    const { fromAgentId, toAgentId, content, userId } = data;
    
    try {
      // Validate both agents exist and belong to the user
      const [fromAgent, toAgent] = await Promise.all([
        this.agentService.getAgentById(fromAgentId, userId),
        this.agentService.getAgentById(toAgentId, userId)
      ]);
      
      if (!fromAgent || !toAgent) {
        console.error('One or both agents not found or not authorized');
        return;
      }
      
      // Process the communication between agents
      console.log(`Communication from ${fromAgent.name} to ${toAgent.name}: ${content}`);
      
      // Forward the message to the target agent's channel
      await this.redisService.publish(`agent:${toAgentId}`, JSON.stringify({
        type: 'message',
        fromAgentId,
        fromAgentName: fromAgent.name,
        content,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error handling agent communication:', error);
    }
  }
}