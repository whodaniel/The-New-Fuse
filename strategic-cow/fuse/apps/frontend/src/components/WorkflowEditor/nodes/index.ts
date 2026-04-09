import { AIProcessingNode } from './AIProcessingNode';
import { httpRequestNode } from './HttpRequestNode';
import { slackNode } from './SlackNode';

export { AIProcessingNode } from './AIProcessingNode';
export { httpRequestNode } from './HttpRequestNode';
export { slackNode } from './SlackNode';

export const CUSTOM_NODE_TYPES = {
  aiProcessing: AIProcessingNode,
  httpRequest: httpRequestNode,
  slack: slackNode,
  // Mapping generic types to specific implementations
  api: httpRequestNode,
  llm: AIProcessingNode,
  tool: AIProcessingNode,
  // Mappings for NodeToolbox types
  agent: AIProcessingNode,
  mcpTool: AIProcessingNode,
  prompt: AIProcessingNode,
  condition: AIProcessingNode, // Fallback for visual test
  transform: AIProcessingNode,
  loop: AIProcessingNode,
  subworkflow: AIProcessingNode,
  input: AIProcessingNode,
  output: AIProcessingNode,
  notification: slackNode,
  a2a: AIProcessingNode,
};
