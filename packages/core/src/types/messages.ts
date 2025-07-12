export interface BaseMessage {
    id: string;
    type: string;
    timestamp: number;
    source: string;
    target?: string;
}

export interface TaskMessage extends BaseMessage {
    type: 'TASK';
    payload: {
        taskId: string;
        action: string;
        data: unknown;
    };
}

export interface StateMessage extends BaseMessage {
    type: 'STATE';
    payload: {
        stateId: string;
        action: 'UPDATE' | 'DELETE';
        data: unknown;
    };
}