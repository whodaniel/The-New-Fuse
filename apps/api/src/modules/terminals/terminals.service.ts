import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { TerminalGraphQueryDto } from './dto/terminal-graph-query.dto.js';

type TwipScope = {
  tenant_id?: string | null;
  host_id?: string | null;
  pane_id?: string | null;
  window_id?: string | null;
  session_key?: string | null;
};

type TwipProcess = {
  shell_pid?: number | null;
  pgid?: number | null;
  sid?: number | null;
  process_count?: number | null;
};

type TwipTerminalIdentity = {
  twid?: string | null;
  scope?: TwipScope;
  process?: TwipProcess;
  pty?: { path?: string | null };
  multiplexer?: Record<string, unknown> | null;
  active_commands?: string[];
  [key: string]: unknown;
};

type TwipInventorySnapshot = {
  mirrored_from?: string;
  mirrored_at?: string;
  meta?: Record<string, unknown>;
  total?: number;
  terminals?: TwipTerminalIdentity[];
};

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

type RuntimeOwnershipHint = {
  runtimeId: string;
  runtimeLabel: string;
  confidence: number;
  reason: string;
  matchedAgentId: string | null;
};

@Injectable()
export class TerminalsService {
  private readonly logger = new Logger(TerminalsService.name);

  async getTerminalGraph(query: TerminalGraphQueryDto) {
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
        message:
          'TWIP inventory snapshot not found. Run twip_scan_terminals in relay MCP to populate it.',
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

  private async loadInventorySnapshot(snapshotPath: string): Promise<TwipInventorySnapshot | null> {
    try {
      const raw = await fs.readFile(snapshotPath, 'utf8');
      const parsed = JSON.parse(raw) as TwipInventorySnapshot;
      return parsed;
    } catch (error) {
      this.logger.debug(
        `Unable to read TWIP inventory snapshot at ${snapshotPath}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return null;
    }
  }

  private async loadRegistryAgentIds(registryPath: string): Promise<string[]> {
    try {
      const raw = await fs.readFile(registryPath, 'utf8');
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed
        .map((entry: any) =>
          String(entry?.id || '')
            .trim()
            .toLowerCase()
        )
        .filter((entry: string) => entry.length > 0);
    } catch (_error) {
      return [];
    }
  }

  private emptyGraph(input: { generatedAt: string; snapshotPath: string; message: string }) {
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

  private buildGraph(input: {
    terminals: TwipTerminalIdentity[];
    includeCommands: boolean;
    includeProcessNodes: boolean;
    agentIds: string[];
  }) {
    const nodeMap = new Map<string, GraphNode>();
    const edgeMap = new Map<string, GraphEdge>();
    const terminalsWithHints: Array<Record<string, unknown>> = [];
    let runtimeHintCount = 0;

    const addNode = (node: GraphNode) => {
      if (!nodeMap.has(node.id)) {
        nodeMap.set(node.id, node);
      }
    };

    const addEdge = (edge: Omit<GraphEdge, 'id'>) => {
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
      const shellPid =
        typeof terminal.process?.shell_pid === 'number' ? terminal.process.shell_pid : null;
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
          multiplexerKind:
            sanitized.multiplexer && typeof sanitized.multiplexer === 'object'
              ? String((sanitized.multiplexer as Record<string, unknown>).kind || 'unknown')
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
            pgid:
              typeof sanitized.process?.pgid === 'number'
                ? sanitized.process.pgid
                : sanitized.process?.pgid,
            sid:
              typeof sanitized.process?.sid === 'number'
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

  private sanitizeTerminal(
    terminal: TwipTerminalIdentity,
    includeCommands: boolean
  ): TwipTerminalIdentity {
    const clone = JSON.parse(JSON.stringify(terminal || {})) as TwipTerminalIdentity;
    if (!includeCommands) {
      delete clone.active_commands;
      delete clone.context_excerpt;
    }
    return clone;
  }

  private deriveRuntimeHints(
    terminal: TwipTerminalIdentity,
    agentIds: string[]
  ): RuntimeOwnershipHint[] {
    const commands = Array.isArray(terminal.active_commands)
      ? terminal.active_commands.map((entry) => String(entry || ''))
      : [];
    if (commands.length === 0) return [];

    const profiles: Array<{
      runtimeId: string;
      runtimeLabel: string;
      confidence: number;
      patterns: RegExp[];
      agentNeedles: string[];
    }> = [
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

    const hints: RuntimeOwnershipHint[] = [];
    for (const profile of profiles) {
      const matched = commands.some((command) =>
        profile.patterns.some((pattern) => pattern.test(command))
      );
      if (!matched) continue;
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

  private matchRegistryAgentId(agentIds: string[], needles: string[]): string | null {
    const normalizedNeedles = needles.map((needle) => needle.toLowerCase());
    for (const agentId of agentIds) {
      if (normalizedNeedles.some((needle) => agentId.includes(needle))) {
        return agentId;
      }
    }
    return null;
  }
}
