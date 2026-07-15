import { MessageSquare, Network, Users, Workflow } from 'lucide-react';
import React, { Suspense, lazy, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const ChatPage = lazy(() => import('./ChatPage'));
const MultiAgentChat = lazy(() => import('../../components/MultiAgentChat'));
const WorkspaceChatPage = lazy(() => import('../WorkspaceChat'));
const UnifiedCommunicationCanvas = lazy(() =>
  import('../../components/UnifiedChat/UnifiedCommunicationCanvas').then((m) => ({
    default: m.UnifiedCommunicationCanvas,
  }))
);

type ChatMode = 'agents' | 'multi' | 'workspace' | 'unified';

const MODES: Array<{
  id: ChatMode;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'agents',
    label: 'Agents',
    description: 'Orchestrated agent conversations',
    icon: MessageSquare,
  },
  {
    id: 'multi',
    label: 'Multi-Agent',
    description: 'Live swarm collaboration',
    icon: Users,
  },
  {
    id: 'workspace',
    label: 'Workspace',
    description: 'Thread-aware workspace chat',
    icon: Workflow,
  },
  {
    id: 'unified',
    label: 'Unified',
    description: 'A2A canvas with tools',
    icon: Network,
  },
];

const Loading = () => (
  <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-400">
    Loading chat…
  </div>
);

/**
 * Single Chat hub for TNF. Mode aliases resolve here via ?mode=.
 */
export default function ChatHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = useMemo<ChatMode>(() => {
    const raw = (searchParams.get('mode') || 'agents').toLowerCase();
    if (raw === 'multi' || raw === 'swarm') return 'multi';
    if (raw === 'workspace' || raw === 'threads') return 'workspace';
    if (raw === 'unified' || raw === 'a2a') return 'unified';
    return 'agents';
  }, [searchParams]);

  const setMode = (next: ChatMode) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'agents') {
      params.delete('mode');
    } else {
      params.set('mode', next);
    }
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="flex h-full min-h-[70vh] flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Chat</h1>
          <p className="mt-1 text-sm text-slate-400">
            One place for agent, multi-agent, and workspace conversations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {MODES.map((item) => {
            const Icon = item.icon;
            const active = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  active
                    ? 'border-blue-500/40 bg-blue-500/20 text-blue-200'
                    : 'border-white/10 bg-slate-900/60 text-slate-300 hover:bg-slate-800/80'
                }`}
                title={item.description}
                aria-pressed={active}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10 bg-slate-950/40">
        <Suspense fallback={<Loading />}>
          {mode === 'multi' && <MultiAgentChat />}
          {mode === 'workspace' && <WorkspaceChatPage />}
          {mode === 'unified' && <UnifiedCommunicationCanvas />}
          {mode === 'agents' && <ChatPage />}
        </Suspense>
      </div>

      <p className="text-[11px] text-slate-500">
        Prefer a deep link? Use{' '}
        <Link className="text-slate-300 underline-offset-2 hover:underline" to="/chat?mode=multi">
          /chat?mode=multi
        </Link>
        ,{' '}
        <Link
          className="text-slate-300 underline-offset-2 hover:underline"
          to="/chat?mode=workspace"
        >
          workspace
        </Link>
        , or{' '}
        <Link className="text-slate-300 underline-offset-2 hover:underline" to="/chat?mode=unified">
          unified
        </Link>
        .
      </p>
    </div>
  );
}
