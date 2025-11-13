/**
 * Unified Agent Orchestration Service
 * Integrates AgentFederation, DACC, Terminal Orchestration, and VSCode Extension systems
 */
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AgentFederationTerminalBridge } from './agent-federation-terminal-bridge.service';
import { VSCodeAgentCommunicationBridge } from './vscode-agent-communication-bridge.service';
import { TerminalDiscoveryService } from './terminal-discovery.service';
interface OrchestrationPlan {
    taskId: string;
    strategy: string;
    phases: OrchestrationPhase[];
    dependencies: string[];
    expectedDuration: number;
    riskAssessment: {
        level: 'low' | 'medium' | 'high';
        factors: string[];
        mitigation: string[];
    };
}
interface OrchestrationPhase {
    id: string;
    name: string;
    description: string;
    requiredAgents: string[];
    dependencies: string[];
    estimatedDuration: number;
    validations: string[];
}
export declare class UnifiedAgentOrchestration {
    private readonly federationBridge;
    private readonly vscodeBridge;
    private readonly terminalDiscovery;
    private readonly eventEmitter;
    private readonly logger;
    private agentSystems;
    private allAgents;
    private activeTasks;
    private orchestrationHistory;
    private healthCheckInterval;
    private performanceTrackingInterval;
    private orchestrationConfig;
    constructor(federationBridge: AgentFederationTerminalBridge, vscodeBridge: VSCodeAgentCommunicationBridge, terminalDiscovery: TerminalDiscoveryService, eventEmitter: EventEmitter2);
    /**
     * Initialize unified orchestration system
     */
    private initializeUnifiedOrchestration;
    /**
     * Register VSCode extension system
     */
    private registerVSCodeSystem;
    const plan: OrchestrationPlan;
    switch(task: any, orchestration: any, strategy: any): void;
    default: throw;
}
export {};
//# sourceMappingURL=unified-agent-orchestration.service.d.ts.map