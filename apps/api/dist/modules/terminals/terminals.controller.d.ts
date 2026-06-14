import type { Request } from 'express';
import { TerminalGraphQueryDto } from './dto/terminal-graph-query.dto';
import { TerminalsService } from './terminals.service';
export declare class TerminalsController {
    private readonly terminalsService;
    constructor(terminalsService: TerminalsService);
    getTerminalGraph(query: TerminalGraphQueryDto, req: Request & {
        user?: {
            id?: string;
            email?: string | null;
            role?: string | null;
            roles?: unknown;
            permissions?: unknown;
        };
    }): Promise<{
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
            nodes: {
                id: string;
                type: "tenant" | "host" | "terminal" | "pane" | "process" | "runtime";
                label: string;
                data: Record<string, unknown>;
            }[];
            edges: {
                id: string;
                source: string;
                target: string;
                type: string;
                data?: Record<string, unknown>;
            }[];
        };
        terminals: Record<string, unknown>[];
        registryContext: {
            sourcePath: string;
            indexedAgents: number;
        };
    }>;
}
//# sourceMappingURL=terminals.controller.d.ts.map