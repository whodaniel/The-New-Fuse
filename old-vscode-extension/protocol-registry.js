"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtocolRegistry = void 0;
const logging_1 = require("./core/logging");
class ProtocolRegistry {
    constructor() {
        this.transports = new Map();
        this.logger = logging_1.Logger.getInstance();
    }
    registerTransport(transport) {
        this.transports.set(transport.id, transport);
        this.logger.log(`Registered transport: ${transport.name}`);
    }
    unregisterTransport(transportId) {
        const transport = this.transports.get(transportId);
        if (transport) {
            this.transports.delete(transportId);
            this.logger.log(`Unregistered transport: ${transport.name}`);
        }
    }
    async sendMessage(transportId, message) {
        const transport = this.transports.get(transportId);
        if (!transport) {
            throw new Error(`Transport ${transportId} not found`);
        }
        try {
            await transport.send(message);
        }
        catch (error) {
            this.logger.log(`Error sending message via ${transport.id}: ${error.message}`);
            throw error;
        }
    }
    async broadcastMessage(message) {
        const errors = [];
        for (const transport of this.transports.values()) {
            try {
                await transport.send(message);
            }
            catch (error) {
                errors.push(error);
                this.logger.log(`Error broadcasting to ${transport.id}: ${error.message}`);
            }
        }
        if (errors.length > 0) {
            throw new Error(`Broadcast failed for some transports: ${errors.map(e => e.message).join(', ')}`);
        }
    }
}
exports.ProtocolRegistry = ProtocolRegistry;
//# sourceMappingURL=protocol-registry.js.map