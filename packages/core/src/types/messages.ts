export interface BaseMessage {
    id: string;
    type: string;
    timestamp: number;
    source: string;
    target?: string;
}

export interface TaskMessage {
    type: 'TASK';
    payload: unknown;
  // Implementation needed
}
        taskId: string;
        action: string;
        data: unknown;
    };
}

export interface StateMessage {
    type: 'STATE';
    payload: unknown;
  // Implementation needed
}
        stateId: string;
        action: 'UPDATE' | 'DELETE';
        data: unknown;
    };
}