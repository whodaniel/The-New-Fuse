import { Node } from 'reactflow';
import { NodeExecutor, NodeContext } from '../types.js';
import { ReActAgentNodeData } from '../../nodes/agents/react.js';
export declare class ReActAgentNodeExecutor implements NodeExecutor {
    private tools;
    constructor();
    private registerDefaultTools;
    validate(node: Node<ReActAgentNodeData>): Promise<boolean>;
    execute(node: Node<ReActAgentNodeData>, context: NodeContext): Promise<{
        answer: unknown;
        thoughts: unknown[];
        actions: unknown[];
        observations: unknown[];
    }>;
    cleanup(): Promise<void>;
}
