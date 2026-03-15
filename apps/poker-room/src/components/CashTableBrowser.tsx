import { ArrowRight, Loader2, Plus, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { api } from '../api';

interface CashTableBrowserProps {
  onJoinTable: (tableId: string) => void;
  onBack: () => void;
  canCreateTable?: boolean;
}

export default function CashTableBrowser({
  onJoinTable,
  onBack,
  canCreateTable = false,
}: CashTableBrowserProps) {
  const [tables, setTables] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStakes, setFilterStakes] = useState('All');
  const [filterSeats, setFilterSeats] = useState('All');
  const [sortBy, setSortBy] = useState('Players');

  useEffect(() => {
    let isMounted = true;
    const fetchTables = async (showLoader: boolean) => {
      try {
        if (showLoader) setIsLoading(true);
        const data = await api('/api/v2/holdem/tables');
        if (data && Array.isArray(data.tables)) {
          if (!isMounted) return;
          setTables(data.tables);
        }
      } catch (e) {
        console.error('Failed to fetch tables:', e);
        if (isMounted) setTables([]);
      } finally {
        if (showLoader && isMounted) setIsLoading(false);
      }
    };
    fetchTables(true);
    const interval = setInterval(() => {
      fetchTables(false);
    }, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const filteredTables = tables
    .filter((t) => {
      const stakes = String(t.stakes || '');
      const type = String(t.type || '');
      if (filterStakes !== 'All' && !stakes.includes(filterStakes)) return false;
      if (filterSeats !== 'All' && !type.includes(filterSeats)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'Players') return b.players - a.players;
      if (sortBy === 'Stakes')
        return (
          parseInt(b.stakes.split('/')[1].replace('$', '')) -
          parseInt(a.stakes.split('/')[1].replace('$', ''))
        );
      if (sortBy === 'Avg Pot') return (b.avgPot || 0) - (a.avgPot || 0);
      return 0;
    });
  const visibleTables = filteredTables;

  return (
    <div className="min-h-screen bg-[#020308] text-slate-300 font-sans">
      {/* Header */}
      <header className="h-20 bg-[#0a0c1a]/80 backdrop-blur-md border-b border-white/5 flex items-center px-6 sm:px-10 sticky top-0 z-[100]">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={onBack}>
          <div className="w-10 h-10 bg-cyan-400 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.4)] group-hover:shadow-[0_0_25px_rgba(0,242,255,0.6)] transition-all text-xl">
            🕹️
          </div>
          <h1 className="text-2xl font-black italic text-white tracking-tighter uppercase">
            AI-<span className="text-cyan-400">ARCADE</span>
          </h1>
        </div>
      </header>

      <main className="p-6 sm:p-12 max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-4xl sm:text-5xl font-black italic text-white uppercase tracking-tighter mb-2">
            Cash Games
          </h2>
          <p className="text-sm font-black text-cyan-400 uppercase tracking-widest">
            No-Limit Hold'em Ring Games
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-[#0a0c1a]/80 backdrop-blur-md border border-white/5 rounded-2xl p-4 mb-8 flex flex-wrap gap-6 items-center shadow-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mr-2">
              Stakes:
            </span>
            {['All', '$1/$2', '$5/$10', '$25/$50', '$100/$200'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStakes(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${filterStakes === s ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(0,242,255,0.3)]' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-white/10 hidden md:block" />

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mr-2">
              Seats:
            </span>
            {['All', '6-Max', '9-Max', 'Heads-Up'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterSeats(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${filterSeats === s ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(0,242,255,0.3)]' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-white/10 hidden md:block" />

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mr-2">
              Sort:
            </span>
            {['Players', 'Stakes', 'Avg Pot'].map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${sortBy === s ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(0,242,255,0.3)]' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-20 bg-[#0a0c1a]/80 backdrop-blur-md border border-white/5 rounded-[40px]">
              <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
              <p className="text-cyan-400 font-black uppercase tracking-widest animate-pulse">
                Syncing Tables...
              </p>
            </div>
          ) : visibleTables.length > 0 ? (
            visibleTables.map((table, i) => (
              <motion.div
                key={table.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[#0a0c1a]/80 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 hover:border-cyan-400/50 hover:bg-[#0a0c1a] transition-all group border-b border-b-slate-800"
              >
                <div className="flex-1 min-w-[200px]">
                  <h3 className="text-lg font-black italic uppercase text-white group-hover:text-cyan-400 transition-colors">
                    {table.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-slate-900 rounded text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {table.type}
                    </span>
                  </div>
                </div>

                <div className="flex-1 flex items-center justify-center gap-8 min-w-[300px]">
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                      Stakes
                    </p>
                    <p className="text-lg font-mono text-cyan-400">{table.stakes}</p>
                  </div>

                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                      Players ({table.players}/{table.maxPlayers})
                    </p>
                    <div className="flex gap-1 justify-center">
                      {[...Array(table.maxPlayers)].map((_, j) => (
                        <div
                          key={j}
                          className={`w-2.5 h-2.5 rounded-full ${j < table.players ? 'bg-cyan-400 shadow-[0_0_5px_rgba(0,242,255,0.5)]' : 'bg-slate-800'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                      Avg Pot
                    </p>
                    <p className="text-lg font-mono text-white">{table.avgPot}</p>
                  </div>
                </div>

                <div className="flex-1 flex justify-end min-w-[150px]">
                  {table.players >= table.maxPlayers ? (
                    <button className="px-6 py-3 bg-amber-600/20 text-amber-500 rounded-xl font-black uppercase tracking-widest border border-amber-600/50 hover:bg-amber-600/30 transition-colors">
                      Waitlist
                    </button>
                  ) : (
                    <button
                      onClick={() => onJoinTable(table.id)}
                      className="px-8 py-3 bg-cyan-600 text-white rounded-xl font-black uppercase tracking-widest border-b-4 border-cyan-800 hover:brightness-125 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2"
                    >
                      Join <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="bg-[#0a0c1a]/80 backdrop-blur-md border border-white/5 rounded-[40px] p-16 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 border border-slate-800">
                <Users className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-2xl font-black italic uppercase text-white mb-2">
                No Tables Found
              </h3>
              <p className="text-slate-400 mb-8 max-w-md">
                There are currently no active tables matching your filter criteria. You can start a
                live table and fill remaining seats with bots until other players join.
              </p>
              <button
                onClick={() => onJoinTable(`bot-table-${Date.now()}`)}
                className="px-8 py-4 bg-cyan-600 text-white rounded-2xl font-black uppercase tracking-widest border-b-4 border-cyan-800 hover:brightness-125 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,242,255,0.2)]"
              >
                <Plus className="w-5 h-5" /> Start Bot-Filled Table
              </button>
              {canCreateTable && (
                <p className="text-xs text-slate-500 font-mono mt-3">
                  Creator/admin tables can still be launched from operator controls.
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
