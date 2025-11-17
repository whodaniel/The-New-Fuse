/**
 * Protocol Translator for The New Fuse Relay System
 */
import { EventEmitter } from 'events';
export class ProtocolTranslator extends EventEmitter {
    logger;
    adapters = new Map();
    constructor(logger) {
        super();
        this.logger = logger;
    }
    registerAdapter(adapter) {
        this.adapters.set(adapter.name, adapter);
        this.logger.info(`Registered protocol adapter: ${adapter.name}`);
    }
    async translate(message, targetProtocol) {
        const sourceProtocol = message.metadata?.protocol;
        if (!sourceProtocol || sourceProtocol === targetProtocol) {
            return message;
        }
        const adapter = this.findAdapter(sourceProtocol, targetProtocol);
        if (adapter) {
            return adapter.translate(message, sourceProtocol, targetProtocol);
        }
        else {
            this.logger.warn(`No direct adapter found from ${sourceProtocol} to ${targetProtocol}. Attempting multi-step translation.`);
            // Attempt to find a path through a common protocol (e.g., A2A)
            // This is a simplified example. A real implementation would need a more robust graph traversal algorithm.
            const a2aAdapter = this.findAdapter(sourceProtocol, 'a2a-v2.0');
            const a2aToTargetAdapter = this.findAdapter('a2a-v2.0', targetProtocol);
            if (a2aAdapter && a2aToTargetAdapter) {
                const intermediateMessage = await a2aAdapter.translate(message, sourceProtocol, 'a2a-v2.0');
                return a2aToTargetAdapter.translate(intermediateMessage, 'a2a-v2.0', targetProtocol);
            }
        }
        this.logger.error(`Could not find translation path from ${sourceProtocol} to ${targetProtocol}`);
        return message; // Or throw an error
    }
    findAdapter(source, target) {
        for (const adapter of this.adapters.values()) {
            if (adapter.canTranslate(source, target)) {
                return adapter;
            }
        }
        return undefined;
    }
}
//# sourceMappingURL=ProtocolTranslator.js.map