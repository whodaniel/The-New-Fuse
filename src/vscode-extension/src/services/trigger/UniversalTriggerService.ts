/**
 * Universal Trigger Service for The New Fuse
 * 
 * Integrates AI agent injection research with existing Copilot coordination system
 * Provides comprehensive trigger and engagement management across all AI platforms
 */

import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import { AgentCommunicationService } from '../AgentCommunicationService';
import { CopilotInstanceCoordinator } from '../../copilot-coordination/CopilotInstanceCoordinator';
import { AgentMessageType } from '../../types/agent-communication';

export interface TriggerRequest {
    type: 'manual' | 'heartbeat' | 'wake_up' | 'recovery' | 'coordination' | 'direct_injection';
    message: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    method?: 'ui_elements' | 'coordinates' | 'command_palette' | 'json_storage' | 'extension_api' | 'auto';
    targetPlatform?: string;
}

export interface TriggerResult {
    success: boolean;
    error?: string;
    timestamp: Date.now();
    method: string;
    responseTime?: number;
    platform?: string;
}

export interface HeartbeatConfig {
    interval: number; // seconds
    message: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface AgentInfo {
    id: string;
    platform: string;
    name: string;
    capabilities: string[];
    status: 'active' | 'idle' | 'dormant' | 'offline';
    lastActivity: number;
    injectionMethods: string[];
    protectionLevel: 'none' | 'basic' | 'advanced' | 'enterprise';
}

/**
 * Universal Trigger Service that coordinates AI agent engagement across all platforms
 */
export class UniversalTriggerService extends EventEmitter {
    private context: vscode.ExtensionContext;
    private agentCommunicationService: AgentCommunicationService;
    private copilotCoordinator: CopilotInstanceCoordinator;
    private heartbeats = new Map<string, NodeJS.Timer>();
    private heartbeatConfigs = new Map<string, HeartbeatConfig>();
    private registeredAgents = new Map<string, AgentInfo>();
    private triggerCount = 0;

    constructor(
        context: vscode.ExtensionContext,
        agentCommunicationService: AgentCommunicationService,
        copilotCoordinator: CopilotInstanceCoordinator
    ) {
        super();
        this.context = context;
        this.agentCommunicationService = agentCommunicationService;
        this.copilotCoordinator = copilotCoordinator;
        
        this.initializeService();
    }

    private async initializeService(): Promise<void> {
        console.log('[UniversalTriggerService] Initializing...');
        
        // Subscribe to agent communication events
        this.agentCommunicationService.subscribe((message) => {
            this.handleAgentMessage(message);
        });

        // Subscribe to Copilot coordination events
        this.copilotCoordinator.on('instanceRegistered', (instance) => {
            this.registerCopilotInstance(instance);
        });

        // Register built-in agent platforms
        await this.registerBuiltInAgents();

        console.log('[UniversalTriggerService] Initialized successfully');
    }

    /**
     * Trigger a specific AI agent with a message
     */
    async triggerAgent(agentId: string, trigger: TriggerRequest): Promise<TriggerResult> {
        const startTime = Date.now();
        const agent = this.registeredAgents.get(agentId);

        if (!agent) {
            return {
                success: false,
                error: `Agent ${agentId} not found`,
                timestamp: Date.now(),
                method: 'none'
            };
        }

        try {
            const result = await this.executeAgentTrigger(agent, trigger);
            
            // Update agent last activity
            agent.lastActivity = Date.now();
            this.registeredAgents.set(agentId, agent);

            // Broadcast trigger result
            await this.agentCommunicationService.broadcastMessage(
                AgentMessageType.TRIGGER_RESULT,
                { agentId, trigger, result }
            );

            this.triggerCount++;
            this.emit('triggerExecuted', { agentId, trigger, result });

            return {
                ...result,
                responseTime: Date.now() - startTime
            };

        } catch (error) {
            const errorResult: TriggerResult = {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                timestamp: Date.now(),
                method: 'failed',
                platform: agent.platform
            };

            this.emit('triggerFailed', { agentId, trigger, error: errorResult });
            return errorResult;
        }
    }

    /**
     * Execute platform-specific trigger
     */
    private async executeAgentTrigger(agent: AgentInfo, trigger: TriggerRequest): Promise<TriggerResult> {
        switch (agent.platform) {
            case 'claude_desktop':
                return await this.triggerClaudeDesktop(trigger);
            
            case 'vscode_copilot':
                return await this.triggerVSCodeCopilot(trigger);
            
            case 'chrome_ai':
                return await this.triggerChromeAI(trigger);
            
            case 'copilot_instances':
                return await this.triggerCopilotInstances(trigger);
            
            default:
                throw new Error(`Unsupported platform: ${agent.platform}`);
        }
    }

    /**
     * Trigger Claude Desktop using our proven injection methods
     */
    private async triggerClaudeDesktop(trigger: TriggerRequest): Promise<TriggerResult> {
        const method = trigger.method || 'auto';
        
        try {
            // Check if Claude Desktop is running
            const isRunning = await this.isClaudeDesktopRunning();
            if (!isRunning) {
                return {
                    success: false,
                    error: 'Claude Desktop is not running',
                    timestamp: Date.now(),
                    method: 'none',
                    platform: 'claude_desktop'
                };
            }

            // Try UI elements method first, then fallback to coordinates
            if (method === 'ui_elements' || method === 'auto') {
                try {
                    const result = await this.injectToClaudeViaUIElements(trigger.message);
                    if (result.success) return result;
                } catch (error) {
                    console.warn('[UniversalTriggerService] UI element injection failed, falling back to coordinates');
                }
            }

            // Fallback to coordinate-based injection (our proven method)
            return await this.injectToClaudeViaCoordinates(trigger.message);

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                timestamp: Date.now(),
                method: 'failed',
                platform: 'claude_desktop'
            };
        }
    }

    /**
     * Trigger VS Code Copilot using multiple injection methods
     */
    private async triggerVSCodeCopilot(trigger: TriggerRequest): Promise<TriggerResult> {
        try {
            // Use the existing Copilot coordination system
            const copilotInstances = this.copilotCoordinator.getActiveInstances();
            
            if (copilotInstances.length === 0) {
                return {
                    success: false,
                    error: 'No active Copilot instances found',
                    timestamp: Date.now(),
                    method: 'none',
                    platform: 'vscode_copilot'
                };
            }

            // Share context with Copilot instances
            await this.copilotCoordinator.shareContext('universal-trigger-service', {
                currentTask: trigger.message,
                recentActivity: ['trigger_injection'],
                workspaceContext: vscode.workspace.name
            });

            // Try command palette injection
            if (trigger.method === 'command_palette' || trigger.method === 'auto') {
                try {
                    const result = await this.injectToCopilotViaCommandPalette(trigger.message);
                    if (result.success) return result;
                } catch (error) {
                    console.warn('[UniversalTriggerService] Command palette injection failed');
                }
            }

            // Try extension API integration
            return await this.injectToCopilotViaAPI(trigger.message);

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                timestamp: Date.now(),
                method: 'failed',
                platform: 'vscode_copilot'
            };
        }
    }

    /**
     * Trigger Chrome AI platforms
     */
    private async triggerChromeAI(trigger: TriggerRequest): Promise<TriggerResult> {
        // This would integrate with Chrome extension messaging
        // For now, return placeholder implementation
        return {
            success: true,
            timestamp: Date.now(),
            method: 'chrome_extension_bridge',
            platform: 'chrome_ai'
        };
    }

    /**
     * Trigger Copilot instances through coordination system
     */
    private async triggerCopilotInstances(trigger: TriggerRequest): Promise<TriggerResult> {
        try {
            const context = {
                currentTask: trigger.message,
                recentActivity: ['coordination_trigger'],
                triggerPriority: trigger.priority
            };

            await this.copilotCoordinator.shareContext('universal-trigger-service', context);

            return {
                success: true,
                timestamp: Date.now(),
                method: 'copilot_coordination',
                platform: 'copilot_instances'
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                timestamp: Date.now(),
                method: 'failed',
                platform: 'copilot_instances'
            };
        }
    }

    /**
     * Start heartbeat for an agent
     */
    async startHeartbeat(agentId: string, config: HeartbeatConfig): Promise<void> {
        // Stop existing heartbeat if any
        await this.stopHeartbeat(agentId);

        // Store configuration
        this.heartbeatConfigs.set(agentId, config);

        // Start new heartbeat timer
        const timer = setInterval(async () => {
            await this.sendHeartbeat(agentId);
        }, config.interval * 1000);

        this.heartbeats.set(agentId, timer);

        // Broadcast heartbeat started event
        await this.agentCommunicationService.broadcastMessage(
            AgentMessageType.HEARTBEAT_STARTED,
            { agentId, config }
        );

        this.emit('heartbeatStarted', { agentId, config });
        console.log(`[UniversalTriggerService] Heartbeat started for ${agentId}`);
    }

    /**
     * Stop heartbeat for an agent
     */
    async stopHeartbeat(agentId: string): Promise<void> {
        const timer = this.heartbeats.get(agentId);
        if (timer) {
            clearInterval(timer);
            this.heartbeats.delete(agentId);
            this.heartbeatConfigs.delete(agentId);

            await this.agentCommunicationService.broadcastMessage(
                AgentMessageType.HEARTBEAT_STOPPED,
                { agentId }
            );

            this.emit('heartbeatStopped', { agentId });
            console.log(`[UniversalTriggerService] Heartbeat stopped for ${agentId}`);
        }
    }

    /**
     * Send heartbeat to agent
     */
    private async sendHeartbeat(agentId: string): Promise<void> {
        const config = this.heartbeatConfigs.get(agentId);
        if (!config) return;

        const result = await this.triggerAgent(agentId, {
            type: 'heartbeat',
            message: config.message,
            priority: config.priority
        });

        this.emit('heartbeatSent', { agentId, result });

        // Handle heartbeat failure
        if (!result.success) {
            await this.handleHeartbeatFailure(agentId, result);
        }
    }

    /**
     * Handle heartbeat failure
     */
    private async handleHeartbeatFailure(agentId: string, result: TriggerResult): Promise<void> {
        const agent = this.registeredAgents.get(agentId);
        if (agent) {
            agent.status = 'dormant';
            this.registeredAgents.set(agentId, agent);

            // Broadcast dormancy detection
            await this.agentCommunicationService.broadcastMessage(
                AgentMessageType.AGENT_DORMANT,
                { agentId, lastFailure: result }
            );

            this.emit('agentDormant', { agentId, result });
        }
    }

    /**
     * Register built-in AI agent platforms
     */
    private async registerBuiltInAgents(): Promise<void> {
        // Claude Desktop
        this.registerAgent({
            id: 'claude_desktop_main',
            platform: 'claude_desktop',
            name: 'Claude Desktop',
            capabilities: ['chat', 'analysis', 'coding', 'writing'],
            status: 'active',
            lastActivity: Date.now(),
            injectionMethods: ['ui_elements', 'coordinates'],
            protectionLevel: 'enterprise'
        });

        // VS Code Copilot
        this.registerAgent({
            id: 'vscode_copilot_main',
            platform: 'vscode_copilot',
            name: 'VS Code Copilot',
            capabilities: ['code_completion', 'chat', 'suggestions'],
            status: 'active',
            lastActivity: Date.now(),
            injectionMethods: ['command_palette', 'extension_api', 'json_storage'],
            protectionLevel: 'basic'
        });

        // Copilot Instances (from coordination system)
        this.registerAgent({
            id: 'copilot_instances',
            platform: 'copilot_instances',
            name: 'Copilot Instance Coordination',
            capabilities: ['multi_instance_coordination', 'context_sharing'],
            status: 'active',
            lastActivity: Date.now(),
            injectionMethods: ['copilot_coordination'],
            protectionLevel: 'basic'
        });

        console.log('[UniversalTriggerService] Built-in agents registered');
    }

    /**
     * Register an agent
     */
    registerAgent(agent: AgentInfo): void {
        this.registeredAgents.set(agent.id, agent);
        this.emit('agentRegistered', agent);
    }

    /**
     * Register Copilot instance from coordination system
     */
    private registerCopilotInstance(instance: any): void {
        const agent: AgentInfo = {
            id: `copilot_${instance.id}`,
            platform: 'copilot_instances',
            name: `Copilot ${instance.type}`,
            capabilities: instance.capabilities,
            status: instance.status === 'active' ? 'active' : 'idle',
            lastActivity: Date.now(),
            injectionMethods: ['copilot_coordination'],
            protectionLevel: 'basic'
        };

        this.registerAgent(agent);
    }

    /**
     * Handle agent communication messages
     */
    private async handleAgentMessage(message: any): Promise<void> {
        switch (message.type) {
            case AgentMessageType.TRIGGER_REQUEST:
                const { agentId, trigger } = message.payload;
                await this.triggerAgent(agentId, trigger);
                break;
            
            case AgentMessageType.HEARTBEAT_REQUEST:
                const { agentId: hbAgentId, config } = message.payload;
                await this.startHeartbeat(hbAgentId, config);
                break;
        }
    }

    /**
     * Claude Desktop injection methods (from our research)
     */
    private async isClaudeDesktopRunning(): Promise<boolean> {
        try {
            const script = `
            tell application "System Events"
                return (count of (every process whose name is "Claude")) > 0
            end tell
            `;
            
            await this.executeAppleScript(script);
            return true;
        } catch (error) {
            return false;
        }
    }

    private async injectToClaudeViaCoordinates(message: string): Promise<TriggerResult> {
        const script = `
        tell application "Claude"
            activate
            delay 1.5
        end tell
        
        tell application "System Events"
            tell application process "Claude"
                click at {600, 800}
                delay 0.5
                keystroke "${this.escapeAppleScriptString(message)}"
                delay 0.2
                key code 36 -- Enter
                delay 0.3
                key code 36 using {command down} -- Cmd+Enter backup
            end tell
        end tell
        `;

        try {
            await this.executeAppleScript(script);
            return {
                success: true,
                timestamp: Date.now(),
                method: 'coordinates',
                platform: 'claude_desktop'
            };
        } catch (error) {
            throw new Error(`Coordinate injection failed: ${error}`);
        }
    }

    private async injectToClaudeViaUIElements(message: string): Promise<TriggerResult> {
        const script = `
        tell application "Claude"
            activate
            delay 1.5
        end tell
        
        tell application "System Events"
            tell application process "Claude"
                try
                    set value of text area 1 of window 1 to "${this.escapeAppleScriptString(message)}"
                    delay 0.8
                    click button "Send" of window 1
                    delay 0.3
                on error
                    -- Fallback to coordinate method
                    click at {600, 800}
                    delay 0.5
                    keystroke "${this.escapeAppleScriptString(message)}"
                    key code 36
                end try
            end tell
        end tell
        `;

        try {
            await this.executeAppleScript(script);
            return {
                success: true,
                timestamp: Date.now(),
                method: 'ui_elements',
                platform: 'claude_desktop'
            };
        } catch (error) {
            throw new Error(`UI element injection failed: ${error}`);
        }
    }

    /**
     * VS Code Copilot injection methods
     */
    private async injectToCopilotViaCommandPalette(message: string): Promise<TriggerResult> {
        try {
            await vscode.commands.executeCommand('workbench.action.showCommands');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Type the Copilot chat command
            await vscode.commands.executeCommand('type', { text: 'GitHub Copilot: Open Chat' });
            await new Promise(resolve => setTimeout(resolve, 300));
            
            await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Try to send the message to Copilot chat
            await vscode.commands.executeCommand('github.copilot.chat.prompt', message);

            return {
                success: true,
                timestamp: Date.now(),
                method: 'command_palette',
                platform: 'vscode_copilot'
            };
        } catch (error) {
            throw new Error(`Command palette injection failed: ${error}`);
        }
    }

    private async injectToCopilotViaAPI(message: string): Promise<TriggerResult> {
        try {
            // Use VS Code's Copilot API if available
            await vscode.commands.executeCommand('github.copilot.chat.newChatEditor', {
                message: message
            });

            return {
                success: true,
                timestamp: Date.now(),
                method: 'extension_api',
                platform: 'vscode_copilot'
            };
        } catch (error) {
            throw new Error(`Extension API injection failed: ${error}`);
        }
    }

    /**
     * Utility methods
     */
    private async executeAppleScript(script: string): Promise<string> {
        const { execSync } = require('child_process');
        return execSync(`osascript -e '${script}'`, { encoding: 'utf8' });
    }

    private escapeAppleScriptString(str: string): string {
        return str.replace(/"/g, '\\"').replace(/\\/g, '\\\\');
    }

    /**
     * Get service statistics
     */
    getStats(): any {
        return {
            registeredAgents: this.registeredAgents.size,
            activeHeartbeats: this.heartbeats.size,
            totalTriggers: this.triggerCount,
            agents: Array.from(this.registeredAgents.values()).map(agent => ({
                id: agent.id,
                platform: agent.platform,
                status: agent.status,
                lastActivity: agent.lastActivity
            }))
        };
    }

    /**
     * Get all registered agents
     */
    getRegisteredAgents(): AgentInfo[] {
        return Array.from(this.registeredAgents.values());
    }

    /**
     * Check if agent is active
     */
    isAgentActive(agentId: string): boolean {
        const agent = this.registeredAgents.get(agentId);
        return agent ? agent.status === 'active' : false;
    }

    /**
     * Dispose resources
     */
    dispose(): void {
        // Stop all heartbeats
        for (const [agentId] of this.heartbeats) {
            this.stopHeartbeat(agentId);
        }

        this.removeAllListeners();
        this.registeredAgents.clear();
    }
}
