import { BaseNode, NodeConfig, NodeType } from '../types.js';
import { A2AMessage } from '../../protocols/types.js';
import { AgentFactory } from '../../agents/AgentFactory.js';

export class A2ANode implements BaseNode {
    type: NodeType = 'A2A_AGENT';
    private agentFactory: AgentFactory;
    private agentInstance: any;

    constructor(private config: NodeConfig) {
        this.agentFactory = AgentFactory.getInstance();
    }

    async initialize(): Promise<void> {
        this.agentInstance = await this.agentFactory.createAgent(
            this.config.agentType,
            this.config.id
        );
    }

    async process(input: any): Promise<any> {
        const message: A2AMessage = {
            type: 'TASK_REQUEST',
            payload: input,
            metadata: {
                timestamp: Date.now(),
                sender: this.config.id,
                protocol_version: '1.0'
            }
        };

        return await this.agentInstance.processMessage(message);
    }

    getInputPorts(): string[] {
        return ['input', 'context', 'configuration'];
    }

    getOutputPorts(): string[] {
        return ['result', 'error', 'status'];
    }

    getConfiguration(): NodeConfig {
        return this.config;
    }
}