import { BadRequestException } from '@nestjs/common';
import type {
  ResourceCatalogItem,
  ResourceSearchProtocolRequestEnvelope,
} from '@the-new-fuse/types';
import { ResourceSearchProtocolService } from './resource-search-protocol.service';

describe('ResourceSearchProtocolService', () => {
  const service = new ResourceSearchProtocolService();

  const buildValidEnvelope = (
    overrides: Partial<ResourceSearchProtocolRequestEnvelope> = {}
  ): ResourceSearchProtocolRequestEnvelope => ({
    id: 'msg-req-1',
    spec: 'sgp/0.1',
    type: 'RESOURCE.SEARCH.REQUEST',
    tenant: 'acme',
    resource: 'sgp://acme/resources/search',
    sent_at: '2026-03-18T21:00:00Z',
    trace: {
      correlation_id: 'corr-1',
      causation_id: null,
    },
    payload: {
      search: 'alpha',
      includeTraitMeta: true,
      type: 'all',
      category: 'all',
      tags: [],
      featured: false,
      sortBy: 'popular',
    },
    ...overrides,
  });

  it('synthesizes a protocol envelope from plain filter input', () => {
    const result = service.decodeRequest({ search: 'alpha', includeTraitMeta: true });

    expect(result.filter).toMatchObject({
      search: 'alpha',
      includeTraitMeta: true,
    });
    expect(result.requestEnvelope.type).toBe('RESOURCE.SEARCH.REQUEST');
    expect(result.requestEnvelope.spec).toBe('sgp/0.1');
    expect(result.requestEnvelope.trace.causation_id).toBeNull();
    expect(result.requestEnvelope.trace.correlation_id.length).toBeGreaterThan(0);
  });

  it('accepts a valid protocol request envelope', () => {
    const envelope = buildValidEnvelope();

    const result = service.decodeRequest(envelope);

    expect(result.requestEnvelope).toBe(envelope);
    expect(result.filter).toMatchObject({ search: 'alpha', includeTraitMeta: true });
  });

  it('rejects malformed protocol request envelope with structured 400 details', () => {
    const invalidEnvelope = buildValidEnvelope({
      trace: {
        correlation_id: '',
        causation_id: null,
      },
    });

    try {
      service.decodeRequest(invalidEnvelope);
      throw new Error('Expected BadRequestException');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      if (!(error instanceof BadRequestException)) {
        throw error;
      }

      const response = error.getResponse() as {
        message?: string;
        errors?: string[];
      };
      expect(response.message).toBe('Invalid RESOURCE.SEARCH.REQUEST envelope');
      expect(response.errors).toContain('trace.correlation_id must be a non-empty string.');
    }
  });

  it('rejects envelope-like objects with non-request protocol type', () => {
    const wrongTypeEnvelope = {
      ...buildValidEnvelope(),
      type: 'RESOURCE.SEARCH.RESPONSE',
    };

    expect(() => service.decodeRequest(wrongTypeEnvelope)).toThrow(BadRequestException);
  });

  it('encodes response envelope preserving correlation and setting causation', () => {
    const requestEnvelope = buildValidEnvelope();
    const payload: ResourceCatalogItem[] = [
      {
        id: 'res-1',
        name: 'Alpha Skill',
        description: 'desc',
        type: 'skill',
        category: 'automation',
        tags: ['alpha'],
        author: 'tester',
        version: '1.0.0',
        downloads: 10,
        rating: 4.7,
        reviews: 2,
        featured: true,
        createdAt: '2026-03-18T21:00:00Z',
        updatedAt: '2026-03-18T21:00:00Z',
      },
    ];

    const responseEnvelope = service.encodeResponse(requestEnvelope, payload);

    expect(responseEnvelope.type).toBe('RESOURCE.SEARCH.RESPONSE');
    expect(responseEnvelope.trace.correlation_id).toBe('corr-1');
    expect(responseEnvelope.trace.causation_id).toBe('msg-req-1');
    expect(Array.isArray(responseEnvelope.payload)).toBe(true);
  });
});
