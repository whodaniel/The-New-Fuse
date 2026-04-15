import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AgentExecutionsService } from './agent-executions.service';
import {
  AgentExecutionQueryDto,
  AgentExecutionResponseDto,
  AgentExecutionListResponseDto,
  ExecutionStatus
} from './dto/agent-execution.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('agents')
@Controller('agents/executions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AgentExecutionsController {
  constructor(private readonly agentExecutionsService: AgentExecutionsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get agent execution history',
    description: 'Retrieve a paginated list of agent execution records with optional filtering'
  })
  @ApiQuery({ name: 'agentId', required: false, description: 'Filter by agent ID' })
  @ApiQuery({ name: 'status', required: false, enum: ExecutionStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO 8601)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({
    status: 200,
    description: 'Execution history retrieved successfully',
    type: AgentExecutionListResponseDto
  })
  async findAll(@Query() query: AgentExecutionQueryDto): Promise<AgentExecutionListResponseDto> {
    return this.agentExecutionsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get agent execution details',
    description: 'Retrieve detailed information about a specific agent execution'
  })
  @ApiResponse({
    status: 200,
    description: 'Execution details retrieved successfully',
    type: AgentExecutionResponseDto
  })
  @ApiResponse({ status: 404, description: 'Execution not found' })
  async findOne(@Param('id') id: string): Promise<AgentExecutionResponseDto> {
    return this.agentExecutionsService.findOne(id);
  }
}
