import { BaseNode } from './base-node';

// Export node types for ReactFlow
export const nodeTypes = {
  'agent': BaseNode,
  'mcp-tool': BaseNode,
  'input': BaseNode,
  'output': BaseNode,
  'condition': BaseNode,
  'transform': BaseNode,
  'notification': BaseNode,
  'a2a': BaseNode,
  'loop': BaseNode,
  'subworkflow': BaseNode,
  'default': BaseNode
};