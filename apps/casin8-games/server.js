const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pathToFileURL } = require('url');

const PORT = Number(process.env.PORT || 3000);
const root = __dirname;
const dataDir = path.join(root, '.data');
const statePath = path.join(dataDir, 'state.json');
const maxTableEvents = 200;
const maxLedgerEntries = 200;
const rateLimitWindowMs = 60_000;
const rateLimitMax = 240;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
};

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const enginePromise = import(pathToFileURL(path.join(root, 'engine.mjs')).href);

const sseClients = new Map();
const rateLimits = new Map();

const state = loadState();
const metrics = {
  startedAt: nowIso(),
  requestsTotal: 0,
  apiRequestsTotal: 0,
  playRequestsTotal: 0,
  playFailuresTotal: 0,
  onchainVerifyAttempts: 0,
  onchainVerifyPass: 0,
  onchainVerifyFail: 0,
};

function nowIso() {
  return new Date().toISOString();
}

function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function randomSeedHex(bytes = 24) {
  return crypto.randomBytes(bytes).toString('hex');
}

function loadState() {
  try {
    if (!fs.existsSync(statePath)) {
      return { sessions: {}, tables: {} };
    }
    const raw = fs.readFileSync(statePath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      sessions: parsed.sessions && typeof parsed.sessions === 'object' ? parsed.sessions : {},
      tables: parsed.tables && typeof parsed.tables === 'object' ? parsed.tables : {},
    };
  } catch {
    return { sessions: {}, tables: {} };
  }
}

function persistState() {
  const tmp = `${statePath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state), 'utf8');
  fs.renameSync(tmp, statePath);
}

function getIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    return xff.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function isRateLimited(req) {
  const ip = getIp(req);
  const current = Date.now();
  const bucket = rateLimits.get(ip) || { count: 0, resetAt: current + rateLimitWindowMs };
  if (current > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = current + rateLimitWindowMs;
  }
  bucket.count += 1;
  rateLimits.set(ip, bucket);
  return bucket.count > rateLimitMax;
}

function writeJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function badRequest(res, message) {
  writeJson(res, 400, { ok: false, error: message });
}

function notFound(res) {
  writeJson(res, 404, { ok: false, error: 'Not found' });
}

function applySecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
}

function chainConfig() {
  return {
    enabled:
      !!process.env.CASIN8_CONTRACT_TOKEN &&
      !!process.env.CASIN8_CONTRACT_MERKABA &&
      !!process.env.CASIN8_CHAIN_RPC_URL,
    chainId: Number(process.env.CASIN8_CHAIN_ID || 8453),
    network: process.env.CASIN8_CHAIN_NETWORK || 'base',
    rpcUrl: process.env.CASIN8_CHAIN_RPC_URL || 'https://mainnet.base.org',
    address: {
      token: process.env.CASIN8_CONTRACT_TOKEN || '',
      merkaba: process.env.CASIN8_CONTRACT_MERKABA || '',
    },
  };
}

async function rpcCall(rpcUrl, method, params) {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    }),
  });
  if (!res.ok) {
    throw new Error(`RPC HTTP ${res.status}`);
  }
  const json = await res.json();
  if (json.error) {
    throw new Error(`RPC ${method} error: ${json.error.message || 'unknown'}`);
  }
  return json.result;
}

function normalizeHexAddress(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function hexToBigInt(hex) {
  if (!hex || hex === '0x') return 0n;
  return BigInt(hex);
}

function decodeLastUint256FromInput(inputHex) {
  const input = String(inputHex || '').toLowerCase();
  if (!input.startsWith('0x') || input.length < 10 + 64) {
    throw new Error('Invalid tx input data');
  }
  const payload = input.slice(2);
  const tail64 = payload.slice(-64);
  return BigInt(`0x${tail64}`);
}

async function verifyOnchainSettlement(onchain, cfg) {
  metrics.onchainVerifyAttempts += 1;
  if (!cfg.enabled) {
    throw new Error('On-chain settlement not enabled on server');
  }

  const expectedTo = normalizeHexAddress(cfg.address.merkaba);
  const expectedFrom = normalizeHexAddress(onchain.account);
  const expectedAmount = BigInt(String(onchain.tokenAmountRaw || '0'));
  const txHash = String(onchain.txHash || '');

  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    throw new Error('Invalid on-chain tx hash format');
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(expectedFrom)) {
    throw new Error('Invalid on-chain account format');
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(expectedTo)) {
    throw new Error('Server merkaba contract address is invalid');
  }
  if (expectedAmount <= 0n) {
    throw new Error('Invalid on-chain token amount');
  }

  const [tx, receipt, chainHex] = await Promise.all([
    rpcCall(cfg.rpcUrl, 'eth_getTransactionByHash', [txHash]),
    rpcCall(cfg.rpcUrl, 'eth_getTransactionReceipt', [txHash]),
    rpcCall(cfg.rpcUrl, 'eth_chainId', []),
  ]);

  if (!tx) {
    throw new Error('On-chain transaction not found');
  }
  if (!receipt) {
    throw new Error('On-chain transaction receipt not found yet');
  }

  const receiptStatus = String(receipt.status || '').toLowerCase();
  if (receiptStatus !== '0x1') {
    throw new Error('On-chain transaction failed');
  }

  const txTo = normalizeHexAddress(tx.to);
  const txFrom = normalizeHexAddress(tx.from);
  if (txTo !== expectedTo) {
    throw new Error('On-chain tx destination does not match merkaba contract');
  }
  if (txFrom !== expectedFrom) {
    throw new Error('On-chain tx sender does not match submitted account');
  }

  const decodedAmount = decodeLastUint256FromInput(tx.input);
  if (decodedAmount !== expectedAmount) {
    throw new Error('On-chain tx amount does not match submitted token amount');
  }

  // Enforce presence of ERC20 Transfer(from -> merkaba, amount) log on configured token.
  const expectedToken = normalizeHexAddress(cfg.address.token);
  if (!/^0x[a-fA-F0-9]{40}$/.test(expectedToken)) {
    throw new Error('Server token contract address is invalid');
  }
  const transferTopicPrefix = '0xddf252ad';
  const fromTopic = `0x${expectedFrom.replace(/^0x/, '').padStart(64, '0')}`;
  const toTopic = `0x${expectedTo.replace(/^0x/, '').padStart(64, '0')}`;

  const matchingTransfer = Array.isArray(receipt.logs)
    ? receipt.logs.find((log) => {
        const logAddress = normalizeHexAddress(log?.address);
        const topics = Array.isArray(log?.topics)
          ? log.topics.map((t) => String(t).toLowerCase())
          : [];
        if (logAddress !== expectedToken) return false;
        if (topics.length < 3) return false;
        if (!topics[0].startsWith(transferTopicPrefix)) return false;
        if (topics[1] !== fromTopic) return false;
        if (topics[2] !== toTopic) return false;
        const value = hexToBigInt(String(log?.data || '0x0'));
        return value === expectedAmount;
      })
    : null;

  if (!matchingTransfer) {
    throw new Error('On-chain transfer log verification failed');
  }

  const submittedChainId = Number(onchain.chainId || 0);
  const rpcChainId = Number(hexToBigInt(chainHex));
  if (submittedChainId > 0 && submittedChainId !== rpcChainId) {
    throw new Error('Submitted chainId does not match RPC chainId');
  }

  const out = {
    verified: true,
    chainId: rpcChainId,
    blockNumber: Number(hexToBigInt(receipt.blockNumber || '0x0')),
    txHash,
    from: txFrom,
    to: txTo,
    token: expectedToken,
    amountRaw: decodedAmount.toString(),
  };
  metrics.onchainVerifyPass += 1;
  return out;
}

function sanitizeName(input) {
  const raw = String(input || '').trim();
  if (!raw) return 'Player';
  return raw.replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 32) || 'Player';
}

function sanitizeTable(input) {
  const raw = String(input || '')
    .trim()
    .toLowerCase();
  return raw.replace(/[^a-z0-9_-]/g, '').slice(0, 48) || 'lobby-1';
}

function getSessionOrNull(sessionId) {
  if (!sessionId) return null;
  return state.sessions[String(sessionId)] || null;
}

function sessionSummary(session) {
  return {
    sessionId: session.id,
    playerName: session.playerName,
    bankroll: session.bankroll,
    rounds: session.rounds,
    wins: session.wins,
    losses: session.losses,
    clientSeed: session.clientSeed,
    serverSeedHash: session.serverSeedHash,
    nonce: session.nonce,
    tableId: session.tableId,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

function ensureTable(tableId) {
  if (!state.tables[tableId]) {
    state.tables[tableId] = { id: tableId, events: [] };
  }
  return state.tables[tableId];
}

function publishTableEvent(tableId, event) {
  const table = ensureTable(tableId);
  table.events.unshift(event);
  if (table.events.length > maxTableEvents) {
    table.events.length = maxTableEvents;
  }

  const clients = sseClients.get(tableId);
  if (clients && clients.size > 0) {
    const line = `data: ${JSON.stringify(event)}\n\n`;
    for (const res of clients) {
      res.write(line);
    }
  }
}

function pushLedger(session, entry) {
  session.ledger.unshift(entry);
  if (session.ledger.length > maxLedgerEntries) {
    session.ledger.length = maxLedgerEntries;
  }
}

function readBodyJson(req) {
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > 1024 * 64) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        resolve(parsed && typeof parsed === 'object' ? parsed : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

async function handleCreateSession(req, res) {
  const body = await readBodyJson(req);
  const playerName = sanitizeName(body.playerName);
  const clientSeed = String(body.clientSeed || randomSeedHex(16)).slice(0, 64);
  const tableId = sanitizeTable(body.tableId || 'lobby-1');

  const id = crypto.randomUUID();
  const serverSeed = randomSeedHex(32);
  const createdAt = nowIso();
  const session = {
    id,
    playerName,
    bankroll: 1000,
    rounds: 0,
    wins: 0,
    losses: 0,
    clientSeed,
    serverSeed,
    serverSeedHash: sha256Hex(serverSeed),
    nonce: 1,
    tableId,
    ledger: [],
    createdAt,
    updatedAt: createdAt,
  };

  state.sessions[id] = session;
  publishTableEvent(tableId, {
    type: 'join',
    tableId,
    playerName,
    ts: createdAt,
  });
  persistState();

  writeJson(res, 201, { ok: true, session: sessionSummary(session) });
}

async function handleSetProfile(req, res) {
  const body = await readBodyJson(req);
  const session = getSessionOrNull(body.sessionId);
  if (!session) return badRequest(res, 'Invalid sessionId');

  session.playerName = sanitizeName(body.playerName || session.playerName);
  if (body.tableId) {
    session.tableId = sanitizeTable(body.tableId);
  }
  session.updatedAt = nowIso();
  persistState();
  writeJson(res, 200, { ok: true, session: sessionSummary(session) });
}

async function handleSetClientSeed(req, res) {
  const body = await readBodyJson(req);
  const session = getSessionOrNull(body.sessionId);
  if (!session) return badRequest(res, 'Invalid sessionId');
  const clientSeed = String(body.clientSeed || '').trim();
  if (clientSeed.length < 4 || clientSeed.length > 64) {
    return badRequest(res, 'clientSeed must be 4-64 chars');
  }

  session.clientSeed = clientSeed;
  session.nonce = 1;
  session.updatedAt = nowIso();
  persistState();
  writeJson(res, 200, { ok: true, session: sessionSummary(session) });
}

async function handleResetSession(req, res) {
  const body = await readBodyJson(req);
  const session = getSessionOrNull(body.sessionId);
  if (!session) return badRequest(res, 'Invalid sessionId');

  session.bankroll = 1000;
  session.rounds = 0;
  session.wins = 0;
  session.losses = 0;
  session.nonce = 1;
  session.serverSeed = randomSeedHex(32);
  session.serverSeedHash = sha256Hex(session.serverSeed);
  session.ledger = [];
  session.updatedAt = nowIso();

  publishTableEvent(session.tableId, {
    type: 'reset',
    tableId: session.tableId,
    playerName: session.playerName,
    ts: session.updatedAt,
  });

  persistState();
  writeJson(res, 200, { ok: true, session: sessionSummary(session) });
}

function parsePlayOptions(game, options) {
  if (game !== 'roulette') return {};
  const betType = ['red', 'black', 'even', 'odd', 'straight'].includes(options?.type)
    ? options.type
    : 'red';
  let number = Number(options?.number);
  if (!Number.isFinite(number)) number = 17;
  number = Math.max(0, Math.min(36, Math.floor(number)));
  return { type: betType, number };
}

async function handlePlay(req, res) {
  metrics.playRequestsTotal += 1;
  const body = await readBodyJson(req);
  const session = getSessionOrNull(body.sessionId);
  if (!session) return badRequest(res, 'Invalid sessionId');

  const game = String(body.game || '').toLowerCase();
  if (!['poker', 'blackjack', 'roulette', 'slots'].includes(game)) {
    return badRequest(res, 'Invalid game');
  }

  let bet = Number(body.bet);
  if (!Number.isFinite(bet)) return badRequest(res, 'Invalid bet');
  bet = Math.floor(bet);
  if (bet < 1) return badRequest(res, 'Bet must be >= 1');
  if (bet > session.bankroll) return badRequest(res, 'Insufficient bankroll');

  const engine = await enginePromise;
  const options = parsePlayOptions(game, body.options || {});
  const seedText = `${session.serverSeed}:${session.clientSeed}:${session.nonce}:${game}`;
  const rng = engine.createRng(seedText);

  let round;
  if (game === 'poker') round = engine.playPokerRound(rng, bet);
  else if (game === 'blackjack') round = engine.playBlackjackRound(rng, bet);
  else if (game === 'roulette')
    round = engine.playRouletteRound(rng, bet, options.type, options.number);
  else round = engine.playSlotsRound(rng, bet);

  const receipt = await engine.fairReceipt({
    serverSeed: session.serverSeed,
    clientSeed: session.clientSeed,
    nonce: session.nonce,
    game,
    bet,
    options,
  });

  const delta = round.payout - bet;
  session.rounds += 1;
  if (round.win) session.wins += 1;
  else session.losses += 1;
  session.bankroll = session.bankroll - bet + round.payout;
  session.nonce += 1;
  session.updatedAt = nowIso();

  const cfg = chainConfig();
  let onchain = null;
  let onchainVerification = null;
  if (body.onchain && typeof body.onchain === 'object') {
    const txHash = String(body.onchain.txHash || '');
    const account = String(body.onchain.account || '');
    if (/^0x[a-fA-F0-9]{64}$/.test(txHash) && /^0x[a-fA-F0-9]{40}$/.test(account)) {
      onchain = {
        txHash,
        account,
        chainId: Number(body.onchain.chainId || 0),
        tokenAmountRaw: String(body.onchain.tokenAmountRaw || ''),
        submittedAt: String(body.onchain.submittedAt || nowIso()),
      };

      onchainVerification = await verifyOnchainSettlement(onchain, cfg);
    } else {
      metrics.onchainVerifyFail += 1;
      metrics.playFailuresTotal += 1;
      return badRequest(res, 'Invalid onchain payload');
    }
  }

  const ledgerRow = {
    id: crypto.randomUUID(),
    ts: session.updatedAt,
    game,
    bet,
    payout: round.payout,
    delta,
    bankroll: session.bankroll,
    receipt,
    detail: round.detail,
    onchain,
    onchainVerification,
  };
  pushLedger(session, ledgerRow);

  publishTableEvent(session.tableId, {
    type: 'round',
    ts: session.updatedAt,
    tableId: session.tableId,
    playerName: session.playerName,
    game,
    bet,
    payout: round.payout,
    delta,
    bankroll: session.bankroll,
  });

  persistState();
  writeJson(res, 200, {
    ok: true,
    session: sessionSummary(session),
    round: {
      game,
      bet,
      payout: round.payout,
      delta,
      win: round.win,
      detail: round.detail,
      receipt,
      onchain,
      onchainVerification,
    },
  });
}

async function handleRevealRotate(req, res) {
  const body = await readBodyJson(req);
  const session = getSessionOrNull(body.sessionId);
  if (!session) return badRequest(res, 'Invalid sessionId');

  const previousSeed = session.serverSeed;
  const previousHash = session.serverSeedHash;
  session.serverSeed = randomSeedHex(32);
  session.serverSeedHash = sha256Hex(session.serverSeed);
  session.nonce = 1;
  session.updatedAt = nowIso();
  persistState();

  writeJson(res, 200, {
    ok: true,
    reveal: {
      previousServerSeed: previousSeed,
      previousServerSeedHash: previousHash,
      nextServerSeedHash: session.serverSeedHash,
    },
    session: sessionSummary(session),
  });
}

function handleGetSession(req, res, urlObj) {
  const id = urlObj.searchParams.get('sessionId');
  const session = getSessionOrNull(id);
  if (!session) return badRequest(res, 'Invalid sessionId');
  writeJson(res, 200, { ok: true, session: sessionSummary(session) });
}

function handleGetLedger(req, res, urlObj) {
  const id = urlObj.searchParams.get('sessionId');
  const session = getSessionOrNull(id);
  if (!session) return badRequest(res, 'Invalid sessionId');
  writeJson(res, 200, { ok: true, ledger: session.ledger.slice(0, 50) });
}

function handleGetTableEvents(req, res, urlObj) {
  const tableId = sanitizeTable(urlObj.searchParams.get('tableId'));
  const table = ensureTable(tableId);
  writeJson(res, 200, { ok: true, tableId, events: table.events.slice(0, 50) });
}

function handleTableStream(req, res, urlObj) {
  const tableId = sanitizeTable(urlObj.searchParams.get('tableId'));
  ensureTable(tableId);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });

  res.write('retry: 2000\n\n');

  const clients = sseClients.get(tableId) || new Set();
  clients.add(res);
  sseClients.set(tableId, clients);

  req.on('close', () => {
    const set = sseClients.get(tableId);
    if (!set) return;
    set.delete(res);
    if (set.size === 0) {
      sseClients.delete(tableId);
    }
  });
}

function serveStatic(req, res) {
  const reqPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const normalized = path.normalize(reqPath).replace(/^(\.\.[/\\])+/, '');
  const safePath = normalized.replace(/^[/\\]+/, '');
  const filePath = path.join(root, safePath || 'index.html');

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        if (!path.extname(filePath)) {
          const fallback = path.join(root, 'index.html');
          fs.readFile(fallback, (fallbackErr, fallbackContent) => {
            if (fallbackErr) {
              res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
              res.end('Not Found');
              return;
            }
            res.writeHead(200, { 'Content-Type': mime['.html'] });
            res.end(fallbackContent);
          });
          return;
        }
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
        return;
      }
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Internal Server Error');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': mime[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=300',
    });
    res.end(content);
  });
}

async function handleApi(req, res, urlObj) {
  metrics.apiRequestsTotal += 1;
  if (isRateLimited(req)) {
    return writeJson(res, 429, { ok: false, error: 'Rate limit exceeded' });
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/health') {
    return writeJson(res, 200, { ok: true, status: 'ok', at: nowIso() });
  }
  if (req.method === 'GET' && urlObj.pathname === '/api/chain-config') {
    return writeJson(res, 200, { ok: true, config: chainConfig() });
  }
  if (req.method === 'GET' && urlObj.pathname === '/api/metrics') {
    return writeJson(res, 200, {
      ok: true,
      metrics: {
        ...metrics,
        sessions: Object.keys(state.sessions).length,
        tables: Object.keys(state.tables).length,
      },
    });
  }
  if (req.method === 'POST' && urlObj.pathname === '/api/session')
    return handleCreateSession(req, res);
  if (req.method === 'GET' && urlObj.pathname === '/api/session')
    return handleGetSession(req, res, urlObj);
  if (req.method === 'POST' && urlObj.pathname === '/api/session/profile')
    return handleSetProfile(req, res);
  if (req.method === 'POST' && urlObj.pathname === '/api/session/client-seed')
    return handleSetClientSeed(req, res);
  if (req.method === 'POST' && urlObj.pathname === '/api/session/reset')
    return handleResetSession(req, res);
  if (req.method === 'POST' && urlObj.pathname === '/api/session/reveal-rotate')
    return handleRevealRotate(req, res);
  if (req.method === 'GET' && urlObj.pathname === '/api/ledger')
    return handleGetLedger(req, res, urlObj);
  if (req.method === 'POST' && urlObj.pathname === '/api/play') return handlePlay(req, res);
  if (req.method === 'GET' && urlObj.pathname === '/api/table/events')
    return handleGetTableEvents(req, res, urlObj);
  if (req.method === 'GET' && urlObj.pathname === '/api/table/stream')
    return handleTableStream(req, res, urlObj);

  return notFound(res);
}

const server = http.createServer(async (req, res) => {
  metrics.requestsTotal += 1;
  applySecurityHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  try {
    if (urlObj.pathname.startsWith('/api/')) {
      await handleApi(req, res, urlObj);
      return;
    }
    serveStatic(req, res);
  } catch (err) {
    if (String(urlObj.pathname || '').startsWith('/api/play')) {
      metrics.playFailuresTotal += 1;
      if (
        String(err?.message || '')
          .toLowerCase()
          .includes('on-chain')
      ) {
        metrics.onchainVerifyFail += 1;
      }
    }
    writeJson(res, 500, {
      ok: false,
      error: 'Internal error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

server.listen(PORT, () => {
  console.log(`Casin8 games listening on :${PORT}`);
});
