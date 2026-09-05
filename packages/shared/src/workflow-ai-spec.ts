/**
 * Shared AI → visual workflow builder contract.
 * Used by DurableTask design-agent and WorkflowAIAssistantPanel.
 * Node `type` keys MUST match packages/workflow-builder nodeTypes storage contract.
 */

export const BUILDER_NODE_TYPE_KEYS = [
  'input',
  'agent',
  'mcpTool',
  'prompt',
  'condition',
  'transform',
  'loop',
  'subworkflow',
  'output',
  'notification',
  'a2a',
] as const;

export type BuilderNodeTypeKey = (typeof BUILDER_NODE_TYPE_KEYS)[number];

export interface AiWorkflowSpecNode {
  id: string;
  type: BuilderNodeTypeKey | string;
  label: string;
  position?: { x: number; y: number };
  data?: Record<string, unknown>;
}

export interface AiWorkflowSpecEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

/** Same shape WorkflowAIAssistantPanel already applies to the canvas. */
export interface AiWorkflowSpec {
  name?: string;
  description?: string;
  nodes: AiWorkflowSpecNode[];
  edges: AiWorkflowSpecEdge[];
}

/** Persisted graph shape matching WorkflowApiPort / definition jsonb. */
export interface PersistedWorkflowGraphDoc {
  id: string;
  name: string;
  description?: string;
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: Record<string, unknown>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    data?: Record<string, unknown>;
  }>;
  version?: number | string;
  status?: string;
  tags?: string[];
  source?: string;
  updatedAt: string;
  createdAt: string;
}

const KIND_TO_TYPE: Record<string, BuilderNodeTypeKey> = {
  service: 'agent',
  agent: 'agent',
  datastore: 'mcpTool',
  database: 'mcpTool',
  mcp: 'mcpTool',
  tool: 'mcpTool',
  input: 'input',
  start: 'input',
  output: 'output',
  end: 'output',
  condition: 'condition',
  transform: 'transform',
  prompt: 'prompt',
  notification: 'notification',
  loop: 'loop',
  subworkflow: 'subworkflow',
  a2a: 'a2a',
};

export function normalizeBuilderNodeType(raw: string | undefined): BuilderNodeTypeKey {
  if (!raw) return 'agent';
  if ((BUILDER_NODE_TYPE_KEYS as readonly string[]).includes(raw)) {
    return raw as BuilderNodeTypeKey;
  }
  return KIND_TO_TYPE[raw.toLowerCase()] || 'agent';
}

export interface DesignToolCallLike {
  tool: string;
  args: Record<string, unknown>;
}

/**
 * Map Ghost-style tool calls (or raw nodes/edges) into a builder AiWorkflowSpec.
 */
export function designToolCallsToWorkflowSpec(input: {
  prompt?: string;
  projectId?: string;
  roomId?: string;
  toolCalls?: DesignToolCallLike[];
  nodes?: Array<Record<string, unknown>>;
  edges?: Array<Record<string, unknown>>;
  name?: string;
  description?: string;
}): AiWorkflowSpec {
  const nodes: AiWorkflowSpecNode[] = [];
  const edges: AiWorkflowSpecEdge[] = [];
  const seen = new Set<string>();

  const pushNode = (
    id: string,
    type: string,
    label: string,
    position?: { x: number; y: number },
    data?: Record<string, unknown>
  ) => {
    if (seen.has(id)) return;
    seen.add(id);
    const t = normalizeBuilderNodeType(type);
    nodes.push({
      id,
      type: t,
      label,
      position: position || { x: 120 + nodes.length * 220, y: 120 + (nodes.length % 3) * 140 },
      data: { label, type: t, ...(data || {}) },
    });
  };

  // Always start with an input node for executable workflows
  pushNode('input-start', 'input', 'Start', { x: 80, y: 200 });

  for (const call of input.toolCalls || []) {
    const args = call.args || {};
    if (call.tool === 'addNode' || call.tool === 'updateNode') {
      const id = String(args.id || `node-${nodes.length}`);
      const kind = String(args.kind || args.type || 'agent');
      const label = String(args.label || args.name || id);
      pushNode(
        id,
        kind,
        label,
        {
          x: Number(args.x) || 120 + nodes.length * 220,
          y: Number(args.y) || 120,
        },
        args as Record<string, unknown>
      );
    }
    if (call.tool === 'addEdge') {
      const id = String(args.id || `edge-${edges.length}`);
      const source = String(args.source || '');
      const target = String(args.target || '');
      if (source && target) {
        edges.push({
          id,
          source,
          target,
          label: args.label ? String(args.label) : undefined,
        });
      }
    }
    if (call.tool === 'deleteNode') {
      const id = String(args.id || '');
      const idx = nodes.findIndex((n) => n.id === id);
      if (idx >= 0) nodes.splice(idx, 1);
      for (let i = edges.length - 1; i >= 0; i -= 1) {
        if (edges[i].source === id || edges[i].target === id) edges.splice(i, 1);
      }
      seen.delete(id);
    }
    if (call.tool === 'moveNode' || call.tool === 'resizeNode') {
      const id = String(args.id || '');
      const node = nodes.find((n) => n.id === id);
      if (node && args.x != null && args.y != null) {
        node.position = { x: Number(args.x), y: Number(args.y) };
      }
    }
  }

  for (const n of input.nodes || []) {
    const id = String(n.id || `node-${nodes.length}`);
    pushNode(
      id,
      String(n.kind || n.type || 'agent'),
      String(n.label || n.name || id),
      n.position as { x: number; y: number } | undefined,
      n
    );
  }

  for (const e of input.edges || []) {
    const source = String(e.source || '');
    const target = String(e.target || '');
    if (!source || !target) continue;
    edges.push({
      id: String(e.id || `edge-${source}-${target}`),
      source,
      target,
      label: e.label ? String(e.label) : undefined,
    });
  }

  // Ensure linear path from start → first designed node if no edge from start
  const designed = nodes.filter((n) => n.id !== 'input-start');
  if (designed.length > 0 && !edges.some((e) => e.source === 'input-start')) {
    edges.unshift({
      id: 'edge-start-first',
      source: 'input-start',
      target: designed[0].id,
      label: 'begin',
    });
  }

  // Terminal output
  if (!nodes.some((n) => n.type === 'output')) {
    pushNode('output-end', 'output', 'End', {
      x: 80 + Math.max(nodes.length, 1) * 220,
      y: 200,
    });
  }
  const lastDesigned = designed[designed.length - 1];
  const output = nodes.find((n) => n.type === 'output');
  if (lastDesigned && output && !edges.some((e) => e.target === output.id)) {
    edges.push({
      id: 'edge-last-output',
      source: lastDesigned.id,
      target: output.id,
      label: 'finish',
    });
  }

  const prompt = (input.prompt || '').trim();
  return {
    name: input.name || (prompt ? `AI: ${prompt.slice(0, 48)}` : 'AI Workflow'),
    description:
      input.description ||
      `Generated from DurableTask design-agent${input.projectId ? ` (project ${input.projectId})` : ''}${input.roomId ? ` room=${input.roomId}` : ''}`,
    nodes,
    edges,
  };
}

export function workflowSpecToPersistedGraph(
  spec: AiWorkflowSpec,
  id?: string
): PersistedWorkflowGraphDoc {
  const now = new Date().toISOString();
  const graphId =
    id ||
    `wf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    id: graphId,
    name: spec.name || 'AI Workflow',
    description: spec.description,
    nodes: (spec.nodes || []).map((n, i) => ({
      id: n.id,
      type: normalizeBuilderNodeType(n.type),
      position: n.position || { x: 120 + i * 220, y: 120 + (i % 3) * 140 },
      data: {
        label: n.label,
        type: normalizeBuilderNodeType(n.type),
        ...(n.data || {}),
      },
    })),
    edges: (spec.edges || []).map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      data: { label: e.label || '' },
    })),
    version: 1,
    status: 'draft',
    tags: ['ai-designed', 'durable-task'],
    source: 'durable-design-agent',
    createdAt: now,
    updatedAt: now,
  };
}
