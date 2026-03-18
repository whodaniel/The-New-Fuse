import { MarketplaceService } from '../marketplace/marketplace.service';
import { ResourceSearchPolicyService } from './resource-search-policy.service';
import { ResourceSearchProtocolService } from './resource-search-protocol.service';
import { ResourcesController } from './resources.controller';

describe('ResourcesController /resources/search contract', () => {
  const defaultMeta = {
    enabled: true,
    used: false,
    confidence: null,
    traitFilters: [],
    requiredAgentIds: [],
    fallbackToBroadSearch: true,
    beforeTraitCount: 2,
    afterTraitCount: 2,
  };

  const buildController = () => {
    const searchPolicyService = {
      applySearchPolicy: jest.fn(),
    };
    const searchProtocolService = {
      decodeRequest: jest.fn(),
      encodeResponse: jest.fn(),
    };

    const controller = new ResourcesController(
      { getCatalog: jest.fn() } as unknown as MarketplaceService,
      searchPolicyService as unknown as ResourceSearchPolicyService,
      searchProtocolService as unknown as ResourceSearchProtocolService
    );

    return {
      controller,
      searchPolicyService,
      searchProtocolService,
    };
  };

  const sampleResources = [
    {
      id: 'agent-alpha',
      name: 'Alpha Skill',
      description: 'Skill for alpha workflows',
      type: 'skill',
      category: 'automation',
      tags: ['alpha', 'workflow'],
      downloads: 20,
      rating: 4.8,
      updatedAt: '2026-03-18T21:00:00Z',
      featured: true,
    },
    {
      id: 'agent-beta',
      name: 'Beta Template',
      description: 'Template for general use',
      type: 'template',
      category: 'productivity',
      tags: ['template'],
      downloads: 10,
      rating: 4.1,
      updatedAt: '2026-03-17T21:00:00Z',
      featured: false,
    },
  ];

  it('returns legacy array shape by default', async () => {
    const { controller, searchPolicyService } = buildController();
    jest
      .spyOn(
        controller as unknown as { getAllResources: () => Promise<typeof sampleResources> },
        'getAllResources'
      )
      .mockResolvedValue(sampleResources);
    searchPolicyService.applySearchPolicy.mockResolvedValue({
      items: sampleResources,
      meta: defaultMeta,
    });

    const result = await controller.searchResources({
      search: '',
      type: 'all',
      category: 'all',
      tags: [],
      featured: false,
      sortBy: 'popular',
    });

    expect(Array.isArray(result)).toBe(true);
    if (!Array.isArray(result)) {
      throw new Error('Expected legacy array response');
    }
    expect(result).toHaveLength(2);
    expect(searchPolicyService.applySearchPolicy).toHaveBeenCalledTimes(1);
  });

  it('returns envelope shape when includeTraitMeta=true', async () => {
    const { controller, searchPolicyService } = buildController();
    jest
      .spyOn(
        controller as unknown as { getAllResources: () => Promise<typeof sampleResources> },
        'getAllResources'
      )
      .mockResolvedValue(sampleResources);
    searchPolicyService.applySearchPolicy.mockResolvedValue({
      items: [sampleResources[0]],
      meta: {
        ...defaultMeta,
        used: true,
        confidence: 'high',
        traitFilters: ['alpha'],
        requiredAgentIds: ['agent-alpha'],
      },
    });

    const result = (await controller.searchResources({
      search: 'alpha',
      includeTraitMeta: true,
      type: 'all',
      category: 'all',
      tags: [],
      featured: false,
      sortBy: 'popular',
    })) as {
      items: unknown[];
      traitScreen: Record<string, unknown>;
    };

    expect(Array.isArray(result.items)).toBe(true);
    expect(result.traitScreen).toMatchObject({
      enabled: true,
      used: true,
      confidence: 'high',
      traitFilters: ['alpha'],
      requiredAgentIds: ['agent-alpha'],
    });
  });

  it('returns protocol envelope shape on /search/protocol', async () => {
    const { controller, searchPolicyService, searchProtocolService } = buildController();
    const requestEnvelope = {
      id: 'msg-1',
      spec: 'sgp/0.1',
      type: 'RESOURCE.SEARCH.REQUEST',
      tenant: 'acme',
      resource: 'sgp://acme/resources/search',
      sent_at: '2026-03-18T21:00:00Z',
      trace: { correlation_id: 'corr-1', causation_id: null },
      payload: { search: 'alpha', includeTraitMeta: true },
    };
    const expectedEnvelope = {
      ...requestEnvelope,
      id: 'msg-2',
      type: 'RESOURCE.SEARCH.RESPONSE',
      payload: {
        items: [sampleResources[0]],
        traitScreen: defaultMeta,
      },
    };

    searchProtocolService.decodeRequest.mockReturnValue({
      filter: { search: 'alpha', includeTraitMeta: true },
      requestEnvelope,
    });
    searchPolicyService.applySearchPolicy.mockResolvedValue({
      items: [sampleResources[0]],
      meta: defaultMeta,
    });
    searchProtocolService.encodeResponse.mockReturnValue(expectedEnvelope);
    jest
      .spyOn(
        controller as unknown as { getAllResources: () => Promise<typeof sampleResources> },
        'getAllResources'
      )
      .mockResolvedValue(sampleResources);

    const result = await controller.searchResourcesProtocol(requestEnvelope);

    expect(searchProtocolService.decodeRequest).toHaveBeenCalledWith(requestEnvelope);
    expect(searchPolicyService.applySearchPolicy).toHaveBeenCalledTimes(1);
    expect(searchProtocolService.encodeResponse).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      type: 'RESOURCE.SEARCH.RESPONSE',
    });
  });
});
