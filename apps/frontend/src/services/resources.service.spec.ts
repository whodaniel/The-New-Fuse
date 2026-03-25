import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResourcesService } from './resources.service';

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('./marketplace.service', () => ({
  marketplaceService: {
    getCatalog: vi.fn().mockResolvedValue({ items: [] }),
  },
}));

describe('ResourcesService.searchResources', () => {
  const mockedAxios = axios as unknown as {
    post: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts legacy array response shape (including empty arrays)', async () => {
    const service = new ResourcesService();
    mockedAxios.post.mockResolvedValueOnce({ data: [] });

    const result = await service.searchResourcesWithMeta({
      search: 'none',
      type: 'all',
      category: 'all',
      tags: [],
      featured: false,
      sortBy: 'popular',
    });

    expect(Array.isArray(result.items)).toBe(true);
    expect(result.items).toEqual([]);
    expect(result.traitScreen).toBeNull();
    expect(service.getLastTraitSearchMeta()).toBeNull();
  });

  it('accepts envelope response shape and stores trait metadata', async () => {
    const service = new ResourcesService();
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        items: [
          {
            id: 'res-1',
            name: 'Resource One',
            description: 'desc',
            type: 'skill',
            category: 'ai',
            tags: ['alpha'],
            author: 'tester',
            version: '1.0.0',
            downloads: 1,
            rating: 4.5,
            reviews: 1,
            featured: false,
            createdAt: '2026-03-18T00:00:00Z',
            updatedAt: '2026-03-18T00:00:00Z',
          },
        ],
        traitScreen: {
          enabled: true,
          used: true,
          confidence: 'high',
          traitFilters: ['alpha'],
          requiredAgentIds: ['agent-alpha'],
          fallbackToBroadSearch: true,
          beforeTraitCount: 10,
          afterTraitCount: 1,
        },
      },
    });

    const result = await service.searchResourcesWithMeta({
      search: 'alpha',
      type: 'all',
      category: 'all',
      tags: [],
      featured: false,
      sortBy: 'popular',
    });

    expect(result.items).toHaveLength(1);
    expect(result.traitScreen).toMatchObject({
      enabled: true,
      used: true,
      confidence: 'high',
      traitFilters: ['alpha'],
      beforeTraitCount: 10,
      afterTraitCount: 1,
    });
    expect(service.getLastTraitSearchMeta()).toMatchObject({
      enabled: true,
      used: true,
      confidence: 'high',
      traitFilters: ['alpha'],
      beforeTraitCount: 10,
      afterTraitCount: 1,
    });
  });

  it('caches results by filter key to avoid duplicate network calls', async () => {
    const service = new ResourcesService();
    mockedAxios.post.mockResolvedValue({
      data: [
        {
          id: 'res-cache',
          name: 'Cached Resource',
          description: 'cached',
          type: 'template',
          category: 'automation',
          tags: [],
          author: 'tester',
          version: '1.0.0',
          downloads: 2,
          rating: 4.0,
          reviews: 1,
          featured: false,
          createdAt: '2026-03-18T00:00:00Z',
          updatedAt: '2026-03-18T00:00:00Z',
        },
      ],
    });

    const filter = {
      search: 'cache me',
      type: 'all' as const,
      category: 'all' as const,
      tags: [] as string[],
      featured: false,
      sortBy: 'popular' as const,
    };

    const first = await service.searchResourcesWithMeta(filter);
    const second = await service.searchResourcesWithMeta(filter);

    expect(first.items).toHaveLength(1);
    expect(second.items).toHaveLength(1);
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it('keeps legacy items-only return contract via searchResources()', async () => {
    const service = new ResourcesService();
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        items: [
          {
            id: 'res-legacy',
            name: 'Legacy Resource',
            description: 'desc',
            type: 'skill',
            category: 'ai',
            tags: ['alpha'],
            author: 'tester',
            version: '1.0.0',
            downloads: 1,
            rating: 4.5,
            reviews: 1,
            featured: false,
            createdAt: '2026-03-18T00:00:00Z',
            updatedAt: '2026-03-18T00:00:00Z',
          },
        ],
      },
    });

    const result = await service.searchResources({
      search: 'legacy',
      type: 'all',
      category: 'all',
      tags: [],
      featured: false,
      sortBy: 'popular',
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('res-legacy');
  });

  it('supports protocol envelope search and captures trait metadata from payload', async () => {
    const service = new ResourcesService();
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        id: 'msg-response',
        spec: 'sgp/0.1',
        type: 'RESOURCE.SEARCH.RESPONSE',
        tenant: 'default',
        resource: 'sgp://default/resources/search',
        sent_at: '2026-03-18T00:00:00Z',
        trace: {
          correlation_id: 'corr-1',
          causation_id: 'msg-request',
        },
        payload: {
          items: [
            {
              id: 'res-proto',
              name: 'Protocol Resource',
              description: 'desc',
              type: 'skill',
              category: 'ai',
              tags: ['alpha'],
              author: 'tester',
              version: '1.0.0',
              downloads: 1,
              rating: 4.5,
              reviews: 1,
              featured: false,
              createdAt: '2026-03-18T00:00:00Z',
              updatedAt: '2026-03-18T00:00:00Z',
            },
          ],
          traitScreen: {
            enabled: true,
            used: true,
            confidence: 'high',
            traitFilters: ['alpha'],
            requiredAgentIds: ['agent-alpha'],
            fallbackToBroadSearch: true,
            beforeTraitCount: 8,
            afterTraitCount: 1,
          },
        },
      },
    });

    const envelope = await service.searchResourcesProtocol({
      search: 'alpha',
      type: 'all',
      category: 'all',
      tags: [],
      featured: false,
      sortBy: 'popular',
    });

    expect(envelope.type).toBe('RESOURCE.SEARCH.RESPONSE');
    expect(service.getLastTraitSearchMeta()).toMatchObject({
      enabled: true,
      used: true,
      confidence: 'high',
      traitFilters: ['alpha'],
      beforeTraitCount: 8,
      afterTraitCount: 1,
    });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/resources/search/protocol'),
      expect.objectContaining({
        type: 'RESOURCE.SEARCH.REQUEST',
      })
    );
  });
});

describe('ResourcesService personal skills API', () => {
  const mockedAxios = axios as unknown as {
    post: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.setItem('auth_token', 'token-abc');
  });

  it('uses auth header to fetch personal skills', async () => {
    const service = new ResourcesService();
    mockedAxios.get.mockResolvedValueOnce({
      data: [{ id: 'skill-1', name: 'Private Skill' }],
    });

    const result = await service.getPersonalSkills();

    expect(result).toHaveLength(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/resources/personal-skills'),
      expect.objectContaining({
        headers: { Authorization: 'Bearer token-abc' },
      })
    );
  });

  it('creates, updates, and deletes personal skills with auth header', async () => {
    const service = new ResourcesService();
    mockedAxios.post.mockResolvedValueOnce({ data: { id: 'skill-1', name: 'Draft Skill' } });
    mockedAxios.put.mockResolvedValueOnce({ data: { id: 'skill-1', name: 'Updated Skill' } });
    mockedAxios.delete.mockResolvedValueOnce({ data: { success: true, id: 'skill-1' } });

    const created = await service.createPersonalSkill({
      name: 'Draft Skill',
      instructions: 'Do the thing',
    });
    const updated = await service.updatePersonalSkill('skill-1', { name: 'Updated Skill' });
    const deleted = await service.deletePersonalSkill('skill-1');

    expect(created).toMatchObject({ id: 'skill-1', name: 'Draft Skill' });
    expect(updated).toMatchObject({ id: 'skill-1', name: 'Updated Skill' });
    expect(deleted).toMatchObject({ success: true, id: 'skill-1' });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/resources/personal-skills'),
      expect.objectContaining({ name: 'Draft Skill' }),
      expect.objectContaining({
        headers: { Authorization: 'Bearer token-abc' },
      })
    );
    expect(mockedAxios.put).toHaveBeenCalledWith(
      expect.stringContaining('/resources/personal-skills/skill-1'),
      expect.objectContaining({ name: 'Updated Skill' }),
      expect.objectContaining({
        headers: { Authorization: 'Bearer token-abc' },
      })
    );
    expect(mockedAxios.delete).toHaveBeenCalledWith(
      expect.stringContaining('/resources/personal-skills/skill-1'),
      expect.objectContaining({
        headers: { Authorization: 'Bearer token-abc' },
      })
    );
  });
});
