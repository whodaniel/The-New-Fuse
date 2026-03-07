import { Node, Edge } from 'reactflow';
import dagre from 'dagre';

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
export function optimizeWorkflowLayout(
  nodes: Node[],
  edges: Edge[],
  options: WorkflowOptimizationOptions = {}
): { nodes: Node[], edges: Edge[] } {
  // Default options
  const {
    direction = 'LR',
    nodeWidth = 200,
    nodeHeight = 100,
    nodeSpacing = 50,
    rankSpacing = 200,
    alignRanks = true,
    optimizeEdgeCrossings = true,
    optimizeNodePositions = true
  } = options;
  
  // Create a new graph
  const g = new dagre.graphlib.Graph();
  
  // Set graph direction
  g.setGraph({
    rankdir: direction,
    nodesep: nodeSpacing,
    ranksep: rankSpacing,
    align: alignRanks ? 'UL' : undefined,
    acyclicer: optimizeEdgeCrossings ? 'greedy' : undefined,
    ranker: optimizeNodePositions ? 'network-simplex' : undefined
  });
  
  // Default to assigning a new object as a label for each edge
  g.setDefaultEdgeLabel(() => ({}));
  
  // Add nodes to the graph
  nodes.forEach(node => {
    g.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });
  
  // Add edges to the graph
  edges.forEach(edge => {
    g.setEdge(edge.source, edge.target);
  });
  
  // Layout the graph
  dagre.layout(g);
  
  // Get the optimized nodes with new positions
  const optimizedNodes = nodes.map(node => {
    const nodeWithPosition = g.node(node.id);
    
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2
      }
    };
  });
  
  return { nodes: optimizedNodes, edges };
}

/**
 * Optimizes a workflow by removing unused nodes and edges
 * @param nodes The nodes to optimize
 * @param edges The edges to optimize
 * @returns The optimized nodes and edges
 */
export function optimizeWorkflowNodes(
  nodes: Node[],
  edges: Edge[]
): { nodes: Node[], edges: Edge[] } {
  // Find nodes that are connected to other nodes
  const connectedNodeIds = new Set<string>();
  
  edges.forEach(edge => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });
  
  // Filter out nodes that are not connected to any other node
  const optimizedNodes = nodes.filter(node => connectedNodeIds.has(node.id));
  
  return { nodes: optimizedNodes, edges };
}

/**
 * Optimizes a workflow by removing duplicate edges
 * @param nodes The nodes to optimize
 * @param edges The edges to optimize
 * @returns The optimized nodes and edges
 */
export function optimizeWorkflowEdges(
  nodes: Node[],
  edges: Edge[]
): { nodes: Node[], edges: Edge[] } {
  // Find duplicate edges (same source and target)
  const edgeMap = new Map<string, Edge>();
  
  edges.forEach(edge => {
    const key = `${edge.source}-${edge.target}`;
    
    if (!edgeMap.has(key)) {
      edgeMap.set(key, edge);
    }
  });
  
  // Get unique edges
  const optimizedEdges = Array.from(edgeMap.values());
  
  return { nodes, edges: optimizedEdges };
}

/**
 * Optimizes a workflow by applying all optimizations
 * @param nodes The nodes to optimize
 * @param edges The edges to optimize
 * @param options Options for optimization
 * @returns The optimized nodes and edges
 */
export function optimizeWorkflow(
  nodes: Node[],
  edges: Edge[],
  options: WorkflowOptimizationOptions = {}
): { nodes: Node[], edges: Edge[] } {
  // Optimize nodes
  const { nodes: optimizedNodes, edges: optimizedEdges } = optimizeWorkflowNodes(nodes, edges);
  
  // Optimize edges
  const { edges: finalEdges } = optimizeWorkflowEdges(optimizedNodes, optimizedEdges);
  
  // Optimize layout
  return optimizeWorkflowLayout(optimizedNodes, finalEdges, options);
}
