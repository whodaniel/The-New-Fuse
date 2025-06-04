export interface AgentMessage {
    type: 'system' | 'acknowledgment' | 'task_request' | 'task_update';
    payload: Record<string, unknown>;
}
