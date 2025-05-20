import { EventBus } from '../eventBus.js';
import { StateManager } from '../stateManager.js';
import { LoggingService } from '../../../services/logging.js';
import { MessageFactory } from '../messageTypes.js';
import { AgentStatus } from '../../../models/enums.js';
export class AgentBridge {
    constructor() {
        this.communicationManager = CommunicationManager.getInstance();
        this.eventBus = EventBus.getInstance();
        this.stateManager = StateManager.getInstance();
        this.logger = LoggingService.getInstance();
        this.setupEventListeners();
    }
    static getInstance() {
        if (!AgentBridge.instance) {
            AgentBridge.instance = new AgentBridge();
        }
        return AgentBridge.instance;
    }
    setupEventListeners() {
        this.eventBus.on('agent_message', (event) => {
            this.handleAgentMessage(event.payload);
        });
        this.eventBus.on('agent_status_change', (event) => {
            this.handleAgentStatusChange(event.payload);
        });
    }
    handleAgentMessage(message) {
        var _a;
        const agentId = (_a = message.metadata) === null || _a === void 0 ? void 0 : _a.agentId;
        if (!agentId) {
            this.logger.warn('Received agent message without agentId', { message });
            return;
        }
        this.stateManager.setState(['agents', agentId, 'lastMessage'], message);
        this.eventBus.emit('agent_message_processed', message, 'AgentBridge');
    }
    handleAgentStatusChange(payload) {
        const { agentId, status } = payload;
        this.stateManager.setState(['agents', agentId, 'status'], status);
        this.eventBus.emit('agent_status_processed', payload, 'AgentBridge');
    }
    async sendMessageToAgent(agentId, content) {
        try {
            const message = MessageFactory.createTextMessage(content, { agentId });
            await this.communicationManager.sendMessage(message);
            return { success: true, data: undefined };
        }
        catch (error) {
            this.logger.error('Failed to send message to agent', error);
            return {
                success: false,
                error: {
                    code: 'AGENT_MESSAGE_FAILED',
                    message: 'Failed to send message to agent',
                    details: error
                }
            };
        }
    }
    async getAgentConfig(agentId) {
        try {
            const config = this.stateManager.getState(['agents', agentId, 'config']);
            if (!config) {
                throw new Error('Agent config not found');
            }
            return { success: true, data: config };
        }
        catch (error) {
            this.logger.error('Failed to get agent config', error);
            return {
                success: false,
                error: {
                    code: 'AGENT_CONFIG_NOT_FOUND',
                    message: 'Failed to get agent configuration',
                    details: error
                }
            };
        }
    }
    async updateAgentStatus(agentId, status) {
        try {
            await this.communicationManager.send({
                type: 'update_agent_status',
                payload: { agentId, status }
            });
            return { success: true, data: undefined };
        }
        catch (error) {
            this.logger.error('Failed to update agent status', error);
            return {
                success: false,
                error: {
                    code: 'AGENT_STATUS_UPDATE_FAILED',
                    message: 'Failed to update agent status',
                    details: error
                }
            };
        }
    }
    getAgentStatus(agentId) {
        return this.stateManager.getState(['agents', agentId, 'status']) || AgentStatus.OFFLINE;
    }
    subscribeToAgentMessages(agentId, callback) {
        return this.eventBus.on('agent_message', (event) => {
            var _a;
            if (((_a = event.payload.metadata) === null || _a === void 0 ? void 0 : _a.agentId) === agentId) {
                callback(event.payload);
            }
        });
    }
    subscribeToAgentStatus(agentId, callback) {
        return this.stateManager.subscribe(['agents', agentId, 'status'], callback);
    }
}
//# sourceMappingURL=AgentBridge.js.map