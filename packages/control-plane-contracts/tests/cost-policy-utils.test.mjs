import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateRoutePolicy, rankCompatibleRoutes } from '../dist/cost-policy-utils.js';

const request = {
  tenantId: 'tenant:test',
  workspaceId: 'workspace:test',
  capability: 'browser.compute',
  entitlementTier: 'pro',
  fundingTier: 'metered-user-funded',
  idempotencyKey: 'idem:test',
  requestedAt: '2026-08-20T00:00:00Z',
  requirements: { durable: true, isolation: 'container' }
};

const entitlement = {
  entitled: true,
  tier: 'pro',
  capturedAt: '2026-08-20T00:00:00Z',
  allowedCapabilities: ['browser.compute']
};

const budget = {
  currency: 'USD',
  period: 'month',
  hardLimitUsd: 10,
  spentUsd: 1,
  reservedUsd: 0,
  remainingUsd: 9,
  capturedAt: '2026-08-20T00:00:00Z'
};

test('local route always ranks before free and metered routes', () => {
  const ranked = rankCompatibleRoutes(request, [
    { provider: 'gcp', route: 'cloud-run', estimatedCostUsd: 0.02, durable: true, isolation: 'container' },
    { provider: 'cloudflare', route: 'included-sandbox', estimatedCostUsd: 0, durable: true, isolation: 'container', freeOrIncludedQuota: true },
    { provider: 'local', route: 'local-container', estimatedCostUsd: 0, durable: true, isolation: 'container' }
  ]);
  assert.equal(ranked[0].provider, 'local');
});

test('free included route is allowed without consuming tenant budget', () => {
  const result = evaluateRoutePolicy(
    { request, entitlement: { ...entitlement, entitled: false } },
    [{ provider: 'cloudflare', route: 'included', estimatedCostUsd: 0, durable: true, isolation: 'container', freeOrIncludedQuota: true }]
  );
  assert.equal(result.decision, 'allow-free');
});

test('paid route fails closed without provider hard-limit protection', () => {
  const result = evaluateRoutePolicy(
    { request, entitlement, budget, providerHardLimits: [] },
    [{ provider: 'gcp', route: 'cloud-run', estimatedCostUsd: 0.02, durable: true, isolation: 'container' }]
  );
  assert.equal(result.decision, 'deny');
  assert.equal(result.reason, 'provider-hard-limit-protection-missing');
});

test('paid route defers when tenant budget is insufficient', () => {
  const result = evaluateRoutePolicy(
    {
      request,
      entitlement,
      budget: { ...budget, remainingUsd: 0.01 },
      providerHardLimits: [{ provider: 'gcp', protected: true, capturedAt: '2026-08-20T00:00:00Z' }]
    },
    [{ provider: 'gcp', route: 'cloud-run', estimatedCostUsd: 0.02, durable: true, isolation: 'container' }]
  );
  assert.equal(result.decision, 'defer');
  assert.equal(result.reason, 'tenant-budget-insufficient');
});

test('paid route is allowed only when entitlement, budget, and hard-limit protection all pass', () => {
  const result = evaluateRoutePolicy(
    {
      request,
      entitlement,
      budget,
      providerHardLimits: [{ provider: 'gcp', protected: true, capturedAt: '2026-08-20T00:00:00Z' }]
    },
    [{ provider: 'gcp', route: 'cloud-run', estimatedCostUsd: 0.02, durable: true, isolation: 'container' }]
  );
  assert.equal(result.decision, 'allow-metered');
  assert.equal(result.selectedRoute.provider, 'gcp');
});
