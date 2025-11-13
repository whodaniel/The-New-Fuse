/**
 * Template Parser
 * Handles parsing and generation of infrastructure templates
 */
import { InfrastructureTemplate, ResourceDefinition, TemplateOutput } from '../types/infrastructure';
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
    catch(error: any): void;
}
//# sourceMappingURL=TemplateParser.d.ts.map