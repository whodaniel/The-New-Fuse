import { NodeTypes } from 'reactflow';
import AINewsAgentNode from './AINewsAgentNode.js';
import { defaultNewsAgentData } from './types.js';

/**
 * Register node in the node types registry
 */
export const registerAINewsAgentNode = (nodeTypes: NodeTypes): NodeTypes => {
  return {
    ...nodeTypes,
    aiNewsAgent: AINewsAgentNode
  };
};

/**
 * Factory function to create a new AI News Agent node
 */
export const createAINewsAgentNode = (x: number, y: number) => {
  return {
    id: `ai-news-agent-${crypto.randomUUID().slice(0, 8)}`,
    type: 'aiNewsAgent',
    position: { x, y },
    data: { ...defaultNewsAgentData }
  };
};

// Export components and types for direct usage
export { default as AINewsAgentNode } from './AINewsAgentNode.js';
export * from './types.js';