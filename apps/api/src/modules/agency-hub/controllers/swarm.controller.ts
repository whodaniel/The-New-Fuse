import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpException,
  Sse,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Observable, map } from 'rxjs';
import { AgentSwarmOrchestrationService } from '@the-new-fuse/core/services/agent-swarm-orchestration.service';
import { AuthGuard } from '../../../guards/auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { EnhancedUserRole } from '@prisma/client';

@ApiTags('swarm')
@Controller('api/swarm')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class SwarmController {
  constructor(
    private readonly swarmOrchestrationService: AgentSwarmOrchestrationService
  ) {}

  @Post(':agencyId/executions')
  @UseGuards(RolesGuard)
  @Roles(EnhancedUserRole.AGENCY_ADMIN, EnhancedUserRole.AGENCY_MANAGER, EnhancedUserRole.AGENT_OPERATOR)
  @ApiOperation({ summary: 'Create new swarm execution' })
  @ApiResponse({ status: 201, description: 'Swarm execution created' })
  async createExecution(
    @Param('agencyId') agencyId: string,
    @Body() executionDto: any
  ) {
    try {
      return await this.swarmOrchestrationService.createExecution(
        agencyId,
        executionDto.serviceRequestId,
        executionDto.executionPlan,
        executionDto.configuration
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create execution',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':agencyId/executions')
  @ApiOperation({ summary: 'Get agency swarm executions' })
  @ApiResponse({ status: 200, description: 'Executions retrieved' })
  async getExecutions(
    @Param('agencyId') agencyId: string,
    @Query('status') status?: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0
  ) {
    try {
      return await this.swarmOrchestrationService.getExecutions(agencyId, {
        status,
        limit,
        offset
      });
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get executions',
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Get('executions/:executionId')
  @ApiOperation({ summary: 'Get specific execution details' })
  @ApiResponse({ status: 200, description: 'Execution details retrieved' })
  async getExecution(@Param('executionId') executionId: string) {
    try {
      return await this.swarmOrchestrationService.getExecutionDetails(executionId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Execution not found',
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Put('executions/:executionId/status')
  @UseGuards(RolesGuard)
  @Roles(EnhancedUserRole.AGENCY_ADMIN, EnhancedUserRole.AGENT_OPERATOR)
  @ApiOperation({ summary: 'Update execution status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async updateExecutionStatus(
    @Param('executionId') executionId: string,
    @Body() statusDto: any
  ) {
    try {
      return await this.swarmOrchestrationService.updateExecutionStatus(
        executionId,
        statusDto.status,
        statusDto.reason
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update status',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('executions/:executionId/steps/:stepId/update')
  @UseGuards(RolesGuard)
  @Roles(EnhancedUserRole.AGENT_OPERATOR)
  @ApiOperation({ summary: 'Update execution step progress' })
  @ApiResponse({ status: 200, description: 'Step updated successfully' })
  async updateExecutionStep(
    @Param('executionId') executionId: string,
    @Param('stepId') stepId: string,
    @Body() stepUpdateDto: any
  ) {
    try {
      return await this.swarmOrchestrationService.updateExecutionStep(
        executionId,
        stepId,
        stepUpdateDto
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update step',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('executions/:executionId/messages')
  @UseGuards(RolesGuard)
  @Roles(EnhancedUserRole.AGENT_OPERATOR)
  @ApiOperation({ summary: 'Send message in swarm execution' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  async sendMessage(
    @Param('executionId') executionId: string,
    @Body() messageDto: any
  ) {
    try {
      return await this.swarmOrchestrationService.sendMessage(
        executionId,
        messageDto.fromAgentId,
        messageDto.toAgentId,
        messageDto.type,
        messageDto.content,
        messageDto.priority
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to send message',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('executions/:executionId/messages')
  @ApiOperation({ summary: 'Get execution messages' })
  @ApiResponse({ status: 200, description: 'Messages retrieved' })
  async getMessages(
    @Param('executionId') executionId: string,
    @Query('agentId') agentId?: string,
    @Query('limit') limit: number = 100
  ) {
    try {
      return await this.swarmOrchestrationService.getMessages(executionId, {
        agentId,
        limit
      });
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get messages',
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Sse('executions/:executionId/progress')
  @ApiOperation({ summary: 'Stream execution progress' })
  @ApiResponse({ status: 200, description: 'Progress stream established' })
  streamExecutionProgress(
    @Param('executionId') executionId: string
  ): Observable<any> {
    return this.swarmOrchestrationService.streamExecutionProgress(executionId)
      .pipe(
        map(data => ({
          data: JSON.stringify(data),
          type: 'execution-progress'
        }))
      );
  }

  @Post(':agencyId/health-check')
  @UseGuards(RolesGuard)
  @Roles(EnhancedUserRole.AGENCY_ADMIN)
  @ApiOperation({ summary: 'Perform swarm health check' })
  @ApiResponse({ status: 200, description: 'Health check completed' })
  async performHealthCheck(@Param('agencyId') agencyId: string) {
    try {
      return await this.swarmOrchestrationService.performHealthCheck(agencyId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Health check failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':agencyId/metrics')
  @ApiOperation({ summary: 'Get swarm performance metrics' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved' })
  async getMetrics(
    @Param('agencyId') agencyId: string,
    @Query('timeframe') timeframe: string = '24h'
  ) {
    try {
      return await this.swarmOrchestrationService.getPerformanceMetrics(
        agencyId,
        timeframe
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get metrics',
        HttpStatus.NOT_FOUND
      );
    }
  }
}
