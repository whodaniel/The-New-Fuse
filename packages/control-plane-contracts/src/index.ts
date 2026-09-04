/**
 * @the-new-fuse/control-plane-contracts
 *
 * Public API surface for proprietary control-plane components.
 * Implementations live in fuse-control-plane / monorepo proprietary paths;
 * open-runtime stubs re-export these types only.
 *
 * @see docs/REPO_SEPARATION.md
 */

/**
 * Agent authority: environment-adaptive trust roots, UCAN-shaped capability
 * grants, and the elevation approval channel. Local providers live in the open
 * runtime; the hosted root implements the same contract. — DIRECTIVES.md D23
 */
export * from './authority.js';
export * from './authority-primitives.js';
export * from './grant-issuer.js';

/** Local-first / user-funded SaaS metering and route authorization contract. */
export * from './cost-policy.js';

/** Deterministic least-cost compatibility and hard-limit policy helpers. */
export * from './cost-policy-utils.js';

/** Cross-agent capability snapshots and activity receipts. */
export * from './agent-interop.js';

/** Master Clock timing / connection configuration (public shape). */
export interface MasterClockConfig {
  heartbeatIntervalMs: number;
  stallThresholdMs: number;
  recoveryIntervalMs: number;
  relayUrl: string;
  redisUrl?: string;
  ledgerApiBase?: string;
  channels: string[];
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/** One Master Clock heartbeat / sync signal on the federation bus. */
export interface MasterClockSignal {
  type: 'heartbeat' | 'stall' | 'recovery' | 'super-cycle' | 'self-prompt';
  channel: string;
  timestamp: string;
  agentId?: string;
  payload?: Record<string, unknown>;
}

/** Broker Agent runtime configuration (public shape). */
export interface BrokerConfig {
  redisUrl?: string;
  ledgerApiBase?: string;
  taskQueueKey: string;
  decisionChannel: string;
  ingressChannel: string;
  egressPrefix: string;
  heartbeatChannel: string;
  agentRegistryKey: string;
  agentStaleMs: number;
  policyMode: 'strict' | 'permissive' | string;
  federationGateMode: 'enforce' | 'warn' | 'off' | string;
  heartbeatIntervalMs: number;
}

/** Shared policy decision emitted by Broker / Director surfaces. */
export type BrokerPolicyDecision = 'allow' | 'escalate' | 'deny';

export interface BrokerPolicyResult {
  decision: BrokerPolicyDecision;
  reason: string;
  gate?: string;
  metadata?: Record<string, unknown>;
}
