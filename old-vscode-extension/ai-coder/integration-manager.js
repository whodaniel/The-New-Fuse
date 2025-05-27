"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AICoderIntegrationManager = void 0;
const logging_1 = require("../core/logging");
const roo_coder_monitor_1 = require("../monitoring/roo-coder-monitor");
const ai_coder_integration_1 = require("../ai-coder-integration");
class AICoderIntegrationManager {
    constructor(mcpManager, context) {
        this.mcpManager = mcpManager;
        this.context = context;
        this.activeCoders = new Map();
        this.logger = logging_1.Logger.getInstance();
        this.monitor = roo_coder_monitor_1.RooCoderMonitor.getInstance();
        this.initializeCoders();
    }
    initializeCoders() {
        Object.values(ai_coder_integration_1.AICoderRole).forEach(role => {
            this.activeCoders.set(role, false);
        });
    }
    async activateCoder(role) {
        try {
            await this.mcpManager.executeTool('ai-coder-activate', { role });
            this.activeCoders.set(role, true);
            this.monitor.updateActiveAgents(this.getActiveCoders());
            this.logger.info(`Activated AI Coder: ${role}`);
        }
        catch (error) {
            this.logger.error(`Failed to activate AI Coder ${role}:`, error);
            throw error;
        }
    }
    async deactivateCoder(role) {
        try {
            await this.mcpManager.executeTool('ai-coder-deactivate', { role });
            this.activeCoders.set(role, false);
            this.monitor.updateActiveAgents(this.getActiveCoders());
            this.logger.info(`Deactivated AI Coder: ${role}`);
        }
        catch (error) {
            this.logger.error(`Failed to deactivate AI Coder ${role}:`, error);
            throw error;
        }
    }
    getActiveCoders() {
        return Array.from(this.activeCoders.entries())
            .filter(([_, active]) => active)
            .map(([role]) => role);
    }
}
exports.AICoderIntegrationManager = AICoderIntegrationManager;
//# sourceMappingURL=integration-manager.js.map