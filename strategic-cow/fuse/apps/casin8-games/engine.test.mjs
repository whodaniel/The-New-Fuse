import test from "node:test";
import assert from "node:assert/strict";

import {
  createRng,
  evaluatePokerHand,
  fairReceipt,
  playBlackjackRound,
  playRouletteRound,
  playSlotsRound,
} from "./engine.mjs";

test("RNG is deterministic for same seed", () => {
  const a = createRng("seed-1");
  const b = createRng("seed-1");
  const seqA = [a(), a(), a(), a(), a()];
  const seqB = [b(), b(), b(), b(), b()];
  assert.deepEqual(seqA, seqB);
});

test("Poker hand evaluator recognizes full house", () => {
  const hand = [
    { rank: "K", suit: "♠" },
    { rank: "K", suit: "♥" },
    { rank: "K", suit: "♦" },
    { rank: "9", suit: "♠" },
    { rank: "9", suit: "♣" },
  ];
  assert.equal(evaluatePokerHand(hand), 7);
});

test("Roulette straight win payout is 36x", () => {
  const rng = () => 17 / 37;
  const out = playRouletteRound(rng, 10, "straight", 17);
  assert.equal(out.payout, 360);
});

test("Blackjack round returns non-negative payout", () => {
  const rng = createRng("blackjack-check");
  const out = playBlackjackRound(rng, 20);
  assert.ok(out.payout >= 0);
});

test("Slots round payout is multiple of bet", () => {
  const rng = createRng("slots-check");
  const out = playSlotsRound(rng, 15);
  assert.equal(out.payout % 15, 0);
});

test("Fairness receipt is stable for same inputs", async () => {
  const input = {
    serverSeed: "abc123",
    clientSeed: "client456",
    nonce: 7,
    game: "poker",
    bet: 10,
    options: { hold: [] },
  };
  const a = await fairReceipt(input);
  const b = await fairReceipt(input);
  assert.equal(a.digest, b.digest);
  assert.equal(a.serverSeedHash, b.serverSeedHash);
});
