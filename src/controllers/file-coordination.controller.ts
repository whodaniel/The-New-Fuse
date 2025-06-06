import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Body, 
  Query, 
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileCreationCoordinationService } from '../vscode-extension/src/coordination/FileCreationCoordinationService';
import { FileCoordinationManager } from '../vscode-extension/src/coordination/FileCoordinationManager';
import { AgentFileParticipant } from '../vscode-extension/src/coordination/FileCreationParticipantsManager';
import { Logger } from '@nestjs/common';

/**
 * DTOs for File Coordination API
 */
interface FileCoordinationConfigDto {
  enableFileCreationParticipants?: boolean;
  enableSwarmIntegration?: boolean;
  enableAgentChat?: boolean;
  enableBuiltInParticipants?: boolean;
  coordinationTimeout?: number;
  maxParticipants?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  customParticipants?: string[];
}

interface CoordinationSessionDto {
  id: string;
  fileName: string;
  fileUri: string;
  status: 'INITIALIZING' | 'COORDINATING' | 'COMPLETED' | 'FAILED';
  involvedAgents: string[];
  startedAt: number;
  completedAt?: number;
  chatRoomId?: string;
  swarmExecutionId?: string;
}

interface ParticipantRegistrationDto {
  agentId: string;
  agentName: string;
  capabilities: string[];
  priority: number;
  metadata?: Record<string, any>;
}

interface FileCreationRequestDto {
  filePath: string;
  content?: string;
  triggerCoordination?: boolean;
  metadata?: Record<string, any>;
}

interface CoordinationStatsDto {
  totalCoordinations: number;
  activeCoordinations: number;
  averageCoordinationTime: number;
  successRate: number;
  participantUsage: Record<string, number>;
}

/**
 * REST API Controller for File Creation Coordination System
 * 
 * This controller exposes the file creation participants system through REST endpoints,
 * allowing external systems to manage and monitor file coordination activities.
 */
@Controller('api/file-coordination')
@UseGuards(JwtAuthGuard)
export class FileCoordinationController {
  private readonly logger = new Logger(FileCoordinationController.name);

  constructor(
    private readonly coordinationService: FileCreationCoordinationService,
    private readonly coordinationManager: FileCoordinationManager
  ) {}

  /**
   * Get current coordination configuration
   */
  @Get('config')
  async getConfig(): Promise<FileCoordinationConfigDto> {
    try {
      const config = await this.coordinationManager.getConfiguration();
      return {
        enableFileCreationParticipants: config.enableFileCreationParticipants,
        enableSwarmIntegration: config.enableSwarmIntegration,
        enableAgentChat: config.enableAgentChat,
        enableBuiltInParticipants: config.enableBuiltInParticipants,
        coordinationTimeout: config.coordinationTimeout,
        maxParticipants: config.maxParticipants,
        logLevel: config.logLevel,
        customParticipants: config.customParticipants
      };
    } catch (error) {
      this.logger.error('Failed to get coordination config:', error);
      throw new BadRequestException('Failed to retrieve coordination configuration');
    }
  }

  /**
   * Update coordination configuration
   */
  @Put('config')
  @HttpCode(HttpStatus.OK)
  async updateConfig(@Body() configDto: FileCoordinationConfigDto): Promise<{ success: boolean; message: string }> {
    try {
      await this.coordinationManager.updateConfiguration(configDto);
      return {
        success: true,
        message: 'Coordination configuration updated successfully'
      };
    } catch (error) {
      this.logger.error('Failed to update coordination config:', error);
      throw new BadRequestException('Failed to update coordination configuration');
    }
  }

  /**
   * Get all active coordination sessions
   */
  @Get('sessions')
  async getActiveSessions(): Promise<CoordinationSessionDto[]> {
    try {
      const sessions = this.coordinationService.getActiveCoordinations();
      return sessions.map(session => ({
        id: session.id,
        fileName: session.fileEvent.fileName,
        fileUri: session.fileEvent.uri.toString(),
        status: session.status,
        involvedAgents: session.involvedAgents,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        chatRoomId: session.chatRoomId,
        swarmExecutionId: session.swarmExecutionId
      }));
    } catch (error) {
      this.logger.error('Failed to get active sessions:', error);
      throw new BadRequestException('Failed to retrieve active coordination sessions');
    }
  }

  /**
   * Get specific coordination session details
   */
  @Get('sessions/:sessionId')
  async getSession(@Param('sessionId') sessionId: string): Promise<CoordinationSessionDto> {
    try {
      const session = this.coordinationService.getCoordinationSession(sessionId);
      if (!session) {
        throw new NotFoundException(`Coordination session ${sessionId} not found`);
      }

      return {
        id: session.id,
        fileName: session.fileEvent.fileName,
        fileUri: session.fileEvent.uri.toString(),
        status: session.status,
        involvedAgents: session.involvedAgents,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        chatRoomId: session.chatRoomId,
        swarmExecutionId: session.swarmExecutionId
      };
    } catch (error) {
      this.logger.error(`Failed to get session ${sessionId}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve coordination session');
    }
  }

  /**
   * Get all registered participants
   */
  @Get('participants')
  async getParticipants(): Promise<ParticipantRegistrationDto[]> {
    try {
      const participants = await this.coordinationService.getRegisteredParticipants();
      return participants.map(participant => ({
        agentId: participant.agentId,
        agentName: participant.agentName,
        capabilities: participant.capabilities,
        priority: participant.priority,
        metadata: participant.metadata || {}
      }));
    } catch (error) {
      this.logger.error('Failed to get participants:', error);
      throw new BadRequestException('Failed to retrieve registered participants');
    }
  }

  /**
   * Register a new custom participant
   */
  @Post('participants')
  @HttpCode(HttpStatus.CREATED)
  async registerParticipant(@Body() participantDto: ParticipantRegistrationDto): Promise<{ success: boolean; message: string }> {
    try {
      const participant: AgentFileParticipant = {
        agentId: participantDto.agentId,
        agentName: participantDto.agentName,
        capabilities: participantDto.capabilities,
        priority: participantDto.priority,
        participate: async (event) => {
          // Default implementation - can be enhanced
          return {
            willParticipate: true,
            estimatedDuration: 1000
          };
        }
      };

      this.coordinationService.registerCustomParticipant(participant);
      return {
        success: true,
        message: `Participant ${participantDto.agentName} registered successfully`
      };
    } catch (error) {
      this.logger.error('Failed to register participant:', error);
      throw new BadRequestException('Failed to register participant');
    }
  }

  /**
   * Remove a registered participant
   */
  @Delete('participants/:agentId')
  @HttpCode(HttpStatus.OK)
  async removeParticipant(@Param('agentId') agentId: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.coordinationService.unregisterParticipant(agentId);
      return {
        success: true,
        message: `Participant ${agentId} removed successfully`
      };
    } catch (error) {
      this.logger.error(`Failed to remove participant ${agentId}:`, error);
      throw new BadRequestException('Failed to remove participant');
    }
  }

  /**
   * Trigger file creation with coordination
   */
  @Post('create-file')
  @HttpCode(HttpStatus.CREATED)
  async createFileWithCoordination(@Body() fileDto: FileCreationRequestDto): Promise<{ success: boolean; sessionId?: string; message: string }> {
    try {
      const result = await this.coordinationService.createFileWithCoordination({
        filePath: fileDto.filePath,
        content: fileDto.content || '',
        triggerCoordination: fileDto.triggerCoordination ?? true,
        metadata: fileDto.metadata
      });

      return {
        success: true,
        sessionId: result.sessionId,
        message: `File creation initiated${result.sessionId ? ` with coordination session ${result.sessionId}` : ''}`
      };
    } catch (error) {
      this.logger.error('Failed to create file with coordination:', error);
      throw new BadRequestException('Failed to create file with coordination');
    }
  }

  /**
   * Get coordination statistics
   */
  @Get('stats')
  async getCoordinationStats(): Promise<CoordinationStatsDto> {
    try {
      const stats = await this.coordinationService.getCoordinationStatistics();
      return {
        totalCoordinations: stats.totalCoordinations,
        activeCoordinations: stats.activeCoordinations,
        averageCoordinationTime: stats.averageCoordinationTime,
        successRate: stats.successRate,
        participantUsage: stats.participantUsage
      };
    } catch (error) {
      this.logger.error('Failed to get coordination stats:', error);
      throw new BadRequestException('Failed to retrieve coordination statistics');
    }
  }

  /**
   * Get coordination history with pagination
   */
  @Get('history')
  async getCoordinationHistory(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
    @Query('agentId') agentId?: string
  ): Promise<{
    sessions: CoordinationSessionDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const result = await this.coordinationService.getCoordinationHistory({
        page,
        limit,
        status,
        agentId
      });

      return {
        sessions: result.sessions.map(session => ({
          id: session.id,
          fileName: session.fileEvent.fileName,
          fileUri: session.fileEvent.uri.toString(),
          status: session.status,
          involvedAgents: session.involvedAgents,
          startedAt: session.startedAt,
          completedAt: session.completedAt,
          chatRoomId: session.chatRoomId,
          swarmExecutionId: session.swarmExecutionId
        })),
        total: result.total,
        page: result.page,
        limit: result.limit
      };
    } catch (error) {
      this.logger.error('Failed to get coordination history:', error);
      throw new BadRequestException('Failed to retrieve coordination history');
    }
  }

  /**
   * Health check for coordination system
   */
  @Get('health')
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: Record<string, { status: string; message?: string }>;
    timestamp: string;
  }> {
    try {
      const health = await this.coordinationManager.getSystemHealth();
      return {
        status: health.overall,
        components: health.components,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get system health:', error);
      return {
        status: 'unhealthy',
        components: {
          fileCoordinationService: { status: 'error', message: 'Failed to retrieve health status' }
        },
        timestamp: new Date().toISOString()
      };
    }
  }
}
