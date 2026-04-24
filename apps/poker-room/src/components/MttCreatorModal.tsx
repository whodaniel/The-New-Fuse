import { motion } from 'framer-motion';
import { Settings2, Trophy, X } from 'lucide-react';
import React, { useState } from 'react';

interface MttCreatorModalProps {
  onClose: () => void;
  onCreate: (config: any) => void;
}

const BLIND_LEVELS = [
  { level: 1, sb: 25, bb: 50, ante: 0, duration: 10 },
  { level: 2, sb: 50, bb: 100, ante: 0, duration: 10 },
  { level: 3, sb: 75, bb: 150, ante: 0, duration: 10 },
  { level: 4, sb: 100, bb: 200, ante: 25, duration: 10 },
  { level: 5, sb: 150, bb: 300, ante: 25, duration: 10 },
  { level: 6, sb: 200, bb: 400, ante: 50, duration: 10 },
  { level: 7, sb: 300, bb: 600, ante: 75, duration: 10 },
  { level: 8, sb: 400, bb: 800, ante: 100, duration: 10 },
  { level: 9, sb: 500, bb: 1000, ante: 100, duration: 10 },
  { level: 10, sb: 600, bb: 1200, ante: 150, duration: 10 },
  { level: 11, sb: 800, bb: 1600, ante: 200, duration: 10 },
  { level: 12, sb: 1000, bb: 2000, ante: 250, duration: 10 },
  { level: 13, sb: 1500, bb: 3000, ante: 300, duration: 10 },
  { level: 14, sb: 2000, bb: 4000, ante: 400, duration: 10 },
  { level: 15, sb: 3000, bb: 6000, ante: 600, duration: 10 },
  { level: 16, sb: 4000, bb: 8000, ante: 800, duration: 10 },
  { level: 17, sb: 5000, bb: 10000, ante: 1000, duration: 10 },
  { level: 18, sb: 6000, bb: 12000, ante: 1200, duration: 10 },
  { level: 19, sb: 8000, bb: 16000, ante: 1600, duration: 10 },
  { level: 20, sb: 10000, bb: 20000, ante: 2000, duration: 10 },
];

export default function MttCreatorModal({ onClose, onCreate }: MttCreatorModalProps) {
  const [name, setName] = useState('SUNDAY SYNTHESIS');
  const [format, setFormat] = useState('9-Max');
  const [buyIn, setBuyIn] = useState(200);
  const [gtd, setGtd] = useState(50000);
  const [maxEntries, setMaxEntries] = useState('Unlimited');
  const [stack, setStack] = useState(10000);
  const [startTime, setStartTime] = useState('');
  const [lateReg, setLateReg] = useState('Lvl 8');

  const [rebuys, setRebuys] = useState(false);
  const [rebuyPeriod, setRebuyPeriod] = useState('First 8 Levels');
  const [maxRebuys, setMaxRebuys] = useState('Unlimited');

  const [addons, setAddons] = useState(false);
  const [addonStack, setAddonStack] = useState(5000);
  const [addonCost, setAddonCost] = useState(50);

  const [breakLevels, setBreakLevels] = useState(5);
  const [breakDuration, setBreakDuration] = useState(5);

  const [payout, setPayout] = useState('Top 15%');
  const [policyMode, setPolicyMode] = useState<'open' | 'bots-only' | 'hybrid'>('open');
  const [allowTakeover, setAllowTakeover] = useState(true);

  const MIN_BUY_IN = 10;
  const MAX_BUY_IN = 100000;
  const MIN_STACK = 500;
  const MAX_STACK = 1000000;
  const isValidBuyIn = buyIn >= MIN_BUY_IN && buyIn <= MAX_BUY_IN;
  const isValidStack = stack >= MIN_STACK && stack <= MAX_STACK;
  const isValidGtd = gtd >= 0;
  const isValid = isValidBuyIn && isValidStack && isValidGtd;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onCreate({
      name,
      format,
      buyIn,
      gtd,
      maxEntries,
      stack,
      startTime,
      lateReg,
      rebuys,
      rebuyPeriod,
      maxRebuys,
      addons,
      addonStack,
      addonCost,
      breakLevels,
      breakDuration,
      payout,
      policy: {
        mode: policyMode,
        allowHumanTakeover: allowTakeover,
      },
    });
  };

  const fee = Math.ceil(buyIn * 0.1); // 10% rake
  const totalBuyIn = buyIn + fee;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#020308]/80 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-3xl bg-[#0a0c1a]/95 backdrop-blur-xl border border-cyan-900/50 rounded-[40px] p-8 shadow-[0_0_50px_rgba(0,242,255,0.1)] relative my-8"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-cyan-900/30 rounded-xl flex items-center justify-center border border-cyan-500/30 shadow-[0_0_20px_rgba(0,242,255,0.2)]">
            <Settings2 className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black italic uppercase text-white tracking-tighter">
              Create MTT
            </h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
              Multi-Table Tournament
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-2">
                Tournament Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-white font-mono outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-2">
                Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-white font-mono outline-none transition-colors appearance-none"
              >
                <option>6-Max</option>
                <option>9-Max</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-2">
                Buy-In ($) <span className="text-slate-500 font-normal lowercase">+ 10% fee</span>
              </label>
              <input
                type="number"
                value={buyIn}
                onChange={(e) => setBuyIn(Number(e.target.value))}
                className="w-full bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-white font-mono outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-2">
                Guaranteed Prize Pool ($)
              </label>
              <input
                type="number"
                value={gtd}
                onChange={(e) => setGtd(Number(e.target.value))}
                className="w-full bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-white font-mono outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-2">
                Max Entries
              </label>
              <select
                value={maxEntries}
                onChange={(e) => setMaxEntries(e.target.value)}
                className="w-full bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-white font-mono outline-none transition-colors appearance-none"
              >
                <option>50</option>
                <option>100</option>
                <option>200</option>
                <option>500</option>
                <option>Unlimited</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-2">
                Starting Stack
              </label>
              <input
                type="number"
                value={stack}
                onChange={(e) => setStack(Number(e.target.value))}
                className="w-full bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-white font-mono outline-none transition-colors"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-2">
                Tournament Policy
              </label>
              <div className="flex gap-2 bg-black/60 p-1 rounded-xl border border-slate-800">
                {[
                  { id: 'open', label: 'Open' },
                  { id: 'bots-only', label: 'Bots Only' },
                  { id: 'hybrid', label: 'Hybrid' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setPolicyMode(mode.id as 'open' | 'bots-only' | 'hybrid')}
                    className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                      policyMode === mode.id
                        ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(0,242,255,0.3)]'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Allow Human Takeover
                  </p>
                  <p className="text-xs text-slate-500">
                    Permit humans to take control of agent seats mid-tourney.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowTakeover((v) => !v)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                    allowTakeover
                      ? 'bg-cyan-600 text-white border-cyan-400'
                      : 'bg-black/40 text-slate-400 border-slate-800'
                  }`}
                >
                  {allowTakeover ? 'Enabled' : 'Locked'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-2">
                Scheduled Start
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-white font-mono outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-2">
                Late Registration
              </label>
              <select
                value={lateReg}
                onChange={(e) => setLateReg(e.target.value)}
                className="w-full bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-white font-mono outline-none transition-colors appearance-none"
              >
                <option>None</option>
                <option>30min</option>
                <option>60min</option>
                <option>First 4 Levels</option>
                <option>Lvl 8</option>
                <option>Lvl 12</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-2">
                Payout Structure
              </label>
              <select
                value={payout}
                onChange={(e) => setPayout(e.target.value)}
                className="w-full bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-white font-mono outline-none transition-colors appearance-none"
              >
                <option>Top 10%</option>
                <option>Top 15%</option>
                <option>Top 20%</option>
                <option>Winner Take All</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-white/5 pt-6">
            {/* Rebuys */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-black uppercase tracking-widest text-cyan-400">
                  Rebuys
                </label>
                <button
                  type="button"
                  onClick={() => setRebuys(!rebuys)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${rebuys ? 'bg-cyan-500' : 'bg-slate-800'}`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${rebuys ? 'left-7' : 'left-1'}`}
                  />
                </button>
              </div>

              {rebuys && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-black/30 rounded-xl border border-white/5">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Period
                    </label>
                    <select
                      value={rebuyPeriod}
                      onChange={(e) => setRebuyPeriod(e.target.value)}
                      className="w-full bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none transition-colors appearance-none"
                    >
                      <option>First 4 Levels</option>
                      <option>First 8 Levels</option>
                      <option>First 12 Levels</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Max Rebuys
                    </label>
                    <select
                      value={maxRebuys}
                      onChange={(e) => setMaxRebuys(e.target.value)}
                      className="w-full bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none transition-colors appearance-none"
                    >
                      <option>1</option>
                      <option>2</option>
                      <option>Unlimited</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Add-ons */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-black uppercase tracking-widest text-cyan-400">
                  Add-ons
                </label>
                <button
                  type="button"
                  onClick={() => setAddons(!addons)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${addons ? 'bg-cyan-500' : 'bg-slate-800'}`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${addons ? 'left-7' : 'left-1'}`}
                  />
                </button>
              </div>

              {addons && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-black/30 rounded-xl border border-white/5">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Stack
                    </label>
                    <input
                      type="number"
                      value={addonStack}
                      onChange={(e) => setAddonStack(Number(e.target.value))}
                      className="w-full bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Cost ($)
                    </label>
                    <input
                      type="number"
                      value={addonCost}
                      onChange={(e) => setAddonCost(Number(e.target.value))}
                      className="w-full bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-white/5 pt-6">
            <label className="block text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-4">
              Breaks
            </label>
            <div className="flex items-center gap-4">
              <span className="text-sm font-mono text-slate-400">Every</span>
              <input
                type="number"
                value={breakLevels}
                onChange={(e) => setBreakLevels(Number(e.target.value))}
                className="w-20 bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-center text-white font-mono outline-none transition-colors"
              />
              <span className="text-sm font-mono text-slate-400">levels for</span>
              <input
                type="number"
                value={breakDuration}
                onChange={(e) => setBreakDuration(Number(e.target.value))}
                className="w-20 bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-center text-white font-mono outline-none transition-colors"
              />
              <span className="text-sm font-mono text-slate-400">minutes</span>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6">
            <label className="block text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-4">
              Blind Structure
            </label>
            <div className="bg-black/40 border border-slate-800 rounded-xl overflow-hidden">
              <div className="grid grid-cols-5 gap-4 p-3 bg-slate-900/50 border-b border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <div>Level</div>
                <div>SB</div>
                <div>BB</div>
                <div>Ante</div>
                <div>Duration</div>
              </div>
              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                {BLIND_LEVELS.map((level, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-5 gap-4 p-3 border-b border-white/5 text-sm font-mono text-slate-300 hover:bg-white/5 transition-colors"
                  >
                    <div className="text-cyan-400">{level.level}</div>
                    <div>{level.sb}</div>
                    <div>{level.bb}</div>
                    <div>{level.ante}</div>
                    <div>{level.duration}m</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-2xl p-6 mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-black italic uppercase text-white">Tournament Summary</h3>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-mono text-slate-300 flex justify-between">
                <span className="text-slate-500">Total Entry:</span>
                <span className="text-white font-bold">
                  ${totalBuyIn.toLocaleString()}{' '}
                  <span className="text-slate-500 font-normal">
                    (${buyIn.toLocaleString()} + ${fee.toLocaleString()} fee)
                  </span>
                </span>
              </p>
              <p className="text-xs font-mono text-slate-300 flex justify-between">
                <span className="text-slate-500">Guaranteed:</span>
                <span className="text-[#10b981] font-bold">${gtd.toLocaleString()}</span>
              </p>
              <p className="text-xs font-mono text-slate-300 flex justify-between">
                <span className="text-slate-500">Starting Time:</span>
                <span>{startTime ? new Date(startTime).toLocaleString() : 'Not set'}</span>
              </p>
              <p className="text-xs font-mono text-slate-300 flex justify-between">
                <span className="text-slate-500">Est. Duration:</span>
                <span>
                  ~
                  {BLIND_LEVELS.length * 10 +
                    Math.floor(BLIND_LEVELS.length / breakLevels) * breakDuration}{' '}
                  minutes
                </span>
              </p>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-transparent rounded-2xl font-black italic uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className={`flex-[2] py-4 rounded-2xl font-black italic uppercase tracking-widest text-white border-b-4 transition-all shadow-[0_0_20px_rgba(0,242,255,0.2)] ${
                isValid
                  ? 'bg-cyan-600 border-cyan-800 hover:brightness-125 active:border-b-0 active:translate-y-1'
                  : 'bg-slate-700 border-slate-800 opacity-50 cursor-not-allowed'
              }`}
            >
              Create Tournament
            </button>
            {!isValid && (
              <p className="text-[10px] font-black uppercase tracking-widest text-red-400 pt-1">
                {!isValidBuyIn && `Buy-in must be $${MIN_BUY_IN}-$${MAX_BUY_IN.toLocaleString()} `}
                {!isValidStack && `Stack must be ${MIN_STACK}-${MAX_STACK.toLocaleString()} `}
                {!isValidGtd && 'Guarantee must be ≥ $0'}
              </p>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
