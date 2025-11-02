import { Controller, Get, Post, Put, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../modules/guards/jwt-auth.guard';
import { AgentService } from '../services/agent.service';
import { WorkflowService } from '../services/workflow.service';
// Assuming TaskService and UserService exist in ../services/
// import { TaskService } from '../services/task.service';
// import { UserService } from '../services/user.service';
import { CurrentUser } from '../modules/decorators/current-user.decorator';
// Local type definition to avoid cross-package import issues
interface UserModel {
  id: string;
  [key: string]: any;
}

// Consolidated DTOs for batch operations
export interface BatchOperationRequest<T> {
  operations: Array<{
    id?: string;
    action: 'create' | 'update' | 'delete';
    data: T;
  }>;
}

export interface BatchOperationResponse<T> {
  results: Array<{
    id: string;
    action: string;
    success: boolean;
    data?: T;
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    duration: number;
  };
}

export interface ResourceWithRelations {
  id: string;
  include?: string[];
  fields?: string[];
}

@ApiTags('Consolidated API')
@Controller('api/v2')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConsolidatedApiController {
  constructor(
    private readonly agentService: AgentService,
    private readonly workflowService: WorkflowService,
    // private readonly taskService: TaskService,
    // private readonly userService: UserService,
  ) {}

  // Batch Agent Operations
  @Post('agents/batch')
  @ApiOperation({ summary: 'Batch operations on agents (create, update, delete)' })
  @ApiResponse({ status: 200, description: 'Batch operation results' })
  async batchAgentOperations(
    @Body() request: BatchOperationRequest<any>,
    @CurrentUser() user: UserModel,
  ): Promise<BatchOperationResponse<any>> {
    const startTime = Date.now();
    const results: Array<{
      id: string;
      action: string;
      success: boolean;
      data?: any;
      error?: string;
    }> = [];

    for (const operation of request.operations) {
      try {
        let result;
        switch (operation.action) {
          case 'create':
            result = await this.agentService.createAgent({ ...operation.data, userId: user.id }, user.id);
            break;
          case 'update':
            result = await this.agentService.updateAgent(operation.id!, operation.data, user.id);
            break;
          case 'delete':
            result = await this.agentService.deleteAgent(operation.id!, user.id);
            break;
        }
        
        results.push({
          id: operation.id || (result as any).id,
          action: operation.action,
          success: true,
          data: result,
        });
      } catch (error) {
        results.push({
          id: operation.id || 'unknown',
          action: operation.action,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const duration = Date.now() - startTime;
    const successful = results.filter(r => r.success).length;

    return {
      results,
      summary: {
        total: request.operations.length,
        successful,
        failed: results.length - successful,
        duration,
      },
    };
  }

  // Multi-Resource Fetch (replaces multiple API calls)
  @Post('resources/multi-fetch')
  @ApiOperation({ summary: 'Fetch multiple resources in a single request' })
  @ApiResponse({ status: 200, description: 'Multi-resource response' })
  async multiFetch(
    @Body() request: {
      agents?: ResourceWithRelations[];
      workflows?: ResourceWithRelations[];
      tasks?: ResourceWithRelations[];
    },
    @CurrentUser() user: UserModel,
  ): Promise<{
    agents?: any[];
    workflows?: any[];
    tasks?: any[];
    meta: { totalQueries: number; duration: number };
  }> {
    const startTime = Date.now();
    let totalQueries = 0;
    const response: any = { meta: { totalQueries: 0, duration: 0 } };

    // Fetch agents with specified relations
    if (request.agents?.length) {
      const agentPromises = request.agents.map(async (req) => {
        totalQueries++;
        // Assuming findOneWithRelations exists or can be implemented in AgentService
        return this.agentService.getAgentById(req.id, user.id);
      });
      response.agents = await Promise.all(agentPromises);
    }

    // Fetch workflows with specified relations
    if (request.workflows?.length) {
      const workflowPromises = request.workflows.map(async (req) => {
        totalQueries++;
        // Assuming findOneWithRelations exists or can be implemented in WorkflowService
        return this.workflowService.getWorkflowById(req.id, user.id);
      });
      response.workflows = await Promise.all(workflowPromises);
    }

    // Fetch tasks with specified relations
    if (request.tasks?.length) {
      const taskPromises = request.tasks.map(async (req) => {
        totalQueries++;
        // Assuming findOneWithRelations exists or can be implemented in TaskService
        // return this.taskService.findOneWithRelations(req.id, {
        //   include: req.include,
        //   select: req.fields,
        //   userId: user.id,
        // });
        return null; // Placeholder
      });
      response.tasks = await Promise.all(taskPromises);
    }

    response.meta = {
      totalQueries,
      duration: Date.now() - startTime,
    };

    return response;
  }

  // Dashboard Data Aggregation (replaces multiple dashboard API calls)
  @Get('dashboard/aggregate')
  @ApiOperation({ summary: 'Get aggregated dashboard data in single request' })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  async getDashboardData(@CurrentUser() user: UserModel): Promise<{
    summary: {
      agentCount: number;
      activeWorkflows: number;
      pendingTasks: number;
      recentActivity: number;
    };
    recentAgents: any[];
    activeWorkflows: any[];
    urgentTasks: any[];
    systemHealth: {
      status: string;
      uptime: number;
      lastCheck: Date;
    };
    performance: {
      averageResponseTime: number;
      successRate: number;
      activeConnections: number;
    };
  }> {
    // Execute all queries in parallel for maximum efficiency
    const [
      agentCount,
      activeWorkflows,
      // pendingTasks,
      recentActivity,
      recentAgents,
      workflows,
      // urgentTasks,
      systemHealth,
    ] = await Promise.all([
      this.agentService.getAgents(user.id).then(agents => agents.length), // Assuming countByUser is not directly available
      this.workflowService.getWorkflows(user.id).then(workflows => workflows.filter(w => w.status === 'active').length), // Assuming countActive is not directly available
      // this.taskService.countPending(user.id),
      this.getRecentActivityCount(user.id),
      this.agentService.getAgents(user.id).then(agents => agents.slice(0, 5)), // Assuming findRecent is not directly available
      this.workflowService.getWorkflows(user.id).then(workflows => workflows.filter(w => w.status === 'active').slice(0, 5)), // Assuming findActive is not directly available
      // this.taskService.findUrgent(user.id, 10),
      this.getSystemHealth(),
    ]);

    return {
      summary: {
        agentCount,
        activeWorkflows,
        pendingTasks: 0, // Placeholder
        recentActivity: recentActivity,
      },
      recentAgents,
      activeWorkflows: workflows,
      urgentTasks: [], // Placeholder
      systemHealth: {
        status: systemHealth.status,
        uptime: systemHealth.uptime,
        lastCheck: new Date(),
      },
      performance: {
        averageResponseTime: systemHealth.avgResponseTime,
        successRate: systemHealth.successRate,
        activeConnections: systemHealth.connections,
      },
    };
  }

  // Bulk Status Updates (common operation for workflows/tasks)
  @Put('status/bulk-update')
  @ApiOperation({ summary: 'Update status for multiple resources' })
  @ApiResponse({ status: 200, description: 'Bulk status update results' })
  async bulkStatusUpdate(
    @Body() request: {
      agents?: Array<{ id: string; status: string }>;
      workflows?: Array<{ id: string; status: string }>;
      tasks?: Array<{ id: string; status: string }>;
    },
    @CurrentUser() user: UserModel,
  ): Promise<{
    updated: { agents: number; workflows: number; tasks: number };
    errors: Array<{ type: string; id: string; error: string }>;
  }> {
    const results = { 
      updated: { agents: 0, workflows: 0, tasks: 0 }, 
      errors: [] as Array<{ type: string; id: string; error: string }> 
    };

    // Update agent statuses
    if (request.agents?.length) {
      for (const { id, status } of request.agents) {
        try {
          await this.agentService.updateAgent(id, { status: status as any }, user.id); // Cast status to any for now
          results.updated.agents++;
        } catch (error) {
          results.errors.push({ type: 'agent', id, error: error instanceof Error ? error.message : String(error) });
        }
      }
    }

    // Update workflow statuses
    if (request.workflows?.length) {
      for (const { id, status } of request.workflows) {
        try {
          await this.workflowService.updateWorkflow(id, { status: status as any }, user.id); // Cast status to any for now
          results.updated.workflows++;
        } catch (error) {
          results.errors.push({ type: 'workflow', id, error: error instanceof Error ? error.message : String(error) });
        }
      }
    }

    // Update task statuses
    if (request.tasks?.length) {
      for (const { id, status } of request.tasks) {
        try {
          // await this.taskService.updateStatus(id, status, user.id);
          // results.updated.tasks++;
        } catch (error) {
          results.errors.push({ type: 'task', id, error: error instanceof Error ? error.message : String(error) });
        }
      }
    }

    return results;
  }

  // Search Across All Resources
  @Get('search/global')
  @ApiOperation({ summary: 'Search across agents, workflows, and tasks' })
  @ApiResponse({ status: 200, description: 'Global search results' })
  async globalSearch(
    @Query('q') query: string,
    @Query('types') types: string = 'agents,workflows,tasks',
    @Query('limit') limit: number = 10,
    @CurrentUser() user: UserModel,
  ): Promise<{
    agents: any[];
    workflows: any[];
    tasks: any[];
    total: number;
    searchTime: number;
  }> {
    const startTime = Date.now();
    const searchTypes = types.split(',');
    const results: any = { agents: [], workflows: [], tasks: [], total: 0 };

    const searchPromises: Promise<{ type: string; data: any[] }>[] = [];

    if (searchTypes.includes('agents')) {
      searchPromises.push(
        this.agentService.getAgents(user.id).then((r: any) => ({ type: 'agents', data: r.filter((agent: any) => agent.name.includes(query)).slice(0, limit) })) // Assuming search method is not directly available
      );
    }

    if (searchTypes.includes('workflows')) {
      searchPromises.push(
        this.workflowService.getWorkflows(user.id).then((r: any) => ({ type: 'workflows', data: r.filter((workflow: any) => workflow.name.includes(query)).slice(0, limit) })) // Assuming search method is not directly available
      );
    }

    if (searchTypes.includes('tasks')) {
      searchPromises.push(
        // this.taskService.search(query, user.id, limit).then((r: any) => ({ type: 'tasks', data: r }))
        Promise.resolve({ type: 'tasks', data: [] }) // Placeholder
      );
    }

    const searchResults = await Promise.all(searchPromises);

    searchResults.forEach(result => {
      results[result.type] = result.data;
      results.total += result.data.length;
    });

    return {
      ...results,
      searchTime: Date.now() - startTime,
    };
  }

  // Analytics Aggregation
  @Get('analytics/summary')
  @ApiOperation({ summary: 'Get analytics summary for all resources' })
  @ApiResponse({ status: 200, description: 'Analytics data' })
  async getAnalyticsSummary(
    @Query('period') period: string = '7d',
    @CurrentUser() user: UserModel,
  ): Promise<{
    period: string;
    metrics: {
      agentMetrics: any;
      workflowMetrics: any;
      taskMetrics: any;
      performanceMetrics: any;
    };
    trends: {
      agentCreation: number[];
      workflowExecution: number[];
      taskCompletion: number[];
    };
    topPerformers: {
      agents: any[];
      workflows: any[];
    };
  }> {
    const [agentMetrics, workflowMetrics, performanceMetrics] = await Promise.all([
      this.agentService.getAgents(user.id).then(agents => ({ count: agents.length, creationTrend: [] })), // Assuming getMetrics is not directly available
      this.workflowService.getWorkflows(user.id).then(workflows => ({ count: workflows.length, executionTrend: [] })), // Assuming getMetrics is not directly available
      // this.taskService.getMetrics(user.id, period),
      this.getPerformanceMetrics(period),
    ]);

    const taskMetrics = { count: 0, completionTrend: [] }; // Placeholder

    return {
      period,
      metrics: {
        agentMetrics,
        workflowMetrics,
        taskMetrics: { count: 0, completionTrend: [] }, // Placeholder
        performanceMetrics,
      },
      trends: {
        agentCreation: agentMetrics.creationTrend || [],
        workflowExecution: workflowMetrics.executionTrend || [],
        taskCompletion: taskMetrics.completionTrend || [],
      },
      topPerformers: {
        agents: [], // Placeholder - topPerformers not available in mock metrics
        workflows: [], // Placeholder - topPerformers not available in mock metrics
      },
    };
  }

  // Helper methods
  private async getRecentActivityCount(userId: string): Promise<number> {
    // Implementation for recent activity count
    return 42; // Mock value
  }

  private async getSystemHealth(): Promise<any> {
    // Implementation for system health check
    return {
      status: 'healthy',
      uptime: 99.9,
      avgResponseTime: 150,
      successRate: 99.5,
      connections: 25,
    };
  }

  private async getPerformanceMetrics(period: string): Promise<any> {
    // Implementation for performance metrics
    return {
      responseTime: 145,
      throughput: 1250,
      errorRate: 0.5,
      availability: 99.9,
    };
  }
}
