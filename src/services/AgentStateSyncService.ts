import { Injectable } from '@nestjs/common';
import { AgentWebSocketService } from './AgentWebSocketService.js';
import { AgentPersistenceService } from './AgentPersistenceService.js';

@Injectable()
export class AgentStateSyncService {
    private stateCache = new Map<string, any>();

    constructor(
        private wsService: AgentWebSocketService,
        private persistenceService: AgentPersistenceService
    ) {
        this.setupWebSocketHandlers();
    }

    private setupWebSocketHandlers() {
        this.wsService.onMessage('state_update', async (data) => {
            await this.handleStateUpdate(data.agentId, data.state);
        });
    }

    async handleStateUpdate(agentId: string, newState: any) {
        this.stateCache.set(agentId, newState);
        await this.persistenceService.saveAgentState(agentId, newState);
        this.wsService.broadcastStateUpdate(agentId, newState);
    }

    async syncState(agentId: string, targetAgentId: string) {
        const sourceState = this.stateCache.get(agentId);
        if (sourceState) {
            await this.handleStateUpdate(targetAgentId, sourceState);
        }
    }

    async getAgentState(agentId: string): Promise<any> {
        return this.stateCache.get(agentId);
    }
}