import * as vscode from 'vscode';
import { AgentRegistration } from '../types/agent-communication';

/**
 * Registry service for managing AI agents in the system
 * Migrated from old-vscode-extension/agent-registry.ts with enhancements
 */
export class AgentRegistry {
    private agents: Map<string, AgentRegistration> = new Map();
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.loadPersistedAgents();
    }

    /**
     * Register a new agent in the system
     */
    async registerAgent(registration: AgentRegistration): Promise<string> {
        // Generate ID if not provided
        if (!registration.id) {
            registration.id = `agent-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        }

        // Set default values
        registration.active = true;
        registration.lastSeen = Date.now();
        registration.status = registration.status || 'online';

        this.agents.set(registration.id, registration);
        await this.persistAgents();

        // Emit registration event
        vscode.commands.executeCommand('the-new-fuse.onAgentRegistered', registration);

        return registration.id;
    }

    /**
     * Unregister an agent from the system
     */
    async unregisterAgent(agentId: string): Promise<void> {
        const agent = this.agents.get(agentId);
        if (agent) {
            this.agents.delete(agentId);
            await this.persistAgents();

            // Emit unregistration event
            vscode.commands.executeCommand('the-new-fuse.onAgentUnregistered', agent);
        }
    }

    /**
     * Get a specific agent by ID
     */
    getAgent(agentId: string): AgentRegistration | undefined {
        return this.agents.get(agentId);
    }

    /**
     * Get all registered agents
     */
    getAllAgents(): AgentRegistration[] {
        return Array.from(this.agents.values());
    }

    /**
     * Get active agents only
     */
    getActiveAgents(): AgentRegistration[] {
        return this.getAllAgents().filter(agent => agent.active && agent.status !== 'offline');
    }

    /**
     * Get agents by capability
     */
    getAgentsByCapability(capability: string): AgentRegistration[] {
        return this.getActiveAgents().filter(agent => 
            agent.capabilities.includes(capability)
        );
    }

    /**
     * Update agent status
     */
    async updateAgentStatus(agentId: string, status: 'online' | 'offline' | 'busy'): Promise<void> {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.status = status;
            agent.lastSeen = Date.now();
            if (status === 'offline') {
                agent.active = false;
            }
            await this.persistAgents();
        }
    }

    /**
     * Ping an agent to check if it's still active
     */
    async pingAgent(agentId: string): Promise<boolean> {
        const agent = this.agents.get(agentId);
        if (!agent) {
            return false;
        }

        // Update last seen
        agent.lastSeen = Date.now();
        await this.persistAgents();

        return agent.active;
    }

    /**
     * Cleanup inactive agents
     */
    async cleanupInactiveAgents(timeoutMs: number = 300000): Promise<void> {
        const now = Date.now();
        const agentsToRemove: string[] = [];

        for (const [id, agent] of this.agents) {
            if (now - agent.lastSeen > timeoutMs) {
                agentsToRemove.push(id);
            }
        }

        for (const id of agentsToRemove) {
            await this.unregisterAgent(id);
        }
    }

    /**
     * Load agents from persistent storage
     */
    private loadPersistedAgents(): void {
        try {
            const storedAgents = this.context.globalState.get<AgentRegistration[]>('registeredAgents', []);
            for (const agent of storedAgents) {
                // Mark stored agents as offline initially
                agent.status = 'offline';
                agent.active = false;
                this.agents.set(agent.id, agent);
            }
        } catch (error) {
            console.error('Failed to load persisted agents:', error);
        }
    }

    /**
     * Persist agents to storage
     */
    private async persistAgents(): Promise<void> {
        try {
            const agentsArray = Array.from(this.agents.values());
            await this.context.globalState.update('registeredAgents', agentsArray);
        } catch (error) {
            console.error('Failed to persist agents:', error);
        }
    }

    /**
     * Get registry statistics
     */
    getStats(): {
        total: number;
        active: number;
        capabilities: string[];
    } {
        const allAgents = this.getAllAgents();
        const activeAgents = this.getActiveAgents();
        const capabilities = [...new Set(allAgents.flatMap(agent => agent.capabilities))];

        return {
            total: allAgents.length,
            active: activeAgents.length,
            capabilities
        };
    }
}
