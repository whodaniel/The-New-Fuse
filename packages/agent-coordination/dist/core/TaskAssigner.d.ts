import { EventEmitter } from 'events';
import { Task, AgentInfo, TaskAssignment, CoordinationConfig } from './types.js';
/**
 * Task assignment and load balancing
 */
export declare class TaskAssigner extends EventEmitter {
    private assignments;
    private config;
    constructor(config?: CoordinationConfig);
    /**
     * Assign a task to the most suitable agent
     */
    assignTask(task: Task, availableAgents: AgentInfo[]): TaskAssignment | null;
    /**
     * Filter agents that can handle the task
     */
    private filterEligibleAgents;
    /**
     * Select the best agent based on load balancing strategy
     */
    private selectAgent;
    /**
     * Select agent with least current load
     */
    private selectLeastLoadedAgent;
    /**
     * Round-robin agent selection
     */
    private selectRoundRobinAgent;
    /**
     * Select agent based on capability match score
     */
    private selectCapabilityBasedAgent;
    /**
     * Get assignment for a task
     */
    getAssignment(taskId: string): TaskAssignment | undefined;
    /**
     * Remove an assignment
     */
    removeAssignment(taskId: string): boolean;
    /**
     * Get all assignments for an agent
     */
    getAgentAssignments(agentId: string): TaskAssignment[];
    /**
     * Check for expired assignments
     */
    cleanExpiredAssignments(): TaskAssignment[];
    /**
     * Get assignment statistics
     */
    getStatistics(): {
        totalAssignments: number;
        activeAssignments: number;
        assignmentsByAgent: Map<string, number>;
    };
    /**
     * Clear all assignments
     */
    clear(): void;
}
//# sourceMappingURL=TaskAssigner.d.ts.map