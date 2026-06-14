import { Logger } from '../types/core.js';
import { AgentProcessor, type ProcessorRegistrationOptions, type ProcessorRuntimeProcessor } from './AgentProcessor.js';
export interface AgentHarnessContext {
    agentId: string;
    processor: AgentProcessor;
    logger: Logger;
}
export interface AgentHarnessExtension {
    id: string;
    name?: string;
    version?: string;
    processors?: ProcessorRuntimeProcessor[];
    canExtend?: (context: AgentHarnessContext) => boolean | Promise<boolean>;
    activate?: (context: AgentHarnessContext) => Promise<void> | void;
    deactivate?: (context: AgentHarnessContext) => Promise<void> | void;
}
export interface AgentHarnessExtensionRegistration {
    id?: string;
    processorOptions?: Record<string, ProcessorRegistrationOptions>;
    replace?: boolean;
}
export declare class AgentHarnessExtensionHost {
    private readonly agentId;
    private readonly processor;
    private readonly extensions;
    private readonly logger;
    constructor(agentId: string, processor: AgentProcessor);
    registerExtension(extension: AgentHarnessExtension, options?: AgentHarnessExtensionRegistration): Promise<void>;
    unregisterExtension(id: string): Promise<boolean>;
    listExtensions(): AgentHarnessExtension[];
    private createContext;
}
//# sourceMappingURL=AgentHarnessExtension.d.ts.map