import { IAgent } from './interfaces/IAgent.js';
import { MemoryManager } from '@the-new-fuse/core';
export declare abstract class BaseAgent implements IAgent {
    readonly id: string;
    readonly name: string;
    readonly type: string;
    readonly capabilities: string[];
    protected memoryManager: MemoryManager;
    constructor(id: string, name: string, type: string, capabilities: string[]);
}
