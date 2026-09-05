/**
 * TNF Desktop Workflow Builder — same shared package as
 * https://app.thenewfuse.com/workflows/builder
 *
 * Host: tauriWorkflowHost. Graph load: ?source=local-ai&id=… →
 * /local-ai-workflows/{id}.json (canonical builder node types).
 *
 * Legacy custom ReactFlow page: WorkflowBuilder.legacy.tsx
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Bot,
  CheckCircle,
  Code,
  FileText,
  GitBranch,
  Layers,
  Network,
  Play,
  Repeat,
  Zap,
} from 'lucide-react';
import {
  NodeProperties,
  WorkflowCanvas,
  WorkflowHostProvider,
  WorkflowProvider,
  useWorkflow,
  type WorkflowEdge,
  type WorkflowNode,
} from '@the-new-fuse/workflow-builder';
import { ReactFlowProvider, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';
import PageShell from '../components/layout/PageShell';
import { safeStorage } from '../lib/safeStorage';
import { tauriWorkflowHost } from '../workflow/tauri-workflow-host';

const DRAFT_KEY = 'tnf.workflow.draft';

type ToolboxItem = {
  type: string;
  label: string;
  description: string;
  category: 'agent' | 'tool' | 'flow' | 'io';
  icon: React.ReactNode;
  color: string;
};

const TOOLBOX: ToolboxItem[] = [
  {
    type: 'agent',
    label: 'Agent',
    description: 'Execute tasks using an AI agent',
    category: 'agent',
    icon: <Bot className="h-4 w-4" />,
    color: 'bg-indigo-500/20 text-indigo-300',
  },
  {
    type: 'mcpTool',
    label: 'MCP Tool',
    description: 'Use an MCP tool or command',
    category: 'tool',
    icon: <Code className="h-4 w-4" />,
    color: 'bg-emerald-500/20 text-emerald-300',
  },
  {
    type: 'prompt',
    label: 'Prompt',
    description: 'Prompt template step',
    category: 'tool',
    icon: <FileText className="h-4 w-4" />,
    color: 'bg-violet-500/20 text-violet-300',
  },
  {
    type: 'condition',
    label: 'Condition',
    description: 'Branch on a condition',
    category: 'flow',
    icon: <GitBranch className="h-4 w-4" />,
    color: 'bg-amber-500/20 text-amber-300',
  },
  {
    type: 'transform',
    label: 'Transform',
    description: 'Transform data between nodes',
    category: 'flow',
    icon: <Zap className="h-4 w-4" />,
    color: 'bg-purple-500/20 text-purple-300',
  },
  {
    type: 'loop',
    label: 'Loop',
    description: 'Iterate until valid / over a collection',
    category: 'flow',
    icon: <Repeat className="h-4 w-4" />,
    color: 'bg-orange-500/20 text-orange-300',
  },
  {
    type: 'subworkflow',
    label: 'Subworkflow',
    description: 'Nested workflow',
    category: 'flow',
    icon: <Layers className="h-4 w-4" />,
    color: 'bg-teal-500/20 text-teal-300',
  },
  {
    type: 'input',
    label: 'Input',
    description: 'Workflow start',
    category: 'io',
    icon: <Play className="h-4 w-4" />,
    color: 'bg-sky-500/20 text-sky-300',
  },
  {
    type: 'output',
    label: 'Output',
    description: 'Workflow end',
    category: 'io',
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'bg-rose-500/20 text-rose-300',
  },
  {
    type: 'notification',
    label: 'Notification',
    description: 'Notify / emit event',
    category: 'io',
    icon: <Bell className="h-4 w-4" />,
    color: 'bg-cyan-500/20 text-cyan-300',
  },
  {
    type: 'a2a',
    label: 'A2A',
    description: 'Agent-to-agent hop',
    category: 'agent',
    icon: <Network className="h-4 w-4" />,
    color: 'bg-pink-500/20 text-pink-300',
  },
];

function readHashQuery(): URLSearchParams {
  const hash = window.location.hash || '';
  const q = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : window.location.search;
  return new URLSearchParams(q.startsWith('?') ? q.slice(1) : q);
}

function toCanvasNodes(raw: any[]): WorkflowNode[] {
  return (raw || []).map((node, index) => {
    const type =
      node.type ||
      node.data?.builderType ||
      node.data?.type ||
      (node.data?.controlType && node.data.controlType !== 'flowControl'
        ? node.data.controlType
        : 'agent');
    // Undo legacy remaps that collapsed semantic types into flowControl
    const resolved =
      type === 'flowControl'
        ? String(node.data?.builderType || node.data?.controlType || 'condition')
        : String(type);
    return {
      id: String(node.id || `node-${index}`),
      type: resolved,
      position: node.position || { x: 80 + index * 200, y: 120 },
      data: {
        label: node.data?.label || node.label || resolved,
        type: resolved,
        ...(node.data || {}),
      },
    };
  });
}

function toCanvasEdges(raw: any[]): WorkflowEdge[] {
  return (raw || []).map((edge, index) => ({
    id: String(edge.id || `edge-${index}`),
    source: String(edge.source),
    target: String(edge.target),
    data: edge.data || { label: edge.label || '' },
  }));
}

const NodeToolbox: React.FC = () => {
  const onDragStart = (event: React.DragEvent, item: ToolboxItem) => {
    event.dataTransfer.setData('application/reactflow/type', item.type);
    event.dataTransfer.setData(
      'application/reactflow/data',
      JSON.stringify({ label: item.label, type: item.type, status: 'idle' })
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  const sections: Array<{ title: string; category: ToolboxItem['category'] }> = [
    { title: 'Agents & Tools', category: 'agent' },
    { title: 'Tools', category: 'tool' },
    { title: 'Flow', category: 'flow' },
    { title: 'I/O', category: 'io' },
  ];

  return (
    <div className="space-y-4 p-3">
      {sections.map((section) => {
        const items = TOOLBOX.filter((n) =>
          section.category === 'agent'
            ? n.category === 'agent'
            : n.category === section.category
        );
        if (!items.length) return null;
        return (
          <div key={section.title}>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
              {section.title}
            </h4>
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, item)}
                  className="flex items-center gap-2 p-2 rounded-md border border-dashed border-white/15 cursor-grab hover:border-sky-400/50 hover:bg-slate-800/80"
                  title={item.description}
                >
                  <div className={`p-1.5 rounded ${item.color}`}>{item.icon}</div>
                  <div className="min-w-0">
                    <div className="text-sm text-white font-medium">{item.label}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-2">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const BuilderChrome: React.FC = () => {
  const { nodes, edges, actions } = useWorkflow();
  const { fitView } = useReactFlow();
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const apply = (graph: { name?: string; nodes?: any[]; edges?: any[] }, noticeText: string) => {
      if (cancelled) return;
      const nextNodes = toCanvasNodes(graph.nodes || []);
      const nextEdges = toCanvasEdges(graph.edges || []);
      if (!nextNodes.length) {
        setLoadError('Graph has no nodes');
        return;
      }
      if (graph.name) setWorkflowName(graph.name);
      actions.replaceGraph(nextNodes, nextEdges);
      setNotice(noticeText);
      setLoadError(null);
      requestAnimationFrame(() => fitView({ padding: 0.2 }));
      safeStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          name: graph.name || workflowName,
          nodes: nextNodes,
          edges: nextEdges,
          savedAt: new Date().toISOString(),
          source: 'shared-builder',
        })
      );
    };

    void (async () => {
      const params = readHashQuery();
      const source = params.get('source');
      const id = params.get('id');

      if (source === 'local-ai' && id) {
        try {
          const res = await fetch(`/local-ai-workflows/${encodeURIComponent(id)}.json`);
          if (!res.ok) {
            setLoadError(`local-ai workflow not found: ${id} (${res.status})`);
            return;
          }
          const doc = await res.json();
          apply(doc, `Loaded AI workflow ${id} (${doc.nodes?.length || 0} nodes) — shared builder`);
          return;
        } catch (err: any) {
          setLoadError(err?.message || String(err));
          return;
        }
      }

      // Optional: load remote API id when source is not local-ai
      if (id && source !== 'local-ai') {
        try {
          await actions.loadWorkflow(id);
          setNotice(`Loaded workflow ${id} from API`);
          requestAnimationFrame(() => fitView({ padding: 0.2 }));
          return;
        } catch {
          // fall through to draft
        }
      }

      try {
        const raw = safeStorage.getItem(DRAFT_KEY);
        if (!raw) return;
        const draft = JSON.parse(raw);
        // Ignore Start-only legacy drafts when we have an explicit local-ai intent
        if (draft?.nodes?.length) {
          apply(draft, 'Restored local draft into shared builder');
        }
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bootstrap once on mount
  }, []);

  const onSaveDraft = () => {
    safeStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        name: workflowName,
        nodes,
        edges,
        savedAt: new Date().toISOString(),
        source: 'shared-builder',
      })
    );
    setNotice(`Saved draft (${nodes.length} nodes / ${edges.length} edges)`);
  };

  const parityHref = useMemo(() => {
    const params = readHashQuery();
    const id = params.get('id');
    if (id && params.get('source') === 'local-ai') {
      return `https://app.thenewfuse.com/workflows/builder?id=${encodeURIComponent(id)}&source=local-ai`;
    }
    return 'https://app.thenewfuse.com/workflows/builder';
  }, []);

  return (
    <PageShell
      title="Workflow Builder"
      subtitle={`${workflowName} · shared package (SaaS parity)`}
    >
      <div className="flex flex-col h-[calc(100vh-7rem)] min-h-[520px] rounded-xl border border-white/10 overflow-hidden bg-slate-950">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-slate-900/80">
          <input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="bg-transparent text-sm font-semibold text-white border-none outline-none max-w-[280px]"
            aria-label="Workflow name"
          />
          <span className="text-[11px] text-slate-400">
            {nodes.length} nodes · {edges.length} edges
          </span>
          <div className="flex-1" />
          <a
            href={parityHref}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-sky-300 hover:text-sky-200 underline-offset-2 hover:underline"
          >
            Open SaaS builder
          </a>
          <button
            type="button"
            onClick={onSaveDraft}
            className="px-3 py-1.5 text-xs rounded-md bg-slate-800 border border-white/10 text-white hover:bg-slate-700"
          >
            Save draft
          </button>
        </div>

        {(notice || loadError) && (
          <div
            className={`px-3 py-1.5 text-xs border-b ${
              loadError
                ? 'bg-rose-950/50 border-rose-500/30 text-rose-200'
                : 'bg-emerald-950/40 border-emerald-500/20 text-emerald-100'
            }`}
          >
            {loadError || notice}
          </div>
        )}

        <div className="flex flex-1 min-h-0">
          <aside className="w-56 border-r border-white/10 overflow-y-auto bg-slate-900/60">
            <div className="px-3 pt-3 text-xs font-semibold text-white">Nodes</div>
            <NodeToolbox />
          </aside>
          <div className="flex-1 min-w-0">
            <WorkflowCanvas onNodeSelect={setSelectedNode} />
          </div>
          {selectedNode && (
            <aside className="w-72 border-l border-white/10 overflow-y-auto bg-slate-900/60 p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white">Properties</h3>
                <button
                  type="button"
                  className="text-xs text-slate-400 hover:text-white"
                  onClick={() => setSelectedNode(null)}
                >
                  Close
                </button>
              </div>
              <NodeProperties node={selectedNode} />
            </aside>
          )}
        </div>
      </div>
    </PageShell>
  );
};

const WorkflowBuilder: React.FC = () => (
  <WorkflowHostProvider host={tauriWorkflowHost}>
    <ReactFlowProvider>
      <WorkflowProvider>
        <BuilderChrome />
      </WorkflowProvider>
    </ReactFlowProvider>
  </WorkflowHostProvider>
);

export default WorkflowBuilder;
