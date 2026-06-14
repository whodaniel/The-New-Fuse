export interface ProjectCommandDef {
    name: string;
    filePath: string;
    content: string;
}
export interface ProjectAgentDef {
    name: string;
    filePath: string;
    content: string;
}
export type ProjectScaffoldKind = 'command' | 'agent' | 'skill' | 'workflow' | 'mcp-server';
export interface ProjectScaffoldResult {
    kind: ProjectScaffoldKind;
    name: string;
    filePath: string;
    created: boolean;
    overwritten: boolean;
}
export interface ProjectConfig {
    $schema?: string;
    model?: string;
    provider?: string;
    permission?: {
        bash: Record<string, 'allow' | 'deny'>;
        read: Record<string, 'allow' | 'deny'>;
        external_directory: Record<string, 'allow' | 'deny'>;
    };
    mcp?: Record<string, {
        type?: 'local' | 'remote' | 'sse' | 'ws';
        command: string[] | string;
        environment?: Record<string, string>;
        env?: Record<string, string>;
        enabled?: boolean;
        args?: string[];
        cwd?: string;
    }>;
    custom?: Record<string, unknown>;
}
export declare class ProjectConfigService {
    private projectRoot;
    private config;
    private commands;
    private agents;
    constructor(projectRoot: string);
    private loadConfig;
    private loadCommandDefs;
    private loadAgentDefs;
    getConfig(): ProjectConfig | null;
    getCommands(): ProjectCommandDef[];
    getAgents(): ProjectAgentDef[];
    getConfigPath(): string | null;
    createScaffold(kind: ProjectScaffoldKind, rawName: string, options?: {
        force?: boolean;
    }): ProjectScaffoldResult;
    private resolveScaffoldTarget;
    createDefaultConfig(): string;
}
//# sourceMappingURL=ProjectConfigService.d.ts.map