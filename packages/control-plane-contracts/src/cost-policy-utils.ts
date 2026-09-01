import type {
  ExecutionBudgetSnapshot,
  MeteredExecutionDecision,
  MeteredExecutionRequest,
  ProviderRouteEstimate,
} from './cost-policy.js';

/**
 * Provider hard-limit protection is deliberately separate from tenant budget.
 * A tenant may have money remaining while the provider account is still unsafe
 * to use because an account-level cap, concurrency guard, or billing ceiling is
 * not configured.
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
 * Route preference is economic but not purely numeric:
 * local first, then included/free quota, then the least-expensive metered route.
 * Stable tie-breakers keep decisions deterministic for auditing and tests.
 */
export function rankCompatibleRoutes(
  request: MeteredExecutionRequest,
  routes: ProviderRouteEstimate[]
): ProviderRouteEstimate[] {
  return routes
    .filter((route) => isRouteCompatible(request, route))
    .slice()
    .sort((a, b) => {
      const aClass = a.provider === 'local' ? 0 : a.freeOrIncludedQuota ? 1 : 2;
      const bClass = b.provider === 'local' ? 0 : b.freeOrIncludedQuota ? 1 : 2;
      if (aClass !== bClass) return aClass - bClass;
      if (a.estimatedCostUsd !== b.estimatedCostUsd) {
        return a.estimatedCostUsd - b.estimatedCostUsd;
      }
      if ((a.estimatedLatencyMs ?? Number.POSITIVE_INFINITY) !== (b.estimatedLatencyMs ?? Number.POSITIVE_INFINITY)) {
        return (a.estimatedLatencyMs ?? Number.POSITIVE_INFINITY) - (b.estimatedLatencyMs ?? Number.POSITIVE_INFINITY);
      }
      return `${a.provider}:${a.route}`.localeCompare(`${b.provider}:${b.route}`);
    });
}

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
      reason: 'local-compatible-route-available',
      selectedRoute: selected,
    };
  }

  if (selected.freeOrIncludedQuota && selected.estimatedCostUsd <= 0) {
    return {
      decision: 'allow-free',
      reason: 'included-or-free-compatible-route-available',
      selectedRoute: selected,
    };
  }

  if (!context.entitlement.entitled) {
    return {
      decision: 'deny',
      reason: context.entitlement.reason || 'capability-not-entitled',
      selectedRoute: selected,
    };
  }

  if (
    context.entitlement.allowedCapabilities?.length &&
    !context.entitlement.allowedCapabilities.includes(context.request.capability)
  ) {
    return {
      decision: 'deny',
      reason: 'capability-not-in-entitlement-scope',
      selectedRoute: selected,
    };
  }

  if (!context.budget) {
    return {
      decision: 'deny',
      reason: 'metered-route-has-no-budget-snapshot',
      selectedRoute: selected,
    };
  }

  if (selected.estimatedCostUsd > context.budget.remainingUsd) {
    return {
      decision: 'defer',
      reason: 'tenant-budget-insufficient',
      selectedRoute: selected,
    };
  }

  const hardLimit = context.providerHardLimits?.find(
    (item) => item.provider === selected.provider
  );
  if (!hardLimit?.protected) {
    return {
      decision: 'deny',
      reason: hardLimit?.reason || 'provider-hard-limit-protection-missing',
      selectedRoute: selected,
    };
  }

  return {
    decision: 'allow-metered',
    reason: 'entitled-budgeted-and-provider-protected',
    selectedRoute: selected,
  };
}
