import { Injectable } from '@nestjs/common';

export interface AgentCard {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  status: 'active' | 'inactive' | 'maintenance';
  metadata: Record<string, any>;
}

@Injectable()
export class AgentCardService {
  private cards: Map<string, AgentCard> = new Map();

  async createCard(cardData: Partial<AgentCard>): Promise<AgentCard> {
    const card: AgentCard = {
      id: cardData.id || this.generateId(),
      name: cardData.name || 'Unnamed Agent',
      description: cardData.description || '',
      capabilities: cardData.capabilities || [],
      status: cardData.status || 'inactive',
      metadata: cardData.metadata || {},
    };

    this.cards.set(card.id, card);
    return card;
  }

  async getCard(id: string): Promise<AgentCard | null> {
    return this.cards.get(id) || null;
  }

  async updateCard(id: string, updates: Partial<AgentCard>): Promise<AgentCard | null> {
    const existing = this.cards.get(id);
    if (!existing) {
      return null;
    }

    const updated = { ...existing, ...updates };
    this.cards.set(id, updated);
    return updated;
  }

  async deleteCard(id: string): Promise<boolean> {
    return this.cards.delete(id);
  }

  async listCards(): Promise<AgentCard[]> {
    return Array.from(this.cards.values());
  }

  private generateId(): string {
    return `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
