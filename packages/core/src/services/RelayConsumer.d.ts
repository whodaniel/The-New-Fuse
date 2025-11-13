import AIAvailabilityManager from './AIAvailabilityManager';
/**
 * RelayConsumer
 * A small adapter that can be used by a backend to wire a WebSocket client
 * (or any event emitter that emits messages) to the RelayEnvelopeHandler.
 * The consumer avoids introducing a hard dependency on a specific ws library by
 * accepting an injected client that emits 'message' events with the raw data
 * or a { message } detail shape.
 */
export declare class RelayConsumer {
    private handler;
    constructor(manager: AIAvailabilityManager);
    attachSource(source: EventTarget | {
        on: (ev: string, cb: (d: unknown) => void) => void;
    }): void;
}
export default RelayConsumer;
//# sourceMappingURL=RelayConsumer.d.ts.map