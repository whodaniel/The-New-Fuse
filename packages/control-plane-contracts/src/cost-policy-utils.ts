import type {
  ExecutionBudgetSnapshot,
  MeteredExecutionDecision,
  MeteredExecutionRequest,
  ProviderRouteEstimate,
} from './cost-policy.js';

/**
 * Public observations/contracts retained for compatibility.
 *
 * Founder-IP boundary: the hosted TNF route-selection algorithm, provider
 * economics, entitlement/budget composition and optimization weights are
 * proprietary orchestration intelligence. This public module performs only
 * objective compatibility filtering plus a deterministic local-first fallback.
 */
export interface ProviderHardLimitSnapshot {
  provider: ProviderRouteEstimate['provider'];
  protected: boolean;
  capturedAt: string;
  reason?: string;
  maxConcurrentOperations?: number;
  maxInstances?: number;
  maxCpu?: number;
  accountHardLimitUsd?: number;
}

export interface EntitlementSnapshot {
  entitled: boolean;
  tier: string;
  capturedAt: string;
  reason?: string;
  allowedCapabilities?: string[];
}

export interface RouteSelectionContext {
  request: MeteredExecutionRequest;
  entitlement: EntitlementSnapshot;
  budget?: ExecutionBudgetSnapshot;
  providerHardLimits?: ProviderHardLimitSnapshot[];
}

export interface RoutePolicyResult {
  decision: MeteredExecutionDecision;
  reason: string;
  selectedRoute?: ProviderRouteEstimate;
}

const ISOLATION_RANK: Record<NonNullable<ProviderRouteEstimate['isolation']>, number> = {
  shared: 0,
  tenant: 1,
  process: 2,
  container: 3,
  vm: 4,
};

/**
 * Objective compatibility is part of the public contract: an independent
 * implementation can determine whether a route satisfies declared durability,
 * latency and isolation requirements without learning hosted policy.
 */
export function isRouteCompatible(
  request: MeteredExecutionRequest,
  route: ProviderRouteEstimate
): boolean {
  const requirements = request.requirements;
  if (!requirements) return true;

  if (requirements.durable === true && !route.durable) return false;

  if (
    requirements.maxLatencyMs !== undefined &&
    route.estimatedLatencyMs !== undefined &&
    route.estimatedLatencyMs > requirements.maxLatencyMs
  ) {
    return false;
  }

  if (requirements.isolation) {
    const required = ISOLATION_RANK[requirements.isolation];
    const actual = route.isolation ? ISOLATION_RANK[route.isolation] : -1;
    if (actual < required) return false;
  }

  return true;
}

/**
 * Deterministic public/local fallback.
 *
 * The fallback deliberately does NOT rank by price, quota, latency beyond hard
 * compatibility, entitlement, provider economics, reliability or learned
 * quality. Local routes are surfaced first; remaining compatible routes receive
 * a stable identifier order only so callers can display/inspect them.
 */
export function rankCompatibleRoutes(
  request: MeteredExecutionRequest,
  routes: ProviderRouteEstimate[]
): ProviderRouteEstimate[] {
  return routes
    .filter((route) => isRouteCompatible(request, route))
    .slice()
    .sort((a, b) => {
      const aLocal = a.provider === 'local' ? 0 : 1;
      const bLocal = b.provider === 'local' ? 0 : 1;
      if (aLocal !== bLocal) return aLocal - bLocal;
      return `${a.provider}:${a.route}`.localeCompare(`${b.provider}:${b.route}`);
    });
}

/**
 * Public compatibility fallback for legacy callers.
 *
 * Local execution can be allowed from public compatibility data. Any non-local
 * economic/entitlement/provider decision is deferred to a configured policy
 * authority (hosted TNF or another operator-supplied implementation).
 */
export function evaluateRoutePolicy(
  context: RouteSelectionContext,
  compatibleRoutes: ProviderRouteEstimate[]
): RoutePolicyResult {
  const ranked = rankCompatibleRoutes(context.request, compatibleRoutes);
  const selected = ranked[0];

  if (!selected) {
    return { decision: 'deny', reason: 'no-compatible-route' };
  }

  if (selected.provider === 'local') {
    return {
      decision: 'allow-local',
      reason: 'public-local-compatible-route-available',
      selectedRoute: selected,
    };
  }

  return {
    decision: 'defer',
    reason: 'hosted-or-operator-route-policy-required',
    selectedRoute: selected,
  };
}
