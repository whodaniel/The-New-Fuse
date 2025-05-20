import { Injectable } from '@nestjs/common';
import { AgentCard, agentCardSchema } from '../../types/src/agentCard.js';
import axios from 'axios';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from '../utils/logger.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

@Injectable()
export class AgentCardService {
  private discoveredAgents: Map<string, AgentCard> = new Map();
  private logger = new Logger(AgentCardService.name);
  private cardStoragePath: string;
  private cardUrlMap: Map<string, string> = new Map();

  constructor(
    private eventEmitter: EventEmitter2,
    private configService?: { get: (key: string) => string }
  ) {
    this.cardStoragePath = configService?.get('CARD_STORAGE_PATH') || './agent-cards';
  }

  async discoverAgent(url: string): Promise<AgentCard> {
    try {
      const response = await axios.get(url);
      const card = agentCardSchema.parse(response.data);
      
      this.discoveredAgents.set(card.id, card);
      this.cardUrlMap.set(card.id, url);
      this.eventEmitter.emit('agent.discovered', card);
      
      return card;
    } catch (error) {
      this.logger.error(`Failed to discover agent at ${url}`, error);
      throw error;
    }
  }

  async advertiseAgentCard(card: AgentCard, hostUrl: string): Promise<void> {
    try {
      // Validate card format
      agentCardSchema.parse(card);
      
      // Store card in file system and register URL
      await this.hostCard(card, hostUrl);
      
      this.logger.info(`Agent card hosted successfully at ${hostUrl}`);
      this.eventEmitter.emit('agent.advertised', { card, url: hostUrl });
    } catch (error) {
      this.logger.error('Failed to advertise agent card', error);
      throw error;
    }
  }

  getDiscoveredAgents(): AgentCard[] {
    return Array.from(this.discoveredAgents.values());
  }

  getAgentById(id: string): AgentCard | undefined {
    return this.discoveredAgents.get(id);
  }

  getAgentUrl(id: string): string | undefined {
    return this.cardUrlMap.get(id);
  }

  private async hostCard(card: AgentCard, hostUrl: string): Promise<void> {
    // Ensure storage directory exists
    if (!existsSync(this.cardStoragePath)) {
      await mkdir(this.cardStoragePath, { recursive: true });
    }

    // Store card in file system
    const filePath = join(this.cardStoragePath, `${card.id}.json`);
    await writeFile(filePath, JSON.stringify({ ...card, hostUrl }, null, 2));
    
    // Update in-memory storage
    this.discoveredAgents.set(card.id, card);
    this.cardUrlMap.set(card.id, hostUrl);
  }
}