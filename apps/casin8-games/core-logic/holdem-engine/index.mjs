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
    if (deck.length !== 52 || new Set(deck).size !== 52) {
      throw new Error(`Deck integrity violation: ${deck.length} cards, ${new Set(deck).size} unique`);
    }
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
        legal.push({ action: 'allin', min: stack, max: stack });
      }
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
  for (const p of seated) { // NEW-G fix: Clear straddleRequested for all players
    p.straddleRequested = 0;
  }
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
    idempotency: {
      actions: Array.from(engine.idempotency.actions.entries()),
      settlements: Array.from(engine.idempotency.settlements.entries()),
      handStarts: Array.from(engine.idempotency.handStarts.entries()),
    },
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
  1269|  // NEW-C fix: restore idempotency caches. If not restored, any in-flight action
  1270|  // with an idempotency key could be replayed after crash recovery.
  1271|  if (snapshot.idempotency) {
  1272|    engine.idempotency.actions = new Map(snapshot.idempotency.actions || []);
  1273|    engine.idempotency.settlements = new Map(snapshot.idempotency.settlements || []);
  1274|    engine.idempotency.handStarts = new Map(snapshot.idempotency.handStarts || []);
  1275|  }
  1276|  engine.audit = cloneJson(snapshot.audit || { lastEventHash: 'genesis' });
  1277|  engine.seq = Number(snapshot.seq || 0);
  1278|  engine.events = cloneJson(snapshot.events || []);
  
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
