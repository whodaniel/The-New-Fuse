const STORAGE_KEY = 'casin8_client_v2';

const gameSelect = document.getElementById('game-select');
const playButton = document.getElementById('play-button');
const resetBankrollButton = document.getElementById('reset-bankroll');
const betAmountInput = document.getElementById('bet-amount');
const controlsRoot = document.getElementById('game-controls');
const result = document.getElementById('result');
const gameTitle = document.getElementById('game-title');
const bankrollEl = document.getElementById('bankroll');
const roundsEl = document.getElementById('rounds');
const winsEl = document.getElementById('wins');
const lossesEl = document.getElementById('losses');
const ledgerList = document.getElementById('ledger-list');
const fairnessReceiptEl = document.getElementById('fairness-receipt');
const playerNameInput = document.getElementById('player-name');
const savePlayerButton = document.getElementById('save-player');
const clientSeedInput = document.getElementById('client-seed');
const rollClientSeedButton = document.getElementById('roll-client-seed');
const tableIdInput = document.getElementById('table-id');
const joinTableButton = document.getElementById('join-table');
const tableStatus = document.getElementById('table-status');
const tableFeed = document.getElementById('table-feed');
const connectWalletButton = document.getElementById('connect-wallet');
const walletStatus = document.getElementById('wallet-status');
const chainStatus = document.getElementById('chain-status');
const onchainSettleCheckbox = document.getElementById('onchain-settle');

const state = {
  sessionId: '',
  playerName: 'Player',
  clientSeed: '',
  tableId: 'lobby-1',
  session: null,
  ledger: [],
  tableEvents: [],
  walletAccount: '',
};

let tableStream = null;
let chainConfig = null;
let ethersMod = null;
let walletProvider = null;
let walletSigner = null;

function shortAddr(addr) {
  if (!addr || addr.length < 10) return addr || '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function loadClientPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    state.sessionId = String(parsed.sessionId || '');
    state.playerName = String(parsed.playerName || 'Player');
    state.clientSeed = String(parsed.clientSeed || '');
    state.tableId = String(parsed.tableId || 'lobby-1');
    state.walletAccount = String(parsed.walletAccount || '');
  } catch {
    // ignore
  }
}

function persistClientPrefs() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      sessionId: state.sessionId,
      playerName: state.playerName,
      clientSeed: state.clientSeed,
      tableId: state.tableId,
      walletAccount: state.walletAccount,
    })
  );
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const json = await res.json().catch(() => ({ ok: false, error: 'Invalid response' }));
  if (!res.ok || json.ok === false) {
    throw new Error(json.error || `HTTP ${res.status}`);
  }
  return json;
}

function modeFromHost() {
  const host = window.location.hostname.toLowerCase();
  if (host.startsWith('poker.')) return 'poker';
  if (host.startsWith('blackjack.')) return 'blackjack';
  if (host.startsWith('roulette.')) return 'roulette';
  if (host.startsWith('slots.')) return 'slots';

  const queryMode = new URLSearchParams(window.location.search).get('game');
  if (queryMode && ['poker', 'blackjack', 'roulette', 'slots'].includes(queryMode))
    return queryMode;

  const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (['poker', 'blackjack', 'roulette', 'slots'].includes(path)) return path;

  return null;
}

function getBetAmount() {
  const raw = Number(betAmountInput.value);
  if (!Number.isFinite(raw) || raw < 1) return 1;
  return Math.floor(raw);
}

function renderControls(mode) {
  if (mode === 'roulette') {
    controlsRoot.innerHTML = `
      <label for="roulette-bet-type">Roulette Bet</label>
      <select id="roulette-bet-type">
        <option value="red">Red</option>
        <option value="black">Black</option>
        <option value="even">Even</option>
        <option value="odd">Odd</option>
        <option value="straight">Straight Number</option>
      </select>
      <label for="roulette-number">Number</label>
      <input id="roulette-number" type="number" min="0" max="36" step="1" value="17" />
      <button id="reveal-rotate" type="button">Reveal + Rotate Server Seed</button>
    `;
    const typeEl = document.getElementById('roulette-bet-type');
    const numEl = document.getElementById('roulette-number');
    const revealBtn = document.getElementById('reveal-rotate');
    const sync = () => {
      numEl.disabled = typeEl.value !== 'straight';
    };
    typeEl.addEventListener('change', sync);
    sync();
    revealBtn.addEventListener('click', revealRotateSeed);
    return;
  }

  controlsRoot.innerHTML = `
    <p class="controls-hint">Use Reveal + Rotate periodically to verify fairness chain.</p>
    <button id="reveal-rotate" type="button">Reveal + Rotate Server Seed</button>
  `;
  document.getElementById('reveal-rotate').addEventListener('click', revealRotateSeed);
}

function updateWalletHud(extra = '') {
  if (!chainConfig) {
    chainStatus.textContent = 'Chain config unavailable.';
    walletStatus.textContent = 'Wallet not connected';
    return;
  }

  if (chainConfig.enabled) {
    chainStatus.textContent =
      `Chain ${chainConfig.network} (${chainConfig.chainId}) ${extra}`.trim();
  } else {
    chainStatus.textContent = 'On-chain settlement disabled on server env.';
    onchainSettleCheckbox.checked = false;
    onchainSettleCheckbox.disabled = true;
  }

  walletStatus.textContent = state.walletAccount
    ? `Connected ${shortAddr(state.walletAccount)}`
    : 'Wallet not connected';
}

function updateHud() {
  const s = state.session;
  bankrollEl.textContent = String(s?.bankroll ?? 0);
  roundsEl.textContent = String(s?.rounds ?? 0);
  winsEl.textContent = String(s?.wins ?? 0);
  lossesEl.textContent = String(s?.losses ?? 0);
  playButton.disabled = !s || (s.bankroll ?? 0) <= 0;

  playerNameInput.value = state.playerName;
  clientSeedInput.value = state.clientSeed;
  tableIdInput.value = state.tableId;

  renderLedger();
  renderTableFeed();
  updateWalletHud();
}

function renderLedger() {
  ledgerList.innerHTML = '';
  if (!state.ledger || state.ledger.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No rounds played yet.';
    ledgerList.appendChild(li);
    return;
  }
  for (const row of state.ledger.slice(0, 12)) {
    const onchain = row.onchain?.txHash ? ` | tx ${row.onchain.txHash.slice(0, 10)}...` : '';
    const li = document.createElement('li');
    li.textContent = `${new Date(row.ts).toLocaleTimeString()} | ${row.game} | bet ${row.bet} | payout ${row.payout} | bal ${row.bankroll}${onchain}`;
    ledgerList.appendChild(li);
  }
}

function renderTableFeed() {
  tableFeed.innerHTML = '';
  if (!state.tableEvents || state.tableEvents.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No table activity yet.';
    tableFeed.appendChild(li);
    return;
  }
  for (const event of state.tableEvents.slice(0, 15)) {
    const li = document.createElement('li');
    const ts = new Date(event.ts || Date.now()).toLocaleTimeString();
    if (event.type === 'round') {
      li.textContent = `${ts} ${event.playerName}: ${event.game} bet ${event.bet}, payout ${event.payout}, bal ${event.bankroll}`;
    } else if (event.type === 'join') {
      li.textContent = `${ts} ${event.playerName} joined ${event.tableId}`;
    } else if (event.type === 'reset') {
      li.textContent = `${ts} ${event.playerName} reset bankroll`;
    } else {
      li.textContent = `${ts} ${JSON.stringify(event)}`;
    }
    tableFeed.appendChild(li);
  }
}

function rouletteOptions() {
  const type = document.getElementById('roulette-bet-type')?.value || 'red';
  const rawNum = Number(document.getElementById('roulette-number')?.value ?? 17);
  const number = Number.isFinite(rawNum) ? Math.max(0, Math.min(36, Math.floor(rawNum))) : 17;
  return { type, number };
}

function formatRound(round) {
  if (round.game === 'poker') {
    return `Hand: ${round.detail.hand.join(' ')}\nResult: ${round.detail.rank}`;
  }
  if (round.game === 'blackjack') {
    return `Player: ${round.detail.player.join(' ')} (${round.detail.playerTotal})\nDealer: ${round.detail.dealer.join(' ')} (${round.detail.dealerTotal})\n${round.detail.verdict}`;
  }
  if (round.game === 'roulette') {
    return `Bet Type: ${round.detail.type}\nNumber: ${round.detail.number}\nWheel: ${round.detail.landing}`;
  }
  return `Reel: ${round.detail.spin.join(' | ')}\nMultiplier: ${round.detail.multiplier}`;
}

async function refreshLedger() {
  if (!state.sessionId) return;
  const data = await api(`/api/ledger?sessionId=${encodeURIComponent(state.sessionId)}`);
  state.ledger = data.ledger || [];
  updateHud();
}

async function refreshTableEvents() {
  if (!state.tableId) return;
  const data = await api(`/api/table/events?tableId=${encodeURIComponent(state.tableId)}`);
  state.tableEvents = data.events || [];
  updateHud();
}

async function ensureSession() {
  if (state.sessionId) {
    try {
      const data = await api(`/api/session?sessionId=${encodeURIComponent(state.sessionId)}`);
      state.session = data.session;
      state.playerName = data.session.playerName || state.playerName;
      state.clientSeed = data.session.clientSeed || state.clientSeed;
      state.tableId = data.session.tableId || state.tableId;
      persistClientPrefs();
      return;
    } catch {
      state.sessionId = '';
    }
  }

  const created = await api('/api/session', {
    method: 'POST',
    body: {
      playerName: state.playerName,
      clientSeed: state.clientSeed || undefined,
      tableId: state.tableId,
    },
  });
  state.session = created.session;
  state.sessionId = created.session.sessionId;
  state.playerName = created.session.playerName;
  state.clientSeed = created.session.clientSeed;
  state.tableId = created.session.tableId;
  persistClientPrefs();
}

async function syncProfile() {
  const payload = {
    sessionId: state.sessionId,
    playerName: playerNameInput.value.trim() || 'Player',
    tableId: tableIdInput.value.trim() || 'lobby-1',
  };
  const data = await api('/api/session/profile', { method: 'POST', body: payload });
  state.session = data.session;
  state.playerName = data.session.playerName;
  state.tableId = data.session.tableId;
  persistClientPrefs();
  tableStatus.textContent = `Joined ${state.tableId} as ${state.playerName}`;
  await restartTableStream();
  await refreshTableEvents();
  await refreshLedger();
  result.textContent = 'Profile saved.';
}

async function rotateClientSeed() {
  const clientSeed = clientSeedInput.value.trim();
  if (clientSeed.length < 4 || clientSeed.length > 64) {
    result.textContent = 'Client seed must be between 4 and 64 chars.';
    return;
  }
  const data = await api('/api/session/client-seed', {
    method: 'POST',
    body: { sessionId: state.sessionId, clientSeed },
  });
  state.session = data.session;
  state.clientSeed = data.session.clientSeed;
  persistClientPrefs();
  fairnessReceiptEl.textContent = 'Client seed rotated. Next round starts nonce at 1.';
  updateHud();
}

async function revealRotateSeed() {
  const data = await api('/api/session/reveal-rotate', {
    method: 'POST',
    body: { sessionId: state.sessionId },
  });
  state.session = data.session;
  fairnessReceiptEl.textContent = JSON.stringify(data.reveal, null, 2);
  updateHud();
}

async function resetBankroll() {
  const data = await api('/api/session/reset', {
    method: 'POST',
    body: { sessionId: state.sessionId },
  });
  state.session = data.session;
  await refreshLedger();
  await refreshTableEvents();
  result.textContent = 'Session reset to bankroll 1000 and fresh server-seed commit.';
}

async function loadEthers() {
  if (ethersMod) return ethersMod;
  ethersMod = await import('https://esm.sh/ethers@6.13.4');
  return ethersMod;
}

async function ensureWalletConnected() {
  if (!window.ethereum) {
    throw new Error('No wallet detected. Install MetaMask or another Web3 wallet.');
  }
  const { ethers } = await loadEthers();
  walletProvider = new ethers.BrowserProvider(window.ethereum);
  await walletProvider.send('eth_requestAccounts', []);
  walletSigner = await walletProvider.getSigner();
  state.walletAccount = await walletSigner.getAddress();
  persistClientPrefs();

  if (chainConfig?.chainId) {
    const network = await walletProvider.getNetwork();
    if (Number(network.chainId) !== Number(chainConfig.chainId)) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${Number(chainConfig.chainId).toString(16)}` }],
        });
        walletProvider = new ethers.BrowserProvider(window.ethereum);
        walletSigner = await walletProvider.getSigner();
      } catch {
        throw new Error(`Please switch wallet to chainId ${chainConfig.chainId}`);
      }
    }
  }

  updateWalletHud();
}

async function settleBetOnChainIfEnabled(bet) {
  if (!onchainSettleCheckbox.checked) return null;
  if (!chainConfig?.enabled) throw new Error('On-chain settlement is not enabled on server config');

  await ensureWalletConnected();
  const { ethers } = await loadEthers();

  const tokenAbi = [
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function balanceOf(address owner) view returns (uint256)',
  ];
  const merkabaAbi = ['function injectCapital(uint256 _amount) external'];

  const token = new ethers.Contract(chainConfig.address.token, tokenAbi, walletSigner);
  const merkaba = new ethers.Contract(chainConfig.address.merkaba, merkabaAbi, walletSigner);

  const decimals = Number(await token.decimals());
  const tokenAmountRaw = ethers.parseUnits(String(bet), decimals);
  const account = state.walletAccount;

  const balance = await token.balanceOf(account);
  if (balance < tokenAmountRaw) {
    throw new Error(`Insufficient wallet balance for on-chain settlement`);
  }

  const allowance = await token.allowance(account, chainConfig.address.merkaba);
  if (allowance < tokenAmountRaw) {
    const approveTx = await token.approve(chainConfig.address.merkaba, tokenAmountRaw);
    await approveTx.wait();
  }

  const tx = await merkaba.injectCapital(tokenAmountRaw);
  await tx.wait();

  const network = await walletProvider.getNetwork();
  const symbol = await token.symbol().catch(() => 'TOKEN');
  updateWalletHud(`| last tx ${tx.hash.slice(0, 10)}...`);

  return {
    txHash: tx.hash,
    account,
    chainId: Number(network.chainId),
    tokenAmountRaw: tokenAmountRaw.toString(),
    tokenSymbol: symbol,
    submittedAt: new Date().toISOString(),
  };
}

async function playRound() {
  const bet = getBetAmount();
  const game = gameSelect.value;

  const onchain = await settleBetOnChainIfEnabled(bet);

  const data = await api('/api/play', {
    method: 'POST',
    body: {
      sessionId: state.sessionId,
      game,
      bet,
      options: game === 'roulette' ? rouletteOptions() : {},
      onchain,
    },
  });

  state.session = data.session;
  const round = data.round;
  const delta = round.delta;

  fairnessReceiptEl.textContent = JSON.stringify(round.receipt, null, 2);
  const onchainLine = round.onchain?.txHash ? `\nOn-chain tx: ${round.onchain.txHash}` : '';
  result.textContent = `${formatRound(round)}\n\nBet: ${round.bet}\nPayout: ${round.payout}\nDelta: ${delta >= 0 ? '+' : ''}${delta}\nBankroll: ${data.session.bankroll}${onchainLine}`;

  await refreshLedger();
}

async function restartTableStream() {
  if (tableStream) {
    tableStream.close();
    tableStream = null;
  }

  const url = `/api/table/stream?tableId=${encodeURIComponent(state.tableId)}&sessionId=${encodeURIComponent(
    state.sessionId
  )}`;
  tableStream = new EventSource(url);

  tableStream.onopen = () => {
    tableStatus.textContent = `Live table ${state.tableId} as ${state.playerName}`;
  };

  tableStream.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      state.tableEvents.unshift(parsed);
      state.tableEvents = state.tableEvents.slice(0, 50);
      renderTableFeed();
    } catch {
      // ignore malformed event
    }
  };

  tableStream.onerror = () => {
    tableStatus.textContent = `Reconnecting table ${state.tableId}...`;
  };
}

function playTone(freq = 440, ms = 80) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, ms);
  } catch {
    // no-op
  }
}

async function loadChainConfig() {
  const data = await api('/api/chain-config');
  chainConfig = data.config;
  updateWalletHud();
}

async function bootstrap() {
  loadClientPrefs();

  const forcedMode = modeFromHost();
  if (forcedMode) {
    gameSelect.value = forcedMode;
    gameSelect.disabled = true;
  }

  renderControls(gameSelect.value);
  gameTitle.textContent = gameSelect.options[gameSelect.selectedIndex].text;
  result.textContent = 'Connecting session...';
  fairnessReceiptEl.textContent = 'No round receipt yet.';

  await loadChainConfig();
  await ensureSession();
  await refreshLedger();
  await refreshTableEvents();
  await restartTableStream();
  updateHud();

  result.textContent = 'Connected. Place your bet and play a round.';
}

playButton.addEventListener('click', async () => {
  try {
    await playRound();
    playTone(640, 90);
  } catch (err) {
    result.textContent = `Round failed: ${err instanceof Error ? err.message : String(err)}`;
    playTone(220, 100);
  }
});

resetBankrollButton.addEventListener('click', async () => {
  try {
    await resetBankroll();
  } catch (err) {
    result.textContent = `Reset failed: ${err instanceof Error ? err.message : String(err)}`;
  }
});

savePlayerButton.addEventListener('click', async () => {
  try {
    await syncProfile();
  } catch (err) {
    result.textContent = `Profile save failed: ${err instanceof Error ? err.message : String(err)}`;
  }
});

rollClientSeedButton.addEventListener('click', async () => {
  try {
    if (!clientSeedInput.value.trim()) {
      clientSeedInput.value = crypto.randomUUID().replace(/-/g, '').slice(0, 32);
    }
    await rotateClientSeed();
  } catch (err) {
    result.textContent = `Client-seed update failed: ${err instanceof Error ? err.message : String(err)}`;
  }
});

joinTableButton.addEventListener('click', async () => {
  try {
    await syncProfile();
  } catch (err) {
    result.textContent = `Join table failed: ${err instanceof Error ? err.message : String(err)}`;
  }
});

connectWalletButton.addEventListener('click', async () => {
  try {
    await ensureWalletConnected();
    result.textContent = `Wallet connected: ${shortAddr(state.walletAccount)}`;
  } catch (err) {
    result.textContent = `Wallet connect failed: ${err instanceof Error ? err.message : String(err)}`;
  }
});

gameSelect.addEventListener('change', () => {
  gameTitle.textContent = gameSelect.options[gameSelect.selectedIndex].text;
  renderControls(gameSelect.value);
});

bootstrap().catch((err) => {
  result.textContent = `Startup failed: ${err instanceof Error ? err.message : String(err)}`;
});
