/**
 * Advanced AgentFederationIntegration Examples
 * Comprehensive usage examples demonstrating the full AgentFederationIntegration integration
 */
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AgentHub } from '../services/AgentHub';
import { RelayIntegrationService } from '../services/RelayIntegrationService';
import { AgentHubMonitor } from '../monitoring/AgentHubMonitor';
interface CodeReviewPlan {
    repository: string;
    pullRequestId: string;
    targetBranch: string;
    changedFiles: string[];
    reviewCriteria: {
        codeQuality: boolean;
        security: boolean;
        performance: boolean;
        testing: boolean;
        documentation: boolean;
    };
}
/**
 * Advanced examples demonstrating the full capabilities of the AgentFederationIntegration integration
 *
 * Examples include:
 * - Multi-service integration (AgentHub + A2A + MCP + Relay)
 * - Complex multi-agent workflows with conditional logic
 * - Real-time monitoring and error handling
 * - Chrome extension integration and browser automation
 * - Protocol buffer usage for structured communication
 * - Error recovery patterns and resilience strategies
 * - Performance optimization techniques
 * - Custom agent integration patterns
 * - Workspace context management
 * - API integration with external systems
 */
export declare class AdvancedAgentFederationIntegrationExamples {
    private readonly agentHub;
    private readonly relayIntegration;
    private readonly monitor;
    private readonly eventEmitter;
    private readonly logger;
    constructor(agentHub: AgentHub, relayIntegration: RelayIntegrationService, monitor: AgentHubMonitor, eventEmitter: EventEmitter2);
    /**
     * Example 1: Multi-Service Integration
     * Demonstrates comprehensive integration between AgentHub, A2A, MCP, and Relay services
     */
    demonstrateMultiServiceIntegration(): Promise<void>;
    private registerMultiProtocolAgents;
    private executeA2ATask;
    private executeMCPTask;
    private executeRelayTask;
    /**
     * Example 2: Complex Multi-Agent Workflow with Conditional Logic
     * Demonstrates advanced workflow orchestration with branching logic
     */
    executeComplexCodeReviewWorkflow(plan: CodeReviewPlan): Promise<any>;
    const results: Map<string, any>;
}
export {};
//# sourceMappingURL=AdvancedAgentFederationIntegrationExamples.d.ts.map