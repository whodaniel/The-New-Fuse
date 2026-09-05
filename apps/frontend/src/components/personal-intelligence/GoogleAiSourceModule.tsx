import { Check, Play, Terminal } from 'lucide-react';
import type { PersonalIntelItem } from './types';

interface GoogleAiSourceModuleProps {
  items: PersonalIntelItem[];
  mirrorPresent: boolean;
  mirrorHint: string;
  copiedText: string | null;
  onCopy: (text: string, id: string) => void;
  onInspect: (item: PersonalIntelItem) => void;
}

/**
 * Google Gemini / Antigravity is one Personal Intelligence ingest module —
 * not the hub identity. Sessions from this bridge merge into the unified
 * Personal Intelligence index alongside other sources.
 */
export function GoogleAiSourceModule({
  items,
  mirrorPresent,
  mirrorHint,
  copiedText,
  onCopy,
  onInspect,
}: GoogleAiSourceModuleProps) {
  return (
    <div className="rounded-xl border border-sky-500/25 bg-slate-950/50 p-5 space-y-4">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-sky-300">Google Gemini / Antigravity</div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Optional session bridge. Indexes operator-local Google AI / Antigravity conversations
            into the shared Personal Intelligence store — one module among many bring-your-own
            sources.
          </p>
        </div>
        <span
          className={`self-start px-2.5 py-1 rounded text-[10px] font-semibold border ${
            mirrorPresent
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'bg-amber-500/15 text-amber-200 border-amber-500/30'
          }`}
        >
          {mirrorPresent ? `${items.length} sessions mirrored` : 'Mirror not present'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
          <div className="font-mono text-sky-400">tnf google-ai status</div>
          <p className="text-slate-500">Check local DB / account binding</p>
        </div>
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
          <div className="font-mono text-indigo-400">tnf google-ai sync</div>
          <p className="text-slate-500">Refresh concordance into ~/.tnf/personal-intelligence</p>
        </div>
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
          <div className="font-mono text-emerald-400">tnf google-ai list -n 25</div>
          <p className="text-slate-500">Inspect bridged sessions from the terminal</p>
        </div>
      </div>

      {!mirrorPresent && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onCopy(mirrorHint, 'google-mirror-setup')}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200"
          >
            {copiedText === 'google-mirror-setup' ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Terminal className="w-3.5 h-3.5 text-sky-400" />
            )}
            <span>
              {copiedText === 'google-mirror-setup' ? 'Copied setup command' : 'Copy mirror setup'}
            </span>
          </button>
          <span className="text-[11px] text-slate-500 font-mono truncate max-w-full">
            {mirrorHint}
          </span>
        </div>
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-xs text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-3 py-2.5">Session</th>
                <th className="px-3 py-2.5">Title</th>
                <th className="px-3 py-2.5">Steps</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {items.slice(0, 40).map((item) => (
                <tr key={item.id} className="hover:bg-sky-950/20">
                  <td className="px-3 py-2.5 font-mono text-xs text-sky-400">{item.id}</td>
                  <td className="px-3 py-2.5 text-slate-200">{item.title}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-slate-400">
                    {item.metricValue ?? '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => onInspect(item)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-sky-600 text-xs text-slate-200"
                    >
                      Inspect
                    </button>
                    {item.resumeHint && (
                      <button
                        type="button"
                        onClick={() => onCopy(item.resumeHint!, `resume-${item.id}`)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-emerald-700 text-xs text-emerald-300"
                      >
                        {copiedText === `resume-${item.id}` ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                        Resume
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
