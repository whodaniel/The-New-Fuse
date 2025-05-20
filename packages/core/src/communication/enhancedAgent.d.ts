import { EventEmitter } from 'events';
import type { AgentCapability } from '@fuse/types/core';
export interface DevelopmentProposal {
    component: string;
    proposal: string;
    priority: number;
    benefits: string[];
    implementation_steps: string[];
}
export declare class EnhancedAgent extends EventEmitter {
    private readonly id;
    private readonly channel;
    private readonly broadcastChannel;
    private readonly description;
    private readonly capabilities;
    private redis;
    private isRunning;
    constructor(id: string, channel: string, broadcastChannel: string, description: string, capabilities: AgentCapability[]);
}
