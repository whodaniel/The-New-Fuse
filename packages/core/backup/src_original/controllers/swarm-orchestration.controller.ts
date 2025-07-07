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
} from /@nestjs/common'';
} from /@nestjs/swagger';
import { Observable } from 'rxjs';
import { TenantGuard } from /../guards/tenant.'guard';
import { AgencyRoleGuard } from /../guards/agency-role.'guard';
import { Roles } from /../decorators/roles.'decorator';
import { TenantContext } from /../decorators/tenant-context.'decorator';
@ApiTags('Swarm Orchestration'
  @Post('execute'
  @ApiOperation({ summary:Execute a swarm task'
  @ApiResponse({ status: 201, description:Swarm execution started'
  @ApiResponse({ status: 400, description:Invalid execution parameters'
      priority?:LOW' | MEDIUM' | HIGH' | URGENT'
      message:Swarm execution started successfully'
  @Get('executions'
  @ApiOperation({ summary:Get swarm executions for agency'
  @ApiQuery({ name: 'status'
  @ApiQuery({ name: 'page'
  @ApiQuery({ name: 'limit'
  @ApiResponse({ status: 200, description: Executions retrieved 'successfully'
    @Query('status'
    @Query('page'
    @Query('limit'
  @Get(/executions/:executionId'
  @ApiOperation({ summary:Get specific swarm execution details'
  @ApiParam({ name: 'executionId', description: Execution 'ID'
  @ApiResponse({ status: 200, description:Execution details retrieved'
  @ApiResponse({ status: 404, description:Execution not found'
    @Param('executionId'
  @Put(/executions/:executionId/cancel'
  @ApiOperation({ summary:Cancel a swarm execution'
  @ApiParam({ name: 'executionId', description: Execution 'ID'
  @ApiResponse({ status: 200, description:Execution cancelled successfully'
  @Roles('AGENCY_ADMIN', AGENCY_MANAGER'
    @Param('executionId'
      message:Swarm execution cancelled successfully'
  @Put(/executions/:executionId/retry'
  @ApiOperation({ summary:Retry a failed swarm execution'
  @ApiParam({ name: 'executionId', description: Execution 'ID'
  @ApiResponse({ status: 200, description:Execution retried successfully'
    @Param('executionId'
  @Sse(/executions/:executionId/stream'
  @ApiOperation({ summary:Stream real-time execution updates'
  @ApiParam({ name: 'executionId', description: Execution 'ID'
    @Param('executionId'
  @Get(/executions/:executionId/steps'
  @ApiOperation({ summary:Get execution steps'
  @ApiParam({ name: 'executionId', description: Execution 'ID'
  @ApiResponse({ status: 200, description:Execution steps retrieved'
    @Param('executionId'
  @Get(/executions/:executionId/messages'
  @ApiOperation({ summary:Get execution messages'
  @ApiParam({ name: 'executionId', description: Execution 'ID'
  @ApiQuery({ name: 'agentId', required: false, description: Filter by agent 'ID'
  @ApiResponse({ status: 200, description:Execution messages retrieved'
    @Param('executionId'
    @Query('')
  @Get('hierarchy'
  @ApiOperation({ summary:Get agency swarm hierarchy'
  @ApiResponse({ status: 200, description:Swarm hierarchy retrieved'
  @Post(/hierarchy/rebuild'
  @ApiOperation({ summary:Rebuild swarm hierarchy'
  @ApiResponse({ status: 200, description:Hierarchy rebuilt successfully'
  @Roles('AGENCY_ADMIN'
      message:Swarm hierarchy rebuilt successfully'
  @Get('agents'
  @ApiOperation({ summary:Get available swarm agents'
  @ApiQuery({ name: 'capability', required: false, description: Filter by 'capability'
  @ApiQuery({ name: 'status', required: false, description: Filter by 'status'
  @ApiResponse({ status: 200, description:Swarm agents retrieved'
    @Query('capability'
    @Query('status'
  @Put(/agents/:agentId/assign-role'
  @ApiOperation({ summary:Assign role to swarm agent'
  @ApiParam({ name: 'agentId', description: Agent 'ID'
  @ApiResponse({ status: 200, description:Role assigned successfully'
  @Roles('AGENCY_ADMIN', AGENCY_MANAGER'
    @Param('agentId'
  @Get(/analytics/performance'
  @ApiOperation({ summary:Get swarm performance analytics'
  @ApiQuery({ name: 'period', required: false, description: Time period (7d, 30d, 90d)'
  @ApiResponse({ status: 200, description:Performance analytics retrieved'
    @Query('period') period = 30'd';
  @Get(/analytics/efficiency'
  @ApiOperation({ summary:Get swarm efficiency metrics'
  @ApiResponse({ status: 200, description:Efficiency metrics retrieved'
  @Get('health'
  @ApiOperation({ summary:Get swarm health status'