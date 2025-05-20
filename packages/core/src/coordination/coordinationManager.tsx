import { Logger } from 'winston';
import { getLogger } from '../logging/loggingConfig.js';
import { Lock } from 'async-lock';

const logger: Logger = getLogger('coordination_manager');

export enum TaskPriority {
    LOW = 1,
    NORMAL = 2,
    HIGH = 3,
    URGENT = 4
}

export enum TaskState {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    FAILED = 'failed',
    BLOCKED = 'blocked'
}

export interface TaskInfo {
    taskId: string;
    priority: TaskPriority;
    assignedAgent: string | null;
    state: TaskState;
    dependencies: Set<string>;
    startTime: Date | null;
    completionTime: Date | null;
    metadata: Record<string, unknown>;
}

export interface TaskHistoryEntry {
    timestamp: string;
    state: string;
    agent: string;
}

export class AgentInfo {
    public currentTasks: Set<string>;
    public completedTasks: Set<string>;
    public lastHeartbeat: Date;
    public loadFactor: number;
    public capabilities: Set<string>;
    public status: string;

    constructor(public readonly agentId: string) {
        this.currentTasks = new Set();
        this.completedTasks = new Set();
        this.lastHeartbeat = new Date();
        this.loadFactor = 0.0;
        this.capabilities = new Set();
        this.status = 'available';
    }
}

export class CoordinationManager {
    private tasks: Map<string, TaskInfo>;
    private agents: Map<string, AgentInfo>;
    private taskLocks: Map<string, Lock>;
    private readonly heartbeatInterval: number;
    private readonly maxAgentLoad: number;
    private taskHistory: Map<string, TaskHistoryEntry[]>;

    constructor() {
        this.tasks = new Map();
        this.agents = new Map();
        this.taskLocks = new Map();
        this.heartbeatInterval = 30000; // 30 seconds
        this.maxAgentLoad = 5; // Default max tasks per agent
        this.taskHistory = new Map();
    }

    /**
     * Register a new agent with the coordination manager
     * @param agentId Unique identifier for the agent
     * @param capabilities Optional set of capabilities the agent has
     * @returns Promise resolving to true if registration was successful
     */
    public async registerAgent(agentId: string, capabilities?: Set<string>): Promise<boolean> {
        try {
            if (!this.agents.has(agentId)) {
                const agent = new AgentInfo(agentId);
                
                if (capabilities) {
                    agent.capabilities = capabilities;
                }
                
                this.agents.set(agentId, agent);
                logger.info(`Registered agent ${agentId} with capabilities: ${Array.from(capabilities || [])}`);
                return true;
            }
            
            return false;
        } catch (e) {
            logger.error(`Error registering agent: ${e instanceof Error ? e.message : String(e)}`);
            throw e;
        }
    }

    /**
     * Register a new task with the coordination manager
     * @param taskId Unique identifier for the task
     * @param agentId Agent to assign the task to
     * @param priority Task priority
     * @param dependencies Optional set of task dependencies
     * @param metadata Optional task metadata
     * @returns Promise resolving to true if registration was successful
     */
    public async registerTask(
        taskId: string, 
        agentId: string,
        priority: TaskPriority = TaskPriority.NORMAL,
        dependencies?: Set<string>,
        metadata?: Record<string, unknown>
    ): Promise<boolean> {
        try {
            if (!this.taskLocks.has(taskId)) {
                this.taskLocks.set(taskId, new Lock());
            }
            
            const lock = this.taskLocks.get(taskId)!;
            
            return await new Promise<boolean>((resolve) => {
                lock.acquire(taskId, async () => {
                    if (this.tasks.has(taskId)) {
                        resolve(false);
                        return;
                    }
                    
                    const agent = this.agents.get(agentId);
                    
                    if (!agent) {
                        logger.error(`Unknown agent ${agentId}`);
                        resolve(false);
                        return;
                    }
                    
                    if (agent.currentTasks.size >= this.maxAgentLoad) {
                        logger.warn(`Agent ${agentId} is at maximum load`);
                        resolve(false);
                        return;
                    }
                    
                    // Check dependencies
                    if (dependencies) {
                        for (const dep of dependencies) {
                            const depTask = this.tasks.get(dep);
                            if (!depTask || depTask.state !== TaskState.COMPLETED) {
                                logger.warn(`Task ${taskId} has unsatisfied dependency: ${dep}`);
                                resolve(false);
                                return;
                            }
                        }
                    }
                    
                    // Create task info
                    const taskInfo: TaskInfo = {
                        taskId,
                        priority,
                        assignedAgent: agentId,
                        state: TaskState.PENDING,
                        dependencies: dependencies || new Set(),
                        startTime: null,
                        completionTime: null,
                        metadata: metadata || {}
                    };
                    
                    this.tasks.set(taskId, taskInfo);
                    
                    // Update agent info
                    agent.currentTasks.add(taskId);
                    agent.loadFactor = agent.currentTasks.size / this.maxAgentLoad;
                    
                    // Initialize task history
                    this.taskHistory.set(taskId, [{
                        timestamp: new Date().toISOString(),
                        state: TaskState.PENDING,
                        agent: agentId
                    }]);
                    
                    logger.info(`Task registered: ${taskId} assigned to ${agentId}`);
                    resolve(true);
                });
            });
        } catch (e) {
            logger.error(`Error registering task: ${e instanceof Error ? e.message : String(e)}`);
            throw e;
        }
    }

    /**
     * Start a task
     * @param taskId Unique identifier for the task
     * @param agentId Agent starting the task
     * @returns Promise resolving to true if the task was started successfully
     */
    public async startTask(taskId: string, agentId: string): Promise<boolean> {
        try {
            if (!this.taskLocks.has(taskId)) {
                return false;
            }
            
            const lock = this.taskLocks.get(taskId)!;
            
            return await new Promise<boolean>((resolve) => {
                lock.acquire(taskId, async () => {
                    const task = this.tasks.get(taskId);
                    
                    if (!task) {
                        resolve(false);
                        return;
                    }
                    
                    if (task.assignedAgent !== agentId) {
                        resolve(false);
                        return;
                    }
                    
                    if (task.state !== TaskState.PENDING) {
                        resolve(false);
                        return;
                    }
                    
                    task.state = TaskState.IN_PROGRESS;
                    task.startTime = new Date();
                    
                    this.updateTaskHistory(taskId, TaskState.IN_PROGRESS, agentId);
                    
                    logger.info(`Task started: ${taskId} by agent ${agentId}`);
                    resolve(true);
                });
            });
        } catch (e) {
            logger.error(`Error starting task: ${e instanceof Error ? e.message : String(e)}`);
            throw e;
        }
    }

    /**
     * Complete a task
     * @param taskId Unique identifier for the task
     * @param agentId Agent completing the task
     * @param success Whether the task completed successfully
     * @returns Promise resolving to true if the task was marked as completed
     */
    public async completeTask(taskId: string, agentId: string, success: boolean = true): Promise<boolean> {
        try {
            if (!this.taskLocks.has(taskId)) {
                return false;
            }
            
            const lock = this.taskLocks.get(taskId)!;
            
            return await new Promise<boolean>((resolve) => {
                lock.acquire(taskId, async () => {
                    const task = this.tasks.get(taskId);
                    
                    if (!task) {
                        resolve(false);
                        return;
                    }
                    
                    if (task.assignedAgent !== agentId) {
                        resolve(false);
                        return;
                    }
                    
                    if (task.state !== TaskState.IN_PROGRESS) {
                        resolve(false);
                        return;
                    }
                    
                    task.state = success ? TaskState.COMPLETED : TaskState.FAILED;
                    task.completionTime = new Date();
                    
                    // Update agent info
                    const agent = this.agents.get(agentId);
                    if (agent) {
                        agent.currentTasks.delete(taskId);
                        if (success) {
                            agent.completedTasks.add(taskId);
                        }
                        agent.loadFactor = agent.currentTasks.size / this.maxAgentLoad;
                    }
                    
                    this.updateTaskHistory(
                        taskId, 
                        success ? TaskState.COMPLETED : TaskState.FAILED, 
                        agentId
                    );
                    
                    // Check if any blocked tasks can now proceed
                    this.checkBlockedTasks();
                    
                    logger.info(`Task completed: ${taskId} by agent ${agentId} with ${success ? 'success' : 'failure'}`);
                    resolve(true);
                });
            });
        } catch (e) {
            logger.error(`Error completing task: ${e instanceof Error ? e.message : String(e)}`);
            throw e;
        }
    }

    /**
     * Update task history with new state
     * @param taskId Unique identifier for the task
     * @param state New task state
     * @param agentId Agent that caused the state change
     */
    private updateTaskHistory(taskId: string, state: TaskState, agentId: string): void {
        const history = this.taskHistory.get(taskId);
        
        if (history) {
            history.push({
                timestamp: new Date().toISOString(),
                state,
                agent: agentId
            });
        }
    }

    /**
     * Check if any blocked tasks can now proceed
     */
    private async checkBlockedTasks(): Promise<void> {
        try {
            for (const [taskId, task] of this.tasks.entries()) {
                if (task.state === TaskState.BLOCKED) {
                    let dependenciesMet = true;
                    
                    for (const dep of task.dependencies) {
                        const depTask = this.tasks.get(dep);
                        if (!depTask || depTask.state !== TaskState.COMPLETED) {
                            dependenciesMet = false;
                            break;
                        }
                    }
                    
                    if (dependenciesMet) {
                        task.state = TaskState.PENDING;
                        this.updateTaskHistory(taskId, TaskState.PENDING, task.assignedAgent!);
                    }
                }
            }
        } catch (e) {
            logger.error(`Error checking blocked tasks: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    /**
     * Update agent heartbeat
     * @param agentId Agent ID to update heartbeat for
     */
    public async updateHeartbeat(agentId: string): Promise<void> {
        try {
            const agent = this.agents.get(agentId);
            
            if (agent) {
                agent.lastHeartbeat = new Date();
            }
        } catch (e) {
            logger.error(`Error updating heartbeat: ${e instanceof Error ? e.message : String(e)}`);
            throw e;
        }
    }
}
