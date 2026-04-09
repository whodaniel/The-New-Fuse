import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createTableSnapshot,
  validateActionIntent,
  applyAction,
  buildSettlementArtifacts,
} from './engine-core/index.mjs';
import {
  openPosition,
  fundPosition,
  closeFunding,
  settleEvent,
  claimSponsor,
  getPositionView,
} from './sponsorship-ledger/index.mjs';
import { RealtimeTableBus } from './realtime-platform/index.mjs';

test('engine-core validates turn order and applies action', () => {
  const snapshot = createTableSnapshot({
    tableId: 't-1',
    handId: 'h-1',
    seats: [{ seat: 0 }, { seat: 1 }],
    actingSeat: 0,
    pot: 0,
  });

  const wrongTurn = validateActionIntent(snapshot, {
    type: 'agent.action',
    seat: 1,
    action: 'check',
  });
  assert.equal(wrongTurn.ok, false);
  assert.equal(wrongTurn.code, 'NOT_YOUR_TURN');

  const applied = applyAction(snapshot, {
    type: 'agent.action',
    seat: 0,
    action: 'bet',
    amount: 50,
  });

  assert.equal(applied.accepted, true);
  assert.equal(applied.snapshot.pot, 50);
  assert.equal(applied.snapshot.actingSeat, 1);

  const settlement = buildSettlementArtifacts(applied.snapshot, 0, 100);
  assert.equal(settlement.handResult.winnerSeat, 0);
  assert.equal(settlement.payoutDirective.payoutUnits, 100);
});

test('sponsorship-ledger computes markup and event settlement splits', () => {
  const position = openPosition({
    positionId: 'pos-1',
    agentId: 'agent-1',
    stakeForSaleBps: 7000,
    markupBps: 12000,
    maxExposureUnits: 1_000_000n,
  });

  fundPosition(position, { sponsorId: 's1', principalUnits: 1000n });
  fundPosition(position, { sponsorId: 's2', principalUnits: 1000n });

  const close = closeFunding(position);
  assert.equal(close.fundedPrincipalUnits, 2000n);
  assert.equal(close.totalMarkupRevenueUnits, 400n);

  const settlement = settleEvent(position, {
    eventId: 'ev-1',
    buyInUnits: 1000n,
    prizeUnits: 1800n,
    rakeUnits: 50n,
  });

  assert.equal(settlement.platformSettlementFeeUnits >= 0n, true);
  assert.equal(settlement.sponsorPayouts.length, 2);
  assert.equal(settlement.totalSponsorPayoutUnits > 0n, true);

  const claim = claimSponsor(position, { sponsorId: 's1' });
  assert.equal(claim.claimedUnits > 0n, true);

  const view = getPositionView(position);
  assert.equal(view.settlements, 1);
});

test('realtime-platform enforces idempotency and snapshot recovery', () => {
  const bus = new RealtimeTableBus({ tableId: 'table-42' });

  const first = bus.consumeMutation({
    idempotencyKey: 'k-1',
    mutationType: 'agent.action',
    payload: { seat: 0, action: 'check' },
  });
  assert.equal(first.accepted, true);

  const dup = bus.consumeMutation({
    idempotencyKey: 'k-1',
    mutationType: 'agent.action',
    payload: { seat: 0, action: 'check' },
  });
  assert.equal(dup.accepted, false);
  assert.equal(dup.duplicate, true);

  const snapEvent = bus.writeSnapshot({ pot: 120, actingSeat: 1 });
  const recovered = bus.readSnapshot(snapEvent.cursor);
  assert.equal(recovered.pot, 120);

  const feed = bus.subscribe({ since: 0 });
  assert.equal(feed.length >= 3, true);
});
