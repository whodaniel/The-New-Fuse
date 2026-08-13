import type {
  ResourceCatalogItem,
  ResourceSearchRequest,
  ResourceSearchResponse,
} from './resource-search.js';

export type ResourceSearchProtocolMessageType =
  | 'RESOURCE.SEARCH.REQUEST'
  | 'RESOURCE.SEARCH.RESPONSE';

export interface ResourceSearchProtocolActor {
  id?: string;
  roles?: string[];
}

export interface ResourceSearchProtocolTrace {
  correlation_id: string;
  causation_id: string | null;
}

interface ResourceSearchProtocolEnvelopeBase<
  TType extends ResourceSearchProtocolMessageType,
  TPayload,
> {
  id: string;
  spec: string;
  type: TType;
  tenant: string;
  resource: string;
  sent_at: string;
  actor?: ResourceSearchProtocolActor;
  trace: ResourceSearchProtocolTrace;
  payload: TPayload;
}

export type ResourceSearchProtocolRequestEnvelope = ResourceSearchProtocolEnvelopeBase<
  'RESOURCE.SEARCH.REQUEST',
  ResourceSearchRequest
>;

export type ResourceSearchProtocolResponseEnvelope<
  TResource extends ResourceCatalogItem = ResourceCatalogItem,
> = ResourceSearchProtocolEnvelopeBase<
  'RESOURCE.SEARCH.RESPONSE',
  ResourceSearchResponse<TResource>
>;

export type ResourceSearchProtocolEnvelope<
  TResource extends ResourceCatalogItem = ResourceCatalogItem,
> = ResourceSearchProtocolRequestEnvelope | ResourceSearchProtocolResponseEnvelope<TResource>;
