/**
 * Tauri desktop implementation of the shared builder's host contract.
 *
 * The desktop app reaches agents and MCP servers over the same REST gateway the
 * SaaS uses, but through its own `apiService` and Zustand stores rather than the
 * frontend's hooks. That difference is the entire reason the builder needed a
 * host contract: the node UI is identical, the data access is not.
 *
 * Nothing here imports from apps/frontend — the two surfaces share the package,
 * not each other.
 */

import type {
  AgentsWorkflowState,
  McpToolsState,
  PersistedWorkflowGraph,
  StoredWorkflow,
  WorkflowAgent,
  WorkflowApiPort,
  WorkflowDatabasePort,
  WorkflowExecutionPort,
  WorkflowHost,
  MCPServer as WorkflowMCPServer,
} from '@the-new-fuse/workflow-builder';
import { useMemo, useState } from 'react';
import { apiService } from '../services/api';
import { useAgentStore } from '../stores/agentStore';
import type { MCPServer as DesktopMCPServer } from '../types';

/**
 * The desktop's MCPServer models an installed local package (installed,
 * enabled, version, author) — it has no live-endpoint concept, unlike the
 * shared contract's MCPServer (url, connection status). There is no lossless
 * mapping between the two; this preserves what identifies the server and
 * derives `status` from `enabled` rather than inventing a URL that doesn't
 * exist. Revisit if/when the desktop gateway exposes a real per-server
 * endpoint (Stage 2 migration work, see
 * docs/development/WORKFLOW_BUILDER_PACKAGE_BOUNDARY.md).
 */
function toWorkflowMCPServer(server: DesktopMCPServer): WorkflowMCPServer {
  return {
    id: server.id,
    name: server.name,
    url: '',
    status: server.enabled ? 'online' : 'offline',
    tools: server.tools.map(toWorkflowMCPTool),
    metadata: {
      description: server.description,
      version: server.version,
      category: server.category,
      author: server.author,
      installed: server.installed,
    },
  };
}

/**
 * The desktop's MCPTool carries a raw JSON-Schema `inputSchema`; the shared
 * contract wants per-parameter entries plus a `returns` shape neither side
 * has. Translate what the schema actually says (properties + required) into
 * MCPParameterLike rather than fabricate one; `returns` has no source data
 * on this surface, so it's left honestly unspecified rather than guessed.
 */
function toWorkflowMCPTool(tool: DesktopMCPServer['tools'][number]) {
  const schema = tool.inputSchema ?? {};
  const properties = (schema.properties as Record<string, Record<string, unknown>>) ?? {};
  const required = new Set<string>(Array.isArray(schema.required) ? schema.required : []);

  const parameters: Record<string, { type: string; description?: string; required?: boolean }> = {};
  for (const [paramName, paramSchema] of Object.entries(properties)) {
    parameters[paramName] = {
      type: typeof paramSchema.type === 'string' ? paramSchema.type : 'unknown',
      description:
        typeof paramSchema.description === 'string' ? paramSchema.description : undefined,
      required: required.has(paramName),
    };
  }

  return {
    id: tool.name,
    name: tool.name,
    description: tool.description,
    parameters,
    returns: { type: 'unknown', description: 'Not modeled by the desktop MCP registry.' },
  };
}

/**
 * The desktop `Agent` and the builder's `WorkflowAgent` agree on id/name/
 * capabilities and disagree on `status`: the store models an idle agent, the
 * builder only knows active/inactive/error. Idle and offline both mean "there,
 * but not running", which is `inactive`.
 */
const toWorkflowAgent = (agent: {
  id: string;
  name: string;
  type: string;
  description?: string;
  capabilities?: string[];
  status: string;
}): WorkflowAgent => ({
  id: agent.id,
  name: agent.name,
  type: agent.type,
  description: agent.description,
  category: agent.type,
  capabilities: agent.capabilities ?? [],
  status: agent.status === 'active' ? 'active' : agent.status === 'error' ? 'error' : 'inactive',
  isPredefined: false,
});

const useAgentsWorkflow = (): AgentsWorkflowState => {
  const agents = useAgentStore((state) => state.agents);
  const loading = useAgentStore((state) => state.loading);
  const [searchQuery, setSearchQuery] = useState('');

  return useMemo(() => {
    const mapped = agents.map(toWorkflowAgent);
    const query = searchQuery.trim().toLowerCase();
    const filtered = query
      ? mapped.filter(
          (agent) =>
            agent.name.toLowerCase().includes(query) ||
            (agent.description ?? '').toLowerCase().includes(query)
        )
      : mapped;

    const agentsByCategory = filtered.reduce<Record<string, WorkflowAgent[]>>((acc, agent) => {
      const key = agent.category ?? 'other';
      (acc[key] ??= []).push(agent);
      return acc;
    }, {});

    return {
      agents: filtered,
      agentsByCategory,
      categoriesWithCounts: Object.entries(agentsByCategory).map(([category, list]) => ({
        category,
        count: list.length,
      })),
      searchQuery,
      setSearchQuery,
      loading,
    };
  }, [agents, loading, searchQuery]);
};

/**
 * Desktop MCP tools come straight from the gateway's server list.
 *
 * `source` is fixed to 'gateway' because the desktop has exactly one transport;
 * the SaaS hook lets a user switch between configured sources, so the setter is
 * kept in the shape and is a no-op rather than being faked as switchable.
 */
const useMcpTools = (): McpToolsState => {
  const [servers, setServers] = useState<WorkflowMCPServer[]>([]);
  const [loading, setLoading] = useState(false);

  useMemo(() => {
    let cancelled = false;
    setLoading(true);
    apiService
      .getMCPServers()
      .then((response) => {
        if (cancelled) return;
        setServers(response.success && response.data ? response.data.map(toWorkflowMCPServer) : []);
      })
      .catch(() => {
        if (!cancelled) setServers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const tools = useMemo(() => servers.flatMap((server) => server.tools ?? []), [servers]);

  return {
    servers,
    tools,
    loading,
    source: 'gateway',
    setSource: () => undefined,
    resetSource: () => undefined,
  };
};

const workflowDatabase: WorkflowDatabasePort = {
  async getWorkflows() {
    const response = await apiService.getWorkflows();
    return response.success && response.data ? (response.data as unknown as StoredWorkflow[]) : [];
  },
  async getWorkflow(id) {
    const response = await apiService.getWorkflow(id);
    return response.success && response.data ? (response.data as unknown as StoredWorkflow) : null;
  },
};

const workflowExecution: WorkflowExecutionPort = {
  /**
   * The desktop gateway executes a *saved* workflow by id, so an unsaved graph
   * cannot be run. Saying so beats posting to `/undefined/execute`.
   */
  async executeWorkflow(workflow) {
    if (!workflow?.id) {
      throw new Error(
        '[workflow-builder] Save the workflow before running it: the desktop gateway ' +
          'executes by id and this graph has not been persisted yet.'
      );
    }
    const response = await apiService.executeWorkflow(workflow.id);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to execute workflow');
    }
    return response.data.executionId;
  },
  /**
   * The desktop gateway exposes no execution-history endpoint. Empty is the
   * truthful answer; it is not a cache that failed to load.
   */
  getExecutionHistory: () => [],
};

const workflowApi: WorkflowApiPort = {
  async saveWorkflow(workflow) {
    return apiService.saveWorkflowCanvas({
      id: workflow.id,
      name: workflow.name,
      nodes: workflow.nodes,
      edges: workflow.edges,
    });
  },
  async getWorkflow(id) {
    const response = await apiService.getWorkflow(id);
    return {
      success: response.success,
      data: response.data as unknown as PersistedWorkflowGraph | undefined,
      error: response.error,
    };
  },
};

export const tauriWorkflowHost: WorkflowHost = {
  useAgentsWorkflow,
  useMcpTools,
  workflowDatabase,
  workflowExecution,
  workflowApi,
};
