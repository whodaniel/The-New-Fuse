var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WorkflowDependencyService_1;
var _a, _b, _c;
import { Injectable, Logger, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
import { AuditService } from '../../services/audit.service';
import { MetricsService } from '../../services/metrics.service';
import { v4 as uuidv4 } from 'uuid';
export var DependencyType;
(function (DependencyType) {
    DependencyType["WORKFLOW"] = "workflow";
    DependencyType["DATA"] = "data";
    DependencyType["API"] = "api";
    DependencyType["SERVICE"] = "service";
    DependencyType["RESOURCE"] = "resource";
})(DependencyType || (DependencyType = {}));
export var DependencyStatus;
(function (DependencyStatus) {
    DependencyStatus["ACTIVE"] = "active";
    DependencyStatus["INACTIVE"] = "inactive";
    DependencyStatus["ERROR"] = "error";
    DependencyStatus["PENDING"] = "pending";
})(DependencyStatus || (DependencyStatus = {}));
let WorkflowDependencyService = WorkflowDependencyService_1 = class WorkflowDependencyService {
    prismaService;
    auditService;
    metricsService;
    logger = new Logger(WorkflowDependencyService_1.name);
    constructor(prismaService, auditService, metricsService) {
        this.prismaService = prismaService;
        this.auditService = auditService;
        this.metricsService = metricsService;
    }
    async addDependency(createDependencyDto, userId) {
        const startTime = Date.now();
        try {
            // Validate workflow access
            await this.getWorkflowWithAccess(createDependencyDto.workflowId, userId);
            // Check for circular dependencies
            const wouldCreateCycle = await this.wouldCreateCircularDependency(createDependencyDto.workflowId, createDependencyDto.dependencyId);
            if (wouldCreateCycle) {
                throw new BadRequestException('Adding this dependency would create a circular reference');
            }
            // Check if dependency already exists
            const existingDependency = await this.getDependency(createDependencyDto.workflowId, createDependencyDto.dependencyId);
            if (existingDependency) {
                throw new ConflictException('Dependency already exists');
            }
            // Validate dependency exists and is accessible
            await this.validateDependency(createDependencyDto);
            // Create dependency
            const dependency = {
                id: uuidv4(),
                workflowId: createDependencyDto.workflowId,
                dependencyId: createDependencyDto.dependencyId,
                dependencyType: createDependencyDto.dependencyType,
                dependencyName: createDependencyDto.dependencyName,
                status: DependencyStatus.ACTIVE,
                config: createDependencyDto.config || {},
                metadata: createDependencyDto.metadata || {},
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: userId
            };
            const savedDependency = await this.saveDependency(dependency);
            // Update workflow dependency cache
            await this.updateWorkflowDependencyCache(createDependencyDto.workflowId);
            // Record metrics
            this.metricsService.recordQuery('addWorkflowDependency', Date.now() - startTime);
            this.metricsService.recordUserAction(userId, 'ADD_WORKFLOW_DEPENDENCY');
            // Log audit event
            await this.auditService.logEvent({
                action: 'ADD_WORKFLOW_DEPENDENCY',
                userId,
                metadata: {
                    workflowId: createDependencyDto.workflowId,
                    dependencyId: createDependencyDto.dependencyId,
                    dependencyType: createDependencyDto.dependencyType,
                    dependencyName: createDependencyDto.dependencyName
                }
            });
            this.logger.log(`Added dependency ${createDependencyDto.dependencyName} to workflow ${createDependencyDto.workflowId});

      return savedDependency;

    } catch (error) {`, this.logger.error(Error, adding, workflow, dependency, `, error);
      this.metricsService.recordError('addWorkflowDependency', error);
      throw error;
    }
  }

  async removeDependency(
    workflowId: string,
    dependencyId: string,
    userId: string
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Validate workflow access
      await this.getWorkflowWithAccess(workflowId, userId);

      // Get dependency
      const dependency = await this.getDependency(workflowId, dependencyId);
      if (!dependency) {
        throw new NotFoundException('Dependency not found');
      }

      // Check if dependency is in use
      const isInUse = await this.isDependencyInUse(workflowId, dependencyId);
      if (isInUse) {
        throw new BadRequestException('Cannot remove dependency that is currently in use');
      }

      // Remove dependency
      await this.deleteDependency(workflowId, dependencyId);

      // Update workflow dependency cache
      await this.updateWorkflowDependencyCache(workflowId);

      // Record metrics
      this.metricsService.recordQuery('removeWorkflowDependency', Date.now() - startTime);
      this.metricsService.recordUserAction(userId, 'REMOVE_WORKFLOW_DEPENDENCY');

      // Log audit event
      await this.auditService.logEvent({
        action: 'REMOVE_WORKFLOW_DEPENDENCY',
        userId,
        metadata: {
          workflowId,
          dependencyId,
          dependencyType: dependency.dependencyType,
          dependencyName: dependency.dependencyName
        }
      });

      this.logger.log(Removed dependency ${dependency.dependencyName}`, from, workflow, $, { workflowId }));
        }
        catch (error) {
            this.logger.error(Error, removing, workflow, dependency, error);
            this.metricsService.recordError('removeWorkflowDependency', error);
            throw error;
        }
    }
    async getDependencies(workflowId, userId) {
        try {
            // Validate workflow access
            await this.getWorkflowWithAccess(workflowId, userId);
            return await this.getWorkflowDependencies(workflowId);
        }
        catch (error) {
            `
      this.logger.error(`;
            Error;
            getting;
            workflow;
            dependencies: , error;
            ;
            throw error;
        }
    }
    async getDependencyGraph(workflowId, userId) {
        const startTime = Date.now();
        try {
            // Validate workflow access
            await this.getWorkflowWithAccess(workflowId, userId);
            // Get all dependencies for this workflow and its dependencies
            const allDependencies = await this.getAllDependenciesRecursive(workflowId);
            // Build graph
            const graph = await this.buildDependencyGraph(workflowId, allDependencies);
            // Detect cycles
            graph.cycles = this.detectCycles(graph);
            // Record metrics
            this.metricsService.recordQuery('getDependencyGraph', Date.now() - startTime);
            return graph;
        }
        catch (error) {
            this.logger.error(Error, getting, dependency, graph, `, error);
      this.metricsService.recordError('getDependencyGraph', error);
      throw error;
    }
  }

  async validateDependencies(workflowId: string, userId: string): Promise<{
    valid: boolean;
    issues: Array<{
      dependencyId: string;
      dependencyName: string;
      issue: string;
      severity: 'error' | 'warning';
    }>;
  }> {
    const startTime = Date.now();

    try {
      // Validate workflow access
      await this.getWorkflowWithAccess(workflowId, userId);

      const dependencies = await this.getWorkflowDependencies(workflowId);
      const issues = [];

      for (const dependency of dependencies) {
        try {
          await this.validateSingleDependency(dependency);
        } catch (error) {
          issues.push({
            dependencyId: dependency.dependencyId,
            dependencyName: dependency.dependencyName,
            issue: error instanceof Error ? error.message : 'Unknown error',
            severity: 'error' as const
          });
        }
      }

      // Record metrics
      this.metricsService.recordQuery('validateDependencies', Date.now() - startTime);

      return {
        valid: issues.length === 0,
        issues
      };

    } catch (error) {
      this.logger.error(Error validating dependencies:, error);
      this.metricsService.recordError('validateDependencies', error);
      throw error;
    }
  }

  async updateDependencyStatus(
    workflowId: string,
    dependencyId: string,
    status: DependencyStatus,
    userId: string
  ): Promise<WorkflowDependency> {
    try {
      // Validate workflow access
      await this.getWorkflowWithAccess(workflowId, userId);

      const dependency = await this.getDependency(workflowId, dependencyId);
      if (!dependency) {
        throw new NotFoundException('Dependency not found');
      }

      // Update status
      dependency.status = status;
      dependency.updatedAt = new Date();

      const updatedDependency = await this.saveDependency(dependency);

      // Update workflow dependency cache
      await this.updateWorkflowDependencyCache(workflowId);

      // Log audit event
      await this.auditService.logEvent({
        action: 'UPDATE_DEPENDENCY_STATUS',
        userId,
        metadata: {
          workflowId,
          dependencyId,
          dependencyName: dependency.dependencyName,
          oldStatus: dependency.status,
          newStatus: status
        }
      });

      this.logger.log(Updated dependency ${dependency.dependencyName} status to ${status});

      return updatedDependency;` `
    } catch (error) {`, this.logger.error(Error, updating, dependency, status, error));
            throw error;
        }
    }
    async wouldCreateCircularDependency(workflowId, dependencyId) {
        // Simple cycle detection - in real implementation would use graph algorithms
        if (dependencyId === workflowId) {
            return true;
        }
        // Check if dependencyId depends on workflowId (directly or indirectly)
        const dependencyDependencies = await this.getWorkflowDependencies(dependencyId);
        for (const dep of dependencyDependencies) {
            if (dep.dependencyId === workflowId) {
                return true;
            }
            // Recursive check
            if (await this.wouldCreateCircularDependency(workflowId, dep.dependencyId)) {
                return true;
            }
        }
        return false;
    }
    async validateDependency(createDependencyDto) {
        switch (createDependencyDto.dependencyType) {
            case DependencyType.WORKFLOW:
                // Validate workflow exists and user has access
                await this.getWorkflowWithAccess(createDependencyDto.dependencyId, 'system');
                break;
            case DependencyType.API:
                // Validate API endpoint is accessible
                await this.validateApiDependency(createDependencyDto);
                break;
            case DependencyType.DATA:
                // Validate data source exists
                await this.validateDataDependency(createDependencyDto);
                break;
            case DependencyType.SERVICE:
                // Validate service is available
                await this.validateServiceDependency(createDependencyDto);
                break;
            case DependencyType.RESOURCE:
                // Validate resource exists
                await this.validateResourceDependency(createDependencyDto);
                break;
        }
    }
    async validateSingleDependency(dependency) {
        switch (dependency.dependencyType) {
            case DependencyType.WORKFLOW:
                // Check if workflow exists and is active
                const workflow = await this.getWorkflowWithAccess(dependency.dependencyId, 'system');
                if (workflow.status !== 'active') {
                    throw new Error(Workflow, $, { dependency, : .dependencyName }, is, not, active `);
        }
        break;
      
      case DependencyType.API:
        // Check API availability
        await this.checkApiAvailability(dependency);
        break;
      
      // Add other validation types as needed
    }
  }

  private async getAllDependenciesRecursive(workflowId: string, visited = new Set<string>()): Promise<WorkflowDependency[]> {
    if (visited.has(workflowId)) {
      return [];
    }

    visited.add(workflowId);
    const dependencies = await this.getWorkflowDependencies(workflowId);
    let allDependencies = [...dependencies];

    for (const dep of dependencies) {
      if (dep.dependencyType === DependencyType.WORKFLOW) {
        const childDependencies = await this.getAllDependenciesRecursive(dep.dependencyId, visited);
        allDependencies = allDependencies.concat(childDependencies);
      }
    }

    return allDependencies;
  }

  private async buildDependencyGraph(
    workflowId: string,
    dependencies: WorkflowDependency[]
  ): Promise<DependencyGraph> {
    const nodes = new Set<string>();
    const edges = [];

    // Add main workflow node
    nodes.add(workflowId);

    // Add dependency nodes and edges
    for (const dep of dependencies) {
      nodes.add(dep.dependencyId);
      edges.push({
        from: workflowId,
        to: dep.dependencyId,
        type: dep.dependencyType,
        status: dep.status
      });
    }

    return {
      nodes: Array.from(nodes).map(id => ({
        id,
        name: id, // In real implementation, would fetch actual names
        type: id === workflowId ? 'workflow' : 'dependency',
        status: dependencies.find(d => d.dependencyId === id)?.status || DependencyStatus.ACTIVE
      })),
      edges,
      cycles: []
    };
  }

  private detectCycles(graph: DependencyGraph): string[][] {
    // Simple cycle detection using DFS
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const dfs = (node: string): boolean => {
      if (recursionStack.has(node)) {
        // Found a cycle
        const cycleStart = path.indexOf(node);
        if (cycleStart !== -1) {
          cycles.push([...path.slice(cycleStart), node]);
        }
        return true;
      }

      if (visited.has(node)) {
        return false;
      }

      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      for (const edge of graph.edges) {
        if (edge.from === node) {
          if (dfs(edge.to)) {
            return true;
          }
        }
      }

      recursionStack.delete(node);
      path.pop();
      return false;
    };

    for (const node of graph.nodes.map(n => n.id)) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }

    return cycles;
  }

  // Mock implementation methods - in real code these would use the database
  private async getWorkflowWithAccess(workflowId: string, userId: string): Promise<any> {
    return {
      id: workflowId,
      name: 'Mock Workflow',
      userId,
      status: 'active'
    };
  }

  private async getDependency(workflowId: string, dependencyId: string): Promise<WorkflowDependency | null> {
    return null; // Mock implementation
  }

  private async saveDependency(dependency: WorkflowDependency): Promise<WorkflowDependency> {
    return dependency; // Mock implementation
  }

  private async deleteDependency(workflowId: string, dependencyId: string): Promise<void> {
    // Mock implementation
  }

  private async getWorkflowDependencies(workflowId: string): Promise<WorkflowDependency[]> {
    return []; // Mock implementation
  }

  private async updateWorkflowDependencyCache(workflowId: string): Promise<void> {
    // Mock implementation
  }

  private async isDependencyInUse(workflowId: string, dependencyId: string): Promise<boolean> {
    return false; // Mock implementation
  }

  private async validateApiDependency(dto: CreateDependencyDto): Promise<void> {
    // Mock implementation
  }

  private async validateDataDependency(dto: CreateDependencyDto): Promise<void> {
    // Mock implementation
  }

  private async validateServiceDependency(dto: CreateDependencyDto): Promise<void> {
    // Mock implementation
  }

  private async validateResourceDependency(dto: CreateDependencyDto): Promise<void> {
    // Mock implementation
  }

  private async checkApiAvailability(dependency: WorkflowDependency): Promise<void> {
    // Mock implementation
  }
});
                }
        }
    }
};
WorkflowDependencyService = WorkflowDependencyService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object, typeof (_b = typeof AuditService !== "undefined" && AuditService) === "function" ? _b : Object, typeof (_c = typeof MetricsService !== "undefined" && MetricsService) === "function" ? _c : Object])
], WorkflowDependencyService);
export { WorkflowDependencyService };
//# sourceMappingURL=workflow-dependency.service.js.map