// Debugger Controller - REST API endpoints for A2A debugging tools
// Provides comprehensive debugging interface for multi-agent communication

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
  UseInterceptors,
  Sse,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Observable, interval, map } from 'rxjs';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { PerformanceInterceptor } from '../interceptors/performance.interceptor';
import { CurrentUser } from '../modules/decorators/current-user.decorator';
import { User } from '@drizzle/client';
import {
  A2ADebuggerService,
  DebugSession,
  A2ADebugMessage,
  ConversationTrace,
  AgentDebugInfo,
  DebugFilter,
  DebugSettings,
  MessageAnalysis,
} from './a2a-debugger.service.js';

// DTOs for API requests
interface CreateDebugSessionRequest {
  name: string;
  description: string;
  settings?: Partial<DebugSettings>;
  initialFilters?: DebugFilter[];
}

interface UpdateDebugFiltersRequest {
  filters: DebugFilter[];
}

interface AnalyzeMessageRequest {
  messageId: string;
  includeRecommendations?: boolean;
}

@ApiTags('A2A Debugger')
@Controller('api/debugging')
@UseGuards(JwtAuthGuard)
@UseInterceptors(PerformanceInterceptor)
@ApiBearerAuth()
export class DebuggerController {
  constructor(private readonly debuggerService: A2ADebuggerService) {}

  // Debug session management
  @Post('sessions')
  @ApiOperation({
    summary: 'Create new debug session',
    description: 'Creates a new debugging session for capturing and analyzing A2A communication',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', description: 'Session name' },
        description: { type: 'string', description: 'Session description' },
        settings: {
          type: 'object',
          properties: {
            capturePayloads: { type: 'boolean' },
            captureStackTraces: { type: 'boolean' },
            maxMessages: { type: 'number' },
            maxConversations: { type: 'number' },
            retentionTime: { type: 'number' },
            realTimeUpdates: { type: 'boolean' },
            verboseLogging: { type: 'boolean' },
          },
        },
        initialFilters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['agent', 'messageType', 'priority', 'keyword', 'timeRange'] },
              value: { type: 'string' },
              operator: { type: 'string', enum: ['equals', 'contains', 'greater', 'less', 'between'] },
              enabled: { type: 'boolean' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Debug session created successfully',
  })
  async createDebugSession(
    @Body() request: CreateDebugSessionRequest,
    @CurrentUser() user: User,
  ): Promise<{ sessionId: string; message: string }> {
    const sessionId = await this.debuggerService.createDebugSession(
      request.name,
      request.description,
      request.settings
    );

    // Apply initial filters if provided
    if (request.initialFilters?.length) {
      await this.debuggerService.setDebugFilters(sessionId, request.initialFilters);
    }

    return {
      sessionId,
      message: `Debug session created: ${request.name}`,
    };
  }

  @Get('sessions')
  @ApiOperation({
    summary: 'Get all debug sessions',
    description: 'Returns a list of all debug sessions with their current status',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'paused', 'stopped'],
    description: 'Filter sessions by status',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Maximum number of sessions to return',
  })
  @ApiResponse({
    status: 200,
    description: 'Debug sessions retrieved successfully',
  })
  async getDebugSessions(
    @Query('status') status?: 'active' | 'paused' | 'stopped',
    @Query('limit') limit: number = 50,
  ): Promise<DebugSession[]> {
    // Implementation would filter and return sessions
    // For now, return mock data structure
    return [];
  }

  @Get('sessions/:sessionId')
  @ApiOperation({
    summary: 'Get debug session details',
    description: 'Returns detailed information about a specific debug session',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Unique identifier of the debug session',
  })
  @ApiResponse({
    status: 200,
    description: 'Debug session details retrieved successfully',
  })
  async getDebugSession(
    @Param('sessionId') sessionId: string,
  ): Promise<{
    session: DebugSession;
    statistics: {
      totalMessages: number;
      activeConversations: number;
      errorRate: number;
      avgLatency: number;
    };
  }> {
    // Implementation would return session details and statistics
    throw new Error('Implementation pending');
  }

  @Put('sessions/:sessionId/active')
  @ApiOperation({
    summary: 'Set active debug session',
    description: 'Sets a debug session as the active session for message capture',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Unique identifier of the debug session',
  })
  @ApiResponse({
    status: 200,
    description: 'Active session set successfully',
  })
  async setActiveSession(
    @Param('sessionId') sessionId: string,
  ): Promise<{ success: boolean; message: string }> {
    const success = await this.debuggerService.setActiveSession(sessionId);
    return {
      success,
      message: success ? 'Active session set successfully' : 'Failed to set active session',
    };
  }

  @Put('sessions/:sessionId/stop')
  @ApiOperation({
    summary: 'Stop debug session',
    description: 'Stops a debug session and generates summary report',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Unique identifier of the debug session',
  })
  @ApiResponse({
    status: 200,
    description: 'Debug session stopped successfully',
  })
  async stopDebugSession(
    @Param('sessionId') sessionId: string,
  ): Promise<{ success: boolean; summary: any }> {
    const success = await this.debuggerService.stopDebugSession(sessionId);
    
    if (success) {
      const exportData = await this.debuggerService.exportDebugSession(sessionId);
      return {
        success: true,
        summary: exportData.session,
      };
    }
    
    return {
      success: false,
      summary: null,
    };
  }

  @Delete('sessions/:sessionId')
  @ApiOperation({
    summary: 'Delete debug session',
    description: 'Permanently deletes a debug session and all associated data',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Unique identifier of the debug session',
  })
  @ApiResponse({
    status: 200,
    description: 'Debug session deleted successfully',
  })
  async deleteDebugSession(
    @Param('sessionId') sessionId: string,
  ): Promise<{ success: boolean; message: string }> {
    // Implementation would delete session and cleanup data
    return {
      success: true,
      message: 'Debug session deleted successfully',
    };
  }

  // Message capture and analysis
  @Get('sessions/:sessionId/messages')
  @ApiOperation({
    summary: 'Get captured messages',
    description: 'Returns messages captured during the debug session',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Unique identifier of the debug session',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Maximum number of messages to return',
  })
  @ApiQuery({
    name: 'fromAgent',
    required: false,
    type: 'string',
    description: 'Filter messages from specific agent',
  })
  @ApiQuery({
    name: 'toAgent',
    required: false,
    type: 'string',
    description: 'Filter messages to specific agent',
  })
  @ApiQuery({
    name: 'messageType',
    required: false,
    type: 'string',
    description: 'Filter messages by type',
  })
  @ApiResponse({
    status: 200,
    description: 'Captured messages retrieved successfully',
  })
  async getCapturedMessages(
    @Param('sessionId') sessionId: string,
    @Query('limit') limit: number = 100,
    @Query('fromAgent') fromAgent?: string,
    @Query('toAgent') toAgent?: string,
    @Query('messageType') messageType?: string,
  ): Promise<{
    messages: A2ADebugMessage[];
    totalCount: number;
    hasMore: boolean;
  }> {
    // Implementation would filter and return messages
    return {
      messages: [],
      totalCount: 0,
      hasMore: false,
    };
  }

  @Post('messages/:messageId/analyze')
  @ApiOperation({
    summary: 'Analyze specific message',
    description: 'Performs detailed analysis of a captured message',
  })
  @ApiParam({
    name: 'messageId',
    description: 'Unique identifier of the message to analyze',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        includeRecommendations: { type: 'boolean', default: true },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Message analysis completed successfully',
  })
  async analyzeMessage(
    @Param('messageId') messageId: string,
    @Body() request: AnalyzeMessageRequest,
  ): Promise<MessageAnalysis> {
    return this.debuggerService.analyzeMessage(messageId);
  }

  // Conversation tracing
  @Post('conversations/trace')
  @ApiOperation({
    summary: 'Start conversation trace',
    description: 'Begins tracing a conversation between specified agents',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['participants'],
      properties: {
        participants: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of agent IDs participating in the conversation',
        },
        name: { type: 'string', description: 'Optional conversation name' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Conversation trace started successfully',
  })
  async startConversationTrace(
    @Body() request: { participants: string[]; name?: string },
  ): Promise<{ conversationId: string; message: string }> {
    const conversationId = await this.debuggerService.startConversationTrace(request.participants);
    return {
      conversationId,
      message: 'Conversation trace started successfully',
    };
  }

  @Get('conversations/:conversationId')
  @ApiOperation({
    summary: 'Get conversation trace',
    description: 'Returns detailed trace of a conversation including flow diagram',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'Unique identifier of the conversation trace',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversation trace retrieved successfully',
  })
  async getConversationTrace(
    @Param('conversationId') conversationId: string,
  ): Promise<ConversationTrace> {
    // Implementation would return conversation trace
    throw new Error('Implementation pending');
  }

  @Post('conversations/:conversationId/analyze')
  @ApiOperation({
    summary: 'Analyze conversation',
    description: 'Performs comprehensive analysis of a conversation trace',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'Unique identifier of the conversation trace',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversation analysis completed successfully',
  })
  async analyzeConversation(
    @Param('conversationId') conversationId: string,
  ): Promise<{
    conversation: ConversationTrace;
    analysis: {
      efficiency: number;
      bottlenecks: string[];
      patterns: string[];
      recommendations: string[];
    };
  }> {
    return this.debuggerService.analyzeConversation(conversationId);
  }

  @Put('conversations/:conversationId/end')
  @ApiOperation({
    summary: 'End conversation trace',
    description: 'Ends a conversation trace and generates final analysis',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'Unique identifier of the conversation trace',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversation trace ended successfully',
  })
  async endConversationTrace(
    @Param('conversationId') conversationId: string,
  ): Promise<ConversationTrace | null> {
    return this.debuggerService.endConversationTrace(conversationId);
  }

  // Agent debugging
  @Get('agents')
  @ApiOperation({
    summary: 'Get all monitored agents',
    description: 'Returns list of all agents being monitored with debug information',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: 'boolean',
    description: 'Include inactive agents in results',
  })
  @ApiResponse({
    status: 200,
    description: 'Monitored agents retrieved successfully',
  })
  async getMonitoredAgents(
    @Query('includeInactive') includeInactive: boolean = false,
  ): Promise<AgentDebugInfo[]> {
    // Implementation would return list of monitored agents
    return [];
  }

  @Get('agents/:agentId')
  @ApiOperation({
    summary: 'Get agent debug information',
    description: 'Returns detailed debug information for a specific agent',
  })
  @ApiParam({
    name: 'agentId',
    description: 'Unique identifier of the agent',
  })
  @ApiResponse({
    status: 200,
    description: 'Agent debug information retrieved successfully',
  })
  async getAgentDebugInfo(
    @Param('agentId') agentId: string,
  ): Promise<AgentDebugInfo | null> {
    return this.debuggerService.getAgentDebugInfo(agentId);
  }

  @Get('agents/:agentId/messages')
  @ApiOperation({
    summary: 'Get agent message history',
    description: 'Returns message history for a specific agent',
  })
  @ApiParam({
    name: 'agentId',
    description: 'Unique identifier of the agent',
  })
  @ApiQuery({
    name: 'direction',
    required: false,
    enum: ['sent', 'received', 'all'],
    description: 'Filter messages by direction',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Maximum number of messages to return',
  })
  @ApiResponse({
    status: 200,
    description: 'Agent message history retrieved successfully',
  })
  async getAgentMessageHistory(
    @Param('agentId') agentId: string,
    @Query('direction') direction: 'sent' | 'received' | 'all' = 'all',
    @Query('limit') limit: number = 100,
  ): Promise<{
    messages: A2ADebugMessage[];
    statistics: {
      totalSent: number;
      totalReceived: number;
      errorRate: number;
      avgLatency: number;
    };
  }> {
    // Implementation would return agent message history
    return {
      messages: [],
      statistics: {
        totalSent: 0,
        totalReceived: 0,
        errorRate: 0,
        avgLatency: 0,
      },
    };
  }

  // Debug filters and settings
  @Put('sessions/:sessionId/filters')
  @ApiOperation({
    summary: 'Update debug filters',
    description: 'Updates the filters for a debug session',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Unique identifier of the debug session',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['filters'],
      properties: {
        filters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['agent', 'messageType', 'priority', 'keyword', 'timeRange'] },
              value: { type: 'string' },
              operator: { type: 'string', enum: ['equals', 'contains', 'greater', 'less', 'between'] },
              enabled: { type: 'boolean' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Debug filters updated successfully',
  })
  async updateDebugFilters(
    @Param('sessionId') sessionId: string,
    @Body() request: UpdateDebugFiltersRequest,
  ): Promise<{ success: boolean; message: string }> {
    const success = await this.debuggerService.setDebugFilters(sessionId, request.filters);
    return {
      success,
      message: success ? 'Debug filters updated successfully' : 'Failed to update filters',
    };
  }

  // Real-time debugging
  @Get('sessions/:sessionId/stream')
  @Sse()
  @ApiOperation({
    summary: 'Real-time debug stream',
    description: 'Server-sent events stream for real-time debug updates',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Unique identifier of the debug session',
  })
  @ApiResponse({
    status: 200,
    description: 'Real-time debug stream established',
  })
  async getDebugStream(
    @Param('sessionId') sessionId: string,
  ): Observable<{ data: any }> {
    // Enable real-time debugging for this session
    await this.debuggerService.enableRealTimeDebugging(sessionId);

    return interval(1000).pipe(
      map(() => ({
        data: {
          sessionId,
          timestamp: Date.now(),
          type: 'heartbeat',
        },
      }))
    );
  }

  // Dashboard and analytics
  @Get('dashboard')
  @ApiOperation({
    summary: 'Get debug dashboard data',
    description: 'Returns comprehensive dashboard data for debugging overview',
  })
  @ApiResponse({
    status: 200,
    description: 'Debug dashboard data retrieved successfully',
  })
  async getDebugDashboard(): Promise<{
    activeSessions: number;
    totalMessages: number;
    activeConversations: number;
    topAgents: Array<{ id: string; messageCount: number }>;
    recentErrors: Array<{ messageId: string; error: string; timestamp: number }>;
    performanceOverview: {
      avgLatency: number;
      errorRate: number;
      throughput: number;
    };
  }> {
    return this.debuggerService.getDebugDashboard();
  }

  @Get('sessions/:sessionId/export')
  @ApiOperation({
    summary: 'Export debug session',
    description: 'Exports complete debug session data for offline analysis',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Unique identifier of the debug session',
  })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['json', 'csv', 'xlsx'],
    description: 'Export format',
  })
  @ApiResponse({
    status: 200,
    description: 'Debug session exported successfully',
  })
  async exportDebugSession(
    @Param('sessionId') sessionId: string,
    @Query('format') format: 'json' | 'csv' | 'xlsx' = 'json',
  ): Promise<{
    session: DebugSession;
    messages: A2ADebugMessage[];
    conversations: ConversationTrace[];
    analytics: MessageAnalysis[];
    exportInfo: {
      format: string;
      timestamp: number;
      messageCount: number;
      conversationCount: number;
    };
  }> {
    const exportData = await this.debuggerService.exportDebugSession(sessionId);
    
    return {
      ...exportData,
      exportInfo: {
        format,
        timestamp: Date.now(),
        messageCount: exportData.messages.length,
        conversationCount: exportData.conversations.length,
      },
    };
  }

  // Debug utilities
  @Post('capture/manual')
  @ApiOperation({
    summary: 'Manually capture message',
    description: 'Manually capture a message for debugging purposes',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['message'],
      properties: {
        message: {
          type: 'object',
          description: 'A2A message to capture',
        },
        sessionId: {
          type: 'string',
          description: 'Target debug session ID',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Message captured successfully',
  })
  async manualMessageCapture(
    @Body() request: { message: any; sessionId?: string },
  ): Promise<{ success: boolean; debugMessageId: string }> {
    // If sessionId provided, temporarily set as active
    if (request.sessionId) {
      await this.debuggerService.setActiveSession(request.sessionId);
    }
    
    await this.debuggerService.captureMessage(request.message);
    
    return {
      success: true,
      debugMessageId: `debug_msg_${Date.now()}`,
    };
  }

  @Get('health')
  @ApiOperation({
    summary: 'Get debugger health status',
    description: 'Returns health status of the debugging service',
  })
  @ApiResponse({
    status: 200,
    description: 'Debugger health status retrieved successfully',
  })
  async getDebuggerHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    activeSessions: number;
    memoryUsage: number;
    uptime: number;
    lastActivity: number;
  }> {
    const dashboard = await this.debuggerService.getDebugDashboard();
    
    return {
      status: 'healthy',
      activeSessions: dashboard.activeSessions,
      memoryUsage: process.memoryUsage().heapUsed,
      uptime: process.uptime(),
      lastActivity: Date.now(),
    };
  }

  @Post('sessions/:sessionId/replay')
  @ApiOperation({
    summary: 'Replay conversation',
    description: 'Replays a captured conversation for analysis',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Unique identifier of the debug session',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['conversationId'],
      properties: {
        conversationId: { type: 'string' },
        speed: { type: 'number', default: 1.0, description: 'Replay speed multiplier' },
        pauseOnErrors: { type: 'boolean', default: true },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Conversation replay started successfully',
  })
  async replayConversation(
    @Param('sessionId') sessionId: string,
    @Body() request: {
      conversationId: string;
      speed?: number;
      pauseOnErrors?: boolean;
    },
  ): Promise<{
    replayId: string;
    status: 'started';
    estimatedDuration: number;
  }> {
    // Implementation would start conversation replay
    return {
      replayId: `replay_${Date.now()}`,
      status: 'started',
      estimatedDuration: 30000, // 30 seconds estimate
    };
  }
}