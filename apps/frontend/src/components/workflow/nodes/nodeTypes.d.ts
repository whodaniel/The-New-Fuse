import { AgentNode } from './agent-node';
import { MCPToolNode } from './mcp-tool-node';
import { InputNode } from './input-node';
import { OutputNode } from './output-node';
import { ConditionNode } from './condition-node';
import { TransformNode } from './transform-node';
import { NotificationNode } from './notification-node';
import { A2ANode } from './a2a-node';
import { LoopNode } from './loop-node';
import { SubworkflowNode } from './subworkflow-node';
import { PromptNode } from './prompt-node';
import { BaseNode } from './base-node';

export declare const nodeTypes: {
  'agent': typeof AgentNode;
  'mcpTool': typeof MCPToolNode;
  'input': typeof InputNode;
  'output': typeof OutputNode;
  'condition': typeof ConditionNode;
  'transform': typeof TransformNode;
  'notification': typeof NotificationNode;
  'a2a': typeof A2ANode;
  'loop': typeof LoopNode;
  'subworkflow': typeof SubworkflowNode;
  'prompt': typeof PromptNode;
  'default': typeof BaseNode;
};
