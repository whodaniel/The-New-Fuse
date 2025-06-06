import * as vscode from 'vscode';
import * as path from 'path';
import { EventEmitter } from 'events';
import { Logger } from '../core/logging';

/**
 * File Creation Event Details
 */
export interface FileCreationEvent {
  uri: vscode.Uri;
  fileName: string;
  directory: string;
  extension: string;
  timestamp: number;
  participatingAgents: string[];
  metadata?: Record<string, any>;
}

/**
 * Agent File Creation Participant
 */
export interface AgentFileParticipant {
  agentId: string;
  agentName: string;
  capabilities: string[];
  priority: number; // Higher priority agents run first
  participate: (event: FileCreationEvent) => Promise<FileCreationParticipation>;
}

/**
 * Participation Response from Agent
 */
export interface FileCreationParticipation {
  willParticipate: boolean;
  estimatedDuration?: number; // milliseconds
  dependencies?: string[]; // Other agent IDs this depends on
  preparationTasks?: (() => Promise<void>)[];
  validationTasks?: (() => Promise<void>)[];
  coordinationNeeded?: {
    agentIds: string[];
    reason: string;
  };
}

/**
 * Manages VS Code file creation participants pattern for multi-agent coordination
 * 
 * This service integrates with VS Code's onWillCreateFiles event to enable
 * sophisticated multi-agent coordination before files are created.
 */
export class FileCreationParticipantsManager {
  private readonly logger = new Logger(FileCreationParticipantsManager.name);
  private readonly participants = new Map<string, AgentFileParticipant>();
  private readonly activeCoordinations = new Map<string, Promise<void>>();
  
  constructor(
    private readonly eventEmitter: EventEmitter,
    private readonly context: vscode.ExtensionContext
  ) {
    this.setupFileCreationListener();
  }

  /**
   * Register an agent as a file creation participant
   */
  public registerParticipant(participant: AgentFileParticipant): void {
    this.participants.set(participant.agentId, participant);
    this.logger.debug(`Registered file creation participant: ${participant.agentName}`);
    
    // Emit event for other agents to know about new participant
    this.eventEmitter.emit('file-participant.registered', {
      agentId: participant.agentId,
      agentName: participant.agentName,
      capabilities: participant.capabilities
    });
  }

  /**
   * Unregister a file creation participant
   */
  public unregisterParticipant(agentId: string): void {
    const participant = this.participants.get(agentId);
    if (participant) {
      this.participants.delete(agentId);
      this.logger.debug(`Unregistered file creation participant: ${participant.agentName}`);
      
      this.eventEmitter.emit('file-participant.unregistered', {
        agentId,
        agentName: participant.agentName
      });
    }
  }

  /**
   * Setup VS Code file creation listener with agent coordination
   */
  private setupFileCreationListener(): void {
    const disposable = vscode.workspace.onWillCreateFiles(async (event) => {
      // This is the key integration point - VS Code waits for this to complete
      event.waitUntil(this.coordinateFileCreation(event.files));
    });

    this.context.subscriptions.push(disposable);
    this.logger.info('File creation participants listener registered');
  }

  /**
   * Coordinate multi-agent participation in file creation
   */
  private async coordinateFileCreation(files: readonly vscode.Uri[]): Promise<void> {
    const coordinationId = `coord-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      this.logger.debug(`Starting file creation coordination: ${coordinationId} for ${files.length} files`);
      
      // Process each file
      const coordinationPromises = files.map(uri => 
        this.coordinateFileCreationForUri(uri, coordinationId)
      );
      
      // Wait for all coordinations to complete
      const coordinationPromise = Promise.all(coordinationPromises);
      this.activeCoordinations.set(coordinationId, coordinationPromise);
      
      await coordinationPromise;
      
      this.logger.debug(`Completed file creation coordination: ${coordinationId}`);
      
    } catch (error) {
      this.logger.error(`Error in file creation coordination ${coordinationId}:`, error);
      throw error; // This will prevent the file creation
    } finally {
      this.activeCoordinations.delete(coordinationId);
    }
  }

  /**
   * Coordinate agent participation for a single file
   */
  private async coordinateFileCreationForUri(uri: vscode.Uri, coordinationId: string): Promise<void> {
    const fileCreationEvent: FileCreationEvent = {
      uri,
      fileName: path.basename(uri.fsPath),
      directory: path.dirname(uri.fsPath),
      extension: path.extname(uri.fsPath),
      timestamp: Date.now(),
      participatingAgents: [],
      metadata: { coordinationId }
    };

    // 1. Query all participants to see who wants to participate
    const participationPromises = Array.from(this.participants.values()).map(async (participant) => {
      try {
        const participation = await participant.participate(fileCreationEvent);
        return { participant, participation };
      } catch (error) {
        this.logger.warn(`Error getting participation from ${participant.agentName}:`, error);
        return { participant, participation: { willParticipate: false } };
      }
    });

    const participationResults = await Promise.all(participationPromises);
    const interestedParticipants = participationResults.filter(result => 
      result.participation.willParticipate
    );

    if (interestedParticipants.length === 0) {
      this.logger.debug(`No agents interested in file creation: ${uri.fsPath}`);
      return;
    }

    // 2. Sort by priority and resolve dependencies
    const sortedParticipants = this.resolveDependencies(interestedParticipants);
    
    // 3. Execute preparation tasks in order
    await this.executePreparationTasks(sortedParticipants, fileCreationEvent);
    
    // 4. Handle coordination if needed
    await this.handleCoordination(sortedParticipants, fileCreationEvent);
    
    // 5. Execute validation tasks
    await this.executeValidationTasks(sortedParticipants, fileCreationEvent);
    
    // 6. Emit completion event
    fileCreationEvent.participatingAgents = sortedParticipants.map(p => p.participant.agentId);
    this.eventEmitter.emit('file-creation.coordinated', fileCreationEvent);
  }

  /**
   * Resolve dependencies and sort participants by priority
   */
  private resolveDependencies(
    participants: Array<{ participant: AgentFileParticipant, participation: FileCreationParticipation }>
  ): Array<{ participant: AgentFileParticipant, participation: FileCreationParticipation }> {
    // Simple dependency resolution - in practice this could be more sophisticated
    return participants.sort((a, b) => {
      // Higher priority first
      if (a.participant.priority !== b.participant.priority) {
        return b.participant.priority - a.participant.priority;
      }
      
      // If one depends on the other, the dependency comes first
      if (a.participation.dependencies?.includes(b.participant.agentId)) {
        return 1;
      }
      if (b.participation.dependencies?.includes(a.participant.agentId)) {
        return -1;
      }
      
      return 0;
    });
  }

  /**
   * Execute preparation tasks for all participating agents
   */
  private async executePreparationTasks(
    participants: Array<{ participant: AgentFileParticipant, participation: FileCreationParticipation }>,
    event: FileCreationEvent
  ): Promise<void> {
    for (const { participant, participation } of participants) {
      if (participation.preparationTasks && participation.preparationTasks.length > 0) {
        this.logger.debug(`Executing preparation tasks for ${participant.agentName}`);
        
        try {
          await Promise.all(participation.preparationTasks.map(task => task()));
        } catch (error) {
          this.logger.error(`Preparation task failed for ${participant.agentName}:`, error);
          throw error;
        }
      }
    }
  }

  /**
   * Handle inter-agent coordination
   */
  private async handleCoordination(
    participants: Array<{ participant: AgentFileParticipant, participation: FileCreationParticipation }>,
    event: FileCreationEvent
  ): Promise<void> {
    const coordinationNeeded = participants.filter(p => p.participation.coordinationNeeded);
    
    if (coordinationNeeded.length === 0) {
      return;
    }

    this.logger.debug(`Coordination needed between ${coordinationNeeded.length} agents`);
    
    // Emit coordination event for the swarm orchestration service to handle
    this.eventEmitter.emit('file-creation.coordination-needed', {
      event,
      coordinationRequests: coordinationNeeded.map(p => ({
        agentId: p.participant.agentId,
        agentName: p.participant.agentName,
        coordinationNeeded: p.participation.coordinationNeeded
      }))
    });
  }

  /**
   * Execute validation tasks for all participating agents
   */
  private async executeValidationTasks(
    participants: Array<{ participant: AgentFileParticipant, participation: FileCreationParticipation }>,
    event: FileCreationEvent
  ): Promise<void> {
    for (const { participant, participation } of participants) {
      if (participation.validationTasks && participation.validationTasks.length > 0) {
        this.logger.debug(`Executing validation tasks for ${participant.agentName}`);
        
        try {
          await Promise.all(participation.validationTasks.map(task => task()));
        } catch (error) {
          this.logger.error(`Validation task failed for ${participant.agentName}:`, error);
          throw error;
        }
      }
    }
  }

  /**
   * Get active coordinations
   */
  public getActiveCoordinations(): string[] {
    return Array.from(this.activeCoordinations.keys());
  }

  /**
   * Get registered participants
   */
  public getParticipants(): AgentFileParticipant[] {
    return Array.from(this.participants.values());
  }

  /**
   * Get registered participants with detailed information
   */
  public getRegisteredParticipants(): Array<{
    agentId: string;
    agentName: string;
    capabilities: string[];
    priority: number;
    isActive: boolean;
    registrationTimestamp: number;
  }> {
    return Array.from(this.participants.values()).map(participant => ({
      agentId: participant.agentId,
      agentName: participant.agentName,
      capabilities: participant.capabilities,
      priority: participant.priority,
      isActive: true, // Could add more sophisticated health checking
      registrationTimestamp: Date.now() // Could track actual registration time
    }));
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.participants.clear();
    this.activeCoordinations.clear();
  }
}
