import {
  EVENT_TYPES,
  assertInteger,
  assertString,
  buildCursor,
  parseCursor,
} from '../../shared/contracts.mjs';

const MAX_EVENTS = 5000;
const MAX_IDEMPOTENCY_KEYS = 10000;
const MAX_SNAPSHOTS = 500;

function trimSet(set, limit) {
  while (set.size > limit) {
    const first = set.values().next().value;
    set.delete(first);
  }
}

function trimMap(map, limit) {
  while (map.size > limit) {
    const first = map.keys().next().value;
    map.delete(first);
  }
}

export class RealtimeTableBus {
  constructor({ tableId, maxEvents = MAX_EVENTS, maxIdempotencyKeys = MAX_IDEMPOTENCY_KEYS, maxSnapshots = MAX_SNAPSHOTS }) {
    assertString(tableId, 'tableId');
    this.tableId = tableId;
    this.seq = 0;
    this.events = [];
    this.snapshots = new Map();
    this.processedIdempotencyKeys = new Set();
    this.maxEvents = Number(maxEvents) > 0 ? Number(maxEvents) : MAX_EVENTS;
    this.maxIdempotencyKeys = Number(maxIdempotencyKeys) > 0 ? Number(maxIdempotencyKeys) : MAX_IDEMPOTENCY_KEYS;
    this.maxSnapshots = Number(maxSnapshots) > 0 ? Number(maxSnapshots) : MAX_SNAPSHOTS;
  }

  nextSeq() {
    this.seq += 1;
    return this.seq;
  }

  publish(event) {
    const seq = this.nextSeq();
    const out = {
      ...event,
      tableId: this.tableId,
      seq,
      cursor: buildCursor(this.tableId, seq),
      ts: new Date().toISOString(),
    };
    this.events.push(out);
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
    return out;
  }

  consumeMutation({ idempotencyKey, mutationType, payload }) {
    assertString(idempotencyKey, 'idempotencyKey');
    assertString(mutationType, 'mutationType');

    if (this.processedIdempotencyKeys.has(idempotencyKey)) {
      return {
        accepted: false,
        duplicate: true,
        event: this.publish({
          eventType: EVENT_TYPES.ACTION_REJECTED,
          reason: 'DUPLICATE_IDEMPOTENCY_KEY',
          mutationType,
          payload,
          idempotencyKey,
        }),
      };
    }

    this.processedIdempotencyKeys.add(idempotencyKey);
    trimSet(this.processedIdempotencyKeys, this.maxIdempotencyKeys);
    return {
      accepted: true,
      duplicate: false,
      event: this.publish({
        eventType: EVENT_TYPES.ACTION_ACCEPTED,
        mutationType,
        payload,
        idempotencyKey,
      }),
    };
  }

  hasProcessedIdempotencyKey(idempotencyKey) {
    assertString(idempotencyKey, 'idempotencyKey');
    return this.processedIdempotencyKeys.has(idempotencyKey);
  }

  writeSnapshot(snapshotState) {
    const event = this.publish({
      eventType: EVENT_TYPES.RECOVERY_SNAPSHOT,
      snapshotState,
    });
    this.snapshots.set(event.seq, event.snapshotState);
    trimMap(this.snapshots, this.maxSnapshots);
    return event;
  }

  readSnapshot(cursorOrSeq = null) {
    if (cursorOrSeq == null) {
      return this.snapshots.get(this.seq) || null;
    }

    if (typeof cursorOrSeq === 'string') {
      const { tableId, seq } = parseCursor(cursorOrSeq);
      if (tableId !== this.tableId) {
        throw new Error('Cursor tableId mismatch');
      }
      return this.snapshots.get(seq) || null;
    }

    assertInteger(cursorOrSeq, 'seq', 0);
    return this.snapshots.get(cursorOrSeq) || null;
  }

  subscribe({ since = 0 } = {}) {
    assertInteger(since, 'since', 0);
    return this.events.filter((e) => e.seq > since);
  }

  latestCursor() {
    return buildCursor(this.tableId, this.seq);
  }
}
