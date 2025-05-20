"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TheFuseAPIImpl = void 0;
class TheFuseAPIImpl {
    constructor(agentClient, logger) {
        this.agentClient = agentClient;
        this.logger = logger;
    }
    async sendMessage(message) {
        try {
            const result = await this.agentClient.sendMessage({
                type: 'message',
                payload: message,
                metadata: {
                    timestamp: new Date().toISOString()
                }
            });
            return typeof result === 'string' ? result : JSON.stringify(result);
        }
        catch (error) {
            this.logger.error('Error sending message:', error);
            throw error;
        }
    }
    async getAvailableModels() {
        try {
            const result = await this.agentClient.sendMessage({
                type: 'command',
                command: 'get_available_models'
            });
            return Array.isArray(result) ? result : [];
        }
        catch (error) {
            this.logger.error('Error getting available models:', error);
            throw error;
        }
    }
    async getCurrentModel() {
        try {
            const result = await this.agentClient.sendMessage({
                type: 'command',
                command: 'get_current_model'
            });
            return typeof result === 'string' ? result : '';
        }
        catch (error) {
            this.logger.error('Error getting current model:', error);
            throw error;
        }
    }
}
exports.TheFuseAPIImpl = TheFuseAPIImpl;
//# sourceMappingURL=thefuse-api.js.map