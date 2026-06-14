export class CommunicationProtocol {
    constructor() {
        this.handlers = new Map();
    }
    registerHandler(handler) {
        this.handlers.set(handler.type, handler);
    }
    async processMessage(message) {
        const handler = this.handlers.get(message.type);
        if (handler) {
            await handler.handle(message);
        }
    }
    createMessage(type, payload, senderId, recipientId) {
        return {
            type,
            payload,
            timestamp: new Date(),
            senderId,
            recipientId,
        };
    }
}
//# sourceMappingURL=CommunicationProtocol.js.map