import { type SgpEnvelope, type SgpPayload } from '@the-new-fuse/protocol-contracts';
import type { ResourceCatalogItem, ResourceSearchRequest, ResourceSearchResponse } from '@the-new-fuse/types';
export type ResourceSearchProtocolEnvelopeBase<TType extends string, TPayload> = SgpEnvelope & {
    type: TType;
    payload: TPayload;
};
export type ResourceSearchProtocolRequestEnvelope = ResourceSearchProtocolEnvelopeBase<'DISCOVER.REQUEST' | 'QUERY.REQUEST' | 'RESOURCE.SEARCH.REQUEST', ResourceSearchRequest | any>;
export type ResourceSearchProtocolResponseEnvelope<TResource extends ResourceCatalogItem = ResourceCatalogItem> = ResourceSearchProtocolEnvelopeBase<'DISCOVER.RESPONSE' | 'QUERY.RESPONSE' | 'RESOURCE.SEARCH.RESPONSE' | 'ERROR', ResourceSearchResponse<TResource> | SgpPayload>;
type ProtocolRequestDecodeResult = {
    filter: ResourceSearchRequest;
    requestEnvelope: ResourceSearchProtocolRequestEnvelope;
};
export declare class ResourceSearchProtocolService {
    private readonly defaultSpec;
    private readonly defaultTenant;
    private readonly defaultResource;
    decodeRequest(body: unknown): ProtocolRequestDecodeResult;
    encodeResponse<TResource extends ResourceCatalogItem = ResourceCatalogItem>(requestEnvelope: ResourceSearchProtocolRequestEnvelope, payload: ResourceSearchResponse<TResource>): ResourceSearchProtocolResponseEnvelope<TResource>;
    private normalizeFilter;
    private isProtocolRequestEnvelope;
    private looksLikeProtocolEnvelope;
    private assertValidRequestEnvelope;
    private isNonEmptyString;
    private isValidDateTime;
}
export {};
//# sourceMappingURL=resource-search-protocol.service.d.ts.map