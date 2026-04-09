import { createHash, randomBytes } from 'node:crypto';
import { assertInteger, assertString } from '../shared/contracts.mjs';

function sha256Hex(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

export function createCommit({ sessionId, serverSeed = null }) {
  assertString(sessionId, 'sessionId');
  const seed = serverSeed || randomBytes(32).toString('hex');
  return {
    sessionId,
    serverSeed: seed,
    serverSeedHash: sha256Hex(seed),
    nonce: 1,
    createdAt: new Date().toISOString(),
  };
}

export function rotateCommit(commit) {
  return {
    reveal: {
      previousServerSeed: commit.serverSeed,
      previousServerSeedHash: commit.serverSeedHash,
    },
    next: createCommit({ sessionId: commit.sessionId }),
  };
}

export function fairReceipt({ serverSeed, clientSeed, nonce, game, bet, options = {} }) {
  assertString(serverSeed, 'serverSeed');
  assertString(clientSeed, 'clientSeed');
  assertString(game, 'game');
  assertInteger(nonce, 'nonce', 1);
  assertInteger(bet, 'bet', 1);

  const canonicalOptions = JSON.stringify(options || {});
  const digestInput = `${serverSeed}:${clientSeed}:${nonce}:${game}:${bet}:${canonicalOptions}`;
  return {
    digest: sha256Hex(digestInput),
    digestAlgorithm: 'sha256',
    receiptVersion: 1,
    game,
    bet,
    options,
    serverSeedHash: sha256Hex(serverSeed),
    clientSeed,
    nonce,
  };
}

export function verifyReceipt({ serverSeed, clientSeed, nonce, game, bet, options = {}, receiptDigest }) {
  const receipt = fairReceipt({ serverSeed, clientSeed, nonce, game, bet, options });
  const expected = String(receiptDigest || '').toLowerCase();
  const verified = !expected || expected === receipt.digest.toLowerCase();
  return { verified, receipt };
}

export function scoreCollusionSignals(rows) {
  if (!Array.isArray(rows)) {
    throw new Error('rows must be an array');
  }

  let softPlay = 0;
  let chipDump = 0;
  let repeatedHeadsUp = 0;

  const pairCounts = new Map();

  for (const row of rows) {
    const a = String(row.playerA || '');
    const b = String(row.playerB || '');
    const key = [a, b].sort().join('|');
    if (key !== '|') {
      pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
    }

    if (row.softPlay === true) softPlay += 1;
    if (Number(row.unusualTransferUnits || 0) > 0) chipDump += 1;
  }

  for (const count of pairCounts.values()) {
    if (count >= 4) {
      repeatedHeadsUp += 1;
    }
  }

  const rawScore = softPlay * 25 + chipDump * 30 + repeatedHeadsUp * 20;
  const score = Math.min(100, rawScore);
  const level = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';

  return {
    score,
    level,
    factors: {
      softPlay,
      chipDump,
      repeatedHeadsUp,
    },
  };
}
