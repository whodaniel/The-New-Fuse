import { TerminalGraphQueryDto } from './dto/terminal-graph-query.dto';
type GraphNode = {
    id: string;
    type: 'tenant' | 'host' | 'terminal' | 'pane' | 'process' | 'runtime';
    label: string;
    data: Record<string, unknown>;
};
type GraphEdge = {
    id: string;
    source: string;
    target: string;
    type: string;
    data?: Record<string, unknown>;
};
export declare class TerminalsService {
    private readonly logger;
    getTerminalGraph(query: TerminalGraphQueryDto): Promise<{
        available: boolean;
        generatedAt: string;
        source: {
            snapshotPath: string;
            mirroredFrom: string;
            mirroredAt: null;
            meta: {};
        };
        safety: {
            commandsRedacted: boolean;
            tenantScopedFilter: null;
        };
        summary: {
            requestedLimit: number;
            totalFromSnapshot: number;
            totalAfterTenantFilter: number;
            returnedTerminals: number;
            nodeCount: number;
            edgeCount: number;
            runtimeHintCount: number;
        };
        graph: {
            nodes: never[];
            edges: never[];
        };
        terminals: never[];
        message: string;
        registryContext: {
            sourcePath: null;
            indexedAgents: number;
        };
    } | {
        available: boolean;
        generatedAt: string;
        source: {
            snapshotPath: string;
            mirroredFrom: string;
            mirroredAt: string | null;
            meta: Record<string, unknown>;
        };
        safety: {
            commandsRedacted: boolean;
            tenantScopedFilter: string | null;
        };
        summary: {
            requestedLimit: number;
            totalFromSnapshot: number;
            totalAfterTenantFilter: number;
            returnedTerminals: number;
            nodeCount: number;
            edgeCount: number;
            runtimeHintCount: number;
        };
        graph: {
            nodes: GraphNode[];
            edges: GraphEdge[];
        };
        terminals: Record<string, unknown>[];
        registryContext: {
            sourcePath: string;
            indexedAgents: number;
        };
    }>;
    private loadInventorySnapshot;
    private loadRegistryAgentIds;
    private emptyGraph;
    private buildGraph;
    private sanitizeTerminal;
    private deriveRuntimeHints;
    private matchRegistryAgentId;
}
export {};
//# sourceMappingURL=terminals.service.d.ts.map