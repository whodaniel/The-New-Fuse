export interface BaseState {
    id: string;
    version: number;
    timestamp: number;
    owner: string;
}

export interface TaskState extends BaseState {
    type: TASK;
    data: {
        status:PENDING' | RUNNING' | COMPLETED' | FAILED'
    type:AGENT'
        status: IDLE | BUSY' | ERROR'
    type:SYSTEM'