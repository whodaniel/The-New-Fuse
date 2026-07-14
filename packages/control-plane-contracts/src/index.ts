/**
 * @the-new-fuse/control-plane-contracts
 *
 * Public API surface for proprietary control-plane components.
 * Implementations live in fuse-control-plane / monorepo proprietary paths;
 * open-runtime stubs re-export these types only.
 *
 * @see docs/REPO_SEPARATION.md
 */

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
