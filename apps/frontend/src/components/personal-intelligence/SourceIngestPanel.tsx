import { Boxes, Cloud, FolderGit2, HardDrive, NotebookPen, Terminal } from 'lucide-react';
import type { SourceModuleStatus } from './types';

const ICONS = {
  session_bridge: Boxes,
  notes: NotebookPen,
  storage_location: Cloud,
  local: HardDrive,
  cli: Terminal,
} as const;

interface SourceIngestPanelProps {
  sources: SourceModuleStatus[];
  activeSourceId: string | 'all';
  onSelect: (id: string | 'all') => void;
}

export function SourceIngestPanel({ sources, activeSourceId, onSelect }: SourceIngestPanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Bring-your-own sources
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Personal Intelligence is provider-neutral. Connect or mirror any consented source; TNF
            unifies them for orchestration without turning any one vendor into the hub.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSelect('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            activeSourceId === 'all'
              ? 'bg-sky-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          All sources
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {sources.map((source) => {
          const Icon = source.kind === 'cli' ? FolderGit2 : ICONS[source.kind] || Boxes;
          const active = activeSourceId === source.id;
          return (
            <button
              key={source.id}
              type="button"
              onClick={() => onSelect(source.id)}
              className={`text-left p-4 rounded-xl border transition-all ${
                active
                  ? 'border-sky-400/50 bg-sky-950/40'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Icon className="w-4 h-4 text-sky-400" />
                  <span>{source.name}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    source.status === 'mirrored'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : source.status === 'policy_ready'
                        ? 'bg-slate-800 text-slate-300 border-slate-600'
                        : 'bg-amber-500/10 text-amber-200 border-amber-500/25'
                  }`}
                >
                  {source.status === 'mirrored'
                    ? 'Mirrored'
                    : source.status === 'policy_ready'
                      ? 'Ready'
                      : 'Not mirrored'}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">{source.description}</p>
              {typeof source.itemCount === 'number' && (
                <div className="mt-2 text-[11px] font-mono text-slate-500">
                  {source.itemCount.toLocaleString()} items
                </div>
              )}
              {source.cliHint && (
                <div className="mt-2 text-[10px] font-mono text-sky-400/80 truncate">
                  {source.cliHint}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
