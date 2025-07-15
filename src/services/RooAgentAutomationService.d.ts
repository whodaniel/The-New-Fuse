/**
 * Roo Agent Automation Service Implementation
 *
 * This file contains the main service implementation that will be placed
 * in the services directory of The New Fuse platform.
 */
import { EventEmitter } from 'events';
import { MCPService } from './MCPService';
import { ConfigurationManager } from '../config/A2AConfig';
/**
 * Agent Template Definitions
 * Pre-defined agent configurations for common development scenarios
 */
export interface AgentTemplate {
    name: string;
    slug: string;
    roleDefinition: string;
    whenToUse?: string;
    customInstructions?: string;
    groups: (string | [string, FileRestriction])[];
    fileRestrictions?: FileRestriction;
    preferredModel?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    mcpServers?: string[];
    autoApprove?: string[];
    categories?: string[];
    tags?: string[];
}
export interface FileRestriction {
    fileRegex: string;
    description: string;
}
export interface AgentCreationOptions {
    templateKey: string;
    customizations?: Partial<AgentTemplate>;
    isGlobal?: boolean;
    projectPath?: string;
    autoStart?: boolean;
    mcpEnabled?: boolean;
}
export interface TeamConfiguration {
    name: string;
    description: string;
    members: string[];
    sharedMCPServers?: string[];
    communicationChannels?: string[];
}
import { TEAM_CONFIGURATIONS } from './roo-agent-templates';
/**
 * Main Agent Automation Service
 */
export declare class RooAgentAutomationService extends EventEmitter {
    private readonly logger;
    private config;
    private mcpService;
    private communicationService;
    private activeAgents;
    private workspaceRoot?;
    constructor(mcpService: MCPService, config?: ConfigurationManager);
    /**
     * Initialize the automation service
     */
    initialize(workspaceRoot?: string): Promise<void>;
    /**
     * Get platform-specific configuration paths
     */
    private getConfigPaths;
    /**
     * Create a new agent with the specified configuration
     */
    createAgent(options: AgentCreationOptions): Promise<AgentTemplate>;
    /**
     * Create a global mode configuration
     */
    private createGlobalMode;
    /**
     * Format groups array with file restrictions
     */
    private formatGroups;
    /**
     * Create API profile
     */
    private createAPIProfile;
    /**
     * Setup MCP servers
     */
    private setupMCPServers;
    /**
     * Create a project-specific mode configuration
     */
    private createProjectMode;
    /**
     * Notify Roo Code about agent creation
     */
    private notifyAgentCreation;
    /**
     * Create a full development team setup
     */
    createDevelopmentTeam(teamType: keyof typeof TEAM_CONFIGURATIONS): Promise<AgentTemplate[]>;
    /**
     * List all available agent templates
     */
    getAvailableTemplates(): Array<{
        key: string;
        name: string;
        description: string;
        categories: string[];
        tags: string[];
    }>;
    /**
     * List all available team configurations
     */
    getAvailableTeams(): Array<{
        key: string;
        name: string;
        description: string;
        members: string[];
    }>;
    /**
     * Get active agents
     */
    getActiveAgents(): Map<string, AgentTemplate>;
    /**
     * Delete an agent configuration
     */
    deleteAgent(slug: string, options?: {
        isGlobal?: boolean;
        projectPath?: string;
    }): Promise<void>;
    /**
     * Delete global agent configuration
     */
    private deleteGlobalAgent;
    /**
     * Delete project agent configuration
     */
    private deleteProjectAgent;
    /**
     * Check if agent exists
     */
    hasAgent(slug: string): boolean;
    /**
     * Get agent by slug
     */
    getAgent(slug: string): AgentTemplate | undefined;
    /**
     * Cleanup and disconnect
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=RooAgentAutomationService.d.ts.map