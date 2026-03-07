import {
  EVENT_TYPES,
  MUTATION_TYPES,
  assertInteger,
  assertString,
  buildCursor,
} from '../shared/contracts.mjs';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createTableSnapshot({ tableId, handId, actingSeat = 0, seats = [], pot = 0 }) {
  assertString(tableId, 'tableId');
  assertString(handId, 'handId');
  assertInteger(actingSeat, 'actingSeat', 0);
  assertInteger(pot, 'pot', 0);

  return {
    eventType: EVENT_TYPES.TABLE_SNAPSHOT,
    tableId,
    handId,
    actingSeat,
    pot,
    street: 'preflop',
    seats: clone(seats),
    seq: 0,
    cursor: buildCursor(tableId, 0),
    terminal: false,
  };
}

export function validateActionIntent(snapshot, intent) {
  if (!snapshot || snapshot.eventType !== EVENT_TYPES.TABLE_SNAPSHOT) {
    return { ok: false, code: 'SNAPSHOT_INVALID' };
  }

  if (!intent || ![MUTATION_TYPES.PLAYER_ACTION, MUTATION_TYPES.AGENT_ACTION].includes(intent.type)) {
    return { ok: false, code: 'INTENT_TYPE_INVALID' };
  }

  if (!Number.isInteger(intent.seat) || intent.seat < 0) {
    return { ok: false, code: 'SEAT_INVALID' };
  }

  if (snapshot.terminal) {
    return { ok: false, code: 'HAND_TERMINAL' };
  }

  if (snapshot.actingSeat !== intent.seat) {
    return { ok: false, code: 'NOT_YOUR_TURN' };
  }

  const action = String(intent.action || '').toLowerCase();
  if (!['fold', 'check', 'call', 'bet', 'raise'].includes(action)) {
    return { ok: false, code: 'ACTION_INVALID' };
  }

  const amount = Number(intent.amount || 0);
  if ((action === 'bet' || action === 'raise') && (!Number.isInteger(amount) || amount <= 0)) {
    return { ok: false, code: 'AMOUNT_INVALID' };
  }

  return { ok: true, code: 'OK' };
}

export function applyAction(snapshot, intent) {
  const check = validateActionIntent(snapshot, intent);
  if (!check.ok) {
    return {
      accepted: false,
      reason: check.code,
      event: {
        eventType: EVENT_TYPES.ACTION_REJECTED,
        tableId: snapshot?.tableId || null,
        handId: snapshot?.handId || null,
        intent,
        reason: check.code,
      },
      snapshot,
    };
  }

  const next = clone(snapshot);
  const action = String(intent.action || '').toLowerCase();
  const amount = Number(intent.amount || 0);

  if (action === 'bet' || action === 'raise' || action === 'call') {
    next.pot += amount;
  }

  if (action === 'fold') {
    next.seats[intent.seat] = {
      ...(next.seats[intent.seat] || {}),
      folded: true,
    };
  }

  next.seq += 1;
  next.cursor = buildCursor(next.tableId, next.seq);

  // Minimal turn progression: next seat modulo seat count.
  const seatCount = Math.max(1, next.seats.length || 1);
  next.actingSeat = (next.actingSeat + 1) % seatCount;

  const activeSeats = next.seats.filter((seat) => !seat?.folded).length;
  if (activeSeats <= 1) {
    next.terminal = true;
  }

  return {
    accepted: true,
    reason: 'OK',
    event: {
      eventType: EVENT_TYPES.ACTION_ACCEPTED,
      tableId: next.tableId,
      handId: next.handId,
      intent,
      seq: next.seq,
      cursor: next.cursor,
    },
    snapshot: next,
  };
}

export function buildSettlementArtifacts(snapshot, winnerSeat, payoutUnits) {
  assertInteger(winnerSeat, 'winnerSeat', 0);
  assertInteger(payoutUnits, 'payoutUnits', 0);
  return {
    handResult: {
      eventType: EVENT_TYPES.HAND_RESULT,
      tableId: snapshot.tableId,
      handId: snapshot.handId,
      winnerSeat,
    },
    payoutDirective: {
      eventType: EVENT_TYPES.PAYOUT_DIRECTIVE,
      tableId: snapshot.tableId,
      handId: snapshot.handId,
      winnerSeat,
      payoutUnits,
    },
    fairnessMaterial: {
      eventType: EVENT_TYPES.FAIRNESS_MATERIAL,
      tableId: snapshot.tableId,
      handId: snapshot.handId,
      cursor: snapshot.cursor,
      seq: snapshot.seq,
    },
  };
}
