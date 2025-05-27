import { EventEmitter } from 'events';
import { Logger, LogLevel  } from '../core/logging.js';
import { AIAgent, AgentCapability, ConnectionStatus } from '../types/shared.js';

export class AgentDiscoveryManager extends EventEmitter {
    private static instance: AgentDiscoveryManager;
    private logger: Logger;
    private agents: Map<string, AIAgent> = new Map();
    private capabilities: Map<string, Set<AgentCapability>> = new Map();
    private agentStatus: Map<string, ConnectionStatus> = new Map();

    private constructor() {
        super();
        this.logger = Logger.getInstance();
    }

    public static getInstance(): AgentDiscoveryManager {
        if (!AgentDiscoveryManager.instance) {
            AgentDiscoveryManager.instance = new AgentDiscoveryManager();
        }
        return AgentDiscoveryManager.instance;
    }

    public async registerAgent(agent: AIAgent): Promise<boolean> {
        try {
            // Update or add agent
            this.agents.set(agent.id, {
                ...agent,
                lastSeen: Date.now()
            });

            this.agentStatus.set(agent.id, ConnectionStatus.CONNECTED);
            this.emit('agentRegistered', agent);
            this.logger.info(`Agent registered: ${agent.name} (${agent.id})`);
            return true;
        } catch (error) {
            this.logger.error('Failed to register agent:', error);
            return false;
        }
    }

    public async unregisterAgent(agentId: string): Promise<boolean> {
        try {
            const agent = this.agents.get(agentId);
            if (agent) {
                this.agents.delete(agentId);
                this.capabilities.delete(agentId);
                this.agentStatus.delete(agentId);
                this.emit('agentUnregistered', agent);
                this.logger.info(`Agent unregistered: ${agent.name} (${agent.id})`);
                return true;
            }
            return false;
        } catch (error) {
            this.logger.error('Failed to unregister agent:', error);
            return false;
        }
    }

    public async registerCapability(agentId: string, capability: AgentCapability): Promise<boolean> {
        try {
            if (!this.capabilities.has(agentId)) {
                this.capabilities.set(agentId, new Set());
            }
            this.capabilities.get(agentId)?.add(capability);
            this.emit('capabilityRegistered', { agentId, capability });
            this.logger.info(`Capability registered for agent ${agentId}: ${capability.name}`);
            return true;
        } catch (error) {
            this.logger.error('Failed to register capability:', error);
            return false;
        }
    }

    public async updateAgentStatus(agentId: string, status: ConnectionStatus): Promise<void> {
        const oldStatus = this.agentStatus.get(agentId);
        if (oldStatus !== status) {
            this.agentStatus.set(agentId, status);
            this.emit('agentStatusChanged', { agentId, status });
            this.logger.info(`Agent ${agentId} status changed to: ${status}`);
        }
    }

    public getAgent(agentId: string): AIAgent | undefined {
        return this.agents.get(agentId);
    }

    public getAllAgents(): AIAgent[] {
        return Array.from(this.agents.values());
    }

    public getAgentCapabilities(agentId: string): AgentCapability[] {
        return Array.from(this.capabilities.get(agentId) || []);
    }

    public getAgentStatus(agentId: string): ConnectionStatus {
        return this.agentStatus.get(agentId) || ConnectionStatus.DISCONNECTED;
    }

    public getConnectedAgents(): AIAgent[] {
        return this.getAllAgents().filter(agent => 
            this.getAgentStatus(agent.id) === ConnectionStatus.CONNECTED
        );
    }

    public findAgentsByCapability(capabilityId: string): AIAgent[] {
        return this.getAllAgents().filter(agent => {
            const agentCapabilities = this.getAgentCapabilities(agent.id);
            return agentCapabilities.some(cap => cap.id === capabilityId);
        });
    }

    public async checkAgentHealth(): Promise<void> {
        const now = Date.now();
        const timeout = 30000; // 30 seconds timeout

        for (const [agentId, agent] of this.agents) {
            if (now - agent.lastSeen > timeout) {
                await this.updateAgentStatus(agentId, ConnectionStatus.DISCONNECTED);
            }
        }
    }

    public dispose(): void {
        this.removeAllListeners();
        this.agents.clear();
        this.capabilities.clear();
        this.agentStatus.clear();
    }
}