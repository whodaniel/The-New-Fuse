/**
 * Template Parser
 * Handles parsing and generation of infrastructure templates
 */
import { InfrastructureTemplate, InfrastructureState, ResourceDefinition, TemplateOutput } from '../types/infrastructure.js';
export interface ParsedTemplate {
    template: InfrastructureTemplate;
    resources: ResourceDefinition[];
    variables: Map<string, any>;
    outputs: TemplateOutput[];
    dependencies: Map<string, string[]>;
}
export declare class TemplateParser {
    private variableResolvers;
    private resourceParsers;
    constructor();
    parse(template: InfrastructureTemplate): Promise<ParsedTemplate>;
    generateTemplate(state: InfrastructureState): Promise<InfrastructureTemplate>;
    private resolveVariables;
    private parseResources;
    private buildDependencyGraph;
    private validateDependencies;
    private hasCyclicDependency;
    private generateResourceDefinitions;
    private generateVariables;
    private generateOutputs;
    private detectProvider;
    private initializeResolvers;
    private initializeParsers;
}
//# sourceMappingURL=TemplateParser.d.ts.map