var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
let AgentCardService = class AgentCardService {
    constructor() {
        this.cards = new Map();
    }
    async createCard(cardData) {
        const card = {
            id: cardData.id || this.generateId(),
            name: cardData.name || 'Unnamed Agent',
            description: cardData.description || '',
            capabilities: cardData.capabilities || [],
            status: cardData.status || 'inactive',
            metadata: cardData.metadata || {}
        };
        this.cards.set(card.id, card);
        return card;
    }
    async getCard(id) {
        return this.cards.get(id) || null;
    }
    async updateCard(id, updates) {
        const existing = this.cards.get(id);
        if (!existing) {
            return null;
        }
        const updated = { ...existing, ...updates };
        this.cards.set(id, updated);
        return updated;
    }
    async deleteCard(id) {
        return this.cards.delete(id);
    }
    async listCards() {
        return Array.from(this.cards.values());
    }
    generateId() {
        return `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
};
AgentCardService = __decorate([
    Injectable()
], AgentCardService);
export { AgentCardService };
//# sourceMappingURL=AgentCardService.js.map