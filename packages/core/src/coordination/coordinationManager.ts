import winston from 'winston';

const logger: winston.Logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'coordination.log' })
  ]
});

export enum TaskState {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  BLOCKED = 'blocked',
  CANCELLED = 'cancelled'
}

export enum TaskPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  URGENT = 4
}

export interface Agent {
  id: string;
  name: string;
  capabilities: string[];
  status: 'available' | 'busy' | 'offline';
  loadFactor: number;
  lastHeartbeat: Date;
}

export interface Task {
  id: string;
  type: string;
  state: TaskState;
  priority: TaskPriority;
  assignedAgent?: string;
  payload: any;
  createdAt: Date;
  updatedAt: Date;
}

export class CoordinationManager {
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, Task> = new Map();
  private logger: winston.Logger;

  constructor() {
    this.logger = logger;
  }

  public registerAgent(agent: Omit<Agent, 'lastHeartbeat' | 'status' | 'loadFactor'>): void {
    const newAgent: Agent = {
      ...agent,
      status: 'available',
      loadFactor: 0.0,
      lastHeartbeat: new Date()
    };
    this.agents.set(agent.id, newAgent);
    this.logger.info(`Agent registered: ${agent.id}`);
  }

  public async updateHeartbeat(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    agent.lastHeartbeat = new Date();
    this.logger.debug(`Heartbeat updated for agent: ${agentId}`);
  }

  public assignTask(task: Omit<Task, 'id' | 'state' | 'createdAt' | 'updatedAt'>): string {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTask: Task = {
      ...task,
      id: taskId,
      state: TaskState.PENDING,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.tasks.set(taskId, newTask);
    this.logger.info(`Task created: ${taskId}`);
    return taskId;
  }

  public getTaskState(taskId: string): TaskState | undefined {
    const task = this.tasks.get(taskId);
    return task?.state;
  }

  public getAgentStatus(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  public getAvailableAgents(): Agent[] {
    return Array.from(this.agents.values())
      .filter(agent => agent.status === 'available')
      .sort((a, b) => a.loadFactor - b.loadFactor);
  }
}