const STORAGE_KEY = 'casin8_client_v2';
const NURTURE_OPS_STORAGE_KEY = 'casin8_nurture_ops_v1';

const gameSelect = document.getElementById('game-select');
const playButton = document.getElementById('play-button');
const resetBankrollButton = document.getElementById('reset-bankroll');
const betAmountInput = document.getElementById('bet-amount');
const controlsRoot = document.getElementById('game-controls');
const result = document.getElementById('result');
const gameTitle = document.getElementById('game-title');
const gameShowcase = document.getElementById('game-showcase');
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
const payPlayerIdInput = document.getElementById('pay-player-id');
const payProviderSelect = document.getElementById('pay-provider');
const payFiatMinorInput = document.getElementById('pay-fiat-minor');
const payTokenUnitsInput = document.getElementById('pay-token-units');
const payCountryInput = document.getElementById('pay-country');
const payApiTokenInput = document.getElementById('pay-api-token');
const payKycSelect = document.getElementById('pay-kyc');
const payRiskLevelSelect = document.getElementById('pay-risk-level');
const payUpsertComplianceButton = document.getElementById('pay-upsert-compliance');
const payCreateIntentButton = document.getElementById('pay-create-intent');
const payLoadOrderButton = document.getElementById('pay-load-order');
const payRiskAlertsButton = document.getElementById('pay-risk-alerts');
const payOutput = document.getElementById('pay-output');
const tableHandIdInput = document.getElementById('table-hand-id');
const tableSeatCountInput = document.getElementById('table-seat-count');
const tableActingSeatInput = document.getElementById('table-acting-seat');
const tableActionSeatInput = document.getElementById('table-action-seat');
const tableActionTypeSelect = document.getElementById('table-action-type');
const tableActionNameSelect = document.getElementById('table-action-name');
const tableActionAmountInput = document.getElementById('table-action-amount');
const tableWinnerSeatInput = document.getElementById('table-winner-seat');
const tablePayoutUnitsInput = document.getElementById('table-payout-units');
const tableInitButton = document.getElementById('table-init');
const tableActionButton = document.getElementById('table-action');
const tableSettleButton = document.getElementById('table-settle');
const tableAutoRoundButton = document.getElementById('table-auto-round');
const tableRefreshStateButton = document.getElementById('table-refresh-state');
const tableStateOutput = document.getElementById('table-state-output');
const v2PlayerIdInput = document.getElementById('v2-player-id');
const v2ActionNameSelect = document.getElementById('v2-action-name');
const v2ActionAmountInput = document.getElementById('v2-action-amount');
const v2TableCreateButton = document.getElementById('v2-table-create');
const v2TableSeatButton = document.getElementById('v2-table-seat');
const v2HandStartButton = document.getElementById('v2-hand-start');
const v2ActionButton = document.getElementById('v2-action');
const v2SettleButton = document.getElementById('v2-settle');
const v2ReplayButton = document.getElementById('v2-replay');
const v2StateButton = document.getElementById('v2-state');
const agentIdInput = document.getElementById('agent-id');
const agentOwnerIdInput = document.getElementById('agent-owner-id');
const agentTierSelect = document.getElementById('agent-tier');
const agentStyleSelect = document.getElementById('agent-style');
const agentRegisterButton = document.getElementById('agent-register');
const agentCraftTexasSolverButton = document.getElementById('agent-craft-texassolver');
const agentTexasSolverJsonInput = document.getElementById('agent-texassolver-json');
const traitDashboardButton = document.getElementById('trait-dashboard');
const traitFreezeCheckbox = document.getElementById('trait-freeze');
const traitFreezeApplyButton = document.getElementById('trait-freeze-apply');
const traitRolloutIdInput = document.getElementById('trait-rollout-id');
const traitRolloutStateButton = document.getElementById('trait-rollout-state');
const traitArtifactIdInput = document.getElementById('trait-artifact-id');
const traitRevokeArtifactButton = document.getElementById('trait-revoke-artifact');
const nurtureTargetBbpsInput = document.getElementById('nurture-target-bbps');
const nurtureBb100Input = document.getElementById('nurture-bb100');
const nurtureExploitabilityInput = document.getElementById('nurture-exploitability');
const nurtureEntropyInput = document.getElementById('nurture-entropy');
const nurtureLatencyInput = document.getElementById('nurture-latency');
const nurtureViolationsInput = document.getElementById('nurture-violations');
const nurtureShowdownErrorInput = document.getElementById('nurture-showdown-error');
const nurtureVolatilityInput = document.getElementById('nurture-volatility');
const nurtureSourceSelect = document.getElementById('nurture-source');
const nurtureActorsInput = document.getElementById('nurture-actors');
const nurtureTraversalsInput = document.getElementById('nurture-traversals');
const nurtureBatchSizeInput = document.getElementById('nurture-batch-size');
const nurtureInitButton = document.getElementById('nurture-init');
const nurtureEpisodeButton = document.getElementById('nurture-episode');
const nurtureBatch10Button = document.getElementById('nurture-batch10');
const nurtureEvaluateButton = document.getElementById('nurture-evaluate');
const nurtureStateButton = document.getElementById('nurture-state');
const nurtureExportButton = document.getElementById('nurture-export');
const nurtureRefreshSecInput = document.getElementById('nurture-refresh-sec');
const nurtureAutoToggleButton = document.getElementById('nurture-auto-toggle');
const nurtureCompareIdsInput = document.getElementById('nurture-compare-ids');
const nurtureCompareButton = document.getElementById('nurture-compare');
const nurturePresetSelect = document.getElementById('nurture-preset');
const nurturePresetApplyButton = document.getElementById('nurture-preset-apply');
const nurtureMacroRunButton = document.getElementById('nurture-macro-run');
const nurtureMacroEpisodesInput = document.getElementById('nurture-macro-episodes');
const nurtureCompareSortSelect = document.getElementById('nurture-compare-sort');
const nurtureCompareStageFilterSelect = document.getElementById('nurture-compare-stage-filter');
const nurtureCompareMinEpisodesInput = document.getElementById('nurture-compare-min-episodes');
const nurtureBaselineSetButton = document.getElementById('nurture-baseline-set');
const nurtureBaselineClearButton = document.getElementById('nurture-baseline-clear');
const nurtureCompareExportJsonButton = document.getElementById('nurture-compare-export-json');
const nurtureCompareExportCsvButton = document.getElementById('nurture-compare-export-csv');
const nurtureCompareStatus = document.getElementById('nurture-compare-status');
const agentConsoleClearButton = document.getElementById('agent-console-clear');
const strategyProfileButton = document.getElementById('strategy-profile');
const strategyDecideButton = document.getElementById('strategy-decide');
const agentAutoplayButton = document.getElementById('agent-autoplay');
const simEquityButton = document.getElementById('sim-equity');
const swarmStatusButton = document.getElementById('swarm-status');
const agentConsoleOutput = document.getElementById('agent-console-output');
const nurtureCard = document.getElementById('nurture-card');
const nurtureStageRail = document.getElementById('nurture-stage-rail');
const nurtureChartBb100 = document.getElementById('nurture-chart-bb100');
const nurtureChartExploit = document.getElementById('nurture-chart-exploit');
const nurtureCompareGrid = document.getElementById('nurture-compare-grid');
const tournamentIdInput = document.getElementById('tournament-id');
const tournamentPlayerIdInput = document.getElementById('tournament-player-id');
const sngCreateButton = document.getElementById('sng-create');
const sngRegisterButton = document.getElementById('sng-register');
const sngStartLevelButton = document.getElementById('sng-start-level');
const sngEliminateButton = document.getElementById('sng-eliminate');
const sngPayoutsButton = document.getElementById('sng-payouts');
const mttCreateButton = document.getElementById('mtt-create');
const mttRegisterButton = document.getElementById('mtt-register');
const mttStartButton = document.getElementById('mtt-start');
const mttEliminateButton = document.getElementById('mtt-eliminate');
const mttStateButton = document.getElementById('mtt-state');
const tournamentOutput = document.getElementById('tournament-output');
const v2TourTypeSelect = document.getElementById('v2-tour-type');
const v2ClockSecondsInput = document.getElementById('v2-clock-seconds');
const v2FinishPositionInput = document.getElementById('v2-finish-position');
const v2TourCreateButton = document.getElementById('v2-tour-create');
const v2TourRegisterButton = document.getElementById('v2-tour-register');
const v2TourStartButton = document.getElementById('v2-tour-start');
const v2TourClockButton = document.getElementById('v2-tour-clock');
const v2TourRebuyButton = document.getElementById('v2-tour-rebuy');
const v2TourAddonButton = document.getElementById('v2-tour-addon');
const v2TourEliminateButton = document.getElementById('v2-tour-eliminate');
const v2TourStateButton = document.getElementById('v2-tour-state');
const v2TourPayoutsButton = document.getElementById('v2-tour-payouts');
const sponsorshipPositionIdInput = document.getElementById('sponsorship-position-id');
const sponsorshipAgentIdInput = document.getElementById('sponsorship-agent-id');
const sponsorshipSponsorIdInput = document.getElementById('sponsorship-sponsor-id');
const sponsorshipPrincipalInput = document.getElementById('sponsorship-principal');
const sponsorshipBuyinInput = document.getElementById('sponsorship-buyin');
const sponsorshipPrizeInput = document.getElementById('sponsorship-prize');
const sponsorshipOpenButton = document.getElementById('sponsorship-open');
const sponsorshipFundButton = document.getElementById('sponsorship-fund');
const sponsorshipOneClickFundButton = document.getElementById('sponsorship-one-click-fund');
const sponsorshipCloseButton = document.getElementById('sponsorship-close');
const sponsorshipSettleButton = document.getElementById('sponsorship-settle');
const sponsorshipClaimButton = document.getElementById('sponsorship-claim');
const sponsorshipViewButton = document.getElementById('sponsorship-view');
const sponsorshipMarketplaceButton = document.getElementById('sponsorship-marketplace');
const sponsorshipAnalyticsButton = document.getElementById('sponsorship-analytics');
const sponsorshipOutput = document.getElementById('sponsorship-output');
const sponsorshipMarketOutput = document.getElementById('sponsorship-market-output');
const liveHeroSeatInput = document.getElementById('live-hero-seat');
const liveRaiseAmountInput = document.getElementById('live-raise-amount');
const liveNewHandButton = document.getElementById('live-new-hand');
const liveRefreshButton = document.getElementById('live-refresh');
const liveActionFoldButton = document.getElementById('live-action-fold');
const liveActionCheckButton = document.getElementById('live-action-check');
const liveActionCallButton = document.getElementById('live-action-call');
const liveActionRaiseButton = document.getElementById('live-action-raise');
const liveAutoRoundButton = document.getElementById('live-auto-round');
const liveTableStatus = document.getElementById('live-table-status');
const liveTable = document.getElementById('live-table');

const state = {
  sessionId: '',
  playerName: 'Player',
  clientSeed: '',
  tableId: 'lobby-1',
  session: null,
  ledger: [],
  tableEvents: [],
  walletAccount: '',
  lastAgentId: 'agent-alpha',
  liveSnapshot: null,
  lastPaymentOrderId: '',
  apiToken: '',
  nurtureProgram: null,
  nurtureCompareRows: [],
  nurtureComparePrevByAgent: {},
  nurtureCompareBaselineByAgent: {},
};

let tableStream = null;
let chainConfig = null;
let ethersMod = null;
let walletProvider = null;
let walletSigner = null;
let playInFlight = false;
let nurtureAutoRefreshTimer = null;
let nurtureAutoTickInFlight = false;

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
    state.apiToken = String(parsed.apiToken || '');
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
      apiToken: state.apiToken,
    })
  );
}

function loadNurtureOpsPrefs() {
  try {
    const raw = localStorage.getItem(NURTURE_OPS_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (nurtureRefreshSecInput && Number.isFinite(Number(parsed.refreshSec))) {
      nurtureRefreshSecInput.value = String(Math.max(3, Math.min(300, Number(parsed.refreshSec))));
    }
    if (nurtureCompareIdsInput && typeof parsed.compareIds === 'string') {
      nurtureCompareIdsInput.value = parsed.compareIds;
    }
    if (nurturePresetSelect && typeof parsed.preset === 'string') {
      nurturePresetSelect.value = parsed.preset;
    }
    if (nurtureCompareSortSelect && typeof parsed.sortMode === 'string') {
      nurtureCompareSortSelect.value = parsed.sortMode;
    }
    if (nurtureCompareStageFilterSelect && typeof parsed.stageFilter === 'string') {
      nurtureCompareStageFilterSelect.value = parsed.stageFilter;
    }
    if (nurtureCompareMinEpisodesInput && Number.isFinite(Number(parsed.minEpisodes))) {
      nurtureCompareMinEpisodesInput.value = String(Math.max(0, Number(parsed.minEpisodes)));
    }
    if (nurtureMacroEpisodesInput && Number.isFinite(Number(parsed.macroEpisodes))) {
      nurtureMacroEpisodesInput.value = String(
        Math.max(1, Math.min(200, Number(parsed.macroEpisodes)))
      );
    }
    if (parsed.baselineByAgent && typeof parsed.baselineByAgent === 'object') {
      state.nurtureCompareBaselineByAgent = parsed.baselineByAgent;
    }
  } catch {
    // ignore
  }
}

function persistNurtureOpsPrefs() {
  try {
    localStorage.setItem(
      NURTURE_OPS_STORAGE_KEY,
      JSON.stringify({
        refreshSec: Number(nurtureRefreshSecInput?.value || 12),
        compareIds: String(nurtureCompareIdsInput?.value || ''),
        preset: String(nurturePresetSelect?.value || 'baseline_ladder'),
        sortMode: String(nurtureCompareSortSelect?.value || 'bb100_desc'),
        stageFilter: String(nurtureCompareStageFilterSelect?.value || 'all'),
        minEpisodes: Number(nurtureCompareMinEpisodesInput?.value || 0),
        macroEpisodes: Number(nurtureMacroEpisodesInput?.value || 20),
        baselineByAgent: state.nurtureCompareBaselineByAgent || {},
      })
    );
  } catch {
    // ignore
  }
}

async function api(path, options = {}) {
  const attempts = options.retry === false ? 1 : 2;
  let lastErr = null;
  for (let i = 0; i < attempts; i += 1) {
    let timeout;
    try {
      const ctl = new AbortController();
      const timeoutMs = options.timeoutMs || 12000;
      timeout = setTimeout(() => ctl.abort('timeout'), timeoutMs);
      const res = await fetch(path, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(state.apiToken ? { Authorization: `Bearer ${state.apiToken}` } : {}),
          ...(options.headers || {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: ctl.signal,
      });
      const json = await res.json().catch(() => ({ ok: false, error: 'Invalid response' }));
      if (!res.ok || json.ok === false) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      return json;
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 250));
      }
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

function modeFromHost() {
  const host = window.location.hostname.toLowerCase();
  if (host.startsWith('poker.')) return 'poker';
  // Poker-only mode: non-poker host mapping intentionally disabled.
  // if (host.startsWith('blackjack.')) return 'blackjack';
  // if (host.startsWith('roulette.')) return 'roulette';
  // if (host.startsWith('slots.')) return 'slots';

  const queryMode = new URLSearchParams(window.location.search).get('game');
  if (queryMode && ['poker'].includes(queryMode)) return queryMode;

  const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (['poker'].includes(path)) return path;

  return null;
}

function getBetAmount() {
  const raw = Number(betAmountInput.value);
  if (!Number.isFinite(raw) || raw < 1) return 1;
  return Math.floor(raw);
}

function renderControls(mode) {
  // Poker-only mode: roulette options control intentionally disabled.
  // if (mode === 'roulette') { ... }

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
  if (payApiTokenInput) {
    payApiTokenInput.value = state.apiToken || '';
  }
  if (payPlayerIdInput && !payPlayerIdInput.value.trim() && state.sessionId) {
    payPlayerIdInput.value = state.sessionId;
  }

  renderLedger();
  renderTableFeed();
  updateWalletHud();
  if (agentIdInput && !agentIdInput.value.trim()) {
    agentIdInput.value = state.lastAgentId;
  }
}

function writeAgentConsole(payload) {
  if (!agentConsoleOutput) return;
  agentConsoleOutput.textContent =
    typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
}

function writePanel(pre, payload) {
  if (!pre) return;
  pre.textContent = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
}

function numText(value, digits = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '-';
  return n.toFixed(digits);
}

function sparklineSvg(values, { color = '#00dfff', width = 220, height = 56 } = {}) {
  const nums = (Array.isArray(values) ? values : [])
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v));
  if (nums.length === 0) {
    return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" aria-hidden="true"></svg>`;
  }
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = Math.max(1e-9, max - min);
  const step = nums.length === 1 ? width : width / (nums.length - 1);
  const points = nums
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / span) * (height - 4) - 2;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" aria-hidden="true">
      <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></polyline>
    </svg>
  `;
}

function renderNurtureStageRail(stage) {
  if (!nurtureStageRail) return;
  const stages = ['bootstrap', 'stable_self_play', 'exploit_test', 'ladder_ready'];
  const current = stages.indexOf(String(stage || '').toLowerCase());
  nurtureStageRail.innerHTML = stages
    .map((name, idx) => {
      const cls = idx < current ? 'done' : idx === current ? 'active' : '';
      return `<span class="nurture-stage ${cls}">${name.replaceAll('_', ' ')}</span>`;
    })
    .join('');
}

function renderNurtureCard(payload) {
  if (!nurtureCard) return;
  const program = payload?.program || state.nurtureProgram || null;
  if (payload?.program) {
    state.nurtureProgram = payload.program;
  }
  const card = payload?.coachCard || null;
  const score = card?.latestScore || payload?.evaluation?.score || null;
  const recs = card?.topRecommendations || payload?.evaluation?.recommendations || [];
  if (!card && !program) {
    nurtureCard.innerHTML = `
      <div class="nurture-title">Nurture Coach</div>
      <div class="nurture-sub">Initialize a nurture program to see stage and recommendations.</div>
    `;
    renderNurtureStageRail(null);
    if (nurtureChartBb100) nurtureChartBb100.innerHTML = '';
    if (nurtureChartExploit) nurtureChartExploit.innerHTML = '';
    return;
  }

  const stage = card?.stage || program?.stage || '-';
  const objective = card?.objective || program?.objective || 'cash_nlhe_6max';
  const episodes = card?.episodes ?? program?.metrics?.episodes ?? 0;
  const bbSeries = program?.metrics?.bb100 || [];
  const exploitSeries = program?.metrics?.exploitabilityProxy || [];

  nurtureCard.innerHTML = `
    <div class="nurture-title">Nurture Coach: ${stage}</div>
    <div class="nurture-sub">${objective} | Episodes ${episodes}</div>
    <div id="nurture-stage-rail" class="nurture-stage-rail"></div>
    <div class="nurture-grid">
      <div class="nurture-pill"><div class="nurture-label">bb/100</div><div class="nurture-value">${numText(score?.bb100, 2)}</div></div>
      <div class="nurture-pill"><div class="nurture-label">Exploitability</div><div class="nurture-value">${numText(score?.exploitabilityProxy, 1)}</div></div>
      <div class="nurture-pill"><div class="nurture-label">Entropy</div><div class="nurture-value">${numText(score?.policyEntropy, 3)}</div></div>
      <div class="nurture-pill"><div class="nurture-label">Latency p95</div><div class="nurture-value">${numText(score?.decisionLatencyMsP95, 0)} ms</div></div>
    </div>
    <div class="nurture-chart-grid">
      <div class="nurture-chart-wrap">
        <div class="nurture-label">bb/100 Trend</div>
        <div id="nurture-chart-bb100" class="nurture-chart"></div>
      </div>
      <div class="nurture-chart-wrap">
        <div class="nurture-label">Exploitability Trend</div>
        <div id="nurture-chart-exploit" class="nurture-chart"></div>
      </div>
    </div>
    <ul class="nurture-list">
      ${(recs.length > 0 ? recs.slice(0, 4) : ['No recommendations yet.']).map((row) => `<li>${row}</li>`).join('')}
    </ul>
  `;
  const stageRailEl = nurtureCard.querySelector('#nurture-stage-rail');
  const chartBbEl = nurtureCard.querySelector('#nurture-chart-bb100');
  const chartExploitEl = nurtureCard.querySelector('#nurture-chart-exploit');
  if (stageRailEl) {
    stageRailEl.id = '';
    stageRailEl.className = 'nurture-stage-rail';
    stageRailEl.innerHTML = '';
    const stages = ['bootstrap', 'stable_self_play', 'exploit_test', 'ladder_ready'];
    const current = stages.indexOf(String(stage || '').toLowerCase());
    stageRailEl.innerHTML = stages
      .map((name, idx) => {
        const cls = idx < current ? 'done' : idx === current ? 'active' : '';
        return `<span class="nurture-stage ${cls}">${name.replaceAll('_', ' ')}</span>`;
      })
      .join('');
  }
  if (chartBbEl) chartBbEl.innerHTML = sparklineSvg(bbSeries, { color: '#00dfff' });
  if (chartExploitEl) chartExploitEl.innerHTML = sparklineSvg(exploitSeries, { color: '#ff9f43' });
}

function parseCompareAgentIds() {
  const raw = String(nurtureCompareIdsInput?.value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  return [...new Set(raw)];
}

function compareStageRank(stage) {
  const normalized = String(stage || '').toLowerCase();
  if (normalized === 'bootstrap') return 1;
  if (normalized === 'stable_self_play') return 2;
  if (normalized === 'exploit_test') return 3;
  if (normalized === 'ladder_ready') return 4;
  return 0;
}

function compareScoreForRow(row) {
  const program = row?.payload?.program || null;
  const card = row?.payload?.coachCard || null;
  const latest = card?.latestScore || row?.payload?.evaluation?.score || {};
  return {
    stage: String(card?.stage || program?.stage || '').toLowerCase(),
    episodes: Number(card?.episodes ?? program?.metrics?.episodes ?? 0) || 0,
    bb100: Number(latest?.bb100) || 0,
    exploitability: Number(latest?.exploitabilityProxy) || 0,
    latency: Number(latest?.decisionLatencyMsP95) || 0,
  };
}

function filteredSortedCompareRows(rows) {
  const stageFilter = String(nurtureCompareStageFilterSelect?.value || 'all').toLowerCase();
  const minEpisodes = Math.max(0, Number(nurtureCompareMinEpisodesInput?.value || 0));
  const sortMode = String(nurtureCompareSortSelect?.value || 'bb100_desc');
  const filtered = rows.filter((row) => {
    if (!row.ok) return true;
    const score = compareScoreForRow(row);
    if (stageFilter !== 'all' && score.stage !== stageFilter) return false;
    if (score.episodes < minEpisodes) return false;
    return true;
  });
  const sorted = [...filtered].sort((a, b) => {
    if (!a.ok && b.ok) return 1;
    if (a.ok && !b.ok) return -1;
    if (!a.ok && !b.ok) return a.agentId.localeCompare(b.agentId);
    const sa = compareScoreForRow(a);
    const sb = compareScoreForRow(b);
    if (sortMode === 'exploitability_asc')
      return sa.exploitability - sb.exploitability || sb.bb100 - sa.bb100;
    if (sortMode === 'episodes_desc') return sb.episodes - sa.episodes || sb.bb100 - sa.bb100;
    if (sortMode === 'latency_asc') return sa.latency - sb.latency || sb.bb100 - sa.bb100;
    return sb.bb100 - sa.bb100 || sa.exploitability - sb.exploitability;
  });
  return sorted;
}

function compareCardHtml(entry, mainAgentId) {
  if (!entry.ok) {
    return `
      <article class="nurture-compare-card fail">
        <div class="nurture-compare-head">
          <strong>${entry.agentId}</strong>
          <span class="nurture-compare-stage">unavailable</span>
        </div>
        <div class="nurture-sub">${entry.error || 'Unable to fetch state.'}</div>
      </article>
    `;
  }

  const program = entry.payload?.program || null;
  const card = entry.payload?.coachCard || null;
  const stage = String(card?.stage || program?.stage || '-');
  const score = card?.latestScore || entry.payload?.evaluation?.score || {};
  const episodes = card?.episodes ?? program?.metrics?.episodes ?? 0;
  const isMain = entry.agentId === mainAgentId;
  const rank = compareStageRank(stage);
  const delta = entry.delta || {};
  const bbDelta = Number(delta.bb100 || 0);
  const exploitDelta = Number(delta.exploitability || 0);
  const stageDelta = Number(delta.stage || 0);
  const bbCls = bbDelta > 0 ? 'up' : bbDelta < 0 ? 'down' : 'flat';
  const exploitCls = exploitDelta < 0 ? 'up' : exploitDelta > 0 ? 'down' : 'flat';
  const stageCls = stageDelta > 0 ? 'up' : stageDelta < 0 ? 'down' : 'flat';
  const deltaText = (v, digits = 2) => (v > 0 ? `+${v.toFixed(digits)}` : v.toFixed(digits));
  const deltaRef = entry.deltaRef || 'snapshot';
  return `
    <article class="nurture-compare-card ${isMain ? 'main' : ''}">
      <div class="nurture-compare-head">
        <strong>${entry.agentId}</strong>
        <span class="nurture-compare-stage">${stage.replaceAll('_', ' ')} | S${rank}</span>
      </div>
      <div class="nurture-compare-metrics">
        <span>Episodes ${episodes}</span>
        <span>bb/100 ${numText(score?.bb100, 2)}</span>
        <span>Exploit ${numText(score?.exploitabilityProxy, 1)}</span>
        <span>Lat ${numText(score?.decisionLatencyMsP95, 0)}ms</span>
      </div>
      <div class="nurture-compare-deltas">
        <span class="delta-pill ${bbCls}">bb ${deltaText(bbDelta, 2)}</span>
        <span class="delta-pill ${exploitCls}">exploit ${deltaText(exploitDelta, 1)}</span>
        <span class="delta-pill ${stageCls}">stage ${stageDelta > 0 ? '+' : ''}${stageDelta}</span>
        <span class="delta-pill flat">ref ${deltaRef}</span>
      </div>
    </article>
  `;
}

function renderNurtureCompareGrid(rows, mainAgentId) {
  if (!nurtureCompareGrid) return;
  if (!Array.isArray(rows) || rows.length === 0) {
    nurtureCompareGrid.innerHTML =
      '<article class="nurture-compare-card"><div class="nurture-sub">No compare rows match filters.</div></article>';
    return;
  }
  nurtureCompareGrid.innerHTML = rows.map((row) => compareCardHtml(row, mainAgentId)).join('');
}

function applyNurturePreset() {
  const preset = String(nurturePresetSelect?.value || 'baseline_ladder');
  const presets = {
    baseline_ladder: {
      targetBbps: 2.0,
      bb100: 1.2,
      exploitability: 55,
      entropy: 0.33,
      latency: 220,
      violations: 0,
      showdownError: 8,
      volatility: 900,
      source: 'self_play',
      actors: 4,
      traversals: 1200,
      batch: 2048,
    },
    stability_hardening: {
      targetBbps: 1.6,
      bb100: 1.0,
      exploitability: 48,
      entropy: 0.28,
      latency: 180,
      violations: 0,
      showdownError: 5,
      volatility: 650,
      source: 'probe',
      actors: 6,
      traversals: 1500,
      batch: 3072,
    },
    exploit_hunt: {
      targetBbps: 3.0,
      bb100: 2.4,
      exploitability: 36,
      entropy: 0.41,
      latency: 260,
      violations: 0,
      showdownError: 10,
      volatility: 1100,
      source: 'head_to_head',
      actors: 8,
      traversals: 2200,
      batch: 4096,
    },
    latency_stress: {
      targetBbps: 1.4,
      bb100: 0.8,
      exploitability: 62,
      entropy: 0.3,
      latency: 1200,
      violations: 0,
      showdownError: 9,
      volatility: 980,
      source: 'ui_manual',
      actors: 4,
      traversals: 1000,
      batch: 2048,
    },
  };
  const selected = presets[preset] || presets.baseline_ladder;
  if (nurtureTargetBbpsInput) nurtureTargetBbpsInput.value = String(selected.targetBbps);
  if (nurtureBb100Input) nurtureBb100Input.value = String(selected.bb100);
  if (nurtureExploitabilityInput)
    nurtureExploitabilityInput.value = String(selected.exploitability);
  if (nurtureEntropyInput) nurtureEntropyInput.value = String(selected.entropy);
  if (nurtureLatencyInput) nurtureLatencyInput.value = String(selected.latency);
  if (nurtureViolationsInput) nurtureViolationsInput.value = String(selected.violations);
  if (nurtureShowdownErrorInput) nurtureShowdownErrorInput.value = String(selected.showdownError);
  if (nurtureVolatilityInput) nurtureVolatilityInput.value = String(selected.volatility);
  if (nurtureSourceSelect) nurtureSourceSelect.value = String(selected.source);
  if (nurtureActorsInput) nurtureActorsInput.value = String(selected.actors);
  if (nurtureTraversalsInput) nurtureTraversalsInput.value = String(selected.traversals);
  if (nurtureBatchSizeInput) nurtureBatchSizeInput.value = String(selected.batch);
  writeAgentConsole({ ok: true, message: `Applied nurture preset ${preset}.`, preset: selected });
}

async function runNurtureMacro() {
  const form = nurtureForm();
  const episodesRaw = Number(nurtureMacroEpisodesInput?.value || 20);
  const episodes = Math.max(1, Math.min(200, Math.floor(episodesRaw || 20)));
  if (nurtureMacroEpisodesInput) {
    nurtureMacroEpisodesInput.value = String(episodes);
  }

  await api('/api/agents/nurture/init', {
    method: 'POST',
    body: {
      agentId: form.agentId,
      ownerId: form.ownerId,
      objective: 'cash_nlhe_6max',
      targetBbps: form.targetBbps,
      distributed: true,
      cluster: false,
    },
  });

  // Deterministic progression per agent+preset for reproducible macro outcomes.
  const preset = String(nurturePresetSelect?.value || 'baseline_ladder');
  const baseSeed = `${form.agentId}:${preset}:${episodes}`;
  const deterministicNoise = (i, scale) => {
    let h = 0;
    const src = `${baseSeed}:${i}`;
    for (let k = 0; k < src.length; k += 1) h = (h * 31 + src.charCodeAt(k)) | 0;
    return ((h % 1000) / 1000 - 0.5) * scale;
  };

  for (let i = 0; i < episodes; i += 1) {
    const drift = i / Math.max(1, episodes - 1);
    await api('/api/agents/nurture/episode', {
      method: 'POST',
      body: {
        agentId: form.agentId,
        bb100: form.bb100 + drift * 0.9 + deterministicNoise(i, 0.6),
        exploitabilityProxy: Math.max(
          0,
          form.exploitabilityProxy - drift * 16 + deterministicNoise(i, 3)
        ),
        policyEntropy: Math.max(0, Math.min(1, form.policyEntropy + deterministicNoise(i, 0.06))),
        showdownErrorRateBps: Math.max(
          0,
          form.showdownErrorRateBps - drift * 2 + deterministicNoise(i, 2)
        ),
        decisionLatencyMsP95: Math.max(
          1,
          form.decisionLatencyMsP95 - drift * 30 + deterministicNoise(i, 18)
        ),
        legalActionViolationBps: Math.max(
          0,
          form.legalActionViolationBps + deterministicNoise(i, 2)
        ),
        bankrollVolatilityBps: Math.max(
          0,
          form.bankrollVolatilityBps - drift * 40 + deterministicNoise(i, 30)
        ),
        source: form.source,
        autoEvaluate: i === episodes - 1,
      },
    });
  }

  const evaluated = await api('/api/agents/nurture/evaluate', {
    method: 'POST',
    body: {
      agentId: form.agentId,
      trainingProfilePatch: {
        targetBbps: form.targetBbps,
        learnerActors: form.learnerActors,
        traversalsPerIteration: form.traversalsPerIteration,
        miniBatchSize: form.miniBatchSize,
        evalCadence: { exploitabilityProxyEvery: 2 },
      },
    },
  });
  await syncNurtureState(form.agentId);
  writeAgentConsole({
    ok: true,
    message: 'Nurture macro completed.',
    preset,
    episodes,
    evaluation: evaluated.evaluation || null,
  });
}

function clearAgentConsole() {
  if (agentConsoleOutput) agentConsoleOutput.textContent = '';
}

function downloadTextFile(name, text, type = 'text/plain') {
  const blob = new Blob([text], { type });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

function compareRowSummary(row) {
  if (!row?.ok) {
    return {
      agentId: row?.agentId || '-',
      ok: false,
      stage: '-',
      episodes: 0,
      bb100: 0,
      exploitability: 0,
      latencyMsP95: 0,
      deltaBb100: 0,
      deltaExploitability: 0,
      deltaStage: 0,
      deltaRef: row?.deltaRef || '-',
      error: row?.error || 'fetch_failed',
    };
  }
  const score = compareScoreForRow(row);
  return {
    agentId: row.agentId,
    ok: true,
    stage: score.stage,
    episodes: score.episodes,
    bb100: score.bb100,
    exploitability: score.exploitability,
    latencyMsP95: score.latency,
    deltaBb100: Number(row?.delta?.bb100 || 0),
    deltaExploitability: Number(row?.delta?.exploitability || 0),
    deltaStage: Number(row?.delta?.stage || 0),
    deltaRef: row?.deltaRef || 'snapshot',
    error: '',
  };
}

function updateCompareStatus() {
  if (!nurtureCompareStatus) return;
  const baselineCount = Object.keys(state.nurtureCompareBaselineByAgent || {}).length;
  const total = Array.isArray(state.nurtureCompareRows) ? state.nurtureCompareRows.length : 0;
  const ok = (state.nurtureCompareRows || []).filter((r) => r.ok).length;
  nurtureCompareStatus.textContent = `Compare rows ${ok}/${total} | Baseline agents ${baselineCount}`;
}

function setNurtureBaselineFromCurrentCompare() {
  const rows = Array.isArray(state.nurtureCompareRows) ? state.nurtureCompareRows : [];
  const baseline = {};
  for (const row of rows) {
    if (!row?.ok) continue;
    baseline[row.agentId] = compareScoreForRow(row);
  }
  state.nurtureCompareBaselineByAgent = baseline;
  persistNurtureOpsPrefs();
  updateCompareStatus();
  writeAgentConsole({
    ok: true,
    message: 'Delta baseline set from current compare.',
    baselineAgents: Object.keys(baseline).length,
  });
}

function clearNurtureBaseline() {
  state.nurtureCompareBaselineByAgent = {};
  persistNurtureOpsPrefs();
  updateCompareStatus();
  writeAgentConsole({ ok: true, message: 'Delta baseline cleared.' });
}

function exportNurtureCompareJson() {
  const rows = filteredSortedCompareRows(state.nurtureCompareRows || []).map(compareRowSummary);
  downloadTextFile(
    `nurture-compare-${Date.now()}.json`,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        baselineAgents: Object.keys(state.nurtureCompareBaselineByAgent || {}).length,
        rows,
      },
      null,
      2
    ),
    'application/json'
  );
  writeAgentConsole({ ok: true, message: 'Exported nurture compare JSON.', rows: rows.length });
}

function exportNurtureCompareCsv() {
  const rows = filteredSortedCompareRows(state.nurtureCompareRows || []).map(compareRowSummary);
  const header = [
    'agentId',
    'ok',
    'stage',
    'episodes',
    'bb100',
    'exploitability',
    'latencyMsP95',
    'deltaBb100',
    'deltaExploitability',
    'deltaStage',
    'deltaRef',
    'error',
  ];
  const body = rows.map((row) =>
    [
      row.agentId,
      row.ok,
      row.stage,
      row.episodes,
      row.bb100,
      row.exploitability,
      row.latencyMsP95,
      row.deltaBb100,
      row.deltaExploitability,
      row.deltaStage,
      row.deltaRef,
      row.error,
    ]
      .map((v) => `"${String(v).replaceAll('"', '""')}"`)
      .join(',')
  );
  const csv = `${header.join(',')}\n${body.join('\n')}\n`;
  downloadTextFile(`nurture-compare-${Date.now()}.csv`, csv, 'text/csv');
  writeAgentConsole({ ok: true, message: 'Exported nurture compare CSV.', rows: rows.length });
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

// Poker-only mode: roulette options parser intentionally disabled.
// function rouletteOptions() { ... }

function formatRound(round) {
  if (round.game === 'poker') {
    return `Hand: ${round.detail.hand.join(' ')}\nResult: ${round.detail.rank}`;
  }
  // Poker-only mode: non-poker formatters intentionally disabled.
  // if (round.game === 'blackjack') { ... }
  // if (round.game === 'roulette') { ... }
  // return `Reel: ${round.detail.spin.join(' | ')}\nMultiplier: ${round.detail.multiplier}`;
  return 'Unsupported game in poker-only mode.';
}

const suitNameMap = {
  '♠': 'spades',
  '♥': 'hearts',
  '♦': 'diamonds',
  '♣': 'clubs',
};

const rankNameMap = {
  A: 'ace',
  K: 'king',
  Q: 'queen',
  J: 'jack',
};

function cardAssetUrl(code) {
  if (!code || code.length < 2) return '';
  const suit = code.slice(-1);
  const rank = code.slice(0, -1);
  const suitName = suitNameMap[suit];
  const rankName = rankNameMap[rank] || rank;
  if (!suitName || !rankName) return '';
  return `/assets/cards/english_pattern_${rankName}_of_${suitName}.svg`;
}

function cardFallbackAssetUrl(code) {
  if (!code || code.length < 2) return '';
  const suit = code.slice(-1);
  const rank = code.slice(0, -1);
  const suitName = suitNameMap[suit];
  const rankName = rankNameMap[rank] || rank;
  if (!suitName || !rankName) return '';
  return `https://commons.wikimedia.org/wiki/Special:FilePath/English_pattern_${encodeURIComponent(rankName)}_of_${encodeURIComponent(suitName)}.svg`;
}

function cardVisual(code, cls = '') {
  const url = cardAssetUrl(code);
  const fallback = cardFallbackAssetUrl(code);
  if (!url) return `<div class="card-chip ${cls}">${code}</div>`;
  return `
    <div class="card-chip ${cls}">
      <img src="${url}" alt="${code}" loading="lazy" referrerpolicy="no-referrer" onerror="if(this.dataset.fb!== '1'){this.dataset.fb='1'; this.src='${fallback}';}" />
      <span>${code}</span>
    </div>
  `;
}

function renderShowcase(round) {
  if (!gameShowcase) return;
  if (!round) {
    gameShowcase.innerHTML = '<p class="showcase-empty">Awaiting next round...</p>';
    return;
  }

  if (round.game === 'poker') {
    const cards = (round.detail?.hand || []).map((c) => cardVisual(c)).join('');
    gameShowcase.innerHTML = `
      <div class="showcase-row">${cards}</div>
      <div class="showcase-meta">${round.detail?.rank || 'Poker Round'}</div>
    `;
    return;
  }
  // Poker-only mode: non-poker showcase renderers intentionally disabled.
  // if (round.game === 'blackjack') { ... }
  // if (round.game === 'roulette') { ... }
  // const spin = ...;
  gameShowcase.innerHTML = '<p class="showcase-empty">Unsupported game in poker-only mode.</p>';
}

function renderTableShowcase(snapshot, timeline = []) {
  if (!gameShowcase || !snapshot) return;
  const seats = Array.isArray(snapshot.seats) ? snapshot.seats : [];
  const seatBadges = seats
    .map((seat, idx) => {
      const seatNo = Number.isInteger(seat?.seat) ? seat.seat : idx;
      const active = seatNo === snapshot.actingSeat ? 'active' : '';
      const folded = seat?.folded ? 'folded' : '';
      return `<span class="table-seat ${active} ${folded}">S${seatNo}${seat?.folded ? ' F' : ''}</span>`;
    })
    .join('');
  const recent = timeline
    .slice(-4)
    .map((row) => `${row.action}${row.amount > 0 ? ` ${row.amount}` : ''}`)
    .join(' | ');
  const community = Array.isArray(snapshot.communityCards) ? snapshot.communityCards : [];
  const board = community.map((code) => cardVisual(code, 'dealer')).join('');

  gameShowcase.innerHTML = `
    <div class="showcase-row">
      ${seatBadges}
    </div>
    <div class="showcase-meta">
      Hand ${snapshot.handId} | Street ${(snapshot.street || 'preflop').toUpperCase()} | Pot ${snapshot.pot} | Acting Seat ${snapshot.actingSeat}
      ${snapshot.terminal ? '| TERMINAL' : ''}
    </div>
    <div class="showcase-row">${board || '<span class="showcase-labeled">No board yet</span>'}</div>
    <div class="showcase-meta">${recent || 'No actions yet'}</div>
  `;
}

function renderTournamentShowcase(payload) {
  if (!gameShowcase) return;
  const sng = payload?.sng || null;
  const mtt = payload?.mtt || null;
  if (!sng && !mtt) return;

  if (sng) {
    const eliminated = Array.isArray(sng.eliminated) ? sng.eliminated : [];
    const recent = eliminated
      .slice(-4)
      .map((row) => `${row.playerId}#${row.finishPosition}`)
      .join(' | ');
    gameShowcase.innerHTML = `
      <div class="showcase-meta">SNG ${sng.tournamentId} | ${sng.status} | Level ${Number(sng.levelIndex || 0) + 1}</div>
      <div class="showcase-meta">Players ${Array.isArray(sng.seats) ? sng.seats.length : 0}/${sng.maxPlayers}</div>
      <div class="showcase-meta">${recent || 'No eliminations yet'}</div>
    `;
    return;
  }

  if (mtt) {
    const tables = Array.isArray(mtt.tables) ? mtt.tables : [];
    const tableSummary = tables.map((t) => `${t.tableId}:${(t.seats || []).length}`).join(' | ');
    gameShowcase.innerHTML = `
      <div class="showcase-meta">MTT ${mtt.tournamentId} | ${mtt.status}</div>
      <div class="showcase-meta">Active ${mtt.activePlayers}/${mtt.playerCount} | Tables ${mtt.tableCount}</div>
      <div class="showcase-meta">${tableSummary || 'No table allocation yet'}</div>
    `;
  }
}

function renderEconomyShowcase(history, entries) {
  if (!gameShowcase) return;
  const settlements = Array.isArray(history?.settlements) ? history.settlements : [];
  const latestSettlement = settlements.length ? settlements[settlements.length - 1] : null;
  const recentEntries = Array.isArray(entries) ? entries.slice(0, 4) : [];
  const entryLine = recentEntries
    .map((row) => `${row.type}:${row.amountUnits || row.payoutUnits || row.reservedUsedUnits || 0}`)
    .join(' | ');

  gameShowcase.innerHTML = `
    <div class="showcase-meta">Sponsorship ${history?.position?.positionId || '-'}</div>
    <div class="showcase-meta">Settlements ${settlements.length} | Sponsors ${history?.position?.sponsorCount ?? 0}</div>
    <div class="showcase-meta">Latest net ${latestSettlement?.netResultUnits ?? '-'} | Backers ${latestSettlement?.backerNetUnits ?? '-'}</div>
    <div class="showcase-meta">${entryLine || 'No cashier entries yet'}</div>
  `;
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
  if (playInFlight) return;
  playInFlight = true;
  playButton.disabled = true;
  const bet = getBetAmount();
  const game = 'poker';
  try {
    const onchain = await settleBetOnChainIfEnabled(bet);

    const data = await api('/api/play', {
      method: 'POST',
      body: {
        sessionId: state.sessionId,
        game,
        bet,
        options: {},
        onchain,
      },
    });

    state.session = data.session;
    const round = data.round;
    const delta = round.delta;

    fairnessReceiptEl.textContent = JSON.stringify(round.receipt, null, 2);
    renderShowcase(round);
    const onchainLine = round.onchain?.txHash ? `\nOn-chain tx: ${round.onchain.txHash}` : '';
    result.textContent = `${formatRound(round)}\n\nBet: ${round.bet}\nPayout: ${round.payout}\nDelta: ${delta >= 0 ? '+' : ''}${delta}\nBankroll: ${data.session.bankroll}${onchainLine}`;

    await refreshLedger();
  } finally {
    playInFlight = false;
    playButton.disabled = false;
  }
}

function currentAgentForm() {
  return {
    agentId: (agentIdInput?.value || '').trim() || 'agent-alpha',
    ownerId: (agentOwnerIdInput?.value || '').trim() || 'owner-main',
    tier: agentTierSelect?.value || 'B',
    style: agentStyleSelect?.value || 'tight_aggressive',
  };
}

async function runAgentRegister() {
  const form = currentAgentForm();
  const out = await api('/api/agents/register', {
    method: 'POST',
    body: {
      agentId: form.agentId,
      ownerId: form.ownerId,
      tier: form.tier,
      style: form.style,
    },
  });
  state.lastAgentId = form.agentId;
  writeAgentConsole(out);
}

async function runStrategyProfile() {
  const form = currentAgentForm();
  const out = await api('/api/strategy/profile', {
    method: 'POST',
    body: {
      agentId: form.agentId,
      temperament: form.style === 'exploitative' ? 'loose_aggressive' : form.style,
      maxRiskBps: 800,
    },
  });
  state.lastAgentId = form.agentId;
  writeAgentConsole(out);
}

async function runStrategyDecision() {
  const form = currentAgentForm();
  const out = await api('/api/strategy/decide', {
    method: 'POST',
    body: {
      agentId: form.agentId,
      temperament: form.style === 'exploitative' ? 'loose_aggressive' : form.style,
      bankrollUnits: Math.max(0, Number(state.session?.bankroll || 0)),
      legalActions: ['fold', 'check', 'call', 'raise'],
      handStrength: 0.63,
      potUnits: 120,
      toCallUnits: 20,
    },
  });
  state.lastAgentId = form.agentId;
  writeAgentConsole(out);
}

async function runAgentCraftTexasSolverTraits() {
  const form = currentAgentForm();
  const raw = String(agentTexasSolverJsonInput?.value || '').trim();
  if (!raw) {
    throw new Error('TexasSolver JSON is required');
  }
  let solverDump;
  try {
    solverDump = JSON.parse(raw);
  } catch {
    throw new Error('TexasSolver JSON is invalid');
  }
  const out = await api('/api/strategy/traits/craft', {
    method: 'POST',
    body: {
      provider: 'texassolver',
      agentId: form.agentId,
      ownerId: form.ownerId,
      tier: form.tier,
      solverDump,
      applyToAgent: true,
      autoRegister: true,
      createProfile: true,
    },
  });
  state.lastAgentId = form.agentId;
  if (out?.recommendation?.recommended?.style) {
    agentStyleSelect.value = out.recommendation.recommended.style;
  }
  writeAgentConsole(out);
}

async function runTraitDashboard() {
  const out = await api('/api/strategy/traits/dashboard');
  if (traitFreezeCheckbox && typeof out?.freeze === 'boolean') {
    traitFreezeCheckbox.checked = out.freeze;
  }
  if (!traitRolloutIdInput?.value && Array.isArray(out?.rollouts) && out.rollouts[0]?.rolloutId) {
    traitRolloutIdInput.value = String(out.rollouts[0].rolloutId);
  }
  writeAgentConsole(out);
}

async function runTraitFreezePolicy() {
  const freeze = traitFreezeCheckbox?.checked === true;
  const out = await api('/api/strategy/traits/policy/freeze', {
    method: 'POST',
    body: { freeze },
  });
  writeAgentConsole(out);
}

async function runTraitRolloutState() {
  const rolloutId = String(traitRolloutIdInput?.value || '').trim();
  if (!rolloutId) {
    throw new Error('Rollout ID is required');
  }
  const out = await api(
    `/api/strategy/traits/rollout/state?rolloutId=${encodeURIComponent(rolloutId)}`
  );
  writeAgentConsole(out);
}

async function runTraitRevokeArtifact() {
  const artifactId = String(traitArtifactIdInput?.value || '').trim();
  if (!artifactId) {
    throw new Error('Artifact ID is required');
  }
  const out = await api('/api/strategy/traits/policy/revoke-artifact', {
    method: 'POST',
    body: { artifactId },
  });
  writeAgentConsole(out);
}

function nurtureForm() {
  const form = currentAgentForm();
  const targetBbps = Number(nurtureTargetBbpsInput?.value || 2);
  const bb100 = Number(nurtureBb100Input?.value || 0);
  const exploitabilityProxy = Number(nurtureExploitabilityInput?.value || 100);
  const policyEntropy = Number(nurtureEntropyInput?.value || 0.3);
  const decisionLatencyMsP95 = Number(nurtureLatencyInput?.value || 250);
  const legalActionViolationBps = Number(nurtureViolationsInput?.value || 0);
  const showdownErrorRateBps = Number(nurtureShowdownErrorInput?.value || 8);
  const bankrollVolatilityBps = Number(nurtureVolatilityInput?.value || 900);
  const source = String(nurtureSourceSelect?.value || 'ui_manual');
  const learnerActors = Math.max(1, Number(nurtureActorsInput?.value || 4));
  const traversalsPerIteration = Math.max(1, Number(nurtureTraversalsInput?.value || 1200));
  const miniBatchSize = Math.max(32, Number(nurtureBatchSizeInput?.value || 2048));
  return {
    ...form,
    targetBbps,
    bb100,
    exploitabilityProxy,
    policyEntropy,
    decisionLatencyMsP95,
    legalActionViolationBps,
    showdownErrorRateBps,
    bankrollVolatilityBps,
    source,
    learnerActors,
    traversalsPerIteration,
    miniBatchSize,
  };
}

async function syncNurtureState(agentId) {
  const out = await api(`/api/agents/nurture/state?agentId=${encodeURIComponent(agentId)}`);
  renderNurtureCard(out);
  return out;
}

async function runNurtureInit() {
  const form = nurtureForm();
  const out = await api('/api/agents/nurture/init', {
    method: 'POST',
    body: {
      agentId: form.agentId,
      ownerId: form.ownerId,
      objective: 'cash_nlhe_6max',
      targetBbps: form.targetBbps,
      distributed: true,
      cluster: false,
    },
  });
  await syncNurtureState(form.agentId);
  writeAgentConsole(out);
}

async function runNurtureEpisode() {
  const form = nurtureForm();
  const out = await api('/api/agents/nurture/episode', {
    method: 'POST',
    body: {
      agentId: form.agentId,
      bb100: form.bb100,
      exploitabilityProxy: form.exploitabilityProxy,
      policyEntropy: form.policyEntropy,
      showdownErrorRateBps: form.showdownErrorRateBps,
      decisionLatencyMsP95: form.decisionLatencyMsP95,
      legalActionViolationBps: form.legalActionViolationBps,
      bankrollVolatilityBps: form.bankrollVolatilityBps,
      source: form.source,
      autoEvaluate: true,
    },
  });
  await syncNurtureState(form.agentId);
  writeAgentConsole(out);
}

async function runNurtureEvaluate() {
  const form = nurtureForm();
  const out = await api('/api/agents/nurture/evaluate', {
    method: 'POST',
    body: {
      agentId: form.agentId,
      trainingProfilePatch: {
        targetBbps: form.targetBbps,
        learnerActors: form.learnerActors,
        traversalsPerIteration: form.traversalsPerIteration,
        miniBatchSize: form.miniBatchSize,
        evalCadence: { exploitabilityProxyEvery: 2 },
      },
    },
  });
  await syncNurtureState(form.agentId);
  writeAgentConsole(out);
}

async function runNurtureState(options = {}) {
  const silent = Boolean(options.silent);
  const form = nurtureForm();
  const out = await syncNurtureState(form.agentId);
  if (!silent) writeAgentConsole(out);
}

async function runNurtureBatch10() {
  const form = nurtureForm();
  for (let i = 0; i < 10; i += 1) {
    const noise = (Math.random() - 0.5) * 0.6;
    await api('/api/agents/nurture/episode', {
      method: 'POST',
      body: {
        agentId: form.agentId,
        bb100: form.bb100 + noise,
        exploitabilityProxy: Math.max(0, form.exploitabilityProxy - i * 1.2 + noise * 4),
        policyEntropy: Math.max(0, Math.min(1, form.policyEntropy + (Math.random() - 0.5) * 0.06)),
        showdownErrorRateBps: Math.max(
          0,
          form.showdownErrorRateBps + Math.floor((Math.random() - 0.5) * 6)
        ),
        decisionLatencyMsP95: Math.max(
          1,
          form.decisionLatencyMsP95 + Math.floor((Math.random() - 0.5) * 30)
        ),
        legalActionViolationBps: Math.max(
          0,
          form.legalActionViolationBps + Math.floor((Math.random() - 0.5) * 3)
        ),
        bankrollVolatilityBps: Math.max(
          0,
          form.bankrollVolatilityBps + Math.floor((Math.random() - 0.5) * 40)
        ),
        source: form.source,
        autoEvaluate: i === 9,
      },
    });
  }
  const out = await syncNurtureState(form.agentId);
  writeAgentConsole({ ok: true, message: 'Logged 10 nurture episodes.', coachCard: out.coachCard });
}

async function runNurtureExport() {
  const form = nurtureForm();
  const out = await syncNurtureState(form.agentId);
  const blob = new Blob([JSON.stringify(out.program || out, null, 2)], {
    type: 'application/json',
  });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = `${form.agentId}-nurture-program.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
  writeAgentConsole({ ok: true, message: 'Nurture program exported.', file: a.download });
}

async function runNurtureCompare(options = {}) {
  const silent = Boolean(options.silent);
  const form = nurtureForm();
  const ids = parseCompareAgentIds();
  if (ids.length === 0) {
    renderNurtureCompareGrid([], form.agentId);
    if (!silent) {
      writeAgentConsole({ ok: false, error: 'No compare agent IDs provided.' });
    }
    return;
  }

  const settled = await Promise.allSettled(
    ids.map(async (agentId) => ({
      agentId,
      payload: await api(`/api/agents/nurture/state?agentId=${encodeURIComponent(agentId)}`),
    }))
  );
  const rows = settled.map((item, idx) => {
    const agentId = ids[idx];
    if (item.status === 'fulfilled') {
      const payload = item.value.payload;
      const next = compareScoreForRow({ ok: true, agentId, payload });
      const baseline = state.nurtureCompareBaselineByAgent[agentId] || null;
      const prev = state.nurtureComparePrevByAgent[agentId] || null;
      const ref = baseline || prev;
      const delta = ref
        ? {
            bb100: next.bb100 - ref.bb100,
            exploitability: next.exploitability - ref.exploitability,
            stage: compareStageRank(next.stage) - compareStageRank(ref.stage),
          }
        : { bb100: 0, exploitability: 0, stage: 0 };
      state.nurtureComparePrevByAgent[agentId] = next;
      return {
        ok: true,
        agentId,
        payload,
        delta,
        deltaRef: baseline ? 'baseline' : prev ? 'snapshot' : 'none',
      };
    }
    const reason = item.reason instanceof Error ? item.reason.message : String(item.reason);
    return { ok: false, agentId, error: reason };
  });
  state.nurtureCompareRows = rows;
  renderNurtureCompareGrid(filteredSortedCompareRows(rows), form.agentId);
  updateCompareStatus();
  if (!silent) {
    writeAgentConsole({
      ok: true,
      compareCount: rows.length,
      success: rows.filter((r) => r.ok).length,
      failed: rows.filter((r) => !r.ok).length,
    });
  }
}

function stopNurtureAutoRefresh() {
  if (nurtureAutoRefreshTimer) {
    clearInterval(nurtureAutoRefreshTimer);
    nurtureAutoRefreshTimer = null;
  }
  if (nurtureAutoToggleButton) {
    nurtureAutoToggleButton.textContent = 'Start Auto Refresh';
  }
}

async function runNurtureAutoTick() {
  if (nurtureAutoTickInFlight) return;
  nurtureAutoTickInFlight = true;
  try {
    await runNurtureState({ silent: true });
    const ids = parseCompareAgentIds();
    if (ids.length > 0) {
      await runNurtureCompare({ silent: true });
    }
  } finally {
    nurtureAutoTickInFlight = false;
  }
}

async function toggleNurtureAutoRefresh() {
  if (nurtureAutoRefreshTimer) {
    stopNurtureAutoRefresh();
    writeAgentConsole({ ok: true, message: 'Nurture auto-refresh stopped.' });
    return;
  }
  const secondsRaw = Number(nurtureRefreshSecInput?.value || 12);
  const intervalSec = Math.max(3, Math.min(300, Math.floor(secondsRaw || 12)));
  if (nurtureRefreshSecInput) nurtureRefreshSecInput.value = String(intervalSec);
  persistNurtureOpsPrefs();
  if (nurtureAutoToggleButton) {
    nurtureAutoToggleButton.textContent = `Stop Auto (${intervalSec}s)`;
  }
  await runNurtureAutoTick();
  nurtureAutoRefreshTimer = setInterval(() => {
    void runNurtureAutoTick();
  }, intervalSec * 1000);
  writeAgentConsole({ ok: true, message: 'Nurture auto-refresh started.', intervalSec });
}

async function runEquitySim() {
  const form = currentAgentForm();
  const out = await api('/api/sim/equity', {
    method: 'POST',
    body: {
      seed: `${state.sessionId || 'sess'}:${form.agentId}:${Date.now()}`,
      iterations: 1200,
      boardCards: ['Ah', 'Kd', '7c'],
      players: [{ playerId: form.agentId }, { playerId: 'villain-1' }, { playerId: 'villain-2' }],
    },
  });
  writeAgentConsole(out);
}

async function runSwarmStatus() {
  const out = await api('/api/swarm/status');
  writeAgentConsole(out);
}

function buildSeats(count) {
  const n = Math.max(2, Math.min(9, Number(count || 2)));
  return Array.from({ length: n }, (_, i) => ({ seat: i, folded: false }));
}

async function initTableState() {
  const out = await api('/api/table/state/init', {
    method: 'POST',
    body: {
      tableId: state.tableId,
      handId: (tableHandIdInput?.value || '').trim() || `hand-${Date.now()}`,
      seats: buildSeats(tableSeatCountInput?.value),
      actingSeat: Number(tableActingSeatInput?.value || 0),
      pot: 0,
    },
  });
  writePanel(tableStateOutput, out);
  renderTableShowcase(out.snapshot, []);
  await refreshTableEvents();
}

async function refreshTableState() {
  const out = await api(`/api/table/state?tableId=${encodeURIComponent(state.tableId)}`);
  writePanel(tableStateOutput, out);
  renderTableShowcase(out.snapshot, []);
}

async function applyTableAction() {
  const out = await api('/api/table/action', {
    method: 'POST',
    body: {
      tableId: state.tableId,
      idempotencyKey: crypto.randomUUID(),
      type: tableActionTypeSelect?.value || 'player.action',
      seat: Number(tableActionSeatInput?.value || 0),
      action: tableActionNameSelect?.value || 'check',
      amount: Number(tableActionAmountInput?.value || 0),
    },
  });
  writePanel(tableStateOutput, out);
  renderTableShowcase(out.snapshot, [out]);
  await refreshTableEvents();
}

async function settleTableHand() {
  const out = await api('/api/table/settle', {
    method: 'POST',
    body: {
      tableId: state.tableId,
      winnerSeat: Number(tableWinnerSeatInput?.value || 0),
      payoutUnits: Number(tablePayoutUnitsInput?.value || 0),
    },
  });
  writePanel(tableStateOutput, out);
  renderTableShowcase(out.snapshot, []);
  await refreshTableEvents();
}

async function autoTableRound() {
  const out = await api('/api/table/round/auto', {
    method: 'POST',
    body: {
      tableId: state.tableId,
      handId: (tableHandIdInput?.value || '').trim() || `hand-${Date.now()}`,
      seats: buildSeats(tableSeatCountInput?.value),
      maxActions: 6,
    },
  });
  writePanel(tableStateOutput, out);
  renderTableShowcase(out.snapshot, out.timeline || []);
  await refreshTableEvents();
}

function v2PlayerId() {
  return (v2PlayerIdInput?.value || '').trim() || 'hv2-a';
}

function v2ActionAmount() {
  const raw = Number(v2ActionAmountInput?.value || 0);
  if (!Number.isFinite(raw) || raw < 0) return 0;
  return Math.floor(raw);
}

function buildV2RankingMap() {
  const n = Math.max(2, Math.min(9, Number(tableSeatCountInput?.value || 2)));
  const out = {};
  for (let i = 0; i < n; i += 1) {
    out[String(i)] = n - i;
  }
  return out;
}

async function v2CreateTable() {
  const seatCount = Math.max(2, Math.min(9, Number(tableSeatCountInput?.value || 2)));
  const seatRows = Array.from({ length: seatCount }, (_, idx) => ({
    playerId: idx === 0 ? v2PlayerId() : `hv2-${idx}`,
    seat: idx,
    stack: 3000,
    autoPostBlinds: true,
  }));
  const out = await api('/api/v2/holdem/tables', {
    method: 'POST',
    body: {
      tableId: state.tableId,
      mode: 'cash',
      maxSeats: seatCount,
      smallBlind: 50,
      bigBlind: 100,
      ante: 10,
      seats: seatRows,
    },
  });
  writePanel(tableStateOutput, out);
}

async function v2SeatPlayer() {
  const out = await api('/api/v2/holdem/seat', {
    method: 'POST',
    body: {
      tableId: state.tableId,
      playerId: v2PlayerId(),
      seat: Number(liveHeroSeatInput?.value || 0),
      stack: 3000,
      autoPostBlinds: true,
    },
  });
  writePanel(tableStateOutput, out);
}

async function v2StartHand() {
  const out = await api('/api/v2/holdem/hands/start', {
    method: 'POST',
    body: {
      tableId: state.tableId,
      handId: (tableHandIdInput?.value || '').trim() || `v2-hand-${Date.now()}`,
      idempotencyKey: crypto.randomUUID(),
    },
  });
  writePanel(tableStateOutput, out);
}

async function v2SendAction() {
  const out = await api('/api/v2/holdem/actions', {
    method: 'POST',
    body: {
      tableId: state.tableId,
      playerId: v2PlayerId(),
      action: v2ActionNameSelect?.value || 'check',
      amount: v2ActionAmount(),
      idempotencyKey: crypto.randomUUID(),
    },
  });
  writePanel(tableStateOutput, out);
}

async function v2SettleHand() {
  const out = await api('/api/v2/holdem/hands/settle', {
    method: 'POST',
    body: {
      tableId: state.tableId,
      rankingBySeat: buildV2RankingMap(),
      settlementKey: crypto.randomUUID(),
    },
  });
  writePanel(tableStateOutput, out);
}

async function v2Replay() {
  const out = await api(`/api/v2/holdem/replay?tableId=${encodeURIComponent(state.tableId)}`);
  writePanel(tableStateOutput, out);
}

async function v2State() {
  const out = await api(`/api/v2/holdem/state?tableId=${encodeURIComponent(state.tableId)}`);
  writePanel(tableStateOutput, out);
}

function liveHeroSeat() {
  const raw = Number(liveHeroSeatInput?.value || 0);
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, Math.min(8, Math.floor(raw)));
}

function renderLiveTable(snapshot) {
  if (!liveTable || !liveTableStatus) return;
  if (!snapshot) {
    liveTableStatus.textContent = 'No active hand. Start New Hand.';
    liveTable.innerHTML = '<p class="showcase-empty">No active snapshot.</p>';
    return;
  }

  const heroSeat = liveHeroSeat();
  const seats = Array.isArray(snapshot.seats) ? snapshot.seats : [];
  const seatsHtml = seats
    .map((seat, idx) => {
      const seatNo = Number.isInteger(seat?.seat) ? seat.seat : idx;
      const classes = ['live-seat'];
      if (seatNo === heroSeat) classes.push('hero');
      if (seatNo === snapshot.actingSeat) classes.push('acting');
      if (seat?.folded) classes.push('folded');
      return `
        <div class="${classes.join(' ')}">
          <div class="live-seat-title">Seat ${seatNo}${seatNo === heroSeat ? ' (YOU)' : ''}</div>
          <div class="live-seat-meta">${seat?.folded ? 'Folded' : 'In Hand'}</div>
        </div>
      `;
    })
    .join('');
  const community = Array.isArray(snapshot.communityCards) ? snapshot.communityCards : [];
  const heroCards = (snapshot.holeCards && snapshot.holeCards[String(heroSeat)]) || [];
  const heroCardsHtml = heroCards.map((code) => cardVisual(code)).join('');
  const boardHtml = community.map((code) => cardVisual(code, 'dealer')).join('');
  const showdown =
    Array.isArray(snapshot.showdown) && snapshot.showdown.length
      ? ` | Winner Seat ${snapshot.winnerSeat}`
      : '';

  liveTableStatus.textContent = `Hand ${snapshot.handId} | Street ${(snapshot.street || 'preflop').toUpperCase()} | Pot ${snapshot.pot} | Acting Seat ${snapshot.actingSeat}${snapshot.terminal ? ' | TERMINAL' : ''}${showdown}`;
  liveTable.innerHTML = `
    <div class="showcase-meta">Board</div>
    <div class="showcase-row">${boardHtml || '<span class="showcase-labeled">No board cards yet</span>'}</div>
    <div class="showcase-meta">Hero Hole Cards</div>
    <div class="showcase-row">${heroCardsHtml || '<span class="showcase-labeled">No hole cards</span>'}</div>
    <div class="live-seats">${seatsHtml}</div>
  `;
}

async function refreshLiveHand() {
  try {
    const out = await api(`/api/table/state?tableId=${encodeURIComponent(state.tableId)}`, {
      retry: false,
    });
    renderLiveTable(out.snapshot);
  } catch {
    renderLiveTable(null);
  }
}

async function startLiveHand() {
  const heroSeat = liveHeroSeat();
  const sessionBySeat = {};
  if (state.sessionId) sessionBySeat[String(heroSeat)] = state.sessionId;
  const out = await api('/api/table/state/init', {
    method: 'POST',
    body: {
      tableId: state.tableId,
      handId: `hand-${Date.now()}`,
      seats: buildSeats(6),
      actingSeat: 0,
      pot: 0,
      sessionBySeat,
    },
  });
  renderTableShowcase(out.snapshot, []);
  renderLiveTable(out.snapshot);
}

async function livePlayerAction(action) {
  const out = await api('/api/table/action', {
    method: 'POST',
    body: {
      tableId: state.tableId,
      idempotencyKey: crypto.randomUUID(),
      type: 'player.action',
      seat: liveHeroSeat(),
      action,
      amount:
        action === 'raise'
          ? Math.max(1, Number(liveRaiseAmountInput?.value || 1))
          : action === 'call'
            ? 10
            : 0,
    },
  });
  renderTableShowcase(out.snapshot, [out]);
  renderLiveTable(out.snapshot);
}

async function liveAutoPlayHand() {
  const out = await api('/api/table/round/auto', {
    method: 'POST',
    body: {
      tableId: state.tableId,
      handId: `hand-${Date.now()}`,
      seats: buildSeats(6),
      maxActions: 8,
    },
  });
  renderTableShowcase(out.snapshot, out.timeline || []);
  renderLiveTable(out.snapshot);
}

function tournamentForm() {
  return {
    tournamentId: (tournamentIdInput?.value || '').trim() || 'sng-1',
    playerId: (tournamentPlayerIdInput?.value || '').trim() || 'player-1',
  };
}

function v2TournamentForm() {
  return {
    tournamentId: (tournamentIdInput?.value || '').trim() || 'v2-mtt-1',
    playerId: (tournamentPlayerIdInput?.value || '').trim() || 'player-1',
    type: v2TourTypeSelect?.value || 'mtt',
    seconds: Math.max(1, Number(v2ClockSecondsInput?.value || 600)),
    finishPosition: Math.max(1, Number(v2FinishPositionInput?.value || 6)),
  };
}

async function v2CreateTournament() {
  const form = v2TournamentForm();
  const out = await api('/api/v2/tournaments', {
    method: 'POST',
    body: {
      tournamentId: form.tournamentId,
      type: form.type,
      maxPlayers: form.type === 'sng' ? 6 : 60,
      tableSize: 6,
      buyInUnits: 1000,
      rebuy: { enabled: true, maxPerPlayer: 2, untilLevelInclusive: 3, chipsPerRebuy: 20000 },
      addon: { enabled: true, level: 3, chips: 25000 },
    },
  });
  writePanel(tournamentOutput, out);
  if (out?.tournament) renderTournamentShowcase({ mtt: out.tournament });
}

async function v2RegisterTournament() {
  const form = v2TournamentForm();
  const out = await api('/api/v2/tournaments/register', {
    method: 'POST',
    body: { tournamentId: form.tournamentId, playerId: form.playerId },
  });
  writePanel(tournamentOutput, out);
  if (out?.tournament) renderTournamentShowcase({ mtt: out.tournament, sng: out.tournament });
}

async function v2StartTournament() {
  const form = v2TournamentForm();
  const out = await api('/api/v2/tournaments/start', {
    method: 'POST',
    body: { tournamentId: form.tournamentId },
  });
  writePanel(tournamentOutput, out);
  if (out?.tournament) renderTournamentShowcase({ mtt: out.tournament, sng: out.tournament });
}

async function v2AdvanceTournamentClock() {
  const form = v2TournamentForm();
  const out = await api('/api/v2/tournaments/clock', {
    method: 'POST',
    body: { tournamentId: form.tournamentId, seconds: form.seconds },
  });
  writePanel(tournamentOutput, out);
  if (out?.tournament) renderTournamentShowcase({ mtt: out.tournament, sng: out.tournament });
}

async function v2RebuyTournament() {
  const form = v2TournamentForm();
  const out = await api('/api/v2/tournaments/rebuy', {
    method: 'POST',
    body: { tournamentId: form.tournamentId, playerId: form.playerId },
  });
  writePanel(tournamentOutput, out);
}

async function v2AddonTournament() {
  const form = v2TournamentForm();
  const out = await api('/api/v2/tournaments/addon', {
    method: 'POST',
    body: { tournamentId: form.tournamentId, playerId: form.playerId },
  });
  writePanel(tournamentOutput, out);
}

async function v2EliminateTournament() {
  const form = v2TournamentForm();
  const out = await api('/api/v2/tournaments/eliminate', {
    method: 'POST',
    body: {
      tournamentId: form.tournamentId,
      playerId: form.playerId,
      finishPosition: form.finishPosition,
    },
  });
  writePanel(tournamentOutput, out);
}

async function v2TournamentState() {
  const form = v2TournamentForm();
  const out = await api(
    `/api/v2/tournaments/state?tournamentId=${encodeURIComponent(form.tournamentId)}`
  );
  writePanel(tournamentOutput, out);
}

async function v2TournamentPayouts() {
  const form = v2TournamentForm();
  const out = await api(
    `/api/v2/tournaments/payouts?tournamentId=${encodeURIComponent(form.tournamentId)}`
  );
  writePanel(tournamentOutput, out);
}

async function createSng() {
  const form = tournamentForm();
  const out = await api('/api/sng/create', {
    method: 'POST',
    body: {
      tournamentId: form.tournamentId,
      maxPlayers: 6,
      buyInUnits: 100,
      startChips: 1500,
    },
  });
  writePanel(tournamentOutput, out);
  renderTournamentShowcase(out);
}

async function registerSng() {
  const form = tournamentForm();
  const out = await api('/api/sng/register', {
    method: 'POST',
    body: {
      tournamentId: form.tournamentId,
      playerId: form.playerId,
    },
  });
  writePanel(tournamentOutput, out);
  renderTournamentShowcase(out);
}

async function advanceSngLevel() {
  const form = tournamentForm();
  const out = await api('/api/sng/advance', {
    method: 'POST',
    body: { tournamentId: form.tournamentId },
  });
  writePanel(tournamentOutput, out);
  renderTournamentShowcase(out);
}

async function eliminateSngPlayer() {
  const form = tournamentForm();
  const out = await api('/api/sng/eliminate', {
    method: 'POST',
    body: {
      tournamentId: form.tournamentId,
      playerId: form.playerId,
      finishPosition: 6,
    },
  });
  writePanel(tournamentOutput, out);
  renderTournamentShowcase(out);
}

async function loadSngPayouts() {
  const form = tournamentForm();
  const out = await api(`/api/sng/payouts?tournamentId=${encodeURIComponent(form.tournamentId)}`);
  writePanel(tournamentOutput, out);
  if (out?.sng) renderTournamentShowcase({ sng: out.sng });
}

async function createMtt() {
  const form = tournamentForm();
  const out = await api('/api/mtt/create', {
    method: 'POST',
    body: {
      tournamentId: form.tournamentId,
      maxPlayers: 60,
      tableMaxSeats: 6,
      buyInUnits: 200,
      lateRegMinutes: 45,
    },
  });
  writePanel(tournamentOutput, out);
  renderTournamentShowcase(out);
}

async function registerMtt() {
  const form = tournamentForm();
  const out = await api('/api/mtt/register', {
    method: 'POST',
    body: {
      tournamentId: form.tournamentId,
      playerId: form.playerId,
    },
  });
  writePanel(tournamentOutput, out);
  renderTournamentShowcase(out);
}

async function startMtt() {
  const form = tournamentForm();
  const out = await api('/api/mtt/start', {
    method: 'POST',
    body: { tournamentId: form.tournamentId },
  });
  writePanel(tournamentOutput, out);
  renderTournamentShowcase(out);
}

async function eliminateMttPlayer() {
  const form = tournamentForm();
  const out = await api('/api/mtt/eliminate', {
    method: 'POST',
    body: {
      tournamentId: form.tournamentId,
      playerId: form.playerId,
      finishPosition: 12,
    },
  });
  writePanel(tournamentOutput, out);
  renderTournamentShowcase(out);
}

async function getMttState() {
  const form = tournamentForm();
  const out = await api(`/api/mtt/state?tournamentId=${encodeURIComponent(form.tournamentId)}`);
  writePanel(tournamentOutput, out);
  renderTournamentShowcase(out);
}

function sponsorshipForm() {
  return {
    positionId: (sponsorshipPositionIdInput?.value || '').trim() || 'pos-1',
    agentId: (sponsorshipAgentIdInput?.value || '').trim() || 'agent-alpha',
    sponsorId: (sponsorshipSponsorIdInput?.value || '').trim() || 'sponsor-1',
    principalUnits: Number(sponsorshipPrincipalInput?.value || 500),
    buyInUnits: Number(sponsorshipBuyinInput?.value || 100),
    prizeUnits: Number(sponsorshipPrizeInput?.value || 250),
  };
}

async function loadSponsorshipHistory(positionId) {
  const history = await api(
    `/api/sponsorships/history?positionId=${encodeURIComponent(positionId)}`
  );
  return history;
}

async function loadCashierEntries(playerId) {
  const out = await api(
    `/api/cashier/entries?ledgerId=default&playerId=${encodeURIComponent(playerId)}&limit=20`
  );
  return out.entries || [];
}

async function writeSponsorshipSnapshot(form, base = {}) {
  const [history, entries] = await Promise.all([
    loadSponsorshipHistory(form.positionId),
    loadCashierEntries(form.sponsorId),
  ]);
  writePanel(sponsorshipOutput, { ...base, history, entries });
  renderEconomyShowcase(history, entries);
}

async function openSponsorship() {
  const form = sponsorshipForm();
  const out = await api('/api/sponsorships/open', {
    method: 'POST',
    body: {
      positionId: form.positionId,
      agentId: form.agentId,
      stakeForSaleBps: 7000,
      markupBps: 11000,
      maxExposureUnits: 1000000,
    },
  });
  await writeSponsorshipSnapshot(form, out);
}

async function fundSponsorship() {
  const form = sponsorshipForm();
  const out = await api('/api/sponsorships/fund', {
    method: 'POST',
    body: {
      positionId: form.positionId,
      sponsorId: form.sponsorId,
      principalUnits: form.principalUnits,
    },
  });
  await writeSponsorshipSnapshot(form, out);
}

async function oneClickFundSponsorship() {
  const form = sponsorshipForm();
  const out = await api('/api/sponsorships/one-click-fund', {
    method: 'POST',
    body: {
      positionId: form.positionId,
      sponsorId: form.sponsorId,
      principalUnits: form.principalUnits,
      playerId: form.sponsorId,
      ledgerId: 'default',
      idempotencyKey: crypto.randomUUID(),
    },
  });
  await writeSponsorshipSnapshot(form, out);
  writePanel(sponsorshipMarketOutput, out);
}

async function closeSponsorship() {
  const form = sponsorshipForm();
  const out = await api('/api/sponsorships/close', {
    method: 'POST',
    body: { positionId: form.positionId },
  });
  await writeSponsorshipSnapshot(form, out);
}

async function settleSponsorship() {
  const form = sponsorshipForm();
  const out = await api('/api/sponsorships/settle', {
    method: 'POST',
    body: {
      positionId: form.positionId,
      eventId: `ev-${Date.now()}`,
      buyInUnits: form.buyInUnits,
      prizeUnits: form.prizeUnits,
      rakeUnits: 5,
    },
  });
  await writeSponsorshipSnapshot(form, out);
}

async function claimSponsorship() {
  const form = sponsorshipForm();
  const out = await api('/api/sponsorships/claim', {
    method: 'POST',
    body: {
      positionId: form.positionId,
      sponsorId: form.sponsorId,
      creditToCashier: true,
      playerId: form.sponsorId,
      ledgerId: 'default',
      idempotencyKey: crypto.randomUUID(),
    },
  });
  await writeSponsorshipSnapshot(form, out);
}

async function viewSponsorship() {
  const form = sponsorshipForm();
  const out = await api(`/api/sponsorships/view?positionId=${encodeURIComponent(form.positionId)}`);
  await writeSponsorshipSnapshot(form, out);
}

async function loadSponsorshipMarketplace() {
  const out = await api('/api/sponsorships/marketplace?limit=50');
  writePanel(sponsorshipMarketOutput, out);
}

async function loadSponsorAnalytics() {
  const form = sponsorshipForm();
  const out = await api(
    `/api/sponsorships/sponsor-analytics?sponsorId=${encodeURIComponent(form.sponsorId)}`
  );
  writePanel(sponsorshipMarketOutput, out);
}

function paymentForm() {
  state.apiToken = (payApiTokenInput?.value || '').trim();
  persistClientPrefs();
  return {
    playerId: (payPlayerIdInput?.value || '').trim() || 'player-ops-1',
    provider: (payProviderSelect?.value || 'stripe').trim(),
    fiatAmountMinor: Math.max(1, Number(payFiatMinorInput?.value || 4999)),
    tokenUnits: Math.max(1, Number(payTokenUnitsInput?.value || 2500)),
    countryCode: (payCountryInput?.value || 'US').trim().toUpperCase(),
    kycStatus: (payKycSelect?.value || 'approved').trim(),
    amlRiskLevel: (payRiskLevelSelect?.value || 'low').trim(),
  };
}

async function upsertComplianceProfile() {
  const form = paymentForm();
  const out = await api('/api/compliance/upsert', {
    method: 'POST',
    body: {
      playerId: form.playerId,
      kycStatus: form.kycStatus,
      countryCode: form.countryCode,
      amlRiskLevel: form.amlRiskLevel,
    },
  });
  writePanel(payOutput, out);
}

async function createPaymentIntent() {
  const form = paymentForm();
  const orderId = `ord-${Date.now()}`;
  const out = await api('/api/payments/intent', {
    method: 'POST',
    body: {
      provider: form.provider,
      playerId: form.playerId,
      orderId,
      fiatCurrency: 'USD',
      fiatAmountMinor: form.fiatAmountMinor,
      tokenUnits: form.tokenUnits,
      ledgerId: 'default',
    },
  });
  state.lastPaymentOrderId = orderId;
  writePanel(payOutput, out);
}

async function loadLastPaymentOrder() {
  const orderId = String(state.lastPaymentOrderId || '').trim();
  if (!orderId) {
    writePanel(payOutput, { ok: false, error: 'No local orderId yet. Create an intent first.' });
    return;
  }
  const out = await api(`/api/payments/order?orderId=${encodeURIComponent(orderId)}`);
  writePanel(payOutput, out);
}

async function loadRiskAlerts() {
  const out = await api('/api/risk/alerts?limit=50');
  writePanel(payOutput, out);
}

async function runAgentAutoplay() {
  const form = currentAgentForm();
  const decisionOut = await api('/api/strategy/decide', {
    method: 'POST',
    body: {
      agentId: form.agentId,
      temperament: form.style === 'exploitative' ? 'loose_aggressive' : form.style,
      bankrollUnits: Math.max(0, Number(state.session?.bankroll || 0)),
      legalActions: ['fold', 'check', 'call', 'raise'],
      handStrength: 0.61,
      potUnits: 100,
      toCallUnits: 15,
    },
  });

  if (!decisionOut.executable) {
    writeAgentConsole({
      ok: false,
      message: 'Policy denied autoplay action.',
      policy: decisionOut.policy,
      decision: decisionOut.decision,
    });
    return;
  }

  const action = decisionOut.decision?.action;
  if (action === 'fold' || action === 'check') {
    writeAgentConsole({
      ok: true,
      message: `Agent action ${action} does not trigger a bet round in current client autoplay.`,
      decision: decisionOut.decision,
      policy: decisionOut.policy,
    });
    return;
  }

  const bankroll = Math.max(0, Number(state.session?.bankroll || 0));
  const proposed = Math.max(1, Number(decisionOut.decision?.amountUnits || 1));
  const bet = Math.max(1, Math.min(bankroll, proposed));

  const played = await api('/api/play', {
    method: 'POST',
    body: {
      sessionId: state.sessionId,
      game: 'poker',
      bet,
      options: {},
    },
  });

  state.session = played.session;
  renderShowcase(played.round);
  fairnessReceiptEl.textContent = JSON.stringify(played.round.receipt, null, 2);
  await refreshLedger();

  writeAgentConsole({
    ok: true,
    message: 'Autoplay round executed.',
    bet,
    decision: decisionOut.decision,
    policy: decisionOut.policy,
    round: {
      payout: played.round.payout,
      delta: played.round.delta,
      win: played.round.win,
      detail: played.round.detail,
    },
  });
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
      void refreshLiveHand();
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
  loadNurtureOpsPrefs();

  const forcedMode = modeFromHost();
  if (forcedMode) {
    gameSelect.value = forcedMode;
    gameSelect.disabled = true;
  }

  renderControls(gameSelect.value);
  gameTitle.textContent = gameSelect.options[gameSelect.selectedIndex].text;
  result.textContent = 'Connecting session...';
  fairnessReceiptEl.textContent = 'No round receipt yet.';
  renderShowcase(null);
  renderNurtureCard(null);

  await loadChainConfig();
  await ensureSession();
  await refreshLedger();
  await refreshTableEvents();
  await refreshLiveHand();
  await restartTableStream();
  updateHud();
  updateCompareStatus();

  result.textContent = 'Connected. Place your bet and play a round.';
}

function errText(prefix, err) {
  return `${prefix}: ${err instanceof Error ? err.message : String(err)}`;
}

function bindClick(el, action, onError) {
  if (!el) return;
  el?.addEventListener('click', async () => {
    if (el.dataset.busy === '1') return;
    el.dataset.busy = '1';
    try {
      await action();
    } catch (err) {
      onError(err);
    } finally {
      delete el.dataset.busy;
    }
  });
}

bindClick(
  playButton,
  async () => {
    await playRound();
    playTone(640, 90);
  },
  (err) => {
    result.textContent = errText('Round failed', err);
    playTone(220, 100);
  }
);

bindClick(resetBankrollButton, resetBankroll, (err) => {
  result.textContent = errText('Reset failed', err);
});
bindClick(savePlayerButton, syncProfile, (err) => {
  result.textContent = errText('Profile save failed', err);
});
bindClick(
  rollClientSeedButton,
  async () => {
    if (!clientSeedInput.value.trim()) {
      clientSeedInput.value = crypto.randomUUID().replace(/-/g, '').slice(0, 32);
    }
    await rotateClientSeed();
  },
  (err) => {
    result.textContent = errText('Client-seed update failed', err);
  }
);
bindClick(joinTableButton, syncProfile, (err) => {
  result.textContent = errText('Join table failed', err);
});
bindClick(
  connectWalletButton,
  async () => {
    await ensureWalletConnected();
    result.textContent = `Wallet connected: ${shortAddr(state.walletAccount)}`;
  },
  (err) => {
    result.textContent = errText('Wallet connect failed', err);
  }
);

const writeResultError = (label) => (err) => {
  result.textContent = errText(label, err);
};
const writeAgentError = (label) => (err) => {
  writeAgentConsole(errText(label, err));
};
const writePanelError = (pre, label) => (err) => {
  writePanel(pre, errText(label, err));
};

const paymentBindings = [
  [payUpsertComplianceButton, upsertComplianceProfile, 'Compliance upsert failed'],
  [payCreateIntentButton, createPaymentIntent, 'Payment intent failed'],
  [payLoadOrderButton, loadLastPaymentOrder, 'Load order failed'],
  [payRiskAlertsButton, loadRiskAlerts, 'Risk alerts failed'],
];
for (const [button, action, label] of paymentBindings) {
  bindClick(button, action, writePanelError(payOutput, label));
}

const agentBindings = [
  [agentRegisterButton, runAgentRegister, 'Agent register failed'],
  [
    agentCraftTexasSolverButton,
    runAgentCraftTexasSolverTraits,
    'TexasSolver trait crafting failed',
  ],
  [traitDashboardButton, runTraitDashboard, 'Trait dashboard failed'],
  [traitFreezeApplyButton, runTraitFreezePolicy, 'Trait freeze update failed'],
  [traitRolloutStateButton, runTraitRolloutState, 'Trait rollout fetch failed'],
  [traitRevokeArtifactButton, runTraitRevokeArtifact, 'Artifact revoke failed'],
  [nurtureInitButton, runNurtureInit, 'Nurture init failed'],
  [nurtureEpisodeButton, runNurtureEpisode, 'Nurture episode failed'],
  [nurtureBatch10Button, runNurtureBatch10, 'Nurture batch logging failed'],
  [nurtureEvaluateButton, runNurtureEvaluate, 'Nurture evaluate failed'],
  [nurtureStateButton, runNurtureState, 'Nurture state failed'],
  [nurtureExportButton, runNurtureExport, 'Nurture export failed'],
  [nurtureCompareButton, runNurtureCompare, 'Nurture compare failed'],
  [nurtureAutoToggleButton, toggleNurtureAutoRefresh, 'Nurture auto-refresh failed'],
  [nurturePresetApplyButton, async () => applyNurturePreset(), 'Nurture preset apply failed'],
  [nurtureMacroRunButton, runNurtureMacro, 'Nurture macro failed'],
  [
    nurtureBaselineSetButton,
    async () => setNurtureBaselineFromCurrentCompare(),
    'Baseline set failed',
  ],
  [nurtureBaselineClearButton, async () => clearNurtureBaseline(), 'Baseline clear failed'],
  [
    nurtureCompareExportJsonButton,
    async () => exportNurtureCompareJson(),
    'Compare JSON export failed',
  ],
  [
    nurtureCompareExportCsvButton,
    async () => exportNurtureCompareCsv(),
    'Compare CSV export failed',
  ],
  [agentConsoleClearButton, async () => clearAgentConsole(), 'Console clear failed'],
  [strategyProfileButton, runStrategyProfile, 'Strategy profile failed'],
  [strategyDecideButton, runStrategyDecision, 'Strategy decision failed'],
  [simEquityButton, runEquitySim, 'Equity sim failed'],
  [swarmStatusButton, runSwarmStatus, 'Swarm status failed'],
  [agentAutoplayButton, runAgentAutoplay, 'Agent autoplay failed'],
];
for (const [button, action, label] of agentBindings) {
  bindClick(button, action, writeAgentError(label));
}

nurtureCompareSortSelect?.addEventListener('change', () => {
  persistNurtureOpsPrefs();
  renderNurtureCompareGrid(
    filteredSortedCompareRows(state.nurtureCompareRows || []),
    currentAgentForm().agentId
  );
});
nurtureCompareStageFilterSelect?.addEventListener('change', () => {
  persistNurtureOpsPrefs();
  renderNurtureCompareGrid(
    filteredSortedCompareRows(state.nurtureCompareRows || []),
    currentAgentForm().agentId
  );
});
nurtureCompareMinEpisodesInput?.addEventListener('change', () => {
  persistNurtureOpsPrefs();
  renderNurtureCompareGrid(
    filteredSortedCompareRows(state.nurtureCompareRows || []),
    currentAgentForm().agentId
  );
});
nurtureRefreshSecInput?.addEventListener('change', persistNurtureOpsPrefs);
nurtureCompareIdsInput?.addEventListener('change', persistNurtureOpsPrefs);
nurturePresetSelect?.addEventListener('change', persistNurtureOpsPrefs);
nurtureMacroEpisodesInput?.addEventListener('change', persistNurtureOpsPrefs);
updateCompareStatus();

const tableBindings = [
  [tableInitButton, initTableState, 'Table init failed'],
  [tableActionButton, applyTableAction, 'Table action failed'],
  [tableSettleButton, settleTableHand, 'Table settle failed'],
  [tableAutoRoundButton, autoTableRound, 'Table auto-round failed'],
  [tableRefreshStateButton, refreshTableState, 'Table refresh failed'],
  [v2TableCreateButton, v2CreateTable, 'V2 create table failed'],
  [v2TableSeatButton, v2SeatPlayer, 'V2 seat failed'],
  [v2HandStartButton, v2StartHand, 'V2 start hand failed'],
  [v2ActionButton, v2SendAction, 'V2 action failed'],
  [v2SettleButton, v2SettleHand, 'V2 settle failed'],
  [v2ReplayButton, v2Replay, 'V2 replay failed'],
  [v2StateButton, v2State, 'V2 state failed'],
];
for (const [button, action, label] of tableBindings) {
  bindClick(button, action, writePanelError(tableStateOutput, label));
}

const liveBindings = [
  [liveNewHandButton, startLiveHand, 'Start hand failed'],
  [liveRefreshButton, refreshLiveHand, 'Refresh hand failed'],
  [liveActionFoldButton, () => livePlayerAction('fold'), 'Fold failed'],
  [liveActionCheckButton, () => livePlayerAction('check'), 'Check failed'],
  [liveActionCallButton, () => livePlayerAction('call'), 'Call failed'],
  [liveActionRaiseButton, () => livePlayerAction('raise'), 'Raise failed'],
  [liveAutoRoundButton, liveAutoPlayHand, 'Auto hand failed'],
];
for (const [button, action, label] of liveBindings) {
  bindClick(button, action, writeResultError(label));
}

const tournamentBindings = [
  [sngCreateButton, createSng, 'SNG create failed'],
  [sngRegisterButton, registerSng, 'SNG register failed'],
  [sngStartLevelButton, advanceSngLevel, 'SNG advance failed'],
  [sngEliminateButton, eliminateSngPlayer, 'SNG eliminate failed'],
  [sngPayoutsButton, loadSngPayouts, 'SNG payouts failed'],
  [mttCreateButton, createMtt, 'MTT create failed'],
  [mttRegisterButton, registerMtt, 'MTT register failed'],
  [mttStartButton, startMtt, 'MTT start failed'],
  [mttEliminateButton, eliminateMttPlayer, 'MTT eliminate failed'],
  [mttStateButton, getMttState, 'MTT state failed'],
  [v2TourCreateButton, v2CreateTournament, 'V2 tournament create failed'],
  [v2TourRegisterButton, v2RegisterTournament, 'V2 tournament register failed'],
  [v2TourStartButton, v2StartTournament, 'V2 tournament start failed'],
  [v2TourClockButton, v2AdvanceTournamentClock, 'V2 tournament clock failed'],
  [v2TourRebuyButton, v2RebuyTournament, 'V2 tournament rebuy failed'],
  [v2TourAddonButton, v2AddonTournament, 'V2 tournament add-on failed'],
  [v2TourEliminateButton, v2EliminateTournament, 'V2 tournament eliminate failed'],
  [v2TourStateButton, v2TournamentState, 'V2 tournament state failed'],
  [v2TourPayoutsButton, v2TournamentPayouts, 'V2 tournament payouts failed'],
];
for (const [button, action, label] of tournamentBindings) {
  bindClick(button, action, writePanelError(tournamentOutput, label));
}

const sponsorshipBindings = [
  [sponsorshipOpenButton, openSponsorship, 'Open failed'],
  [sponsorshipFundButton, fundSponsorship, 'Fund failed'],
  [sponsorshipOneClickFundButton, oneClickFundSponsorship, 'One-click fund failed'],
  [sponsorshipCloseButton, closeSponsorship, 'Close failed'],
  [sponsorshipSettleButton, settleSponsorship, 'Settle failed'],
  [sponsorshipClaimButton, claimSponsorship, 'Claim failed'],
  [sponsorshipViewButton, viewSponsorship, 'View failed'],
  [sponsorshipMarketplaceButton, loadSponsorshipMarketplace, 'Marketplace load failed'],
  [sponsorshipAnalyticsButton, loadSponsorAnalytics, 'Analytics load failed'],
];
for (const [button, action, label] of sponsorshipBindings) {
  bindClick(button, action, writePanelError(sponsorshipMarketOutput || sponsorshipOutput, label));
}

gameSelect.addEventListener('change', () => {
  gameTitle.textContent = gameSelect.options[gameSelect.selectedIndex].text;
  renderControls(gameSelect.value);
});

if (payApiTokenInput) {
  payApiTokenInput.addEventListener('change', () => {
    state.apiToken = (payApiTokenInput.value || '').trim();
    persistClientPrefs();
  });
}

bootstrap().catch((err) => {
  result.textContent = `Startup failed: ${err instanceof Error ? err.message : String(err)}`;
});

window.addEventListener('beforeunload', () => {
  stopNurtureAutoRefresh();
});
