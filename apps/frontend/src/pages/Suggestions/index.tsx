import { Badge, Button, Card, Input } from '@/components/ui';
import { LedgerRecord, listSuggestions, voteSuggestion } from '@/services/unifiedLedgerApi';
import { MessageSquare, Plus, Search, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const STATUS_OPTIONS = ['All', 'submitted', 'under_review', 'completed', 'rejected'];

const Suggestions: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<LedgerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState('All');

  const systemErrorLog = useMemo(() => {
    if (!loadError) return 'Error 404 - Request rejected by gateway synapse.';
    const compact = loadError.replace(/\s+/g, ' ').trim();
    if (compact.length === 0) return 'Error 404 - Request rejected by gateway synapse.';
    return compact;
  }, [loadError]);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setRows(await listSuggestions());
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Failed to load suggestions';
      setLoadError(message);
      toast.error('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return rows
      .filter((r) => (status === 'All' ? true : r.status === status))
      .filter(
        (r) =>
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => b.votes.up - a.votes.up);
  }, [rows, searchQuery, status]);

  const kanban = useMemo(() => {
    const statuses = STATUS_OPTIONS.filter((s) => s !== 'All');
    const grouped: Record<string, LedgerRecord[]> = {};
    statuses.forEach((s) => {
      grouped[s] = [];
    });
    filtered.forEach((record) => {
      const key = record.status;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(record);
    });
    return { statuses, grouped };
  }, [filtered]);

  const onVote = async (id: string, direction: 'up' | 'down') => {
    try {
      await voteSuggestion(id, direction);
      await load();
    } catch {
      toast.error('Vote failed');
    }
  };

  return (
    <div className="dark max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Feature Suggestions</h1>
          <p className="text-slate-400 mt-1">
            Unified intelligence queue with voting and priority tracking.
          </p>
        </div>
        <Button
          onClick={() => navigate('/suggestions/new')}
          className="bg-amber-500 hover:bg-amber-600 text-black font-bold h-11 px-6 shadow-lg shadow-amber-500/10"
        >
          <Plus className="mr-2 h-5 w-5" /> Submit Suggestion
        </Button>
      </div>

      {loadError ? (
        <Card className="p-8 mb-10 border border-red-500/20 bg-red-500/5 backdrop-blur-md text-center">
          <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
              <X className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Interface Sync Failure</h2>
              <p className="text-slate-400 mt-2 text-sm">
                We encountered a routing drift while retrieving the suggestion ledger. Our automated
                systems have been notified.
              </p>
            </div>
            <div className="w-full bg-black/40 rounded border border-white/5 p-3 text-xs font-mono text-red-400/80 text-left overflow-hidden">
              <span className="text-slate-500">SYSTEM_LOG:</span> {systemErrorLog}
            </div>
            <Button
              className="mt-2 bg-slate-800 hover:bg-slate-700 text-white font-bold h-10 px-8"
              onClick={load}
            >
              Retry Handshake
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4 group-focus-within:text-amber-500 transition-colors" />
              <Input
                placeholder="Search directives or technical rationale..."
                className="pl-12 bg-slate-900/50 border-slate-800 text-slate-100 placeholder:text-slate-600 h-11 focus:ring-amber-500/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="h-11 px-4 py-2 rounded-md border border-slate-800 bg-slate-900/50 text-sm text-slate-300 outline-none focus:border-amber-500/50 min-w-[180px]"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold uppercase tracking-widest">
                Synchronizing Ledger...
              </span>
            </div>
          ) : (
            <>
              {status === 'All' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {kanban.statuses.map((col) => (
                    <div key={col} className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                          {col.replace('_', ' ')}
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                          {kanban.grouped[col]?.length || 0}
                        </span>
                      </div>
                      <div className="space-y-4">
                        {(kanban.grouped[col] || []).map((s) => (
                          <Card
                            key={s.id}
                            className="p-5 bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 transition-all cursor-pointer group relative overflow-hidden"
                          >
                            <div className="absolute top-0 left-0 w-1 h-full bg-slate-800 group-hover:bg-amber-500 transition-colors" />
                            <button
                              className="text-left w-full"
                              onClick={() => navigate(`/suggestions/${s.id}`)}
                            >
                              <div className="font-bold text-slate-100 leading-tight group-hover:text-amber-400 transition-colors">
                                {s.title}
                              </div>
                              <div className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                                {s.description}
                              </div>
                            </button>
                            <div className="flex flex-wrap gap-2 mt-4">
                              <Badge className="bg-slate-950 border-slate-800 text-slate-500 text-[9px] font-bold uppercase">
                                Priority: {s.priority}
                              </Badge>
                              <Badge className="bg-amber-500/10 border-amber-500/20 text-amber-500 text-[9px] font-bold uppercase">
                                Score: {s.votes.up - s.votes.down}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-800/50">
                              <button
                                className="flex items-center text-[11px] font-bold text-emerald-500/80 hover:text-emerald-400 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onVote(s.id, 'up');
                                }}
                              >
                                <ThumbsUp className="h-3.5 w-3.5 mr-1.5" /> {s.votes.up}
                              </button>
                              <button
                                className="flex items-center text-[11px] font-bold text-red-500/80 hover:text-red-400 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onVote(s.id, 'down');
                                }}
                              >
                                <ThumbsDown className="h-3.5 w-3.5 mr-1.5" /> {s.votes.down}
                              </button>
                              <button
                                className="flex items-center text-[11px] font-bold text-sky-500/80 hover:text-sky-400 transition-colors ml-auto"
                                onClick={() => navigate(`/suggestions/${s.id}`)}
                              >
                                <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> View
                              </button>
                            </div>
                          </Card>
                        ))}
                        {(kanban.grouped[col] || []).length === 0 && (
                          <div className="p-8 border border-dashed border-slate-800/50 rounded-lg text-center opacity-30">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                              Empty Lane
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filtered.map((s) => (
                    <Card
                      key={s.id}
                      className="p-6 bg-slate-900/40 border-slate-800 hover:border-slate-700 transition-all"
                    >
                      <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-white leading-tight">
                              {s.title}
                            </h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase tracking-widest">
                              {s.status}
                            </span>
                          </div>
                          <p className="text-slate-400 mt-3 text-sm leading-relaxed max-w-3xl">
                            {s.description}
                          </p>
                          <div className="flex gap-2 mt-4">
                            <Badge className="bg-amber-500/10 border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase">
                              Priority: {s.priority}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-left md:text-right space-y-1 shrink-0">
                          <div className="text-sm font-bold text-white">
                            Score:{' '}
                            <span className="text-amber-500">{s.votes.up - s.votes.down}</span>
                          </div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                            Last Updated {new Date(s.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 mt-6 pt-6 border-t border-slate-800/50">
                        <button
                          className="flex items-center text-sm font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
                          onClick={() => onVote(s.id, 'up')}
                        >
                          <ThumbsUp className="h-4 w-4 mr-2" /> Upvote ({s.votes.up})
                        </button>
                        <button
                          className="flex items-center text-sm font-bold text-red-500 hover:text-red-400 transition-colors"
                          onClick={() => onVote(s.id, 'down')}
                        >
                          <ThumbsDown className="h-4 w-4 mr-2" /> Downvote ({s.votes.down})
                        </button>
                        <button
                          className="flex items-center text-sm font-bold text-sky-500 hover:text-sky-400 transition-colors ml-auto"
                          onClick={() => navigate(`/suggestions/${s.id}`)}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" /> Detail Intelligence
                        </button>
                      </div>
                    </Card>
                  ))}
                  {filtered.length === 0 && (
                    <div className="py-20 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                      <p className="font-bold uppercase tracking-[0.2em] text-xs">
                        No records matching search criteria
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Suggestions;
