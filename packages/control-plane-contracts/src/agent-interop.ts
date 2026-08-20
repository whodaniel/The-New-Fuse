/**
 * Public contracts for TNF cross-agent capability and activity exchange.
 *
 * These shapes intentionally exchange attestations and references, not raw
 * provider credentials or complete private conversation histories. An adapter
 * may expose only the fields the user/workspace has authorized.
 */

export type AgentPlatformId =
  | 'tnf'
  | 'openai-chatgpt'
  | 'openai-codex'
  | 'anthropic-claude'
  | 'anthropic-cowork'
  | 'anthropic-claude-code'
  | 'google-gemini'
  | 'google-gemini-spark'
  | 'cursor'
  | 'github-copilot'
  | (string & {});

export interface AgentCapabilityClaim {
  id: string;
  label: string;
  category?: string;
  status: 'available' | 'enabled' | 'disabled' | 'unknown' | 'degraded';
  source: 'platform-doc' | 'adapter-observation' | 'user-assertion' | 'runtime-proof';
  sourceRef?: string;
  observedAt: string;
  expiresAt?: string;
  constraints?: Record<string, unknown>;
}

export interface AgentConnectorSnapshot {
  id: string;
  kind: 'mcp' | 'app' | 'plugin' | 'api' | 'filesystem' | 'browser' | 'git' | 'other';
  displayName?: string;
  status: 'connected' | 'available' | 'disabled' | 'unknown' | 'error';
  scopes?: string[];
  /** Stable identifier or URL only when safe. Never raw credentials. */
  endpointRef?: string;
  observedAt: string;
}

export interface AgentScheduleSnapshot {
  id: string;
  name?: string;
  kind: 'time' | 'event' | 'monitor' | 'manual' | 'unknown';
  status: 'enabled' | 'paused' | 'completed' | 'error' | 'unknown';
  scheduleSummary?: string;
  nextRunAt?: string;
  lastRunAt?: string;
  taskRef?: string;
  observedAt: string;
}

export interface AgentInstanceSnapshot {
  snapshotId: string;
  platform: AgentPlatformId;
  product?: string;
  instanceRef: string;
  /** Pseudonymous or tenant-local reference; do not require a legal identity. */
  subjectRef?: string;
  workspaceRef?: string;
  capturedAt: string;
  expiresAt?: string;
  capabilities: AgentCapabilityClaim[];
  connectors?: AgentConnectorSnapshot[];
  schedules?: AgentScheduleSnapshot[];
  activeTaskRefs?: string[];
  metadata?: Record<string, unknown>;
  provenance: {
    adapterId: string;
    adapterVersion?: string;
    evidenceRefs?: string[];
    signatureRef?: string;
  };
}

export interface AgentActivityReceipt {
  receiptId: string;
  platform: AgentPlatformId;
  product?: string;
  instanceRef: string;
  subjectRef?: string;
  workspaceRef?: string;
  taskRef: string;
  parentTaskRef?: string;
  capabilityIds?: string[];
  startedAt: string;
  completedAt?: string;
  outcome: 'succeeded' | 'failed' | 'cancelled' | 'deferred' | 'in-progress';
  summary: string;
  artifactRefs?: string[];
  externalOperationRefs?: string[];
  costAuthorizationRef?: string;
  meteredUsageRef?: string;
  metadata?: Record<string, unknown>;
  provenance: {
    adapterId: string;
    observedAt: string;
    signatureRef?: string;
  };
}

export interface AgentInteropAdapter {
  readonly adapterId: string;
  readonly platform: AgentPlatformId;

  /**
   * Return the current permissioned state of the connected platform instance.
   * Implementations must omit secrets and may omit private task details.
   */
  captureInstanceSnapshot(): Promise<AgentInstanceSnapshot>;

  /**
   * Return activity receipts newer than the supplied cursor/time boundary.
   * Adapters should use provider operation IDs or stable task IDs for dedupe.
   */
  listActivityReceipts(input?: {
    after?: string;
    cursor?: string;
    limit?: number;
  }): Promise<{ receipts: AgentActivityReceipt[]; cursor?: string }>;
}

/**
 * Durable TNF-side ledger abstraction. Hosted implementations may use the
 * canonical durable business-state store; local implementations may use a
 * private file/SQLite store. The contract is provider-neutral.
 */
export interface AgentActivityLedger {
  upsertSnapshot(snapshot: AgentInstanceSnapshot): Promise<void>;
  appendReceipt(receipt: AgentActivityReceipt): Promise<'inserted' | 'duplicate'>;
  getLatestSnapshot(input: {
    platform: AgentPlatformId;
    instanceRef: string;
    subjectRef?: string;
    workspaceRef?: string;
  }): Promise<AgentInstanceSnapshot | null>;
  listReceipts(input: {
    subjectRef?: string;
    workspaceRef?: string;
    platform?: AgentPlatformId;
    after?: string;
    limit?: number;
  }): Promise<AgentActivityReceipt[]>;
}
