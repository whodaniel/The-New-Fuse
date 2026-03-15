import express from 'express';
import fs from 'fs/promises';
import http from 'http';
import path from 'path';
import { Hand } from 'pokersolver';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
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

// --- GAME LOGIC ---
const ROUNDS = ['WAITING', 'PRE_FLOP', 'FLOP', 'TURN', 'RIVER', 'SHOWDOWN'];
const FULL_DECK = (() => {
  const suits = ['h', 'd', 'c', 's'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  const deck: string[] = [];
  suits.forEach((s) => ranks.forEach((r) => deck.push(r + s)));
  return deck;
})();

const shuffle = (array: any[]) => {
  const newDeck = [...array];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

interface Player {
  id: string;
  name: string;
  avatar: string;
  stack: number;
  bet: number;
  cards: string[];
  active: boolean;
  folded: boolean;
  isAllIn: boolean;
  disconnected: boolean;
  acted: boolean;
}

interface GameState {
  deck: string[];
  communityCards: string[];
  pot: number;
  round: string;
  dealerIndex: number;
  turnIndex: number;
  lastAggressor: number;
  currentBet: number;
  seats: Player[];
  blinds: [number, number];
  blindLevel: number;
  nextBlindTime: number;
  logs: string[];
  winners: any[];
}

const BLIND_LEVELS = [
  [100, 200],
  [200, 400],
  [300, 600],
  [500, 1000],
  [1000, 2000],
  [2000, 4000],
  [5000, 10000],
];
const BLIND_INTERVAL = 5 * 60 * 1000; // 5 minutes

let gameState: GameState = {
  deck: [],
  communityCards: [],
  pot: 0,
  round: 'WAITING',
  dealerIndex: 0,
  turnIndex: 0,
  lastAggressor: -1,
  currentBet: 0,
  seats: Array(9)
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
      acted: false,
    })),
  blinds: BLIND_LEVELS[0] as [number, number],
  blindLevel: 0,
  nextBlindTime: Date.now() + BLIND_INTERVAL,
  logs: [],
  winners: [],
};

const addLog = (msg: string) => {
  gameState.logs.unshift(msg);
  if (gameState.logs.length > 20) gameState.logs.pop();
};

const broadcastState = () => {
  // Hide other players' cards
  const stateToSend = {
    ...gameState,
    seats: gameState.seats.map((s) => ({
      ...s,
      cards: s.cards.length > 0 ? ['hidden', 'hidden'] : [],
    })),
  };

  io.sockets.sockets.forEach((socket) => {
    const playerState = JSON.parse(JSON.stringify(stateToSend));
    const seatIdx = gameState.seats.findIndex((s) => s.id === socket.id);
    if (seatIdx !== -1 && gameState.seats[seatIdx].cards.length > 0) {
      playerState.seats[seatIdx].cards = gameState.seats[seatIdx].cards;
    }
    // In showdown, reveal all active cards
    if (gameState.round === 'SHOWDOWN') {
      playerState.seats = gameState.seats.map((s) => ({ ...s, cards: s.cards }));
    }
    socket.emit('gameState', playerState);
  });
};

const getNextActivePlayer = (startIndex: number) => {
  let nextIndex = (startIndex + 1) % 9;
  let guard = 0;
  while (
    (!gameState.seats[nextIndex].active ||
      gameState.seats[nextIndex].folded ||
      gameState.seats[nextIndex].isAllIn) &&
    guard < 10
  ) {
    nextIndex = (nextIndex + 1) % 9;
    guard++;
  }
  return guard < 10 ? nextIndex : -1;
};

const checkRoundEnd = () => {
  const activePlayers = gameState.seats.filter((s) => s.active && !s.folded);
  if (activePlayers.length <= 1) {
    endHand();
    return;
  }

  const playersCanAct = activePlayers.filter((s) => !s.isAllIn);
  if (playersCanAct.length <= 1) {
    const allMatched = activePlayers.every((s) => s.isAllIn || s.bet === gameState.currentBet);
    if (allMatched) {
      fastForwardToShowdown();
      return;
    }
  }

  const allActed = activePlayers.every((s) => s.acted || s.isAllIn);
  const allMatched = activePlayers.every((s) => s.isAllIn || s.bet === gameState.currentBet);

  if (allActed && allMatched) {
    nextRound();
  }
};

const fastForwardToShowdown = () => {
  while (gameState.communityCards.length < 5) {
    if (gameState.communityCards.length === 0) {
      gameState.communityCards.push(
        gameState.deck.pop()!,
        gameState.deck.pop()!,
        gameState.deck.pop()!
      );
    } else {
      gameState.communityCards.push(gameState.deck.pop()!);
    }
  }
  gameState.round = 'SHOWDOWN';
  evaluateHand();
};

const nextRound = () => {
  const idx = ROUNDS.indexOf(gameState.round);
  const next = ROUNDS[idx + 1] || 'WAITING';

  // Gather bets to pot
  gameState.seats.forEach((s) => {
    gameState.pot += s.bet;
    s.bet = 0;
    s.acted = false;
  });
  gameState.currentBet = 0;

  if (next === 'FLOP')
    gameState.communityCards.push(
      gameState.deck.pop()!,
      gameState.deck.pop()!,
      gameState.deck.pop()!
    );
  if (next === 'TURN' || next === 'RIVER') gameState.communityCards.push(gameState.deck.pop()!);

  gameState.round = next;

  if (next === 'SHOWDOWN') {
    evaluateHand();
  } else {
    gameState.lastAggressor = gameState.dealerIndex;
    gameState.turnIndex = getNextActivePlayer(gameState.dealerIndex);
    addLog(`--- ${next} ---`);
    broadcastState();
  }
};

const evaluateHand = () => {
  gameState.seats.forEach((s) => {
    gameState.pot += s.bet;
    s.bet = 0;
  });
  gameState.currentBet = 0;

  const activePlayers = gameState.seats.filter((s) => s.active && !s.folded);

  if (activePlayers.length === 1) {
    const winner = activePlayers[0];
    winner.stack += gameState.pot;
    addLog(`${winner.name} wins $${gameState.pot} (Others folded)`);
    gameState.winners = [{ id: winner.id, name: winner.name, amount: gameState.pot, hand: 'Fold' }];
  } else {
    const hands = activePlayers.map((p) => {
      const handCards = [...p.cards, ...gameState.communityCards];
      // Convert T, J, Q, K, A to pokersolver format (it uses T, J, Q, K, A and suits c, d, h, s)
      const solverHand = Hand.solve(handCards);
      return { player: p, hand: solverHand };
    });

    const winners = Hand.winners(hands.map((h) => h.hand));
    const winningPlayers = hands.filter((h) => winners.includes(h.hand));

    const splitPot = Math.floor(gameState.pot / winningPlayers.length);
    gameState.winners = winningPlayers.map((w) => {
      w.player.stack += splitPot;
      addLog(`${w.player.name} wins $${splitPot} with ${w.hand.name}`);
      return { id: w.player.id, name: w.player.name, amount: splitPot, hand: w.hand.name };
    });
  }

  broadcastState();

  setTimeout(() => {
    startHand();
  }, 5000);
};

const startHand = () => {
  // Check blind increase
  if (Date.now() > gameState.nextBlindTime && gameState.blindLevel < BLIND_LEVELS.length - 1) {
    gameState.blindLevel++;
    gameState.blinds = BLIND_LEVELS[gameState.blindLevel] as [number, number];
    gameState.nextBlindTime = Date.now() + BLIND_INTERVAL;
    addLog(`Blinds increased to ${gameState.blinds[0]}/${gameState.blinds[1]}`);
  }

  // Remove busted players
  gameState.seats.forEach((s, i) => {
    if (s.active && s.stack === 0) {
      s.active = false;
      s.id = `empty-${i}`;
      s.name = 'EMPTY';
      addLog(`${s.name} busted out!`);
    }
  });

  const activeCount = gameState.seats.filter((s) => s.active).length;
  if (activeCount < 2) {
    gameState.round = 'WAITING';
    gameState.pot = 0;
    gameState.communityCards = [];
    gameState.winners = [];
    addLog('Waiting for players...');
    broadcastState();
    return;
  }

  gameState.deck = shuffle(FULL_DECK);
  gameState.communityCards = [];
  gameState.pot = 0;
  gameState.round = 'PRE_FLOP';
  gameState.winners = [];

  // Move dealer button
  let nextDealer = (gameState.dealerIndex + 1) % 9;
  while (!gameState.seats[nextDealer].active) {
    nextDealer = (nextDealer + 1) % 9;
  }
  gameState.dealerIndex = nextDealer;

  const sbIndex = getNextActivePlayer(gameState.dealerIndex);
  const bbIndex = getNextActivePlayer(sbIndex);

  gameState.seats.forEach((s) => {
    if (s.active) {
      s.cards = [gameState.deck.pop()!, gameState.deck.pop()!];
      s.folded = false;
      s.isAllIn = false;
      s.bet = 0;
      s.acted = false;
    } else {
      s.cards = [];
      s.folded = true;
      s.acted = true;
    }
  });

  // Post blinds
  const sbPlayer = gameState.seats[sbIndex];
  const bbPlayer = gameState.seats[bbIndex];

  const sbAmount = Math.min(sbPlayer.stack, gameState.blinds[0]);
  sbPlayer.bet = sbAmount;
  sbPlayer.stack -= sbAmount;
  if (sbPlayer.stack === 0) sbPlayer.isAllIn = true;

  const bbAmount = Math.min(bbPlayer.stack, gameState.blinds[1]);
  bbPlayer.bet = bbAmount;
  bbPlayer.stack -= bbAmount;
  if (bbPlayer.stack === 0) bbPlayer.isAllIn = true;

  gameState.currentBet = gameState.blinds[1];
  gameState.lastAggressor = bbIndex;
  gameState.turnIndex = getNextActivePlayer(bbIndex);

  addLog(`Hand started. Dealer: ${gameState.seats[gameState.dealerIndex].name}`);
  broadcastState();
};

const endHand = () => {
  gameState.round = 'SHOWDOWN';
  evaluateHand();
};

io.on('connection', (socket) => {
  socket.on('join', (data) => {
    const emptySeat = gameState.seats.findIndex((s) => !s.active);
    if (emptySeat !== -1) {
      gameState.seats[emptySeat] = {
        id: socket.id,
        name: data.name || `Player_${Math.floor(Math.random() * 1000)}`,
        avatar: data.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${socket.id}`,
        stack: 10000,
        bet: 0,
        cards: [],
        active: true,
        folded: true,
        isAllIn: false,
        disconnected: false,
        acted: true,
      };
      addLog(`${gameState.seats[emptySeat].name} joined the table.`);
      broadcastState();

      if (gameState.round === 'WAITING' && gameState.seats.filter((s) => s.active).length >= 2) {
        startHand();
      }
    }
  });

  socket.on('action', (data) => {
    const { type, amount } = data;
    const seatIdx = gameState.seats.findIndex((s) => s.id === socket.id);
    if (
      seatIdx === -1 ||
      seatIdx !== gameState.turnIndex ||
      gameState.round === 'WAITING' ||
      gameState.round === 'SHOWDOWN'
    )
      return;

    const player = gameState.seats[seatIdx];

    if (type === 'FOLD') {
      player.folded = true;
      player.acted = true;
      addLog(`${player.name} folds`);
    } else if (type === 'CALL') {
      const callAmount = Math.min(player.stack, gameState.currentBet - player.bet);
      player.bet += callAmount;
      player.stack -= callAmount;
      player.acted = true;
      if (player.stack === 0) player.isAllIn = true;
      addLog(`${player.name} calls $${callAmount}`);
    } else if (type === 'RAISE') {
      const raiseAmount = Math.min(player.stack, amount - player.bet);
      if (player.bet + raiseAmount > gameState.currentBet) {
        player.bet += raiseAmount;
        player.stack -= raiseAmount;
        gameState.currentBet = player.bet;
        gameState.lastAggressor = seatIdx;
        player.acted = true;

        // Reset acted for everyone else
        gameState.seats.forEach((s, i) => {
          if (i !== seatIdx && s.active && !s.folded && !s.isAllIn) {
            s.acted = false;
          }
        });

        if (player.stack === 0) player.isAllIn = true;
        addLog(`${player.name} raises to $${player.bet}`);
      }
    }

    gameState.turnIndex = getNextActivePlayer(seatIdx);
    checkRoundEnd();
    broadcastState();
  });

  socket.on('disconnect', () => {
    const seatIdx = gameState.seats.findIndex((s) => s.id === socket.id);
    if (seatIdx !== -1) {
      const player = gameState.seats[seatIdx];
      player.disconnected = true;
      player.folded = true;
      addLog(`${player.name} disconnected`);
      if (gameState.turnIndex === seatIdx) {
        gameState.turnIndex = getNextActivePlayer(seatIdx);
        checkRoundEnd();
      }
      player.active = false;
      player.id = `empty-${seatIdx}`;
      player.name = 'EMPTY';
      broadcastState();
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
      id: `cmt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
