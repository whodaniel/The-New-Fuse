export const EVENT_TYPES = Object.freeze({
  TABLE_SNAPSHOT: 'table.snapshot',
  ACTION_ACCEPTED: 'action.accepted',
  ACTION_REJECTED: 'action.rejected',
  HAND_RESULT: 'hand.result',
  PAYOUT_DIRECTIVE: 'payout.directive',
  FAIRNESS_MATERIAL: 'fairness.material',
  RECOVERY_SNAPSHOT: 'recovery.snapshot',
});

export const MUTATION_TYPES = Object.freeze({
  PLAYER_ACTION: 'player.action',
  AGENT_ACTION: 'agent.action',
});

export function assertString(value, field) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Invalid ${field}: expected non-empty string`);
  }
}

export function assertInteger(value, field, min = null) {
  if (!Number.isInteger(value)) {
    throw new Error(`Invalid ${field}: expected integer`);
  }
  if (min != null && value < min) {
    throw new Error(`Invalid ${field}: expected >= ${min}`);
  }
}

export function assertBigInt(value, field, min = null) {
  if (typeof value !== 'bigint') {
    throw new Error(`Invalid ${field}: expected bigint`);
  }
  if (min != null && value < min) {
    throw new Error(`Invalid ${field}: expected >= ${min}`);
  }
}

export function assertBps(value, field) {
  assertInteger(value, field, 0);
  if (value > 10000) {
    throw new Error(`Invalid ${field}: bps out of range`);
  }
}

export function buildCursor(tableId, seq) {
  assertString(tableId, 'tableId');
  assertInteger(seq, 'seq', 0);
  return `${tableId}:${seq}`;
}

export function parseCursor(cursor) {
  assertString(cursor, 'cursor');
  const [tableId, seqRaw] = cursor.split(':');
  const seq = Number(seqRaw);
  if (!Number.isInteger(seq) || seq < 0) {
    throw new Error('Invalid cursor sequence');
  }
  return { tableId, seq };
}

export function prorate(units, part, total) {
  if (total === 0n) return 0n;
  return (units * part) / total;
}
