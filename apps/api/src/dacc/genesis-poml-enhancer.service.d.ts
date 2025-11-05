import { SystemBlueprint } from '@the-new-fuse/types';
/**
 * Genesis POML Enhancer Service
 *
 * Enhances the Genesis Agent's capability to generate POML-native agent definitions.
 * This service provides the Genesis Agent with specialized prompts and templates
 * for creating high-quality, structured POML templates.
 */
export declare class GenesisPOMLEnhancerService {
    private readonly logger;
    /**
     * Generate a SystemBlueprint with POML-native agents
     */
    generatePOMLNativeSystemBlueprint(userGoal: string, targetDomain?: string, complexity?: 'simple' | 'moderate' | 'complex'): Promise<SystemBlueprint>;
    /**
     * Generate POML-native agent definitions based on user goal
     */
    private generatePOMLNativeAgents;
    /**
     * Create a single-purpose POML agent (for simple workflows)
     */
    private createSinglePurposeAgent;
    /**
     * Create an input processor agent (for moderate/complex workflows)
     */
    private createInputProcessorAgent;
    /**
     * Create an analysis agent (core processing agent)
     */
    private createAnalysisAgent;
    /**
     * Create an output formatter agent
     */
    private createOutputFormatterAgent;
    /**
     * Additional agent creators for complex workflows
     */
    private createValidatorAgent;
    private createResearchAgent;
    private createSynthesisAgent;
    private createQualityAssuranceAgent;
    /**
     * Generate a workflow definition to orchestrate the created agents
     */
    private generateWorkflowForAgents;
    /**
     * Generate enhanced Genesis Agent master prompt for POML generation
     */
    generateGenesisMasterPrompt(): string;
    /**
     * Health check for the service
     */
    getHealthStatus(): Promise<Record<string, any>>;
}
//# sourceMappingURL=genesis-poml-enhancer.service.d.ts.map