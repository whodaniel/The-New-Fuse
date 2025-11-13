/**
 * Pydantic Agent Discovery Adapter
 *
 * Discovers and parses Pydantic agents from Python files with
 * AST analysis and sophisticated capability extraction.
 */
import { UnifiedEntity } from '../domain/UnifiedEntity';
export interface PydanticAgentDefinition {
    name: string;
    className: string;
    description: string;
    fields: PydanticField[];
    methods: PydanticMethod[];
    baseClasses: string[];
    imports: string[];
    filePath: string;
    sourceCode: string;
}
export interface PydanticField {
    name: string;
    type: string;
    description?: string;
    default?: any;
    required: boolean;
}
export interface PydanticMethod {
    name: string;
    parameters: string[];
    returnType?: string;
    description?: string;
    isAsync: boolean;
}
export declare class PydanticAgentAdapter {
    private readonly logger;
    private readonly capabilityPatterns;
    discoverEntities(criteria: any): Promise<UnifiedEntity[]>;
    private findPydanticAgentFiles;
    private isPydanticAgentFile;
    private parsePydanticAgents;
    private parseSourceCode;
}
//# sourceMappingURL=PydanticAgentAdapter.d.ts.map