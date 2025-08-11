export interface BaseMessage {
  // Implementation needed
}
    id: string;
    type: string;
    timestamp: number;
    source: string;
    target?: string;
}

export interface TaskMessage extends BaseMessage {
  // Implementation needed
}
    type: 'TASK';
    payload: {
  // Implementation needed
}
        taskId: string;
        action: string;
        data: unknown;
    };
}

export interface StateMessage extends BaseMessage {
  // Implementation needed
}
    type: 'STATE';
    payload: {
  // Implementation needed
}
        stateId: string;
        action: 'UPDATE' | 'DELETE';
        data: unknown;
    };
}