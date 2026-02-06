import { A2ANode } from './a2a-node';
import { AgentNode } from './agent-node';
import { BaseNode } from './base-node';
import { ConditionNode } from './condition-node';
import { InputNode } from './input-node';
import { LoopNode } from './loop-node';
import { MCPToolNode } from './mcp-tool-node';
import { NotificationNode } from './notification-node';
import { OutputNode } from './output-node';
import { PromptNode } from './prompt-node';
import { SubworkflowNode } from './subworkflow-node';
import { TransformNode } from './transform-node';

// Export node types for ReactFlow
export const nodeTypes = {
  agent: AgentNode,
  mcpTool: MCPToolNode,
  input: InputNode,
  output: OutputNode,
  condition: ConditionNode,
  transform: TransformNode,
  notification: NotificationNode,
  a2a: A2ANode,
  loop: LoopNode,
  subworkflow: SubworkflowNode,
  prompt: PromptNode,
  default: BaseNode,
};
