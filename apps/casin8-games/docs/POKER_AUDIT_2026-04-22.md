Audit result for /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/casin8-games/core-logic/holdem-engine/index.mjs:
import { assertInteger, assertString } from '../../shared/contracts.mjs';
import { createHash } from 'node:crypto';

const STREETS = ['preflop', 'flop', 'turn', 'river'];
const MAX_IDEMPOTENCY_CACHE = 5000;
const CARD_SUITS = ['s', 'h', 'd', 'c'];
const CARD_RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map((x) => stableValue(x));
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      out[key] = stableValue(value[key]);
    }
    return out;
  }
  return value;
}

function stableStringify(value) {
  return JSON.stringify(stableValue(value));
}

function hashHex(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

function createRng(seed) {
  let counter = 0;
  return function rand(max) {
    const hex = hashHex(`${seed}:${counter}`);
    counter += 1;
    const int = Number.parseInt(hex.slice(0, 8), 16);
    if (max != null && Number.isInteger(max) && max > 0) {
      // Rejection sampling to eliminate modulo bias.
      // Without this, Math.floor(rng() * max) with a 32-bit RNG introduces
      // bias: when 2^32 is not evenly divisible by `max`, some indices are
      // more likely. For a 52-card deck, the bias is ~1.2% per draw — small
      // but detectable and exploitable over many hands.
      const limit = 0x100000000 - (0x100000000 % max);
      if (int < limit) return int % max;
      // Rejection: draw again (extremely rare, ~1.2% chance for max=52)
      return rand(max);
    }
    return int / 0x100000000;
  };
}

function buildDeck() {
 const deck = [];
 for (const suit of CARD_SUITS) {
 for (const rank of CARD_RANKS) {
 deck.push(`${rank}${suit}`);
 }
 }
 // Deck integrity check — must have exactly 52 unique cards.
 // Catches accidental duplicate constants or array mutation.
 if (deck.length !== 52 || new Set(deck).size !== 52) {
 throw new Error(`Deck integrity violation: ${deck.length} cards, ${new Set(deck).size} unique`);
 }
 return deck;
}

function drawCards(rng, deck, count) {
  const cards = [];
  for (let i = 0; i < count; i += 1) {
    const idx = rng(deck.length); // bias-free integer selection via rejection sampling
    cards.push(deck.splice(idx, 1)[0]);
  }
  return cards;
}

function dealHoldemCards(engine, hand, seated) {
 const rng = createRng(`${engine.replaySeed}:${hand.handId}`);
 const deck = buildDeck();
 const holeCards = {};
 for (const seat of seated) {
 holeCards[String(seat.seat)] = drawCards(rng, deck, 2);
 }
 hand.holeCards = holeCards;
 // Burn cards: 1 before flop, 1 before turn, 1 before river (TDA standard)
 // Draw burn + board cards in proper order to ensure correct card sequence
 const burnCards = [];
 // Pre-flop burn (1 card discarded before flop)
 burnCards.push(...drawCards(rng, deck, 1));
 const flopCards = drawCards(rng, deck, 3);
 // Pre-turn burn
 burnCards.push(...drawCards(rng, deck, 1));
 const turnCard = drawCards(rng, deck, 1);
 // Pre-river burn
 burnCards.push(...drawCards(rng, deck, 1));
 const riverCard = drawCards(rng, deck, 1);

 hand.boardCards = [...flopCards, ...turnCard, ...riverCard];
 hand.burnCards = burnCards;
 hand.deckHash = hashHex(deck.join(','));
}

function asInt(value, field, min = 0) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min) {
    throw new Error(`Invalid ${field}`);
  }
  return n;
}

function nowIso() {
  return new Date().toISOString();
}

function eventKey(method, idempotencyKey) {
  return `${method}:${idempotencyKey}`;
}

function trimMap(map, limit = MAX_IDEMPOTENCY_CACHE) {
  while (map.size > limit) {
    const first = map.keys().next().value;
    map.delete(first);
  }
}

function playerRank(rankingBySeat, seat) {
  const value = rankingBySeat[String(seat)] ?? rankingBySeat[seat];
  if (value == null) return -1;
  if (Array.isArray(value)) {
    if (value.length === 0) return -1;
    return Number(value[0]);
  }
  return Number(value);
}

function compareRank(a, b) {
  if (a > b) return 1;
  if (a < b) return -1;
  return 0;
}

function sortedSeats(engine) {
  return engine.seats
    .filter(Boolean)
    .map((s) => ({ ...s }))
    .sort((a, b) => a.seat - b.seat);
}

function activeSeats(engine, hand) {
  return sortedSeats(engine).filter((s) => {
    if (hand.foldedSeats.includes(s.seat)) return false;
    return s.stack > 0 || Number(hand.committedBySeat[String(s.seat)] || 0) > 0;
  });
}

function liveSeats(engine, hand) {
  return activeSeats(engine, hand).filter((s) => !hand.allInSeats.includes(s.seat));
}

function nextSeatFrom(engine, startSeat, hand, { includeFolded = false } = {}) {
  const seats = sortedSeats(engine);
  if (seats.length === 0) return null;
  const maxIterations = seats.length;
  let cursor = startSeat;
  for (let i = 0; i < maxIterations; i += 1) {
    const next = seats.find((s) => s.seat > cursor) || seats[0];
    cursor = next.seat;
    if (!includeFolded && hand && hand.foldedSeats.includes(next.seat)) continue;
    if (hand && hand.allInSeats.includes(next.seat)) continue;
    if (next.stack <= 0 && Number(hand?.committedBySeat[String(next.seat)] || 0) === 0) continue;
    return next.seat;
  }
  return null;
}

function firstSeat(engine) {
  const seats = sortedSeats(engine);
  return seats.length > 0 ? seats[0].seat : null;
}

function seatForPlayer(engine, playerId) {
  const seat = engine.seats.find((s) => s && s.playerId === playerId);
  if (!seat) throw new Error('Unknown playerId');
  return seat;
}

function appendEvent(engine, type, payload) {
  engine.seq += 1;
  const prevHash = String(engine.audit?.lastEventHash || 'genesis');
  const event = {
    seq: engine.seq,
    ts: nowIso(),
    type,
    payload: cloneJson(payload),
    prevHash,
  };
  event.hash = hashHex(`${event.seq}|${event.type}|${stableStringify(event.payload)}|${event.prevHash}`);
  if (!engine.audit || typeof engine.audit !== 'object') {
    engine.audit = { lastEventHash: event.hash };
  } else {
    engine.audit.lastEventHash = event.hash;
  }
  engine.events.push(event);
  if (engine.events.length > 5000) {
    engine.events = engine.events.slice(-5000);
  }
  return event;
}

function queueSeatMove(engine, fromSeat, toSeat, reason) {
  if (!Array.isArray(engine.pendingSeatMoves)) engine.pendingSeatMoves = [];
  engine.pendingSeatMoves.push({
    fromSeat,
    toSeat,
    reason: String(reason || 'seat_change'),
    requestedAt: nowIso(),
  });
}

function applyPendingSeatMoves(engine) {
  if (!Array.isArray(engine.pendingSeatMoves) || engine.pendingSeatMoves.length === 0) return;
  const next = [];
  for (const move of engine.pendingSeatMoves) {
    const fromSeat = Number(move.fromSeat);
    const toSeat = Number(move.toSeat);
    const fromRow = engine.seats[fromSeat];
    if (!fromRow) continue;
    if (engine.seats[toSeat]) {
      next.push(move);
      continue;
    }
    engine.seats[toSeat] = { ...fromRow, seat: toSeat };
    engine.seats[fromSeat] = null;
    appendEvent(engine, 'player.seat_changed', {
      playerId: fromRow.playerId,
      fromSeat,
      toSeat,
      reason: move.reason,
      requestedAt: move.requestedAt,
      appliedAt: nowIso(),
    });
  }
  engine.pendingSeatMoves = next;
}

function pushHandAudit(hand, tag, payload) {
  const prev = String(hand.auditHash || `${hand.replayHash}:genesis`);
  const hash = hashHex(`${prev}|${tag}|${stableStringify(payload)}`);
  if (!Array.isArray(hand.auditTrail)) hand.auditTrail = [];
  hand.auditTrail.push({
    index: hand.auditTrail.length + 1,
    tag,
    prevHash: prev,
    hash,
  });
  hand.auditHash = hash;
  return hash;
}

function postForced(engine, hand, seat, amount, kind, live = false) {
  const pay = Math.max(0, Math.min(seat.stack, amount));
  if (pay <= 0) return 0;
  seat.stack -= pay;
  hand.pot += pay;
  hand.committedBySeat[String(seat.seat)] = Number(hand.committedBySeat[String(seat.seat)] || 0) + pay;
  if (live) {
    hand.streetCommitted[String(seat.seat)] = Number(hand.streetCommitted[String(seat.seat)] || 0) + pay;
    hand.currentBet = Math.max(hand.currentBet, hand.streetCommitted[String(seat.seat)]);
  }
  hand.forcedPosts.push({ seat: seat.seat, kind, amount: pay, live });
  if (seat.stack === 0 && !hand.allInSeats.includes(seat.seat)) {
    hand.allInSeats.push(seat.seat);
  }
  return pay;
}

function resetStreet(engine, hand, nextStreet) {
 hand.street = nextStreet;
 hand.streetCommitted = {};
 hand.currentBet = 0;
 hand.actedSinceAggression = [];
 hand.lastAggressorSeat = null;
 // TDA Rule 43: On each new street, the minimum opening bet is the big blind.
 // Previously, hand.minRaise was NOT reset on street transition, carrying over
 // the previous street's value (e.g., after a 500 bet on the flop, minRaise=500
 // would persist to the turn). This caused the minimum bet/raise on the new
 // street to be incorrectly large. Per TDA rules, the minimum raise size resets
 // to the big blind at the start of each new betting round.
 hand.minRaise = engine.blinds.bigBlind;
 hand.lastAggressiveDelta = engine.blinds.bigBlind;

  const button = hand.buttonSeat;
  const seat = nextSeatFrom(engine, button, hand);
  hand.actingSeat = seat;
}

function isBettingRoundComplete(engine, hand) {
  const live = liveSeats(engine, hand);
  if (live.length <= 1) return true;

  const acted = new Set(hand.actedSinceAggression);
  for (const seat of live) {
    const seatNo = seat.seat;
    const committed = Number(hand.streetCommitted[String(seatNo)] || 0);
    if (committed < hand.currentBet) return false;
    if (!acted.has(seatNo)) return false;
  }
  return true;
}

function maybeAdvanceStreet(engine, hand) {
  if (!isBettingRoundComplete(engine, hand)) {
    hand.actingSeat = nextSeatFrom(engine, hand.actingSeat, hand);
    return;
  }

  const alive = activeSeats(engine, hand);
  if (alive.length <= 1) {
    hand.street = 'showdown';
    hand.actingSeat = null;
    hand.readyForSettlement = true;
    return;
  }

  const idx = STREETS.indexOf(hand.street);
  if (idx < 0 || idx === STREETS.length - 1) {
    hand.street = 'showdown';
    hand.actingSeat = null;
    hand.readyForSettlement = true;
    return;
  }

  resetStreet(engine, hand, STREETS[idx + 1]);
}

function buildActionResult(engine, hand, actionRow) {
  return {
    ok: true,
    handId: hand.handId,
    street: hand.street,
    actingSeat: hand.actingSeat,
    pot: hand.pot,
    currentBet: hand.currentBet,
    action: actionRow,
    legalActions: hand.actingSeat != null ? legalActionsForSeat(engine, hand, hand.actingSeat) : [],
  };
}

export function createHoldemTable(options = {}) {
  const tableId = String(options.tableId || '').trim();
  assertString(tableId, 'tableId');
  const maxSeats = asInt(options.maxSeats ?? 9, 'maxSeats', 2);
  const smallBlind = asInt(options.smallBlind ?? 50, 'smallBlind', 1);
  const bigBlind = asInt(options.bigBlind ?? 100, 'bigBlind', 1);
  if (bigBlind < smallBlind) throw new Error('bigBlind must be >= smallBlind');

  return {
    version: 2,
    tableId,
    mode: String(options.mode || 'cash').trim() || 'cash',
    maxSeats,
    seats: Array.from({ length: maxSeats }, (_, i) => null),
    blinds: {
      smallBlind,
      bigBlind,
      ante: asInt(options.ante ?? 0, 'ante', 0),
    },
    buttonSeat: options.buttonSeat == null ? 0 : asInt(options.buttonSeat, 'buttonSeat', 0),
    replaySeed: String(options.replaySeed || `${tableId}-seed`),
    riskCapsBySeat: {},
    hand: null,
    pendingSeatMoves: [],
    seq: 0,
    events: [],
    audit: {
      lastEventHash: 'genesis',
    },
    idempotency: {
      actions: new Map(),
      settlements: new Map(),
      handStarts: new Map(),
    },
  };
}

export function seatPlayer(engine, { playerId, seat, stack, autoPostBlinds = true, controlMode }) {
 assertString(playerId, 'playerId');
 const seatNo = asInt(seat, 'seat', 0);
 const stackUnits = asInt(stack, 'stack', 1);
 if (seatNo >= engine.seats.length) throw new Error('Seat out of range');
 if (engine.seats[seatNo]) throw new Error('Seat occupied');
 // NF1 fix: Prevent duplicate playerId — same player cannot occupy multiple seats.
 // Without this check, a player could sit at seat 0 AND seat 3 simultaneously,
 // creating a "ghost" duplicate that corrupts committedBySeat, actedSinceAggression,
 // computeSidePots, and pot distribution. seatForPlayer() uses .find() which returns
 // only the first match, so the second seat becomes a phantom.
 const existing = engine.seats.find((s) => s && s.playerId === playerId);
 if (existing) throw new Error('Player already seated');

  const hasPlayed = engine.events.some((e) => e.type === 'player.seated' && e.payload.playerId === playerId);
  const mode = String(controlMode || '').trim().toLowerCase();
  const normalizedMode = ['human', 'hybrid', 'agent'].includes(mode) ? mode : 'human';
  const row = {
    seat: seatNo,
    playerId,
    stack: stackUnits,
    joinedAt: nowIso(),
    waitingForBigBlind: hasPlayed,
    waitingForSmallBlind: false,
    deadBlindDue: hasPlayed ? engine.blinds.bigBlind : 0,
    autoPostBlinds,
    connected: true,
    straddleRequested: 0,
    controlMode: normalizedMode,
  };
  engine.seats[seatNo] = row;
  appendEvent(engine, 'player.seated', row);
  return cloneJson(row);
}

export function unseatPlayer(engine, { playerId }) {
  const row = seatForPlayer(engine, playerId);
  engine.seats[row.seat] = null;
  appendEvent(engine, 'player.unseated', { playerId, seat: row.seat });
}

export function requestSeatChange(engine, { playerId, toSeat, reason = 'requested' }) {
  const row = seatForPlayer(engine, playerId);
  const toSeatNo = asInt(toSeat, 'toSeat', 0);
  if (toSeatNo >= engine.seats.length) throw new Error('Seat out of range');
  if (engine.seats[toSeatNo]) throw new Error('Target seat occupied');
  if (row.seat === toSeatNo) return { queued: false, seat: row.seat };

  if (engine.hand && !engine.hand.settled) {
    queueSeatMove(engine, row.seat, toSeatNo, reason);
    appendEvent(engine, 'player.seat_change_queued', {
      playerId,
      fromSeat: row.seat,
      toSeat: toSeatNo,
      reason,
      handId: engine.hand.handId,
    });
    return { queued: true, fromSeat: row.seat, toSeat: toSeatNo, handId: engine.hand.handId };
  }

  engine.seats[toSeatNo] = { ...row, seat: toSeatNo };
  engine.seats[row.seat] = null;
  appendEvent(engine, 'player.seat_changed', {
    playerId,
    fromSeat: row.seat,
    toSeat: toSeatNo,
    reason,
  });
  return { queued: false, fromSeat: row.seat, toSeat: toSeatNo };
}

export function setConnection(engine, { playerId, connected }) {
  const row = seatForPlayer(engine, playerId);
  row.connected = Boolean(connected);
  appendEvent(engine, row.connected ? 'player.reconnected' : 'player.disconnected', {
    playerId,
    seat: row.seat,
  });

  // When disconnecting, do NOT auto-fold here.
  // The calling code (server grace period) is responsible for deciding
  // when to fold or remove the player. Auto-folding here defeats
  // disconnect grace periods. Instead, just mark disconnected so
  // legalActionsForSeat returns [] for the disconnected player,
  // effectively making them sit out until reconnected or removed.
  return cloneJson(row);
}

/**
 * Force-fold a disconnected player who has exceeded the grace period.
 * This is the explicit alternative to auto-folding in setConnection.
 * The server should call this after the grace period expires before unseating.
 */
export function forceFoldDisconnected(engine, { playerId }) {
  const row = seatForPlayer(engine, playerId);
  if (row.connected) return null; // Player reconnected, no fold needed

  const hand = engine.hand;
  if (!hand || hand.settled) return null; // No active hand
  if (hand.foldedSeats.includes(row.seat)) return null; // Already folded

 if (!hand.foldedSeats.includes(row.seat)) hand.foldedSeats.push(row.seat);
 hand.actedSinceAggression = hand.actedSinceAggression.filter((s) => s !== row.seat);
 const alive = activeSeats(engine, hand);
 if (alive.length <= 1) {
 hand.street = 'showdown';
 hand.actingSeat = null;
 hand.readyForSettlement = true;
 } else if (hand.actingSeat === row.seat) {
 maybeAdvanceStreet(engine, hand);
 } else if (isBettingRoundComplete(engine, hand)) {
 // The fold of a non-acting player may have completed the betting round
 // (e.g., the folded player was the only one who hadn't yet acted).
 // If so, advance the street. Without this check, the game stalls because
 // the current actor already acted and no one else needs to act.
 maybeAdvanceStreet(engine, hand);
 }

  appendEvent(engine, 'hand.action', {
    handId: hand.handId,
    idempotencyKey: `disconnect-fold:${playerId}:${engine.seq + 1}`,
    row: {
      seat: row.seat,
      playerId,
      action: 'fold',
      amount: 0,
      spend: 0,
      target: Number(hand.streetCommitted[String(row.seat)] || 0),
      toCallBefore: Math.max(0, Number(hand.currentBet || 0) - Number(hand.streetCommitted[String(row.seat)] || 0)),
      potAfter: hand.pot,
      currentBetAfter: hand.currentBet,
      disconnectForced: true,
    },
    street: hand.street,
    actingSeat: hand.actingSeat,
    readyForSettlement: hand.readyForSettlement,
  });

  return { folded: true, seat: row.seat };
}

export function requestStraddle(engine, { playerId, amount = null }) {
  if (engine.mode !== 'cash') {
    throw new Error('Straddle is only allowed in cash mode');
  }
  const row = seatForPlayer(engine, playerId);
  const value = amount == null ? engine.blinds.bigBlind * 2 : asInt(amount, 'amount', 1);
  row.straddleRequested = value;
  appendEvent(engine, 'blind.straddle_requested', {
    playerId,
    seat: row.seat,
    amount: value,
  });
  return value;
}

export function configureRiskCap(engine, { playerId, maxCommitPerHand }) {
  const row = seatForPlayer(engine, playerId);
  const cap = asInt(maxCommitPerHand, 'maxCommitPerHand', 1);
  engine.riskCapsBySeat[String(row.seat)] = cap;
  appendEvent(engine, 'risk.cap', { playerId, seat: row.seat, maxCommitPerHand: cap });
  return cap;
}

export function markMissedBlind(engine, { playerId, smallBlind = false, bigBlind = true }) {
  const row = seatForPlayer(engine, playerId);
  row.waitingForSmallBlind = Boolean(smallBlind);
  row.waitingForBigBlind = Boolean(bigBlind);
  row.deadBlindDue = bigBlind ? engine.blinds.bigBlind : (smallBlind ? engine.blinds.smallBlind : 0);
  appendEvent(engine, 'blind.missed', {
    playerId,
    seat: row.seat,
    waitingForSmallBlind: row.waitingForSmallBlind,
    waitingForBigBlind: row.waitingForBigBlind,
    deadBlindDue: row.deadBlindDue,
  });
}

export function legalActionsForSeat(engine, hand, seatNo) {
  const seat = engine.seats[seatNo];
  if (!seat) return [];
  if (seat.connected === false) return [];
  if (hand.actingSeat !== seatNo) return [];
  if (hand.foldedSeats.includes(seatNo)) return [];
  if (hand.allInSeats.includes(seatNo)) return [];

  const streetCommit = Number(hand.streetCommitted[String(seatNo)] || 0);
  const toCall = Math.max(0, hand.currentBet - streetCommit);
  const stack = seat.stack;
  const legal = [];

  if (toCall > 0) {
    legal.push({ action: 'fold' });
    if (stack > 0) {
      legal.push({ action: 'call', min: Math.min(stack, toCall), max: Math.min(stack, toCall) });
      if (stack > toCall) {
        const minTotal = hand.currentBet + hand.lastAggressiveDelta;
        const maxTotal = streetCommit + stack;
        legal.push({ action: 'raise', min: Math.min(maxTotal, minTotal), max: maxTotal });
      }
      legal.push({ action: 'allin', min: stack, max: stack });
    }
  } else {
    legal.push({ action: 'check' });
    if (stack > 0) {
      const minTotal = Math.max(hand.minRaise, engine.blinds.bigBlind);
      const maxTotal = streetCommit + stack;
      legal.push({ action: 'bet', min: Math.min(maxTotal, minTotal), max: maxTotal });
      legal.push({ action: 'allin', min: stack, max: stack });
    }
  }

  return legal;
}

export function agentState(engine, { seat }) {
  const seatNo = asInt(seat, 'seat', 0);
  const hand = engine.hand;
  if (!hand) throw new Error('No active hand');

  const streetCommit = Number(hand.streetCommitted[String(seatNo)] || 0);
  const toCall = Math.max(0, hand.currentBet - streetCommit);
  const pot = hand.pot;
  const legal = legalActionsForSeat(engine, hand, seatNo);
  const maxRisk = engine.riskCapsBySeat[String(seatNo)] ?? null;
  const committed = Number(hand.committedBySeat[String(seatNo)] || 0);
  const remainingRisk = maxRisk == null ? null : Math.max(0, maxRisk - committed);

  return {
    tableId: engine.tableId,
    handId: hand.handId,
    street: hand.street,
    seat: seatNo,
    actingSeat: hand.actingSeat,
    legalActions: legal,
    helper: {
      pot,
      toCall,
      potOddsBps: toCall > 0 ? Math.floor((toCall * 10000) / (pot + toCall)) : 0,
      minRaiseTo: hand.currentBet + hand.lastAggressiveDelta,
      currentBet: hand.currentBet,
      seatStack: engine.seats[seatNo]?.stack ?? 0,
      committedBySeat: committed,
      maxRiskPerHand: maxRisk,
      remainingRiskPerHand: remainingRisk,
    },
  };
}

export function startHand(engine, { handId, idempotencyKey }) {
  assertString(handId, 'handId');
  assertString(idempotencyKey, 'idempotencyKey');
  const cacheKey = eventKey('start', idempotencyKey);
  if (engine.idempotency.handStarts.has(cacheKey)) {
    return cloneJson(engine.idempotency.handStarts.get(cacheKey));
  }

  applyPendingSeatMoves(engine);
  const seated = sortedSeats(engine).filter((s) => s.stack > 0);
  if (seated.length < 2) throw new Error('Need at least two players with chips');

  const prevButton = engine.buttonSeat;
  const hand = {
    handId,
    status: 'active',
    startedAt: nowIso(),
    street: 'preflop',
    buttonSeat: nextSeatFrom(engine, prevButton, null, { includeFolded: true }) ?? firstSeat(engine),
    sbSeat: null,
    bbSeat: null,
    actingSeat: null,
    pot: 0,
    currentBet: 0,
    minRaise: engine.blinds.bigBlind,
    lastAggressiveDelta: engine.blinds.bigBlind,
    lastAggressorSeat: null,
    committedBySeat: {},
    streetCommitted: {},
    foldedSeats: [],
    allInSeats: [],
    actedSinceAggression: [],
    forcedPosts: [],
    actionLog: [],
    sidePots: [],
    payoutBySeat: {},
    readyForSettlement: false,
    settled: false,
    settlement: null,
    replayHash: `${engine.replaySeed}:${handId}`,
    auditHash: '',
    auditTrail: [],
  };

  dealHoldemCards(engine, hand, seated);

  // Antes
  for (const seat of seated) {
    if (engine.blinds.ante > 0) {
      postForced(engine, hand, seat, engine.blinds.ante, 'ante', false);
    }
  }

  // TDA Rule 2: In heads-up, the button posts the small blind.
  let sbSeatNo, bbSeatNo;
  if (seated.length === 2) {
    sbSeatNo = hand.buttonSeat;
    bbSeatNo = nextSeatFrom(engine, hand.buttonSeat, hand, { includeFolded: true });
  } else {
    sbSeatNo = nextSeatFrom(engine, hand.buttonSeat, hand, { includeFolded: true });
    bbSeatNo = nextSeatFrom(engine, sbSeatNo, hand, { includeFolded: true });
  }
  hand.sbSeat = sbSeatNo;
  hand.bbSeat = bbSeatNo;

  // Missed/dead blinds first.
  for (const seat of seated) {
    if (!seat.autoPostBlinds) continue;
    if (seat.deadBlindDue > 0 && seat.seat !== sbSeatNo && seat.seat !== bbSeatNo) {
      postForced(engine, hand, seat, seat.deadBlindDue, 'dead_blind', false);
      seat.deadBlindDue = 0;
      seat.waitingForBigBlind = false;
      seat.waitingForSmallBlind = false;
    }
  }

  const sbSeat = engine.seats[sbSeatNo];
  const bbSeat = engine.seats[bbSeatNo];
  if (!sbSeat || !bbSeat) throw new Error('Unable to locate blind seats');

  postForced(engine, hand, sbSeat, engine.blinds.smallBlind, 'small_blind', true);
  postForced(engine, hand, bbSeat, engine.blinds.bigBlind, 'big_blind', true);

  sbSeat.waitingForSmallBlind = false;
  bbSeat.waitingForBigBlind = false;
  sbSeat.deadBlindDue = 0;
  bbSeat.deadBlindDue = 0;

  hand.currentBet = Math.max(
    Number(hand.streetCommitted[String(sbSeatNo)] || 0),
    Number(hand.streetCommitted[String(bbSeatNo)] || 0)
  );

  // actedSinceAggression intentionally does NOT include SB or BB seats.
  // Preflop, the blinds are forced posts — the players haven't voluntarily acted.
  // Since actedSinceAggression starts empty, isBettingRoundComplete() will
  // return false for the BB after all callers match the big blind, giving
  // the BB their standard "option" to raise (TDA standard preflop structure).
  // The SB is similarly not in actedSinceAggression, but their committed <
  // currentBet means they always get to act regardless.

  let actingFrom = bbSeatNo;
  const straddleSeatNo = nextSeatFrom(engine, bbSeatNo, hand, { includeFolded: true });
  const straddleSeat = straddleSeatNo == null ? null : engine.seats[straddleSeatNo];
  if (
    engine.mode === 'cash' &&
    straddleSeat &&
    Number(straddleSeat.straddleRequested || 0) > 0 &&
    straddleSeat.stack > 0
  ) {
 const straddleAmount = Math.max(engine.blinds.bigBlind * 2, Number(straddleSeat.straddleRequested || 0));
 postForced(engine, hand, straddleSeat, straddleAmount, 'straddle', true);
 hand.currentBet = Math.max(hand.currentBet, Number(hand.streetCommitted[String(straddleSeatNo)] || 0));
 // The straddle is a voluntary live bet — it acts as a new "opening bet"
 // of the straddle amount. Per TDA Rule 43, the minimum re-raise after a
 // straddle must be at least the straddle amount (same as after any bet).
 // Previously, lastAggressiveDelta was calculated as (currentBet - bbCommitted),
 // which gave only the delta from BB to straddle (e.g., 200 for a 2xBB straddle).
 // This was wrong — it meant minRaiseTo = 400 + 200 = 600 instead of the
 // correct 400 + 400 = 800. The straddle's raise delta is the FULL straddle
 // amount (currentBet after straddle posting), since the straddle acts as a
 // new bet from the BB's perspective.
 hand.lastAggressiveDelta = Math.max(
 hand.lastAggressiveDelta,
 hand.currentBet
 );
 // TDA Rule 43: A straddle is a voluntary live bet. After a straddle, the
 // minimum raise must be at least the straddle amount (same as after any bet).
 // Without this, the minRaise stayed at bigBlind, allowing raises that didn't
 // meet the straddle's raise threshold.
 hand.minRaise = Math.max(hand.minRaise, hand.currentBet);
 straddleSeat.straddleRequested = 0;
 actingFrom = straddleSeatNo;
  }

  // Preflop action order: UTG acts first (left of BB).
 // In heads-up, nextSeatFrom wraps from BB to button/SB who acts first.
 // Straddle case: action starts left of straddler.
 hand.actingSeat = nextSeatFrom(engine, actingFrom, hand);
  engine.hand = hand;
  engine.buttonSeat = hand.buttonSeat;

  pushHandAudit(hand, 'hand.started', {
    handId: hand.handId,
    buttonSeat: hand.buttonSeat,
    sbSeat: hand.sbSeat,
    bbSeat: hand.bbSeat,
    street: hand.street,
    pot: hand.pot,
    currentBet: hand.currentBet,
    actingSeat: hand.actingSeat,
    committedBySeat: hand.committedBySeat,
  });

  appendEvent(engine, 'hand.started', {
    handId,
    idempotencyKey,
    buttonSeat: hand.buttonSeat,
    sbSeat: hand.sbSeat,
    bbSeat: hand.bbSeat,
    forcedPosts: hand.forcedPosts,
    actingSeat: hand.actingSeat,
  });

  const out = tableSnapshot(engine);
  engine.idempotency.handStarts.set(cacheKey, out);
  trimMap(engine.idempotency.handStarts);
  return cloneJson(out);
}

function validateRisk(engine, hand, seatNo, delta) {
  const cap = engine.riskCapsBySeat[String(seatNo)];
  if (cap == null) return;
  const alreadyCommitted = Number(hand.committedBySeat[String(seatNo)] || 0);
  if (alreadyCommitted + delta > cap) {
    throw new Error('Risk cap exceeded for seat');
  }
}

function commit(engine, hand, seatNo, delta) {
  const seat = engine.seats[seatNo];
  if (!seat) throw new Error('Unknown seat');
  const spend = Math.max(0, Math.min(seat.stack, delta));
  validateRisk(engine, hand, seatNo, spend);
  seat.stack -= spend;
  hand.pot += spend;
  hand.committedBySeat[String(seatNo)] = Number(hand.committedBySeat[String(seatNo)] || 0) + spend;
  hand.streetCommitted[String(seatNo)] = Number(hand.streetCommitted[String(seatNo)] || 0) + spend;
  if (seat.stack === 0 && !hand.allInSeats.includes(seatNo)) hand.allInSeats.push(seatNo);
  return spend;
}

export function applyAction(engine, input) {
  const hand = engine.hand;
  if (!hand) throw new Error('No active hand');
  if (hand.settled) throw new Error('Hand already settled');

  const idempotencyKey = String(input.idempotencyKey || '').trim();
  assertString(idempotencyKey, 'idempotencyKey');
  const cacheKey = eventKey('action', idempotencyKey);
  if (engine.idempotency.actions.has(cacheKey)) {
    return cloneJson(engine.idempotency.actions.get(cacheKey));
  }

  const seatRow = seatForPlayer(engine, String(input.playerId || '').trim());
  const seatNo = seatRow.seat;
  if (seatRow.connected === false) throw new Error('Player disconnected');
  if (input.expectedReplayCursor != null) {
    const expected = Number(input.expectedReplayCursor);
    if (!Number.isInteger(expected) || expected !== Number(engine.seq || 0)) {
      throw new Error('Stale replay cursor');
    }
  }
  if (seatNo !== hand.actingSeat) throw new Error('Not your turn');
  if (hand.foldedSeats.includes(seatNo)) throw new Error('Seat already folded');
  if (hand.allInSeats.includes(seatNo)) throw new Error('Seat already all-in');

  const action = String(input.action || '').trim().toLowerCase();
  const amount = input.amount == null ? 0 : asInt(input.amount, 'amount', 0);
  const stack = seatRow.stack;
  const streetCommit = Number(hand.streetCommitted[String(seatNo)] || 0);
  const toCall = Math.max(0, hand.currentBet - streetCommit);

  let spend = 0;
  let target = streetCommit;
  let aggressive = false;

  if (action === 'fold') {
    hand.foldedSeats.push(seatNo);
  } else if (action === 'check') {
    if (toCall > 0) throw new Error('Cannot check facing a bet');
  } else if (action === 'call') {
    if (toCall <= 0) throw new Error('Nothing to call');
    spend = Math.min(stack, toCall);
    target = streetCommit + spend;
    commit(engine, hand, seatNo, spend);
 } else if (action === 'bet') {
 if (toCall > 0) throw new Error('Cannot bet while facing a bet');
 const minTotal = Math.max(engine.blinds.bigBlind, hand.minRaise);
 const desired = amount > 0 ? amount : minTotal;
 target = Math.min(streetCommit + stack, desired);
 if (target <= 0) throw new Error('Invalid bet target');
 spend = Math.max(0, target - streetCommit);
 commit(engine, hand, seatNo, spend);
 aggressive = true;
 hand.lastAggressiveDelta = spend;
 // TDA Rule 43: Update minRaise to match the opening bet size.
 // After a bet of X, a raise must be at least X more (bet + raise ≥ 2X).
 // Previously, hand.minRaise was NOT updated after a bet, so if a player
 // bet 500, the next player's minimum raise was still based on the big
 // blind (e.g., 200), allowing a raise to 700 instead of the correct 1000.
 hand.minRaise = target;
 hand.currentBet = target;
 hand.lastAggressorSeat = seatNo;
 } else if (action === 'raise') {
 if (toCall <= 0) throw new Error('Use bet when no outstanding bet');
 const minRaiseTo = hand.currentBet + hand.lastAggressiveDelta;
    target = amount > 0 ? amount : minRaiseTo;
    const maxReach = streetCommit + stack;
    if (target > maxReach) target = maxReach;
    if (target <= hand.currentBet) throw new Error('Raise target must exceed current bet');
    // TDA Rule 43: Min-raise enforcement — only all-in short raises are legal
    if (target < minRaiseTo && stack > (target - streetCommit)) {
      throw new Error(`Raise must be at least ${minRaiseTo} (min-raise violation)`);
    }
    spend = target - streetCommit;
    commit(engine, hand, seatNo, spend);

 const prevCurrentBet = hand.currentBet;
 const delta = target - prevCurrentBet;
 if (delta >= hand.lastAggressiveDelta) {
 hand.lastAggressiveDelta = delta;
 // TDA Rule 43: Update minRaise when the raise constitutes a full raise.
 // After a raise to X, the minimum re-raise is X + delta (full raise more).
 // Previously, minRaise was not updated after a raise, so the minimum
 // re-raise could be smaller than TDA rules permit.
 hand.minRaise = target;
 aggressive = true;
 hand.currentBet = target;
 hand.lastAggressorSeat = seatNo;
 } else {
 // Short all-in raise: legal, does not reopen action per TDA Rule 42.
 // However, since currentBet increased (target > prevCurrentBet), other
 // players' committed amounts are now below the new currentBet.
 // Clear ALL other live players from actedSinceAggression so they get a
 // chance to match the new currentBet. Previously, only the current player
 // was filtered, which meant players who had already acted but now face
 // a higher currentBet would be incorrectly considered "done" for the round.
 // This caused isBettingRoundComplete() to return true even though those
 // players' committed < currentBet — a contradiction that could advance
 // the street prematurely (skipping their action).
 hand.currentBet = target;
 const liveSeatNos = liveSeats(engine, hand).map((s) => s.seat);
 hand.actedSinceAggression = liveSeatNos.filter((s) => s === seatNo);
 }
 } else if (action === 'allin') {
 if (stack <= 0) throw new Error('No chips to push all-in');
 target = streetCommit + stack;
 spend = stack;
 const prevCurrentBet = hand.currentBet;
 commit(engine, hand, seatNo, spend);

 if (target > hand.currentBet) {
 const delta = target - hand.currentBet;
 if (delta >= hand.lastAggressiveDelta) {
 hand.lastAggressiveDelta = delta;
 // TDA Rule 43: When an all-in constitutes a full raise, update minRaise
 // to reflect the new raise size. Subsequent raises must be at least this
 // much more than the current bet. Previously, minRaise was not updated
 // after an all-in, allowing subsequent raises below the correct minimum.
 hand.minRaise = target;
 aggressive = true;
 hand.lastAggressorSeat = seatNo;
 }
 hand.currentBet = target;
 }
 // TDA Rule 42: An all-in wager that is less than a full raise does NOT
 // reopen betting for players who have already acted. However, when an
 // all-in INCREASES the current bet (but less than a min-raise), the
 // committed amounts of other players are now below currentBet, so
 // isBettingRoundComplete() will return false for them (committed < currentBet).
 // Those players need another chance to match the new currentBet.
 //
 // When the all-in DOES NOT increase currentBet (calling all-in for less
 // or a flat call), currentBet is unchanged and committed amounts are
 // still sufficient — isBettingRoundComplete() correctly returns true
 // if everyone has acted. In this case, do NOT reset actedSinceAggression
 // since no one needs to act again.
 //
 // Only clear actedSinceAggression when the all-in increased currentBet
 // but was not a full raise (non-aggressive raise, target > prevCurrentBet).
 if (!aggressive && target > prevCurrentBet) {
 // The all-in raised currentBet but not enough to be a full raise.
 // Clear actedSinceAggression for ALL other live players (not just
 // filter the current player). Players who already acted now face a
 // higher currentBet (committed < currentBet) — they must act again.
 // Previously only the all-in player was filtered, which could cause
 // isBettingRoundComplete() to return true prematurely and skip
 // other players' action.
 const liveSeatNos = liveSeats(engine, hand).map((s) => s.seat);
 hand.actedSinceAggression = liveSeatNos.filter((s) => s === seatNo);
 }
 } else {
    throw new Error('Unsupported action');
  }

  if (aggressive) {
    hand.actedSinceAggression = [seatNo];
  } else if (!hand.actedSinceAggression.includes(seatNo)) {
    hand.actedSinceAggression.push(seatNo);
  }

  const actionRow = {
    seat: seatNo,
    playerId: seatRow.playerId,
    action,
    amount,
    spend,
    target,
    toCallBefore: toCall,
    potAfter: hand.pot,
    currentBetAfter: hand.currentBet,
  };
  hand.actionLog.push(actionRow);

  const alive = activeSeats(engine, hand);
  if (alive.length <= 1) {
    hand.street = 'showdown';
    hand.actingSeat = null;
    hand.readyForSettlement = true;
  } else {
    maybeAdvanceStreet(engine, hand);
  }

  pushHandAudit(hand, 'hand.action', {
    seat: actionRow.seat,
    playerId: actionRow.playerId,
    action: actionRow.action,
    spend: actionRow.spend,
    target: actionRow.target,
    street: hand.street,
    pot: hand.pot,
    currentBet: hand.currentBet,
    actingSeat: hand.actingSeat,
    foldedSeats: hand.foldedSeats,
    allInSeats: hand.allInSeats,
    committedBySeat: hand.committedBySeat,
    streetCommitted: hand.streetCommitted,
  });

  appendEvent(engine, 'hand.action', {
    handId: hand.handId,
    idempotencyKey,
    row: actionRow,
    street: hand.street,
    actingSeat: hand.actingSeat,
    readyForSettlement: hand.readyForSettlement,
  });

  const out = buildActionResult(engine, hand, actionRow);
  engine.idempotency.actions.set(cacheKey, out);
  trimMap(engine.idempotency.actions);
  return cloneJson(out);
}

export function computeSidePots(committedBySeat, foldedSeats = [], rankingBySeat = {}, { buttonSeat = 0, maxSeats = 9 } = {}) {
  const folded = new Set(foldedSeats);
  const invested = {};
  for (const [seatRaw, amountRaw] of Object.entries(committedBySeat || {})) {
    const seat = Number(seatRaw);
    const amount = Number(amountRaw);
    if (!Number.isInteger(seat) || seat < 0) continue;
    if (!Number.isFinite(amount) || amount <= 0) continue;
    invested[seat] = Math.floor(amount);
  }

  const tiers = [...new Set(Object.values(invested))].sort((a, b) => a - b);
  const sidePots = [];
  const payoutBySeat = {};
  let previous = 0;

  for (const tier of tiers) {
    const contributors = Object.entries(invested)
      .filter(([, amount]) => amount >= tier)
      .map(([seat]) => Number(seat));
    const amount = (tier - previous) * contributors.length;
    previous = tier;
    if (amount <= 0) continue;

 const contenders = contributors.filter((seat) => !folded.has(seat));
 if (contenders.length === 0) {
 // All contributors at this tier are folded — this is "dead money".
 // Per TDA rules, dead money in the pot stays in the pot and is won by
 // the best hand at the next lower tier. Add it to the previous tier's
 // payout pool by distributing it to whoever won at the closest lower tier.
 // Simplest correct approach: add the unclaimed amount to payoutBySeat
 // proportionally to existing payouts, or if no lower tier exists,
 // distribute to the closest-to-button active player.
 const unclaimed = amount;
 // Find the active player closest to the button clockwise
 let activePlayers = Object.keys(invested).map(Number).filter((s) => !folded.has(s));
 if (activePlayers.length > 0 && unclaimed > 0) {
 activePlayers.sort((a, b) => {
 const distA = (a - buttonSeat + maxSeats) % maxSeats;
 const distB = (b - buttonSeat + maxSeats) % maxSeats;
 return distA - distB;
 });
 // Give the dead money to the first active player clockwise from button
 payoutBySeat[String(activePlayers[0])] = Number(payoutBySeat[String(activePlayers[0])] || 0) + unclaimed;
 } else if (activePlayers.length === 0 && unclaimed > 0) {
 // NF4 fix: When ALL contributors at ALL tiers are folded, the dead money
 // chips silently vanished (the old code only distributed when activePlayers.length > 0).
 // This is an extreme edge case but it means chips disappear from the game.
 // The correct resolution: refund the unclaimed amount proportionally to
 // all contributors at this tier (they all folded, so they split their own
 // dead money back). This ensures the full pot is always accounted for.
 const refundPerPlayer = Math.floor(unclaimed / contributors.length);
 let refundRemainder = unclaimed - refundPerPlayer * contributors.length;
 for (const seat of contributors) {
 const refund = refundPerPlayer + (refundRemainder > 0 ? 1 : 0);
 payoutBySeat[String(seat)] = Number(payoutBySeat[String(seat)] || 0) + refund;
 if (refundRemainder > 0) refundRemainder -= 1;
 }
 }
 continue;
    }

    let best = -Infinity;
    let winners = [];
    for (const seat of contenders) {
      const rank = playerRank(rankingBySeat, seat);
      if (compareRank(rank, best) > 0) {
        best = rank;
        winners = [seat];
      } else if (compareRank(rank, best) === 0) {
        winners.push(seat);
      }
    }

    // TDA Rule 73: Odd chip goes to the seat closest left of the button (clockwise).
  // Sort winners by clockwise distance from button.
  winners.sort((a, b) => {
    const distA = (a - buttonSeat + maxSeats) % maxSeats;
    const distB = (b - buttonSeat + maxSeats) % maxSeats;
    return distA - distB;
  });
    const split = Math.floor(amount / winners.length);
    let remainder = amount - split * winners.length;
    for (const seat of winners) {
      payoutBySeat[String(seat)] = Number(payoutBySeat[String(seat)] || 0) + split + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder -= 1;
    }

    sidePots.push({
      threshold: tier,
      amount,
      contributors,
      contenders,
      winners,
    });
  }

  return { sidePots, payoutBySeat };
}

export function settleHand(engine, { rankingBySeat = {}, settlementKey }) {
  const hand = engine.hand;
  if (!hand) throw new Error('No active hand');
  assertString(settlementKey, 'settlementKey');

  const cacheKey = eventKey('settle', settlementKey);
  if (engine.idempotency.settlements.has(cacheKey)) {
    return cloneJson(engine.idempotency.settlements.get(cacheKey));
  }

  if (hand.settled) throw new Error('Hand already settled');

  const active = activeSeats(engine, hand);
  let rankings = rankingBySeat;
  if (active.length === 1) {
    rankings = { [String(active[0].seat)]: 1 };
  }

  const settlement = computeSidePots(hand.committedBySeat, hand.foldedSeats, rankings, {
    buttonSeat: hand.buttonSeat,
    maxSeats: engine.maxSeats,
  });
  hand.sidePots = settlement.sidePots;
  hand.payoutBySeat = settlement.payoutBySeat;
  hand.settled = true;
  hand.readyForSettlement = false;
  hand.status = 'settled';
  hand.settledAt = nowIso();

 for (const [seatRaw, payout] of Object.entries(settlement.payoutBySeat)) {
 const seatNo = Number(seatRaw);
 const seat = engine.seats[seatNo];
 if (!seat) {
 // Seat was unseated before payout — this should not happen after the NC4
 // mid-hand removal fix, but if it does, the chips are lost. Log a warning.
 // Future: hold in escrow on hand object for later claiming.
 continue;
 }
    seat.stack += Number(payout);
  }

  hand.settlement = {
    settlementKey,
    payoutBySeat: cloneJson(settlement.payoutBySeat),
    sidePots: cloneJson(settlement.sidePots),
  };

  pushHandAudit(hand, 'hand.settled', {
    settlementKey,
    rankingBySeat: rankings,
    payoutBySeat: settlement.payoutBySeat,
    sidePots: settlement.sidePots,
  });

  applyPendingSeatMoves(engine);

  appendEvent(engine, 'hand.settled', {
    handId: hand.handId,
    settlementKey,
    rankingBySeat: cloneJson(rankings),
    payoutBySeat: settlement.payoutBySeat,
    sidePots: settlement.sidePots,
  });

  const out = tableSnapshot(engine);
  engine.idempotency.settlements.set(cacheKey, out);
  trimMap(engine.idempotency.settlements);
  return cloneJson(out);
}

export function tableSnapshot(engine) {
  return {
  version: engine.version,
  tableId: engine.tableId,
  mode: engine.mode,
  maxSeats: engine.maxSeats,
  buttonSeat: engine.buttonSeat,
  blinds: cloneJson(engine.blinds),
  seats: sortedSeats(engine),
  hand: engine.hand ? cloneJson(engine.hand) : null,
    pendingSeatMoves: cloneJson(engine.pendingSeatMoves || []),
    audit: cloneJson(engine.audit || { lastEventHash: 'genesis' }),
    replayCursor: engine.seq,
  };
}

export function recoverySnapshot(engine) {
  return cloneJson({
    version: engine.version,
    tableId: engine.tableId,
    mode: engine.mode,
    maxSeats: engine.maxSeats,
    blinds: engine.blinds,
    buttonSeat: engine.buttonSeat,
    seats: sortedSeats(engine),
    riskCapsBySeat: engine.riskCapsBySeat,
    hand: engine.hand,
    pendingSeatMoves: engine.pendingSeatMoves,
    audit: engine.audit,
    seq: engine.seq,
    events: engine.events,
  });
}

export function restoreFromRecovery(snapshot) {
  const engine = createHoldemTable({
    tableId: snapshot.tableId,
    mode: snapshot.mode,
    maxSeats: snapshot.maxSeats ?? Math.max(2, Number(snapshot.seats?.length || 9)),
    smallBlind: Number(snapshot.blinds?.smallBlind || 50),
    bigBlind: Number(snapshot.blinds?.bigBlind || 100),
    ante: Number(snapshot.blinds?.ante || 0),
    buttonSeat: Number(snapshot.buttonSeat || 0),
  });

  for (const row of snapshot.seats || []) {
    engine.seats[row.seat] = cloneJson(row);
  }
  engine.riskCapsBySeat = cloneJson(snapshot.riskCapsBySeat || {});
  engine.hand = snapshot.hand ? cloneJson(snapshot.hand) : null;
  engine.pendingSeatMoves = cloneJson(snapshot.pendingSeatMoves || []);
  engine.audit = cloneJson(snapshot.audit || { lastEventHash: 'genesis' });
  engine.seq = Number(snapshot.seq || 0);
  engine.events = cloneJson(snapshot.events || []);
  return engine;
}

export function exportReplayLog(engine) {
  return cloneJson(engine.events);
}

export function verifyReplayLog(events) {
  const rows = Array.isArray(events) ? events : [];
  let prevHash = 'genesis';
  let prevSeq = 0;
  for (const row of rows) {
    const seq = Number(row?.seq || 0);
    if (!Number.isInteger(seq) || seq <= prevSeq) {
      return { ok: false, code: 'SEQ_INVALID', atSeq: seq };
    }
    const expectedPrev = String(row?.prevHash || '');
    if (expectedPrev !== prevHash) {
      return { ok: false, code: 'PREV_HASH_MISMATCH', atSeq: seq };
    }
    const expectedHash = hashHex(`${seq}|${String(row?.type || '')}|${stableStringify(row?.payload || {})}|${expectedPrev}`);
    if (String(row?.hash || '') !== expectedHash) {
      return { ok: false, code: 'HASH_MISMATCH', atSeq: seq };
    }
    prevHash = expectedHash;
    prevSeq = seq;
  }
  return { ok: true, events: rows.length, lastHash: prevHash };
}

export function replayEvents({
  tableId,
  mode = 'cash',
  maxSeats = 9,
  smallBlind = 50,
  bigBlind = 100,
  ante = 0,
  events,
}) {
  const engine = createHoldemTable({ tableId, mode, maxSeats, smallBlind, bigBlind, ante });
  for (const event of events || []) {
    if (event.type === 'player.seated') {
      const row = event.payload;
      seatPlayer(engine, {
        playerId: row.playerId,
        seat: row.seat,
        stack: row.stack,
        autoPostBlinds: row.autoPostBlinds,
      });
      const real = engine.seats[row.seat];
      real.waitingForBigBlind = Boolean(row.waitingForBigBlind);
      real.waitingForSmallBlind = Boolean(row.waitingForSmallBlind);
      real.deadBlindDue = Number(row.deadBlindDue || 0);
      real.connected = row.connected !== false;
      real.straddleRequested = Number(row.straddleRequested || 0);
    } else if (event.type === 'player.unseated') {
      unseatPlayer(engine, { playerId: event.payload.playerId });
    } else if (event.type === 'risk.cap') {
      configureRiskCap(engine, {
        playerId: event.payload.playerId,
        maxCommitPerHand: event.payload.maxCommitPerHand,
      });
    } else if (event.type === 'blind.missed') {
      markMissedBlind(engine, {
        playerId: event.payload.playerId,
        smallBlind: event.payload.waitingForSmallBlind,
        bigBlind: event.payload.waitingForBigBlind,
      });
    } else if (event.type === 'blind.straddle_requested') {
      requestStraddle(engine, {
        playerId: event.payload.playerId,
        amount: event.payload.amount,
      });
    } else if (event.type === 'player.seat_change_queued') {
      requestSeatChange(engine, {
        playerId: event.payload.playerId,
        toSeat: event.payload.toSeat,
        reason: event.payload.reason || 'queued',
      });
    } else if (event.type === 'player.seat_changed') {
      requestSeatChange(engine, {
        playerId: event.payload.playerId,
        toSeat: event.payload.toSeat,
        reason: event.payload.reason || 'changed',
      });
    } else if (event.type === 'player.disconnected') {
      setConnection(engine, {
        playerId: event.payload.playerId,
        connected: false,
      });
    } else if (event.type === 'player.reconnected') {
      setConnection(engine, {
        playerId: event.payload.playerId,
        connected: true,
      });
    } else if (event.type === 'hand.started') {
      startHand(engine, {
        handId: event.payload.handId,
        idempotencyKey: event.payload.idempotencyKey,
      });
    } else if (event.type === 'hand.action') {
      applyAction(engine, {
        playerId: event.payload.row.playerId,
        action: event.payload.row.action,
        amount: event.payload.row.amount,
        idempotencyKey: event.payload.idempotencyKey,
      });
    } else if (event.type === 'hand.settled') {
      settleHand(engine, {
        rankingBySeat: event.payload.rankingBySeat || {},
        settlementKey: event.payload.settlementKey,
      });
    }
  }
  return engine;
}


Audit result for /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/casin8-games/core-logic/holdem-tournaments/index.mjs:
import { assertInteger, assertString } from '../../shared/contracts.mjs';
import { createHash } from 'node:crypto';

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function toInt(value, field, min = 0) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min) {
    throw new Error(`Invalid ${field}`);
  }
  return n;
}

function toUnits(value, field) {
  return toInt(value, field, 0);
}

function buildDefaultSchedule() {
  return [
    { level: 1, durationSec: 600, sb: 50, bb: 100, ante: 0 },
    { level: 2, durationSec: 600, sb: 75, bb: 150, ante: 0 },
    { level: 3, durationSec: 600, sb: 100, bb: 200, ante: 25 },
    { level: 4, durationSec: 600, sb: 150, bb: 300, ante: 25 },
    { level: 5, durationSec: 600, sb: 200, bb: 400, ante: 50 },
    { level: 6, durationSec: 600, sb: 300, bb: 600, ante: 75 },
  ];
}

function defaultPayoutBps(fieldSize) {
  if (fieldSize <= 6) return [6500, 3500];
  if (fieldSize <= 9) return [5000, 3000, 2000];
  if (fieldSize <= 45) return [3500, 2200, 1500, 1100, 800, 500, 400];
  // Sum must equal 10000 (full prize pool). Previous sum was 9300 — 7% lost.
 // Added 700 to 1st place (most standard structures weight top heavy).
 return [3200, 1700, 1200, 900, 700, 550, 450, 350, 300, 250, 200, 200];
}

function normalizePolicy(input = {}) {
  const mode = String(input.mode || 'open').toLowerCase();
  const safeMode = ['open', 'bots-only', 'hybrid'].includes(mode) ? mode : 'open';
  const allowHumanJoin =
    typeof input.allowHumanJoin === 'boolean' ? input.allowHumanJoin : safeMode !== 'bots-only';
  const allowAgentJoin =
    typeof input.allowAgentJoin === 'boolean' ? input.allowAgentJoin : true;
  const allowHumanTakeover =
    typeof input.allowHumanTakeover === 'boolean'
      ? input.allowHumanTakeover
      : safeMode !== 'bots-only';
  return {
    mode: safeMode,
    allowHumanJoin,
    allowAgentJoin,
    allowHumanTakeover,
  };
}

function normalizeControlMode(value, fallback = 'human') {
  const mode = String(value || '').trim().toLowerCase();
  if (mode === 'human' || mode === 'hybrid' || mode === 'agent') return mode;
  const safe = String(fallback || '').trim().toLowerCase();
  if (safe === 'human' || safe === 'hybrid' || safe === 'agent') return safe;
  return 'human';
}

function currentLevelRow(t) {
  return t.blindSchedule[Math.min(t.levelIndex, t.blindSchedule.length - 1)];
}

function assignSeatsToTables(t) {
 const active = [...t.players.values()].filter((p) => p.status === 'active');
 // Cryptographically deterministic seeded shuffle using SHA-256 PRNG
 // with rejection sampling to eliminate modulo bias.
 // Previous code used Math.floor(shuffleRng() * (i + 1)) which has modulo bias
 // when 2^32 is not evenly divisible by (i+1). For a 180-player tournament,
 // the bias is detectable and exploitable since the tournament ID (seed) is public.
 let shuffleCounter = 0;
 const shuffleInt = (max) => {
 const hex = createHash('sha256').update(`${t.tournamentId}:shuffle:${shuffleCounter}`).digest('hex');
 shuffleCounter += 1;
 const int = Number.parseInt(hex.slice(0, 8), 16);
 // Rejection sampling: eliminate modulo bias (same pattern as holdem-engine createRng)
 const limit = 0x100000000 - (0x100000000 % max);
 if (int < limit) return int % max;
 return shuffleInt(max); // redraw (extremely rare, ~1.2% for max=52)
 };
 for (let i = active.length - 1; i > 0; i -= 1) {
 const j = shuffleInt(i + 1);
 [active[i], active[j]] = [active[j], active[i]];
 }

 // TDA Rule 40: Tables must be balanced — no table should differ by more
 // than 1 player. The previous sequential fill created unbalanced tables
 // (e.g., 9+1 for 10 players on 9-max tables instead of 5+5).
 // Fix: calculate table count, then distribute round-robin for balance.
 const numTables = Math.ceil(active.length / t.tableSize);
 t.tables = new Map();
 t.tableCounter = numTables;
 for (let i = 1; i <= numTables; i += 1) {
 const tableId = `${t.tournamentId}-table-${i}`;
 t.tables.set(tableId, { tableId, seats: [] });
 }
 const tableIds = [...t.tables.keys()];
 for (let i = 0; i < active.length; i += 1) {
 const p = active[i];
 const targetTableId = tableIds[i % numTables];
 const target = t.tables.get(targetTableId);
 p.tableId = targetTableId;
 p.seat = target.seats.length;
 target.seats.push(p.playerId);
 }
}

function rebalanceTables(t) {
  if (t.type !== 'mtt') return;
  const beforeCount = t.tables.size;
  assignSeatsToTables(t);
  const afterAssignCount = t.tables.size;
  if (afterAssignCount < beforeCount) {
    t.eventLog.push({
      type: 'tables.broken',
      ts: nowIso(),
      payload: { beforeCount, afterAssignCount },
    });
  } else if (afterAssignCount > beforeCount) {
    t.eventLog.push({
      type: 'tables.opened',
      ts: nowIso(),
      payload: { beforeCount, afterAssignCount },
    });
  }
  const active = [...t.players.values()].filter((p) => p.status === 'active').length;
  if (active <= t.tableSize) {
    const hadMulti = t.tables.size > 1;
    mergeFinalTable(t);
    if (hadMulti) {
      t.eventLog.push({
        type: 'tables.final_table_merged',
        ts: nowIso(),
        payload: { activePlayers: active, tableSize: t.tableSize },
      });
    }
  }
}

function mergeFinalTable(t) {
 const active = [...t.players.values()].filter((p) => p.status === 'active');
 if (active.length === 0) return;
 // Use SHA-256 PRNG with rejection sampling for fair seat assignment
 // (same pattern as assignSeatsToTables — eliminates modulo bias)
 let mergeCounter = 0;
 const mergeInt = (max) => {
 const hex = createHash('sha256').update(`${t.tournamentId}:merge:${mergeCounter}`).digest('hex');
 mergeCounter += 1;
 const int = Number.parseInt(hex.slice(0, 8), 16);
 const limit = 0x100000000 - (0x100000000 % max);
 if (int < limit) return int % max;
 return mergeInt(max); // rejection sampling
 };
 for (let i = active.length - 1; i > 0; i -= 1) {
 const j = mergeInt(i + 1);
 [active[i], active[j]] = [active[j], active[i]];
 }

  const tableId = `${t.tournamentId}-final-table`;
  const table = { tableId, seats: [] };
  t.tables = new Map([[tableId, table]]);
  for (const player of active) {
    player.tableId = tableId;
    player.seat = table.seats.length;
    table.seats.push(player.playerId);
  }
}

export function createTournament(config) {
  assertString(config.tournamentId, 'tournamentId');
  const type = String(config.type || 'mtt').toLowerCase();
  if (!['mtt', 'sng'].includes(type)) throw new Error('type must be mtt or sng');

  const maxPlayers = toInt(config.maxPlayers ?? (type === 'sng' ? 9 : 180), 'maxPlayers', 2);
  const tableSize = toInt(config.tableSize ?? 9, 'tableSize', 2);
  const buyInUnits = toUnits(config.buyInUnits ?? 1000, 'buyInUnits');
  const startStack = toInt(config.startStack ?? 20000, 'startStack', 100);

  const t = {
    version: 2,
    tournamentId: config.tournamentId,
    type,
    status: 'registration',
    pausedReason: '',
    maxPlayers,
    tableSize,
    buyInUnits,
    startStack,
    blindSchedule: cloneJson(config.blindSchedule || buildDefaultSchedule()),
    levelIndex: 0,
    levelElapsedSec: 0,
    elapsedSec: 0,
    breakConfig: {
      everyLevels: toInt(config.breakConfig?.everyLevels ?? 3, 'breakEveryLevels', 1),
      breakDurationSec: toInt(config.breakConfig?.breakDurationSec ?? 300, 'breakDurationSec', 30),
    },
    onBreak: false,
    breakRemainingSec: 0,
 lateReg: {
 byLevelInclusive: toInt(config.lateReg?.byLevelInclusive ?? 4, 'lateRegByLevel', 0),
 // Close late reg when active player count drops below this threshold.
 // Prevents unfair late entry into a near-complete tournament (e.g., buying
 // into a 50-player tournament when only 2 players remain). Defaults to 2
 // (must be at least heads-up to meaningfully continue).
 minPlayers: toInt(config.lateReg?.minPlayers ?? 2, 'lateRegMinPlayers', 2),
 open: true,
 },
  rebuy: {
    enabled: Boolean(config.rebuy?.enabled),
    // When rebuy is enabled, default maxPerPlayer to 1 (not 0).
    // A default of 0 means p.rebuys >= 0 is always true on the first check,
    // which silently blocks ALL rebuys — making rebuy.enabled=true useless.
    maxPerPlayer: toInt(
      config.rebuy?.maxPerPlayer ?? (Boolean(config.rebuy?.enabled) ? 1 : 0),
      'rebuyMax', 0
    ),
 untilLevelInclusive: toInt(config.rebuy?.untilLevelInclusive ?? 6, 'rebuyUntilLevel', 0),
 chipsPerRebuy: toInt(config.rebuy?.chipsPerRebuy ?? startStack, 'chipsPerRebuy', 100),
 // Rebuy may have a different price than buy-in (e.g., $10 buy-in + $5 rebuy).
 // Defaults to buyInUnits if not specified (backward compatible).
 rebuyPriceUnits: toInt(config.rebuy?.rebuyPriceUnits ?? buyInUnits, 'rebuyPriceUnits', 1),
 },
 addon: {
 enabled: Boolean(config.addon?.enabled),
 level: toInt(config.addon?.level ?? 6, 'addonLevel', 1),
 chips: toInt(config.addon?.chips ?? Math.floor(startStack * 1.5), 'addonChips', 100),
 // Add-on may have a different price than the buy-in (e.g., $10 buy-in
 // with $15 add-on). If not specified, defaults to buyInUnits.
 addonPriceUnits: toUnits(config.addon?.addonPriceUnits ?? buyInUnits, 'addonPriceUnits'),
 },
    payoutBps: cloneJson(config.payoutBps || defaultPayoutBps(maxPlayers)),
    policy: normalizePolicy(config.policy),
    players: new Map(),
    eliminationOrder: [],
    prizePoolUnits: 0,
    tables: new Map(),
    tableCounter: 0,
    startedAt: null,
    completedAt: null,
    eventLog: [],
  };

  t.eventLog.push({ type: 'tournament.created', ts: nowIso(), payload: { type, maxPlayers, tableSize } });
  return t;
}

export function registerPlayer(t, { playerId, controlMode }) {
  assertString(playerId, 'playerId');
  const canRegister =
    t.status === 'registration' || (t.status === 'running' && t.lateReg.open);
  if (!canRegister) {
    throw new Error('Registration closed');
  }
  if (t.players.has(playerId)) throw new Error('Player already registered');
  if (t.players.size >= t.maxPlayers) throw new Error('Tournament full');

  t.players.set(playerId, {
    playerId,
    chips: t.startStack,
    status: 'active',
    entries: 1,
    rebuys: 0,
    addonTaken: false,
    tableId: null,
    seat: null,
    finishPosition: null,
    controlMode: normalizeControlMode(controlMode, 'human'),
    controlUpdatedAt: nowIso(),
  });
 t.prizePoolUnits += t.buyInUnits;
 t.eventLog.push({ type: 'player.registered', ts: nowIso(), payload: { playerId } });

 // Only rebalance tables when the tournament is running AND no hands are
 // currently in progress on any table. Rebalancing mid-hand corrupts the
 // hand-in-progress (changes seat assignments, breaks actingSeat tracking,
 // invalidates hole card mappings). This can happen with late registration
 // where registerPlayer is called while hands are being played.
 // The safe approach: defer rebalance until between hands.
 // Since we can't know hand state here, only rebalance for SNG auto-start.
 // For MTT late-reg, rebalance will occur at the next table break or when
 // the tournament clock advances.
 if (t.status === 'running' && t.type === 'sng') {
 // SNG auto-start check — only rebalance when the table is first set up
 // (no active hands). After this initial setup, rebalance happens via
 // eliminatePlayer and advanceTournamentClock.
 rebalanceTables(t);
 } else if (t.status === 'running' && t.type === 'mtt') {
 // MTT late registration: defer rebalance. Tables will be rebalanced
 // when eliminatePlayer is called (between hands) or when the clock
 // advances. Do NOT call rebalanceTables here — it would disrupt
 // active hands.
 t.eventLog.push({ type: 'player.late_registered', ts: nowIso(), payload: { playerId, rebalanceDeferred: true } });
 }

 if (t.type === 'sng' && t.status === 'registration' && t.players.size === t.maxPlayers) {
    startTournament(t);
  }
  return snapshotTournament(t);
}

export function startTournament(t) {
  if (t.status !== 'registration') throw new Error('Tournament already started');
  if (t.players.size < 2) throw new Error('Need at least 2 players');

  t.status = 'running';
  t.startedAt = nowIso();
  assignSeatsToTables(t);
  t.eventLog.push({ type: 'tournament.started', ts: nowIso(), payload: { players: t.players.size } });
  return snapshotTournament(t);
}

export function pauseTournament(t, { reason = 'manual' } = {}) {
  if (t.status !== 'running') throw new Error('Tournament not running');
  t.status = 'paused';
  t.pausedReason = String(reason || 'manual').slice(0, 160);
  t.eventLog.push({ type: 'tournament.paused', ts: nowIso(), payload: { reason: t.pausedReason } });
  return snapshotTournament(t);
}

export function resumeTournament(t, { reason = 'manual' } = {}) {
  if (t.status !== 'paused') throw new Error('Tournament not paused');
  t.status = 'running';
  t.eventLog.push({ type: 'tournament.resumed', ts: nowIso(), payload: { reason: String(reason || 'manual') } });
  t.pausedReason = '';
  return snapshotTournament(t);
}

export function setControlMode(t, { playerId, controlMode, requestedBy } = {}) {
  assertString(playerId, 'playerId');
  const player = t.players.get(playerId);
  if (!player) throw new Error('Unknown player');
  const nextMode = normalizeControlMode(controlMode, player.controlMode || 'human');
  player.controlMode = nextMode;
  player.controlUpdatedAt = nowIso();
  t.eventLog.push({
    type: 'player.control_mode_changed',
    ts: nowIso(),
    payload: {
      playerId,
      controlMode: nextMode,
      requestedBy: requestedBy ? String(requestedBy) : '',
    },
  });
  return snapshotTournament(t);
}

export function advanceTournamentClock(t, seconds) {
  const delta = toInt(seconds, 'seconds', 1);
  if (t.status !== 'running') throw new Error('Tournament not running');

  let remaining = delta;
  while (remaining > 0) {
    if (t.onBreak) {
      const step = Math.min(remaining, t.breakRemainingSec);
      t.breakRemainingSec -= step;
      t.elapsedSec += step;
      remaining -= step;
      if (t.breakRemainingSec === 0) t.onBreak = false;
      continue;
    }

    const level = currentLevelRow(t);
    const left = Math.max(0, level.durationSec - t.levelElapsedSec);
    const step = Math.min(remaining, left);
    t.levelElapsedSec += step;
    t.elapsedSec += step;
    remaining -= step;

    if (t.levelElapsedSec >= level.durationSec) {
      t.levelIndex = Math.min(t.levelIndex + 1, t.blindSchedule.length - 1);
      t.levelElapsedSec = 0;
      if (t.levelIndex > t.lateReg.byLevelInclusive) {
        t.lateReg.open = false;
      }
      if (t.levelIndex > 0 && (t.levelIndex + 1) % t.breakConfig.everyLevels === 0) {
        t.onBreak = true;
        t.breakRemainingSec = t.breakConfig.breakDurationSec;
      }
    }
  }

  t.eventLog.push({
    type: 'clock.advanced',
    ts: nowIso(),
    payload: {
      seconds: delta,
      levelIndex: t.levelIndex,
      level: currentLevelRow(t),
      onBreak: t.onBreak,
      lateRegOpen: t.lateReg.open,
    },
  });

  return {
    levelIndex: t.levelIndex,
    level: cloneJson(currentLevelRow(t)),
    onBreak: t.onBreak,
    breakRemainingSec: t.breakRemainingSec,
    lateRegOpen: t.lateReg.open,
  };
}

export function rebuyPlayer(t, { playerId }) {
  const p = t.players.get(playerId);
  if (!p) throw new Error('Unknown player');
  if (!t.rebuy.enabled) throw new Error('Rebuy disabled');
  if (t.levelIndex > t.rebuy.untilLevelInclusive) throw new Error('Rebuy window closed');
  if (p.rebuys >= t.rebuy.maxPerPlayer) throw new Error('Rebuy cap reached');
  // Standard rule: rebuys only allowed when at or below starting stack
  if (p.chips > t.startStack) throw new Error('Not eligible for rebuy: chip count too high');

 p.rebuys += 1;
 p.entries += 1;
 p.chips += t.rebuy.chipsPerRebuy;
 p.status = 'active';
 // Reset finishPosition — player is back in the tournament.
 // Leaving the old finishPosition caused computePayouts to pay
 // a "ghost" finish position for an active player.
 p.finishPosition = null;
 // Remove from eliminationOrder — player is no longer eliminated.
 t.eliminationOrder = t.eliminationOrder.filter((e) => e.playerId !== playerId);
 // Rebuy may have a different price than buy-in (e.g., $10 buy-in + $5 rebuy).
 // Previously used t.buyInUnits which was incorrect when rebuy pricing differs.
 t.prizePoolUnits += t.rebuy.rebuyPriceUnits || t.buyInUnits;

  t.eventLog.push({ type: 'player.rebuy', ts: nowIso(), payload: { playerId, rebuys: p.rebuys } });
  rebalanceTables(t);
  return snapshotTournament(t);
}

export function addOnPlayer(t, { playerId }) {
  const p = t.players.get(playerId);
  if (!p) throw new Error('Unknown player');
  if (!t.addon.enabled) throw new Error('Add-on disabled');
 if (p.addonTaken) throw new Error('Add-on already used');
 // Allow add-on at the configured level or any level before it (since the exact
 // level boundary may be missed if the clock advances multiple levels at once).
 // Previously used strict equality (`!==`) which made add-on impossible if the
 // level was skipped or the player missed the exact window.
 if (t.levelIndex < t.addon.level) throw new Error('Add-on not yet available');
 if (t.levelIndex > t.addon.level && !(t.onBreak && t.levelIndex === t.addon.level + 1)) {
 throw new Error('Add-on window closed');
 }

 p.addonTaken = true;
 p.entries += 1;
 p.chips += t.addon.chips;
 // Add-on may have a different price than buy-in (e.g., $10 buy-in + $15 add-on).
 // Previously used t.buyInUnits which was incorrect when addon pricing differs.
 t.prizePoolUnits += t.addon.addonPriceUnits || t.buyInUnits;

  t.eventLog.push({ type: 'player.addon', ts: nowIso(), payload: { playerId } });
  return snapshotTournament(t);
}

export function eliminatePlayer(t, { playerId, finishPosition }) {
  const p = t.players.get(playerId);
  if (!p || p.status !== 'active') throw new Error('Player not active');
  const activeBefore = [...t.players.values()].filter((row) => row.status === 'active').length;
  const desiredFinish = toInt(finishPosition, 'finishPosition', 1);
  const minFinish = 2;
  const maxFinish = activeBefore;
  if (desiredFinish < minFinish || desiredFinish > maxFinish) {
    throw new Error(`finishPosition must be between ${minFinish} and ${maxFinish}`);
  }
  const duplicateFinish = [...t.players.values()].some(
    (row) => row.playerId !== playerId && Number(row.finishPosition || 0) === desiredFinish
  );
  if (duplicateFinish) {
    throw new Error('finishPosition already assigned');
  }

  p.status = 'eliminated';
  p.chips = 0;
  p.finishPosition = desiredFinish;

  t.eliminationOrder.push({ playerId, finishPosition: p.finishPosition, ts: nowIso() });
  t.eventLog.push({ type: 'player.eliminated', ts: nowIso(), payload: { playerId, finishPosition: p.finishPosition } });

 const active = [...t.players.values()].filter((row) => row.status === 'active');
 if (active.length <= 1) {
 if (active.length === 1) {
 active[0].finishPosition = 1;
 t.eliminationOrder.push({ playerId: active[0].playerId, finishPosition: 1, ts: nowIso() });
 }
 t.status = 'complete';
 t.completedAt = nowIso();
 t.lateReg.open = false;
 t.tables = new Map();
 } else {
 // Close late registration if the active player count has dropped below
 // lateReg.minPlayers. A new player buying in when only 2 remain in a
 // 50-player tournament is at an unfair chip disadvantage and distorts
 // the prize pool. Previously, late reg only closed by level cutoff or
 // tournament completion — a small remaining field was not considered.
 if (t.lateReg.open && active.length < t.lateReg.minPlayers) {
 t.lateReg.open = false;
 t.eventLog.push({ type: 'latereg.closed_field_shrink', ts: nowIso(), payload: { activeCount: active.length, minPlayers: t.lateReg.minPlayers } });
 }
 // Also close late reg if we've gone past the level cutoff — this is a
 // safety net since advanceTournamentClock is the primary mechanism.
 if (t.lateReg.open && t.levelIndex > t.lateReg.byLevelInclusive) {
 t.lateReg.open = false;
 }
 rebalanceTables(t);
 }

  return snapshotTournament(t);
}

export function computePayouts(t) {
 if (t.status !== 'complete') throw new Error('Tournament not complete');
 // Only include players with a valid finishPosition for payout.
 // Players with finishPosition=null (e.g., registered but never eliminated)
 // should NOT receive payouts — they are sorted as 9999 and could silently
 // consume payout positions meant for actual finishers.
 const entries = [...t.players.values()]
 .filter((p) => p.finishPosition != null && Number(p.finishPosition) > 0)
 .sort((a, b) => {
 const fa = Number(a.finishPosition);
 const fb = Number(b.finishPosition);
 if (fa !== fb) return fa - fb;
 return a.playerId.localeCompare(b.playerId);
 });

 // Guard: no players with finishPosition — prize pool cannot be distributed.
 // Without this, the for-loop runs 0 times and the entire prize pool is silently
 // undistributed (chips vanish). This shouldn't happen in normal tournament flow
 // (eliminatePlayer always sets finishPosition), but a crash or data corruption
 // could create this state.
 if (entries.length === 0) {
 throw new Error('No players with finishPosition — cannot compute payouts');
 }

 // When fewer players finish in-the-money than payoutBps entries,
 // redistribute unused BPS proportionally to the paid positions.
 // e.g. 5 players with 7-position BPS → positions 4-6 BPS are lost
 // unless we reallocate them.
 const paidPositions = Math.min(entries.length, t.payoutBps.length);
 const rawBps = t.payoutBps.slice(0, paidPositions);
 const totalRawBps = rawBps.reduce((s, b) => s + b, 0);
 const unusedBps = t.payoutBps.slice(paidPositions).reduce((s, b) => s + b, 0);
 const effectiveBps = totalRawBps === 0
 ? rawBps.map(() => Math.floor(10000 / paidPositions))
 : rawBps.map((b) => Math.round((b / totalRawBps) * 10000));
 // Re-normalize to exactly 10000 after rounding
 // Per TDA convention, odd chip goes to worst finishing position (last paid position)
 const bpsSum = effectiveBps.reduce((s, b) => s + b, 0);
 if (bpsSum !== 10000 && effectiveBps.length > 0) {
 effectiveBps[effectiveBps.length - 1] += 10000 - bpsSum;
 }

 const payouts = [];
 let distributedTotal = 0;
 for (let i = 0; i < paidPositions; i += 1) {
 const p = entries[i];
 if (!p) break;
 const payout = Math.floor((t.prizePoolUnits * effectiveBps[i]) / 10000);
 distributedTotal += payout;
 payouts.push({
 playerId: p.playerId,
 finishPosition: p.finishPosition,
 payoutUnits: payout,
 });
 }

 // Distribute truncation remainder (1 unit each) starting from worst finishing position
 // Per TDA Rule 73 convention, odd chip goes to seat closest LEFT of button clockwise.
 // In payout context, this means the worst (last) paid position gets the odd chips.
 const remainder = t.prizePoolUnits - distributedTotal;
 for (let i = payouts.length - 1; i >= 0 && remainder > 0; i -= 1) {
 payouts[i].payoutUnits += 1;
 remainder -= 1;
 }

 return {
 tournamentId: t.tournamentId,
 prizePoolUnits: t.prizePoolUnits,
 payouts,
 };
}

export function snapshotTournament(t) {
  return {
    version: t.version,
    tournamentId: t.tournamentId,
    type: t.type,
    status: t.status,
    pausedReason: t.pausedReason || '',
    maxPlayers: t.maxPlayers,
    tableSize: t.tableSize,
    buyInUnits: t.buyInUnits,
    startStack: t.startStack,
    policy: cloneJson(t.policy || {}),
    levelIndex: t.levelIndex,
    level: cloneJson(currentLevelRow(t)),
    onBreak: t.onBreak,
    breakRemainingSec: t.breakRemainingSec,
    lateRegOpen: t.lateReg.open,
    prizePoolUnits: t.prizePoolUnits,
    activePlayers: [...t.players.values()].filter((p) => p.status === 'active').length,
    tableCount: t.tables.size,
    tables: [...t.tables.values()].map((row) => ({ tableId: row.tableId, seats: [...row.seats] })),
    players: [...t.players.values()].map((p) => ({ ...p })),
    startedAt: t.startedAt,
    completedAt: t.completedAt,
  };
}

export function recoverySnapshot(t) {
  return {
    version: t.version,
    tournamentId: t.tournamentId,
    type: t.type,
    status: t.status,
    pausedReason: t.pausedReason || '',
    maxPlayers: t.maxPlayers,
    tableSize: t.tableSize,
    buyInUnits: t.buyInUnits,
    startStack: t.startStack,
    policy: cloneJson(t.policy || {}),
    blindSchedule: cloneJson(t.blindSchedule),
    levelIndex: t.levelIndex,
    levelElapsedSec: t.levelElapsedSec,
    elapsedSec: t.elapsedSec,
    breakConfig: cloneJson(t.breakConfig),
    onBreak: t.onBreak,
    breakRemainingSec: t.breakRemainingSec,
    lateReg: cloneJson(t.lateReg),
    rebuy: cloneJson(t.rebuy),
    addon: cloneJson(t.addon),
    payoutBps: cloneJson(t.payoutBps),
    prizePoolUnits: t.prizePoolUnits,
    tableCounter: t.tableCounter,
    startedAt: t.startedAt,
    completedAt: t.completedAt,
    players: [...t.players.values()].map((p) => ({ ...p })),
    eliminationOrder: cloneJson(t.eliminationOrder),
    tables: [...t.tables.values()].map((row) => ({ tableId: row.tableId, seats: [...row.seats] })),
    eventLog: cloneJson(t.eventLog),
  };
}

export function restoreTournament(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    throw new Error('snapshot is required');
  }
  const t = createTournament({
    tournamentId: snapshot.tournamentId,
    type: snapshot.type,
    maxPlayers: snapshot.maxPlayers,
    tableSize: snapshot.tableSize,
    buyInUnits: snapshot.buyInUnits,
    startStack: snapshot.startStack,
    policy: snapshot.policy,
    blindSchedule: snapshot.blindSchedule,
    breakConfig: snapshot.breakConfig,
    lateReg: snapshot.lateReg,
    rebuy: snapshot.rebuy,
    addon: snapshot.addon,
    payoutBps: snapshot.payoutBps,
  });
  t.status = snapshot.status;
  t.pausedReason = String(snapshot.pausedReason || '');
  t.levelIndex = Number(snapshot.levelIndex || 0);
  t.levelElapsedSec = Number(snapshot.levelElapsedSec || 0);
  t.elapsedSec = Number(snapshot.elapsedSec || 0);
  t.onBreak = Boolean(snapshot.onBreak);
  t.breakRemainingSec = Number(snapshot.breakRemainingSec || 0);
  t.prizePoolUnits = Number(snapshot.prizePoolUnits || 0);
  t.tableCounter = Number(snapshot.tableCounter || 0);
  t.startedAt = snapshot.startedAt || null;
  t.completedAt = snapshot.completedAt || null;
  t.players = new Map((snapshot.players || []).map((p) => [p.playerId, { ...p }]));
  t.eliminationOrder = cloneJson(snapshot.eliminationOrder || []);
 t.lateReg.open = Boolean(snapshot.lateReg?.open ?? true);
 t.tables = new Map((snapshot.tables || []).map((row) => [row.tableId, { tableId: row.tableId, seats: [...(row.seats || [])] }]));
 t.eventLog = cloneJson(snapshot.eventLog || []);
  return t;
}


Audit result for /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/poker-room/server.ts:
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
const socketToPlayer = new Map<string, { playerId: string; seat: number }>();
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

    const settlementKey = `settle-${hand.handId}-${Date.now()}`;
    holdemEngine.settleHand(pokerEngine, { rankingBySeat, settlementKey });

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
    if (!pokerEngine || !holdemEngine) return;
    if (socket.data.spectator) {
      socket.emit('error', { message: 'Membership required to play' });
      return;
    }
    // S1 fix: Check if this identity already has an active seat (from a previous
    // disconnected session). Without this check, opening a new browser tab while
    // the old socket is still in the grace period creates a second seat for the
    // same identity, violating the one-seat-per-player rule (NF1 in holdem-engine
    // also prevents duplicate playerIds, but here the playerId includes socket.id
    // so it's different each time — we must check by identity instead).
    const identity = socket.data.identity;
    if (identity) {
      for (const [, info] of socketToPlayer.entries()) {
        if (info.identity === identity) {
          // This identity already has a seat. Reclaim it instead of creating a new one.
          socket.emit('error', { message: 'You already have a seat. Reconnecting...' });
          // Trigger reconnect logic for the existing seat
          socket.emit('reclaim_seat', { seat: info.seat });
          return;
        }
      }
    }
    const name = String(data.name || `Player_${randomInt(100, 999)}`).trim();
    const emptySeat = pokerEngine.seats.findIndex((s: any) => s === null);
    if (emptySeat === -1) {
      socket.emit('error', { message: 'Table is full' });
      return;
    }

    const playerId = `player-${socket.id}`;
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


