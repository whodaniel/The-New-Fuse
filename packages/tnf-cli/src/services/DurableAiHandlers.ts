/**
 * Ghost AI parody handlers — design + spec generation for DurableTask.
 *
 * Design output is builder-native: AiWorkflowSpec using workflow-builder node
 * type keys, then WorkflowGraphBridge persists into ~/.tnf/workflow-graphs/
 * (same {nodes,edges} shape as POST /workflows).
 *
 * Authority: TRIGGER_DEV_YOUTUBE_IMPL + packages/shared/src/workflow-ai-spec.ts
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  designToolCallsToWorkflowSpec,
  type AiWorkflowSpec,
  type DesignToolCallLike,
} from '@the-new-fuse/shared';

export type DesignToolName =
  | 'addNode'
  | 'moveNode'
  | 'resizeNode'
  | 'updateNode'
  | 'deleteNode'
  | 'addEdge'
  | 'deleteEdge'
  | 'setStatus';

export interface DesignToolCall {
  tool: DesignToolName;
  args: Record<string, unknown>;
}

export interface CollabEvent {
  feed: 'ai-status' | 'ai-chat' | 'canvas' | 'workflow-builder';
  type: string;
  at: string;
  payload: Record<string, unknown>;
}

export interface DesignAgentOutput {
  kind: 'design-agent';
  prompt: string;
  roomId?: string;
  projectId?: string;
  status: 'complete';
  toolCalls: DesignToolCall[];
  /** Builder-ready spec (WorkflowAIAssistantPanel / nodeTypes contract). */
  workflowSpec: AiWorkflowSpec;
  collabEvents: CollabEvent[];
  summary: string;
  artifactPath?: string;
  appliedWorkflow?: {
    id: string;
    name: string;
    builderPath: string;
    nodeCount: number;
    edgeCount: number;
  };
}

export interface SpecAgentOutput {
  kind: 'generate-spec';
  projectId?: string;
  roomId?: string;
  markdown: string;
  artifactPath: string;
  collabEvents: CollabEvent[];
  summary: string;
  workflowSpec?: AiWorkflowSpec;
}

function nowIso(): string {
  return new Date().toISOString();
}

function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'item'
  );
}

/**
 * Deterministic tool-calling design agent → builder node catalog.
 */
export function runDesignAgent(input: {
  prompt: string;
  roomId?: string;
  projectId?: string;
  nodes?: Array<Record<string, unknown>>;
  edges?: Array<Record<string, unknown>>;
  artifactsDir: string;
}): DesignAgentOutput {
  const prompt = String(input.prompt || '').trim() || 'Untitled system';
  const base = slug(prompt);
  const existing = Array.isArray(input.nodes) ? input.nodes : [];
  const startY = existing.length * 120 + 40;

  const toolCalls: DesignToolCall[] = [
    {
      tool: 'setStatus',
      args: { status: 'thinking', message: 'Analyzing architecture for workflow builder' },
    },
    {
      tool: 'addNode',
      args: {
        id: `agent-${base}`,
        label: prompt.slice(0, 64),
        kind: 'agent',
        x: 300,
        y: startY,
      },
    },
    {
      tool: 'addNode',
      args: {
        id: `tool-${base}`,
        label: `${prompt.slice(0, 40)} tools`,
        kind: 'mcpTool',
        x: 540,
        y: startY,
      },
    },
    {
      tool: 'addNode',
      args: {
        id: `xform-${base}`,
        label: 'Normalize output',
        kind: 'transform',
        x: 780,
        y: startY,
      },
    },
    {
      tool: 'addEdge',
      args: {
        id: `e1-${base}`,
        source: `agent-${base}`,
        target: `tool-${base}`,
        label: 'invoke',
      },
    },
    {
      tool: 'addEdge',
      args: {
        id: `e2-${base}`,
        source: `tool-${base}`,
        target: `xform-${base}`,
        label: 'result',
      },
    },
    {
      tool: 'setStatus',
      args: { status: 'complete', message: 'Workflow graph ready for builder' },
    },
  ];

  const workflowSpec = designToolCallsToWorkflowSpec({
    prompt,
    projectId: input.projectId,
    roomId: input.roomId,
    toolCalls: toolCalls as DesignToolCallLike[],
    nodes: input.nodes,
    edges: input.edges,
  });

  const at = nowIso();
  const collabEvents: CollabEvent[] = [
    { feed: 'ai-status', type: 'start', at, payload: { roomId: input.roomId, prompt } },
    { feed: 'ai-status', type: 'thinking', at, payload: { roomId: input.roomId } },
    {
      feed: 'workflow-builder',
      type: 'spec-ready',
      at,
      payload: {
        name: workflowSpec.name,
        nodeCount: workflowSpec.nodes.length,
        edgeCount: workflowSpec.edges.length,
      },
    },
    {
      feed: 'ai-chat',
      type: 'assistant',
      at,
      payload: {
        message: `Designed workflow “${workflowSpec.name}” with ${workflowSpec.nodes.length} builder nodes. Apply to /workflows/builder.`,
      },
    },
    {
      feed: 'ai-status',
      type: 'complete',
      at,
      payload: { roomId: input.roomId, toolCount: toolCalls.length },
    },
  ];

  fs.mkdirSync(input.artifactsDir, { recursive: true });
  const artifactPath = path.join(
    input.artifactsDir,
    `design-${Date.now()}-${crypto.randomBytes(3).toString('hex')}.json`
  );
  const output: DesignAgentOutput = {
    kind: 'design-agent',
    prompt,
    roomId: input.roomId,
    projectId: input.projectId,
    status: 'complete',
    toolCalls,
    workflowSpec,
    collabEvents,
    summary: `Design agent produced builder graph (${workflowSpec.nodes.length} nodes) for “${prompt}”`,
    artifactPath,
  };
  fs.writeFileSync(artifactPath, JSON.stringify(output, null, 2));
  return output;
}

export function runGenerateSpec(input: {
  projectId?: string;
  roomId?: string;
  chatHistory?: Array<{ role: string; content: string }>;
  nodes?: Array<Record<string, unknown>>;
  edges?: Array<Record<string, unknown>>;
  title?: string;
  artifactsDir: string;
  /** Optional: also attach a builder workflowSpec from canvas context */
  includeWorkflowSpec?: boolean;
}): SpecAgentOutput {
  const title = input.title || `Technical Spec — ${input.projectId || 'project'}`;
  const nodes = input.nodes || [];
  const edges = input.edges || [];
  const chat = input.chatHistory || [];

  const nodeLines =
    nodes.length === 0
      ? '- _(no nodes provided — scaffold from conversation)_'
      : nodes
          .map((n, i) => {
            const id = String(n.id ?? `n${i}`);
            const label = String(n.label ?? n.name ?? id);
            const kind = String(n.kind ?? n.type ?? 'component');
            return `- **${label}** (\`${id}\`, ${kind})`;
          })
          .join('\n');

  const edgeLines =
    edges.length === 0
      ? '- _(no edges)_'
      : edges
          .map((e, i) => {
            const id = String(e.id ?? `e${i}`);
            return `- \`${e.source ?? '?'}\` → \`${e.target ?? '?'}\` (${id}${e.label ? `: ${e.label}` : ''})`;
          })
          .join('\n');

  const chatLines =
    chat.length === 0
      ? '_No chat history._'
      : chat
          .slice(-20)
          .map((m) => `**${m.role}:** ${m.content}`)
          .join('\n\n');

  const markdown = `# ${title}

> Generated by TNF DurableTask \`generate-spec\` (Ghost AI parody).  
> projectId: \`${input.projectId || 'n/a'}\` · roomId: \`${input.roomId || 'n/a'}\` · ${nowIso()}

## 1. Overview

Senior-architect style tech spec derived from the collaborative canvas and recent conversation.
Open the graph in \`/workflows/builder\` after DurableTask apply.

## 2. Components

${nodeLines}

## 3. Data / control flows

${edgeLines}

## 4. Conversation signals

${chatLines}

## 5. Implementation plan

1. Thin authenticated enqueue → DurableTask \`design-agent\` / \`generate-spec\`.
2. Apply \`workflowSpec\` via WorkflowGraphBridge into builder-compatible persistence.
3. Open \`/workflows/builder?id=<workflowId>\` to edit on the drag-and-drop surface.
4. Save/publish through existing WorkflowApiPort (POST/PATCH /workflows).

## 6. Non-goals

- Do not invent a second canvas store.
- Do not replace fleet orchestration with this path.
`;

  fs.mkdirSync(input.artifactsDir, { recursive: true });
  const artifactPath = path.join(
    input.artifactsDir,
    `spec-${Date.now()}-${crypto.randomBytes(3).toString('hex')}.md`
  );
  fs.writeFileSync(artifactPath, markdown, 'utf8');

  const workflowSpec =
    input.includeWorkflowSpec !== false
      ? designToolCallsToWorkflowSpec({
          prompt: title,
          projectId: input.projectId,
          roomId: input.roomId,
          nodes,
          edges,
        })
      : undefined;

  const at = nowIso();
  return {
    kind: 'generate-spec',
    projectId: input.projectId,
    roomId: input.roomId,
    markdown,
    artifactPath,
    workflowSpec,
    collabEvents: [
      { feed: 'ai-status', type: 'start', at, payload: { task: 'generate-spec' } },
      {
        feed: 'ai-chat',
        type: 'assistant',
        at,
        payload: { message: `Spec written (${markdown.split('\n').length} lines).` },
      },
      { feed: 'ai-status', type: 'complete', at, payload: { artifactPath } },
    ],
    summary: `Spec saved to ${artifactPath}`,
  };
}

export const GHOST_AI_TASK_IDS = ['design-agent', 'generate-spec'] as const;
