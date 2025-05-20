import { EventBus } from '../eventBus.js';
import { StateManager } from '../stateManager.js';
import { LoggingService } from '../../../services/logging.js';
export class WorkspaceBridge {
    constructor() {
        this.communicationManager = CommunicationManager.getInstance();
        this.eventBus = EventBus.getInstance();
        this.stateManager = StateManager.getInstance();
        this.logger = LoggingService.getInstance();
        this.setupEventListeners();
    }
    static getInstance() {
        if (!WorkspaceBridge.instance) {
            WorkspaceBridge.instance = new WorkspaceBridge();
        }
        return WorkspaceBridge.instance;
    }
    setupEventListeners() {
        this.eventBus.on('workspace_update', (event) => {
            this.handleWorkspaceUpdate(event.payload);
        });
        this.eventBus.on('workspace_member_update', (event) => {
            this.handleMemberUpdate(event.payload);
        });
    }
    handleWorkspaceUpdate(event) {
        const { workspaceId, changes } = event;
        const currentConfig = this.stateManager.getState(['workspaces', workspaceId]);
        if (currentConfig) {
            this.stateManager.setState(['workspaces', workspaceId], Object.assign(Object.assign({}, currentConfig), changes));
        }
    }
    handleMemberUpdate(event) {
        const { workspaceId, userId, role } = event;
        const path = ['workspaces', workspaceId, 'members', userId];
        this.stateManager.setState(path, Object.assign(Object.assign({}, this.stateManager.getState(path)), { role }));
    }
    async createWorkspace(config) {
        try {
            const response = await this.communicationManager.send({
                type: 'create_workspace',
                payload: config
            });
            return { success: true, data: response };
        }
        catch (error) {
            this.logger.error('Failed to create workspace', error);
            return {
                success: false,
                error: {
                    code: 'WORKSPACE_CREATION_FAILED',
                    message: 'Failed to create workspace',
                    details: error
                }
            };
        }
    }
    async getWorkspaceConfig(workspaceId) {
        try {
            const config = this.stateManager.getState(['workspaces', workspaceId]);
            if (!config) {
                const response = await this.communicationManager.send({
                    type: 'get_workspace',
                    payload: { workspaceId }
                });
                this.stateManager.setState(['workspaces', workspaceId], response);
                return { success: true, data: response };
            }
            return { success: true, data: config };
        }
        catch (error) {
            this.logger.error('Failed to get workspace config', error);
            return {
                success: false,
                error: {
                    code: 'WORKSPACE_NOT_FOUND',
                    message: 'Failed to get workspace configuration',
                    details: error
                }
            };
        }
    }
    async updateWorkspace(workspaceId, changes) {
        try {
            await this.communicationManager.send({
                type: 'update_workspace',
                payload: { workspaceId, changes }
            });
            return { success: true, data: undefined };
        }
        catch (error) {
            this.logger.error('Failed to update workspace', error);
            return {
                success: false,
                error: {
                    code: 'WORKSPACE_UPDATE_FAILED',
                    message: 'Failed to update workspace',
                    details: error
                }
            };
        }
    }
    async addMember(workspaceId, userId, role) {
        try {
            await this.communicationManager.send({
                type: 'add_workspace_member',
                payload: { workspaceId, userId, role }
            });
            return { success: true, data: undefined };
        }
        catch (error) {
            this.logger.error('Failed to add workspace member', error);
            return {
                success: false,
                error: {
                    code: 'MEMBER_ADD_FAILED',
                    message: 'Failed to add member to workspace',
                    details: error
                }
            };
        }
    }
    async removeMember(workspaceId, userId) {
        try {
            await this.communicationManager.send({
                type: 'remove_workspace_member',
                payload: { workspaceId, userId }
            });
            return { success: true, data: undefined };
        }
        catch (error) {
            this.logger.error('Failed to remove workspace member', error);
            return {
                success: false,
                error: {
                    code: 'MEMBER_REMOVE_FAILED',
                    message: 'Failed to remove member from workspace',
                    details: error
                }
            };
        }
    }
    subscribeToWorkspaceUpdates(workspaceId, callback) {
        return this.stateManager.subscribe(['workspaces', workspaceId], callback);
    }
    subscribeTomemberUpdates(workspaceId, callback) {
        return this.stateManager.subscribe(['workspaces', workspaceId, 'members'], callback);
    }
}
//# sourceMappingURL=WorkspaceBridge.js.map