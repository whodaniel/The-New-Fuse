import { ConfigService } from '@nestjs/config';
import type { ResourceSearchRequest } from '@the-new-fuse/types';
import axios from 'axios';
import { ResourceSearchPolicyService, SearchableResource } from './resource-search-policy.service.js';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

const mockedAxios = axios as unknown as {
  post: jest.Mock;
};

const buildConfigService = (values: Record<string, string>): ConfigService =>
  ({
    get: (key: string) => values[key],
  }) as unknown as ConfigService;

const baseFilter: ResourceSearchRequest = {
  search: 'alpha',
  type: 'all',
  category: 'all',
  tags: [],
  featured: false,
  sortBy: 'popular',
};

const sampleResources: SearchableResource[] = [
  {
    id: 'agent-alpha',
    name: 'Alpha Skill',
    description: 'Skill for alpha workflows',
    type: 'skill',
    category: 'automation',
    tags: ['alpha'],
    downloads: 10,
    rating: 4.9,
    updatedAt: '2026-03-18T00:00:00Z',
  },
  {
    id: 'agent-beta',
    name: 'Beta Skill',
    description: 'Skill for beta workflows',
    type: 'skill',
    category: 'automation',
    tags: ['beta'],
    downloads: 8,
    rating: 4.2,
    updatedAt: '2026-03-17T00:00:00Z',
  },
];

describe('ResourceSearchPolicyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('caches trait-screen plan for repeated equivalent queries', async () => {
    const service = new ResourceSearchPolicyService(
      buildConfigService({
        RESOURCE_TRAIT_SCREEN_URL: 'http://trait-screen.test/traits/screen',
        RESOURCE_TRAIT_PLAN_CACHE_TTL_MS: '60000',
      })
    );

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        resourceQueryPlan: {
          requiredAgentIds: ['agent-alpha'],
          traitFilters: ['alpha'],
          confidence: 'high',
          fallbackToBroadSearch: true,
        },
      },
    });

    const first = await service.applySearchPolicy(sampleResources, baseFilter);
    const second = await service.applySearchPolicy(sampleResources, baseFilter);

    expect(first.meta.used).toBe(true);
    expect(second.meta.used).toBe(true);
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it('opens circuit on repeated endpoint failures and skips immediate retries', async () => {
    const service = new ResourceSearchPolicyService(
      buildConfigService({
        RESOURCE_TRAIT_SCREEN_URL: 'http://trait-screen.test/traits/screen',
        RESOURCE_TRAIT_CIRCUIT_BREAKER_THRESHOLD: '1',
        RESOURCE_TRAIT_CIRCUIT_BREAKER_COOLDOWN_MS: '60000',
      })
    );

    mockedAxios.post.mockRejectedValue(new Error('endpoint unavailable'));

    const first = await service.applySearchPolicy(sampleResources, {
      ...baseFilter,
      search: 'alpha',
    });
    const second = await service.applySearchPolicy(sampleResources, {
      ...baseFilter,
      search: 'beta',
    });

    expect(first.meta.used).toBe(false);
    expect(second.meta.used).toBe(false);
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });
});
