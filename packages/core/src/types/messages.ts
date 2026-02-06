export interface BaseMessage {
  id: string;
  type: string;
  timestamp: number;
  source: string;
  target?: string;
}

export interface TaskMessage {
  type: 'TASK';
  payload: {
    taskId: string;
    action: string;
    data: unknown;
  };
}

export interface StateMessage {
  type: 'STATE';
  payload: {
    stateId: string;
    action: 'UPDATE' | 'DELETE';
    data: unknown;
  };
}
