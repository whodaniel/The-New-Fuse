/**
 * The canvas, node library and properties panel now live in
 * @the-new-fuse/workflow-builder and are shared with the Tauri desktop app.
 *
 * This barrel is kept as a re-export so existing `@/components/workflow`
 * imports keep resolving; new code should import from the package directly.
 * Anything still listed below is genuinely frontend-only.
 */

export {
  NodeProperties,
  WorkflowCanvas,
  nodeTypes,
  // The 12-node library.
  A2ANode,
  AgentNode,
  BaseNode,
  ConditionNode,
  InputNode,
  LoopNode,
  MCPToolNode,
  NotificationNode,
  OutputNode,
  PromptNode,
  SubworkflowNode,
  TransformNode,
} from '@the-new-fuse/workflow-builder';

export { NodeToolbox } from './NodeToolbox';
export { WorkflowAnalytics } from './WorkflowAnalytics';
export { WorkflowExecutionContext } from './WorkflowExecutionContext';
