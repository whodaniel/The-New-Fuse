import { Logger } from 'winston';
import { getLogger } from '../../core/src/logging/loggingConfig.js';
import { ClineBridgeClient } from '../../core/src/services/client.js';
import { DirectCommunication } from '../../core/src/communication/directCommunication.js';
import { AgentRole } from '../../core/src/types/agent.js';

export class ClineBridge {
    private client: ClineBridgeClient;
    private communication: DirectCommunication;
    private logger: Logger;

    constructor() {
        this.logger = getLogger('cline_bridge');
        this.client = new ClineBridgeClient();
        this.communication = new DirectCommunication(
            'cline_ai',
            'cascade_ai',
            AgentRole.OPTIMIZATION
        );
    }

    async initialize(): Promise<boolean> {
        try {
            await this.client.connect();
            await this.communication.initialize();
            
            this.logger.info('Cline bridge initialized successfully');
            return true;
        } catch (error) {
            this.logger.error(`Failed to initialize Cline bridge: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }

    async shutdown(): Promise<void> {
        try {
            await this.client.disconnect();
            await this.communication.shutdown();
            this.logger.info('Cline bridge shut down successfully');
        } catch (error) {
            this.logger.error(`Error during shutdown: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async sendTask(task: unknown): Promise<void> {
        try {
            await this.client.publish('AI_TASK_CHANNEL', JSON.stringify(task));
            this.logger.debug('Task sent successfully', { task });
        } catch (error) {
            this.logger.error(`Failed to send task: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    async onResult(callback: (result: unknown) => Promise<void>): Promise<void> {
        try {
            await this.client.subscribe('AI_RESULT_CHANNEL');
            this.client.on('message', async (channel: string, message: string) => {
                if (channel === 'AI_RESULT_CHANNEL') {
                    try {
                        const result = JSON.parse(message);
                        await callback(result);
                    } catch (error) {
                        this.logger.error(`Error processing result: ${error instanceof Error ? error.message : String(error)}`);
                    }
                }
            });
        } catch (error) {
            this.logger.error(`Failed to set up result handler: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    async isHealthy(): Promise<boolean> {
        try {
            const clientHealth = await this.client.ping();
            const communicationHealth = await this.communication.checkHealth();
            return clientHealth && communicationHealth;
        } catch (error) {
            this.logger.error(`Health check failed: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }
}
