/**
 * Agent Handoff Template System Integration
 *
 * This integrates the existing prompt templating system with agent handoff protocols
 * to eliminate coherence drift and ensure standardized, trackable, improvable handoffs.
 */
export interface AgentHandoffTemplate {
    id: string;
    name: string;
    description: string;
    content: string;
    variables: Record<string, string>;
    testCases: any[];
    createdAt: string;
    updatedAt: string;
    versions?: any[];
    handoffType: 'session_end' | 'task_delegation' | 'error_recovery' | 'milestone_completion';
    agentRole: string;
    platformContext: string;
    successCriteria: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
    estimatedDuration: number;
    dependencies: string[];
    coordinationRequirements: {
        requiresJulesCoordination: boolean;
        requiresVSCodeAgents: boolean;
        requiresBrowserAgents: boolean;
        requiresManualApproval: boolean;
    };
}
export declare const MASTER_ORCHESTRATOR_HANDOFF_TEMPLATE: AgentHandoffTemplate;
export declare class AgentHandoffTemplateService {
    createHandoffPrompt(templateId: string, variables: Record<string, any>): Promise<string>;
    private processTemplate;
    private processSimpleArrays;
    generateSessionMetrics(sessionData: any): Record<string, any>;
    private calculateHandoffQuality;
}
export declare function generateCurrentSessionHandoff(): string;
export { MASTER_ORCHESTRATOR_HANDOFF_TEMPLATE };
//# sourceMappingURL=AgentHandoffTemplateService.d.ts.map