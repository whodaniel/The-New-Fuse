/**
 * API Client — connects React frontend to Railway backend at thenewfuse.com
 * All poker game state, tournaments, cashier, agents, etc. go through here.
 */

const isArcadeHost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'poker.ai-arcade.xyz' ||
    window.location.hostname.endsWith('.ai-arcade.xyz'));
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (isArcadeHost
    ? window.location.origin
    : typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:3000'
      : 'https://api.thenewfuse.com/api/v1/poker');

const COMMUNITY_BASE_URL =
  import.meta.env.VITE_COMMUNITY_API_URL || 'https://ai-arcade-community-api.bizsynth.workers.dev';

export async function api(path: string, options: any = {}) {
  const attempts = options.retry === false ? 1 : 2;
  const fullPath = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  let lastErr = null;
  for (let i = 0; i < attempts; i += 1) {
    let timeout: any;
    try {
      const ctl = new AbortController();
      timeout = setTimeout(() => ctl.abort('timeout'), options.timeoutMs || 12000);
      const res = await fetch(fullPath, {
        method: options.method || 'GET',
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: ctl.signal,
      });
      const json = await res.json().catch(() => ({ ok: false, error: 'Invalid response' }));
      if (!res.ok || json.ok === false) throw new Error(json.error || `HTTP ${res.status}`);
      return json;
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 250));
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export async function communityApiRequest(path: string, options: any = {}) {
  const attempts = options.retry === false ? 1 : 2;
  const fullPath = path.startsWith('http') ? path : `${COMMUNITY_BASE_URL}${path}`;
  let lastErr = null;
  for (let i = 0; i < attempts; i += 1) {
    let timeout: any;
    try {
      const ctl = new AbortController();
      timeout = setTimeout(() => ctl.abort('timeout'), options.timeoutMs || 12000);
      const res = await fetch(fullPath, {
        method: options.method || 'GET',
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: ctl.signal,
      });
      const json = await res.json().catch(() => ({ ok: false, error: 'Invalid response' }));
      if (!res.ok || json.ok === false) throw new Error(json.error || `HTTP ${res.status}`);
      return json;
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 250));
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

// --- Poker Table APIs ---
export const pokerApi = {
  async initTableState(tableId: string, handId: string, seats: any[], actingSeat = 0, pot = 0) {
    return api('/api/table/state/init', {
      method: 'POST',
      body: {
        tableId,
        handId,
        seats: seats.map((s, i) => ({ ...s, seat: i, folded: false })),
        actingSeat,
        pot,
      },
    });
  },
  async getState(tableId: string) {
    return api(`/api/table/state?tableId=${encodeURIComponent(tableId)}`);
  },
  async playerAction(tableId: string, seat: number, action: string, amount = 0) {
    return api('/api/table/action', {
      method: 'POST',
      body: {
        tableId,
        idempotencyKey: crypto.randomUUID(),
        type: 'player.action',
        seat,
        action,
        amount,
      },
    });
  },
  async autoRound(tableId: string, handId: string, seats: any[], maxActions = 6) {
    return api('/api/table/round/auto', {
      method: 'POST',
      body: {
        tableId,
        handId,
        seats: seats.map((s, i) => ({ ...s, seat: i, folded: false })),
        maxActions,
      },
    });
  },
  async settleHand(tableId: string, winnerSeat: number, payoutUnits: number) {
    return api('/api/table/settle', { method: 'POST', body: { tableId, winnerSeat, payoutUnits } });
  },
};

// --- V2 Hold'em Cash Table APIs ---
export const holdemV2Api = {
  async tables() {
    return api('/api/v2/holdem/tables');
  },
  async createTable(config: any) {
    return api('/api/v2/holdem/tables', { method: 'POST', body: config });
  },
  async seat(payload: any) {
    return api('/api/v2/holdem/seat', { method: 'POST', body: payload });
  },
  async setConnection(tableId: string, playerId: string, connected = true) {
    return api('/api/v2/holdem/connection', {
      method: 'POST',
      body: { tableId, playerId, connected },
    });
  },
  async resume(tableId: string, playerId: string) {
    return api('/api/v2/holdem/resume', { method: 'POST', body: { tableId, playerId } });
  },
  async startHand(tableId: string, handId?: string) {
    return api('/api/v2/holdem/hands/start', {
      method: 'POST',
      body: {
        tableId,
        handId: handId || `hand-${Date.now()}`,
        idempotencyKey: crypto.randomUUID(),
      },
    });
  },
  async action(payload: {
    tableId: string;
    playerId: string;
    action: string;
    amount?: number;
    resumeToken: string;
    expectedReplayCursor?: number;
  }) {
    return api('/api/v2/holdem/actions', {
      method: 'POST',
      body: {
        tableId: payload.tableId,
        playerId: payload.playerId,
        action: payload.action,
        amount: payload.amount ?? 0,
        resumeToken: payload.resumeToken,
        expectedReplayCursor: payload.expectedReplayCursor,
        idempotencyKey: crypto.randomUUID(),
      },
    });
  },
  async state(tableId: string, playerId?: string) {
    const params = new URLSearchParams({ tableId });
    if (playerId) params.set('playerId', playerId);
    return api(`/api/v2/holdem/state?${params.toString()}`);
  },
};

// --- SNG Tournament APIs ---
export const sngApi = {
  async create(config: any) {
    return api('/api/sng/create', { method: 'POST', body: config });
  },
  async register(sngId: string, playerId: string) {
    return api('/api/sng/register', { method: 'POST', body: { sngId, playerId } });
  },
  async advance(sngId: string) {
    return api('/api/sng/advance', { method: 'POST', body: { sngId } });
  },
  async eliminate(sngId: string, playerId: string) {
    return api('/api/sng/eliminate', { method: 'POST', body: { sngId, playerId } });
  },
  async payouts(sngId: string) {
    return api('/api/sng/payouts', { method: 'POST', body: { sngId } });
  },
  async state(sngId: string) {
    return api(`/api/sng/state?sngId=${encodeURIComponent(sngId)}`);
  },
};

// --- MTT Tournament APIs ---
export const mttApi = {
  async create(config: any) {
    return api('/api/mtt/create', { method: 'POST', body: config });
  },
  async register(mttId: string, playerId: string) {
    return api('/api/mtt/register', { method: 'POST', body: { mttId, playerId } });
  },
  async start(mttId: string) {
    return api('/api/mtt/start', { method: 'POST', body: { mttId } });
  },
  async eliminate(mttId: string, playerId: string) {
    return api('/api/mtt/eliminate', { method: 'POST', body: { mttId, playerId } });
  },
  async state(mttId: string) {
    return api(`/api/mtt/state?mttId=${encodeURIComponent(mttId)}`);
  },
};

// --- V2 Tournament APIs ---
export const tournamentApi = {
  async create(config: any) {
    return api('/api/v2/tournaments/create', { method: 'POST', body: config });
  },
  async register(tournamentId: string, playerId: string) {
    return api('/api/v2/tournaments/register', {
      method: 'POST',
      body: { tournamentId, playerId },
    });
  },
  async start(tournamentId: string) {
    return api('/api/v2/tournaments/start', { method: 'POST', body: { tournamentId } });
  },
  async clock(tournamentId: string) {
    return api(`/api/v2/tournaments/clock?tournamentId=${encodeURIComponent(tournamentId)}`);
  },
  async rebuy(tournamentId: string, playerId: string) {
    return api('/api/v2/tournaments/rebuy', { method: 'POST', body: { tournamentId, playerId } });
  },
  async addon(tournamentId: string, playerId: string) {
    return api('/api/v2/tournaments/addon', { method: 'POST', body: { tournamentId, playerId } });
  },
  async eliminate(tournamentId: string, playerId: string) {
    return api('/api/v2/tournaments/eliminate', {
      method: 'POST',
      body: { tournamentId, playerId },
    });
  },
  async payouts(tournamentId: string) {
    return api('/api/v2/tournaments/payouts', { method: 'POST', body: { tournamentId } });
  },
};

// --- Cashier / Wallet APIs ---
export const cashierApi = {
  async deposit(playerId: string, amount: number) {
    return api('/api/cashier/deposit', {
      method: 'POST',
      body: { playerId, amount, idempotencyKey: crypto.randomUUID() },
    });
  },
  async withdraw(playerId: string, amount: number) {
    return api('/api/cashier/withdraw-request', {
      method: 'POST',
      body: { playerId, amount, idempotencyKey: crypto.randomUUID() },
    });
  },
  async wallet(playerId: string) {
    return api(`/api/cashier/wallet?playerId=${encodeURIComponent(playerId)}`);
  },
  async reconcile() {
    return api('/api/cashier/reconcile', { method: 'POST', body: {} });
  },
  async attestation() {
    return api('/api/cashier/attestation');
  },
};

// --- Fairness / Provably Fair APIs ---
export const fairApi = {
  async commit(tableId: string) {
    return api('/api/fair/commit', { method: 'POST', body: { tableId } });
  },
  async verify(handId: string, serverSeed?: string, clientSeed?: string) {
    return api('/api/fair/verify', { method: 'POST', body: { handId, serverSeed, clientSeed } });
  },
  async rotate(tableId: string) {
    return api('/api/fair/rotate', { method: 'POST', body: { tableId } });
  },
};

// --- Sponsorship APIs ---
export const sponsorshipApi = {
  async marketplace() {
    return api('/api/sponsorships/marketplace');
  },
  async open(config: any) {
    return api('/api/sponsorships/open', { method: 'POST', body: config });
  },
  async fund(sponsorshipId: string, amount: number, investorId: string) {
    return api('/api/sponsorships/fund', {
      method: 'POST',
      body: { sponsorshipId, amount, investorId },
    });
  },
  async claim(sponsorshipId: string, playerId: string) {
    return api('/api/sponsorships/claim', { method: 'POST', body: { sponsorshipId, playerId } });
  },
  async analytics() {
    return api('/api/sponsorships/analytics');
  },
};

// --- Hand History APIs ---
export const handsApi = {
  async list() {
    return api('/api/hands');
  },
  async get(handId: string) {
    return api(`/api/hands/${encodeURIComponent(handId)}`);
  },
  async replay(handId: string) {
    return api(`/api/hands/${encodeURIComponent(handId)}/replay`);
  },
};

// --- Session APIs ---
export const sessionApi = {
  async create(username: string) {
    return api('/api/session', { method: 'POST', body: { username } });
  },
  async profile(sessionId: string) {
    return api(`/api/session/profile?sessionId=${encodeURIComponent(sessionId)}`);
  },
};

// --- Leaderboard API ---
export const leaderboardApi = {
  async get(period = 'all', category = 'overall') {
    return api(`/api/ledger?period=${period}&category=${category}`);
  },
};

// --- Agent / Strategy APIs ---
export const agentApi = {
  async register(agentId: string, temperament: string, riskBps: number) {
    await api('/api/agents/register', {
      method: 'POST',
      body: { agentId, ownerId: 'system', tier: 'B', style: temperament },
      retry: false,
    }).catch(() => {});
    return api('/api/strategy/profile', {
      method: 'POST',
      body: { agentId, temperament, maxRiskBps: riskBps },
      retry: false,
    }).catch(() => {});
  },
  async nurtureInit(config: {
    agentId: string;
    ownerId: string;
    objective: string;
    targetBbps: number;
    distributed?: boolean;
    cluster?: boolean;
  }) {
    return api('/api/agents/nurture/init', { method: 'POST', body: config });
  },
  async nurtureEpisode(data: {
    agentId: string;
    bb100: number;
    exploitabilityProxy: number;
    policyEntropy: number;
    showdownErrorRateBps: number;
    decisionLatencyMsP95: number;
    legalViolationRateBps: number;
    volatilityBps: number;
    episodeSource: string;
    learnerActors: number;
    traversalsPerIteration: number;
    miniBatchSize: number;
  }) {
    return api('/api/agents/nurture/episode', { method: 'POST', body: data });
  },
  async nurtureEvaluate(agentId: string) {
    return api('/api/agents/nurture/evaluate', { method: 'POST', body: { agentId } });
  },
  async nurtureState(agentId: string) {
    return api(`/api/agents/nurture/state?agentId=${encodeURIComponent(agentId)}`);
  },
  async nurtureCompare(agentIds: string[], sortMode = 'bb100_desc') {
    return api('/api/agents/nurture/compare', {
      method: 'POST',
      body: { agentIds, sortMode },
    });
  },
};

// --- Agent Crafting APIs (Workspace-Aware) ---
export const agentCraftingApi = {
  async getTemplates() {
    return api('/api/agent-crafting/templates');
  },
  async craft(
    workspaceId: string,
    data: { name: string; temperament: string; description?: string }
  ) {
    return api(`/api/agent-crafting/craft/${workspaceId}`, {
      method: 'POST',
      body: data,
    });
  },
  async initNurture(agentId: string, workspaceId: string) {
    return api(`/api/agent-crafting/nurture/${agentId}`, {
      method: 'POST',
      body: { workspaceId },
    });
  },
};

/**
 * User Bots API — CRUD for custom player bots (persisted on server)
 */
export const userBotsApi = {
  list: () => api('/api/user-bots'),
  create: (data: any) => api('/api/user-bots', { method: 'POST', body: data }),
  update: (id: string, data: any) => api(`/api/user-bots/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => api(`/api/user-bots/${id}`, { method: 'DELETE' }),
};

export const agentRegistryApi = {
  async search(query: any = {}) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined) params.append(k, String(v));
    });
    return api(`/api/agent-registry/directory?${params.toString()}`);
  },
  async featured(limit = 10) {
    return api(`/api/agent-registry/directory/featured?limit=${limit}`);
  },
  async details(agentId: string) {
    return api(`/api/agent-registry/directory/${encodeURIComponent(agentId)}`);
  },
};

export type CloudflareBuildOption =
  | 'workers'
  | 'pages'
  | 'durable-objects'
  | 'queues'
  | 'd1'
  | 'r2'
  | 'ai-gateway'
  | 'agents-sdk';

export interface CommunityArcadeApp {
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
  votes?: number;
  totalViews?: number;
  totalLaunches?: number;
  totalSubmissions?: number;
  badges?: Array<{ id: string; name: string; description: string }>;
  trend7d?: Array<{
    date: string;
    views: number;
    launches: number;
    votes: number;
    uniqueUsers: number;
  }>;
  trendSummary7d?: {
    views: number;
    launches: number;
    votes: number;
  };
  cloudflare: {
    option: CloudflareBuildOption;
    deploymentUrl?: string;
    projectName?: string;
    accountId?: string;
  };
  createdAt: string;
}

export interface CommunityComment {
  id: string;
  appId: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface CommunityActivity {
  id: string;
  kind: 'action' | 'comment';
  appId: string;
  type: string;
  userId: string;
  text: string;
  timestamp: string;
}

export interface CommunityMembership {
  username: string;
  status: string;
  role?: string;
  addedAt: string;
}

export interface CommunityMembershipResponse {
  exists: boolean;
  username: string;
  membership?: CommunityMembership;
}

export const communityApi = {
  async list(status: 'published' | 'pending' | 'all' = 'published', limit = 24) {
    return communityApiRequest(
      `/api/community/apps?status=${encodeURIComponent(status)}&limit=${encodeURIComponent(limit)}`
    );
  },
  async submit(input: {
    name: string;
    summary: string;
    creator: string;
    category: string;
    tags?: string[];
    playUrl?: string;
    sourceUrl?: string;
    coverImageUrl?: string;
    cloudflareOption: CloudflareBuildOption;
  }) {
    return communityApiRequest('/api/community/apps/submit', {
      method: 'POST',
      body: input,
    });
  },
  async upvote(appId: string, userId?: string) {
    return communityApiRequest(`/api/community/apps/${encodeURIComponent(appId)}/vote`, {
      method: 'POST',
      body: { userId },
    });
  },
  async trackEngagement(appId: string, type: 'view' | 'launch', userId?: string) {
    return communityApiRequest(`/api/community/apps/${encodeURIComponent(appId)}/engagement`, {
      method: 'POST',
      body: { type, userId },
      retry: false,
    });
  },
  async trends(appId: string, days = 14) {
    return communityApiRequest(
      `/api/community/apps/${encodeURIComponent(appId)}/trends?days=${days}`
    );
  },
  async achievements(appId: string) {
    return communityApiRequest(`/api/community/apps/${encodeURIComponent(appId)}/achievements`);
  },
  async comments(appId: string, limit = 20) {
    return communityApiRequest(
      `/api/community/apps/${encodeURIComponent(appId)}/comments?limit=${limit}`
    );
  },
  async addComment(appId: string, text: string, userId?: string) {
    return communityApiRequest(`/api/community/apps/${encodeURIComponent(appId)}/comments`, {
      method: 'POST',
      body: { text, userId },
    });
  },
  async recentActivities(limit = 30, type: 'all' | 'actions' | 'comments' = 'all') {
    return communityApiRequest(`/api/community/activities/recent?limit=${limit}&type=${type}`);
  },
  async persistenceStatus() {
    return communityApiRequest('/api/community/persistence/status');
  },
  async membership(username: string) {
    return communityApiRequest(`/api/community/membership/${encodeURIComponent(username)}`);
  },
};
