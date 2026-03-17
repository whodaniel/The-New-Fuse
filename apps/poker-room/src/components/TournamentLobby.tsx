import { motion } from 'framer-motion';
import { ArrowRight, Clock, Loader2, Plus, Shield, Trophy } from 'lucide-react';
import React, { useState } from 'react';
import { api } from '../api';

interface TournamentLobbyProps {
  onJoin: (id: string) => void;
  onCreateSng: () => void;
  onCreateMtt: () => void;
  onBack: () => void;
  canCreateTournaments?: boolean;
}

// Data is now fetched via useEffect

export default function TournamentLobby({
  onJoin,
  onCreateSng,
  onCreateMtt,
  onBack,
  canCreateTournaments = false,
}: TournamentLobbyProps) {
  const [tab, setTab] = useState<'SNG' | 'MTT' | 'MY'>('SNG');
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    let isMounted = true;
    const fetchTournaments = async () => {
      try {
        const data = await api('/api/v2/tournaments');
        if (data && Array.isArray(data.tournaments) && isMounted) {
          setTournaments(data.tournaments);
        }
      } catch (err) {
        console.error('Failed to fetch tournaments:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchTournaments();
    const interval = setInterval(fetchTournaments, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const sngs = tournaments.filter((t) => t.type === 'sng' || t.format?.includes('Sit & Go'));
  const mtts = tournaments.filter((t) => t.type === 'mtt' || t.format?.includes('Multi-Table'));

  const renderStatusBadge = (status: string) => {
    const s = String(status).toUpperCase();
    switch (s) {
      case 'REGISTERING':
      case 'SCHEDULED':
        return (
          <span className="flex items-center gap-2 px-3 py-1 bg-green-900/30 text-green-400 border border-green-500/50 rounded-full text-[10px] font-black uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Registering
          </span>
        );
      case 'RUNNING':
      case 'ACTIVE':
        return (
          <span className="flex items-center gap-2 px-3 py-1 bg-cyan-900/30 text-cyan-400 border border-cyan-500/50 rounded-full text-[10px] font-black uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> Running
          </span>
        );
      case 'COMPLETED':
      case 'FINISHED':
        return (
          <span className="flex items-center gap-2 px-3 py-1 bg-slate-900/50 text-slate-400 border border-slate-700 rounded-full text-[10px] font-black uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-slate-500" /> Completed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#020308] text-slate-300 font-sans">
      {/* Header */}
      <header className="h-20 bg-[#0a0c1a]/80 backdrop-blur-md border-b border-white/5 flex items-center px-6 sm:px-10 sticky top-0 z-[100]">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={onBack}>
          <div className="w-10 h-10 bg-cyan-400 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.4)] group-hover:shadow-[0_0_25px_rgba(0,242,255,0.6)] transition-all">
            <Shield className="w-6 h-6 text-black fill-current" />
          </div>
          <h1 className="text-2xl font-black italic text-white tracking-tighter uppercase">
            AI<span className="text-cyan-400">ARCADE</span>
          </h1>
        </div>
      </header>

      <main className="p-6 sm:p-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6">
          <div>
            <h2 className="text-4xl sm:text-5xl font-black italic text-white uppercase tracking-tighter mb-2 flex items-center gap-4">
              <Trophy className="w-10 h-10 text-cyan-400" /> Tournaments
            </h2>
            <p className="text-sm font-black text-cyan-400 uppercase tracking-widest">
              Compete for Glory
            </p>
          </div>

          <div className="flex gap-4">
            {canCreateTournaments ? (
              <>
                <button
                  onClick={onCreateSng}
                  className="px-6 py-3 bg-cyan-600/20 text-cyan-400 rounded-xl font-black uppercase tracking-widest border border-cyan-500/50 hover:bg-cyan-600/30 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(0,242,255,0.1)]"
                >
                  <Plus className="w-4 h-4" /> Create SNG
                </button>
                <button
                  onClick={onCreateMtt}
                  className="px-6 py-3 bg-indigo-600/20 text-indigo-400 rounded-xl font-black uppercase tracking-widest border border-indigo-500/50 hover:bg-indigo-600/30 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                >
                  <Plus className="w-4 h-4" /> Create MTT
                </button>
              </>
            ) : (
              <p className="text-xs font-mono text-slate-500 max-w-xs text-right">
                Tournament creation is reserved for creator/admin lanes.
              </p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-white/5 pb-4 overflow-x-auto">
          {['SIT & GO', 'MULTI-TABLE', 'MY TOURNAMENTS'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t === 'SIT & GO' ? 'SNG' : t === 'MULTI-TABLE' ? 'MTT' : 'MY')}
              className={`px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all whitespace-nowrap ${
                (tab === 'SNG' && t === 'SIT & GO') ||
                (tab === 'MTT' && t === 'MULTI-TABLE') ||
                (tab === 'MY' && t === 'MY TOURNAMENTS')
                  ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(0,242,255,0.3)]'
                  : 'bg-[#0a0c1a] text-slate-500 hover:bg-slate-900 hover:text-slate-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'SNG' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="md:col-span-2 lg:col-span-3 py-20 flex flex-col items-center">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-4" />
                <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">
                  Loading SNG Protocol...
                </p>
              </div>
            ) : sngs.length === 0 ? (
              <div className="md:col-span-2 lg:col-span-3 bg-[#0a0c1a]/80 backdrop-blur-md border border-white/5 rounded-[40px] p-16 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 border border-slate-800">
                  <Trophy className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-2xl font-black italic uppercase text-white mb-2">
                  No Active SNGs
                </h3>
                <p className="text-slate-400 mb-8 max-w-md">
                  There are no live Sit & Go tournaments right now.
                </p>
                {canCreateTournaments ? (
                  <button
                    onClick={onCreateSng}
                    className="px-8 py-4 bg-cyan-600 text-white rounded-2xl font-black uppercase tracking-widest border-b-4 border-cyan-800 hover:brightness-125 active:border-b-0 active:translate-y-1 transition-all shadow-[0_0_20px_rgba(0,242,255,0.2)]"
                  >
                    Create SNG
                  </button>
                ) : (
                  <p className="text-xs text-slate-500 font-mono">
                    Tournament creation is reserved for creator/admin lanes.
                  </p>
                )}
              </div>
            ) : null}
            {!isLoading &&
              sngs.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[#0a0c1a]/80 backdrop-blur-md border border-white/5 rounded-[30px] p-6 hover:border-cyan-400/50 transition-all flex flex-col justify-between shadow-xl relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[40px] rounded-full group-hover:bg-cyan-500/10 transition-all pointer-events-none" />

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      {renderStatusBadge(t.status)}
                      <span className="px-2 py-1 bg-slate-900 rounded text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {t.format}
                      </span>
                    </div>

                    <h3 className="text-xl font-black italic uppercase text-white mb-6 group-hover:text-cyan-400 transition-colors">
                      {t.name}
                    </h3>

                    <div className="space-y-4 mb-8">
                      <div className="flex justify-between items-center pb-3 border-b border-white/5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Buy-in
                        </span>
                        <span className="text-sm font-mono text-white">{t.buyIn}</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-white/5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Prize Pool
                        </span>
                        <span className="text-lg font-mono text-[#10b981] font-bold drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]">
                          {t.prize}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-white/5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Registered
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-cyan-400">
                            {t.registered}/{t.max}
                          </span>
                          <div className="w-4 h-4 rounded-full border-2 border-cyan-900 flex items-center justify-center relative">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              <path
                                className="text-cyan-900"
                                strokeWidth="4"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <path
                                className="text-cyan-400"
                                strokeDasharray={`${(t.registered / t.max) * 100}, 100`}
                                strokeWidth="4"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-white/5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Blinds
                        </span>
                        <span className="text-sm font-mono text-white">{t.blindLevel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10">
                    {t.status === 'REGISTERING' && (
                      <button
                        onClick={() => onJoin(t.id)}
                        className="w-full py-4 bg-cyan-600 rounded-2xl font-black italic uppercase tracking-widest text-white border-b-4 border-cyan-800 hover:brightness-125 active:border-b-0 active:translate-y-1 transition-all shadow-[0_0_20px_rgba(0,242,255,0.2)]"
                      >
                        Register
                      </button>
                    )}
                    {t.status === 'RUNNING' && (
                      <button
                        onClick={() => onJoin(t.id)}
                        className="w-full py-4 bg-slate-800 rounded-2xl font-black italic uppercase tracking-widest text-white border-b-4 border-slate-900 hover:bg-slate-700 active:border-b-0 active:translate-y-1 transition-all"
                      >
                        Observe
                      </button>
                    )}
                    {t.status === 'COMPLETED' && (
                      <button
                        disabled
                        className="w-full py-4 bg-slate-900/50 rounded-2xl font-black italic uppercase tracking-widest text-slate-600 border border-slate-800 cursor-not-allowed"
                      >
                        Finished
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
          </div>
        )}

        {tab === 'MTT' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isLoading ? (
              <div className="lg:col-span-2 py-20 flex flex-col items-center">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-4" />
                <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">
                  Syncing Tournament Grid...
                </p>
              </div>
            ) : mtts.length === 0 ? (
              <div className="lg:col-span-2 bg-[#0a0c1a]/80 backdrop-blur-md border border-white/5 rounded-[40px] p-16 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 border border-slate-800">
                  <Trophy className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-2xl font-black italic uppercase text-white mb-2">
                  No Active MTTs
                </h3>
                <p className="text-slate-400 mb-8 max-w-md">
                  There are no scheduled multi-table tournaments right now.
                </p>
                {canCreateTournaments ? (
                  <button
                    onClick={onCreateMtt}
                    className="px-8 py-4 bg-cyan-600 text-white rounded-2xl font-black uppercase tracking-widest border-b-4 border-cyan-800 hover:brightness-125 active:border-b-0 active:translate-y-1 transition-all shadow-[0_0_20px_rgba(0,242,255,0.2)]"
                  >
                    Create MTT
                  </button>
                ) : (
                  <p className="text-xs text-slate-500 font-mono">
                    Tournament creation is reserved for creator/admin lanes.
                  </p>
                )}
              </div>
            ) : null}
            {!isLoading &&
              mtts.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[#0a0c1a]/80 backdrop-blur-md border border-white/5 rounded-[30px] p-6 sm:p-8 hover:border-cyan-400/50 transition-all shadow-xl relative overflow-hidden group flex flex-col sm:flex-row gap-8"
                >
                  <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 blur-[60px] rounded-full group-hover:bg-cyan-500/10 transition-all pointer-events-none" />

                  <div className="flex-1 relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      {renderStatusBadge(t.status)}
                      <span className="px-2 py-1 bg-slate-900 rounded text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {t.format}
                      </span>
                    </div>

                    <h3 className="text-2xl font-black italic uppercase text-white mb-2 group-hover:text-cyan-400 transition-colors">
                      {t.name}
                    </h3>

                    <div className="flex items-center gap-2 mb-6 text-cyan-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-mono font-bold">Starts in {t.start}</span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Buy-in
                        </span>
                        <span className="text-sm font-mono text-white">{t.buyIn}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Guaranteed
                        </span>
                        <span className="text-xl font-mono text-[#10b981] font-bold drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]">
                          {t.gtd}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Registered
                        </span>
                        <span className="text-sm font-mono text-cyan-400">
                          {t.registered} / {t.max}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full sm:w-48 flex flex-col justify-between relative z-10 border-t sm:border-t-0 sm:border-l border-white/5 pt-6 sm:pt-0 sm:pl-8">
                    <div className="space-y-4 mb-6">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                          Starting Stack
                        </p>
                        <p className="text-sm font-mono text-white">{t.stack}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                          Late Reg
                        </p>
                        <p className="text-sm font-mono text-white">{t.lateReg}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => onJoin(t.id)}
                      className="w-full py-4 bg-cyan-600 rounded-2xl font-black italic uppercase tracking-widest text-white border-b-4 border-cyan-800 hover:brightness-125 active:border-b-0 active:translate-y-1 transition-all shadow-[0_0_20px_rgba(0,242,255,0.2)] flex items-center justify-center gap-2"
                    >
                      Register <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
          </div>
        )}

        {tab === 'MY' && (
          <div className="bg-[#0a0c1a]/80 backdrop-blur-md border border-white/5 rounded-[40px] p-16 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 border border-slate-800">
              <Trophy className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-2xl font-black italic uppercase text-white mb-2">
              No Active Tournaments
            </h3>
            <p className="text-slate-400 mb-8 max-w-md">
              You are not currently registered for any tournaments. Browse the lobby to find an
              event.
            </p>
            <button
              onClick={() => setTab('SNG')}
              className="px-8 py-4 bg-cyan-600 text-white rounded-2xl font-black uppercase tracking-widest border-b-4 border-cyan-800 hover:brightness-125 active:border-b-0 active:translate-y-1 transition-all shadow-[0_0_20px_rgba(0,242,255,0.2)]"
            >
              Browse Events
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
