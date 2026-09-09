/**
 * TNF DurableTask cost authority — gates enqueue and records usage.
 * Implements MeteredExecutionCostAuthority without copying Trigger pricing.
 *
 * Env:
 *   TNF_DURABLE_FREE_UNITS_MONTH  (default 1000) — included monthly cost-units
 *   TNF_DURABLE_UNIT_USD          (default 0.0001) — USD per cost-unit for estimates
 *   TNF_DURABLE_ENFORCE           (default 0) — 1 = deny when over free allowance & no credits
 */
import { Injectable, Logger } from '@nestjs/common';
import type {
  MeteredExecutionAuthorization,
  MeteredExecutionCostAuthority,
  MeteredExecutionRequest,
  ProviderRouteEstimate,
  UsageReceipt,
} from '@the-new-fuse/control-plane-contracts';
import {
  DatabaseService,
  and,
  creditBalances,
  eq,
  gte,
  usageRecords,
} from '@the-new-fuse/database';
import * as crypto from 'node:crypto';

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

@Injectable()
export class DurableTasksCostAuthority implements MeteredExecutionCostAuthority {
  private readonly logger = new Logger(DurableTasksCostAuthority.name);

  constructor(private readonly db: DatabaseService) {}

  freeUnitsMonth(): number {
    return envNumber('TNF_DURABLE_FREE_UNITS_MONTH', 1000);
  }

  unitUsd(): number {
    return envNumber('TNF_DURABLE_UNIT_USD', 0.0001);
  }

  enforce(): boolean {
    return process.env.TNF_DURABLE_ENFORCE === '1' || process.env.TNF_DURABLE_ENFORCE === 'true';
  }

  async monthSpentUnits(userId: string): Promise<number> {
    if (!isUuid(userId)) return 0;
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    try {
      const typed = await this.db.client
        .select()
        .from(usageRecords)
        .where(and(eq(usageRecords.userId, userId), gte(usageRecords.createdAt, start)));
      let units = 0;
      for (const row of typed) {
        const t = String(row.type);
        if (t === 'DURABLE_COMPUTE_UNITS' || t === 'DURABLE_RUN_INVOCATION') {
          units += Number(row.amount) || 0;
        } else if (
          t === 'CODE_EXECUTION_MINUTES' &&
          String(row.description || '').includes('durable')
        ) {
          units += Number(row.amount) || 0;
        }
      }
      return units;
    } catch (err) {
      this.logger.warn(`monthSpentUnits failed: ${err instanceof Error ? err.message : err}`);
      return 0;
    }
  }

  async creditBalanceUsd(userId: string): Promise<number> {
    if (!isUuid(userId)) return 0;
    try {
      const rows = await this.db.client
        .select()
        .from(creditBalances)
        .where(eq(creditBalances.userId, userId))
        .limit(1);
      return Number(rows[0]?.balance || 0);
    } catch {
      return 0;
    }
  }

  async authorizeBeforeEnqueue(
    request: MeteredExecutionRequest,
    compatibleRoutes: ProviderRouteEstimate[]
  ): Promise<MeteredExecutionAuthorization> {
    const userId = request.userId || request.tenantId;
    const authorizationId = `dauth_${crypto.randomBytes(8).toString('hex')}`;
    const spent = await this.monthSpentUnits(userId);
    const free = this.freeUnitsMonth();
    const remainingFree = Math.max(0, free - spent);
    const credits = await this.creditBalanceUsd(userId);
    const route = compatibleRoutes.find((r) => r.provider === 'local') ||
      compatibleRoutes[0] || {
        provider: 'local' as const,
        route: 'tnf-durable-tasks',
        estimatedCostUsd: this.unitUsd(),
        durable: true,
        isolation: 'tenant' as const,
        freeOrIncludedQuota: remainingFree > 0,
      };

    const budget = {
      currency: 'USD' as const,
      period: 'month' as const,
      hardLimitUsd: free * this.unitUsd() + credits,
      spentUsd: spent * this.unitUsd(),
      reservedUsd: route.estimatedCostUsd || this.unitUsd(),
      remainingUsd: remainingFree * this.unitUsd() + credits,
      capturedAt: new Date().toISOString(),
    };

    if (remainingFree > 0) {
      return {
        decision: 'allow-free',
        reason: `Within free durable allowance (${remainingFree.toFixed(2)} units left of ${free}/mo)`,
        request,
        selectedRoute: { ...route, freeOrIncludedQuota: true },
        budget,
        authorizationId,
      };
    }

    if (credits > 0 || request.fundingTier === 'metered-user-funded') {
      return {
        decision: 'allow-metered',
        reason: credits > 0 ? 'Using credit balance overage' : 'Metered user-funded route',
        request,
        selectedRoute: { ...route, freeOrIncludedQuota: false },
        budget,
        authorizationId,
      };
    }

    if (!this.enforce()) {
      return {
        decision: 'allow-metered',
        reason:
          'Over free allowance — soft allow (TNF_DURABLE_ENFORCE unset). Usage still recorded.',
        request,
        selectedRoute: { ...route, freeOrIncludedQuota: false },
        budget,
        authorizationId,
      };
    }

    return {
      decision: 'deny',
      reason: `Durable free allowance exhausted (${spent.toFixed(2)}/${free} units). Add credits or upgrade.`,
      request,
      selectedRoute: route,
      budget,
      authorizationId,
    };
  }

  async reauthorizeBeforeExecution(
    authorization: MeteredExecutionAuthorization
  ): Promise<MeteredExecutionAuthorization> {
    return authorization;
  }

  async recordUsage(receipt: UsageReceipt): Promise<void> {
    const userId = receipt.tenantId;
    if (!isUuid(userId)) {
      this.logger.debug(`skip usage_records — non-UUID user ${userId}`);
      return;
    }
    const units =
      receipt.meteredUnits?.costUnits ?? receipt.meteredUnits?.DURABLE_COMPUTE_UNITS ?? 0;
    const invocations = receipt.meteredUnits?.invocations ?? 1;
    const costUsd =
      receipt.actualCostUsd ?? receipt.estimatedCostUsd ?? Number(units) * this.unitUsd();

    const write = async (type: string, amount: number, description: string) => {
      try {
        await this.db.client.insert(usageRecords).values({
          userId,
          type: type as any,
          amount,
          cost: costUsd,
          description,
          metadata: JSON.stringify({
            ...receipt.metadata,
            authorizationId: receipt.authorizationId,
            provider: receipt.provider,
            route: receipt.route,
            outcome: receipt.outcome,
            idempotencyKey: receipt.idempotencyKey,
          }),
          charged: false,
        });
      } catch (err) {
        if (type.startsWith('DURABLE_')) {
          await this.db.client.insert(usageRecords).values({
            userId,
            type: 'CODE_EXECUTION_MINUTES' as any,
            amount,
            cost: costUsd,
            description: `durable:${description}`,
            metadata: JSON.stringify({
              ...receipt.metadata,
              authorizationId: receipt.authorizationId,
              durableType: type,
            }),
            charged: false,
          });
        } else {
          throw err;
        }
      }
    };

    try {
      await write(
        'DURABLE_RUN_INVOCATION',
        invocations,
        `DurableTask run ${receipt.providerOperationId || ''}`.trim()
      );
      if (Number(units) > 0) {
        await write('DURABLE_COMPUTE_UNITS', Number(units), 'DurableTask compute units');
      }
    } catch (err) {
      this.logger.warn(`recordUsage failed: ${err instanceof Error ? err.message : err}`);
    }
  }
}
