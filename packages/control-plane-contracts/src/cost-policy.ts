/**
 * Public contract for TNF's local-first / user-funded SaaS execution gate.
 *
 * Implementations must authorize a metered route before durable enqueue and
 * re-authorize immediately before execution. Provider adapters remain behind
 * this contract so TNF can choose the least-expensive compatible route without
 * coupling the harness to one cloud vendor.
 */

export type ExecutionFundingTier =
  | 'local'
  | 'shared-free'
  | 'metered-user-funded'
  | 'reserved-enterprise';

export type MeteredProvider =
  | 'local'
  | 'cloudflare'
  | 'supabase'
  | 'upstash'
  | 'gcp'
  | 'github'
  | (string & {});

export interface ProviderRouteEstimate {
  provider: MeteredProvider;
  route: string;
  estimatedCostUsd: number;
  estimatedLatencyMs?: number;
  durable: boolean;
  isolation?: 'shared' | 'tenant' | 'process' | 'container' | 'vm';
  freeOrIncludedQuota?: boolean;
  metadata?: Record<string, unknown>;
}

export interface MeteredExecutionRequest {
  tenantId: string;
  workspaceId: string;
  userId?: string;
  capability: string;
  entitlementTier: string;
  fundingTier: ExecutionFundingTier;
  idempotencyKey: string;
  requestedAt: string;
  requirements?: {
    maxLatencyMs?: number;
    durable?: boolean;
    isolation?: ProviderRouteEstimate['isolation'];
    region?: string;
  };
}

export interface ExecutionBudgetSnapshot {
  currency: 'USD' | string;
  period: 'request' | 'day' | 'month' | string;
  hardLimitUsd: number;
  spentUsd: number;
  reservedUsd: number;
  remainingUsd: number;
  capturedAt: string;
}

export type MeteredExecutionDecision =
  | 'allow-local'
  | 'allow-free'
  | 'allow-metered'
  | 'defer'
  | 'deny';

export interface MeteredExecutionAuthorization {
  decision: MeteredExecutionDecision;
  reason: string;
  request: MeteredExecutionRequest;
  selectedRoute?: ProviderRouteEstimate;
  budget?: ExecutionBudgetSnapshot;
  authorizationId: string;
  expiresAt?: string;
}

export interface UsageReceipt {
  authorizationId: string;
  tenantId: string;
  workspaceId: string;
  capability: string;
  provider: MeteredProvider;
  route: string;
  providerOperationId?: string;
  idempotencyKey: string;
  estimatedCostUsd: number;
  actualCostUsd?: number;
  meteredUnits?: Record<string, number>;
  startedAt: string;
  completedAt?: string;
  outcome: 'succeeded' | 'failed' | 'cancelled' | 'deferred';
  metadata?: Record<string, unknown>;
}

/**
 * Cost authority is intentionally separate from subscription entitlement.
 * A subscription may permit a feature while the tenant budget still denies a
 * specific execution. Implementations should fail closed for paid routes.
 */
export interface MeteredExecutionCostAuthority {
  authorizeBeforeEnqueue(
    request: MeteredExecutionRequest,
    compatibleRoutes: ProviderRouteEstimate[]
  ): Promise<MeteredExecutionAuthorization>;

  reauthorizeBeforeExecution(
    authorization: MeteredExecutionAuthorization
  ): Promise<MeteredExecutionAuthorization>;

  recordUsage(receipt: UsageReceipt): Promise<void>;
}
