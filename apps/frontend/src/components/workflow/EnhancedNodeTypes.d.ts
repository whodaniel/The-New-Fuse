/**
 * Enhanced Node Types for The New Fuse Workflow Builder
 * Includes: Agent Nodes, Conditional Logic, Parallel Execution, Human Approval
 */
import React from 'react';
interface BaseNodeProps {
    data: {
        label: string;
        description?: string;
        status?: 'idle' | 'running' | 'completed' | 'error' | 'waiting';
        progress?: number;
        [key: string]: any;
    };
    selected?: boolean;
}
export declare const AgentTaskNode: React.FC<BaseNodeProps>;
export declare const ConditionalNode: React.FC<BaseNodeProps>;
export declare const ParallelNode: React.FC<BaseNodeProps>;
export declare const HumanApprovalNode: React.FC<BaseNodeProps>;
export declare const MultiAgentNode: React.FC<BaseNodeProps>;
export declare const enhancedNodeTypes: {
    agentTask: React.FC<BaseNodeProps>;
    conditional: React.FC<BaseNodeProps>;
    parallel: React.FC<BaseNodeProps>;
    humanApproval: React.FC<BaseNodeProps>;
    multiAgent: React.FC<BaseNodeProps>;
};
export {};
