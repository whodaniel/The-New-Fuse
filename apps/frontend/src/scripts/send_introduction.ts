import { LoggingService } from '../services/logging.js';
import { ConnectionManager } from './connect_and_send.js';
export class IntroductionManager {
    constructor() {
        this.bridge = CascadeBridge.getInstance();
        this.logger = LoggingService.getInstance();
        this.connectionManager = new ConnectionManager();
    }
    async sendIntroduction(agentId, capabilities, preferences, metadata) {
        const message = {
            type: 'introduction',
            agentId,
            capabilities,
            preferences,
            metadata: Object.assign(Object.assign({}, metadata), { timestamp: Date.now(), version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0' })
        };
        try {
            await this.connectionManager.connectAndSend({
                type: 'agent_introduction',
                payload: message,
                metadata: {
                    priority: 'high',
                    source: 'frontend'
                }
            });
            this.logger.info('Introduction sent successfully', {
                agentId,
                capabilities: capabilities.length
            });
        }
        catch (error) {
            this.logger.error('Failed to send introduction', error, { agentId });
            throw error;
        }
    }
    async resendIntroduction(agentId) {
        try {
            const storedCapabilities = await this.getStoredCapabilities(agentId);
            const storedPreferences = await this.getStoredPreferences(agentId);
            await this.sendIntroduction(agentId, storedCapabilities, storedPreferences, {
                resend: true,
                originalTimestamp: Date.now()
            });
        }
        catch (error) {
            this.logger.error('Failed to resend introduction', error, { agentId });
            throw error;
        }
    }
    async getStoredCapabilities(agentId) {
        return ['chat', 'task_execution', 'learning'];
    }
    async getStoredPreferences(agentId) {
        return {
            language: 'en',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            theme: 'system'
        };
    }
}
//# sourceMappingURL=send_introduction.js.map