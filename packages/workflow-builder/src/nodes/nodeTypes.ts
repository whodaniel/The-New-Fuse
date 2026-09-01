import { A2ANode } from './a2a-node.js';
import { AgentNode } from './agent-node.js';
import { BaseNode } from './base-node.js';
import { ConditionNode } from './condition-node.js';
import { InputNode } from './input-node.js';
import { LoopNode } from './loop-node.js';
import { MCPToolNode } from './mcp-tool-node.js';
import { NotificationNode } from './notification-node.js';
import { OutputNode } from './output-node.js';
import { PromptNode } from './prompt-node.js';
import { SubworkflowNode } from './subworkflow-node.js';
import { TransformNode } from './transform-node.js';

/**
 * The canonical ReactFlow node-type map.
 *
 * Every surface passes *this* to <ReactFlow nodeTypes={...}>. The keys are the
 * persisted `node.type` values, so they are a storage contract: renaming one
 * silently breaks every saved workflow that referenced it.
 */
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
} as const;

export type WorkflowNodeTypeKey = keyof typeof nodeTypes;
