import { FastForward, Info, Pause, Play, Rewind, SkipBack, SkipForward, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface HandReplayerProps {
  handId: string;
  onClose: () => void;
}

const MOCK_ACTIONS = [
  { p: 'GHOST', act: 'posts SB $1', pot: 1 },
  { p: 'CYBER-9', act: 'posts BB $2', pot: 3 },
  { p: 'Neural_Knight', act: 'raises to $6', pot: 9 },
  { p: 'GHOST', act: 'folds', pot: 9 },
  { p: 'CYBER-9', act: 'calls $4', pot: 13 },
  { p: 'DEALER', act: 'deals Flop [2c 7s Jd]', pot: 13 },
  { p: 'CYBER-9', act: 'checks', pot: 13 },
  { p: 'Neural_Knight', act: 'bets $8', pot: 21 },
  { p: 'CYBER-9', act: 'calls $8', pot: 29 },
  { p: 'DEALER', act: 'deals Turn [Qh]', pot: 29 },
  { p: 'CYBER-9', act: 'checks', pot: 29 },
  { p: 'Neural_Knight', act: 'bets $20', pot: 49 },
  { p: 'CYBER-9', act: 'calls $20', pot: 69 },
  { p: 'DEALER', act: 'deals River [Tc]', pot: 69 },
  { p: 'CYBER-9', act: 'checks', pot: 69 },
  { p: 'Neural_Knight', act: 'bets $45', pot: 114 },
  { p: 'CYBER-9', act: 'calls $45', pot: 159 },
  { p: 'DEALER', act: 'Showdown', pot: 159 },
];

export default function HandReplayer({ handId, onClose }: HandReplayerProps) {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isPlaying && step < MOCK_ACTIONS.length - 1) {
      interval = setInterval(() => {
        setStep((s) => s + 1);
      }, 1000 / speed);
    } else if (step >= MOCK_ACTIONS.length - 1) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, step, speed]);

  const currentAction = MOCK_ACTIONS[step];

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
                  {/* Mock Board Cards based on step */}
                  {step >= 5 && (
                    <div className="w-10 h-14 bg-white rounded border border-slate-300 flex items-center justify-center font-black text-slate-900 shadow-md">
                      2♣
                    </div>
                  )}
                  {step >= 5 && (
                    <div className="w-10 h-14 bg-white rounded border border-slate-300 flex items-center justify-center font-black text-slate-900 shadow-md">
                      7♠
                    </div>
                  )}
                  {step >= 5 && (
                    <div className="w-10 h-14 bg-white rounded border border-slate-300 flex items-center justify-center font-black text-red-500 shadow-md">
                      J♦
                    </div>
                  )}
                  {step >= 9 && (
                    <div className="w-10 h-14 bg-white rounded border border-slate-300 flex items-center justify-center font-black text-red-500 shadow-md">
                      Q♥
                    </div>
                  )}
                  {step >= 13 && (
                    <div className="w-10 h-14 bg-white rounded border border-slate-300 flex items-center justify-center font-black text-slate-900 shadow-md">
                      T♣
                    </div>
                  )}
                </div>
              </div>

              {/* Seats */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full border-2 ${currentAction?.p === 'CYBER-9' ? 'border-cyan-400 shadow-[0_0_15px_rgba(0,242,255,0.5)]' : 'border-slate-700'} bg-[#0a0c1a] flex items-center justify-center overflow-hidden`}
                >
                  <img src="https://api.dicebear.com/7.x/bottts/svg?seed=CYBER-9" alt="P2" />
                </div>
                <div className="bg-black/80 px-2 py-1 rounded border border-slate-800 mt-1 text-center">
                  <p className="text-[8px] font-black uppercase text-white">CYBER-9</p>
                  <p className="text-[10px] font-mono text-cyan-400">$9,500</p>
                </div>
              </div>

              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full border-2 ${currentAction?.p === 'Neural_Knight' ? 'border-cyan-400 shadow-[0_0_15px_rgba(0,242,255,0.5)]' : 'border-slate-700'} bg-[#0a0c1a] flex items-center justify-center overflow-hidden`}
                >
                  <img
                    src="https://api.dicebear.com/7.x/bottts/svg?seed=Neural_Knight"
                    alt="Hero"
                  />
                </div>
                <div className="bg-black/80 px-2 py-1 rounded border border-slate-800 mt-1 text-center">
                  <p className="text-[8px] font-black uppercase text-cyan-400">Neural_Knight</p>
                  <p className="text-[10px] font-mono text-white">$10,200</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Log */}
          <div className="h-48 bg-[#0a0c1a] border-t border-white/5 overflow-y-auto p-4 font-mono text-sm">
            {MOCK_ACTIONS.map((a, i) => (
              <div
                key={i}
                className={`py-1.5 px-4 rounded flex justify-between items-center transition-colors ${i === step ? 'bg-cyan-900/30 border-l-2 border-cyan-400 text-white' : i < step ? 'text-slate-400' : 'text-slate-700 hidden'}`}
              >
                <div>
                  <span
                    className={`font-bold ${a.p === 'Neural_Knight' ? 'text-cyan-400' : a.p === 'DEALER' ? 'text-purple-400' : 'text-slate-300'}`}
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
                  setStep(Math.min(MOCK_ACTIONS.length - 1, step + 1));
                  setIsPlaying(false);
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <SkipForward className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setStep(MOCK_ACTIONS.length - 1);
                  setIsPlaying(false);
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <FastForward className="w-5 h-5" />
              </button>
            </div>

            <div className="w-32 text-right">
              <span className="text-xs font-mono text-cyan-400">
                {step + 1} / {MOCK_ACTIONS.length}
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
                <p className="text-white">2026-03-06 10:15:22</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  Table
                </p>
                <p className="text-white">CYBER-NODE #1</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  Blinds
                </p>
                <p className="text-white">$1 / $2</p>
              </div>
              <div className="pt-4 border-t border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  Final Pot
                </p>
                <p className="text-xl text-[#10b981] font-bold">$159</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  Winner
                </p>
                <p className="text-cyan-400">Neural_Knight</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
