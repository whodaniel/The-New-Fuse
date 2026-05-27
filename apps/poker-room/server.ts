import express from 'express';
import fs from 'fs/promises';
import http from 'http';
import { randomInt } from 'node:crypto';
import path from 'path';
import { Hand } from 'pokersolver';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';

// Holdem-engine is ESM (.mjs) — dynamic import at module level
let holdemEngine: any = null;
const loadHoldemEngine = async () => {
  if (!holdemEngine) {
    holdemEngine = await import('../casin8-games/core-logic/holdem-engine/index.mjs');
  }
  return holdemEngine;
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});



io.use(async (socket: any, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers['authorization']?.split(' ')[1];
  if (token) {
    socket.data.identity = `user-${token.slice(0, 8)}`;
    next();
  } else {
    socket.data.identity = `guest-${socket.id.slice(0, 8)}`;
    next();
  }
});



const PORT = 3000;
app.use(express.json());

type CloudflareBuildOption =
  | 'workers'
  | 'pages'
  | 'durable-objects'
  | 'queues'
  | 'd1'
  | 'r2'
  | 'ai-gateway'
  | 'agents-sdk';

interface CommunityArcadeApp {
  id: string;
  name: string;
  summary: string;
  creator: string;
  category: string;
  tags: string[];
  status: 'pending' | 'published' | 'rejected';
  featured?: boolean;
  playUrl?: string;
  sourceUrl?: string;
  coverImageUrl?: string;
  votes: number;
  totalViews: number;
  totalLaunches: number;
  totalSubmissions: number;
  cloudflare: {
    option: CloudflareBuildOption;
    deploymentUrl?: string;
    projectName?: string;
    accountId?: string;
  };
  createdAt: string;
}

type EngagementType = 'view' | 'launch' | 'vote' | 'submit' | 'comment';

interface EngagementEvent {
  appId: string;
  type: EngagementType;
  userId: string;
  timestamp: string;
}

interface CommunityComment {
  id: string;
  appId: string;
  userId: string;
  text: string;
  createdAt: string;
}

const CLOUDFLARE_BUILD_OPTIONS = new Set<CloudflareBuildOption>([
  'workers',
  'pages',
  'durable-objects',
  'queues',
  'd1',
  'r2',
  'ai-gateway',
  'agents-sdk',
]);

const SEED_COMMUNITY_APPS: CommunityArcadeApp[] = [
  {
    id: 'seed-poker-room',
    name: 'AI Arcade Poker Room',
    summary: 'Live poker tables, tournaments, and AI strategy helpers.',
    creator: 'tnf-core',
    category: 'cards',
    tags: ['poker', 'multiplayer', 'ai'],
    status: 'published',
    featured: true,
    playUrl: 'https://poker.ai-arcade.xyz',
    votes: 320,
    totalViews: 1890,
    totalLaunches: 522,
    totalSubmissions: 1,
    cloudflare: { option: 'workers', projectName: 'ai-arcade-poker-room' },
    createdAt: new Date().toISOString(),
  },
];

let COMMUNITY_APPS: CommunityArcadeApp[] = [...SEED_COMMUNITY_APPS];
let ENGAGEMENT_EVENTS: EngagementEvent[] = [];
let COMMUNITY_COMMENTS: CommunityComment[] = [];
const APP_VOTERS = new Map<string, Set<string>>();

const DATA_DIR = path.join(process.cwd(), '.data');
const COMMUNITY_STATE_PATH = path.join(DATA_DIR, 'community-state.json');
const CLOUDFLARE_EXPORT_DIR = path.join(DATA_DIR, 'cloudflare-export');
let persistTimer: NodeJS.Timeout | null = null;

const DAY_MS = 24 * 60 * 60 * 1000;

const normalizeUserId = (req: express.Request, raw?: unknown) => {
  const base = raw ? String(raw).trim() : '';
  if (base) return base;
  return String(req.ip || 'anon');
};

const pushEvent = (appId: string, type: EngagementType, userId: string) => {
  ENGAGEMENT_EVENTS.push({
    appId,
    type,
    userId,
    timestamp: new Date().toISOString(),
  });
  if (ENGAGEMENT_EVENTS.length > 20000) {
    ENGAGEMENT_EVENTS.splice(0, ENGAGEMENT_EVENTS.length - 20000);
  }
};

const sqlEscape = (value: string) => value.replace(/'/g, "''");

const toSerializableState = () => ({
  apps: COMMUNITY_APPS,
  events: ENGAGEMENT_EVENTS,
  comments: COMMUNITY_COMMENTS,
  appVoters: Object.fromEntries(
    Array.from(APP_VOTERS.entries()).map(([appId, voters]) => [appId, Array.from(voters)])
  ),
});

const persistCommunityState = async () => {
  const state = toSerializableState();
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmpPath = `${COMMUNITY_STATE_PATH}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(state, null, 2), 'utf8');
  await fs.rename(tmpPath, COMMUNITY_STATE_PATH);

  await fs.mkdir(CLOUDFLARE_EXPORT_DIR, { recursive: true });
  const r2SnapshotPath = path.join(CLOUDFLARE_EXPORT_DIR, 'community-latest.json');
  await fs.writeFile(r2SnapshotPath, JSON.stringify(state, null, 2), 'utf8');

  const d1SqlPath = path.join(CLOUDFLARE_EXPORT_DIR, 'community-d1-seed.sql');
  const sqlLines: string[] = [
    'CREATE TABLE IF NOT EXISTS community_apps (id TEXT PRIMARY KEY, name TEXT, summary TEXT, creator TEXT, category TEXT, status TEXT, votes INTEGER, total_views INTEGER, total_launches INTEGER, created_at TEXT, cloudflare_option TEXT, cloudflare_project_name TEXT, cloudflare_deployment_url TEXT);',
    'CREATE TABLE IF NOT EXISTS community_comments (id TEXT PRIMARY KEY, app_id TEXT, user_id TEXT, text TEXT, created_at TEXT);',
    'CREATE TABLE IF NOT EXISTS community_events (id TEXT PRIMARY KEY, app_id TEXT, type TEXT, user_id TEXT, timestamp TEXT);',
    'DELETE FROM community_apps;',
    'DELETE FROM community_comments;',
    'DELETE FROM community_events;',
  ];
  for (const app of COMMUNITY_APPS) {
    sqlLines.push(
      `INSERT INTO community_apps (id, name, summary, creator, category, status, votes, total_views, total_launches, created_at, cloudflare_option, cloudflare_project_name, cloudflare_deployment_url) VALUES ('${sqlEscape(app.id)}', '${sqlEscape(app.name)}', '${sqlEscape(app.summary)}', '${sqlEscape(app.creator)}', '${sqlEscape(app.category)}', '${sqlEscape(app.status)}', ${app.votes}, ${app.totalViews}, ${app.totalLaunches}, '${sqlEscape(app.createdAt)}', '${sqlEscape(app.cloudflare.option)}', '${sqlEscape(app.cloudflare.projectName || '')}', '${sqlEscape(app.cloudflare.deploymentUrl || '')}');`
    );
  }
  for (const comment of COMMUNITY_COMMENTS) {
    sqlLines.push(
      `INSERT INTO community_comments (id, app_id, user_id, text, created_at) VALUES ('${sqlEscape(comment.id)}', '${sqlEscape(comment.appId)}', '${sqlEscape(comment.userId)}', '${sqlEscape(comment.text)}', '${sqlEscape(comment.createdAt)}');`
    );
  }
  ENGAGEMENT_EVENTS.forEach((event, idx) => {
    sqlLines.push(
      `INSERT INTO community_events (id, app_id, type, user_id, timestamp) VALUES ('evt_${idx + 1}', '${sqlEscape(event.appId)}', '${sqlEscape(event.type)}', '${sqlEscape(event.userId)}', '${sqlEscape(event.timestamp)}');`
    );
  });
  await fs.writeFile(d1SqlPath, sqlLines.join('\n'), 'utf8');
};

const scheduleCommunityPersist = () => {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistCommunityState().catch((err) => {
      console.error('[community] persistence failed:', err);
    });
  }, 200);
};

const loadCommunityState = async () => {
  try {
    const raw = await fs.readFile(COMMUNITY_STATE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.apps)) COMMUNITY_APPS = parsed.apps;
    if (Array.isArray(parsed.events)) ENGAGEMENT_EVENTS = parsed.events;
    if (Array.isArray(parsed.comments)) COMMUNITY_COMMENTS = parsed.comments;
    APP_VOTERS.clear();
    const votersObj = parsed.appVoters || {};
    Object.keys(votersObj).forEach((appId) => {
      const voters = Array.isArray(votersObj[appId]) ? votersObj[appId] : [];
      APP_VOTERS.set(appId, new Set(voters.map((v: unknown) => String(v))));
    });
  } catch {
    COMMUNITY_APPS = [...SEED_COMMUNITY_APPS];
    ENGAGEMENT_EVENTS = [];
    COMMUNITY_COMMENTS = [];
    APP_VOTERS.clear();
    scheduleCommunityPersist();
  }
};

const buildTrend = (appId: string, days = 14) => {
  const now = Date.now();
  const buckets = Array.from({ length: days }).map((_, idx) => {
    const dayStart = new Date(now - (days - idx - 1) * DAY_MS);
    dayStart.setHours(0, 0, 0, 0);
    return {
      date: dayStart.toISOString().slice(0, 10),
      views: 0,
      launches: 0,
      votes: 0,
      uniqueUsers: new Set<string>(),
    };
  });

  const startDateMs = new Date(buckets[0].date).getTime();
  for (const event of ENGAGEMENT_EVENTS) {
    if (event.appId !== appId) continue;
    const ts = Date.parse(event.timestamp);
    if (!Number.isFinite(ts) || ts < startDateMs) continue;
    const day = new Date(ts);
    day.setHours(0, 0, 0, 0);
    const key = day.toISOString().slice(0, 10);
    const bucket = buckets.find((b) => b.date === key);
    if (!bucket) continue;
    bucket.uniqueUsers.add(event.userId);
    if (event.type === 'view') bucket.views += 1;
    if (event.type === 'launch') bucket.launches += 1;
    if (event.type === 'vote') bucket.votes += 1;
  }

  return buckets.map((b) => ({
    date: b.date,
    views: b.views,
    launches: b.launches,
    votes: b.votes,
    uniqueUsers: b.uniqueUsers.size,
  }));
};

const buildBadges = (app: CommunityArcadeApp) => {
  const badges: { id: string; name: string; description: string }[] = [];
  if (app.featured) {
    badges.push({
      id: 'featured',
      name: 'Featured',
      description: 'Highlighted by AI-ARCADE curation',
    });
  }
  if (app.votes >= 10) {
    badges.push({
      id: 'community-spark',
      name: 'Community Spark',
      description: 'Reached 10+ upvotes',
    });
  }
  if (app.votes >= 100) {
    badges.push({
      id: 'crowd-favorite',
      name: 'Crowd Favorite',
      description: 'Reached 100+ upvotes',
    });
  }
  if (app.totalLaunches >= 50) {
    badges.push({
      id: 'battle-tested',
      name: 'Battle Tested',
      description: 'Launched 50+ times',
    });
  }
  if (app.totalViews >= 500) {
    badges.push({
      id: 'high-traffic',
      name: 'High Traffic',
      description: 'Viewed 500+ times',
    });
  }
  return badges;
};

// --- GAME LOGIC (holdem-engine integration) ---
// Replaces the duplicate inline poker engine with the canonical holdem-engine.
// The holdem-engine provides: proper side pots, TDA-compliant rules, idempotency,
// cryptographic shuffle, burn cards, heads-up correct blinds, and more.

const DISCONNECT_GRACE_MS = 30_000; // 30s sit-out grace before removal
const ACTION_TIMEOUT_MS = 25_000; // 25s to act before auto-fold (shorter than grace)
const HAND_START_DELAY_MS = 5_000;
const STARTING_STACK = 100_000;

const BLIND_LEVELS: [number, number][] = [
  [100, 200],
  [200, 400],
  [300, 600],
  [500, 1000],
  [1000, 2000],
  [2000, 4000],
  [5000, 10000],
];
const BLIND_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Player tracking maps
const socketToPlayer = new Map<string, { playerId: string; seat: number; identity: string }>();
const playerToSocket = new Map<string, string>();
const socketDisplayNames = new Map<string, string>();
const disconnectTimers = new Map<string, NodeJS.Timeout>();
let actionTimeoutTimer: NodeJS.Timeout | null = null; // Auto-fold timer for current actor

// Engine instance — created async after module load
let pokerEngine: any = null;
let blindLevel = 0;
let nextBlindTime = Date.now() + BLIND_INTERVAL;
let gameLogs: string[] = [];
let currentWinners: any[] = [];

const addLog = (msg: string) => {
  gameLogs.unshift(msg);
  if (gameLogs.length > 20) gameLogs.pop();
};

/**
 * Convert holdem-engine snapshot to the GameState shape the frontend expects.
 * This preserves backward compatibility with the Socket.IO event interface.
 */
const engineToGameState = () => {
  if (!pokerEngine || !holdemEngine) {
    // Engine not yet initialized
    return {
      deck: [],
      communityCards: [],
      pot: 0,
      round: 'WAITING',
      dealerIndex: 0,
      turnIndex: -1,
      lastAggressor: -1,
      currentBet: 0,
      lastRaiseSize: 0,
      bigBlind: 200,
      seats: Array(pokerEngine?.maxSeats || 9)
        .fill(null)
        .map((_, i) => ({
          id: `empty-${i}`,
          name: 'EMPTY',
          avatar: '',
          stack: 0,
          bet: 0,
          cards: [],
          active: false,
          folded: false,
          isAllIn: false,
          disconnected: false,
          acted: true,
        })),
      blinds: [100, 200] as [number, number],
      blindLevel: 0,
      nextBlindTime,
      logs: gameLogs,
      winners: currentWinners,
    };
  }

  const snap = holdemEngine.tableSnapshot(pokerEngine);
  const hand = snap.hand;

  const streetToRound: Record<string, string> = {
    preflop: 'PRE_FLOP',
    flop: 'FLOP',
    turn: 'TURN',
    river: 'RIVER',
  };

  const round = hand
    ? hand.settled
      ? 'SHOWDOWN'
      : streetToRound[hand.street] || 'WAITING'
    : 'WAITING';

  // Iterate by engine seat index (0..maxSeats-1), NOT by snap.seats array position.
  // snap.seats is a filtered/sorted array where snap.seats[i] is the i-th non-null seat,
  // which does NOT correspond to engine seat number i. Previously, using snap.seats[i]
  // with Array(9) caused seat number mismatches on any table with empty seats.
  const maxSeats = snap.maxSeats || 9;
  const seats = Array(maxSeats)
    .fill(null)
    .map((_, i) => {
      // Look up the seat by engine seat number from the sorted seats array
      const seat = snap.seats.find((s: any) => s.seat === i);
      if (!seat) {
        return {
          id: `empty-${i}`,
          name: 'EMPTY',
          avatar: '',
          stack: 0,
          bet: 0,
          cards: [],
          active: false,
          folded: true,
          isAllIn: false,
          disconnected: false,
          acted: true,
        };
      }
      const isFolded = hand ? hand.foldedSeats.includes(seat.seat) : false;
      const isAllIn = hand ? hand.allInSeats.includes(seat.seat) : false;
      const streetCommit = hand ? Number(hand.streetCommitted[String(seat.seat)] || 0) : 0;
      const actedSinceAggression = hand ? hand.actedSinceAggression.includes(seat.seat) : false;
      // Hole cards are stored on hand.holeCards keyed by seat number, NOT on the seat object.
      // Previously accessed seat.holeCards which was always undefined — players could never see their cards.
      const holeCards = hand ? hand.holeCards?.[String(seat.seat)] || [] : [];

      return {
        id: seat.playerId,
        name: socketDisplayNames.get(playerToSocket.get(seat.playerId) || '') || seat.playerId,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${seat.playerId}`,
        stack: seat.stack,
        bet: streetCommit,
        cards: holeCards,
        active: true,
        folded: isFolded,
        isAllIn,
        disconnected: seat.connected === false,
        acted: actedSinceAggression,
      };
    });

  return {
    deck: [],
    communityCards:
      hand?.boardCards?.slice(
        0,
        hand.street === 'flop'
          ? 3
          : hand.street === 'turn'
            ? 4
            : hand.street === 'river'
              ? 5
              : hand.street === 'showdown'
                ? 5
                : 0
      ) || [],
    pot: hand?.pot || 0,
    round,
    dealerIndex: snap.buttonSeat ?? 0,
    turnIndex: hand?.actingSeat ?? -1,
    lastAggressor: hand?.lastAggressorSeat ?? -1,
    currentBet: hand?.currentBet ?? 0,
    lastRaiseSize: hand?.lastAggressiveDelta ?? 0,
    bigBlind: snap.blinds.bigBlind,
    seats,
    blinds: [snap.blinds.smallBlind, snap.blinds.bigBlind] as [number, number],
    blindLevel,
    nextBlindTime,
    logs: gameLogs,
    winners: currentWinners,
  };
};

const broadcastState = () => {
  const stateToSend = engineToGameState();
  // Security: hide other players' cards per socket
  io.sockets.sockets.forEach((socket) => {
    const playerState = JSON.parse(JSON.stringify(stateToSend));
    const info = socketToPlayer.get(socket.id);
    if (info && playerState.seats[info.seat]?.cards.length > 0) {
      const ownCards = playerState.seats[info.seat].cards;
      playerState.seats = playerState.seats.map((s: any, i: number) => ({
        ...s,
        cards: i === info.seat ? ownCards : s.cards.length > 0 ? ['hidden', 'hidden'] : [],
      }));
    } else {
      playerState.seats = playerState.seats.map((s: any) => ({
        ...s,
        cards: s.cards.length > 0 ? ['hidden', 'hidden'] : [],
      }));
    }
    // At showdown, reveal only non-folded players' cards (TDA Rule 66)
    // Folded players' cards remain hidden even at showdown
    // Use the original unmasked stateToSend instead of calling engineToGameState() again
    if (playerState.round === 'SHOWDOWN') {
      playerState.seats = stateToSend.seats.map((s: any) => ({
        ...s,
        cards: s.folded ? (s.cards.length > 0 ? ['hidden', 'hidden'] : []) : s.cards,
      }));
    }
    socket.emit('gameState', playerState);
  });
  // Schedule auto-fold for current actor if hand is active
  scheduleActionTimeout();
};

// Action timeout: auto-fold/check the current actor if they don't act in time
const scheduleActionTimeout = () => {
  if (actionTimeoutTimer) {
    clearTimeout(actionTimeoutTimer);
    actionTimeoutTimer = null;
  }
  if (!pokerEngine || !holdemEngine) return;
  const hand = pokerEngine.hand;
  if (!hand || hand.settled || hand.actingSeat == null) return;

  const actingSeat = hand.actingSeat;
  const seatRow = pokerEngine.seats[actingSeat];
  if (!seatRow) return;

  actionTimeoutTimer = setTimeout(() => {
    if (!pokerEngine || !holdemEngine) return;
    const currentHand = pokerEngine.hand;
    if (!currentHand || currentHand.settled || currentHand.actingSeat !== actingSeat) return;

    // Re-read the seat row at timeout time, not at schedule time.
    // The captured `seatRow` becomes stale if the player disconnects and
    // reconnects within the 25s window (connected flips false→true but
    // the closure still sees the old value). Using the live engine seat
    // ensures we check the CURRENT connection state.
    const liveSeatRow = pokerEngine.seats[actingSeat];
    if (!liveSeatRow) return;

    // Time expired — auto-fold the player
    try {
      if (liveSeatRow.connected === false) {
        // Disconnected players can't use applyAction (it rejects disconnected players).
        // Use forceFoldDisconnected instead, which handles the disconnected state.
        holdemEngine.forceFoldDisconnected(pokerEngine, { playerId: liveSeatRow.playerId });
        addLog(`${liveSeatRow.playerId} auto-folded (action timeout, disconnected)`);
      } else {
        // Connected but idle — fold via applyAction with playerId (NOT seat number).
        // Previous code passed { seat: actingSeat } which caused applyAction to throw
        // "Unknown playerId" since applyAction resolves the player via input.playerId.
        const idemKey = `timeout-fold:${liveSeatRow.playerId}:${Date.now()}`;
        holdemEngine.applyAction(pokerEngine, {
          playerId: liveSeatRow.playerId,
          action: 'fold',
          amount: 0,
          idempotencyKey: idemKey,
        });
        addLog(`${liveSeatRow.playerId} auto-folded (action timeout)`);
      }
    } catch (err: any) {
      // Player may have already acted, hand settled, or already folded; ignore
    }

    // Check if hand should settle
    if (currentHand.readyForSettlement || currentHand.street === 'showdown') {
      handleSettlement();
    }

    broadcastState();
  }, ACTION_TIMEOUT_MS);
};

const tryStartHand = () => {
  if (!pokerEngine || !holdemEngine) return;
  if (pokerEngine.hand && !pokerEngine.hand.settled) return; // Hand in progress

  const seated = pokerEngine.seats.filter((s: any) => s !== null && s.stack > 0);
  if (seated.length < 2) {
    addLog('Waiting for players...');
    broadcastState();
    return;
  }

  // Check blind escalation
  if (Date.now() > nextBlindTime && blindLevel < BLIND_LEVELS.length - 1) {
    blindLevel++;
    nextBlindTime = Date.now() + BLIND_INTERVAL;
    const [sb, bb] = BLIND_LEVELS[blindLevel];
    pokerEngine.blinds.smallBlind = sb;
    pokerEngine.blinds.bigBlind = bb;
    addLog(`Blinds increased to ${sb}/${bb}`);
  }

  // Remove busted players ONLY between hands (not during an active hand)
  // Removing mid-hand corrupts side pot calculations and can crash settlement
  if (!pokerEngine.hand || pokerEngine.hand.settled) {
    pokerEngine.seats.forEach((seat: any, i: number) => {
      if (seat && seat.stack <= 0) {
        const playerId = seat.playerId;
        try {
          holdemEngine.unseatPlayer(pokerEngine, { playerId });
        } catch {}
        const socketId = playerToSocket.get(playerId);
        if (socketId) {
          socketToPlayer.delete(socketId);
          playerToSocket.delete(playerId);
          socketDisplayNames.delete(socketId);
        }
        addLog(`${playerId} busted out!`);
      }
    });
  }

  const activeAfterBust = pokerEngine.seats.filter((s: any) => s !== null && s.stack > 0);
  if (activeAfterBust.length < 2) {
    addLog('Waiting for players...');
    broadcastState();
    return;
  }

  try {
    const handId = `hand-${Date.now()}-${randomInt(0, 2821109907455).toString(36)}`;
    const idempotencyKey = `start-${handId}`;
    holdemEngine.startHand(pokerEngine, { handId, idempotencyKey });
    currentWinners = [];

    const hand = pokerEngine.hand;
    if (hand) addLog(`Hand started. Dealer: Seat ${hand.buttonSeat}`);
    broadcastState();
  } catch (err: any) {
    addLog(`Hand start error: ${err.message}`);
  }
};

const handleSettlement = () => {
  if (!pokerEngine || !holdemEngine) return;
  const hand = pokerEngine.hand;
  if (!hand || !hand.readyForSettlement) return;

  try {
    let rankingBySeat: Record<string, number> = {};
    const activeSeats = pokerEngine.seats
      .map((seat: any, i: number) => ({ seat, idx: i }))
      .filter(({ seat, idx }: any) => seat !== null && !hand.foldedSeats.includes(idx));

    if (activeSeats.length === 1) {
      rankingBySeat = { [String(activeSeats[0].idx)]: 1 };
    } else {
      const evaluations = activeSeats.map(({ seat, idx }: any) => {
        // Hole cards are on hand.holeCards, NOT on the seat object
        const holeCards = hand.holeCards?.[String(idx)] || [];
        // When a hand ends before all community cards are dealt (e.g., all but
        // one player folds on the flop), boardCards may contain fewer than 5
        // entries, and slicing to 5 includes `undefined` entries that crash
        // Hand.solve(). Filter out undefined/null to prevent this.
        const rawBoard =
          hand.boardCards?.slice(
            0,
            hand.street === 'flop'
              ? 3
              : hand.street === 'turn'
                ? 4
                : hand.street === 'river'
                  ? 5
                  : hand.street === 'showdown'
                    ? 5
                    : 0
          ) || [];
        const board = rawBoard.filter(Boolean);
        const solverHand = Hand.solve([...holeCards, ...board]);
        return { seatIdx: idx, hand: solverHand };
      });
      const winners = Hand.winners(evaluations.map((e: any) => e.hand));
      const winnerSet = new Set(winners);
      let rank = 2;
      for (const ev of evaluations) {
        if (winnerSet.has(ev.hand)) {
          rankingBySeat[String(ev.seatIdx)] = 1;
        } else {
          rankingBySeat[String(ev.seatIdx)] = rank++;
        }
      }
    }

    const settlementKey = `settle-${hand.handId}`;
    holdemEngine.settleHand(pokerEngine, { rankingBySeat, idempotencyKey: hand.handId });

    currentWinners = [];
    for (const [seatRaw, payout] of Object.entries(hand.payoutBySeat)) {
      const seatNo = Number(seatRaw);
      const seat = pokerEngine.seats[seatNo];
      if (seat && Number(payout) > 0) {
        const displayName =
          socketDisplayNames.get(playerToSocket.get(seat.playerId) || '') || seat.playerId;
        currentWinners.push({
          id: seat.playerId,
          name: displayName,
          amount: Number(payout),
          hand: 'Win',
        });
        addLog(`${displayName} wins $${Number(payout)}`);
      }
    }

    broadcastState();
    setTimeout(() => tryStartHand(), HAND_START_DELAY_MS);
  } catch (err: any) {
    addLog(`Settlement error: ${err.message}`);
  }
};

const checkForSettlement = () => {
  const hand = pokerEngine?.hand;
  if (hand?.readyForSettlement) handleSettlement();
};

// --- SOCKET AUTH MIDDLEWARE ---
// H4 fix: Require membership identity for WebSocket connections.
// Reuses the same membership verification flow as casin8-games server.js.

const TNF_API_BASE = String(process.env.TNF_API_BASE_URL || 'https://thenewfuse.com/api').replace(
  /\/$/,
  ''
);
const COMMUNITY_API_BASE = String(
  process.env.COMMUNITY_API_BASE_URL || 'https://ai-arcade-community-api.bizsynth.workers.dev'
).replace(/\/$/, '');
const COMMUNITY_API_KEY = String(process.env.COMMUNITY_API_KEY || '').trim();
const SUPER_ADMIN_IDENTITIES = new Set(
  String(process.env.MASTER_SUPER_ADMIN_EMAILS || 'owner@example.com')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);
const MEMBERSHIP_CACHE_TTL = 90_000;
const membershipCache = new Map();

async function verifyMembership(
  identity: string,
  jwt?: string
): Promise<{ active: boolean; tier: string }> {
  if (!identity) return { active: false, tier: 'NONE' };
  const key = identity.toLowerCase();
  if (SUPER_ADMIN_IDENTITIES.has(key)) return { active: true, tier: 'ENTERPRISE' };
  const cached = membershipCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  try {
    if (jwt && jwt.split('.').length === 3) {
      const res = await fetch(`${TNF_API_BASE}/billing/membership/me`, {
        headers: { authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        const json = await res.json().catch(() => null as any);
        const value = { active: !!json?.active, tier: json?.tier || 'STARTER' };
        membershipCache.set(key, { expiresAt: Date.now() + MEMBERSHIP_CACHE_TTL, value });
        return value;
      }
    }
    if (COMMUNITY_API_KEY) {
      const res = await fetch(
        `${TNF_API_BASE}/billing/membership/${encodeURIComponent(identity)}`,
        {
          headers: { 'x-community-api-key': COMMUNITY_API_KEY },
        }
      );
      if (res.ok) {
        const json = await res.json().catch(() => null as any);
        const value = { active: !!json?.active, tier: json?.tier || 'STARTER' };
        membershipCache.set(key, { expiresAt: Date.now() + MEMBERSHIP_CACHE_TTL, value });
        return value;
      }
    }
    const res = await fetch(
      `${COMMUNITY_API_BASE}/api/community/membership/${encodeURIComponent(identity)}`
    );
    if (res.ok) {
      const json = await res.json().catch(() => null as any);
      const value = { active: !!json?.active, tier: json?.tier || 'STARTER' };
      membershipCache.set(key, { expiresAt: Date.now() + MEMBERSHIP_CACHE_TTL, value });
      return value;
    }
  } catch {}
  return { active: false, tier: 'NONE' };
}

io.use(async (socket, next) => {
  const identity = String(
    socket.handshake.auth.identity ||
      socket.handshake.auth.username ||
      socket.handshake.headers['x-tnf-identity'] ||
      ''
  ).trim();
  const jwt = String(socket.handshake.auth.token || socket.handshake.headers['authorization'] || '')
    .replace(/^Bearer\s+/i, '')
    .trim();
  if (!identity) {
    // Allow read-only spectators without identity
    socket.data.spectator = true;
    return next();
  }
  const membership = await verifyMembership(identity, jwt);
  if (!membership.active) {
    return next(new Error('Membership required'));
  }
  socket.data.identity = identity;
  socket.data.tier = membership.tier;
  socket.data.spectator = false;
  next();
});

io.on('connection', (socket) => {
  // Spectators can only watch, not join or act
  socket.on('join', (data) => {
  socket.on('join', (data) => {
    if (!pokerEngine || !holdemEngine) return;
    if (socket.data.spectator) {
      socket.emit('error', { message: 'Membership required to play' });
      return;
    }

    const identity = socket.data.identity; // from auth middleware
    let playerId: string;
    let name: string;
    let emptySeat: number = -1;

    // Attempt to reclaim a disconnected seat if the identity matches
    let seatReclaimed = false;
    if (identity) {
      for (const [existingSocketId, info] of socketToPlayer.entries()) {
        if (info.identity === identity) {
          const oldTimer = disconnectTimers.get(info.playerId);
          if (oldTimer) { clearTimeout(oldTimer); disconnectTimers.delete(info.playerId); }
          
          // Update mappings to the new socket
          socketToPlayer.delete(existingSocketId);
          socketToPlayer.set(socket.id, { playerId: info.playerId, seat: info.seat, identity: identity || '' });
          playerToSocket.set(info.playerId, socket.id);

          const displayName = socketDisplayNames.get(existingSocketId) || info.playerId;
          socketDisplayNames.set(socket.id, displayName);
          socketDisplayNames.delete(existingSocketId);

          // Update engine connection state
          try { holdemEngine.setConnection(pokerEngine, { playerId: info.playerId, connected: true }); } catch { /* ignore */ }
          
          // Clear action timeout if this player was the current actor
          if (actionTimeoutTimer && pokerEngine.hand?.actingSeat === info.seat) {
            clearTimeout(actionTimeoutTimer); actionTimeoutTimer = null;
          }
          addLog(`${displayName} reclaimed seat ${info.seat}`);
          broadcastState();
          seatReclaimed = true;
          break; // Reclaimed successfully, exit loop
        }
      }
    }

    if (seatReclaimed) {
      return; // If a seat was reclaimed, we're done
    }

    // If no seat was reclaimed, assign new playerId/name and find an empty seat
    playerId = identity || `player-${socket.id}`;
    name = identity || `Player ${randomInt(100, 999)}`;
    for (let i = 0; i < pokerEngine.maxSeats; i++) {
      if (!pokerEngine.seats[i]) {
        emptySeat = i;
        break;
      }
    }

    if (emptySeat === -1) {
      socket.emit('error', { message: 'Table is full' });
      return;
    }

    try {
      holdemEngine.seatPlayer(pokerEngine, {
        playerId,
        seat: emptySeat,
        stack: STARTING_STACK,
        autoPostBlinds: true,
        controlMode: 'human',
      });

      socketToPlayer.set(socket.id, { playerId, seat: emptySeat, identity: identity || '' });
      playerToSocket.set(playerId, socket.id);
      socketDisplayNames.set(socket.id, name);

      addLog(`${name} joined seat ${emptySeat}`);
      broadcastState();

      if (!pokerEngine.hand || pokerEngine.hand.settled) {
        setTimeout(() => tryStartHand(), 1000);
      }
    } catch (err: any) {
      socket.emit('error', { message: err.message });
    }
  });
        socketDisplayNames.set(socket.id, name);

        addLog(`${name} joined seat ${emptySeat}`);
        broadcastState();

        if (!pokerEngine.hand || pokerEngine.hand.settled) {
          setTimeout(() => tryStartHand(), 1000);
        }
      } catch (err: any) {
        socket.emit('error', { message: err.message });
      }
  });

  socket.on('action', (data) => {
    if (!pokerEngine || !holdemEngine) return;
    if (socket.data.spectator) {
      socket.emit('error', { message: 'Membership required to act' });
      return;
    }
    const { type, amount } = data;
    const info = socketToPlayer.get(socket.id);
    if (!info) return;

    const hand = pokerEngine.hand;
    if (!hand || hand.settled) return;
    if (hand.actingSeat !== info.seat) return;

    // Map frontend action types to holdem-engine action types
    let engineAction: string;
    let engineAmount = amount || 0;
    switch (String(type).toUpperCase()) {
      case 'FOLD':
        engineAction = 'fold';
        break;
      case 'CALL':
        engineAction = 'call';
        break;
      case 'CHECK':
        engineAction = 'check';
        break;
      case 'BET':
        engineAction = 'bet';
        break;
      case 'RAISE':
        engineAction = 'raise';
        break;
      case 'ALLIN':
        engineAction = 'allin';
        break;
      default:
        return;
    }

    const idempotencyKey = `action-${hand.handId}-${info.seat}-${hand.street}-${type}-${amount || 0}`;
    try {
      holdemEngine.applyAction(pokerEngine, {
        playerId: info.playerId,
        action: engineAction,
        amount: engineAmount,
        idempotencyKey,
      });

      const displayName = socketDisplayNames.get(socket.id) || info.playerId;
      const logMap: Record<string, string> = {
        fold: `${displayName} folds`,
        call: `${displayName} calls`,
        check: `${displayName} checks`,
        bet: `${displayName} bets $${engineAmount}`,
        raise: `${displayName} raises to $${engineAmount}`,
        allin: `${displayName} goes all-in`,
      };
      addLog(logMap[engineAction] || `${displayName}: ${engineAction}`);

      broadcastState();
      checkForSettlement();
    } catch (err: any) {
      socket.emit('actionError', { message: err.message });
    }
  });

  socket.on('disconnect', () => {
    if (!pokerEngine || !holdemEngine) return;
    const info = socketToPlayer.get(socket.id);
    if (!info) return;

    const { playerId, seat } = info;

    // Grace period: mark disconnected but don't remove from mappings yet
    // so reconnection can find the player by identity
    try {
      holdemEngine.setConnection(pokerEngine, { playerId, connected: false });
    } catch {}
    addLog(
      `${socketDisplayNames.get(socket.id) || playerId} disconnected (grace: ${DISCONNECT_GRACE_MS / 1000}s)`
    );

    // Store a marker so we know this socket is disconnected but still mapped
    // The grace timer will clean up if no reconnection occurs
    const timer = setTimeout(() => {
      // Verify player is still disconnected before acting.
      // A reconnect_attempt handler may have already cleared the timer and
      // restored the player, but Node.js setTimeout callbacks are not atomically
      // cancelled — if the callback was already queued before clearTimeout ran,
      // it still fires. Without this check, a reconnected player gets force-folded.
      const seatRow = pokerEngine.seats[seat];
      if (seatRow && seatRow.connected !== false) {
        // Player has reconnected — do nothing
        disconnectTimers.delete(playerId);
        return;
      }

      // Grace expired — force-fold the player if in an active hand
      try {
        holdemEngine.forceFoldDisconnected(pokerEngine, { playerId });
      } catch {}
      addLog(
        `${socketDisplayNames.get(playerToSocket.get(playerId) || '') || playerId} force-folded (grace expired)`
      );

      // If the fold triggered settlement (e.g., only one player left), handle it now
      // BEFORE unseating — otherwise the busted player loses their payout
      const handAfterFold = pokerEngine.hand;
      if (handAfterFold?.readyForSettlement) {
        handleSettlement();
      }

      // Only unseat AFTER the hand is settled (same principle as NC4 mid-hand fix).
      // Unseating during an active hand corrupts side pot calculations.
      const handNow = pokerEngine.hand;
      if (!handNow || handNow.settled) {
        try {
          holdemEngine.unseatPlayer(pokerEngine, { playerId });
        } catch {}
        addLog(
          `${socketDisplayNames.get(playerToSocket.get(playerId) || '') || playerId} removed (grace expired)`
        );
        const oldSocketId = playerToSocket.get(playerId);
        if (oldSocketId) {
          socketToPlayer.delete(oldSocketId);
          socketDisplayNames.delete(oldSocketId);
        }
        playerToSocket.delete(playerId);
        disconnectTimers.delete(playerId);
        broadcastState();
        setTimeout(() => tryStartHand(), 1000);
      } else {
        // Hand still active (other players still betting) — keep the disconnected
        // player seated but folded. Will be unseated when hand ends (in tryStartHand).
        broadcastState();
      }
    }, DISCONNECT_GRACE_MS);

    disconnectTimers.set(playerId, timer);
    // NOTE: Do NOT delete socketToPlayer/playerToSocket here — keep them for reconnection
    broadcastState();
  });

  // Reconnection handler: if a player reconnects within grace period, restore their seat
  // Match by identity to avoid claiming the wrong disconnected player's seat.
  socket.on('reconnect_attempt', () => {
    if (!pokerEngine || !holdemEngine) return;
    const identity = socket.data.identity;
    if (!identity) return;

    // Find the disconnected player whose identity matches this socket's identity.
    // The previous implementation matched on playerId.startsWith('player-') which
    // could match ANY disconnected player, causing wrong-seat claims when multiple
    // players disconnect simultaneously.
    let reclaimed = false;
    for (const [existingSocketId, info] of socketToPlayer.entries()) {
      const { playerId, seat } = info;
      const existingSocket = io.sockets.sockets.get(existingSocketId);
      if (existingSocket && existingSocket.connected) continue; // Still connected, skip

      // Check identity match: the existing socket's identity should match the reconnecting one.
      // Fallback: if the existing socket data is gone, check by displayName mapping.
      const existingIdentity = existingSocket?.data?.identity;
      const displayName = socketDisplayNames.get(existingSocketId) || '';
      const isMatch =
        existingIdentity === identity || displayName.toLowerCase() === identity.toLowerCase();

      if (!isMatch) continue;

      // Clear the grace timer
      const timer = disconnectTimers.get(playerId);
      if (timer) {
        clearTimeout(timer);
        disconnectTimers.delete(playerId);
      }

      // Re-map to new socket
      socketToPlayer.delete(existingSocketId);
      socketToPlayer.set(socket.id, { playerId, seat, identity: identity || '' });
      playerToSocket.set(playerId, socket.id);
      socketDisplayNames.set(socket.id, displayName || playerId);
      socketDisplayNames.delete(existingSocketId);

      // Mark reconnected in engine
      try {
        holdemEngine.setConnection(pokerEngine, { playerId, connected: true });
      } catch {}

      // IMPORTANT: Also clear the action timeout timer if the reconnecting
      // player is the current actor. Without this, the 25s action timeout
      // (which was scheduled before the disconnect) fires and force-folds
      // the player even though they just reconnected and should have their
      // remaining time to act. The scheduleActionTimeout() call in
      // broadcastState() will reschedule a fresh timer after this.
      // NF3 fix: Use pokerEngine.hand (live engine state) instead of closure-captured
      // `hand` which is stale/undefined in this scope. Previously, `hand?.actingSeat`
      // was always undefined because `hand` is from the action handler's closure —
      // if no action was processed, it was undefined, meaning the action timeout
      // timer was NEVER cleared on reconnection, causing auto-fold 25s later.
      if (actionTimeoutTimer && pokerEngine.hand?.actingSeat === seat) {
        clearTimeout(actionTimeoutTimer);
        actionTimeoutTimer = null;
      }

      addLog(`${socketDisplayNames.get(socket.id)} reconnected`);
      broadcastState();
      reclaimed = true;
      return;
    }

    if (!reclaimed) {
      addLog(`Reconnect attempt for ${identity} — no matching disconnected player found`);
    }
  });
});

async function startServer() {
  // API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/community/apps', (req, res) => {
    const status = String(req.query.status || 'published').toLowerCase();
    const limitRaw = Number(req.query.limit || 24);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(100, Math.floor(limitRaw))) : 24;
    const filtered = COMMUNITY_APPS.filter((app) => {
      if (status === 'all') return true;
      return app.status === status;
    })
      .sort((a, b) => b.votes - a.votes)
      .slice(0, limit)
      .map((app) => {
        const trend = buildTrend(app.id, 7);
        const last7 = trend.reduce(
          (acc, d) => {
            acc.views += d.views;
            acc.launches += d.launches;
            acc.votes += d.votes;
            return acc;
          },
          { views: 0, launches: 0, votes: 0 }
        );
        return {
          ...app,
          badges: buildBadges(app),
          trend7d: trend,
          trendSummary7d: last7,
        };
      });
    res.json({ ok: true, apps: filtered });
  });

  app.post('/api/community/apps/submit', (req, res) => {
    const {
      name,
      summary,
      creator,
      category,
      tags,
      playUrl,
      sourceUrl,
      coverImageUrl,
      cloudflareOption,
    } = req.body || {};

    if (!name || !summary || !creator) {
      res.status(400).json({ ok: false, error: 'name, summary, and creator are required' });
      return;
    }

    const option: CloudflareBuildOption = CLOUDFLARE_BUILD_OPTIONS.has(cloudflareOption)
      ? cloudflareOption
      : 'workers';

    const appEntry: CommunityArcadeApp = {
      id: `community-${Date.now()}`,
      name: String(name).trim(),
      summary: String(summary).trim(),
      creator: String(creator).trim(),
      category: String(category || 'misc').trim(),
      tags: Array.isArray(tags)
        ? tags
            .map((tag) => String(tag).trim())
            .filter(Boolean)
            .slice(0, 12)
        : [],
      status: 'pending',
      playUrl: playUrl ? String(playUrl).trim() : undefined,
      sourceUrl: sourceUrl ? String(sourceUrl).trim() : undefined,
      coverImageUrl: coverImageUrl ? String(coverImageUrl).trim() : undefined,
      votes: 0,
      totalViews: 0,
      totalLaunches: 0,
      totalSubmissions: 1,
      cloudflare: { option },
      createdAt: new Date().toISOString(),
    };

    COMMUNITY_APPS.unshift(appEntry);
    pushEvent(appEntry.id, 'submit', appEntry.creator);
    scheduleCommunityPersist();
    res.status(201).json({
      ok: true,
      app: appEntry,
      moderation: 'queued',
      message: 'Submission received and queued for AI-ARCADE review.',
    });
  });

  app.post('/api/community/apps/:appId/vote', (req, res) => {
    const appId = String(req.params.appId || '');
    const app = COMMUNITY_APPS.find((entry) => entry.id === appId);
    if (!app) {
      res.status(404).json({ ok: false, error: 'app not found' });
      return;
    }
    const userId = normalizeUserId(req, req.body?.userId);
    const voters = APP_VOTERS.get(appId) || new Set<string>();
    if (voters.has(userId)) {
      res.json({ ok: true, appId, votes: app.votes, duplicate: true });
      return;
    }
    voters.add(userId);
    APP_VOTERS.set(appId, voters);
    app.votes += 1;
    pushEvent(appId, 'vote', userId);
    scheduleCommunityPersist();
    res.json({ ok: true, appId, votes: app.votes, duplicate: false });
  });

  app.post('/api/community/apps/:appId/engagement', (req, res) => {
    const appId = String(req.params.appId || '');
    const app = COMMUNITY_APPS.find((entry) => entry.id === appId);
    if (!app) {
      res.status(404).json({ ok: false, error: 'app not found' });
      return;
    }
    const typeRaw = String(req.body?.type || '').toLowerCase();
    if (typeRaw !== 'view' && typeRaw !== 'launch') {
      res.status(400).json({ ok: false, error: 'type must be view or launch' });
      return;
    }
    const userId = normalizeUserId(req, req.body?.userId);
    if (typeRaw === 'view') app.totalViews += 1;
    if (typeRaw === 'launch') app.totalLaunches += 1;
    pushEvent(appId, typeRaw as EngagementType, userId);
    scheduleCommunityPersist();
    res.json({
      ok: true,
      appId,
      type: typeRaw,
      totals: {
        views: app.totalViews,
        launches: app.totalLaunches,
        votes: app.votes,
      },
    });
  });

  app.get('/api/community/apps/:appId/trends', (req, res) => {
    const appId = String(req.params.appId || '');
    const app = COMMUNITY_APPS.find((entry) => entry.id === appId);
    if (!app) {
      res.status(404).json({ ok: false, error: 'app not found' });
      return;
    }
    const daysRaw = Number(req.query.days || 14);
    const days = Number.isFinite(daysRaw) ? Math.max(3, Math.min(60, Math.floor(daysRaw))) : 14;
    const trend = buildTrend(appId, days);
    const summary = trend.reduce(
      (acc, d) => {
        acc.views += d.views;
        acc.launches += d.launches;
        acc.votes += d.votes;
        acc.uniqueUsers += d.uniqueUsers;
        return acc;
      },
      { views: 0, launches: 0, votes: 0, uniqueUsers: 0 }
    );
    res.json({ ok: true, appId, days, trend, summary });
  });

  app.get('/api/community/apps/:appId/achievements', (req, res) => {
    const appId = String(req.params.appId || '');
    const app = COMMUNITY_APPS.find((entry) => entry.id === appId);
    if (!app) {
      res.status(404).json({ ok: false, error: 'app not found' });
      return;
    }
    res.json({ ok: true, appId, badges: buildBadges(app) });
  });

  app.get('/api/community/apps/:appId/comments', (req, res) => {
    const appId = String(req.params.appId || '');
    const app = COMMUNITY_APPS.find((entry) => entry.id === appId);
    if (!app) {
      res.status(404).json({ ok: false, error: 'app not found' });
      return;
    }
    const limitRaw = Number(req.query.limit || 20);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(100, Math.floor(limitRaw))) : 20;
    const comments = COMMUNITY_COMMENTS.filter((comment) => comment.appId === appId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, limit);
    res.json({ ok: true, appId, comments });
  });

  app.post('/api/community/apps/:appId/comments', (req, res) => {
    const appId = String(req.params.appId || '');
    const app = COMMUNITY_APPS.find((entry) => entry.id === appId);
    if (!app) {
      res.status(404).json({ ok: false, error: 'app not found' });
      return;
    }
    const text = String(req.body?.text || '').trim();
    if (!text) {
      res.status(400).json({ ok: false, error: 'comment text is required' });
      return;
    }
    const userId = normalizeUserId(req, req.body?.userId);
    const comment: CommunityComment = {
      id: `cmt-${Date.now()}-${randomInt(0, 2821109907455).toString(36)}`,
      appId,
      userId,
      text: text.slice(0, 500),
      createdAt: new Date().toISOString(),
    };
    COMMUNITY_COMMENTS.unshift(comment);
    pushEvent(appId, 'comment', userId);
    scheduleCommunityPersist();
    res.status(201).json({ ok: true, appId, comment });
  });

  app.get('/api/community/activities/recent', (req, res) => {
    const limitRaw = Number(req.query.limit || 30);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, Math.floor(limitRaw))) : 30;
    const type = String(req.query.type || 'all').toLowerCase();

    const actionItems = ENGAGEMENT_EVENTS.map((event) => ({
      id: `act-${event.appId}-${event.type}-${event.timestamp}`,
      kind: 'action',
      appId: event.appId,
      type: event.type,
      userId: event.userId,
      text:
        event.type === 'vote'
          ? `${event.userId} upvoted an app`
          : event.type === 'launch'
            ? `${event.userId} launched an app`
            : event.type === 'comment'
              ? `${event.userId} commented on an app`
              : event.type === 'submit'
                ? `${event.userId} submitted a new app`
                : `${event.userId} viewed an app`,
      timestamp: event.timestamp,
    }));

    const commentItems = COMMUNITY_COMMENTS.map((comment) => ({
      id: `comment-${comment.id}`,
      kind: 'comment',
      appId: comment.appId,
      type: 'comment',
      userId: comment.userId,
      text: comment.text,
      timestamp: comment.createdAt,
    }));

    let merged = [...actionItems, ...commentItems];
    if (type === 'actions') merged = actionItems;
    if (type === 'comments') merged = commentItems;

    const recent = merged
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
      .slice(0, limit);
    res.json({ ok: true, type, activities: recent });
  });

  app.get('/api/community/persistence/status', async (req, res) => {
    let localStateExists = false;
    try {
      await fs.access(COMMUNITY_STATE_PATH);
      localStateExists = true;
    } catch {
      localStateExists = false;
    }
    res.json({
      ok: true,
      localStateExists,
      localStatePath: COMMUNITY_STATE_PATH,
      cloudflareExportDir: CLOUDFLARE_EXPORT_DIR,
      exports: {
        d1Sql: path.join(CLOUDFLARE_EXPORT_DIR, 'community-d1-seed.sql'),
        r2Snapshot: path.join(CLOUDFLARE_EXPORT_DIR, 'community-latest.json'),
      },
    });
  });

  await loadCommunityState();

  // Initialize the holdem-engine poker table
  const engine = await loadHoldemEngine();
  pokerEngine = engine.createHoldemTable({
    tableId: 'arcade-main-1',
    maxSeats: 9,
    smallBlind: 100,
    bigBlind: 200,
    mode: 'cash',
  });
  console.log('Holdem-engine poker table initialized');

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
