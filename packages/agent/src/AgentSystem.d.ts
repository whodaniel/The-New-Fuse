import { AgentRegistry } from './AgentRegistry';
import { AgentFactory } from './AgentFactory';
import { AgentCommunicationBus } from './AgentCommunicationBus';
export declare class AgentSystem {
    private readonly registry;
    private readonly factory;
    private readonly communicationBus;
    constructor(registry: AgentRegistry, factory: AgentFactory, communicationBus: AgentCommunicationBus);
}
