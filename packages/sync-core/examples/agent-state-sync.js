/**
 * Agent State Synchronization Example
 *
 * Shows how to sync agent states across distributed systems
 * for real-time agent monitoring and coordination.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { SyncOrchestrator } from '../src/services/SyncOrchestrator';
let AgentCoordinationService = class AgentCoordinationService {
    syncOrchestrator;
    constructor(syncOrchestrator) {
        this.syncOrchestrator = syncOrchestrator;
    }
    /**
     * Update agent status with real-time sync
     */
    async updateAgentStatus(agentId, status, metadata) {
        const agentState = {
            id: agentId,
            name: `agent-${agentId}`,
            status,
            metadata,
            lastUpdate: new Date(),
        };
        // Sync agent state globally (all instances can see agent status)
        await this.syncOrchestrator.syncAgentState(agentId, agentState);
        console.log(`Agent ${agentId} status synced: ${status}`);
    }
    /**
     * Start task execution with progress tracking
     */
    async startAgentTask(agentId, taskId, tenantId) {
        // Mark agent as processing
        await this.updateAgentStatus(agentId, 'PROCESSING', {
            progress: 0,
            lastHeartbeat: new Date(),
            assignedTasks: [taskId],
        });
        // Update task status
        await this.syncOrchestrator.syncTenantData(tenantId, 'task', {
            id: taskId,
            status: 'RUNNING',
            assignedAgent: agentId,
            startedAt: new Date(),
        });
        console.log(`Agent ${agentId} started task ${taskId}`);
    }
    /**
     * Update task progress with real-time sync
     */
    async updateTaskProgress(agentId, taskId, progress, tenantId) {
        // Update agent state with progress
        await this.updateAgentStatus(agentId, 'PROCESSING', {
            progress,
            lastHeartbeat: new Date(),
        });
        // Sync task progress
        await this.syncOrchestrator.syncTenantData(tenantId, 'task', {
            id: taskId,
            progress,
            lastUpdate: new Date(),
        });
        console.log(`Task ${taskId} progress: ${progress}%`);
    }
    /**
     * Complete task and update agent state
     */
    async completeAgentTask(agentId, taskId, result, tenantId) {
        // Mark agent as idle
        await this.updateAgentStatus(agentId, 'IDLE', {
            progress: 100,
            lastHeartbeat: new Date(),
            assignedTasks: [],
        });
        // Sync task completion
        await this.syncOrchestrator.syncTenantData(tenantId, 'task', {
            id: taskId,
            status: 'COMPLETED',
            result,
            completedAt: new Date(),
        });
        console.log(`Agent ${agentId} completed task ${taskId}`);
    }
    /**
     * Handle agent errors
     */
    async handleAgentError(agentId, taskId, error, tenantId) {
        // Mark agent as error state
        await this.updateAgentStatus(agentId, 'ERROR', {
            lastHeartbeat: new Date(),
        });
        // Sync task failure
        await this.syncOrchestrator.syncTenantData(tenantId, 'task', {
            id: taskId,
            status: 'FAILED',
            error: {
                message: error.message,
                stack: error.stack,
            },
            failedAt: new Date(),
        });
        console.error(`Agent ${agentId} error on task ${taskId}:`, error);
    }
    /**
     * Get real-time agent metrics
     */
    getAgentMetrics() {
        const metrics = this.syncOrchestrator.getMetrics();
        return {
            totalSyncOperations: metrics.operations.sync,
            activeAgents: metrics.resources.activeTenants,
            avgSyncLatency: metrics.performance.avgSyncLatency,
            successRate: metrics.performance.successRate,
        };
    }
    /**
     * Monitor agent health with heartbeat
     */
    async monitorAgentHealth(agentId) {
        setInterval(async () => {
            const agentState = await this.getAgentState(agentId);
            if (!agentState) {
                console.warn(`Agent ${agentId} not found`);
                return;
            }
            const lastHeartbeat = agentState.metadata?.lastHeartbeat;
            const timeSinceHeartbeat = Date.now() - (lastHeartbeat?.getTime() || 0);
            // Mark agent offline if no heartbeat for 5 minutes
            if (timeSinceHeartbeat > 5 * 60 * 1000) {
                await this.updateAgentStatus(agentId, 'OFFLINE');
                console.warn(`Agent ${agentId} marked offline (no heartbeat)`);
            }
        }, 60000); // Check every minute
    }
    /**
     * Get current agent state from sync orchestrator
     */
    async getAgentState(agentId) {
        // Implementation depends on sync-core's state storage
        // This is a placeholder
        return null;
    }
};
AgentCoordinationService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [SyncOrchestrator])
], AgentCoordinationService);
export { AgentCoordinationService };
//# sourceMappingURL=agent-state-sync.js.map