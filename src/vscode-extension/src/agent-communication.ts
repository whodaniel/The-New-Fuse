import { Logger } from './core/logging.js';
import { AgentMessage as CanonicalAgentMessage, AgentRegistration as CanonicalAgentRegistration } from './types.js';

export { CanonicalAgentMessage as AgentMessage };
export { CanonicalAgentRegistration as AgentRegistration };

export class AgentClient {
    private static instance: AgentClient;
    private registeredAgents: Map<string, AgentRegistration> = new Map();
    private messageHandlers: Map<string, ((message: AgentMessage) => Promise<void>)[]> = new Map();
    private logger: Logger;

    private constructor() {
        this.logger = new Logger('AgentClient');
    }

    public static getInstance(): AgentClient {
        if (!AgentClient.instance) {
            AgentClient.instance = new AgentClient();
        }
        return AgentClient.instance;
    }

    async register(name: string, capabilities: string[], version: string): Promise<string> {
        const agentId = `agent-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const registration: AgentRegistration = {
            id: agentId,
            name,
            capabilities,
            version,
            active: true,
            lastSeen: Date.now(),
            apiVersion: "v1" // Default apiVersion
        };

        this.registeredAgents.set(agentId, registration);
        this.logger.info(`Registered agent: ${name} (${agentId})`);
        return agentId;
    }

    async sendMessage(params: {
        type: string;
        source?: string; // Use source directly
        sender?: string; // For backward compatibility
        recipient: string;
        payload: any; // This is the payload in AgentMessage
        action?: string; // Optional action
    }): Promise<void> {
        const message: AgentMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            timestamp: Date.now(),
            type: params.type,
            source: params.source || params.sender || 'agent-client', // Use source or sender or default
            recipient: params.recipient,
            action: params.action, // Optional action
            payload: params.payload, // This is the payload in AgentMessage
        };

        try {
            const recipientAgent = this.registeredAgents.get(message.recipient);
            if (!recipientAgent || !recipientAgent.active) {
                this.logger.warn(`Recipient agent ${message.recipient} is not active or not found`);
                return;
            }

            const handlers = this.messageHandlers.get(message.recipient) || [];
            for (const handler of handlers) {
                try {
                    await handler(message);
                } catch (error) {
                    this.logger.error(`Message handler error for ${message.recipient}:`, error);
                }
            }
        } catch (error) {
            this.logger.error('Failed to send message:', error);
            throw error;
        }
    }

    async broadcast(type: string, payload: any, action?: string): Promise<void> {
        const source = 'broadcast';
        const activeAgents = Array.from(this.registeredAgents.values())
            .filter(agent => agent.active)
            .map(agent => agent.id);

        for (const recipientId of activeAgents) {
            await this.sendMessage({
                type,
                source,
                recipient: recipientId,
                payload,
                action
            });
        }
    }

    subscribe(handler: (message: AgentMessage) => Promise<void>, agentId: string = 'global'): () => void {
        if (!this.messageHandlers.has(agentId)) {
            this.messageHandlers.set(agentId, []);
        }

        const handlers = this.messageHandlers.get(agentId)!;
        handlers.push(handler);
        this.logger.debug('Subscribing new handler', {
            agentId,
            totalHandlers: handlers.length
        });

        return () => {
            const currentHandlers = this.messageHandlers.get(agentId);
            if (currentHandlers) {
                const index = currentHandlers.indexOf(handler);
                if (index !== -1) {
                    currentHandlers.splice(index, 1);
                    this.logger.debug('Handler unsubscribed', { agentId });
                }
            }
        };
    }

    deactivateAgent(agentId: string): void {
        const agent = this.registeredAgents.get(agentId);
        if (agent) {
            agent.active = false;
            this.logger.info(`Agent ${agentId} deactivated`);
        }
    }

    activateAgent(agentId: string): void {
        const agent = this.registeredAgents.get(agentId);
        if (agent) {
            agent.active = true;
            this.logger.info(`Agent ${agentId} activated`);
        }
    }

    getRegisteredAgents(): AgentRegistration[] {
        return Array.from(this.registeredAgents.values());
    }
}