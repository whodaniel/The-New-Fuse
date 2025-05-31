/**
 * Roo Agent Automation Service Implementation
 * 
 * This file contains the main service implementation that will be placed
 * in the services directory of The New Fuse platform.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { RooCodeCommunication, TaskType, Priority } from './RooCodeCommunication';
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

// Import the templates and configurations from the main artifact
import { 
  AGENT_TEMPLATES, 
  API_PROFILES, 
  MCP_SERVERS, 
  TEAM_CONFIGURATIONS 
} from './roo-agent-templates';

/**
 * Main Agent Automation Service
 */
@Injectable()
export class RooAgentAutomationService extends EventEmitter {
  private readonly logger = new Logger(RooAgentAutomationService.name);
  private config: ConfigurationManager;
  private mcpService: MCPService;
  private communicationService: RooCodeCommunication;
  private activeAgents: Map<string, any> = new Map();
  private workspaceRoot?: string;

  constructor(
    mcpService: MCPService,
    config?: ConfigurationManager
  ) {
    super();
    this.mcpService = mcpService;
    this.config = config || ConfigurationManager.getInstance();
    
    // Initialize communication service
    this.communicationService = new RooCodeCommunication({
      agentId: 'tnf-agent-automation',
      targetAgentId: 'roo-code'
    });
  }

  /**
   * Initialize the automation service
   */
  async initialize(workspaceRoot?: string): Promise<void> {
    this.workspaceRoot = workspaceRoot;
    
    try {
      // Initialize communication
      const connected = await this.communicationService.initialize();
      if (connected) {
        await this.communicationService.declareCapabilities();
        this.logger.log('Agent automation service initialized with communication');
      } else {
        this.logger.log('Agent automation service initialized in offline mode');
      }
      
      this.emit('initialized');
    } catch (error) {
      this.logger.error('Failed to initialize agent automation service', error);
      throw error;
    }
  }

  /**
   * Get platform-specific configuration paths
   */
  private getConfigPaths() {
    const platform = process.platform;
    const homeDir = os.homedir();
    
    let globalConfigPath: string;
    switch (platform) {
      case 'win32':
        globalConfigPath = path.join(homeDir, 'AppData', 'Roaming', 'Code', 'User');
        break;
      case 'darwin':
        globalConfigPath = path.join(homeDir, 'Library', 'Application Support', 'Code', 'User');
        break;
      default:
        globalConfigPath = path.join(homeDir, '.config', 'Code', 'User');
    }

    const projectConfigPath = this.workspaceRoot 
      ? path.join(this.workspaceRoot, '.roo') 
      : undefined;

    return { globalConfigPath, projectConfigPath };
  }

  /**
   * Create a new agent with the specified configuration
   */
  async createAgent(options: AgentCreationOptions): Promise<AgentTemplate> {
    const template = AGENT_TEMPLATES[options.templateKey];
    if (!template) {
      throw new Error(`Template '${options.templateKey}' not found`);
    }

    // Merge template with customizations
    const agentConfig: AgentTemplate = {
      ...template,
      ...options.customizations,
      slug: options.customizations?.slug || template.slug,
      name: options.customizations?.name || template.name
    };

    try {
      // Create mode configuration
      if (options.isGlobal !== false) {
        await this.createGlobalMode(agentConfig);
      }

      if (options.projectPath || this.workspaceRoot) {
        await this.createProjectMode(agentConfig, options.projectPath);
      }

      // Create API profile if specified
      if (agentConfig.preferredModel) {
        await this.createAPIProfile(agentConfig);
      }

      // Setup MCP servers if needed and enabled
      if (options.mcpEnabled && agentConfig.mcpServers) {
        await this.setupMCPServers(agentConfig.mcpServers);
      }

      // Register agent with the platform
      this.activeAgents.set(agentConfig.slug, agentConfig);

      // Notify Roo Code about the new agent
      if (options.autoStart && this.communicationService.isConnected()) {
        await this.notifyAgentCreation(agentConfig);
      }

      this.logger.log(`Agent '${agentConfig.name}' created successfully`);
      this.emit('agent_created', agentConfig);

      return agentConfig;
    } catch (error) {
      this.logger.error(`Failed to create agent '${agentConfig.name}'`, error);
      throw error;
    }
  }

  /**
   * Create a global mode configuration
   */
  private async createGlobalMode(config: AgentTemplate): Promise<void> {
    const { globalConfigPath } = this.getConfigPaths();
    const globalModesPath = path.join(globalConfigPath, 'global_modes.json');

    try {
      // Ensure directory exists
      await fs.mkdir(globalConfigPath, { recursive: true });

      let globalModes: any = { customModes: [] };
      try {
        const content = await fs.readFile(globalModesPath, 'utf8');
        globalModes = JSON.parse(content);
      } catch (error) {
        // File doesn't exist, use default structure
      }

      // Ensure customModes array exists
      if (!globalModes.customModes) {
        globalModes.customModes = [];
      }

      // Create mode configuration
      const modeConfig = {
        slug: config.slug,
        name: config.name,
        roleDefinition: config.roleDefinition,
        whenToUse: config.whenToUse,
        customInstructions: config.customInstructions,
        groups: this.formatGroups(config.groups, config.fileRestrictions)
      };

      // Remove existing mode with same slug
      globalModes.customModes = globalModes.customModes.filter(
        (mode: any) => mode.slug !== config.slug
      );

      // Add new mode
      globalModes.customModes.push(modeConfig);

      // Save configuration
      await fs.writeFile(globalModesPath, JSON.stringify(globalModes, null, 2));
      this.logger.log(`Global mode '${config.slug}' created`);
    } catch (error) {
      this.logger.error(`Failed to create global mode '${config.slug}'`, error);
      throw error;
    }
  }

  /**
   * Format groups array with file restrictions
   */
  private formatGroups(groups: (string | [string, FileRestriction])[], fileRestrictions?: FileRestriction): (string | [string, FileRestriction])[] {
    if (!fileRestrictions) {
      return groups;
    }

    return groups.map(group => {
      if (group === 'edit' && fileRestrictions) {
        return ['edit', fileRestrictions];
      }
      return group;
    });
  }

  /**
   * Create API profile
   */
  private async createAPIProfile(config: AgentTemplate): Promise<void> {
    const { globalConfigPath } = this.getConfigPaths();
    const profilesPath = path.join(globalConfigPath, 'api_profiles.json');

    try {
      await fs.mkdir(globalConfigPath, { recursive: true });

      let profiles: any = {};
      try {
        const content = await fs.readFile(profilesPath, 'utf8');
        profiles = JSON.parse(content);
      } catch (error) {
        // File doesn't exist, use default structure
      }

      const profileKey = `${config.slug}-profile`;
      profiles[profileKey] = {
        name: `${config.name} Profile`,
        provider: 'anthropic',
        model: config.preferredModel || 'claude-3-sonnet',
        temperature: config.temperature || 0.3,
        maxTokens: config.maxTokens || 4096,
        topP: config.topP || 0.9
      };

      await fs.writeFile(profilesPath, JSON.stringify(profiles, null, 2));
      this.logger.log(`API profile '${profileKey}' created`);
    } catch (error) {
      this.logger.error(`Failed to create API profile for '${config.slug}'`, error);
      throw error;
    }
  }

  /**
   * Setup MCP servers
   */
  private async setupMCPServers(serverKeys: string[]): Promise<void> {
    const { globalConfigPath } = this.getConfigPaths();
    const mcpConfigPath = path.join(globalConfigPath, 'mcp_settings.json');

    try {
      await fs.mkdir(globalConfigPath, { recursive: true });

      let mcpConfig: any = { mcpServers: {} };
      try {
        const content = await fs.readFile(mcpConfigPath, 'utf8');
        mcpConfig = JSON.parse(content);
      } catch (error) {
        // File doesn't exist, use default structure
      }

      if (!mcpConfig.mcpServers) {
        mcpConfig.mcpServers = {};
      }

      for (const serverKey of serverKeys) {
        const serverConfig = MCP_SERVERS[serverKey];
        if (serverConfig) {
          mcpConfig.mcpServers[serverConfig.name] = {
            type: serverConfig.type || 'stdio',
            command: serverConfig.command,
            args: serverConfig.args,
            enabled: serverConfig.enabled !== false
          };
        }
      }

      await fs.writeFile(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
      this.logger.log(`MCP servers configured: ${serverKeys.join(', ')}`);
    } catch (error) {
      this.logger.error('Failed to setup MCP servers', error);
      throw error;
    }
  }

  /**
   * Create a project-specific mode configuration
   */
  private async createProjectMode(config: AgentTemplate, projectPath?: string): Promise<void> {
    const targetPath = projectPath || this.workspaceRoot;
    if (!targetPath) {
      throw new Error('No project path specified and no workspace root available');
    }

    const projectConfigPath = path.join(targetPath, '.roo');
    const projectModesPath = path.join(projectConfigPath, 'modes.json');

    try {
      // Ensure directory exists
      await fs.mkdir(projectConfigPath, { recursive: true });

      let projectModes: any = { customModes: [] };
      try {
        const content = await fs.readFile(projectModesPath, 'utf8');
        projectModes = JSON.parse(content);
      } catch (error) {
        // File doesn't exist, use default structure
      }

      // Ensure customModes array exists
      if (!projectModes.customModes) {
        projectModes.customModes = [];
      }

      const modeConfig = {
        slug: config.slug,
        name: config.name,
        roleDefinition: config.roleDefinition,
        whenToUse: config.whenToUse,
        customInstructions: config.customInstructions,
        groups: this.formatGroups(config.groups, config.fileRestrictions)
      };

      // Remove existing mode with same slug
      projectModes.customModes = projectModes.customModes.filter(
        (mode: any) => mode.slug !== config.slug
      );

      // Add new mode
      projectModes.customModes.push(modeConfig);

      await fs.writeFile(projectModesPath, JSON.stringify(projectModes, null, 2));
      this.logger.log(`Project mode '${config.slug}' created at ${targetPath}`);
    } catch (error) {
      this.logger.error(`Failed to create project mode '${config.slug}'`, error);
      throw error;
    }
  }

  /**
   * Notify Roo Code about agent creation
   */
  private async notifyAgentCreation(config: AgentTemplate): Promise<void> {
    try {
      await this.communicationService.requestCollaboration(
        'code_generation' as TaskType,
        {
          action: 'agent_created',
          agent: {
            name: config.name,
            slug: config.slug,
            capabilities: config.categories || [],
            role: config.roleDefinition
          }
        },
        'medium' as Priority
      );
    } catch (error) {
      this.logger.error('Failed to notify Roo Code about agent creation', error);
    }
  }

  /**
   * Create a full development team setup
   */
  async createDevelopmentTeam(teamType: keyof typeof TEAM_CONFIGURATIONS): Promise<AgentTemplate[]> {
    const teamConfig = TEAM_CONFIGURATIONS[teamType];
    if (!teamConfig) {
      throw new Error(`Team type '${teamType}' not found`);
    }

    const createdAgents: AgentTemplate[] = [];
    const errors: string[] = [];

    this.logger.log(`Creating ${teamConfig.name}...`);

    for (const memberType of teamConfig.members) {
      try {
        const agent = await this.createAgent({
          templateKey: memberType,
          isGlobal: true,
          mcpEnabled: true,
          autoStart: true
        });
        createdAgents.push(agent);
      } catch (error) {
        const errorMsg = `Failed to create agent ${memberType}: ${(error as Error).message}`;
        this.logger.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    // Setup shared MCP servers for the team
    if (teamConfig.sharedMCPServers) {
      try {
        await this.setupMCPServers(teamConfig.sharedMCPServers);
      } catch (error) {
        this.logger.error('Failed to setup shared MCP servers for team', error);
      }
    }

    this.logger.log(`Created ${teamConfig.name} with ${createdAgents.length} agents`);
    if (errors.length > 0) {
      this.logger.warn(`Encountered ${errors.length} errors during team creation`);
    }

    this.emit('team_created', { teamType, agents: createdAgents, errors });
    return createdAgents;
  }

  /**
   * List all available agent templates
   */
  getAvailableTemplates(): Array<{
    key: string;
    name: string;
    description: string;
    categories: string[];
    tags: string[];
  }> {
    return Object.keys(AGENT_TEMPLATES).map(key => {
      const template = AGENT_TEMPLATES[key];
      return {
        key,
        name: template.name,
        description: template.whenToUse || template.roleDefinition.substring(0, 100) + '...',
        categories: template.categories || [],
        tags: template.tags || []
      };
    });
  }

  /**
   * List all available team configurations
   */
  getAvailableTeams(): Array<{
    key: string;
    name: string;
    description: string;
    members: string[];
  }> {
    return Object.keys(TEAM_CONFIGURATIONS).map(key => ({
      key,
      name: TEAM_CONFIGURATIONS[key].name,
      description: TEAM_CONFIGURATIONS[key].description,
      members: TEAM_CONFIGURATIONS[key].members
    }));
  }

  /**
   * Get active agents
   */
  getActiveAgents(): Map<string, AgentTemplate> {
    return new Map(this.activeAgents);
  }

  /**
   * Delete an agent configuration
   */
  async deleteAgent(slug: string, options: { isGlobal?: boolean; projectPath?: string } = {}): Promise<void> {
    try {
      if (options.isGlobal !== false) {
        await this.deleteGlobalAgent(slug);
      }

      if (options.projectPath || this.workspaceRoot) {
        await this.deleteProjectAgent(slug, options.projectPath);
      }

      // Remove from active agents
      this.activeAgents.delete(slug);

      this.logger.log(`Agent '${slug}' deleted successfully`);
      this.emit('agent_deleted', { slug });
    } catch (error) {
      this.logger.error(`Failed to delete agent '${slug}'`, error);
      throw error;
    }
  }

  /**
   * Delete global agent configuration
   */
  private async deleteGlobalAgent(slug: string): Promise<void> {
    const { globalConfigPath } = this.getConfigPaths();
    const globalModesPath = path.join(globalConfigPath, 'global_modes.json');

    try {
      const content = await fs.readFile(globalModesPath, 'utf8');
      const globalModes = JSON.parse(content);

      globalModes.customModes = globalModes.customModes.filter(
        (mode: any) => mode.slug !== slug
      );

      await fs.writeFile(globalModesPath, JSON.stringify(globalModes, null, 2));
    } catch (error) {
      this.logger.warn(`Could not delete global agent '${slug}': ${(error as Error).message}`);
    }
  }

  /**
   * Delete project agent configuration
   */
  private async deleteProjectAgent(slug: string, projectPath?: string): Promise<void> {
    const targetPath = projectPath || this.workspaceRoot;
    if (!targetPath) return;

    const projectModesPath = path.join(targetPath, '.roo', 'modes.json');

    try {
      const content = await fs.readFile(projectModesPath, 'utf8');
      const projectModes = JSON.parse(content);

      projectModes.customModes = projectModes.customModes.filter(
        (mode: any) => mode.slug !== slug
      );

      await fs.writeFile(projectModesPath, JSON.stringify(projectModes, null, 2));
    } catch (error) {
      this.logger.warn(`Could not delete project agent '${slug}': ${(error as Error).message}`);
    }
  }

  /**
   * Check if agent exists
   */
  hasAgent(slug: string): boolean {
    return this.activeAgents.has(slug);
  }

  /**
   * Get agent by slug
   */
  getAgent(slug: string): AgentTemplate | undefined {
    return this.activeAgents.get(slug);
  }

  /**
   * Cleanup and disconnect
   */
  async cleanup(): Promise<void> {
    try {
      await this.communicationService.disconnect();
      this.activeAgents.clear();
      this.emit('cleanup_complete');
      this.logger.log('Agent automation service cleaned up');
    } catch (error) {
      this.logger.error('Error during cleanup', error);
      throw error;
    }
  }
}
