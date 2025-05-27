import * as vscode from 'vscode';
import { Logger } from '../core/logging.js';
import { MCPManager } from '../mcp-integration/mcp-manager.js';
import { RooCoderMonitor } from '../monitoring/roo-coder-monitor.js';
import { AICoderRole } from '../ai-coder-integration.js';

export class AICoderIntegrationManager {
    private logger: Logger;
    private monitor: RooCoderMonitor;
    private activeCoders: Map<AICoderRole, boolean> = new Map();

    constructor(
        private mcpManager: MCPManager,
        private context: vscode.ExtensionContext
    ) {
        this.logger = Logger.getInstance();
        this.monitor = RooCoderMonitor.getInstance();
        this.initializeCoders();
    }

    private initializeCoders(): void {
        Object.values(AICoderRole).forEach(role => {
            this.activeCoders.set(role, false);
        });
    }

    async activateCoder(role: AICoderRole): Promise<void> {
        try {
            await this.mcpManager.executeTool('ai-coder-activate', { role });
            this.activeCoders.set(role, true);
            this.monitor.updateActiveAgents(this.getActiveCoders());
            
            this.logger.info(`Activated AI Coder: ${role}`);
        } catch (error) {
            this.logger.error(`Failed to activate AI Coder ${role}:`, error);
            throw error;
        }
    }

    async deactivateCoder(role: AICoderRole): Promise<void> {
        try {
            await this.mcpManager.executeTool('ai-coder-deactivate', { role });
            this.activeCoders.set(role, false);
            this.monitor.updateActiveAgents(this.getActiveCoders());
            
            this.logger.info(`Deactivated AI Coder: ${role}`);
        } catch (error) {
            this.logger.error(`Failed to deactivate AI Coder ${role}:`, error);
            throw error;
        }
    }

    private getActiveCoders(): string[] {
        return Array.from(this.activeCoders.entries())
            .filter(([_, active]) => active)
            .map(([role]) => role);
    }
}