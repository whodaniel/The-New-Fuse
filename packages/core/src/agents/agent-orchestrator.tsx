import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../logging.js';
import { Agent, AgentRole, Task, Memory, ExecutionResult, AgentCommunication } from './types.js';
import { SmartAPIGateway } from '../api-management/SmartAPIGateway.js';
import { PriorityManager } from '../priority/priority-manager.js';
import { ResourceManager } from '../resources/resource-manager.js';
import { ImplementationPhase } from '../types/phase.js';

export class AgentOrchestrator extends EventEmitter {
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, Task> = new Map();
  private teamMemory: Memory;
  private logger: Logger;
  private apiGateway: SmartAPIGateway;
  private isExecuting: boolean = false;
  private maxConcurrentTasks: number = 5;
  private activeTasks: Set<string> = new Set();
  private priorityManager: PriorityManager;
  private resourceManager: ResourceManager;
  private currentPhase?: ImplementationPhase;

  constructor(logger: Logger, apiGateway: SmartAPIGateway, teamMemory: Memory) {
    super();
    this.logger = logger;
    this.apiGateway = apiGateway;
    this.teamMemory = teamMemory;
    this.priorityManager = new PriorityManager();
    this.resourceManager = new ResourceManager();
  }

  /**
   * Register an agent with the orchestrator
   */
  registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
    this.logger.info(`Registered agent: ${agent.name} (${agent.id}), role: ${agent.role}`);
  }

  /**
   * Add a task to be executed by the team
   */
  addTask(task: Omit<Task, 'id' | 'status'>): string {
    const id = uuidv4();
    const fullTask: Task = {
      ...task,
      id,
      status: 'pending',
    };
    this.tasks.set(id, fullTask);
    this.logger.info(`Added task: ${task.name} (${id})`);
    this.emit('task:added', { taskId: id, task: fullTask });
    
    if (!this.isExecuting) {
      this.executeTasks();
    }
    
    return id;
  }

  /**
   * Start executing tasks
   */
  private async executeTasks(): Promise<void> {
    if (this.isExecuting) return;
    
    this.isExecuting = true;
    this.logger.info('Starting task execution');
    
    try {
      // Process tasks until none are pending
      while (this.hasPendingTasks() && this.activeTasks.size < this.maxConcurrentTasks) {
        const nextTask = this.getNextTask();
        if (!nextTask) break;
        
        this.activeTasks.add(nextTask.id);
        // Execute in the background
        this.executeTask(nextTask).finally(() => {
          this.activeTasks.delete(nextTask.id);
        });
        
        // If we've reached max concurrent tasks, wait for some to complete
        if (this.activeTasks.size >= this.maxConcurrentTasks) {
          await new Promise(resolve => this.once('task:completed', resolve));
        }
      }
    } finally {
      // If more tasks are pending but not being executed, restart execution
      if (this.hasPendingTasks() && this.activeTasks.size < this.maxConcurrentTasks) {
        this.executeTasks();
      } else {
        this.isExecuting = false;
        this.logger.info('Task execution cycle completed');
      }
    }
  }

  /**
   * Execute a specific task
   */
  private async executeTask(task: Task): Promise<void> {
    this.logger.info(`Executing task: ${task.name} (${task.id})`);
    
    try {
      // Update task status
      task.status = 'in_progress';
      this.tasks.set(task.id, task);
      this.emit('task:started', { taskId: task.id });
      
      // Find the most suitable agent for this task
      const agent = this.findAgentForTask(task);
      if (!agent) {
        throw new Error(`No suitable agent found for task: ${task.name}`);
      }
      
      // Execute the task with the selected agent
      const result = await agent.executeTask(task, this.teamMemory);
      
      // Update team memory with the result
      await this.teamMemory.store({
        id: uuidv4(),
        taskId: task.id,
        agentId: agent.id,
        timestamp: new Date().toISOString(),
        content: result.output,
        metadata: {
          success: result.success,
          executionTime: result.executionTime
        }
      });
      
      // Update task status
      task.status = result.success ? 'completed' : 'failed';
      task.result = result;
      this.tasks.set(task.id, task);
      
      this.logger.info(`Task ${task.id} ${task.status}: ${task.name}`);
      this.emit('task:completed', { 
        taskId: task.id, 
        success: result.success, 
        result 
      });
    } catch (error) {
      this.logger.error(`Error executing task ${task.id}:`, error);
      
      // Update task status
      task.status = 'failed';
      task.result = {
        success: false,
        output: error.message,
        executionTime: 0,
        error: error
      };
      this.tasks.set(task.id, task);
      
      this.emit('task:failed', { 
        taskId: task.id, 
        error 
      });
    }
  }

  /**
   * Find the most suitable agent for a given task
   */
  private findAgentForTask(task: Task): Agent | undefined {
    // If task specifies an agent, use that
    if (task.assignedAgentId && this.agents.has(task.assignedAgentId)) {
      return this.agents.get(task.assignedAgentId);
    }
    
    // Otherwise, find an agent with matching capabilities or role
    const agents = Array.from(this.agents.values());
    
    // First try to match by required capabilities
    if (task.requiredCapabilities && task.requiredCapabilities.length > 0) {
      const capableAgents = agents.filter(agent => 
        task.requiredCapabilities!.every(cap => 
          agent.capabilities.includes(cap)
        )
      );
      
      if (capableAgents.length > 0) {
        // Return the agent with the most matching capabilities
        return capableAgents.reduce((best, current) => {
          const bestMatch = best.capabilities.filter(cap => 
            task.requiredCapabilities!.includes(cap)
          ).length;
          
          const currentMatch = current.capabilities.filter(cap => 
            task.requiredCapabilities!.includes(cap)
          ).length;
          
          return currentMatch > bestMatch ? current : best;
        });
      }
    }
    
    // Then try to match by role
    if (task.preferredRole) {
      const roleAgents = agents.filter(agent => 
        agent.role === task.preferredRole
      );
      
      if (roleAgents.length > 0) {
        return roleAgents[0];
      }
    }
    
    // Finally, return any agent that isn't busy
    return agents.find(agent => !this.isAgentBusy(agent.id));
  }

  /**
   * Check if an agent is currently busy
   */
  private isAgentBusy(agentId: string): boolean {
    for (const taskId of this.activeTasks) {
      const task = this.tasks.get(taskId);
      if (task?.assignedAgentId === agentId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if there are pending tasks
   */
  private hasPendingTasks(): boolean {
    for (const task of this.tasks.values()) {
      if (task.status === 'pending') {
        return true;
      }
    }
    return false;
  }

  /**
   * Get the next task to execute based on priority
   */
  private getNextTask(): Task | undefined {
    let nextTask: Task | undefined;
    let highestPriority = -Infinity;
    
    for (const task of this.tasks.values()) {
      if (task.status === 'pending') {
        const priority = task.priority || 0;
        if (priority > highestPriority) {
          highestPriority = priority;
          nextTask = task;
        }
      }
    }
    
    return nextTask;
  }

  /**
   * Enable agent-to-agent communication
   */
  async facilitateCommunication(source: string, target: string, message: AgentCommunication): Promise<any> {
    const sourceAgent = this.agents.get(source);
    const targetAgent = this.agents.get(target);
    
    if (!sourceAgent || !targetAgent) {
      throw new Error(`Invalid agents for communication: ${source} -> ${target}`);
    }
    
    this.logger.debug(`Communication: ${sourceAgent.name} -> ${targetAgent.name}`, { message });
    
    // Store the communication in memory
    await this.teamMemory.store({
      id: uuidv4(),
      agentId: source,
      targetAgentId: target,
      timestamp: new Date().toISOString(),
      content: message.content,
      type: 'communication',
      metadata: message.metadata
    });
    
    // Deliver the message to the target agent
    return targetAgent.receiveMessage(message, sourceAgent);
  }

  private async updateTaskPriorities(): Promise<void> {
    for (const task of this.tasks.values()) {
      if (task.status === 'pending') {
        const dependencies = this.getDependencies(task);
        const resourceAvailability = await this.resourceManager.getAvailability(task);
        
        const priority = this.priorityManager.calculateTaskPriority(
          task,
          dependencies,
          this.currentPhase!,
          resourceAvailability
        );

        this.tasks.set(task.id, { ...task, priority });
      }
    }
  }

  private getDependencies(task: Task): Task[] {
    return (task.dependencies || [])
      .map(depId => this.tasks.get(depId))
      .filter((dep): dep is Task => dep !== undefined);
  }

  async getNextTask(): Promise<Task | undefined> {
    let nextTask: Task | undefined;
    let highestPriority = -Infinity;
    
    for (const task of this.tasks.values()) {
      if (task.status === 'pending') {
        const priority = task.priority || 0;
        if (priority > highestPriority) {
          highestPriority = priority;
          nextTask = task;
        }
      }
    }
    
    return nextTask;
  }

  async handleTaskCompletion(taskId: string, success: boolean): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    if (success) {
      this.tasks.set(taskId, { ...task, status: 'completed' });
    } else {
      const maxRetries = task.maxRetries || 3;
      if ((task.retryCount || 0) < maxRetries) {
        this.tasks.set(taskId, {
          ...task,
          status: 'pending',
          retryCount: (task.retryCount || 0) + 1
        });
      } else {
        this.tasks.set(taskId, { ...task, status: 'failed' });
      }
    }

    await this.updateTaskPriorities();
  }

  setPhase(phase: ImplementationPhase): void {
    this.currentPhase = phase;
  }
}
