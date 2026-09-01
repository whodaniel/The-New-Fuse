/**
 * @the-new-fuse/workflow-builder
 *
 * The canonical TNF workflow builder, shared by every surface.
 *
 * Why this package exists
 * -----------------------
 * The monorepo had at least seven workflow-builder implementations — several of
 * them unrouted orphans — while a complete, well-factored 12-node library sat in
 * apps/frontend/src/components/workflow/nodes with no importer but a README. It
 * was unusable elsewhere because it imported that app's private UI kit and
 * services directly, so the Tauri desktop app shipped five crude inline node
 * types instead and drifted away from the SaaS.
 *
 * Consolidating here means the desktop app does not *match* the SaaS builder —
 * it runs the same one. Surfaces supply their own data access through
 * WorkflowHostProvider; the node UI is identical everywhere.
 */

export { WorkflowHostProvider, useWorkflowHost } from './host/context.js';
export type { WorkflowHostProviderProps } from './host/context.js';
export * from './host/types.js';

// The node library: 12 node types over a shared BaseNode contract.
export * from './nodes/index.js';

// The ReactFlow type map every surface passes to <ReactFlow nodeTypes={...}>.
// Keys are persisted `node.type` values, so they are a storage contract.
export { nodeTypes } from './nodes/nodeTypes.js';
export type { WorkflowNodeTypeKey } from './nodes/nodeTypes.js';

// Canvas, graph state and the properties panel.
export { WorkflowCanvas } from './canvas/WorkflowCanvas.js';
export { WorkflowProvider, useWorkflow } from './context/WorkflowContext.js';
export type { NodeStatus, WorkflowNode, WorkflowEdge } from './context/WorkflowContext.js';
export { NodeProperties } from './panels/NodeProperties.js';

// Graph validation. Shared so a workflow that is valid in the SaaS is valid on
// the desktop — previously each surface validated differently, or not at all.
export {
  validateWorkflow,
  validateWorkflowWithErrors,
  validateWorkflowExecution,
  isWorkflowValid,
  getWorkflowValidationErrors,
} from './validation/workflow-schema-validator.js';
export type { ValidationResult } from './validation/workflow-schema-validator.js';

/**
 * Schema-derived shapes.
 *
 * `WorkflowNode`/`WorkflowEdge` are exported from the context as the *runtime*
 * ReactFlow-augmented types; the schema's stricter, persisted counterparts are
 * aliased rather than dropped, because both are genuinely used — the context
 * types describe what is on the canvas, these describe what is on the wire.
 */
export type {
  Workflow,
  WorkflowExecution,
  WorkflowNode as ValidatedWorkflowNode,
  WorkflowEdge as ValidatedWorkflowEdge,
} from './validation/workflow-schema-validator.js';
