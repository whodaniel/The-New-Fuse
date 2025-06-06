import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import { FileCreationParticipantsManager, FileCreationEvent } from './FileCreationParticipantsManager';
import { BuiltInParticipants } from './BuiltInParticipants';
import { AgentSwarmOrchestrationService } from '../services/AgentSwarmOrchestrationService';
import { InterAgentChatService } from '../agent/services/InterAgentChatService';
import { Logger } from '../core/logging';

/**
 * Integration service that connects VS Code file creation participants
 * with The New Fuse agent swarm orchestration system
 */
export class FileCreationCoordinationService {
  private readonly logger = new Logger(FileCreationCoordinationService.name);
  private readonly eventEmitter = new EventEmitter();
  private participantsManager: FileCreationParticipantsManager | null = null;
  private readonly activeCoordinations = new Map<string, CoordinationSession>();
  private readonly coordinationHistory: CoordinationSession[] = [];

  constructor(
    private readonly swarmOrchestrator?: AgentSwarmOrchestrationService,
    private readonly interAgentChat?: InterAgentChatService
  ) {}

  /**
   * Initialize the file creation coordination system
   */
  public async initialize(context: vscode.ExtensionContext): Promise<void> {
    this.logger.info('Initializing File Creation Coordination Service');

    // Create participants manager
    this.participantsManager = new FileCreationParticipantsManager(
      this.eventEmitter,
      context
    );

    // Register built-in participants
    await this.registerBuiltInParticipants();

    // Setup event listeners
    this.setupEventListeners();

    this.logger.info('File Creation Coordination Service initialized');
  }

  /**
   * Register all built-in agent participants
   */
  private async registerBuiltInParticipants(): Promise<void> {
    if (!this.participantsManager) {return;}

    const participants = [
      new BuiltInParticipants.CodeAnalysis(),
      new BuiltInParticipants.Template(),
      new BuiltInParticipants.FileWatcher(),
      new BuiltInParticipants.AgentCoordination()
    ];

    for (const participant of participants) {
      this.participantsManager.registerParticipant(participant);
    }

    this.logger.debug(`Registered ${participants.length} built-in participants`);
  }

  /**
   * Setup event listeners for coordination events
   */
  private setupEventListeners(): void {
    // Listen for coordination events from the file creation system
    this.eventEmitter.on('file-creation.coordination-needed', this.handleCoordinationNeeded.bind(this));
    this.eventEmitter.on('file-creation.coordinated', this.handleFileCreationCompleted.bind(this));
  }

  /**
   * Handle coordination needed events
   */
  private async handleCoordinationNeeded(data: {
    event: FileCreationEvent;
    coordinationRequests: Array<{
      agentId: string;
      agentName: string;
      coordinationNeeded: {
        agentIds: string[];
        reason: string;
      };
    }>;
  }): Promise<void> {
    const { event, coordinationRequests } = data;
    const sessionId = `file-coord-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.logger.debug(`Handling coordination for file: ${event.fileName}, session: ${sessionId}`);

    try {
      // Create coordination session
      const session = await this.createCoordinationSession(sessionId, event, coordinationRequests);
      this.activeCoordinations.set(sessionId, session);

      // Start coordination through swarm orchestrator
      await this.initiateSwarmCoordination(session);

      // Setup agent communication room for this coordination
      await this.setupAgentCommunication(session);

    } catch (error) {
      this.logger.error(`Error handling coordination for ${event.fileName}:`, error);
      throw error;
    }
  }

  /**
   * Create a coordination session
   */
  private async createCoordinationSession(
    sessionId: string,
    event: FileCreationEvent,
    coordinationRequests: Array<any>
  ): Promise<CoordinationSession> {
    const allInvolvedAgents = new Set<string>();
    
    // Add requesting agents
    coordinationRequests.forEach(req => {
      allInvolvedAgents.add(req.agentId);
      req.coordinationNeeded.agentIds.forEach(id => allInvolvedAgents.add(id));
    });

    const session: CoordinationSession = {
      id: sessionId,
      fileEvent: event,
      involvedAgents: Array.from(allInvolvedAgents),
      coordinationRequests,
      status: 'INITIALIZING',
      startedAt: Date.now(),
      chatRoomId: `file-coord-${sessionId}`,
      swarmExecutionId: null
    };

    return session;
  }

  /**
   * Initiate coordination through the swarm orchestrator
   */
  private async initiateSwarmCoordination(session: CoordinationSession): Promise<void> {
    const serviceRequest = {
      id: `file-creation-${session.id}`,
      categoryId: 'file-coordination',
      requirements: {
        fileUri: session.fileEvent.uri.toString(),
        fileName: session.fileEvent.fileName,
        extension: session.fileEvent.extension,
        coordinationRequests: session.coordinationRequests
      },
      priority: 'HIGH' as const,
      requesterId: 'file-creation-system',
      agencyId: 'default-agency', // This would come from configuration
      metadata: {
        coordinationSessionId: session.id,
        fileCreationEvent: session.fileEvent
      }
    };

    try {
      if (!this.swarmOrchestrator) {
        throw new Error('Swarm orchestrator not available');
      }
      
      const swarmExecution = await this.swarmOrchestrator.processServiceRequest(serviceRequest);
      session.swarmExecutionId = swarmExecution.id;
      session.status = 'COORDINATING';
      
      this.logger.debug(`Started swarm coordination: ${swarmExecution.id} for file: ${session.fileEvent.fileName}`);
    } catch (error) {
      session.status = 'FAILED';
      this.logger.error(`Failed to start swarm coordination for ${session.fileEvent.fileName}:`, error);
      throw error;
    }
  }

  /**
   * Setup agent communication room for coordination
   */
  private async setupAgentCommunication(session: CoordinationSession): Promise<void> {
    try {
      if (!this.interAgentChat) {
        throw new Error('Inter-agent chat service not available');
      }

      // Create chat session for coordination
      const chatSession = this.interAgentChat.createSession([
        ...session.involvedAgents,
        'file-creation-system'
      ]);

      session.chatRoomId = chatSession.id;

      // Add agents to the room
      for (const agentId of session.involvedAgents) {
        await this.interAgentChat.joinRoom(chatSession.id, {
          id: agentId,
          name: `Agent-${agentId}`,
          type: 'agent',
          socketId: `agent-${agentId}-${Date.now()}`, // Virtual socket ID
          metadata: {
            agentId,
            coordinationSession: session.id
          }
        });
      }

      // Send initial coordination message
      await this.interAgentChat.sendMessage(
        chatSession.id,
        'file-creation-system',
        JSON.stringify({
          type: 'coordination-request',
          fileUri: session.fileEvent.uri.toString(),
          fileName: session.fileEvent.fileName,
          coordinationRequests: session.coordinationRequests,
          instructions: 'Please coordinate your actions for this file creation event'
        })
      );

      this.logger.debug(`Setup communication room ${chatSession.id} for coordination session ${session.id}`);

    } catch (error) {
      this.logger.error(`Failed to setup agent communication for coordination:`, error);
      throw error;
    }
  }

  /**
   * Handle file creation completion
   */
  private async handleFileCreationCompleted(event: FileCreationEvent): Promise<void> {
    this.logger.debug(`File creation completed: ${event.fileName} with ${event.participatingAgents.length} agents`);

    // Find and clean up coordination session
    const sessionEntry = Array.from(this.activeCoordinations.entries())
      .find(([_, session]) => session.fileEvent.uri.toString() === event.uri.toString());

    if (sessionEntry) {
      const [sessionId, session] = sessionEntry;
      
      // Update session status
      session.status = 'COMPLETED';
      session.completedAt = Date.now();

      // Send completion message to agents
      if (session.chatRoomId && this.interAgentChat) {
        await this.interAgentChat.sendMessage(
          session.chatRoomId,
          'file-creation-system',
          JSON.stringify({
            type: 'coordination-completed',
            fileName: event.fileName,
            participatingAgents: event.participatingAgents,
            duration: session.completedAt - session.startedAt
          })
        );
      }

      // Add to coordination history
      this.coordinationHistory.push(session);

      // Clean up after a delay
      setTimeout(() => {
        this.activeCoordinations.delete(sessionId);
      }, 30000); // Keep for 30 seconds for potential queries
    }

    // Emit completion event for other systems
    this.eventEmitter.emit('agent-coordination.file-creation-completed', {
      fileUri: event.uri.toString(),
      fileName: event.fileName,
      participatingAgents: event.participatingAgents,
      timestamp: event.timestamp
    });
  }

  /**
   * Register a custom agent participant
   */
  public registerCustomParticipant(participant: any): void {
    if (this.participantsManager) {
      this.participantsManager.registerParticipant(participant);
      this.logger.debug(`Registered custom participant: ${participant.agentName}`);
    }
  }

  /**
   * Get active coordination sessions
   */
  public getActiveCoordinations(): CoordinationSession[] {
    return Array.from(this.activeCoordinations.values());
  }

  /**
   * Get coordination session by ID
   */
  public getCoordinationSession(sessionId: string): CoordinationSession | undefined {
    return this.activeCoordinations.get(sessionId);
  }

  /**
   * Get all registered participants
   */
  public async getRegisteredParticipants(): Promise<any[]> {
    if (!this.participantsManager) {
      return [];
    }
    return this.participantsManager.getRegisteredParticipants();
  }

  /**
   * Get all registered participants (legacy method for compatibility)
   */
  public getParticipants(): any[] {
    if (!this.participantsManager) {
      return [];
    }
    return this.participantsManager.getParticipants();
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    if (this.participantsManager) {
      this.participantsManager.dispose();
    }
    this.activeCoordinations.clear();
    this.logger.debug('File Creation Coordination Service disposed');
  }

  /**
   * Unregister a participant
   */
  public async unregisterParticipant(agentId: string): Promise<void> {
    if (this.participantsManager) {
      this.participantsManager.unregisterParticipant(agentId);
    }
  }

  /**
   * Create file with coordination - API endpoint method
   */
  public async createFileWithCoordination(params: {
    filePath: string;
    content: string;
    triggerCoordination: boolean;
    metadata?: any;
  }): Promise<{ sessionId?: string; success: boolean }> {
    try {
      if (!params.triggerCoordination) {
        // Simple file creation without coordination
        await this.createFileDirectly(params.filePath, params.content);
        return { success: true };
      }

      // Create file with coordination
      const sessionId = await this.initiateFileCreationWithCoordination(params);
      return { sessionId, success: true };
    } catch (error) {
      this.logger.error('Failed to create file with coordination:', error);
      throw error;
    }
  }

  /**
   * Prepare file creation by analyzing context and participants
   */
  public async prepareFileCreation(params: {
    filePath: string;
    fileType: string;
    context?: any;
  }): Promise<any> {
    try {
      const analysis = {
        filePath: params.filePath,
        fileType: params.fileType,
        suggestedParticipants: [],
        templates: [],
        dependencies: [],
        recommendations: []
      };

      // Analyze file extension and suggest participants
      const extension = params.fileType.startsWith('.') ? params.fileType : `.${params.fileType}`;
      
      if (['.ts', '.js', '.tsx', '.jsx'].includes(extension)) {
        analysis.suggestedParticipants.push('code-analysis-agent', 'template-agent');
      }
      
      if (['.py', '.java', '.cpp', '.c'].includes(extension)) {
        analysis.suggestedParticipants.push('code-analysis-agent', 'dependency-analyzer');
      }

      // Add file watcher for all file types
      analysis.suggestedParticipants.push('file-watcher-agent');

      // Get available templates
      analysis.templates = await this.getTemplatesForFile(extension, params.context);

      return analysis;
    } catch (error) {
      this.logger.error('Failed to prepare file creation:', error);
      throw error;
    }
  }

  /**
   * Get coordination statistics
   */
  public async getCoordinationStatistics(): Promise<any> {
    try {
      const stats = {
        totalCoordinations: this.coordinationHistory.length,
        activeCoordinations: this.activeCoordinations.size,
        averageCoordinationTime: 0,
        successRate: 0,
        participantUsage: {}
      };

      // Calculate average coordination time
      const completedSessions = this.coordinationHistory.filter(s => s.completedAt);
      if (completedSessions.length > 0) {
        const totalTime = completedSessions.reduce((sum, s) => sum + (s.completedAt! - s.startedAt), 0);
        stats.averageCoordinationTime = totalTime / completedSessions.length;
      }

      // Calculate success rate
      const successfulSessions = this.coordinationHistory.filter(s => s.status === 'COMPLETED');
      stats.successRate = this.coordinationHistory.length > 0 
        ? (successfulSessions.length / this.coordinationHistory.length) * 100 
        : 0;

      // Calculate participant usage
      this.coordinationHistory.forEach(session => {
        session.involvedAgents.forEach(agentId => {
          stats.participantUsage[agentId] = (stats.participantUsage[agentId] || 0) + 1;
        });
      });

      return stats;
    } catch (error) {
      this.logger.error('Failed to get coordination statistics:', error);
      throw error;
    }
  }

  /**
   * Get coordination history with pagination and filtering
   */
  public async getCoordinationHistory(params: {
    page: number;
    limit: number;
    status?: string;
    agentId?: string;
  }): Promise<{
    sessions: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      let filteredSessions = [...this.coordinationHistory];

      // Apply filters
      if (params.status) {
        filteredSessions = filteredSessions.filter(s => s.status === params.status);
      }
      
      if (params.agentId) {
        filteredSessions = filteredSessions.filter(s => 
          s.involvedAgents.includes(params.agentId)
        );
      }

      // Apply pagination
      const startIndex = (params.page - 1) * params.limit;
      const endIndex = startIndex + params.limit;
      const paginatedSessions = filteredSessions.slice(startIndex, endIndex);

      return {
        sessions: paginatedSessions,
        total: filteredSessions.length,
        page: params.page,
        limit: params.limit
      };
    } catch (error) {
      this.logger.error('Failed to get coordination history:', error);
      throw error;
    }
  }

  /**
   * Send message to coordination session
   */
  public async sendCoordinationMessage(
    sessionId: string,
    message: string,
    senderId: string,
    messageType: string = 'info'
  ): Promise<any> {
    try {
      const session = this.activeCoordinations.get(sessionId);
      if (!session || !session.chatRoomId) {
        throw new Error(`Coordination session ${sessionId} not found or has no chat room`);
      }

      if (!this.interAgentChat) {
        throw new Error('Inter-agent chat service not available');
      }

      return await this.interAgentChat.sendMessage(
        session.chatRoomId,
        senderId,
        JSON.stringify({
          type: messageType,
          message,
          timestamp: new Date().toISOString()
        })
      );
    } catch (error) {
      this.logger.error('Failed to send coordination message:', error);
      throw error;
    }
  }

  /**
   * Get messages from coordination session
   */
  public async getCoordinationMessages(sessionId: string, limit: number = 50): Promise<any> {
    try {
      const session = this.activeCoordinations.get(sessionId);
      if (!session || !session.chatRoomId) {
        throw new Error(`Coordination session ${sessionId} not found or has no chat room`);
      }

      if (!this.interAgentChat) {
        throw new Error('Inter-agent chat service not available');
      }

      return await this.interAgentChat.getMessages(session.chatRoomId, { limit });
    } catch (error) {
      this.logger.error('Failed to get coordination messages:', error);
      throw error;
    }
  }

  /**
   * Get templates for file type
   */
  public async getTemplatesForFile(fileExtension: string, context?: any): Promise<any[]> {
    try {
      const templates = [];

      // Basic templates based on file extension
      switch (fileExtension) {
        case '.ts':
        case '.tsx':
          templates.push(
            { name: 'TypeScript Class', type: 'class', content: 'export class ${ClassName} {\n  constructor() {\n    // TODO: Implement\n  }\n}' },
            { name: 'TypeScript Interface', type: 'interface', content: 'export interface ${InterfaceName} {\n  // TODO: Define properties\n}' },
            { name: 'React Component', type: 'component', content: 'import React from \'react\';\n\nexport const ${ComponentName}: React.FC = () => {\n  return (\n    <div>\n      {/* TODO: Implement component */}\n    </div>\n  );\n};' }
          );
          break;
        case '.js':
        case '.jsx':
          templates.push(
            { name: 'JavaScript Class', type: 'class', content: 'class ${ClassName} {\n  constructor() {\n    // TODO: Implement\n  }\n}\n\nmodule.exports = ${ClassName};' },
            { name: 'React Component', type: 'component', content: 'import React from \'react\';\n\nconst ${ComponentName} = () => {\n  return (\n    <div>\n      {/* TODO: Implement component */}\n    </div>\n  );\n};\n\nexport default ${ComponentName};' }
          );
          break;
        case '.py':
          templates.push(
            { name: 'Python Class', type: 'class', content: 'class ${ClassName}:\n    def __init__(self):\n        pass\n\n    def ${method_name}(self):\n        # TODO: Implement\n        pass' },
            { name: 'Python Function', type: 'function', content: 'def ${function_name}():\n    """\n    TODO: Add function description\n    """\n    pass' }
          );
          break;
        default:
          templates.push(
            { name: 'Empty File', type: 'empty', content: '' },
            { name: 'Basic Template', type: 'basic', content: '// TODO: Implement ${fileName}' }
          );
      }

      return templates;
    } catch (error) {
      this.logger.error('Failed to get templates:', error);
      return [];
    }
  }

  /**
   * Analyze file context for optimal placement
   */
  public async analyzeFileContext(filePath: string, analyzeDepth: number = 2): Promise<any> {
    try {
      const analysis = {
        filePath,
        directoryStructure: {},
        suggestedLocation: filePath,
        dependencies: [],
        relatedFiles: [],
        recommendations: []
      };

      // Analyze directory structure
      const pathParts = filePath.split('/');
      const directory = pathParts.slice(0, -1).join('/');
      
      analysis.recommendations.push(
        `File will be created in: ${directory}`,
        `Consider organizing related files in the same directory`,
        `Ensure proper imports and exports are maintained`
      );

      if (analyzeDepth >= 2) {
        // Deep analysis - check for similar files
        const fileName = pathParts[pathParts.length - 1];
        const extension = fileName.split('.').pop();
        
        analysis.recommendations.push(
          `Similar ${extension} files may exist in the workspace`,
          `Consider following existing naming conventions`,
          `Check for existing interfaces or types that can be reused`
        );
      }

      if (analyzeDepth >= 3) {
        // Very deep analysis - workspace-wide patterns
        analysis.recommendations.push(
          `Analyze workspace-wide patterns for optimal placement`,
          `Consider architectural boundaries and module organization`,
          `Ensure the file fits within the overall project structure`
        );
      }

      return analysis;
    } catch (error) {
      this.logger.error('Failed to analyze file context:', error);
      throw error;
    }
  }

  /**
   * Simulate coordination without creating files
   */
  public async simulateCoordination(filePath: string, participants?: string[]): Promise<any> {
    try {
      const simulation = {
        filePath,
        participants: participants || [],
        estimatedTime: 0,
        coordinationPlan: [],
        potentialIssues: [],
        recommendations: []
      };

      // Get all participants if none specified
      if (!participants || participants.length === 0) {
        const allParticipants = await this.getRegisteredParticipants();
        simulation.participants = allParticipants.map(p => p.agentId);
      }

      // Simulate coordination steps
      simulation.coordinationPlan = [
        'Initialize coordination session',
        'Query participant willingness',
        'Resolve dependencies',
        'Execute preparation tasks',
        'Handle inter-agent coordination',
        'Execute validation tasks',
        'Complete coordination'
      ];

      // Estimate time based on participants
      simulation.estimatedTime = simulation.participants.length * 500 + 1000;

      // Add recommendations
      simulation.recommendations.push(
        `Coordination will involve ${simulation.participants.length} participants`,
        `Estimated completion time: ${simulation.estimatedTime}ms`,
        'All participants appear to be available for coordination'
      );

      return simulation;
    } catch (error) {
      this.logger.error('Failed to simulate coordination:', error);
      throw error;
    }
  }

  /**
   * Optimize participant execution order
   */
  public async optimizeParticipantOrder(participants: string[], fileContext?: any): Promise<any> {
    try {
      const optimization = {
        originalOrder: [...participants],
        optimizedOrder: [],
        dependencies: {},
        executionPlan: []
      };

      // Get participant details
      const participantDetails = await this.getRegisteredParticipants();
      const participantMap = new Map(participantDetails.map(p => [p.agentId, p]));

      // Sort by priority (higher priority first)
      const sortedParticipants = participants
        .map(id => ({ id, priority: participantMap.get(id)?.priority || 0 }))
        .sort((a, b) => b.priority - a.priority)
        .map(p => p.id);

      optimization.optimizedOrder = sortedParticipants;

      // Create execution plan
      optimization.executionPlan = sortedParticipants.map((participantId, index) => ({
        step: index + 1,
        participant: participantId,
        phase: index === 0 ? 'preparation' : index === sortedParticipants.length - 1 ? 'validation' : 'coordination'
      }));

      return optimization;
    } catch (error) {
      this.logger.error('Failed to optimize participant order:', error);
      throw error;
    }
  }

  // Private helper methods

  private async createFileDirectly(filePath: string, content: string): Promise<void> {
    // Implementation would create file without coordination
    // This is a placeholder for actual file system operations
    this.logger.debug(`Creating file directly: ${filePath}`);
  }

  private async initiateFileCreationWithCoordination(params: {
    filePath: string;
    content: string;
    metadata?: any;
  }): Promise<string> {
    // Implementation would trigger the coordination system
    // This is a placeholder for actual coordination initiation
    const sessionId = `coord-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.logger.debug(`Initiating coordination session: ${sessionId} for file: ${params.filePath}`);
    return sessionId;
  }
}

/**
 * Coordination session interface
 */
interface CoordinationSession {
  id: string;
  fileEvent: FileCreationEvent;
  involvedAgents: string[];
  coordinationRequests: Array<{
    agentId: string;
    agentName: string;
    coordinationNeeded: {
      agentIds: string[];
      reason: string;
    };
  }>;
  status: 'INITIALIZING' | 'COORDINATING' | 'COMPLETED' | 'FAILED';
  startedAt: number;
  completedAt?: number;
  chatRoomId: string;
  swarmExecutionId: string | null;
}
