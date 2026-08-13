import { BadRequestException, Injectable } from '@nestjs/common';
import { type SgpEnvelope, type SgpPayload } from '@the-new-fuse/protocol-contracts';
import type {
  ResourceCatalogItem,
  ResourceSearchRequest,
  ResourceSearchResponse,
} from '@the-new-fuse/types';
import { randomUUID } from 'node:crypto';

// Local types for the legacy API structure, but based on the new spec
export type ResourceSearchProtocolEnvelopeBase<TType extends string, TPayload> = SgpEnvelope & {
  type: TType;
  payload: TPayload;
};

export type ResourceSearchProtocolRequestEnvelope = ResourceSearchProtocolEnvelopeBase<
  'DISCOVER.REQUEST' | 'QUERY.REQUEST' | 'RESOURCE.SEARCH.REQUEST',
  ResourceSearchRequest | any
>;

export type ResourceSearchProtocolResponseEnvelope<
  TResource extends ResourceCatalogItem = ResourceCatalogItem,
> = ResourceSearchProtocolEnvelopeBase<
  'DISCOVER.RESPONSE' | 'QUERY.RESPONSE' | 'RESOURCE.SEARCH.RESPONSE' | 'ERROR',
  ResourceSearchResponse<TResource> | SgpPayload
>;

type ProtocolRequestDecodeResult = {
  filter: ResourceSearchRequest;
  requestEnvelope: ResourceSearchProtocolRequestEnvelope;
};

@Injectable()
export class ResourceSearchProtocolService {
  private readonly defaultSpec = 'sgp/0.1';
  private readonly defaultTenant = 'default';
  private readonly defaultResource = 'sgp://default/resources/search';

  decodeRequest(body: unknown): ProtocolRequestDecodeResult {
    if (this.isProtocolRequestEnvelope(body)) {
      this.assertValidRequestEnvelope(body);
      return {
        filter: this.normalizeFilter(body.payload),
        requestEnvelope: body as ResourceSearchProtocolRequestEnvelope,
      };
    }

    if (this.looksLikeProtocolEnvelope(body)) {
      throw new BadRequestException({
        message: 'Invalid SGP envelope',
        errors: [
          "Expected envelope type 'DISCOVER.REQUEST' or 'QUERY.REQUEST' with required fields: id, spec, tenant, resource, sent_at, trace, payload.",
        ],
      });
    }

    const filter = this.normalizeFilter(body);
    const now = new Date().toISOString();
    const messageId = randomUUID();

    return {
      filter,
      requestEnvelope: {
        id: messageId,
        spec: this.defaultSpec,
        type: 'DISCOVER.REQUEST',
        tenant: this.defaultTenant,
        resource: this.defaultResource,
        sent_at: now,
        actor: {
          id: 'anonymous',
          roles: ['guest'],
        },
        trace: {
          correlation_id: messageId,
          causation_id: null,
        },
        payload: filter as any,
      } as ResourceSearchProtocolRequestEnvelope,
    };
  }

  encodeResponse<TResource extends ResourceCatalogItem = ResourceCatalogItem>(
    requestEnvelope: ResourceSearchProtocolRequestEnvelope,
    payload: ResourceSearchResponse<TResource>
  ): ResourceSearchProtocolResponseEnvelope<TResource> {
    const responseId = randomUUID();

    // Map REQUEST types to RESPONSE types
    const requestType = (requestEnvelope as any).type as string;
    let type: any = 'DISCOVER.RESPONSE';
    if (requestType === 'QUERY.REQUEST') {
      type = 'QUERY.RESPONSE';
    } else if (requestType === 'RESOURCE.SEARCH.REQUEST') {
      type = 'RESOURCE.SEARCH.RESPONSE';
    }

    return {
      id: responseId,
      spec: requestEnvelope.spec || this.defaultSpec,
      type,
      tenant: requestEnvelope.tenant || this.defaultTenant,
      resource: requestEnvelope.resource || this.defaultResource,
      sent_at: new Date().toISOString(),
      actor: requestEnvelope.actor,
      trace: {
        correlation_id: requestEnvelope.trace?.correlation_id || responseId,
        causation_id: requestEnvelope.id || null,
      },
      payload,
    } as ResourceSearchProtocolResponseEnvelope<TResource>;
  }

  private normalizeFilter(value: unknown): ResourceSearchRequest {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return {};
    }

    const candidate = value as ResourceSearchRequest;

    return {
      search: candidate.search,
      type: candidate.type,
      category: candidate.category,
      tags: Array.isArray(candidate.tags) ? candidate.tags : undefined,
      featured: typeof candidate.featured === 'boolean' ? candidate.featured : undefined,
      sortBy: candidate.sortBy,
      traitScreen: typeof candidate.traitScreen === 'boolean' ? candidate.traitScreen : undefined,
      traitLimit: typeof candidate.traitLimit === 'number' ? candidate.traitLimit : undefined,
      traitThreshold:
        typeof candidate.traitThreshold === 'number' ? candidate.traitThreshold : undefined,
      includeTraitMeta:
        typeof candidate.includeTraitMeta === 'boolean' ? candidate.includeTraitMeta : undefined,
    };
  }

  private isProtocolRequestEnvelope(
    value: unknown
  ): value is ResourceSearchProtocolRequestEnvelope {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    const message = value as any;

    return (
      (message.type === 'DISCOVER.REQUEST' ||
        message.type === 'QUERY.REQUEST' ||
        message.type === 'RESOURCE.SEARCH.REQUEST') &&
      typeof message.payload === 'object' &&
      message.payload !== null &&
      !Array.isArray(message.payload)
    );
  }

  private looksLikeProtocolEnvelope(value: unknown): boolean {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    const candidate = value as Record<string, unknown>;
    const type = candidate.type;
    return (
      'id' in candidate ||
      'spec' in candidate ||
      'resource' in candidate ||
      'sent_at' in candidate ||
      'trace' in candidate ||
      (typeof type === 'string' &&
        (type.startsWith('DISCOVER.') || type.startsWith('QUERY.') || type.startsWith('RESOURCE.')))
    );
  }

  private assertValidRequestEnvelope(envelope: ResourceSearchProtocolRequestEnvelope): void {
    const errors: string[] = [];

    if (!this.isNonEmptyString(envelope.id)) {
      errors.push('id must be a non-empty string.');
    }
    if (!this.isNonEmptyString(envelope.spec)) {
      errors.push('spec must be a non-empty string.');
    }

    const type = (envelope as any).type as string;
    if (
      type !== 'DISCOVER.REQUEST' &&
      type !== 'QUERY.REQUEST' &&
      type !== 'RESOURCE.SEARCH.REQUEST'
    ) {
      errors.push(
        "type must be 'DISCOVER.REQUEST', 'QUERY.REQUEST', or 'RESOURCE.SEARCH.REQUEST'."
      );
    }
    if (!this.isNonEmptyString(envelope.tenant)) {
      errors.push('tenant must be a non-empty string.');
    }
    if (!this.isNonEmptyString(envelope.resource)) {
      errors.push('resource must be a non-empty string.');
    }
    if (!this.isValidDateTime(envelope.sent_at)) {
      errors.push('sent_at must be an ISO-8601 datetime string.');
    }

    const traceValue: unknown = envelope.trace;
    if (!traceValue || typeof traceValue !== 'object' || Array.isArray(traceValue)) {
      errors.push('trace must be an object.');
    } else {
      const trace = traceValue as { correlation_id?: unknown; causation_id?: unknown };
      if (!this.isNonEmptyString(trace.correlation_id)) {
        errors.push('trace.correlation_id must be a non-empty string.');
      }
      const causationId = trace.causation_id;
      if (!(causationId === null || typeof causationId === 'string')) {
        errors.push('trace.causation_id must be a string or null.');
      }
    }

    if (
      typeof envelope.payload !== 'object' ||
      envelope.payload === null ||
      Array.isArray(envelope.payload)
    ) {
      errors.push('payload must be an object.');
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Invalid SGP envelope',
        errors,
      });
    }
  }

  private isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }

  private isValidDateTime(value: unknown): boolean {
    if (typeof value !== 'string' || value.trim().length === 0) return false;
    return !Number.isNaN(Date.parse(value));
  }
}
