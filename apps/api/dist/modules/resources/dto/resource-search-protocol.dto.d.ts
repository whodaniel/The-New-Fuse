import { ResourceSearchRequestDto } from './resource-search.dto';
export declare class ResourceSearchProtocolActorDto {
    id: string;
    roles: string[];
}
export declare class ResourceSearchProtocolTraceDto {
    correlation_id: string;
    causation_id: string | null;
}
export declare class ResourceSearchProtocolRequestEnvelopeDto {
    id: string;
    spec: 'sgp/0.1';
    type: 'DISCOVER.REQUEST' | 'QUERY.REQUEST';
    tenant: string;
    resource: string;
    sent_at: string;
    actor: ResourceSearchProtocolActorDto;
    trace: ResourceSearchProtocolTraceDto;
    payload: ResourceSearchRequestDto;
    sig?: string;
}
export declare class ResourceSearchProtocolResponseEnvelopeDto {
    id: string;
    spec: 'sgp/0.1';
    type: 'DISCOVER.RESPONSE' | 'QUERY.RESPONSE' | 'ERROR';
    tenant: string;
    resource: string;
    sent_at: string;
    actor: ResourceSearchProtocolActorDto;
    trace: ResourceSearchProtocolTraceDto;
    payload: any;
    sig?: string;
}
//# sourceMappingURL=resource-search-protocol.dto.d.ts.map