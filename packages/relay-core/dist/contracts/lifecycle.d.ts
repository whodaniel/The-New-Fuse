export type TnfAgentLifecycleStatus = 'active' | 'idle' | 'busy' | 'stalled' | 'offline' | 'inactive' | 'error';
export type TnfWorkflowDefinitionStatus = 'draft' | 'published' | 'paused' | 'archived';
export type TnfWorkflowExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
export type TnfRelayConnectionStatus = 'active' | 'idle' | 'offline';
export declare function normalizeAgentLifecycleStatus(input: string | null | undefined): TnfAgentLifecycleStatus;
export declare function normalizeWorkflowDefinitionStatus(input: string | null | undefined): TnfWorkflowDefinitionStatus;
export declare function normalizeWorkflowExecutionStatus(input: string | null | undefined): TnfWorkflowExecutionStatus;
export declare function normalizeRelayConnectionStatus(input: string | null | undefined): TnfRelayConnectionStatus;
export declare function toWorkflowDefinitionStatusTarget(input: string | null | undefined, target: 'normalized' | 'api' | 'engine'): string;
export declare function toWorkflowExecutionStatusTarget(input: string | null | undefined, target: 'normalized' | 'api' | 'engine'): string;
//# sourceMappingURL=lifecycle.d.ts.map