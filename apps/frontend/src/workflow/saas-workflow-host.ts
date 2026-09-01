/**
 * SaaS implementation of the shared builder's host contract.
 *
 * This is the whole of the frontend's coupling to @the-new-fuse/workflow-builder:
 * the package declares the ports it needs, and this file is the one place that
 * knows they are satisfied by REST clients and React Query hooks. Nothing inside
 * the package imports `@/hooks` or `@/services` any more.
 *
 * The port names deliberately match the singletons, so most of this is a
 * pass-through rather than a translation layer that could drift on its own.
 */

import type {
  AgentsWorkflowState,
  McpToolsState,
  WorkflowApiPort,
  WorkflowDatabasePort,
  WorkflowExecutionPort,
  WorkflowHost,
} from '@the-new-fuse/workflow-builder';
import { WorkflowApiService } from '../api/workflow';
import { useAgentsWorkflow } from '../hooks/useAgentsWorkflow';
import { useMcpTools } from '../hooks/useMcpTools';
import { workflowDatabaseService } from '../services/WorkflowDatabaseService';

const workflowApiService = new WorkflowApiService();

const workflowDatabase: WorkflowDatabasePort = {
  getWorkflows: () => workflowDatabaseService.getWorkflows(),
  getWorkflow: (id) => workflowDatabaseService.getWorkflow(id),
};

/**
 * Pre-existing gap, surfaced rather than papered over.
 *
 * subworkflow-node calls `executeWorkflow` and `getExecutionHistory`, but the
 * SaaS `workflowExecutionService` is a WebSocket subscription client and has
 * never implemented either — it exposes subscribeToExecution, getExecutionStatus,
 * pause/resume/cancel and cleanup, and nothing else. The node therefore threw a
 * TypeError on "Run sub-workflow" before this extraction too; the `@ts-nocheck`
 * on the old debugger and the untyped `@/services` import are what kept it
 * invisible.
 *
 * Wiring these to the REST client would probably work, but it would be an
 * unverified behavior change smuggled into a refactor. Failing loudly with the
 * missing method named is the honest intermediate state, and it is strictly
 * more informative than the TypeError it replaces.
 */
const notImplemented = (method: string): never => {
  throw new Error(
    `[workflow-builder] The SaaS host does not implement workflowExecution.${method}(). ` +
      `WorkflowExecutionService exposes subscribeToExecution, getExecutionStatus, ` +
      `pauseExecution, resumeExecution, cancelExecution and cleanup only. ` +
      `This path was already broken before the builder was extracted.`
  );
};

const workflowExecution: WorkflowExecutionPort = {
  executeWorkflow: () => notImplemented('executeWorkflow'),
  getExecutionHistory: () => notImplemented('getExecutionHistory'),
};

const workflowApi: WorkflowApiPort = {
  saveWorkflow: (workflow) => workflowApiService.saveWorkflow(workflow as never),
  getWorkflow: (id) => workflowApiService.getWorkflow(id) as never,
};

/**
 * The host object handed to <WorkflowHostProvider>.
 *
 * Hooks are referenced, not called: the provider calls them during render, so
 * they must stay hooks all the way down to keep the rules of hooks intact.
 */
export const saasWorkflowHost: WorkflowHost = {
  useAgentsWorkflow: () => useAgentsWorkflow() as unknown as AgentsWorkflowState,
  useMcpTools: () => useMcpTools() as unknown as McpToolsState,
  workflowDatabase,
  workflowExecution,
  workflowApi,
};
