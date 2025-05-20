import { AgentRegistry } from './AgentRegistry.js';
import { AgentFactory } from './AgentFactory.js';
import { AgentCommunicationBus } from './AgentCommunicationBus.js';
export declare class AgentSystem {
    private readonly registry;
    private readonly factory;
    private readonly communicationBus;
    constructor(registry: AgentRegistry, factory: AgentFactory, communicationBus: AgentCommunicationBus);
}
