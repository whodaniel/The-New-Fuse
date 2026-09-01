/**
 * Host contract for the shared workflow builder.
 *
 * The node library was written inside apps/frontend and imported that app's
 * private hooks and services directly (`@/hooks/useAgentsWorkflow`,
 * `@/services/MCPService`, …). That coupling is the reason ~3,800 lines of
 * well-factored node components sat unused: no other surface could import them,
 * so every builder variant reimplemented crude inline nodes instead.
 *
 * Inverting it: the package declares what it *needs*, and each host — the SaaS
 * frontend, the Tauri desktop app, the browser-extension panel — supplies an
 * implementation. Hosts differ in how they reach agents and MCP servers (REST
 * through a gateway, Tauri IPC, extension messaging) but the node UI is
 * identical everywhere, which is the whole point.
 *
 * These shapes mirror what the nodes actually destructure today, so the SaaS
 * adapter is a pass-through of its existing hooks rather than a rewrite.
 */

/** An agent as the workflow surface needs it. Mirrors the SaaS WorkflowAgent. */
export interface WorkflowAgent {
  id: string;
  name: string;
  type: string;
  description?: string;
  category?: string;
  capabilities: string[];
  status: 'active' | 'inactive' | 'error';
  isPredefined: boolean;
  tools?: string[];
  color?: string;
}

export interface MCPParameterLike {
  type: string;
  description?: string;
  required?: boolean;
  [key: string]: unknown;
}

export interface MCPTool {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, MCPParameterLike>;
  returns: {
    type: string;
    description: string;
  };
}

export interface MCPServer {
  id: string;
  name: string;
  url: string;
  status: 'online' | 'offline' | 'error';
  tools: MCPTool[];
  metadata?: Record<string, unknown>;
}

/** What agent-node destructures from useAgentsWorkflow(). */
export interface AgentsWorkflowState {
  agents: WorkflowAgent[];
  agentsByCategory: Record<string, WorkflowAgent[]>;
  categoriesWithCounts: Array<{ category: string; count: number }>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loading: boolean;
}

/**
 * What mcp-tool-node and NodeProperties destructure from useMcpTools().
 *
 * `tools` is the flattened view across servers. Both shapes are listed because
 * both are consumed: mcp-tool-node groups by server, NodeProperties offers one
 * flat picker. The SaaS hook already returns both, so this stays a pass-through.
 */
export interface McpToolsState {
  servers: MCPServer[];
  tools: MCPTool[];
  loading: boolean;
  source: string;
  setSource: (source: string) => void;
  resetSource: () => void;
}

export interface StoredWorkflow {
  id: string;
  name: string;
  description?: string;
  [key: string]: unknown;
}

/**
 * Persistence used by subworkflow-node.
 *
 * Method names deliberately mirror the SaaS `workflowDatabaseService` so the
 * frontend adapter is a pass-through of the existing singleton rather than a
 * wrapper that has to be kept in sync — one more thing that could drift.
 */
export interface WorkflowDatabasePort {
  getWorkflows(): Promise<StoredWorkflow[]>;
  getWorkflow(id: string): Promise<StoredWorkflow | null>;
}

/** Execution used by subworkflow-node; mirrors `workflowExecutionService`. */
export interface WorkflowExecutionPort {
  executeWorkflow(workflow: StoredWorkflow, options?: Record<string, unknown>): Promise<string>;
  getExecutionHistory(): unknown[];
}

/**
 * The graph as it crosses the persistence boundary.
 *
 * Deliberately looser than ReactFlow's Node/Edge: a host may round-trip through
 * REST, Tauri IPC or extension storage, and none of them preserve the runtime
 * fields ReactFlow attaches. Only what the builder writes and reads back.
 */
export interface PersistedWorkflowGraph {
  id?: string;
  name: string;
  description?: string;
  nodes: Array<{
    id: string;
    type?: string;
    position?: { x: number; y: number };
    data?: Record<string, unknown>;
    [key: string]: unknown;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    data?: Record<string, unknown>;
    [key: string]: unknown;
  }>;
}

/**
 * Envelope returned by the SaaS `WorkflowApiService`. Mirrored exactly, error
 * union included, so the frontend adapter stays a pass-through — the union is
 * genuinely inhabited on both sides (the service returns a bare string for
 * transport failures and an object for API-level ones).
 */
export interface WorkflowApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string | { message?: string };
}

/**
 * Save/load used by WorkflowContext.
 *
 * WorkflowContext previously constructed `new WorkflowApiService()` inline on
 * every save and load, which is what pinned the whole context to the SaaS REST
 * client and kept it out of the desktop app.
 */
export interface WorkflowApiPort {
  saveWorkflow(
    workflow: PersistedWorkflowGraph
  ): Promise<WorkflowApiResponse<{ id: string }>>;
  getWorkflow(id: string): Promise<WorkflowApiResponse<PersistedWorkflowGraph>>;
}

/**
 * Everything a host must provide. Kept deliberately small: only what the
 * builder genuinely consumes, so adding a surface stays cheap.
 */
export interface WorkflowHost {
  useAgentsWorkflow(): AgentsWorkflowState;
  useMcpTools(): McpToolsState;
  workflowDatabase: WorkflowDatabasePort;
  workflowExecution: WorkflowExecutionPort;
  workflowApi: WorkflowApiPort;
}
