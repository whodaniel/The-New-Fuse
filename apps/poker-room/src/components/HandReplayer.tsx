import { motion } from 'framer-motion';
import { FastForward, Info, Pause, Play, Rewind, SkipBack, SkipForward, X, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { holdemV2Api } from '../api';

interface HandReplayerProps {
  handId: string;
  onClose: () => void;
}

interface Action {
  p: string;
  act: string;
  pot: number;
}

export default function HandReplayer({ handId, onClose }: HandReplayerProps) {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showInfo, setShowInfo] = useState(false);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [handData, setHandData] = useState<any>(null);

  useEffect(() => {
    async function fetchHand() {
      try {
        const res = await holdemV2Api.replay(handId);
        if (res.ok && res.hand) {
          setHandData(res.hand);
          // Map actionLog to our internal Action format
          // Server actionLog typically looks like { type, seat, action, amount, pot, ... }
          const mapped = (res.hand.actionLog || []).map((a: any) => ({
            p: a.playerName || `Seat ${a.seat}`,
            act: `${a.action} ${a.amount ? `$${a.amount}` : ''}`.trim(),
            pot: a.pot || 0
          }));
          setActions(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch hand replay:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHand();
  }, [handId]);

  useEffect(() => {
    let interval: any;
    if (isPlaying && step < actions.length - 1) {
      interval = setInterval(() => {
        setStep((s) => s + 1);
      }, 1000 / speed);
    } else if (step >= actions.length - 1 && actions.length > 0) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, step, speed, actions.length]);

  const currentAction = actions[step];

  if (loading) {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#020308]">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col bg-[#020308] font-sans">
      {/* Header */}
      <header className="h-16 bg-[#0a0c1a] border-b border-white/5 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-black italic uppercase text-white tracking-tighter">
            Hand Replayer
          </h2>
          <span className="px-2 py-1 bg-cyan-900/30 text-cyan-400 rounded text-[10px] font-mono border border-cyan-500/30">
            {handId}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`p-2 rounded-lg transition-colors ${showInfo ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Info className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex relative overflow-hidden">
        {/* Main Replayer Area */}
        <div className="flex-1 flex flex-col relative">
          {/* Mini Table */}
          <div className="flex-1 relative flex items-center justify-center p-8 bg-[radial-gradient(circle_at_center,_#0a0c1a_0%,_#020308_100%)]">
            <div className="w-full max-w-3xl aspect-[2/1] bg-gradient-to-b from-[#2a2e38] via-[#1a1c23] to-[#0d0f14] rounded-[150px] border-4 border-[#1a1c23] shadow-2xl flex items-center justify-center relative">
              <div className="w-[96%] h-[92%] bg-[radial-gradient(circle_at_center,_#062b1f_0%,_#020a07_100%)] rounded-[140px] border-4 border-[#0a0c1a] shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center">
                <div className="text-center mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                    Main Pot
                  </p>
                  <p className="text-2xl font-mono text-cyan-400 font-bold drop-shadow-[0_0_10px_rgba(0,242,255,0.5)]">
                    ${currentAction?.pot || 0}
                  </p>
                </div>

                <div className="flex gap-2">
                  {/* Real board cards if available */}
                  {handData?.communityCards?.map((card: string, i: number) => {
                    // Logic to show card only if we reached its deal street
                    // Simplistic version for now:
                    const street = i < 3 ? 'flop' : i === 3 ? 'turn' : 'river';
                    const actionIndex = (handData.actionLog || []).findIndex((a: any) => a.action?.toLowerCase().includes(street));
                    if (actionIndex === -1 || step >= actionIndex) {
                       return (
                        <div key={i} className={`w-10 h-14 bg-white rounded border border-slate-300 flex items-center justify-center font-black shadow-md ${card.endsWith('h') || card.endsWith('d') ? 'text-red-500' : 'text-slate-900'}`}>
                          {card.replace('c', '♣').replace('s', '♠').replace('h', '♥').replace('d', '♦')}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Action Log */}
          <div className="h-48 bg-[#0a0c1a] border-t border-white/5 overflow-y-auto p-4 font-mono text-sm">
            {actions.map((a, i) => (
              <div
                key={i}
                className={`py-1.5 px-4 rounded flex justify-between items-center transition-colors ${i === step ? 'bg-cyan-900/30 border-l-2 border-cyan-400 text-white' : i < step ? 'text-slate-400' : 'text-slate-700 hidden'}`}
              >
                <div>
                  <span
                    className={`font-bold ${a.p === 'DEALER' ? 'text-purple-400' : 'text-cyan-400'}`}
                  >
                    {a.p}
                  </span>
                  <span className="mx-2">{a.act}</span>
                </div>
                <span className="text-xs text-slate-500">Pot: ${a.pot}</span>
              </div>
            ))}
          </div>

          {/* Controls Bar */}
          <div className="h-20 bg-black border-t border-slate-800 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSpeed(0.5)}
                className={`text-xs font-black uppercase tracking-widest px-2 py-1 rounded ${speed === 0.5 ? 'bg-cyan-900/50 text-cyan-400' : 'text-slate-500 hover:text-white'}`}
              >
                0.5x
              </button>
              <button
                onClick={() => setSpeed(1)}
                className={`text-xs font-black uppercase tracking-widest px-2 py-1 rounded ${speed === 1 ? 'bg-cyan-900/50 text-cyan-400' : 'text-slate-500 hover:text-white'}`}
              >
                1x
              </button>
              <button
                onClick={() => setSpeed(2)}
                className={`text-xs font-black uppercase tracking-widest px-2 py-1 rounded ${speed === 2 ? 'bg-cyan-900/50 text-cyan-400' : 'text-slate-500 hover:text-white'}`}
              >
                2x
              </button>
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={() => {
                  setStep(0);
                  setIsPlaying(false);
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <Rewind className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setStep(Math.max(0, step - 1));
                  setIsPlaying(false);
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-12 h-12 bg-cyan-600 rounded-full flex items-center justify-center text-white hover:bg-cyan-500 transition-colors shadow-[0_0_15px_rgba(0,242,255,0.3)]"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
              </button>

              <button
                onClick={() => {
                  setStep(Math.min(actions.length - 1, step + 1));
                  setIsPlaying(false);
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <SkipForward className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setStep(actions.length - 1);
                  setIsPlaying(false);
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <FastForward className="w-5 h-5" />
              </button>
            </div>

            <div className="w-32 text-right">
              <span className="text-xs font-mono text-cyan-400">
                {step + 1} / {actions.length}
              </span>
            </div>
          </div>
        </div>

        {/* Info Sidebar */}
        {showInfo && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-[#0a0c1a] border-l border-white/5 p-6 flex flex-col"
          >
            <h3 className="text-sm font-black italic uppercase text-white mb-6">Hand Details</h3>
            <div className="space-y-4 text-sm font-mono">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  Hand ID
                </p>
                <p className="text-cyan-400">{handId}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  Date/Time
                </p>
                <p className="text-white">{handData?.timestamp}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  Table
                </p>
                <p className="text-white">{handData?.tableId}</p>
              </div>
              <div className="pt-4 border-t border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  Final Pot
                </p>
                <p className="text-xl text-[#10b981] font-bold">${handData?.payoutUnits}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  Winner Seat
                </p>
                <p className="text-cyan-400">Seat {handData?.winnerSeat}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
