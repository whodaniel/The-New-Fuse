"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var TerminalsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalsService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
let TerminalsService = TerminalsService_1 = class TerminalsService {
    constructor() {
        this.logger = new common_1.Logger(TerminalsService_1.name);
    }
    async getTerminalGraph(query) {
        const snapshotPath = process.env.TWIP_INVENTORY_SNAPSHOT_PATH
            ? path.resolve(process.env.TWIP_INVENTORY_SNAPSHOT_PATH)
            : path.join(process.cwd(), 'data', 'protocols', 'twip-inventory.snapshot.json');
        const registryPath = process.env.TNF_AGENT_REGISTRY_AGENTS_PATH
            ? path.resolve(process.env.TNF_AGENT_REGISTRY_AGENTS_PATH)
            : path.join(process.cwd(), 'data', 'agent-registry', 'agents.json');
        const generatedAt = new Date().toISOString();
        const snapshot = await this.loadInventorySnapshot(snapshotPath);
        if (!snapshot) {
            return this.emptyGraph({
                generatedAt,
                snapshotPath,
                message: 'TWIP inventory snapshot not found. Run twip_scan_terminals in relay MCP to populate it.',
            });
        }
        const allTerminals = Array.isArray(snapshot.terminals) ? snapshot.terminals : [];
        const filteredByTenant = query.tenantId
            ? allTerminals.filter((identity) => identity.scope?.tenant_id === query.tenantId)
            : allTerminals;
        const limited = filteredByTenant.slice(0, query.limit);
        const agentIds = await this.loadRegistryAgentIds(registryPath);
        const graph = this.buildGraph({
            terminals: limited,
            includeCommands: query.includeCommands,
            includeProcessNodes: query.includeProcessNodes,
            agentIds,
        });
        return {
            available: true,
            generatedAt,
            source: {
                snapshotPath,
                mirroredFrom: snapshot.mirrored_from || 'tnf://twip/inventory',
                mirroredAt: snapshot.mirrored_at || null,
                meta: snapshot.meta || {},
            },
            safety: {
                commandsRedacted: !query.includeCommands,
                tenantScopedFilter: query.tenantId || null,
            },
            summary: {
                requestedLimit: query.limit,
                totalFromSnapshot: allTerminals.length,
                totalAfterTenantFilter: filteredByTenant.length,
                returnedTerminals: graph.terminals.length,
                nodeCount: graph.nodes.length,
                edgeCount: graph.edges.length,
                runtimeHintCount: graph.runtimeHintCount,
            },
            graph: {
                nodes: graph.nodes,
                edges: graph.edges,
            },
            terminals: graph.terminals,
            registryContext: {
                sourcePath: registryPath,
                indexedAgents: agentIds.length,
            },
        };
    }
    async loadInventorySnapshot(snapshotPath) {
        try {
            const raw = await fs.readFile(snapshotPath, 'utf8');
            const parsed = JSON.parse(raw);
            return parsed;
        }
        catch (error) {
            this.logger.debug(`Unable to read TWIP inventory snapshot at ${snapshotPath}: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
    async loadRegistryAgentIds(registryPath) {
        try {
            const raw = await fs.readFile(registryPath, 'utf8');
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                return [];
            }
            return parsed
                .map((entry) => String(entry?.id || '')
                .trim()
                .toLowerCase())
                .filter((entry) => entry.length > 0);
        }
        catch (_error) {
            return [];
        }
    }
    emptyGraph(input) {
        return {
            available: false,
            generatedAt: input.generatedAt,
            source: {
                snapshotPath: input.snapshotPath,
                mirroredFrom: 'tnf://twip/inventory',
                mirroredAt: null,
                meta: {},
            },
            safety: {
                commandsRedacted: true,
                tenantScopedFilter: null,
            },
            summary: {
                requestedLimit: 0,
                totalFromSnapshot: 0,
                totalAfterTenantFilter: 0,
                returnedTerminals: 0,
                nodeCount: 0,
                edgeCount: 0,
                runtimeHintCount: 0,
            },
            graph: {
                nodes: [],
                edges: [],
            },
            terminals: [],
            message: input.message,
            registryContext: {
                sourcePath: null,
                indexedAgents: 0,
            },
        };
    }
    buildGraph(input) {
        const nodeMap = new Map();
        const edgeMap = new Map();
        const terminalsWithHints = [];
        let runtimeHintCount = 0;
        const addNode = (node) => {
            if (!nodeMap.has(node.id)) {
                nodeMap.set(node.id, node);
            }
        };
        const addEdge = (edge) => {
            const id = `edge:${edge.source}>${edge.type}>${edge.target}`;
            if (!edgeMap.has(id)) {
                edgeMap.set(id, { id, ...edge });
            }
        };
        input.terminals.forEach((terminal, index) => {
            const twid = String(terminal.twid || `unknown-${index}`);
            const terminalNodeId = `terminal:${twid}`;
            const tenantId = String(terminal.scope?.tenant_id || 'unknown');
            const hostId = String(terminal.scope?.host_id || 'unknown');
            const paneId = terminal.scope?.pane_id ? String(terminal.scope.pane_id) : null;
            const shellPid = typeof terminal.process?.shell_pid === 'number' ? terminal.process.shell_pid : null;
            const runtimeHints = this.deriveRuntimeHints(terminal, input.agentIds);
            runtimeHintCount += runtimeHints.length;
            const sanitized = this.sanitizeTerminal(terminal, input.includeCommands);
            terminalsWithHints.push({
                ...sanitized,
                ownershipHints: runtimeHints,
            });
            addNode({
                id: `tenant:${tenantId}`,
                type: 'tenant',
                label: tenantId,
                data: { tenantId },
            });
            addNode({
                id: `host:${hostId}`,
                type: 'host',
                label: hostId,
                data: { hostId },
            });
            addNode({
                id: terminalNodeId,
                type: 'terminal',
                label: sanitized.pty?.path ? String(sanitized.pty.path) : twid,
                data: {
                    twid,
                    ptyPath: sanitized.pty?.path || null,
                    paneId,
                    windowId: sanitized.scope?.window_id || null,
                    multiplexerKind: sanitized.multiplexer && typeof sanitized.multiplexer === 'object'
                        ? String(sanitized.multiplexer.kind || 'unknown')
                        : null,
                },
            });
            addEdge({ source: `tenant:${tenantId}`, target: terminalNodeId, type: 'tenant_owns' });
            addEdge({ source: `host:${hostId}`, target: terminalNodeId, type: 'host_hosts_terminal' });
            if (paneId) {
                addNode({
                    id: `pane:${paneId}`,
                    type: 'pane',
                    label: paneId,
                    data: { paneId },
                });
                addEdge({ source: terminalNodeId, target: `pane:${paneId}`, type: 'terminal_in_pane' });
            }
            if (input.includeProcessNodes && typeof shellPid === 'number') {
                const processId = `process:${shellPid}`;
                addNode({
                    id: processId,
                    type: 'process',
                    label: String(shellPid),
                    data: {
                        shellPid,
                        pgid: typeof sanitized.process?.pgid === 'number'
                            ? sanitized.process.pgid
                            : sanitized.process?.pgid,
                        sid: typeof sanitized.process?.sid === 'number'
                            ? sanitized.process.sid
                            : sanitized.process?.sid,
                    },
                });
                addEdge({ source: terminalNodeId, target: processId, type: 'terminal_shell_process' });
            }
            runtimeHints.forEach((hint) => {
                const runtimeId = `runtime:${hint.runtimeId}`;
                addNode({
                    id: runtimeId,
                    type: 'runtime',
                    label: hint.runtimeLabel,
                    data: {
                        runtimeId: hint.runtimeId,
                        matchedAgentId: hint.matchedAgentId,
                    },
                });
                addEdge({
                    source: terminalNodeId,
                    target: runtimeId,
                    type: 'terminal_runtime_hint',
                    data: {
                        confidence: hint.confidence,
                        reason: hint.reason,
                        matchedAgentId: hint.matchedAgentId,
                    },
                });
            });
        });
        const nodes = Array.from(nodeMap.values()).sort((a, b) => a.id.localeCompare(b.id));
        const edges = Array.from(edgeMap.values()).sort((a, b) => a.id.localeCompare(b.id));
        return {
            nodes,
            edges,
            terminals: terminalsWithHints,
            runtimeHintCount,
        };
    }
    sanitizeTerminal(terminal, includeCommands) {
        const clone = JSON.parse(JSON.stringify(terminal || {}));
        if (!includeCommands) {
            delete clone.active_commands;
            delete clone.context_excerpt;
        }
        return clone;
    }
    deriveRuntimeHints(terminal, agentIds) {
        const commands = Array.isArray(terminal.active_commands)
            ? terminal.active_commands.map((entry) => String(entry || ''))
            : [];
        if (commands.length === 0)
            return [];
        const profiles = [
            {
                runtimeId: 'codex',
                runtimeLabel: 'Codex Runtime',
                confidence: 0.88,
                patterns: [/\bcodex\b/i, /\bopenai\b/i],
                agentNeedles: ['codex', 'openai'],
            },
            {
                runtimeId: 'claude',
                runtimeLabel: 'Claude Runtime',
                confidence: 0.86,
                patterns: [/\bclaude\b/i, /\banthropic\b/i],
                agentNeedles: ['claude', 'anthropic'],
            },
            {
                runtimeId: 'gemini',
                runtimeLabel: 'Gemini Runtime',
                confidence: 0.84,
                patterns: [/\bgemini\b/i, /\bgoogle\b/i],
                agentNeedles: ['gemini', 'google'],
            },
            {
                runtimeId: 'openclaw',
                runtimeLabel: 'OpenClaw Runtime',
                confidence: 0.9,
                patterns: [/\bopenclaw\b/i, /\bpicoclaw\b/i, /\bclaw\b/i],
                agentNeedles: ['openclaw', 'claw'],
            },
            {
                runtimeId: 'tnf-relay',
                runtimeLabel: 'TNF Relay Runtime',
                confidence: 0.8,
                patterns: [/\brelay\b/i, /\btnf\b/i],
                agentNeedles: ['relay', 'tnf'],
            },
        ];
        const hints = [];
        for (const profile of profiles) {
            const matched = commands.some((command) => profile.patterns.some((pattern) => pattern.test(command)));
            if (!matched)
                continue;
            hints.push({
                runtimeId: profile.runtimeId,
                runtimeLabel: profile.runtimeLabel,
                confidence: profile.confidence,
                reason: 'Matched runtime signature from active process sample',
                matchedAgentId: this.matchRegistryAgentId(agentIds, profile.agentNeedles),
            });
        }
        return hints;
    }
    matchRegistryAgentId(agentIds, needles) {
        const normalizedNeedles = needles.map((needle) => needle.toLowerCase());
        for (const agentId of agentIds) {
            if (normalizedNeedles.some((needle) => agentId.includes(needle))) {
                return agentId;
            }
        }
        return null;
    }
};
exports.TerminalsService = TerminalsService;
exports.TerminalsService = TerminalsService = TerminalsService_1 = __decorate([
    (0, common_1.Injectable)()
], TerminalsService);
//# sourceMappingURL=terminals.service.js.map