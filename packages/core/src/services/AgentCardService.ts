import { Injectable } from '@nestjs/common';
import { AgentCard, agentCardSchema } from '../../types/src/agentCard';
import axios from 'axios';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from '../utils/logger';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

@Injectable()
export class AgentCardService {
  private readonly logger = new Logger(AgentCardService.name);
  private readonly cardStoragePath: string;
  private agentCards = new Map<string, AgentCard>();

  constructor(
    private readonly eventEmitter: EventEmitter2
  ) {
    this.cardStoragePath = process.env.AGENT_CARD_STORAGE_PATH || './agent-cards';
    this.initializeStorage();
  }

  private async initializeStorage(): Promise<void> {
    try {
      if (!existsSync(this.cardStoragePath)) {
        await mkdir(this.cardStoragePath, { recursive: true });
      }
      this.logger.log(`Agent card storage initialized at: ${this.cardStoragePath}`);
    } catch (error) {
      this.logger.error('Failed to initialize agent card storage', error);
    }
  }

  async registerAgentCard(agentCard: AgentCard): Promise<boolean> {
    try {
      // Validate agent card schema
      const validatedCard = agentCardSchema.parse(agentCard);
      
      // Store in memory
      this.agentCards.set(validatedCard.id, validatedCard);
      
      // Persist to disk
      await this.persistAgentCard(validatedCard);
      
      // Emit registration event
      this.eventEmitter.emit('agentCard.registered', validatedCard);
      
      this.logger.log(`Agent card registered: ${validatedCard.name} (${validatedCard.id})`);
      return true;
    } catch (error) {
      this.logger.error('Failed to register agent card', error);
      return false;
    }
  }

  async unregisterAgentCard(agentId: string): Promise<boolean> {
    try {
      const agentCard = this.agentCards.get(agentId);
      if (!agentCard) {
        this.logger.warn(`Agent card not found: ${agentId}`);
        return false;
      }

      // Remove from memory
      this.agentCards.delete(agentId);
      
      // Emit unregistration event
      this.eventEmitter.emit('agentCard.unregistered', agentCard);
      
      this.logger.log(`Agent card unregistered: ${agentCard.name} (${agentId})`);
      return true;
    } catch (error) {
      this.logger.error('Failed to unregister agent card', error);
      return false;
    }
  }

  getAgentCard(agentId: string): AgentCard | undefined {
    return this.agentCards.get(agentId);
  }

  getAllAgentCards(): AgentCard[] {
    return Array.from(this.agentCards.values());
  }

  getAgentCardsByCapability(capability: string): AgentCard[] {
    return Array.from(this.agentCards.values())
      .filter(card => card.capabilities.includes(capability as any));
  }

  getAgentCardsByRole(role: string): AgentCard[] {
    return Array.from(this.agentCards.values())
      .filter(card => card.role === role);
  }

  getAgentCardsByType(type: string): AgentCard[] {
    return Array.from(this.agentCards.values())
      .filter(card => card.type === type);
  }

  async updateAgentCard(agentId: string, updates: Partial<AgentCard>): Promise<boolean> {
    try {
      const existingCard = this.agentCards.get(agentId);
      if (!existingCard) {
        this.logger.warn(`Agent card not found for update: ${agentId}`);
        return false;
      }

      const updatedCard = { ...existingCard, ...updates };
      const validatedCard = agentCardSchema.parse(updatedCard);
      
      // Update in memory
      this.agentCards.set(agentId, validatedCard);
      
      // Persist to disk
      await this.persistAgentCard(validatedCard);
      
      // Emit update event
      this.eventEmitter.emit('agentCard.updated', validatedCard);
      
      this.logger.log(`Agent card updated: ${validatedCard.name} (${agentId})`);
      return true;
    } catch (error) {
      this.logger.error('Failed to update agent card', error);
      return false;
    }
  }

  async discoverAgentCards(discoveryUrl: string): Promise<AgentCard[]> {
    try {
      const response = await axios.get(discoveryUrl, {
        timeout: 5000,
        headers: {
          'Accept': 'application/json'
        }
      });

      const agentCards = response.data;
      if (!Array.isArray(agentCards)) {
        throw new Error('Discovery response is not an array');
      }

      const validatedCards: AgentCard[] = [];
      for (const cardData of agentCards) {
        try {
          const validatedCard = agentCardSchema.parse(cardData);
          validatedCards.push(validatedCard);
        } catch (error) {
          this.logger.warn(`Invalid agent card discovered from ${discoveryUrl}`, error);
        }
      }

      this.logger.log(`Discovered ${validatedCards.length} valid agent cards from ${discoveryUrl}`);
      return validatedCards;
    } catch (error) {
      this.logger.error(`Failed to discover agent cards from ${discoveryUrl}`, error);
      return [];
    }
  }

  private async persistAgentCard(agentCard: AgentCard): Promise<void> {
    try {
      const filePath = join(this.cardStoragePath, `${agentCard.id}.json`);
      await writeFile(filePath, JSON.stringify(agentCard, null, 2));
    } catch (error) {
      this.logger.error(`Failed to persist agent card: ${agentCard.id}`, error);
    }
  }

  getAgentCardStats(): {
    totalCards: number;
    typeDistribution: Record<string, number>;
    roleDistribution: Record<string, number>;
    capabilityDistribution: Record<string, number>;
  } {
    const cards = Array.from(this.agentCards.values());
    const stats = {
      totalCards: cards.length,
      typeDistribution: {} as Record<string, number>,
      roleDistribution: {} as Record<string, number>,
      capabilityDistribution: {} as Record<string, number>
    };

    for (const card of cards) {
      // Type distribution
      stats.typeDistribution[card.type] = (stats.typeDistribution[card.type] || 0) + 1;
      
      // Role distribution
      stats.roleDistribution[card.role] = (stats.roleDistribution[card.role] || 0) + 1;
      
      // Capability distribution
      for (const capability of card.capabilities) {
        stats.capabilityDistribution[capability] = (stats.capabilityDistribution[capability] || 0) + 1;
      }
    }

    return stats;
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: Record<string, any> }> {
    try {
      const stats = this.getAgentCardStats();
      const storageExists = existsSync(this.cardStoragePath);
      
      return {
        status: 'healthy',
        details: {
          storageAvailable: storageExists,
          totalAgentCards: stats.totalCards,
          storagePath: this.cardStoragePath
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message
        }
      };
    }
  }
}