/**
 * Swarm Orchestration Controller
 * Handles swarm execution, monitoring, and management endpoints
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  Sse,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';

import { AgentSwarmOrchestrationService } from '../services/agent-swarm-orchestration.service';
import { TenantGuard } from '../guards/tenant.guard';
import { AgencyRoleGuard } from '../guards/agency-role.guard';
import { Roles } from '../decorators/roles.decorator';
import { TenantContext } from '../decorators/tenant-context.decorator';

@ApiTags('Swarm Orchestration')
@Controller('api/swarm')
@UseGuards(TenantGuard)
export class SwarmOrchestrationController {
  private readonly logger = new Logger(SwarmOrchestrationController.name);

  constructor(
    private readonly swarmService: AgentSwarmOrchestrationService
  ) {}

  /**
   * Swarm Execution Management
   */

  @Post('execute')
  @ApiOperation({ summary: 'Execute a swarm task' })
  @ApiResponse({ status: 201, description: 'Swarm execution started' })
  @ApiResponse({ status: 400, description: 'Invalid execution parameters' })
  @HttpCode(HttpStatus.CREATED)
  async executeSwarm(
    @TenantContext() tenantContext: any,
    @Body() executionParams: {
      task: string;
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      requiredCapabilities?: string[];
      maxExecutionTime?: number;
      qualityThreshold?: number;
      context?: any;
    }
  ) {
    this.logger.log(`Starting swarm execution for agency: ${tenantContext.agencyId}`);
    
    const execution = await this.swarmService.executeSwarm(
      tenantContext.agencyId,
      {
        ...executionParams,
        requesterId: tenantContext.userId
      }
    );

    return {
      success: true,
      data: execution,
      message: 'Swarm execution started successfully'
    };
  }

  @Get('executions')
  @ApiOperation({ summary: 'Get swarm executions for agency' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Executions retrieved successfully' })
  async getSwarmExecutions(
    @TenantContext() tenantContext: any,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ) {
    const executions = await this.swarmService.getSwarmExecutions(
      tenantContext.agencyId,
      { status, page, limit }
    );

    return {
      success: true,
      data: executions
    };
  }

  @Get('executions/:executionId')
  @ApiOperation({ summary: 'Get specific swarm execution details' })
  @ApiParam({ name: 'executionId', description: 'Execution ID' })
  @ApiResponse({ status: 200, description: 'Execution details retrieved' })
  @ApiResponse({ status: 404, description: 'Execution not found' })
  async getSwarmExecution(
    @TenantContext() tenantContext: any,
    @Param('executionId') executionId: string
  ) {
    const execution = await this.swarmService.getSwarmExecutionById(
      tenantContext.agencyId,
      executionId
    );

    return {
      success: true,
      data: execution
    };
  }

  @Put('executions/:executionId/cancel')
  @ApiOperation({ summary: 'Cancel a swarm execution' })
  @ApiParam({ name: 'executionId', description: 'Execution ID' })
  @ApiResponse({ status: 200, description: 'Execution cancelled successfully' })
  @UseGuards(AgencyRoleGuard)
  @Roles('AGENCY_ADMIN', 'AGENCY_MANAGER')
  async cancelSwarmExecution(
    @TenantContext() tenantContext: any,
    @Param('executionId') executionId: string
  ) {
    await this.swarmService.cancelSwarmExecution(
      tenantContext.agencyId,
      executionId
    );

    return {
      success: true,
      message: 'Swarm execution cancelled successfully'
    };
  }

  @Put('executions/:executionId/retry')
  @ApiOperation({ summary: 'Retry a failed swarm execution' })
  @ApiParam({ name: 'executionId', description: 'Execution ID' })
  @ApiResponse({ status: 200, description: 'Execution retried successfully' })
  async retrySwarmExecution(
    @TenantContext() tenantContext: any,
    @Param('executionId') executionId: string
  ) {
    const execution = await this.swarmService.retrySwarmExecution(
      tenantContext.agencyId,
      executionId
    );

    return {
      success: true,
      data: execution,
      message: 'Swarm execution retried successfully'
    };
  }

  /**
   * Real-time Monitoring
   */

  @Sse('executions/:executionId/stream')
  @ApiOperation({ summary: 'Stream real-time execution updates' })
  @ApiParam({ name: 'executionId', description: 'Execution ID' })
  streamExecutionUpdates(
    @TenantContext() tenantContext: any,
    @Param('executionId') executionId: string
  ): Observable<any> {
    this.logger.log(`Starting execution stream for: ${executionId}`);
    
    return this.swarmService.streamExecutionUpdates(
      tenantContext.agencyId,
      executionId
    );
  }

  @Get('executions/:executionId/steps')
  @ApiOperation({ summary: 'Get execution steps' })
  @ApiParam({ name: 'executionId', description: 'Execution ID' })
  @ApiResponse({ status: 200, description: 'Execution steps retrieved' })
  async getExecutionSteps(
    @TenantContext() tenantContext: any,
    @Param('executionId') executionId: string
  ) {
    const steps = await this.swarmService.getExecutionSteps(
      tenantContext.agencyId,
      executionId
    );

    return {
      success: true,
      data: steps
    };
  }

  @Get('executions/:executionId/messages')
  @ApiOperation({ summary: 'Get execution messages' })
  @ApiParam({ name: 'executionId', description: 'Execution ID' })
  @ApiQuery({ name: 'agentId', required: false, description: 'Filter by agent ID' })
  @ApiResponse({ status: 200, description: 'Execution messages retrieved' })
  async getExecutionMessages(
    @TenantContext() tenantContext: any,
    @Param('executionId') executionId: string,
    @Query('agentId') agentId?: string
  ) {
    const messages = await this.swarmService.getExecutionMessages(
      tenantContext.agencyId,
      executionId,
      agentId
    );

    return {
      success: true,
      data: messages
    };
  }

  /**
   * Swarm Configuration
   */

  @Get('hierarchy')
  @ApiOperation({ summary: 'Get agency swarm hierarchy' })
  @ApiResponse({ status: 200, description: 'Swarm hierarchy retrieved' })
  async getSwarmHierarchy(@TenantContext() tenantContext: any) {
    const hierarchy = await this.swarmService.getSwarmHierarchy(
      tenantContext.agencyId
    );

    return {
      success: true,
      data: hierarchy
    };
  }

  @Post('hierarchy/rebuild')
  @ApiOperation({ summary: 'Rebuild swarm hierarchy' })
  @ApiResponse({ status: 200, description: 'Hierarchy rebuilt successfully' })
  @UseGuards(AgencyRoleGuard)
  @Roles('AGENCY_ADMIN')
  async rebuildSwarmHierarchy(@TenantContext() tenantContext: any) {
    await this.swarmService.buildSwarmHierarchy(tenantContext.agencyId);

    return {
      success: true,
      message: 'Swarm hierarchy rebuilt successfully'
    };
  }

  @Get('agents')
  @ApiOperation({ summary: 'Get available swarm agents' })
  @ApiQuery({ name: 'capability', required: false, description: 'Filter by capability' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiResponse({ status: 200, description: 'Swarm agents retrieved' })
  async getSwarmAgents(
    @TenantContext() tenantContext: any,
    @Query('capability') capability?: string,
    @Query('status') status?: string
  ) {
    const agents = await this.swarmService.getSwarmAgents(
      tenantContext.agencyId,
      { capability, status }
    );

    return {
      success: true,
      data: agents
    };
  }

  @Put('agents/:agentId/assign-role')
  @ApiOperation({ summary: 'Assign role to swarm agent' })
  @ApiParam({ name: 'agentId', description: 'Agent ID' })
  @ApiResponse({ status: 200, description: 'Role assigned successfully' })
  @UseGuards(AgencyRoleGuard)
  @Roles('AGENCY_ADMIN', 'AGENCY_MANAGER')
  async assignAgentRole(
    @TenantContext() tenantContext: any,
    @Param('agentId') agentId: string,
    @Body() roleData: {
      hierarchyLevel: number;
      capabilities: string[];
      maxConcurrentTasks: number;
    }
  ) {
    await this.swarmService.assignAgentRole(
      tenantContext.agencyId,
      agentId,
      roleData
    );

    return {
      success: true,
      message: 'Agent role assigned successfully'
    };
  }

  /**
   * Analytics and Performance
   */

  @Get('analytics/performance')
  @ApiOperation({ summary: 'Get swarm performance analytics' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period (7d, 30d, 90d)' })
  @ApiResponse({ status: 200, description: 'Performance analytics retrieved' })
  async getSwarmPerformance(
    @TenantContext() tenantContext: any,
    @Query('period') period = '30d'
  ) {
    const analytics = await this.swarmService.getSwarmPerformanceAnalytics(
      tenantContext.agencyId,
      period
    );

    return {
      success: true,
      data: analytics
    };
  }

  @Get('analytics/efficiency')
  @ApiOperation({ summary: 'Get swarm efficiency metrics' })
  @ApiResponse({ status: 200, description: 'Efficiency metrics retrieved' })
  async getSwarmEfficiency(@TenantContext() tenantContext: any) {
    const efficiency = await this.swarmService.getSwarmEfficiencyMetrics(
      tenantContext.agencyId
    );

    return {
      success: true,
      data: efficiency
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Get swarm health status' })
  @ApiResponse({ status: 200, description: 'Health status retrieved' })
  async getSwarmHealth(@TenantContext() tenantContext: any) {
    const health = await this.swarmService.getSwarmHealthStatus(
      tenantContext.agencyId
    );

    return {
      success: true,
      data: health
    };
  }
}
