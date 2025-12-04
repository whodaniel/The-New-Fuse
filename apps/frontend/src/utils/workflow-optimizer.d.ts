import { Node, Edge } from 'reactflow';
/**
 * Options for workflow optimization
 */
export interface WorkflowOptimizationOptions {
    /**
     * Direction of the layout
     * @default 'LR' (left to right)
     */
    direction?: 'TB' | 'BT' | 'LR' | 'RL';
    /**
     * Node width
     * @default 200
     */
    nodeWidth?: number;
    /**
     * Node height
     * @default 100
     */
    nodeHeight?: number;
    /**
     * Spacing between nodes
     * @default 50
     */
    nodeSpacing?: number;
    /**
     * Spacing between ranks (levels)
     * @default 200
     */
    rankSpacing?: number;
    /**
     * Whether to align nodes with the same rank
     * @default true
     */
    alignRanks?: boolean;
    /**
     * Whether to optimize edge crossings
     * @default true
     */
    optimizeEdgeCrossings?: boolean;
    /**
     * Whether to optimize node positions
     * @default true
     */
    optimizeNodePositions?: boolean;
}
/**
 * Optimizes the layout of a workflow
 * @param nodes The nodes to optimize
 * @param edges The edges to optimize
 * @param options Options for optimization
 * @returns The optimized nodes and edges
 */
export declare function optimizeWorkflowLayout(nodes: Node[], edges: Edge[], options?: WorkflowOptimizationOptions): {
    nodes: Node[];
    edges: Edge[];
};
/**
 * Optimizes a workflow by removing unused nodes and edges
 * @param nodes The nodes to optimize
 * @param edges The edges to optimize
 * @returns The optimized nodes and edges
 */
export declare function optimizeWorkflowNodes(nodes: Node[], edges: Edge[]): {
    nodes: Node[];
    edges: Edge[];
};
/**
 * Optimizes a workflow by removing duplicate edges
 * @param nodes The nodes to optimize
 * @param edges The edges to optimize
 * @returns The optimized nodes and edges
 */
export declare function optimizeWorkflowEdges(nodes: Node[], edges: Edge[]): {
    nodes: Node[];
    edges: Edge[];
};
/**
 * Optimizes a workflow by applying all optimizations
 * @param nodes The nodes to optimize
 * @param edges The edges to optimize
 * @param options Options for optimization
 * @returns The optimized nodes and edges
 */
export declare function optimizeWorkflow(nodes: Node[], edges: Edge[], options?: WorkflowOptimizationOptions): {
    nodes: Node[];
    edges: Edge[];
};
