import AIAvailabilityManager from './AIAvailabilityManager';
export interface Envelope<T = unknown> {
    event: string;
    cid: string;
    origin: {
        app: string;
        id: string;
        version?: string;
    };
    timestamp: string;
    payload: T;
    auth?: {
        token?: string;
    };
}
/**
 * RelayEnvelopeHandler
 * - consumes canonical envelopes emitted by clients (extensions, agents)
 * - updates AIAvailabilityManager registry (register/heartbeat)
 * - emits lightweight events back to the manager for context
 */
export declare class RelayEnvelopeHandler {
    private manager;
    constructor(manager: AIAvailabilityManager);
    handleEnvelope(envelope: Envelope): void;
}
export default RelayEnvelopeHandler;
//# sourceMappingURL=RelayEnvelopeHandler.d.ts.map