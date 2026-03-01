function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
}

function pairKey(a, b) {
  const left = String(a || '').trim();
  const right = String(b || '').trim();
  if (!left || !right || left === right) return '';
  return left < right ? `${left}|${right}` : `${right}|${left}`;
}

function getPairAccumulator(map, a, b) {
  const key = pairKey(a, b);
  if (!key) return null;
  if (!map.has(key)) {
    map.set(key, {
      key,
      players: key.split('|'),
      opportunities: 0,
      softFolds: 0,
      repeatedTransferEvents: 0,
      dominantWinner: null,
      dominantWinCount: 0,
      suspiciousHands: [],
    });
  }
  return map.get(key);
}

function parseReplayEvents(events) {
  const rows = Array.isArray(events) ? events : [];
  const byHand = new Map();
  for (const event of rows) {
    const type = String(event?.type || '');
    const handId = String(event?.payload?.handId || '').trim();
    if (!handId) continue;
    if (!byHand.has(handId)) {
      byHand.set(handId, {
        handId,
        actions: [],
        settled: null,
      });
    }
    const hand = byHand.get(handId);
    if (type === 'hand.action') {
      const row = event?.payload?.row || {};
      const playerId = String(row.playerId || '').trim();
      const seat = Number(row.seat);
      const action = String(row.action || '').trim().toLowerCase();
      hand.actions.push({
        playerId,
        seat: Number.isInteger(seat) ? seat : null,
        action,
      });
    } else if (type === 'hand.settled') {
      hand.settled = {
        payoutBySeat:
          event?.payload?.payoutBySeat && typeof event.payload.payoutBySeat === 'object'
            ? event.payload.payoutBySeat
            : {},
      };
    }
  }
  return [...byHand.values()];
}

function deriveSeatToPlayer(actions) {
  const out = {};
  for (const row of actions) {
    if (row.seat == null) continue;
    if (!row.playerId) continue;
    out[String(row.seat)] = row.playerId;
  }
  return out;
}

export function scanReplayForCollusion(events, options = {}) {
  const softFoldWeight = Number(options.softFoldWeight ?? 0.7);
  const transferWeight = Number(options.transferWeight ?? 0.3);
  const minPairHands = Math.max(1, Number(options.minPairHands ?? 3));
  const hands = parseReplayEvents(events);
  const pairs = new Map();

  for (const hand of hands) {
    const actions = hand.actions || [];
    const seatToPlayer = deriveSeatToPlayer(actions);
    const seenByPlayer = new Set(actions.map((a) => a.playerId).filter(Boolean));
    const players = [...seenByPlayer];
    for (let i = 0; i < players.length; i += 1) {
      for (let j = i + 1; j < players.length; j += 1) {
        const acc = getPairAccumulator(pairs, players[i], players[j]);
        if (!acc) continue;
        acc.opportunities += 1;
      }
    }

    for (let i = 0; i < actions.length - 1; i += 1) {
      const first = actions[i];
      const second = actions[i + 1];
      if (!first.playerId || !second.playerId) continue;
      if (!['bet', 'raise', 'allin'].includes(first.action)) continue;
      if (second.action !== 'fold') continue;
      if (first.playerId === second.playerId) continue;
      const acc = getPairAccumulator(pairs, first.playerId, second.playerId);
      if (!acc) continue;
      acc.softFolds += 1;
      if (acc.suspiciousHands.length < 25) {
        acc.suspiciousHands.push({
          handId: hand.handId,
          aggressor: first.playerId,
          folder: second.playerId,
          pattern: 'aggressive_action_then_fold',
        });
      }
    }

    const payoutBySeat = hand?.settled?.payoutBySeat || {};
    const winners = Object.entries(payoutBySeat)
      .map(([seat, payout]) => ({ seat, payout: Number(payout || 0), playerId: seatToPlayer[String(seat)] }))
      .filter((row) => row.playerId && row.payout > 0)
      .sort((a, b) => b.payout - a.payout);
    if (winners.length > 0) {
      const winner = winners[0].playerId;
      for (const other of players) {
        if (!other || other === winner) continue;
        const acc = getPairAccumulator(pairs, winner, other);
        if (!acc) continue;
        if (acc.dominantWinner == null || acc.dominantWinner === winner) {
          acc.dominantWinner = winner;
          acc.dominantWinCount += 1;
        }
        if (acc.dominantWinCount >= 3) {
          acc.repeatedTransferEvents += 1;
        }
      }
    }
  }

  const scored = [...pairs.values()]
    .filter((row) => row.opportunities >= minPairHands)
    .map((row) => {
      const softFoldRate = row.opportunities > 0 ? row.softFolds / row.opportunities : 0;
      const transferRate = row.opportunities > 0 ? row.repeatedTransferEvents / row.opportunities : 0;
      const score =
        clamp01(softFoldRate) * clamp01(softFoldWeight) +
        clamp01(transferRate) * clamp01(transferWeight);
      return {
        pair: row.players,
        opportunities: row.opportunities,
        softFolds: row.softFolds,
        softFoldRate,
        repeatedTransferEvents: row.repeatedTransferEvents,
        transferRate,
        dominantWinner: row.dominantWinner,
        dominantWinCount: row.dominantWinCount,
        collusionScore: Number(score.toFixed(4)),
        suspiciousHands: row.suspiciousHands,
      };
    })
    .sort((a, b) => b.collusionScore - a.collusionScore || b.softFolds - a.softFolds);

  return {
    scannedHands: hands.length,
    pairCount: scored.length,
    pairs: scored,
    generatedAt: new Date().toISOString(),
  };
}
