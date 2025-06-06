import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import { FileCreationCoordinationService } from './FileCreationCoordinationService';
import { MultiAgentOrchestrationService } from '../services/MultiAgentOrchestrationService';
import { InterAgentChatService } from '../agent/services/InterAgentChatService';
import { Logger } from '../core/logging';

/**
 * Configuration interface for the File Coordination System
 */
export interface FileCoordinationConfig {
  enableFileCreationParticipants: boolean;
  enableSwarmIntegration: boolean;
  enableAgentChat: boolean;
  enableBuiltInParticipants: boolean;
  coordinationTimeout: number; // milliseconds
  maxParticipants: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  customParticipants?: string[]; // Paths to custom participant modules
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: FileCoordinationConfig = {
  enableFileCreationParticipants: true,
  enableSwarmIntegration: true,
  enableAgentChat: true,
  enableBuiltInParticipants: true,
  coordinationTimeout: 10000,
  maxParticipants: 10,
  logLevel: 'info'
};

/**
 * Main initialization and management service for the File Creation Coordination System
 * This integrates VS Code's file creation participants with The New Fuse's agent ecosystem
 */
export class FileCoordinationManager {
  private readonly logger = new Logger(FileCoordinationManager.name);
  private readonly eventEmitter = new EventEmitter();
  private coordinationService: FileCreationCoordinationService | null = null;
  private config: FileCoordinationConfig;
  private isInitialized = false;

  constructor(
    private readonly swarmOrchestrator?: AgentSwarmOrchestrationService,
    private readonly interAgentChat?: InterAgentChatService
  ) {
    this.config = this.loadConfiguration();
  }

  /**
   * Initialize the file coordination system
   */
  public async initialize(context: vscode.ExtensionContext): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('File coordination system already initialized');
      return;
    }

    this.logger.info('Initializing File Creation Coordination System');

    try {
      // Load configuration
      this.config = this.loadConfiguration();

      // Initialize core coordination service
      if (this.config.enableFileCreationParticipants) {
        await this.initializeCoordinationService(context);
      }

      // Setup command handlers
      this.setupCommandHandlers(context);

      // Setup status bar
      this.setupStatusBar(context);

      // Register disposal
      this.registerDisposal(context);

      this.isInitialized = true;
      this.logger.info('File Creation Coordination System initialized successfully');

      // Emit initialization event
      this.eventEmitter.emit('file-coordination.initialized', {
        config: this.config,
        timestamp: Date.now()
      });

    } catch (error) {
      this.logger.error('Failed to initialize file coordination system:', error);
      throw error;
    }
  }

  /**
   * Initialize the coordination service
   */
  private async initializeCoordinationService(context: vscode.ExtensionContext): Promise<void> {
    this.coordinationService = new FileCreationCoordinationService(
      this.swarmOrchestrator,
      this.interAgentChat
    );

    await this.coordinationService.initialize(context);
    this.logger.debug('Coordination service initialized');
  }

  /**
   * Setup VS Code command handlers
   */
  private setupCommandHandlers(context: vscode.ExtensionContext): void {
    // Command to show coordination status
    const showStatusCommand = vscode.commands.registerCommand(
      'thefuse.fileCoordination.showStatus',
      () => this.showCoordinationStatus()
    );

    // Command to toggle coordination
    const toggleCommand = vscode.commands.registerCommand(
      'thefuse.fileCoordination.toggle',
      () => this.toggleCoordination()
    );

    // Command to reload configuration
    const reloadConfigCommand = vscode.commands.registerCommand(
      'thefuse.fileCoordination.reloadConfig',
      () => this.reloadConfiguration()
    );

    context.subscriptions.push(showStatusCommand, toggleCommand, reloadConfigCommand);
  }

  /**
   * Setup status bar item
   */
  private setupStatusBar(context: vscode.ExtensionContext): void {
    const statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );

    statusBarItem.text = '$(sync) File Coord';
    statusBarItem.tooltip = 'The New Fuse File Coordination Status';
    statusBarItem.command = 'thefuse.fileCoordination.showStatus';
    statusBarItem.show();

    // Update status based on coordination activity
    this.eventEmitter.on('file-creation.coordination-needed', () => {
      statusBarItem.text = '$(sync~spin) Coordinating';
    });

    this.eventEmitter.on('file-creation.coordinated', () => {
      statusBarItem.text = '$(check) Coordinated';
      setTimeout(() => {
        statusBarItem.text = '$(sync) File Coord';
      }, 2000);
    });

    context.subscriptions.push(statusBarItem);
  }

  /**
   * Register disposal handler
   */
  private registerDisposal(context: vscode.ExtensionContext): void {
    context.subscriptions.push({
      dispose: () => this.dispose()
    });
  }

  /**
   * Load configuration from VS Code settings
   */
  private loadConfiguration(): FileCoordinationConfig {
    const config = vscode.workspace.getConfiguration('thefuse.fileCoordination');
    
    return {
      enableFileCreationParticipants: config.get('enableParticipants', DEFAULT_CONFIG.enableFileCreationParticipants),
      enableSwarmIntegration: config.get('enableSwarmIntegration', DEFAULT_CONFIG.enableSwarmIntegration),
      enableAgentChat: config.get('enableAgentChat', DEFAULT_CONFIG.enableAgentChat),
      enableBuiltInParticipants: config.get('enableBuiltInParticipants', DEFAULT_CONFIG.enableBuiltInParticipants),
      coordinationTimeout: config.get('coordinationTimeout', DEFAULT_CONFIG.coordinationTimeout),
      maxParticipants: config.get('maxParticipants', DEFAULT_CONFIG.maxParticipants),
      logLevel: config.get('logLevel', DEFAULT_CONFIG.logLevel),
      customParticipants: config.get('customParticipants', DEFAULT_CONFIG.customParticipants)
    };
  }

  /**
   * Show coordination status
   */
  private async showCoordinationStatus(): Promise<void> {
    const activeCoordinations = this.coordinationService?.getActiveCoordinations() || [];
    const participants = this.coordinationService?.getParticipants() || [];

    const statusMessage = `
**The New Fuse File Coordination Status**

**Active Coordinations:** ${activeCoordinations.length}
${activeCoordinations.map(coord => 
  `• ${coord.fileEvent.fileName} (${coord.status}) - ${coord.involvedAgents.length} agents`
).join('\n')}

**Registered Participants:** ${participants.length}
${participants.map(p => 
  `• ${p.agentName} (Priority: ${p.priority})`
).join('\n')}

**Configuration:**
• File Creation Participants: ${this.config.enableFileCreationParticipants ? 'Enabled' : 'Disabled'}
• Swarm Integration: ${this.config.enableSwarmIntegration ? 'Enabled' : 'Disabled'}
• Agent Chat: ${this.config.enableAgentChat ? 'Enabled' : 'Disabled'}
• Coordination Timeout: ${this.config.coordinationTimeout}ms
    `.trim();

    await vscode.window.showInformationMessage(
      'File Coordination Status',
      { modal: true, detail: statusMessage }
    );
  }

  /**
   * Toggle coordination
   */
  private async toggleCoordination(): Promise<void> {
    this.config.enableFileCreationParticipants = !this.config.enableFileCreationParticipants;
    
    // Update configuration
    await vscode.workspace.getConfiguration('thefuse.fileCoordination').update(
      'enableParticipants',
      this.config.enableFileCreationParticipants,
      vscode.ConfigurationTarget.Global
    );

    const status = this.config.enableFileCreationParticipants ? 'enabled' : 'disabled';
    vscode.window.showInformationMessage(`File coordination ${status}`);
  }

  /**
   * Reload configuration
   */
  private async reloadConfiguration(): Promise<void> {
    this.config = this.loadConfiguration();
    this.logger.info('Configuration reloaded');
    
    vscode.window.showInformationMessage('File coordination configuration reloaded');
  }

  /**
   * Reinitialize the system with current configuration
   */
  private async reinitialize(): Promise<void> {
    this.logger.info('Reinitializing file coordination system');
    
    // Dispose current services
    if (this.coordinationService) {
      this.coordinationService.dispose();
      this.coordinationService = null;
    }
    
    this.isInitialized = false;
    
    // Reinitialize
    await this.initialize();
  }

  /**
   * Get current configuration
   */
  public getConfiguration(): FileCoordinationConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public async updateConfiguration(updates: Partial<FileCoordinationConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    
    // Update VS Code settings
    const configuration = vscode.workspace.getConfiguration('thefuse.fileCoordination');
    
    for (const [key, value] of Object.entries(updates)) {
      await configuration.update(key, value, vscode.ConfigurationTarget.Global);
    }
    
    this.logger.info('Configuration updated', JSON.stringify(updates));
    
    // Reinitialize if needed
    if (this.isInitialized && (updates.enableFileCreationParticipants !== undefined || 
        updates.enableSwarmIntegration !== undefined)) {
      await this.reinitialize();
    }
  }

  /**
   * Get system health status
   */
  public async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: {
      coordination: boolean;
      swarmOrchestrator: boolean;
      interAgentChat: boolean;
      participants: number;
    };
    issues: string[];
  }> {
    const issues: string[] = [];
    const components = {
      coordination: false,
      swarmOrchestrator: false,
      interAgentChat: false,
      participants: 0
    };

    // Check coordination service
    if (this.coordinationService) {
      components.coordination = true;
      try {
        components.participants = await this.coordinationService.getRegisteredParticipants().then(p => p.length);
      } catch (error) {
        issues.push('Failed to get registered participants count');
      }
    } else {
      issues.push('Coordination service not initialized');
    }

    // Check swarm orchestrator
    try {
      // Assuming swarmOrchestrator has a health check method
      components.swarmOrchestrator = !!this.swarmOrchestrator;
    } catch (error) {
      issues.push('Swarm orchestrator not available');
    }

    // Check inter-agent chat
    try {
      components.interAgentChat = !!this.interAgentChat;
    } catch (error) {
      issues.push('Inter-agent chat service not available');
    }

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (issues.length === 0) {
      status = 'healthy';
    } else if (components.coordination) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      components,
      issues
    };
  }

  /**
   * Get coordination service
   */
  public getCoordinationService(): FileCreationCoordinationService | null {
    return this.coordinationService;
  }

  /**
   * Check if system is initialized
   */
  public isSystemInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    if (this.coordinationService) {
      this.coordinationService.dispose();
    }
    
    this.isInitialized = false;
    this.logger.info('File coordination system disposed');
  }
}

/**
 * Export configuration types and defaults
 */
export { FileCoordinationConfig, DEFAULT_CONFIG };
