export interface BaseState {
  // Implementation needed
}
    id: string;
    version: number;
    timestamp: number;
    owner: string;
}

export interface TaskState extends BaseState {
  // Implementation needed
}
    type: 'TASK';
    data: {
  // Implementation needed
}
        status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
        progress: number;
        details?: string;
    };
}

export interface AgentState extends BaseState {
  // Implementation needed
}
    type: 'AGENT';
    data: {
  // Implementation needed
}
        status: 'IDLE' | 'BUSY' | 'ERROR';
        currentTask?: string;
        healthMetrics?: Record<string, unknown>;
    };
}

export interface SystemState extends BaseState {
  // Implementation needed
}
    type: 'SYSTEM';
    data: {
  // Implementation needed
}
        status: 'OPERATIONAL' | 'DEGRADED' | 'CRITICAL';
        activeAgents: number;
        pendingTasks: number;
        systemLoad: number;
    };
}