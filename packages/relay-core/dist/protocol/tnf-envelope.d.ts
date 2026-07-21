/**
 * TNF Unified Message Protocol
 * Based on Gemini's architectural recommendations
 *
 * This protocol works across:
 * - WebSocket Relay
 * - Redis Pub/Sub
 * - Orchestrator task delegation
 * - Workflow execution
 */
import { type AgentIdentity as AgentIdentityType, type AuctionPayload as AuctionPayloadType, type BidPayload as BidPayloadType, type EventPayload as EventPayloadType, type MessageContext as MessageContextType, type MessageType as MessageTypeType, type ResponsePayload as ResponsePayloadType, type StateSyncPayload as StateSyncPayloadType, type TaskPayload as TaskPayloadType, type TNFEnvelope as TNFEnvelopeType } from '@the-new-fuse/protocol-contracts';
import { type TnfAuditTrace } from '../contracts/audit.js';
export declare const MessageType: any;
export type MessageType = MessageTypeType;
export declare const AgentIdentity: any;
export type AgentIdentity = AgentIdentityType;
export declare const MessageContext: any;
export type MessageContext = MessageContextType;
export declare const TNFEnvelope: any;
export type TNFEnvelope = TNFEnvelopeType;
export declare const TaskPayload: any;
export type TaskPayload = TaskPayloadType;
export declare const EventPayload: any;
export type EventPayload = EventPayloadType;
export declare const StateSyncPayload: any;
export type StateSyncPayload = StateSyncPayloadType;
export declare const ResponsePayload: any;
export type ResponsePayload = ResponsePayloadType;
export declare const AuctionPayload: any;
export type AuctionPayload = AuctionPayloadType;
export declare const BidPayload: any;
export type BidPayload = BidPayloadType;
export interface CreateTNFEnvelopeOptions {
    metadata?: Record<string, unknown>;
    traceId?: string;
    audit?: Partial<TnfAuditTrace>;
}
export interface ValidateTNFEnvelopeOptions {
    native?: boolean;
    requireNative?: boolean;
}
export declare function getTNFEnvelopeAuditTrace(envelope: Pick<TNFEnvelope, 'traceId' | 'from' | 'context' | 'metadata'>): TnfAuditTrace;
export declare function normalizeTNFEnvelope(envelope: TNFEnvelope): TNFEnvelope;
export declare function createTNFEnvelope(type: MessageType, from: AgentIdentity, to: AgentIdentity | {
    broadcast: boolean;
}, payload: Record<string, unknown>, context?: MessageContext, options?: CreateTNFEnvelopeOptions): TNFEnvelope;
export declare function validateTNFEnvelope(data: unknown, options?: ValidateTNFEnvelopeOptions): TNFEnvelope;
export declare function isTaskMessage(envelope: TNFEnvelope): boolean;
export declare function isEventMessage(envelope: TNFEnvelope): boolean;
export declare function requiresResponse(envelope: TNFEnvelope): boolean;
/**
 * Message Builder
 */
export declare class TNFMessageBuilder {
    private envelope;
    type(type: MessageType): this;
    from(from: AgentIdentity): this;
    to(to: AgentIdentity | {
        broadcast: boolean;
    }): this;
    payload(payload: Record<string, unknown>): this;
    context(context: MessageContext): this;
    metadata(metadata: Record<string, unknown>): this;
    traceId(traceId: string): this;
    build(): TNFEnvelope;
}
//# sourceMappingURL=tnf-envelope.d.ts.map