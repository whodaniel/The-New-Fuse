import { AnimatePresence, motion } from 'framer-motion';
import {
  BrainCircuit,
  Loader2,
  LogOut,
  Music,
  Plus,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import {
  agentApi,
  api,
  communityApi,
  CommunityMembership,
  holdemV2Api,
  pokerApi,
  tournamentApi,
  userBotsApi,
} from './api';

// Import Contexts & Components
import { BotOrchestration } from './components/BotOrchestration';
import CashTableBrowser from './components/CashTableBrowser';
import CashierPage from './components/CashierPage';
import CommunityAppsPage from './components/CommunityAppsPage';
import HandHistory from './components/HandHistory';
import HandReplayer from './components/HandReplayer';
import LandingPage from './components/LandingPage';
import Leaderboard from './components/Leaderboard';
import LobbyPage from './components/LobbyPage';
import MttCreatorModal from './components/MttCreatorModal';
import PlayerProfile from './components/PlayerProfile';
import ProvablyFair from './components/ProvablyFair';
import SessionLogin from './components/SessionLogin';
import SettingsPage from './components/SettingsPage';
import SngCreatorModal from './components/SngCreatorModal';
import SponsorshipMarketplace from './components/SponsorshipMarketplace';
import TournamentLobby from './components/TournamentLobby';
import TournamentResults from './components/TournamentResults';
import TournamentTableView from './components/TournamentTableView';
import { GameAudioProvider, useGameAudio } from './contexts/GameAudioContext';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import {
  canAccessPokerSurface,
  derivePokerAccess,
  type PokerSurfaceGroup,
} from './security/accessPolicy';
import {
  getAllowedLobbyViews,
  getControlCenterSections,
  ROUTE_SURFACE_POLICY,
  type PokerRouteView,
} from './security/controlRegistry';

// --- BOT PROFILES ---
const BOT_PROFILES = [
  {
    id: 'agent-1',
    name: 'CYBER-9',
    temperament: 'tight_aggressive',
    style: 'TAG Shark',
    riskBps: 600,
    avatar: '/avatars/bot_1.png',
  },
  {
    id: 'agent-2',
    name: 'GHOST',
    temperament: 'loose_aggressive',
    style: 'LAG Maniac',
    riskBps: 1200,
    avatar: '/avatars/bot_2.png',
  },
  {
    id: 'agent-3',
    name: 'V-SYNC',
    temperament: 'tight_passive',
    style: 'Nit Rock',
    riskBps: 400,
    avatar: '/avatars/bot_3.png',
  },
  {
    id: 'agent-4',
    name: 'NULLSEC',
    temperament: 'balanced',
    style: 'GTO Solver',
    riskBps: 800,
    avatar: '/avatars/bot_4.png',
  },
  {
    id: 'agent-5',
    name: 'PROXY',
    temperament: 'loose_aggressive',
    style: 'Bluff Engine',
    riskBps: 1000,
    avatar: '/avatars/bot_5.png',
  },
];

const BOT_PROFILE_BY_ID = new Map(BOT_PROFILES.map((bot) => [bot.id, bot]));

const THEME = {
  felt: 'bg-[radial-gradient(circle_at_center,_#1a472a_0%,_#0d2b1a_100%)]',
  metal: 'bg-gradient-to-b from-slate-800 to-slate-900',
  wood: 'bg-[#3d1f1f]',
};

const BOT_TOURNAMENT_STARTING_STACK = 3000;
const BOT_TOURNAMENT_TABLE_ID_PREFIX = 'bot-table';
const USER_BOT_STORAGE_KEY = 'aiArcadeUserBots';
const SYSTEM_BOT_STORAGE_KEY = 'aiArcadeSystemBots';

type UserBotProfile = {
  name: string;
  temperament: string;
  riskBps: number;
  aiAssist?: boolean;
};

const loadUserBots = (): UserBotProfile[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(USER_BOT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((bot) => bot && typeof bot.name === 'string')
      .map((bot) => ({
        name:
          String(bot.name || '')
            .trim()
            .slice(0, 18) || 'CUSTOM',
        temperament: String(bot.temperament || 'balanced'),
        riskBps: Math.max(100, Math.min(2000, Number(bot.riskBps || 800))),
        aiAssist: Boolean(bot.aiAssist),
      }));
  } catch {
    return [];
  }
};

const loadSystemBots = (): any[] => {
  if (typeof window === 'undefined') return BOT_PROFILES;
  try {
    const raw = window.localStorage.getItem(SYSTEM_BOT_STORAGE_KEY);
    if (!raw) return BOT_PROFILES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : BOT_PROFILES;
  } catch {
    return BOT_PROFILES;
  }
};

const formatBotId = (name: string, index: number) => {
  const base = name.trim() || `CUSTOM_${index + 1}`;
  const slug = base
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .slice(0, 16);
  return slug || `CUSTOM_${index + 1}`;
};

type PokerView = PokerRouteView;

const VIEW_SURFACE_POLICY: Record<PokerView, PokerSurfaceGroup> = ROUTE_SURFACE_POLICY;

// --- MINI COMPONENTS ---
const Card: React.FC<{ val?: string; hidden?: boolean; index?: number }> = ({
  val,
  hidden,
  index = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, y: -20, rotateY: 180 }}
    animate={{ opacity: 1, y: 0, rotateY: 0 }}
    transition={{ duration: 0.4, delay: index * 0.1, type: 'spring' }}
    className={`w-14 h-20 sm:w-20 sm:h-28 rounded-lg border-2 ${hidden ? 'bg-[url("https://www.transparenttextures.com/patterns/carbon-fibre.png")] bg-[#0a0c1a] border-cyan-500/50 shadow-[0_0_20px_rgba(0,242,255,0.2)]' : 'bg-white border-slate-200 shadow-xl'} flex items-center justify-center font-black relative overflow-hidden z-10`}
  >
    {hidden && (
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-transparent" />
    )}
    {!hidden && val ? (
      <span
        className={`text-xl sm:text-3xl ${val.endsWith('h') || val.endsWith('d') ? 'text-[#FF0055]' : 'text-slate-900'}`}
      >
        {val.slice(0, -1)}
        <span className="text-sm sm:text-lg">
          {val.endsWith('h') ? '♥' : val.endsWith('d') ? '♦' : val.endsWith('c') ? '♣' : '♠'}
        </span>
      </span>
    ) : null}
  </motion.div>
);

const ChipStack = ({ amount }: { amount: number }) => {
  if (!amount || amount <= 0) return null;
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="flex flex-col items-center gap-1"
    >
      <div className="flex -space-y-2 flex-col-reverse">
        {[...Array(Math.min(5, Math.ceil(amount / 1000)))].map((_, i) => (
          <div
            key={i}
            className="w-8 h-3 rounded-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 border border-yellow-800 shadow-md transform rotate-x-60"
          />
        ))}
      </div>
      <div className="bg-black/80 px-3 py-1 rounded-full border border-cyan-400/30 shadow-[0_0_10px_rgba(0,242,255,0.2)]">
        <span className="text-[10px] font-mono text-cyan-400 font-bold">
          ${amount.toLocaleString()}
        </span>
      </div>
    </motion.div>
  );
};

// --- SUB-COMPONENTS ---

interface PokerTableProps {
  gameState: any;
  actionTape: any;
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  toggleBgm: () => void;
  toggleSfx: () => void;
  playHover: () => void;
  handleAction: (action: string, amount?: number) => void;
  handleTakeover: () => void;
  handleAutopilot: () => void;
  preferredControlMode: 'human' | 'hybrid' | 'agent';
  getAIInsight: () => void;
  aiInsight: string;
  setAiInsight: (v: string) => void;
  isAnalyzing: boolean;
}

const PokerTable: React.FC<PokerTableProps> = ({
  gameState,
  actionTape,
  bgmEnabled,
  sfxEnabled,
  toggleBgm,
  toggleSfx,
  playHover,
  handleAction,
  handleTakeover,
  handleAutopilot,
  preferredControlMode,
  getAIInsight,
  aiInsight,
  setAiInsight,
  isAnalyzing,
}) => {
  if (!gameState)
    return (
      <div className="flex items-center justify-center h-full text-cyan-400">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );

  const mySeatIdx = gameState.seats.findIndex((s: any) => s.isHero);
  const mySeat = gameState.seats[mySeatIdx] || { cards: [], bet: 0, stack: 0 };
  const myControlMode = String(mySeat.controlMode || 'human').toLowerCase();
  const canTakeover = myControlMode !== 'human';
  const autopilotMode =
    preferredControlMode && preferredControlMode !== 'human' ? preferredControlMode : 'agent';
  const canAutopilot = myControlMode === 'human' && autopilotMode !== 'human';
  const isMyTurn =
    gameState.turnIndex === mySeatIdx &&
    gameState.round !== 'WAITING' &&
    gameState.round !== 'SHOWDOWN';

  const getSeatPos = (i: number) => {
    const seatTotal = Math.max(2, gameState.seats.length || 0);
    const offset = mySeatIdx !== -1 ? (i - mySeatIdx + seatTotal) % seatTotal : i;
    const a = (offset / seatTotal) * 2 * Math.PI + Math.PI / 2;
    return { left: `${50 + 42 * Math.cos(a)}%`, top: `${50 + 39 * Math.sin(a)}%` };
  };

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-[#020308]">
      {/* Top Overlay: Audio & Tape */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={toggleBgm}
          className={`p-2 rounded-lg transition-colors ${bgmEnabled ? 'text-cyan-400 bg-cyan-900/30' : 'text-slate-500 hover:text-slate-300 bg-black/40'}`}
        >
          <Music className="w-4 h-4" />
        </button>
        <button
          onClick={toggleSfx}
          className={`p-2 rounded-lg transition-colors ${sfxEnabled ? 'text-cyan-400 bg-cyan-900/30' : 'text-slate-500 hover:text-slate-300 bg-black/40'}`}
        >
          {sfxEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      <div className="absolute top-4 left-4 z-40 w-[240px] max-h-[30%] rounded-xl border border-cyan-500/30 bg-black/70 backdrop-blur-sm p-3 overflow-hidden shadow-2xl hidden lg:block">
        <p className="text-[10px] text-cyan-300 uppercase tracking-[0.2em] font-black mb-2">
          Action Tape
        </p>
        <div className="space-y-1 overflow-y-auto max-h-[calc(100%-24px)] pr-1 custom-scrollbar">
          {actionTape.feed.length === 0 && (
            <p className="text-[10px] text-slate-500 italic">Awaiting tactical data...</p>
          )}
          {actionTape.feed.map((entry: any) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-[10px] font-mono text-slate-300 rounded bg-white/5 px-2 py-1 border border-white/5"
            >
              {entry.text}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 relative flex items-center justify-center p-4 sm:p-10 z-10">
        <div
          className={`relative w-full max-w-6xl aspect-[2.2/1] sm:aspect-[2.4/1] ${THEME.metal} rounded-[200px] border-4 border-[#1a1c23] shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center justify-center`}
        >
          <div className="absolute inset-0 rounded-[200px] shadow-[inset_0_0_30px_rgba(0,242,255,0.1)] pointer-events-none" />

          <div className="w-full h-full m-3 sm:m-4 bg-[#0d0f14] rounded-[190px] relative flex items-center justify-center overflow-hidden">
            <div
              className={`w-full h-full rounded-[180px] ${THEME.felt} border-[6px] border-[#0a0c1a] shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center relative`}
            >
              <div className="z-20 text-center mb-2 sm:mb-6 flex flex-col items-center">
                <ChipStack amount={gameState.pot} />
                <motion.p
                  key={gameState.pot}
                  initial={{ scale: 1.5, color: '#FFFFFF' }}
                  animate={{ scale: 1, color: '#00f2ff' }}
                  className="text-xl sm:text-4xl font-mono font-black mt-2 drop-shadow-[0_0_10px_rgba(0,242,255,0.5)]"
                >
                  ${(gameState.pot || 0).toLocaleString()}
                </motion.p>
                <p className="text-[8px] sm:text-[10px] text-slate-500 uppercase tracking-[0.3em] mt-1">
                  Main Pot
                </p>
              </div>

              <div className="flex gap-2 sm:gap-4 z-[30] bg-black/40 p-2 sm:p-4 rounded-xl border border-white/10 backdrop-blur-xl shadow-2xl shadow-black/80">
                <AnimatePresence>
                  {(gameState.communityCards || []).map((c: string, i: number) => (
                    <Card key={`comm-${i}-${c}`} val={c} index={i} />
                  ))}
                </AnimatePresence>
                {[...Array(5 - (gameState.communityCards?.length || 0))].map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="w-14 h-20 sm:w-20 sm:h-28 border-2 border-white/5 rounded-lg bg-black/40 shadow-inner"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Seats Positioned on the Table Ring */}
          {gameState.seats.map((seat: any, i: number) => {
            const isSeatTurn =
              gameState.turnIndex === i &&
              gameState.round !== 'WAITING' &&
              gameState.round !== 'SHOWDOWN';
            const isDealer = gameState.dealerIndex === i;
            const pos = getSeatPos(i);
            const zIndex = 40 + Math.floor(parseFloat(String(pos.top)));

            return (
              <div
                key={seat.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
                style={{ ...pos, zIndex }}
              >
                {seat.active ? (
                  <div className="flex flex-col items-center gap-2 relative group">
                    {isDealer && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full border-2 border-slate-300 flex items-center justify-center shadow-lg z-50">
                        <span className="text-[10px] font-black text-black">D</span>
                      </div>
                    )}

                    {/* Opponent Cards: Elevated but subject to clipping if not careful. Giving them high z-index. */}
                    {seat.cards.length > 0 && !seat.folded && !seat.isHero && (
                      <div className="absolute -top-24 sm:-top-32 flex gap-1.5 transform scale-100 bg-[#0a0c1a]/80 p-1.5 rounded-xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md z-[100]">
                        <Card
                          val={seat.cards[0] !== 'hidden' ? seat.cards[0] : undefined}
                          hidden={seat.cards[0] === 'hidden'}
                        />
                        <Card
                          val={seat.cards[1] !== 'hidden' ? seat.cards[1] : undefined}
                          hidden={seat.cards[1] === 'hidden'}
                        />
                      </div>
                    )}

                    <div
                      className={`relative w-14 h-14 sm:w-20 sm:h-20 rounded-full border-4 ${isSeatTurn ? 'border-cyan-400 shadow-[0_0_20px_rgba(0,242,255,0.6)] scale-110' : seat.folded ? 'border-slate-800 opacity-50' : 'border-slate-700'} transition-all duration-300 overflow-hidden bg-[#0a0c1a]`}
                    >
                      <img
                        src={seat.avatar}
                        className="w-full h-full object-cover"
                        alt={seat.name}
                      />
                      {seat.folded && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-xs font-black text-red-500 rotate-[-15deg]">
                            FOLD
                          </span>
                        </div>
                      )}
                    </div>

                    <div
                      className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-md border-2 text-center min-w-[90px] sm:min-w-[120px] ${isSeatTurn ? 'bg-cyan-900/30 border-cyan-400' : 'bg-[#0a0c1a]/90 border-slate-800'} backdrop-blur-sm shadow-xl`}
                    >
                      <p
                        className={`text-[9px] sm:text-[11px] font-black uppercase truncate ${isSeatTurn ? 'text-cyan-400' : 'text-slate-400'}`}
                      >
                        {seat.name}
                      </p>
                      <p className="text-xs sm:text-sm font-mono text-white font-bold">
                        ${(seat.stack || 0).toLocaleString()}
                      </p>
                    </div>

                    {seat.bet > 0 && (
                      <div className="absolute -bottom-8 sm:-bottom-10">
                        <ChipStack amount={seat.bet} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center text-slate-800 bg-black/20 backdrop-blur-sm">
                    <Plus className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Insight Overlay */}
      <AnimatePresence>
        {aiInsight && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-36 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl"
          >
            <div className="bg-[#0a0c1a]/95 backdrop-blur-xl border-2 border-cyan-400/50 rounded-xl p-4 shadow-[0_0_30px_rgba(0,242,255,0.15)] flex gap-4">
              <BrainCircuit className="w-6 h-6 text-cyan-400 mt-1 animate-pulse" />
              <div className="flex-1">
                <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">
                  ✨ Tactical Advice
                </p>
                <p className="text-sm text-slate-200 leading-relaxed font-mono">{aiInsight}</p>
              </div>
              <button onClick={() => setAiInsight('')} className="hover:bg-white/10 p-1 rounded">
                <LogOut className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Bar */}
      <div className="h-auto sm:h-32 bg-[#0a0c1a] border-t-2 border-slate-800 p-4 sm:px-10 flex flex-col sm:flex-row items-center justify-between z-[200] gap-4 sm:gap-0">
        <div className="flex items-center gap-4 sm:gap-8 w-full sm:w-auto justify-between sm:justify-start">
          {/* HERO HUD: Guaranteed visibility for user's own cards */}
          <div className="flex gap-2 bg-black/40 p-2 rounded-xl border border-cyan-500/20">
            {mySeat.cards.map((c: string, i: number) => (
              <Card key={`my-${i}`} val={c} hidden={c === 'hidden'} />
            ))}
          </div>
          <div className="text-right sm:text-left">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Table Round</p>
            <p className="text-lg sm:text-2xl font-black text-cyan-400 uppercase tracking-tighter">
              {gameState.round?.replace('_', ' ') || 'WAITING'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <div className="flex gap-2 w-full">
              <button
                disabled={!isMyTurn}
                onClick={() => handleAction('FOLD')}
                onMouseEnter={playHover}
                className="flex-1 sm:flex-none px-6 py-3 rounded-lg bg-slate-900 border-2 border-slate-800 text-xs font-black uppercase text-slate-400 hover:border-red-500 hover:text-red-500 disabled:opacity-50 transition-all"
              >
                Fold
              </button>
              <button
                disabled={!isMyTurn}
                onClick={() => handleAction('CALL')}
                onMouseEnter={playHover}
                className="flex-1 sm:flex-none px-6 py-3 rounded-lg bg-cyan-900/30 border-2 border-cyan-500/50 text-xs font-black uppercase text-cyan-400 hover:bg-cyan-600 hover:text-white disabled:opacity-50 transition-all"
              >
                {gameState.currentBet === mySeat.bet
                  ? 'Check'
                  : `Call $${gameState.currentBet - mySeat.bet}`}
              </button>
            </div>
            <button
              onClick={getAIInsight}
              onMouseEnter={playHover}
              disabled={!isMyTurn || isAnalyzing}
              className="w-full py-2 rounded-lg bg-indigo-900/30 border border-indigo-500/50 text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-900/50 transition-all disabled:opacity-50"
            >
              {isAnalyzing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}{' '}
              AI Strategy
            </button>
            {canTakeover && (
              <button
                onClick={handleTakeover}
                onMouseEnter={playHover}
                className="w-full py-2 rounded-lg bg-red-900/30 border border-red-500/50 text-[10px] font-black text-red-300 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-900/60 transition-all"
              >
                Manual Takeover
              </button>
            )}
            {canAutopilot && (
              <button
                onClick={handleAutopilot}
                onMouseEnter={playHover}
                className="w-full py-2 rounded-lg bg-emerald-900/30 border border-emerald-500/50 text-[10px] font-black text-emerald-300 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-900/60 transition-all"
              >
                Return to {autopilotMode === 'agent' ? 'Agent' : 'Hybrid'} Control
              </button>
            )}
          </div>

          <div className="hidden sm:flex h-full py-2">
            <input
              type="number"
              id="raiseAmount"
              defaultValue={gameState.currentBet + (gameState.blinds?.[1] || 0)}
              className="w-24 bg-black border-2 border-slate-800 rounded-l-lg px-3 font-mono text-cyan-400 text-sm outline-none focus:border-cyan-500 transition-colors"
            />
            <button
              disabled={!isMyTurn}
              onClick={() => {
                const val = parseInt(
                  (document.getElementById('raiseAmount') as HTMLInputElement).value
                );
                handleAction('RAISE', val);
              }}
              onMouseEnter={playHover}
              className="px-6 bg-slate-100 rounded-r-lg font-black text-xs uppercase text-black border-b-4 border-slate-400 hover:bg-white active:border-b-0 active:translate-y-1 disabled:opacity-50 transition-all"
            >
              Raise
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ControlCenterProps {
  setView: (v: PokerView) => void;
  notify: any;
}

const ControlCenter: React.FC<ControlCenterProps> = ({ setView, notify }) => {
  const sections = getControlCenterSections();

  return (
    <div className="min-h-screen bg-[#020308] text-slate-300 p-6 sm:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="bg-[#0a0c1a]/90 border border-cyan-500/30 rounded-2xl p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-2">
            Operator Admin
          </p>
          <h2 className="text-3xl font-black italic text-white uppercase">Control Center</h2>
          <p className="text-sm text-slate-400 mt-3">
            Control surfaces are preserved, but segmented by user context so player routes stay
            clean while admin/operator tooling remains available.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => setView('LOBBY')}
              className="px-4 py-2 rounded-lg bg-cyan-900/40 border border-cyan-500/40 text-cyan-300 text-xs font-black uppercase tracking-widest"
            >
              Back To Lobby
            </button>
            <a
              href="https://poker.ai-arcade.xyz/"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-lg bg-indigo-900/40 border border-indigo-500/40 text-indigo-300 text-xs font-black uppercase tracking-widest"
            >
              Open Legacy Ops Shell
            </a>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {sections.map((section) => (
            <div
              key={section.title}
              className="bg-[#0a0c1a]/80 border border-white/10 rounded-2xl p-5"
            >
              <h3 className="text-lg font-black text-white uppercase">{section.title}</h3>
              <p className="text-xs text-slate-400 mt-2">{section.blurb}</p>
              <div className="mt-4 space-y-2">
                {section.controls.map((line) => (
                  <p
                    key={line}
                    className="text-xs text-slate-200 bg-white/5 border border-white/10 rounded p-2"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <BotOrchestration onNotify={(type, title, msg) => notify(type as any, title, msg)} />
      </div>
    </div>
  );
};

// --- MAIN APP ---
function AppContent() {
  type SessionUser = {
    username: string;
    balance: number;
    avatar: string;
    email?: string;
    controlMode?: 'human' | 'hybrid' | 'agent';
  };
  const { notify } = useNotification();
  const {
    playClick,
    playHover,
    playDeal,
    playChip,
    playWin,
    bgmEnabled,
    toggleBgm,
    sfxEnabled,
    toggleSfx,
  } = useGameAudio();

  const [view, setView] = useState<PokerView>('LANDING');
  const [gameState, setGameState] = useState<any>(null);
  const [aiInsight, setAiInsight] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTableId, setActiveTableId] = useState('lobby-1');
  const [tableProtocol, setTableProtocol] = useState<'v1' | 'v2'>('v1');
  const [activeTableMeta, setActiveTableMeta] = useState<any | null>(null);
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);
  const [postLoginView, setPostLoginView] = useState<PokerView | null>(null);

  const [showSngCreator, setShowSngCreator] = useState(false);
  const [showMttCreator, setShowMttCreator] = useState(false);
  const [replayHandId, setReplayHandId] = useState<string | null>(null);

  const [user, setUser] = useState<SessionUser | null>(null);
  const [membership, setMembership] = useState<CommunityMembership | null>(null);
  const [botTournament, setBotTournament] = useState<{
    enabled: boolean;
    running: boolean;
    tableId: string;
    handNumber: number;
    stacks: Record<string, number>;
    eliminated: string[];
    championId: string | null;
    lastProcessedHandId: string | null;
  } | null>(null);
  const [actionTape, setActionTape] = useState<{
    handId: string;
    events: any[];
    lastIndex: number;
    feed: Array<{ id: string; text: string }>;
  }>({
    handId: '',
    events: [],
    lastIndex: 0,
    feed: [],
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = window as any;
    root.render_game_to_text = () =>
      JSON.stringify({
        view,
        tableId: activeTableId,
        round: gameState?.round || null,
        pot: gameState?.pot || 0,
        hero: gameState?.seats?.find((s: any) => s?.isHero) || null,
      });
    root.advanceTime = (ms: number) => {
      // No-op: React state is driven by polling; this hook is for deterministic test harnesses.
      void ms;
    };
  }, [view, activeTableId, gameState]);
  const [lastObservedState, setLastObservedState] = useState<any>(null);
  const lastInitAttemptRef = useRef(0);
  const autoJoinRef = useRef(false);
  const v2ResumeRef = useRef<{
    token: string;
    replayCursor: number;
    handId: string;
    seat: number;
  } | null>(null);
  const v2BotLoopRef = useRef<{ tableId: string; lastActionAt: number }>({
    tableId: '',
    lastActionAt: 0,
  });

  const requireMemberAccess = (contextLabel: string) => {
    const accessCheck = derivePokerAccess({
      username: user?.username,
      email: user?.email,
      membership,
    });
    if (!accessCheck.isMember) {
      notify(
        'SYSTEM',
        'Members Only',
        `${contextLabel} is restricted to TNF paid members. Connect thenewfuse.com and activate membership.`
      );
      setView('LOGIN');
      return false;
    }
    return true;
  };

  const viewPathMap: Partial<Record<PokerView, string>> = {
    LOBBY: '/',
    TABLE: '/table',
    'CONTROL CENTER': '/console',
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname || '/';
    if (path === '/console' || path === '/control-center') {
      setView('CONTROL CENTER');
      setPostLoginView('CONTROL CENTER');
      return;
    }
    if (path === '/table') {
      setView('TABLE');
      setPostLoginView('TABLE');
      return;
    }
    if (path === '/lobby') {
      setView('LOBBY');
      return;
    }
    // Default to LANDING for root or unknown paths
    setView('LANDING');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const targetPath = viewPathMap[view];
    if (!targetPath) return;
    if (window.location.pathname !== targetPath) {
      window.history.replaceState({}, '', targetPath);
    }
  }, [view]);

  useEffect(() => {
    if (view === 'CONTROL CENTER') return;
    if (!user && view !== 'LANDING' && view !== 'LOGIN') {
      setView('LOGIN');
    }
  }, [user, view]);

  useEffect(() => {
    if (view !== 'TABLE' || !user) {
      autoJoinRef.current = false;
      return;
    }
    if (!requireMemberAccess('Poker tables')) {
      autoJoinRef.current = false;
      return;
    }
    if (tableProtocol === 'v2' && gameState) return;
    if (autoJoinRef.current) return;
    autoJoinRef.current = true;
    (async () => {
      try {
        const res = await holdemV2Api.tables();
        const first = Array.isArray(res?.tables) ? res.tables[0] : null;
        if (first?.id) {
          await handleJoinCashTable(first.id, first);
          return;
        }
      } catch {
        // Fall back to existing table state if v2 tables unavailable.
      }
    })();
  }, [view, user, tableProtocol, gameState]);

  const parseStakes = (stakes: string) => {
    const nums = String(stakes || '').match(/[\d.]+/g) || [];
    if (nums.length >= 2) {
      return {
        smallBlind: Math.max(1, Math.floor(Number(nums[0]))),
        bigBlind: Math.max(1, Math.floor(Number(nums[1]))),
      };
    }
    return { smallBlind: 50, bigBlind: 100 };
  };

  const deriveGameStateFromV2 = (table: any, prevState?: any) => {
    if (!table) return prevState || null;
    const hand = table.hand || null;
    const rawSeats = Array.isArray(table.seats) ? table.seats : [];
    const explicitMax =
      Number(activeTableMeta?.maxSeats || activeTableMeta?.maxPlayers) ||
      Number(table?.maxSeats || table?.maxPlayers) ||
      (Array.isArray(table?.seats) ? table.seats.length : 0);
    const maxSeatNo = rawSeats.reduce((max: number, row: any, idx: number) => {
      const seatNo = Number.isInteger(row?.seat) ? row.seat : idx;
      return Number.isInteger(seatNo) ? Math.max(max, seatNo) : max;
    }, -1);
    const inferredCount = maxSeatNo >= 0 ? maxSeatNo + 1 : 0;
    const seatCount = Math.max(2, Math.min(9, explicitMax || inferredCount || 6));
    const seatMap = new Map(
      rawSeats
        .map((s: any, idx: number) => ({
          seat: Number.isInteger(s?.seat) ? s.seat : idx,
          row: s,
        }))
        .filter((entry) => Number.isInteger(entry.seat))
        .map((entry) => [entry.seat, entry.row])
    );
    const orderedSeats = Array.from({ length: seatCount }, (_, idx) => {
      const row = seatMap.get(idx);
      if (row) {
        return { ...row, __seatNo: idx };
      }
      return { __seatNo: idx, seat: idx, playerId: null, stack: 0 };
    });
    const seatIndexByNo = new Map(orderedSeats.map((s: any, idx: number) => [s.__seatNo, idx]));
    const actingSeat = Number.isInteger(hand?.actingSeat) ? hand.actingSeat : null;
    const buttonSeat = Number.isInteger(hand?.buttonSeat)
      ? hand.buttonSeat
      : Number.isInteger(table?.buttonSeat)
        ? table.buttonSeat
        : 0;
    const streetCommitted = hand?.streetCommitted || {};
    const committedBySeat = hand?.committedBySeat || {};
    const foldedSeats = Array.isArray(hand?.foldedSeats) ? hand.foldedSeats : [];
    const allInSeats = Array.isArray(hand?.allInSeats) ? hand.allInSeats : [];
    const holeCardsBySeat =
      hand?.holeCards && typeof hand.holeCards === 'object' ? hand.holeCards : {};
    const boardCards = Array.isArray(hand?.boardCards) ? hand.boardCards : [];
    const street = String(hand?.street || '').toLowerCase();
    const boardCount =
      street === 'flop'
        ? 3
        : street === 'turn'
          ? 4
          : street === 'river' || street === 'showdown' || hand?.status === 'settled'
            ? 5
            : 0;

    return {
      ...table,
      handId: hand?.handId || '',
      seats: orderedSeats.map((s: any, i: number) => {
        const seatNo = s.__seatNo ?? i;
        const playerId = s.playerId || null;
        const botProfile = BOT_PROFILES.find((b) => b.id === playerId);
        const inferredMode =
          String(playerId || '').startsWith('bot-') || String(playerId || '').startsWith('agent-')
            ? 'agent'
            : 'human';
        return {
          id: playerId || `seat-${seatNo}`,
          name:
            playerId === user?.username ? user.username : botProfile?.name || playerId || 'EMPTY',
          avatar:
            playerId === user?.username
              ? user.avatar
              : botProfile?.avatar || BOT_PROFILES[i % BOT_PROFILES.length]?.avatar || '',
          style: botProfile?.style || '',
          stack: s.stack || 0,
          bet: Number(streetCommitted[String(seatNo)] || 0),
          cards:
            playerId && hand
              ? playerId === user?.username && Array.isArray(holeCardsBySeat[String(seatNo)])
                ? holeCardsBySeat[String(seatNo)]
                : ['hidden', 'hidden']
              : [],
          active: !!playerId,
          folded: foldedSeats.includes(seatNo),
          isAllIn:
            allInSeats.includes(seatNo) ||
            (s.stack === 0 && Number(committedBySeat[String(seatNo)] || 0) > 0),
          isHero: playerId === user?.username,
          controlMode: s.controlMode || inferredMode,
        };
      }),
      round: hand?.street
        ? String(hand.street).toUpperCase()
        : hand?.status === 'settled'
          ? 'SHOWDOWN'
          : 'WAITING',
      communityCards: boardCards.slice(0, boardCount),
      turnIndex: actingSeat == null ? -1 : (seatIndexByNo.get(actingSeat) ?? 0),
      currentBet: hand?.currentBet || 0,
      blinds: [table?.blinds?.smallBlind || 50, table?.blinds?.bigBlind || 100],
      timeline: Array.isArray(hand?.actionLog) ? hand.actionLog : [],
      streetBets: streetCommitted,
      dealerIndex: seatIndexByNo.get(buttonSeat) ?? 0,
      pot: hand?.pot ?? 0,
      terminal: hand?.status === 'settled' || hand?.readyForSettlement || false,
      lastAction: Array.isArray(hand?.actionLog) ? hand.actionLog[hand.actionLog.length - 1] : null,
    };
  };

  const applySnapshot = (snapshot: any, prevState?: any) => {
    if (!snapshot) return prevState || null;
    if (
      prevState &&
      snapshot.communityCards &&
      prevState.communityCards &&
      snapshot.communityCards.length > prevState.communityCards.length
    ) {
      playDeal();
    }
    if (snapshot.terminal && (!prevState || !prevState.terminal)) playWin();

    const rawSeats = Array.isArray(snapshot.seats) ? snapshot.seats : [];
    const orderedSeats = rawSeats
      .map((s: any, idx: number) => ({
        ...s,
        __seatNo: Number.isInteger(s?.seat) ? s.seat : idx,
      }))
      .sort((a: any, b: any) => a.__seatNo - b.__seatNo);
    const seatIndexByNo = new Map(orderedSeats.map((s: any, idx: number) => [s.__seatNo, idx]));
    const actingSeat = Number.isInteger(snapshot.actingSeat) ? snapshot.actingSeat : 0;
    const buttonSeat = Number.isInteger(snapshot.buttonSeat) ? snapshot.buttonSeat : 0;

    return {
      ...snapshot,
      seats: orderedSeats.map((s: any, i: number) => {
        const seatNo = s.__seatNo ?? i;
        const inferredMode =
          String(s.playerId || '').startsWith('bot-') ||
          String(s.playerId || '').startsWith('agent-')
            ? 'agent'
            : 'human';
        return {
          id: s.playerId || `seat-${seatNo}`,
          name:
            s.playerId === user?.username
              ? user.username
              : BOT_PROFILES.find((b) => b.id === s.playerId)?.name || s.playerId || 'EMPTY',
          avatar:
            s.playerId === user?.username
              ? user.avatar
              : BOT_PROFILES.find((b) => b.id === s.playerId)?.avatar ||
                BOT_PROFILES[i % BOT_PROFILES.length]?.avatar ||
                '',
          style: BOT_PROFILES.find((b) => b.id === s.playerId)?.style || '',
          stack: s.stack || 0,
          bet: snapshot.streetBets?.[String(seatNo)] || 0,
          cards:
            snapshot.holeCards?.[String(seatNo)] ||
            (s.playerId && s.playerId !== user?.username && snapshot.street
              ? ['hidden', 'hidden']
              : []),
          active: !!s.playerId,
          folded: s.folded || false,
          isAllIn: s.stack === 0 && (snapshot.streetBets?.[String(seatNo)] || 0) > 0,
          isHero: s.playerId === user?.username,
          controlMode: s.playerId === user?.username ? user?.controlMode || 'human' : inferredMode,
        };
      }),
      round: snapshot.street
        ? snapshot.street.toUpperCase()
        : snapshot.terminal
          ? 'SHOWDOWN'
          : 'WAITING',
      communityCards: snapshot.boardCards || snapshot.communityCards || [],
      turnIndex: seatIndexByNo.get(actingSeat) ?? 0,
      currentBet: snapshot.currentBet || 0,
      blinds: [snapshot.blinds?.smallBlind || 100, snapshot.blinds?.bigBlind || 200],
      timeline: Array.isArray(snapshot.timeline)
        ? snapshot.timeline
        : Array.isArray(snapshot.actionTimeline)
          ? snapshot.actionTimeline
          : [],
      streetBets: snapshot.streetBets || {},
      handId: snapshot.handId,
      dealerIndex: seatIndexByNo.get(buttonSeat) ?? 0,
      pot: snapshot.pot ?? 0,
      terminal: snapshot.terminal ?? false,
      lastAction: snapshot.lastAction || null,
    };
  };

  // --- Poll table state from backend ---
  useEffect(() => {
    if (view !== 'TABLE' || !user) return;
    let active = true;
    const poll = async () => {
      if (tableProtocol === 'v2') {
        try {
          const res = await holdemV2Api.state(activeTableId, user.username);
          if (active && res.ok && res.table) {
            const table = res.table;
            setGameState((prev: any) => {
              const next = deriveGameStateFromV2(table, prev);
              if (
                prev &&
                next?.communityCards &&
                prev.communityCards &&
                next.communityCards.length > prev.communityCards.length
              ) {
                playDeal();
              }
              if (next?.terminal && !prev?.terminal) playWin();
              return next;
            });

            const seatRow = Array.isArray(table.seats)
              ? table.seats.find((s: any) => s && s.playerId === user.username)
              : null;
            const handId = table.hand?.handId || '';
            if (seatRow && (!v2ResumeRef.current || v2ResumeRef.current.handId !== handId)) {
              holdemV2Api
                .resume(table.tableId, user.username)
                .then((resumeRes) => {
                  if (!active) return;
                  if (resumeRes?.ok && resumeRes.resume) {
                    v2ResumeRef.current = {
                      token: resumeRes.resume.token,
                      replayCursor: Number(resumeRes.resume.replayCursor || 0),
                      handId: String(resumeRes.resume.handId || ''),
                      seat: Number(resumeRes.resume.seat || 0),
                    };
                  }
                })
                .catch(() => {});
            }

            if (String(activeTableId).startsWith('bot-table-') && table?.hand?.actingSeat != null) {
              const actingSeat = Number(table.hand.actingSeat);
              const actingRow = Array.isArray(table.seats)
                ? table.seats.find((row: any) => Number(row?.seat) === actingSeat)
                : null;
              if (actingRow && actingRow.playerId) {
                const isUserSeat = actingRow.playerId === user.username;
                const control = String(
                  actingRow.controlMode || (isUserSeat ? user.controlMode : '')
                ).toLowerCase();
                if (control !== 'human') {
                  const now = Date.now();
                  if (
                    v2BotLoopRef.current.tableId !== table.tableId ||
                    now - v2BotLoopRef.current.lastActionAt > 900
                  ) {
                    v2BotLoopRef.current = { tableId: table.tableId, lastActionAt: now };
                    holdemV2Api
                      .resume(table.tableId, actingRow.playerId)
                      .then(async (botResume) => {
                        if (!botResume?.ok || !botResume.resume) return;
                        const legal = Array.isArray(botResume.agent?.legalActions)
                          ? botResume.agent.legalActions
                              .map((row: any) =>
                                typeof row === 'string' ? row : String(row?.action || '')
                              )
                              .filter(Boolean)
                          : [];
                        let botAction = 'check';
                        if (legal.includes('check')) botAction = 'check';
                        else if (legal.includes('call')) botAction = 'call';
                        else if (legal.includes('fold')) botAction = 'fold';
                        else if (legal.includes('allin')) botAction = 'allin';
                        else if (legal.length > 0) botAction = legal[0];
                        const toCall = Number(botResume.agent?.helper?.toCall || 0);
                        const minRaiseTo = Number(botResume.agent?.helper?.minRaiseTo || 0);
                        const amount =
                          botAction === 'call'
                            ? toCall
                            : botAction === 'raise' || botAction === 'bet'
                              ? Math.max(minRaiseTo, toCall)
                              : 0;
                        await holdemV2Api.action({
                          tableId: table.tableId,
                          playerId: actingRow.playerId,
                          action: botAction,
                          amount,
                          resumeToken: botResume.resume.token,
                          expectedReplayCursor: Number(botResume.resume.replayCursor || 0),
                        });
                      })
                      .catch(() => {});
                  }
                }
              }
            }
          }
        } catch (e) {
          console.warn('V2 table poll failed', e);
        }
        return;
      }

      try {
        const res = await pokerApi.getState(activeTableId);
        if (active && res.ok && res.snapshot) {
          setGameState((prev: any) => applySnapshot(res.snapshot, prev));
          // Auto-trigger bot actions
          const snap = res.snapshot;
          const activeSeat = snap.seats?.[snap.actingSeat];
          if (
            !snap.terminal &&
            snap.street &&
            (!activeSeat || activeSeat.playerId !== user.username)
          ) {
            await pokerApi.autoRound(activeTableId, snap.handId, snap.seats, 12).catch(() => {});
          }
        }
      } catch (e) {
        console.warn('Table poll failed', e);
        const message = (e as Error)?.message || '';
        if (
          message.toLowerCase().includes('no table snapshot') &&
          botTournament?.running &&
          Date.now() - lastInitAttemptRef.current > 2500
        ) {
          lastInitAttemptRef.current = Date.now();
          launchBotTournamentHand(botTournament).catch(() => {});
        }
      }
    };
    poll();
    const t = setInterval(poll, 1500);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [view, activeTableId, user, playDeal, playWin, tableProtocol]);

  const toActionLine = (evt: any, idx: number, handId: string) => {
    const actor = evt?.agentId || evt?.playerId || `Seat ${evt?.seat ?? '?'}`;
    const decision = (evt?.action || evt?.decision || evt?.type || 'act').toString().toUpperCase();
    const amount = Number(evt?.spend ?? evt?.amount ?? evt?.bet ?? 0);
    const street = evt?.street ? ` [${String(evt.street).toUpperCase()}]` : '';
    const amountChunk = amount > 0 ? ` $${amount}` : '';
    return {
      id: `${handId}-${idx}-${actor}-${decision}`,
      text: `${actor} ${decision}${amountChunk}${street}`,
    };
  };

  useEffect(() => {
    if (view !== 'TABLE' || !gameState) return;
    const events = Array.isArray(gameState.timeline) ? gameState.timeline : [];
    setActionTape((prev) => {
      const handId = String(gameState.handId || '');
      if (!handId) return prev;
      if (prev.handId !== handId) {
        return { handId, events, lastIndex: 0, feed: [] };
      }
      if (events.length !== prev.events.length) {
        return { ...prev, events };
      }
      return prev;
    });
  }, [view, gameState]);

  useEffect(() => {
    if (view !== 'TABLE') return;
    if (!actionTape.events.length) return;
    if (actionTape.lastIndex >= actionTape.events.length) return;
    setActionTape((prev) => {
      if (prev.lastIndex >= prev.events.length) return prev;
      const newEvents = prev.events.slice(prev.lastIndex);
      if (newEvents.length === 0) return prev;
      const newLines = newEvents.map((evt, idx) =>
        toActionLine(evt, prev.lastIndex + idx, prev.handId)
      );
      return {
        ...prev,
        lastIndex: prev.events.length,
        feed: [...prev.feed.slice(-59), ...newLines].slice(-60),
      };
    });
    playChip();
  }, [view, actionTape.events.length, actionTape.lastIndex, playChip]);

  useEffect(() => {
    if (view !== 'TABLE' || !gameState) return;
    if (Array.isArray(gameState.timeline) && gameState.timeline.length > 0) {
      setLastObservedState(gameState);
      return;
    }
    if (!lastObservedState || lastObservedState.handId !== gameState.handId) {
      setLastObservedState(gameState);
      return;
    }

    const deltaLines: Array<{ id: string; text: string }> = [];
    const prevById = new Map((lastObservedState.seats || []).map((s: any) => [s.id, s]));
    for (const seat of gameState.seats || []) {
      const prev = prevById.get(seat.id);
      if (!prev) continue;
      if (!!seat.folded && !prev.folded) {
        deltaLines.push({
          id: `${gameState.handId}-${seat.id}-fold-${Date.now()}`,
          text: `${seat.name || seat.id} FOLD`,
        });
      }
      if (Number(seat.bet || 0) > Number(prev.bet || 0)) {
        const delta = Number(seat.bet || 0) - Number(prev.bet || 0);
        deltaLines.push({
          id: `${gameState.handId}-${seat.id}-bet-${Date.now()}`,
          text: `${seat.name || seat.id} BET $${delta}`,
        });
      }
      if (Number(seat.stack || 0) === 0 && Number(prev.stack || 0) > 0) {
        deltaLines.push({
          id: `${gameState.handId}-${seat.id}-allin-${Date.now()}`,
          text: `${seat.name || seat.id} ALL-IN`,
        });
      }
    }
    if (gameState.round && gameState.round !== lastObservedState.round) {
      deltaLines.push({
        id: `${gameState.handId}-street-${Date.now()}`,
        text: `STREET ${String(gameState.round).toUpperCase()}`,
      });
    }

    if (deltaLines.length > 0) {
      setActionTape((prev) => ({
        ...prev,
        feed: [...prev.feed.slice(-59), ...deltaLines].slice(-60),
      }));
    }
    setLastObservedState(gameState);
  }, [view, gameState, lastObservedState]);

  useEffect(() => {
    if (
      !botTournament?.enabled ||
      !botTournament.running ||
      !gameState?.terminal ||
      !gameState?.handId
    ) {
      return;
    }
    if (gameState.handId === botTournament.lastProcessedHandId) return;

    const observedStacks = { ...botTournament.stacks };
    for (const seat of gameState.seats || []) {
      if (seat?.id) {
        observedStacks[seat.id] = Number(seat.stack || 0);
      }
    }

    const newlyEliminated = BOT_PROFILES.filter(
      (b) => observedStacks[b.id] === 0 && !botTournament.eliminated.includes(b.id)
    ).map((b) => b.id);

    const nextState = {
      ...botTournament,
      stacks: observedStacks,
      eliminated: [...botTournament.eliminated, ...newlyEliminated],
      lastProcessedHandId: gameState.handId,
    };

    setBotTournament(nextState);

    const remaining = BOT_PROFILES.filter((b) => (observedStacks[b.id] || 0) > 0);
    if (remaining.length <= 1) {
      const champion = remaining[0]?.id || null;
      setBotTournament((prev) =>
        prev
          ? {
              ...prev,
              running: false,
              championId: champion,
            }
          : prev
      );
      if (champion) {
        const champName = BOT_PROFILES.find((b) => b.id === champion)?.name || champion;
        notify('SUCCESS', 'Tournament Complete', `${champName} won the all-bot tournament.`);
      } else {
        notify('SYSTEM', 'Tournament Complete', 'No remaining players in bot tournament.');
      }
      return;
    }

    const timer = setTimeout(() => {
      launchBotTournamentHand(nextState).catch(() => {});
    }, 1700);
    return () => clearTimeout(timer);
  }, [botTournament, gameState, notify]);

  const handleLogin = async (
    username: string,
    avatar: string,
    email?: string,
    controlMode?: 'human' | 'hybrid' | 'agent'
  ) => {
    setUser({
      username,
      avatar,
      balance: 100000,
      controlMode: controlMode || 'human',
      ...(email ? { email } : {}),
    });
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('tnf_identity', username);
      if (email) window.localStorage.setItem('tnf_email', email);
    }

    let resolvedMembership: CommunityMembership | null = null;
    try {
      const byUsername = await communityApi.membership(username);
      if (byUsername?.exists && byUsername.membership) {
        resolvedMembership = byUsername.membership as CommunityMembership;
      } else if (email) {
        const byEmail = await communityApi.membership(email);
        if (byEmail?.exists && byEmail.membership) {
          resolvedMembership = byEmail.membership as CommunityMembership;
        }
      }
    } catch {
      resolvedMembership = null;
    }

    setMembership(resolvedMembership);
    playWin();
    notify('SUCCESS', 'Authentication Successful', `Welcome to the Neural Network, ${username}.`);
    if (postLoginView) {
      setView(postLoginView);
      setPostLoginView(null);
    } else {
      setView('LOBBY');
    }
  };

  const handleJoinCashTable = async (tableId?: string, tableMeta?: any) => {
    if (!user) return;
    if (!requireMemberAccess('Cash games')) return;
    playClick();
    const tid = tableId || 'lobby-1';
    setActiveTableId(tid);
    setTableProtocol('v2');
    setActiveTableMeta(tableMeta || null);
    setActiveTournamentId(null);
    setActionTape({ handId: '', events: [], lastIndex: 0, feed: [] });
    setGameState(null);
    v2ResumeRef.current = null;
    v2BotLoopRef.current = { tableId: tid, lastActionAt: 0 };
    notify('SYSTEM', 'Connecting to Table', 'Syncing v2 cash table state...');
    setView('TABLE');

    let table = null;
    try {
      const res = await holdemV2Api.state(tid, user.username);
      if (res?.ok && res.table) table = res.table;
    } catch {
      table = null;
    }

    if (!table) {
      const seatCount = Math.max(
        2,
        Math.min(9, Number(tableMeta?.maxPlayers || tableMeta?.maxSeats || 6))
      );
      const { smallBlind, bigBlind } = parseStakes(tableMeta?.stakes || '');
      try {
        const createRes = await holdemV2Api.createTable({
          tableId: tid,
          mode: 'cash',
          maxSeats: seatCount,
          smallBlind,
          bigBlind,
          ante: 0,
        });
        if (createRes?.ok && createRes.table) table = createRes.table;
      } catch {
        table = null;
      }
    }

    if (!table) {
      notify('ERROR', 'Table Unavailable', 'Unable to load a v2 cash table.');
      setView('LOBBY');
      return;
    }

    const seatCount = Math.max(
      2,
      Math.min(9, Number(tableMeta?.maxPlayers || tableMeta?.maxSeats || 6))
    );
    const canAutoSpawn = !String(tid).startsWith('bot-table-');
    const spawnFallbackTable = async (reason: string) => {
      if (!canAutoSpawn) return false;
      const fallbackId = `bot-table-${Date.now()}`;
      notify('SYSTEM', 'Table Full', reason);
      await handleJoinCashTable(fallbackId, {
        ...(tableMeta || {}),
        name: `${tableMeta?.name || 'AUTO TABLE'} (Copy)`,
        maxPlayers: seatCount,
        maxSeats: seatCount,
        type: tableMeta?.type || '6-Max',
        stakes: tableMeta?.stakes || '$1/$2',
      });
      return true;
    };

    const findOpenSeat = (rows: any[]) => {
      const occupied = new Set(
        (Array.isArray(rows) ? rows : []).map((row: any, idx: number) =>
          Number.isInteger(row?.seat) ? row.seat : idx
        )
      );
      for (let i = 0; i < seatCount; i += 1) {
        if (!occupied.has(i)) return i;
      }
      return -1;
    };

    const existingSeat = Array.isArray(table.seats)
      ? table.seats.find((s: any) => s && s.playerId === user.username)
      : null;

    if (!existingSeat) {
      const openSeat = findOpenSeat(table.seats || []);
      if (openSeat < 0) {
        const spawned = await spawnFallbackTable(
          'No open seats available. Spinning up a fresh table for you.'
        );
        if (spawned) return;
        notify('ERROR', 'Table Full', 'No open seats available.');
        setView('LOBBY');
        return;
      }
      const stack = Math.max(1000, Math.min(user.balance || 0, 20000));
      try {
        const seatRes = await holdemV2Api.seat({
          tableId: tid,
          playerId: user.username,
          seat: openSeat,
          stack,
          autoPostBlinds: true,
          controlMode: user.controlMode || 'human',
        });
        if (seatRes?.ok && seatRes.table) table = seatRes.table;
      } catch (err) {
        const message = String((err as Error)?.message || 'Unable to seat.');
        const lower = message.toLowerCase();
        if (
          lower.includes('full') ||
          lower.includes('no open') ||
          lower.includes('seat') ||
          lower.includes('occupied')
        ) {
          const spawned = await spawnFallbackTable(
            'Seat lock detected. Launching a new table to keep you in action.'
          );
          if (spawned) return;
        }
        notify('ERROR', 'Seat Failed', message);
        setView('LOBBY');
        return;
      }
    }

    if (String(tid).startsWith('bot-table-')) {
      const occupied = new Set(
        (Array.isArray(table.seats) ? table.seats : []).map((row: any, idx: number) =>
          Number.isInteger(row?.seat) ? row.seat : idx
        )
      );
      const emptySeats: number[] = [];
      for (let i = 0; i < seatCount; i += 1) {
        if (!occupied.has(i)) emptySeats.push(i);
      }
      for (let i = 0; i < emptySeats.length; i += 1) {
        const seatNo = emptySeats[i];
        const bot = BOT_PROFILES[i % BOT_PROFILES.length];
        if (!bot) continue;
        try {
          await holdemV2Api.seat({
            tableId: tid,
            playerId: bot.id,
            seat: seatNo,
            stack: 20000,
            autoPostBlinds: true,
            controlMode: 'agent',
          });
        } catch {
          // Ignore seat conflicts.
        }
      }
      try {
        const refreshed = await holdemV2Api.state(tid, user.username);
        if (refreshed?.ok && refreshed.table) table = refreshed.table;
      } catch {
        // Ignore refresh failures.
      }
    }

    try {
      const resumeRes = await holdemV2Api.resume(tid, user.username);
      if (resumeRes?.ok && resumeRes.resume) {
        v2ResumeRef.current = {
          token: resumeRes.resume.token,
          replayCursor: Number(resumeRes.resume.replayCursor || 0),
          handId: String(resumeRes.resume.handId || ''),
          seat: Number(resumeRes.resume.seat || 0),
        };
      }
      if (resumeRes?.state) table = resumeRes.state;
    } catch {
      // Resume is required for actions but we can still render state.
    }

    holdemV2Api.setConnection(tid, user.username, true).catch(() => {});

    if (!table.hand || table.hand.status === 'settled') {
      try {
        const startRes = await holdemV2Api.startHand(tid);
        if (startRes?.ok && startRes.table) table = startRes.table;
        const resumeRes = await holdemV2Api.resume(tid, user.username);
        if (resumeRes?.ok && resumeRes.resume) {
          v2ResumeRef.current = {
            token: resumeRes.resume.token,
            replayCursor: Number(resumeRes.resume.replayCursor || 0),
            handId: String(resumeRes.resume.handId || ''),
            seat: Number(resumeRes.resume.seat || 0),
          };
        }
      } catch {
        // Table may already be active or not have enough players.
      }
    }

    setGameState((prev: any) => deriveGameStateFromV2(table, prev));
  };

  const setSeatControlMode = async (mode: 'human' | 'hybrid' | 'agent') => {
    if (!user) return;
    try {
      if (tableProtocol === 'v2') {
        const res = await holdemV2Api.control(activeTableId, user.username, mode);
        if (res?.ok && res.table) {
          setGameState((prev: any) => deriveGameStateFromV2(res.table, prev));
        }
      } else if (activeTournamentId) {
        await tournamentApi.control(activeTournamentId, user.username, mode);
      }
    } catch (err) {
      notify(
        'ERROR',
        'Control Update Failed',
        String((err as Error)?.message || 'Unable to update control mode.')
      );
    }
  };

  const handleTakeover = async () => {
    await setSeatControlMode('human');
    notify('SUCCESS', 'Manual Control', 'Autopilot disengaged. You are now in control.');
  };

  const handleAutopilot = async () => {
    const preferred = user?.controlMode || 'agent';
    await setSeatControlMode(preferred);
    notify('SUCCESS', 'Autopilot Engaged', 'Control returned to your agent profile.');
  };

  const handleJoinTable = async (tableId?: string) => {
    if (!user) return;
    if (!requireMemberAccess('Tournaments')) return;
    playClick();
    const tid = tableId || 'lobby-1';
    setActiveTableId(tid);
    setTableProtocol('v1');
    setActiveTableMeta(null);
    setActiveTournamentId(null);
    setActiveTournamentId(tid);
    v2ResumeRef.current = null;
    v2BotLoopRef.current = { tableId: '', lastActionAt: 0 };
    notify('SYSTEM', 'Connecting to Node', 'Establishing secure connection to table...');
    setView('TABLE');

    let userBots: any[] = [];
    try {
      const userBotsRes = await userBotsApi.list();
      userBots = userBotsRes.ok ? userBotsRes.data : [];
    } catch (err) {
      console.warn('Failed to load user bots, continuing with system bots.', err);
      userBots = [];
    }

    try {
      const existing = await pokerApi.getState(tid);
      if (existing?.ok && existing.snapshot) {
        setGameState((prev: any) => applySnapshot(existing.snapshot, prev));
        return;
      }
    } catch (err) {
      // Fall through and init a new table if none exists.
    }
    const sysBots = loadSystemBots();
    const maxBots = 5;
    const customBots = userBots.slice(0, maxBots).map((bot, idx) => ({
      playerId: formatBotId(bot.name, idx),
      agentId: formatBotId(bot.name, idx),
      stack: 100000,
      temperament: bot.temperament,
      maxRiskBps: bot.riskBps,
      aiAssist: bot.aiAssist,
    }));
    const fallbackBots = sysBots
      .filter((b) => !customBots.find((c) => c.playerId === b.id))
      .slice(0, Math.max(0, maxBots - customBots.length))
      .map((b) => ({
        playerId: b.id,
        agentId: b.id,
        stack: 100000,
        temperament: b.temperament,
        maxRiskBps: b.riskBps,
      }));
    const botSeats = [...customBots, ...fallbackBots];

    // Register bots with distinct personalities
    for (const bot of botSeats) {
      await agentApi.register(bot.playerId, bot.temperament, bot.maxRiskBps);
    }

    // Init a new hand
    const seats = [
      { playerId: user.username, stack: 100000, temperament: 'balanced', maxRiskBps: 700 },
      ...botSeats,
    ];
    const handId = 'hand-' + Date.now();
    try {
      const initRes = await pokerApi.initTableState(tid, handId, seats, 0, 0);
      if (initRes?.ok && initRes.snapshot) {
        setGameState((prev: any) => applySnapshot(initRes.snapshot, prev));
      }
      await pokerApi.autoRound(tid, handId, seats).catch(() => {});
    } catch {
      notify('ERROR', 'Table Init Failed', 'Poker engine did not accept the table payload.');
      return;
    }
  };

  const handleLeaveTable = () => {
    playClick();
    setGameState(null);
    setTableProtocol('v1');
    setActiveTableMeta(null);
    v2ResumeRef.current = null;
    v2BotLoopRef.current = { tableId: '', lastActionAt: 0 };
    if (tableProtocol === 'v2' && user) {
      holdemV2Api.setConnection(activeTableId, user.username, false).catch(() => {});
    }
    setView('LOBBY');
  };

  const launchBotTournamentHand = async (state: {
    enabled: boolean;
    running: boolean;
    tableId: string;
    handNumber: number;
    stacks: Record<string, number>;
    eliminated: string[];
    championId: string | null;
    lastProcessedHandId: string | null;
  }) => {
    const activeBots = BOT_PROFILES.filter((b) => (state.stacks[b.id] || 0) > 0);
    if (activeBots.length <= 1) {
      const champion = activeBots[0]?.id || null;
      setBotTournament((prev) =>
        prev
          ? {
              ...prev,
              running: false,
              championId: champion,
            }
          : prev
      );
      if (champion) {
        const champName = BOT_PROFILES.find((b) => b.id === champion)?.name || champion;
        notify('SUCCESS', 'Tournament Complete', `${champName} won the all-bot tournament.`);
      } else {
        notify('SYSTEM', 'Tournament Complete', 'No remaining players in bot tournament.');
      }
      return;
    }

    const nextHandNumber = state.handNumber + 1;
    const handId = `bot-hand-${Date.now()}-${nextHandNumber}`;
    const seats = activeBots.map((b) => ({
      playerId: b.id,
      agentId: b.id,
      stack: state.stacks[b.id],
      temperament: b.temperament,
      maxRiskBps: b.riskBps,
    }));
    try {
      const initRes = await pokerApi.initTableState(state.tableId, handId, seats, 0, 0);
      if (initRes?.ok && initRes.snapshot) {
        setGameState((prev: any) => applySnapshot(initRes.snapshot, prev));
      }
    } catch (err) {
      notify('ERROR', 'Tournament Error', 'Poker engine rejected the tournament hand.');
      setBotTournament((prev) => (prev ? { ...prev, running: false } : prev));
      return;
    }
    setBotTournament((prev) =>
      prev
        ? {
            ...prev,
            running: true,
            handNumber: nextHandNumber,
          }
        : prev
    );
    await pokerApi.autoRound(state.tableId, handId, seats, 12).catch(() => {});
    // Further action progression is driven by table polling to avoid rate-limit bursts.
  };

  const startBotTournament = async () => {
    if (!requireMemberAccess('Tournaments')) return;
    const tableId = `${BOT_TOURNAMENT_TABLE_ID_PREFIX}-${Date.now()}`;
    const initialStacks = Object.fromEntries(
      BOT_PROFILES.map((b) => [b.id, BOT_TOURNAMENT_STARTING_STACK])
    ) as Record<string, number>;

    const initialState = {
      enabled: true,
      running: true,
      tableId,
      handNumber: 0,
      stacks: initialStacks,
      eliminated: [],
      championId: null,
      lastProcessedHandId: null,
    };

    setActionTape({ handId: '', events: [], lastIndex: 0, feed: [] });
    setGameState(null);
    setActiveTableId(tableId);
    setTableProtocol('v1');
    v2ResumeRef.current = null;
    v2BotLoopRef.current = { tableId: '', lastActionAt: 0 };
    setBotTournament(initialState);
    notify('SYSTEM', 'Tournament Boot', 'Launching full all-bot tournament.');
    setView('TABLE');
    try {
      await launchBotTournamentHand(initialState);
    } catch (err) {
      setBotTournament((prev) => (prev ? { ...prev, running: false, enabled: false } : prev));
      setView('LOBBY');
      notify('ERROR', 'Tournament Error', String((err as Error)?.message || 'Failed to boot'));
    }
  };

  const stopBotTournament = () => {
    setBotTournament((prev) => (prev ? { ...prev, running: false, enabled: false } : prev));
    notify('SYSTEM', 'Tournament Halted', 'Bot tournament stopped.');
  };

  const handleAction = async (type: string, amount: number = 0) => {
    if (!gameState || !user) return;
    const actionMap: Record<string, string> = {
      FOLD: 'fold',
      CALL: 'call',
      RAISE: 'raise',
      CHECK: 'check',
    };
    const action = actionMap[type] || type.toLowerCase();
    if (action === 'fold') playClick();
    else playChip();

    if (tableProtocol === 'v2') {
      try {
        const resumeRes = await holdemV2Api.resume(activeTableId, user.username);
        if (!resumeRes?.ok || !resumeRes.resume) throw new Error('Resume failed');
        const helper = resumeRes.agent?.helper || {};
        const minRaiseTo = Number(helper.minRaiseTo || 0);
        const toCall = Number(helper.toCall || 0);
        let resolvedAction = action;
        let resolvedAmount = amount;
        if (action === 'call') resolvedAmount = toCall;
        if (action === 'raise' || action === 'bet') {
          resolvedAmount = Math.max(minRaiseTo || 0, amount || 0);
        }
        if (action === 'check' && toCall > 0) {
          resolvedAction = 'call';
          resolvedAmount = toCall;
        }
        v2ResumeRef.current = {
          token: resumeRes.resume.token,
          replayCursor: Number(resumeRes.resume.replayCursor || 0),
          handId: String(resumeRes.resume.handId || ''),
          seat: Number(resumeRes.resume.seat || 0),
        };
        const actionRes = await holdemV2Api.action({
          tableId: activeTableId,
          playerId: user.username,
          action: resolvedAction,
          amount: resolvedAmount,
          resumeToken: resumeRes.resume.token,
          expectedReplayCursor: Number(resumeRes.resume.replayCursor || 0),
        });
        if (actionRes?.ok && actionRes.table) {
          setGameState((prev: any) => deriveGameStateFromV2(actionRes.table, prev));
        }
      } catch (err) {
        notify(
          'ERROR',
          'Action Failed',
          String((err as Error)?.message || 'Could not apply action.')
        );
      }
      return;
    }

    const mySeatIdx = gameState.seats.findIndex((s: any) => s.isHero);
    if (mySeatIdx === -1) return;
    await pokerApi.playerAction(activeTableId, mySeatIdx, action, amount).catch(console.error);
    setTimeout(() => {
      pokerApi.autoRound(activeTableId, gameState.handId || '', gameState.seats).catch(() => {});
    }, 500);
  };

  const handleCreateSng = async (config: any) => {
    playClick();
    setShowSngCreator(false);
    try {
      const maxPlayers = config.format === 'Heads-Up' ? 2 : config.format === '9-Max' ? 9 : 6;
      await tournamentApi.create({
        tournamentId: `sng-${Date.now()}`,
        type: 'sng',
        maxPlayers,
        tableSize: maxPlayers,
        buyInUnits: Number(config.buyIn || 100),
        startStack: Number(config.stack || 5000),
        policy: config.policy,
      });
      notify(
        'SUCCESS',
        'Tournament Created',
        `${config.name || 'SNG'} is now open for registration.`
      );
    } catch {
      notify('ERROR', 'Creation Failed', 'Could not create tournament.');
    }
  };

  const handleCreateMtt = async (config: any) => {
    playClick();
    setShowMttCreator(false);
    try {
      const tableSize = config.format === '6-Max' ? 6 : 9;
      const maxPlayers =
        String(config.maxEntries || '').toLowerCase() === 'unlimited'
          ? 180
          : Number(config.maxEntries || 180);
      await tournamentApi.create({
        tournamentId: `mtt-${Date.now()}`,
        type: 'mtt',
        maxPlayers,
        tableSize,
        buyInUnits: Number(config.buyIn || 200),
        startStack: Number(config.stack || 10000),
        policy: config.policy,
      });
      notify(
        'SUCCESS',
        'Tournament Created',
        `${config.name || 'MTT'} is now open for registration.`
      );
    } catch {
      notify('ERROR', 'Creation Failed', 'Could not create tournament.');
    }
  };

  const callGemini = async (prompt: string) => {
    try {
      const json = await api('/api/gemini/content', {
        method: 'POST',
        body: {
          contents: prompt,
          config: { systemInstruction: 'You are a professional poker strategy engine.' },
          model: 'gemini-2.0-flash',
        },
      });
      return json.candidates?.[0]?.content?.parts?.[0]?.text || 'No tactical advice available.';
    } catch {
      return 'Error connecting to tactical engine.';
    }
  };

  const getAIInsight = async () => {
    if (!gameState) return;
    const mySeat = gameState.seats.find((s: any) => s.isHero);
    if (!mySeat || mySeat.cards.length === 0) return;
    playClick();
    setIsAnalyzing(true);
    const prompt = `Cards: ${mySeat.cards.join(', ')}. Board: ${(gameState.communityCards || []).join(', ')}. Pot: $${gameState.pot}. Action: ${gameState.round}. Current Bet to call: $${(gameState.currentBet || 0) - (mySeat.bet || 0)}. Recommendation? Keep it under 20 words, brutalist cyberpunk tone.`;
    const insight = await callGemini(prompt);
    setAiInsight(insight);
    setIsAnalyzing(false);
  };

  const access = derivePokerAccess({
    username: user?.username,
    email: user?.email,
    membership,
  });
  const canAccessView = (target: PokerView) =>
    canAccessPokerSurface(access, VIEW_SURFACE_POLICY[target]);
  const lobbyNavViews = getAllowedLobbyViews(access, 'nav');
  const lobbyCardViews = getAllowedLobbyViews(access, 'card');
  const lobbyOperatorViews = getAllowedLobbyViews(access, 'operator');

  useEffect(() => {
    if (view === 'CONTROL CENTER') {
      if (!user) {
        if (typeof window !== 'undefined') {
          window.location.href = 'https://thenewfuse.com/auth/login';
        }
        return;
      }
      if (!canAccessView(view)) {
        notify('SYSTEM', 'Route Restricted', 'Operator access is required for the console.');
        setView('LOBBY');
      }
      return;
    }
    if (canAccessView(view)) return;
    if (!user) {
      setView('LOGIN');
      return;
    }
    if (!access.isMember) {
      notify(
        'SYSTEM',
        'Members Only',
        'Poker access is restricted to TNF paid members. Connect thenewfuse.com to continue.'
      );
      setView('LOGIN');
      return;
    }
    notify('SYSTEM', 'Route Restricted', 'That surface is not enabled for this session.');
    setView('LOBBY');
  }, [view, access.isAdmin, access.isMember, access.isCreator, access.isProgrammaticAgent, user]);

  const isCashTable = tableProtocol === 'v2';
  const tableHeaderTitle = isCashTable ? activeTableMeta?.name || 'CASH TABLE' : undefined;
  const tableHeaderBadge = isCashTable ? activeTableMeta?.type : undefined;
  const tableBlindsText = isCashTable ? activeTableMeta?.stakes : undefined;
  const hasTournamentSeats =
    !isCashTable && Array.isArray(gameState?.seats) && gameState.seats.length > 0;
  const tournamentSeats = hasTournamentSeats ? gameState.seats : [];
  const tournamentActiveSeats = tournamentSeats.filter(
    (seat: any) => seat?.playerId && Number(seat.stack ?? 0) > 0
  );
  const fallbackTournamentTotal = botTournament?.stacks
    ? Object.keys(botTournament.stacks).length
    : 0;
  const tournamentTotalPlayers = hasTournamentSeats
    ? tournamentSeats.length
    : fallbackTournamentTotal || undefined;
  const tournamentPlayersRemaining = hasTournamentSeats
    ? tournamentActiveSeats.length
    : botTournament?.eliminated
      ? Math.max(0, fallbackTournamentTotal - botTournament.eliminated.length)
      : undefined;
  const tournamentAverageStack =
    tournamentPlayersRemaining && tournamentActiveSeats.length > 0
      ? Math.round(
          tournamentActiveSeats.reduce(
            (sum: number, seat: any) => sum + Number(seat.stack || 0),
            0
          ) / tournamentActiveSeats.length
        )
      : undefined;
  const heroSeat = hasTournamentSeats ? tournamentSeats.find((seat: any) => seat?.isHero) : null;
  const sortedTournamentSeats = hasTournamentSeats
    ? [...tournamentActiveSeats].sort(
        (a: any, b: any) => Number(b.stack || 0) - Number(a.stack || 0)
      )
    : [];
  const tournamentHeroPosition =
    heroSeat && sortedTournamentSeats.length > 0
      ? sortedTournamentSeats.findIndex((seat: any) => seat.id === heroSeat.id) + 1
      : undefined;
  const tournamentRankings = hasTournamentSeats
    ? sortedTournamentSeats.slice(0, 12).map((seat: any, idx: number) => ({
        rank: idx + 1,
        name: seat.name || seat.id,
        stack: Number(seat.stack || 0),
        active: Number(seat.stack || 0) > 0,
        isMe: !!seat.isHero,
      }))
    : botTournament?.stacks
      ? Object.entries(botTournament.stacks)
          .filter(([_, stack]) => Number(stack) > 0)
          .sort((a, b) => Number(b[1]) - Number(a[1]))
          .slice(0, 12)
          .map(([id, stack], idx) => ({
            rank: idx + 1,
            name: id,
            stack: Number(stack),
            active: true,
            isMe: false,
          }))
      : [];
  const tournamentInfo = !isCashTable
    ? {
        playersRemaining: tournamentPlayersRemaining,
        totalPlayers: tournamentTotalPlayers,
        averageStack: tournamentAverageStack,
        yourStack: heroSeat ? Number(heroSeat.stack || 0) : undefined,
        yourPosition: tournamentHeroPosition,
      }
    : undefined;

  return (
    <>
      {/* Global Audio Controls for non-table views */}
      {view !== 'TABLE' && (
        <div className="fixed bottom-4 right-4 z-999 flex items-center gap-2">
          <button
            onClick={toggleBgm}
            className={`p-3 rounded-full transition-colors shadow-lg ${bgmEnabled ? 'text-cyan-400 bg-cyan-900/50 border border-cyan-500/50' : 'text-slate-500 bg-black/60 border border-slate-800 hover:text-white'}`}
          >
            <Music className="w-5 h-5" />
          </button>
          <button
            onClick={toggleSfx}
            className={`p-3 rounded-full transition-colors shadow-lg ${sfxEnabled ? 'text-cyan-400 bg-cyan-900/50 border border-cyan-500/50' : 'text-slate-500 bg-black/60 border border-slate-800 hover:text-white'}`}
          >
            {sfxEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      )}

      {view === 'LANDING' && (
        <LandingPage
          onEnter={() => {
            playClick();
            setView('LOGIN');
          }}
        />
      )}
      {view === 'LOGIN' && <SessionLogin onLogin={handleLogin} />}
      {view === 'LOBBY' && user && (
        <LobbyPage
          user={user}
          canAccessLab={false}
          availableNavViews={lobbyNavViews}
          availableCardViews={lobbyCardViews}
          availableOperatorViews={lobbyOperatorViews}
          onNavigate={(v) => {
            playClick();
            const normalized = v as PokerView;
            if (!(normalized in VIEW_SURFACE_POLICY)) {
              notify('SYSTEM', 'Route Restricted', 'This control surface is not exposed here.');
              return;
            }
            if (!canAccessView(normalized)) {
              notify(
                'SYSTEM',
                'Route Restricted',
                'This control surface is not enabled for this role.'
              );
              return;
            }
            setView(normalized);
          }}
        />
      )}
      {view === 'LOBBY' && user && access.canAccessOperatorConsole && (
        <button
          onClick={() => {
            playClick();
            setView('CONTROL CENTER');
          }}
          onMouseEnter={playHover}
          className="fixed bottom-20 left-4 z-[998] px-4 py-3 rounded-xl bg-indigo-900/70 border border-indigo-400/40 text-indigo-300 text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(99,102,241,0.25)]"
        >
          Open Control Center
        </button>
      )}
      {view === 'LOBBY' && user && (
        <button
          onClick={startBotTournament}
          onMouseEnter={playHover}
          className="fixed bottom-20 right-4 z-[998] px-4 py-3 rounded-xl bg-emerald-900/70 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.25)]"
        >
          Run Live Bot Tournament
        </button>
      )}
      {view === 'CONTROL CENTER' && <ControlCenter setView={setView} notify={notify} />}
      {view === 'CASH TABLES' && (
        <CashTableBrowser
          onJoinTable={handleJoinCashTable}
          canCreateTable={access.canCreateTables}
          onBack={() => {
            playClick();
            setView('LOBBY');
          }}
        />
      )}
      {view === 'TOURNAMENTS' && (
        <TournamentLobby
          onJoin={handleJoinTable}
          canCreateTournaments={access.canCreateTournaments}
          onCreateSng={() => {
            playClick();
            setShowSngCreator(true);
          }}
          onCreateMtt={() => {
            playClick();
            setShowMttCreator(true);
          }}
          onBack={() => {
            playClick();
            setView('LOBBY');
          }}
        />
      )}
      {view === 'WALLET' && user && (
        <CashierPage
          balance={user.balance}
          onBack={() => {
            playClick();
            setView('LOBBY');
          }}
        />
      )}
      {view === 'HISTORY' && (
        <HandHistory
          onBack={() => {
            playClick();
            setView('LOBBY');
          }}
          onReplay={(id) => {
            playClick();
            setReplayHandId(id);
          }}
        />
      )}
      {view === 'RESULTS' && (
        <TournamentResults
          onBack={() => {
            playClick();
            setView('LOBBY');
          }}
          onHistory={() => {
            playClick();
            setView('HISTORY');
          }}
        />
      )}
      {view === 'PROFILE' && user && (
        <PlayerProfile
          user={user}
          onBack={() => {
            playClick();
            setView('LOBBY');
          }}
        />
      )}
      {view === 'PROVABLY_FAIR' && (
        <ProvablyFair
          onBack={() => {
            playClick();
            setView('LOBBY');
          }}
        />
      )}
      {view === 'MARKETPLACE' && (
        <SponsorshipMarketplace
          onBack={() => {
            playClick();
            setView('LOBBY');
          }}
        />
      )}
      {view === 'COMMUNITY APPS' && user && (
        <CommunityAppsPage
          username={user.username}
          onBack={() => {
            playClick();
            setView('LOBBY');
          }}
        />
      )}
      {view === 'LEADERBOARD' && (
        <Leaderboard
          onBack={() => {
            playClick();
            setView('LOBBY');
          }}
          onViewProfile={(username) => {
            playClick();
            setView('PROFILE');
          }}
          currentUser={user || { username: 'Guest' }}
        />
      )}
      {view === 'SETTINGS' && (
        <SettingsPage
          onBack={() => {
            playClick();
            setView('LOBBY');
          }}
        />
      )}

      {view === 'TABLE' && (
        <TournamentTableView
          onLeave={handleLeaveTable}
          variant={isCashTable ? 'cash' : 'tournament'}
          headerTitle={tableHeaderTitle}
          headerBadge={tableHeaderBadge}
          blindsText={tableBlindsText}
          tournamentInfo={tournamentInfo}
          rankings={tournamentRankings}
        >
          <PokerTable
            gameState={gameState}
            actionTape={actionTape}
            bgmEnabled={bgmEnabled}
            sfxEnabled={sfxEnabled}
            toggleBgm={toggleBgm}
            toggleSfx={toggleSfx}
            playHover={playHover}
            handleAction={handleAction}
            handleTakeover={handleTakeover}
            getAIInsight={getAIInsight}
            aiInsight={aiInsight}
            setAiInsight={setAiInsight}
            isAnalyzing={isAnalyzing}
          />
        </TournamentTableView>
      )}

      {showSngCreator && access.canCreateTournaments && (
        <SngCreatorModal onClose={() => setShowSngCreator(false)} onCreate={handleCreateSng} />
      )}

      {showMttCreator && access.canCreateTournaments && (
        <MttCreatorModal onClose={() => setShowMttCreator(false)} onCreate={handleCreateMtt} />
      )}

      {replayHandId && <HandReplayer handId={replayHandId} onClose={() => setReplayHandId(null)} />}
    </>
  );
}

export default function App() {
  return (
    <GameAudioProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </GameAudioProvider>
  );
}
