/**
 * Trigger Command Interface for The New Fuse
 * 
 * Provides command handlers that integrate with VS Code command system
 * and can be called by other AI agents through The New Fuse framework
 */

import * as vscode from 'vscode';
import { UniversalTriggerService, TriggerRequest, HeartbeatConfig } from './UniversalTriggerService';
import { AgentCommunicationService } from '../AgentCommunicationService';

export class TriggerCommandInterface {
    private triggerService: UniversalTriggerService;
    private agentCommunicationService: AgentCommunicationService;
    private context: vscode.ExtensionContext;

    constructor(
        context: vscode.ExtensionContext,
        triggerService: UniversalTriggerService,
        agentCommunicationService: AgentCommunicationService
    ) {
        this.context = context;
        this.triggerService = triggerService;
        this.agentCommunicationService = agentCommunicationService;
        
        this.registerCommands();
        this.setupMessageHandlers();
    }

    /**
     * Register VS Code commands for trigger functionality
     */
    private registerCommands(): void {
        // Basic trigger commands
        this.context.subscriptions.push(
            vscode.commands.registerCommand('theNewFuse.trigger.agent', async (agentId: string, message: string) => {
                return await this.handleTriggerAgent(agentId, message);
            })
        );

        this.context.subscriptions.push(
            vscode.commands.registerCommand('theNewFuse.trigger.claudeDesktop', async (message: string) => {
                return await this.handleTriggerClaudeDesktop(message);
            })
        );

        this.context.subscriptions.push(
            vscode.commands.registerCommand('theNewFuse.trigger.vscodeCopilot', async (message: string) => {
                return await this.handleTriggerVSCodeCopilot(message);
            })
        );

        // Heartbeat commands
        this.context.subscriptions.push(
            vscode.commands.registerCommand('theNewFuse.heartbeat.start', async (agentId: string, interval: number, message?: string) => {
                return await this.handleStartHeartbeat(agentId, interval, message);
            })
        );

        this.context.subscriptions.push(
            vscode.commands.registerCommand('theNewFuse.heartbeat.stop', async (agentId: string) => {
                return await this.handleStopHeartbeat(agentId);
            })
        );

        // Status and management commands
        this.context.subscriptions.push(
            vscode.commands.registerCommand('theNewFuse.trigger.getStats', async () => {
                return this.triggerService.getStats();
            })
        );

        this.context.subscriptions.push(
            vscode.commands.registerCommand('theNewFuse.trigger.listAgents', async () => {
                return this.triggerService.getRegisteredAgents();
            })
        );

        // Advanced coordination commands
        this.context.subscriptions.push(
            vscode.commands.registerCommand('theNewFuse.trigger.coordinateAgents', async (agentIds: string[], message: string) => {
                return await this.handleCoordinateAgents(agentIds, message);
            })
        );

        this.context.subscriptions.push(
            vscode.commands.registerCommand('theNewFuse.trigger.wakeUpAgent', async (agentId: string) => {
                return await this.handleWakeUpAgent(agentId);
            })
        );

        console.log('[TriggerCommandInterface] Commands registered');
    }

    /**
     * Setup message handlers for agent communication
     */
    private setupMessageHandlers(): void {
        // Listen for trigger requests from other agents
        this.agentCommunicationService.subscribe(async (message) => {
            switch (message.type) {
                case 'TRIGGER_AGENT_REQUEST':
                    await this.handleAgentTriggerRequest(message.payload);
                    break;
                case 'START_HEARTBEAT_REQUEST':
                    await this.handleHeartbeatRequest(message.payload);
                    break;
                case 'COORDINATE_AGENTS_REQUEST':
                    await this.handleCoordinationRequest(message.payload);
                    break;
            }
        });
    }

    /**
     * Command Handlers
     */

    async handleTriggerAgent(agentId: string, message: string, priority: string = 'medium'): Promise<any> {
        try {
            const trigger: TriggerRequest = {
                type: 'manual',
                message,
                priority: priority as any,
                method: 'auto'
            };

            const result = await this.triggerService.triggerAgent(agentId, trigger);
            
            if (result.success) {
                vscode.window.showInformationMessage(`✅ Agent ${agentId} triggered successfully`);
            } else {
                vscode.window.showErrorMessage(`❌ Failed to trigger agent ${agentId}: ${result.error}`);
            }

            return result;
        } catch (error) {
            const errorMsg = `Error triggering agent ${agentId}: ${error}`;
            vscode.window.showErrorMessage(errorMsg);
            return { success: false, error: errorMsg };
        }
    }

    async handleTriggerClaudeDesktop(message: string, method: string = 'auto'): Promise<any> {
        try {
            const trigger: TriggerRequest = {
                type: 'direct_injection',
                message,
                priority: 'medium',
                method: method as any,
                targetPlatform: 'claude_desktop'
            };

            const result = await this.triggerService.triggerAgent('claude_desktop_main', trigger);
            
            if (result.success) {
                vscode.window.showInformationMessage(`✅ Claude Desktop triggered: "${message}"`);
            } else {
                vscode.window.showErrorMessage(`❌ Failed to trigger Claude Desktop: ${result.error}`);
            }

            return result;
        } catch (error) {
            const errorMsg = `Error triggering Claude Desktop: ${error}`;
            vscode.window.showErrorMessage(errorMsg);
            return { success: false, error: errorMsg };
        }
    }

    async handleTriggerVSCodeCopilot(message: string, method: string = 'auto'): Promise<any> {
        try {
            const trigger: TriggerRequest = {
                type: 'direct_injection',
                message,
                priority: 'medium',
                method: method as any,
                targetPlatform: 'vscode_copilot'
            };

            const result = await this.triggerService.triggerAgent('vscode_copilot_main', trigger);
            
            if (result.success) {
                vscode.window.showInformationMessage(`✅ VS Code Copilot triggered: "${message}"`);
            } else {
                vscode.window.showErrorMessage(`❌ Failed to trigger VS Code Copilot: ${result.error}`);
            }

            return result;
        } catch (error) {
            const errorMsg = `Error triggering VS Code Copilot: ${error}`;
            vscode.window.showErrorMessage(errorMsg);
            return { success: false, error: errorMsg };
        }
    }

    async handleStartHeartbeat(agentId: string, interval: number, message?: string): Promise<any> {
        try {
            const config: HeartbeatConfig = {
                interval,
                message: message || 'ping - continue monitoring',
                priority: 'low'
            };

            await this.triggerService.startHeartbeat(agentId, config);
            
            vscode.window.showInformationMessage(`💓 Heartbeat started for ${agentId} (${interval}s interval)`);
            return { success: true, agentId, config };
        } catch (error) {
            const errorMsg = `Error starting heartbeat for ${agentId}: ${error}`;
            vscode.window.showErrorMessage(errorMsg);
            return { success: false, error: errorMsg };
        }
    }

    async handleStopHeartbeat(agentId: string): Promise<any> {
        try {
            await this.triggerService.stopHeartbeat(agentId);
            
            vscode.window.showInformationMessage(`🛑 Heartbeat stopped for ${agentId}`);
            return { success: true, agentId };
        } catch (error) {
            const errorMsg = `Error stopping heartbeat for ${agentId}: ${error}`;
            vscode.window.showErrorMessage(errorMsg);
            return { success: false, error: errorMsg };
        }
    }

    async handleCoordinateAgents(agentIds: string[], message: string): Promise<any> {
        try {
            const results = [];
            
            for (const agentId of agentIds) {
                const trigger: TriggerRequest = {
                    type: 'coordination',
                    message,
                    priority: 'medium',
                    method: 'auto'
                };

                const result = await this.triggerService.triggerAgent(agentId, trigger);
                results.push({ agentId, result });
            }

            const successCount = results.filter(r => r.result.success).length;
            vscode.window.showInformationMessage(`🤝 Coordinated ${successCount}/${agentIds.length} agents`);
            
            return { success: true, results };
        } catch (error) {
            const errorMsg = `Error coordinating agents: ${error}`;
            vscode.window.showErrorMessage(errorMsg);
            return { success: false, error: errorMsg };
        }
    }

    async handleWakeUpAgent(agentId: string): Promise<any> {
        try {
            const trigger: TriggerRequest = {
                type: 'wake_up',
                message: 'ping - wake up and continue',
                priority: 'high',
                method: 'auto'
            };

            const result = await this.triggerService.triggerAgent(agentId, trigger);
            
            if (result.success) {
                vscode.window.showInformationMessage(`⏰ Agent ${agentId} wake-up call sent`);
            } else {
                vscode.window.showErrorMessage(`❌ Failed to wake up agent ${agentId}: ${result.error}`);
            }

            return result;
        } catch (error) {
            const errorMsg = `Error waking up agent ${agentId}: ${error}`;
            vscode.window.showErrorMessage(errorMsg);
            return { success: false, error: errorMsg };
        }
    }

    /**
     * Message Handlers for Agent Communication
     */

    private async handleAgentTriggerRequest(payload: any): Promise<void> {
        const { agentId, message, priority } = payload;
        await this.handleTriggerAgent(agentId, message, priority);
    }

    private async handleHeartbeatRequest(payload: any): Promise<void> {
        const { agentId, interval, message } = payload;
        await this.handleStartHeartbeat(agentId, interval, message);
    }

    private async handleCoordinationRequest(payload: any): Promise<void> {
        const { agentIds, message } = payload;
        await this.handleCoordinateAgents(agentIds, message);
    }

    /**
     * Function Call Integration for The New Fuse Framework
     */

    /**
     * Get function definitions that can be used by The New Fuse Director/Broker
     */
    public getFunctionDefinitions(): any {
        return {
            trigger_agent: {
                name: "trigger_agent",
                description: "Trigger a specific AI agent with a message to maintain engagement or send commands",
                parameters: {
                    type: "object",
                    properties: {
                        agentId: { 
                            type: "string", 
                            description: "Unique identifier of the agent to trigger" 
                        },
                        message: { 
                            type: "string", 
                            description: "Message to send to the agent" 
                        },
                        priority: { 
                            type: "string", 
                            enum: ["low", "medium", "high", "critical"],
                            description: "Priority level of the trigger",
                            default: "medium"
                        }
                    },
                    required: ["agentId", "message"]
                }
            },
            
            trigger_claude_desktop: {
                name: "trigger_claude_desktop",
                description: "Specifically trigger Claude Desktop application using optimized injection methods",
                parameters: {
                    type: "object",
                    properties: {
                        message: { 
                            type: "string", 
                            description: "Message to inject into Claude Desktop chat" 
                        },
                        method: { 
                            type: "string", 
                            enum: ["ui_elements", "coordinates", "auto"],
                            description: "Injection method preference (auto uses best available)",
                            default: "auto"
                        }
                    },
                    required: ["message"]
                }
            },
            
            trigger_vscode_copilot: {
                name: "trigger_vscode_copilot",
                description: "Trigger VS Code Copilot or other AI coding assistants",
                parameters: {
                    type: "object",
                    properties: {
                        message: { 
                            type: "string", 
                            description: "Message to send to Copilot" 
                        },
                        method: { 
                            type: "string", 
                            enum: ["command_palette", "extension_api", "auto"],
                            description: "Injection method preference",
                            default: "auto"
                        }
                    },
                    required: ["message"]
                }
            },
            
            start_heartbeat: {
                name: "start_heartbeat",
                description: "Start periodic heartbeat for an agent to maintain continuous engagement",
                parameters: {
                    type: "object",
                    properties: {
                        agentId: { 
                            type: "string", 
                            description: "ID of the agent to monitor" 
                        },
                        interval: { 
                            type: "number", 
                            description: "Heartbeat interval in seconds",
                            minimum: 5,
                            maximum: 3600
                        },
                        message: { 
                            type: "string", 
                            description: "Custom heartbeat message",
                            default: "ping - continue monitoring"
                        }
                    },
                    required: ["agentId", "interval"]
                }
            },
            
            stop_heartbeat: {
                name: "stop_heartbeat",
                description: "Stop heartbeat monitoring for an agent",
                parameters: {
                    type: "object",
                    properties: {
                        agentId: { 
                            type: "string", 
                            description: "ID of the agent to stop monitoring" 
                        }
                    },
                    required: ["agentId"]
                }
            },
            
            coordinate_agents: {
                name: "coordinate_agents",
                description: "Send coordinated message to multiple agents simultaneously",
                parameters: {
                    type: "object",
                    properties: {
                        agentIds: {
                            type: "array",
                            items: { type: "string" },
                            description: "Array of agent IDs to coordinate"
                        },
                        message: {
                            type: "string",
                            description: "Message to send to all agents"
                        }
                    },
                    required: ["agentIds", "message"]
                }
            },
            
            wake_up_agent: {
                name: "wake_up_agent",
                description: "Send a high-priority wake-up call to a dormant agent",
                parameters: {
                    type: "object",
                    properties: {
                        agentId: {
                            type: "string",
                            description: "ID of the agent to wake up"
                        }
                    },
                    required: ["agentId"]
                }
            },
            
            get_agent_stats: {
                name: "get_agent_stats",
                description: "Get statistics about registered agents and trigger system",
                parameters: {
                    type: "object",
                    properties: {}
                }
            },
            
            list_agents: {
                name: "list_agents",
                description: "List all registered AI agents and their status",
                parameters: {
                    type: "object",
                    properties: {}
                }
            }
        };
    }

    /**
     * Execute function calls from The New Fuse framework
     */
    public async executeFunction(functionName: string, parameters: any): Promise<any> {
        switch (functionName) {
            case 'trigger_agent':
                return await this.handleTriggerAgent(parameters.agentId, parameters.message, parameters.priority);
            
            case 'trigger_claude_desktop':
                return await this.handleTriggerClaudeDesktop(parameters.message, parameters.method);
            
            case 'trigger_vscode_copilot':
                return await this.handleTriggerVSCodeCopilot(parameters.message, parameters.method);
            
            case 'start_heartbeat':
                return await this.handleStartHeartbeat(parameters.agentId, parameters.interval, parameters.message);
            
            case 'stop_heartbeat':
                return await this.handleStopHeartbeat(parameters.agentId);
            
            case 'coordinate_agents':
                return await this.handleCoordinateAgents(parameters.agentIds, parameters.message);
            
            case 'wake_up_agent':
                return await this.handleWakeUpAgent(parameters.agentId);
            
            case 'get_agent_stats':
                return this.triggerService.getStats();
            
            case 'list_agents':
                return this.triggerService.getRegisteredAgents();
            
            default:
                throw new Error(`Unknown function: ${functionName}`);
        }
    }

    /**
     * Register with The New Fuse function call system
     */
    public registerWithNewFuse(): void {
        const functions = this.getFunctionDefinitions();
        
        // Register each function with the agent communication service
        Object.entries(functions).forEach(([name, definition]) => {
            this.agentCommunicationService.registerFunction?.(name, definition, async (params: any) => {
                return await this.executeFunction(name, params);
            });
        });

        console.log('[TriggerCommandInterface] Functions registered with The New Fuse framework');
    }

    /**
     * Utility method to demonstrate usage patterns
     */
    public async demonstrateUsage(): Promise<void> {
        try {
            console.log('🎯 Demonstrating Universal Trigger System...');

            // Example 1: Trigger Claude Desktop
            await vscode.commands.executeCommand('theNewFuse.trigger.claudeDesktop', 
                'Hello from The New Fuse VS Code extension! This is a test of our universal trigger system.');

            // Example 2: Start heartbeat for Claude Desktop
            await vscode.commands.executeCommand('theNewFuse.heartbeat.start', 
                'claude_desktop_main', 30, 'ping - maintain engagement from VS Code');

            // Example 3: Coordinate multiple agents
            await vscode.commands.executeCommand('theNewFuse.trigger.coordinateAgents', 
                ['claude_desktop_main', 'vscode_copilot_main'], 
                'Coordination test - all agents please acknowledge');

            // Example 4: Get system statistics
            const stats = await vscode.commands.executeCommand('theNewFuse.trigger.getStats');
            console.log('📊 Trigger System Stats:', stats);

            vscode.window.showInformationMessage('🎉 Universal Trigger System demonstration completed!');

        } catch (error) {
            console.error('❌ Demonstration failed:', error);
            vscode.window.showErrorMessage(`Demonstration failed: ${error}`);
        }
    }

    /**
     * Cleanup resources
     */
    public dispose(): void {
        // Commands are automatically disposed through context.subscriptions
        console.log('[TriggerCommandInterface] Disposed');
    }
}
