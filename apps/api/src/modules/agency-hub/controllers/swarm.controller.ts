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
import { AgentSwarmOrchestrationService } from '@the-new-fuse/core';
import { AuthGuard } from '../../../guards/auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';

@ApiTags('swarm')
@Controller('api/swarm')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class SwarmController {
  // Commenting out constructor and methods related to AgentSwarmOrchestrationService
  // as the service definition is causing build errors and is not found.
  // private readonly swarmOrchestrationService: AgentSwarmOrchestrationService
  // ) {}

  // @Post(':agencyId/executions')
  // @UseGuards(RolesGuard)
  // @Roles(UserRole.AGENCY_ADMIN, UserRole.AGENCY_MANAGER, UserRole.AGENT_OPERATOR)
  // @ApiOperation({ summary: 'Create new swarm execution' })
  // @ApiResponse({ status: 201, description: 'Swarm execution created' })
  // async createExecution(
  //   @Param('agencyId') agencyId: string,
  //   @Body() executionDto: any
  // ) {
  //   throw new HttpException('Swarm execution is not currently available', HttpStatus.NOT_IMPLEMENTED);
  // }

  // @Get(':agencyId/executions')
  // @ApiOperation({ summary: 'Get agency swarm executions' })
  // @ApiResponse({ status: 200, description: 'Executions retrieved' })
  // async getExecutions(
  //   @Param('agencyId') agencyId: string,
  //   @Query('status') status?: string,
  //   @Query('limit') limit: number = 50,
  //   @Query('offset') offset: number = 0
  // ) {
  //   throw new HttpException('Swarm executions are not currently available', HttpStatus.NOT_IMPLEMENTED);
  // }

  // @Get('executions/:executionId')
  // @ApiOperation({ summary: 'Get specific execution details' })
  // @ApiResponse({ status: 200, description: 'Execution details retrieved' })
  // async getExecution(@Param('executionId') executionId: string) {
  //   throw new HttpException('Swarm execution details are not currently available', HttpStatus.NOT_IMPLEMENTED);
  // }

  // @Put('executions/:executionId/status')
  // @UseGuards(RolesGuard)
  // @Roles(UserRole.AGENCY_ADMIN, UserRole.AGENT_OPERATOR)
  // @ApiOperation({ summary: 'Update execution status' })
  // @ApiResponse({ status: 200, description: 'Status updated successfully' })
  // async updateExecutionStatus(
  //   @Param('executionId') executionId: string,
  //   @Body() statusDto: any
  // ) {
  //   throw new HttpException('Updating swarm execution status is not currently available', HttpStatus.NOT_IMPLEMENTED);
  // }

  // @Post('executions/:executionId/steps/:stepId/update')
  // @UseGuards(RolesGuard)
  // @Roles(UserRole.AGENT_OPERATOR)
  // @ApiOperation({ summary: 'Update execution step progress' })
  // @ApiResponse({ status: 200, description: 'Step updated successfully' })
  // async updateExecutionStep(
  //   @Param('executionId') executionId: string,
  //   @Param('stepId') stepId: string,
  //   @Body() stepUpdateDto: any
  // ) {
  //   throw new HttpException('Updating swarm execution step is not currently available', HttpStatus.NOT_IMPLEMENTED);
  // }

  // @Post('executions/:executionId/messages')
  // @UseGuards(RolesGuard)
  // @Roles(UserRole.AGENT_OPERATOR)
  // @ApiOperation({ summary: 'Send message in swarm execution' })
  // @ApiResponse({ status: 201, description: 'Message sent successfully' })
  // async sendMessage(
  //   @Param('executionId') executionId: string,
  //   @Body() messageDto: any
  // ) {
  //   throw new HttpException('Sending messages in swarm execution is not currently available', HttpStatus.NOT_IMPLEMENTED);
  // }

  // @Get('executions/:executionId/messages')
  // @ApiOperation({ summary: 'Get execution messages' })
  // @ApiResponse({ status: 200, description: 'Messages retrieved' })
  // async getMessages(
  //   @Param('executionId') executionId: string,
  //   @Query('agentId') agentId?: string,
  //   @Query('limit') limit: number = 100
  // ) {
  //   throw new HttpException('Getting swarm execution messages is not currently available', HttpStatus.NOT_IMPLEMENTED);
  // }

  // @Sse('executions/:executionId/progress')
  // @ApiOperation({ summary: 'Stream execution progress' })
  // @ApiResponse({ status: 200, description: 'Progress stream established' })
  // streamExecutionProgress(
  //   @Param('executionId') executionId: string
  // ): Observable<any> {
  //   throw new HttpException('Streaming swarm execution progress is not currently available', HttpStatus.NOT_IMPLEMENTED);
  // }

  // @Post(':agencyId/health-check')
  // @UseGuards(RolesGuard)
  // @Roles(UserRole.AGENCY_ADMIN)
  // @ApiOperation({ summary: 'Perform swarm health check' })
  // @ApiResponse({ status: 200, description: 'Health check completed' })
  // async performHealthCheck(@Param('agencyId') agencyId: string) {
  //   throw new HttpException('Swarm health checks are not currently available', HttpStatus.NOT_IMPLEMENTED);
  // }

  // @Get(':agencyId/metrics')
  // @ApiOperation({ summary: 'Get swarm performance metrics' })
  // @ApiResponse({ status: 200, description: 'Metrics retrieved' })
  // async getMetrics(
  //   @Param('agencyId') agencyId: string,
  //   @Query('timeframe') timeframe: string = '24h'
  // ) {
  //   throw new HttpException('Swarm performance metrics are not currently available', HttpStatus.NOT_IMPLEMENTED);
  // }
}
