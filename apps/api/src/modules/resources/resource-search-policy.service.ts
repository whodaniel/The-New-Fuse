import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  ResourceSearchMeta,
  ResourceSearchRequest,
  ResourceSortBy,
} from '@the-new-fuse/types';
import axios from 'axios';

type TraitScreenResponse = {
  resourceQueryPlan?: {
    requiredAgentIds?: string[];
    traitFilters?: string[];
    confidence?: 'high' | 'medium' | 'low';
    fallbackToBroadSearch?: boolean;
  };
};

type TraitScreenPlan = {
  requiredAgentIds: string[];
  traitFilters: string[];
  confidence: 'high' | 'medium' | 'low';
  fallbackToBroadSearch: boolean;
};

export type SearchableResource = {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  tags?: string[];
  featured?: boolean;
  downloads?: number;
  rating?: number;
  updatedAt: string;
  [key: string]: unknown;
};

type SearchPolicyResult<T extends SearchableResource> = {
  items: T[];
  meta: ResourceSearchMeta;
};

type CachedTraitPlanEntry = {
  expiresAt: number;
  plan: TraitScreenPlan | null;
};

type TraitEndpointCircuitState = {
  failureCount: number;
  openUntil: number;
};

@Injectable()
export class ResourceSearchPolicyService {
  private readonly logger = new Logger(ResourceSearchPolicyService.name);
  private readonly traitPlanCache = new Map<string, CachedTraitPlanEntry>();
  private readonly traitEndpointCircuit = new Map<string, TraitEndpointCircuitState>();
  private readonly traitPlanCacheTtlMs: number;
  private readonly traitCircuitFailureThreshold: number;
  private readonly traitCircuitCooldownMs: number;

  constructor(private readonly configService: ConfigService) {
    this.traitPlanCacheTtlMs = this.readPositiveInt(
      'RESOURCE_TRAIT_PLAN_CACHE_TTL_MS',
      30_000,
      500
    );
    this.traitCircuitFailureThreshold = this.readPositiveInt(
      'RESOURCE_TRAIT_CIRCUIT_BREAKER_THRESHOLD',
      3,
      1
    );
    this.traitCircuitCooldownMs = this.readPositiveInt(
      'RESOURCE_TRAIT_CIRCUIT_BREAKER_COOLDOWN_MS',
      30_000,
      1_000
    );
  }

  async applySearchPolicy<T extends SearchableResource>(
    resources: T[],
    filter: ResourceSearchRequest
  ): Promise<SearchPolicyResult<T>> {
    const search = String(filter?.search || '').toLowerCase();
    const type = String(filter?.type || 'all');
    const category = String(filter?.category || 'all');
    const tags = Array.isArray(filter?.tags)
      ? filter.tags.map((tag: string) => tag.toLowerCase())
      : [];
    const featured = Boolean(filter?.featured);
    const sortBy = this.parseSortBy(filter?.sortBy);

    const traitScreenEnabled = this.isTraitScreenEnabled(filter);
    const traitPlan = await this.fetchTraitScreenPlan(search, filter);
    const meta: ResourceSearchMeta = {
      enabled: traitScreenEnabled,
      used: Boolean(traitPlan),
      confidence: traitPlan?.confidence || null,
      traitFilters: traitPlan?.traitFilters || [],
      requiredAgentIds: traitPlan?.requiredAgentIds || [],
      fallbackToBroadSearch: traitPlan?.fallbackToBroadSearch ?? true,
      beforeTraitCount: 0,
      afterTraitCount: 0,
    };

    let filtered = resources.filter((item) => {
      if (search) {
        const haystack = [item.name, item.description, ...(item.tags || [])]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      if (type !== 'all' && item.type !== type) return false;
      if (category !== 'all' && item.category !== category) return false;
      if (
        tags.length > 0 &&
        !(item.tags || []).some((tag: string) => tags.includes(tag.toLowerCase()))
      ) {
        return false;
      }
      if (featured && !item.featured) return false;

      return true;
    });
    meta.beforeTraitCount = filtered.length;

    const traitScores = new Map<string, number>();
    if (traitPlan && traitPlan.traitFilters.length > 0) {
      const scored = filtered.map((item) => ({
        item,
        score: this.scoreByTraitPlan(item, traitPlan),
      }));
      const narrowed = scored.filter((entry) => entry.score > 0);

      if (narrowed.length > 0) {
        filtered = narrowed.map((entry) => entry.item);
        for (const entry of narrowed) {
          traitScores.set(entry.item.id, entry.score);
        }
      } else if (!traitPlan.fallbackToBroadSearch) {
        filtered = [];
      }
    }
    meta.afterTraitCount = filtered.length;

    filtered = filtered.sort((a, b) => {
      const traitDelta = (traitScores.get(b.id) || 0) - (traitScores.get(a.id) || 0);
      if (traitDelta !== 0) return traitDelta;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'recent') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return (b.downloads || 0) - (a.downloads || 0);
    });

    this.emitTraitSearchTelemetry(meta, search, filter, filtered.length, sortBy, type, category);

    return {
      items: filtered,
      meta,
    };
  }

  private parseSortBy(value: ResourceSearchRequest['sortBy']): ResourceSortBy {
    if (value === 'name' || value === 'rating' || value === 'recent') {
      return value;
    }
    return 'popular';
  }

  private normalizeTerm(value: unknown): string {
    return String(value || '')
      .toLowerCase()
      .replace(/[_/]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private toUniqueTerms(values: unknown[]): string[] {
    return Array.from(
      new Set(values.map((value) => this.normalizeTerm(value)).filter((value) => value.length >= 2))
    );
  }

  private isTraitScreenEnabled(filter: ResourceSearchRequest): boolean {
    if (filter?.traitScreen === false) return false;
    const configured = this.normalizeTerm(
      this.configService.get<string>('RESOURCE_TRAIT_SCREENING_ENABLED')
    );
    if (!configured) return true;
    return !['0', 'false', 'off', 'no'].includes(configured);
  }

  private getTraitScreenUrls(): string[] {
    const explicitEndpoint = this.configService.get<string>('RESOURCE_TRAIT_SCREEN_URL');
    if (explicitEndpoint?.trim()) {
      return [explicitEndpoint.trim()];
    }

    const configuredBase = this.configService.get<string>('AGENT_REGISTRY_API_BASE_URL');
    const urls = [
      configuredBase?.trim() ? `${configuredBase.trim().replace(/\/+$/, '')}/traits/screen` : '',
      'http://localhost:3002/api/agent-registry/traits/screen',
      'http://localhost:3001/api/agent-registry/traits/screen',
    ];

    return Array.from(new Set(urls.filter(Boolean)));
  }

  private readPositiveInt(key: string, fallback: number, min: number): number {
    const rawValue = this.configService.get<string>(key);
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed < min) {
      return fallback;
    }
    return Math.floor(parsed);
  }

  private buildTraitPlanCacheKey(inquiry: string, limit: number, threshold: number): string {
    return JSON.stringify({
      inquiry: this.normalizeTerm(inquiry),
      limit: Number(limit || 0),
      threshold: Number(threshold || 0),
    });
  }

  private getCachedTraitPlan(cacheKey: string): TraitScreenPlan | null | undefined {
    const cached = this.traitPlanCache.get(cacheKey);
    if (!cached) return undefined;
    if (cached.expiresAt <= Date.now()) {
      this.traitPlanCache.delete(cacheKey);
      return undefined;
    }
    return cached.plan;
  }

  private setCachedTraitPlan(cacheKey: string, plan: TraitScreenPlan | null): void {
    this.traitPlanCache.set(cacheKey, {
      plan,
      expiresAt: Date.now() + this.traitPlanCacheTtlMs,
    });
  }

  private isTraitEndpointCircuitOpen(endpoint: string): boolean {
    const state = this.traitEndpointCircuit.get(endpoint);
    if (!state) return false;
    if (state.openUntil <= Date.now()) {
      this.traitEndpointCircuit.delete(endpoint);
      return false;
    }
    return true;
  }

  private registerTraitEndpointSuccess(endpoint: string): void {
    this.traitEndpointCircuit.delete(endpoint);
  }

  private registerTraitEndpointFailure(endpoint: string): boolean {
    const state = this.traitEndpointCircuit.get(endpoint) || {
      failureCount: 0,
      openUntil: 0,
    };
    state.failureCount += 1;

    const shouldOpenCircuit = state.failureCount >= this.traitCircuitFailureThreshold;
    if (shouldOpenCircuit) {
      state.openUntil = Date.now() + this.traitCircuitCooldownMs;
      state.failureCount = 0;
    }

    this.traitEndpointCircuit.set(endpoint, state);
    return shouldOpenCircuit;
  }

  private async fetchTraitScreenPlan(
    inquiry: string,
    filter: ResourceSearchRequest
  ): Promise<TraitScreenPlan | null> {
    const text = this.normalizeTerm(inquiry);
    if (!text || !this.isTraitScreenEnabled(filter)) return null;

    const payload = {
      inquiry,
      limit: Number(filter?.traitLimit || 8),
      threshold: Number(filter?.traitThreshold ?? 0.42),
      includeChunks: false,
      onlySystem: false,
    };
    const cacheKey = this.buildTraitPlanCacheKey(inquiry, payload.limit, payload.threshold);
    const cachedPlan = this.getCachedTraitPlan(cacheKey);
    if (cachedPlan !== undefined) {
      return cachedPlan;
    }

    for (const endpoint of this.getTraitScreenUrls()) {
      if (this.isTraitEndpointCircuitOpen(endpoint)) {
        this.logger.debug(`Trait screen endpoint circuit open (${endpoint}); skipping`);
        continue;
      }

      try {
        const response = await axios.post<TraitScreenResponse>(endpoint, payload, {
          timeout: 2500,
        });
        this.registerTraitEndpointSuccess(endpoint);

        const plan = response.data?.resourceQueryPlan;
        if (!plan) continue;

        const normalizedPlan: TraitScreenPlan = {
          requiredAgentIds: this.toUniqueTerms(plan.requiredAgentIds || []),
          traitFilters: this.toUniqueTerms(plan.traitFilters || []),
          confidence: plan.confidence || 'low',
          fallbackToBroadSearch: plan.fallbackToBroadSearch !== false,
        };
        this.setCachedTraitPlan(cacheKey, normalizedPlan);
        return normalizedPlan;
      } catch (error) {
        const openedCircuit = this.registerTraitEndpointFailure(endpoint);
        this.logger.debug(
          `Trait screen endpoint unavailable (${endpoint}): ${
            error instanceof Error ? error.message : String(error)
          }${openedCircuit ? ' [circuit opened]' : ''}`
        );
      }
    }

    this.setCachedTraitPlan(cacheKey, null);
    return null;
  }

  private extractResourceTraitTerms(item: SearchableResource): string[] {
    const textTokens = this.normalizeTerm(`${item.name || ''} ${item.description || ''}`)
      .split(/\W+/)
      .filter((token) => token.length >= 3)
      .slice(0, 40);

    return this.toUniqueTerms([
      ...(Array.isArray(item.tags) ? item.tags : []),
      ...(Array.isArray(item.capabilities) ? item.capabilities : []),
      ...(Array.isArray(item.actions) ? item.actions : []),
      ...(Array.isArray(item.triggers) ? item.triggers : []),
      ...(Array.isArray(item.integrations) ? item.integrations : []),
      ...(Array.isArray(item.requiredSkills) ? item.requiredSkills : []),
      ...(Array.isArray(item.optionalSkills) ? item.optionalSkills : []),
      item.category,
      item.type,
      ...textTokens,
    ]);
  }

  private scoreByTraitPlan(item: SearchableResource, plan: TraitScreenPlan): number {
    const resourceTerms = this.extractResourceTraitTerms(item);
    if (resourceTerms.length === 0) return 0;

    const termSet = new Set(resourceTerms);
    let overlap = 0;
    for (const trait of plan.traitFilters) {
      if (termSet.has(trait)) {
        overlap += 1;
        continue;
      }
      if (resourceTerms.some((term) => term.includes(trait) || trait.includes(term))) {
        overlap += 1;
      }
    }

    const maxTraits = Math.max(1, Math.min(plan.traitFilters.length, 16));
    const overlapScore = overlap / maxTraits;

    const haystack = this.normalizeTerm(
      [item.id, item.name, item.description, ...(Array.isArray(item.tags) ? item.tags : [])].join(
        ' '
      )
    );
    const idBoost =
      plan.requiredAgentIds.length > 0 &&
      plan.requiredAgentIds.some((requiredId) => requiredId && haystack.includes(requiredId))
        ? 0.15
        : 0;

    return Number((overlapScore + idBoost).toFixed(6));
  }

  private emitTraitSearchTelemetry(
    meta: ResourceSearchMeta,
    search: string,
    filter: ResourceSearchRequest,
    resultCount: number,
    sortBy: ResourceSortBy,
    type: string,
    category: string
  ) {
    const payload = {
      event: 'resources.search.trait_screen',
      enabled: meta.enabled,
      used: meta.used,
      confidence: meta.confidence || 'none',
      beforeTraitCount: meta.beforeTraitCount,
      afterTraitCount: meta.afterTraitCount,
      narrowingDelta: meta.beforeTraitCount - meta.afterTraitCount,
      resultCount,
      fallbackToBroadSearch: meta.fallbackToBroadSearch,
      traitFilterCount: meta.traitFilters.length,
      requiredAgentCount: meta.requiredAgentIds.length,
      sortBy,
      type,
      category,
      queryLength: this.normalizeTerm(search).length,
      includeTraitMeta: Boolean(filter?.includeTraitMeta),
    };

    this.logger.log(`telemetry ${JSON.stringify(payload)}`);
  }
}
