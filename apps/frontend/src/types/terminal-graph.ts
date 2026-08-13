export interface TerminalGraphQuery {
  tenantId?: string;
  limit?: number;
  includeCommands?: boolean;
  includeProcessNodes?: boolean;
}

export interface TerminalGraphNode {
  id: string;
  type: 'tenant' | 'host' | 'terminal' | 'pane' | 'process' | 'runtime';
  label: string;
  data: Record<string, unknown>;
}

export interface TerminalGraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  data?: Record<string, unknown>;
}

export interface TerminalOwnershipHint {
  runtimeId: string;
  runtimeLabel: string;
  confidence: number;
  reason: string;
  matchedAgentId: string | null;
}

export interface TerminalIdentityView {
  twid?: string;
  scope?: {
    tenant_id?: string | null;
    host_id?: string | null;
    pane_id?: string | null;
    window_id?: string | null;
    session_key?: string | null;
  };
  process?: {
    shell_pid?: number | null;
    pgid?: number | null;
    sid?: number | null;
    process_count?: number | null;
  };
  pty?: {
    path?: string | null;
    inode?: number | null;
  };
  multiplexer?: Record<string, unknown> | null;
  active_commands?: string[];
  ownershipHints?: TerminalOwnershipHint[];
  [key: string]: unknown;
}

export interface TerminalGraphResponse {
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
    nodes: TerminalGraphNode[];
    edges: TerminalGraphEdge[];
  };
  terminals: TerminalIdentityView[];
  message?: string;
  registryContext: {
    sourcePath: string | null;
    indexedAgents: number;
  };
}

