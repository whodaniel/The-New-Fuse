"use strict";
/**
 * Message Router for The New Fuse Relay System
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRouter = void 0;
const events_1 = require("events");
class MessageRouter extends events_1.EventEmitter {
    logger;
    constructor(logger) {
        super();
        this.logger = logger;
    }
    async route(message, transports, agentRegistry) {
        const targetId = message.target;
        if (!targetId) {
            this.logger.warn('Cannot route message without a target.');
            return false;
        }
        // Find the transport for the target agent
        const agent = agentRegistry.getAgent(targetId);
        if (agent && agent.metadata?.transport) {
            const transport = transports.get(agent.metadata.transport);
            if (transport) {
                return transport.send(message);
            }
        }
        // If no specific transport is found, try to send to all
        for (const transport of transports.values()) {
            if (await transport.send(message)) {
                this.emit('messageRouted', message);
                return true;
            }
        }
        this.logger.warn(`Could not find a transport to route message to ${targetId}`);
        return false;
    }
}
exports.MessageRouter = MessageRouter;
//# sourceMappingURL=MessageRouter.js.map