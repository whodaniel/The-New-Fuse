# Poker Engine Deep Audit — New Findings

**Date:** 2026-04-23 | **Auditor:** Hermes Agent (cron) | **Scope:**
holdem-engine, tournament-engine, server.ts, server.js **Baseline:**
POKER_AUDIT_2026-04-22.md (C1-C5, H1-H7, M1-M8, L1-L7)

---

## NEW CRITICAL FINDINGS

### NC1. Server.js bot settlement uses seat.holeCards instead of hand.holeCards — WRONG WINNER PICKED

**File:** `apps/casin8-games/server.js` line ~7384 (bot settlement in
`runHoldemBotLoop`) **Severity:** CRITICAL — **Game integrity violation** **TDA
Rule:** N/A (general game correctness)

**Bug:** The bot game loop's showdown evaluation used `seat.holeCards || []` to
get hole cards for pokersolver evaluation. But `seat.holeCards` is **always
undefined** — hole cards are stored on `hand.holeCards` keyed by seat number
string (e.g., `hand.holeCards['3']`). This means every contender was evaluated
with zero hole cards, making pokersolver compare only the board cards. All
contenders would always tie, and the pot would be split evenly regardless of
hand strength.

**Impact:** In every multi-way bot showdown, the winner was determined by who
appeared first in the contenders array (arbitrary), not by hand strength. A
player with a full house would split the pot with a player holding a low pair,
because neither had hole cards in the evaluation.

**Fix applied:**

```js
// BEFORE (broken):
const holeCards = seat.holeCards || [];

// AFTER (fixed):
const holeCards = hand.holeCards?.[String(seat.seat)] || [];
```

**Status:** ✅ Patched in server.js

---

## NEW HIGH FINDINGS

### NH1. defaultPayoutBps for 46+ field sums to 9300, NOT 10000 — 7% of prize pool lost

**File:** `apps/casin8-games/core-logic/holdem-tournaments/index.mjs` line 39
**Severity:** HIGH — Prize pool integrity violation

**Bug:** The `defaultPayoutBps` function's 46+ field tier returned
`[2500, 1700, 1200, 900, 700, 550, 450, 350, 300, 250, 200, 200]` which sums to
**9300** basis points (93%), not 10000 (100%). This means 7% of the prize pool
is never distributed in any tournament with 46+ players.

**Verification:** 2500+1700+1200+900+700+550+450+350+300+250+200+200 = 9300.
Missing 700 BPS.

**Fix applied:** Changed first entry from 2500 to 3200 (top-heavy weighting is
standard in tournament structures):

```js
// BEFORE:
return [2500, 1700, 1200, 900, 700, 550, 450, 350, 300, 250, 200, 200];

// AFTER (sum = 10000):
return [3200, 1700, 1200, 900, 700, 550, 450, 350, 300, 250, 200, 200];
```

**Status:** ✅ Patched in holdem-tournaments/index.mjs

---

### NH2. computePayouts silently drops unused BPS when field < payoutBps.length

**File:** `apps/casin8-games/core-logic/holdem-tournaments/index.mjs` lines
442-478 **Severity:** HIGH — Upgrades previous L1 finding **Related:** L1 in
original audit (was "Low" severity — now upgraded after deeper analysis)

**Bug:** When fewer players finish in-the-money than `payoutBps` entries, the
excess BPS entries are silently dropped. Example: 5-player tournament with
7-position BPS `[3500, 2200, 1500, 1100, 800, 500, 400]` — positions 5-7 (1700
BPS = 17% of pool) are never paid. The code simply breaks out of the loop when
`entries[i]` is null.

**Fix applied:** Proportionally redistribute unused BPS to the paid positions,
then re-normalize to exactly 10000:

```js
const paidPositions = Math.min(entries.length, t.payoutBps.length);
const rawBps = t.payoutBps.slice(0, paidPositions);
const totalRawBps = rawBps.reduce((s, b) => s + b, 0);
const effectiveBps =
  totalRawBps === 0
    ? rawBps.map(() => Math.floor(10000 / paidPositions))
    : rawBps.map((b) => Math.round((b / totalRawBps) * 10000));
// Re-normalize to exactly 10000 after rounding
const bpsSum = effectiveBps.reduce((s, b) => s + b, 0);
if (bpsSum !== 10000 && effectiveBps.length > 0) {
  effectiveBps[0] += 10000 - bpsSum;
}
```

**Status:** ✅ Patched in holdem-tournaments/index.mjs

---

## NEW MEDIUM FINDINGS

### NM1. buildDeck lacks integrity validation — could silently produce duplicate/short decks

**File:** `apps/casin8-games/core-logic/holdem-engine/index.mjs` lines 43-51
**Severity:** MEDIUM — Defense-in-depth

**Issue:** The `buildDeck()` function creates a deck from CARD_SUITS ×
CARD_RANKS but never validates the result. If either constant were accidentally
modified (duplicate entries, missing ranks), the deck would be silently wrong —
leading to duplicate cards or missing cards in play.

**Fix applied:** Added runtime assertion:

```js
if (deck.length !== 52 || new Set(deck).size !== 52) {
  throw new Error(
    `Deck integrity violation: ${deck.length} cards, ${new Set(deck).size} unique`
  );
}
```

**Status:** ✅ Patched in holdem-engine/index.mjs

---

### NM2. rebuyPlayer doesn't reset finishPosition or remove from eliminationOrder — ghost payout on rebuy

**File:** `apps/casin8-games/core-logic/holdem-tournaments/index.mjs` lines
370-374 **Severity:** MEDIUM — Payout correctness

**Bug:** When a player is eliminated (`p.status = 'eliminated'`,
`p.finishPosition = N`), then rebuys back in (`rebuyPlayer`), the function
correctly sets `p.status = 'active'` and `p.chips += rebuyChips`, but it **did
NOT reset `p.finishPosition`** to null. This means `computePayouts` (which sorts
by `finishPosition`) could include an active player in the payout list at their
old elimination position — paying them twice (once as an active winner, once at
the ghost finish position).

Additionally, the player's entry in `t.eliminationOrder` was not removed, so the
elimination log would show them as eliminated even though they're active again.

**Fix applied:**

```js
// Reset finishPosition — player is back in the tournament.
p.finishPosition = null;
// Remove from eliminationOrder — player is no longer eliminated.
t.eliminationOrder = t.eliminationOrder.filter((e) => e.playerId !== playerId);
```

**Status:** ✅ Patched in holdem-tournaments/index.mjs

---

### NM3. Rebuy config footgun: maxPerPlayer defaults to 0, silently prevents rebuys even when enabled

**File:** `apps/casin8-games/core-logic/holdem-tournaments/index.mjs` line 201
**Severity:** MEDIUM — Configuration correctness

**Issue:** When `rebuy.enabled` is set to `true` but `rebuy.maxPerPlayer` is not
explicitly configured, it defaults to 0. The `rebuyPlayer` guard
`p.rebuys >= t.rebuy.maxPerPlayer` evaluates as `0 >= 0` → true, throwing "Rebuy
cap reached" before any rebuy can happen. This effectively makes rebuys
non-functional even when the feature is "enabled".

**Recommended fix:** Change default from 0 to 1 when `rebuy.enabled` is true:

```js
maxPerPlayer: toInt(config.rebuy?.maxPerPlayer ?? (config.rebuy?.enabled ? 1 : 0), 'rebuyMax', 0),
```

**Status:** ⚠️ Not yet patched — configuration concern, needs owner decision on
default rebuy count

---

## VERIFIED COMPLIANT (No New Issues)

The following checklist items were verified as correctly implemented:

| Item                                       | Status | Notes                                                                                                    |
| ------------------------------------------ | ------ | -------------------------------------------------------------------------------------------------------- | --- | ------------------------------ |
| **Shuffle uses crypto RNG**                | ✅     | SHA-256 counter-mode PRNG in holdem-engine; no Math.random anywhere                                      |
| **Burn cards**                             | ✅     | burn1→flop(3), burn1→turn(1), burn1→river(1); stored on `hand.burnCards`, not in `boardCards`            |
| **Heads-up blind posting**                 | ✅     | Button posts SB (line 661), other posts BB (TDA Rule 2)                                                  |
| **Min-raise = max(prevRaise, BB)**         | ✅     | `lastAggressiveDelta` tracked and reset per street (TDA Rule 43)                                         |
| **Bet action lastAggressiveDelta**         | ✅     | When `toCall === 0`, `spend = target - streetCommit`, delta = spend. Confirmed correct (per Pitfall #14) |
| **computeSidePots odd chip**               | ✅     | TDA Rule 73: clockwise from button via `(seat - buttonSeat + maxSeats) % maxSeats`                       |
| **computeSidePots dead money**             | ✅     | When all contenders folded, unclaimed chips go to closest-to-button active player                        |
| **settleHand passes buttonSeat/maxSeats**  | ✅     | Lines 1034-1037: `{ buttonSeat: hand.buttonSeat, maxSeats: engine.maxSeats }`                            |
| **Mid-hand unseatPlayer guard**            | ✅     | Both locations check `!hand                                                                              |     | hand.settled` before unseating |
| **Showdown card visibility**               | ✅     | Folded players get `['hidden', 'hidden']` at showdown (TDA Rule 66)                                      |
| **Board card leakage**                     | ✅     | `boardCards.slice(0, streetCount)` prevents future card leakage                                          |
| **Action timeout uses playerId**           | ✅     | `applyAction(pokerEngine, { playerId: seatRow.playerId, ... })` (per Pitfall #30)                        |
| **forceFoldDisconnected for disconnected** | ✅     | Used when `seatRow.connected === false` (per Pitfall #30)                                                |
| **Reconnection matches by identity**       | ✅     | `existingIdentity === identity` with displayName fallback (per Pitfall #31)                              |
| **No Math.random**                         | ✅     | Zero instances across holdem-engine, tournament-engine, server.ts, server.js                             |

---

## SUMMARY

| ID  | Severity | Description                                                              | Status            |
| --- | -------- | ------------------------------------------------------------------------ | ----------------- |
| NC1 | CRITICAL | server.js bot settlement uses seat.holeCards (undefined) → wrong winner  | ✅ Patched        |
| NH1 | HIGH     | defaultPayoutBps sum=9300 for 46+ field, 7% prize pool lost              | ✅ Patched        |
| NH2 | HIGH     | computePayouts drops unused BPS when field < BPS length                  | ✅ Patched        |
| NM1 | MEDIUM   | buildDeck lacks 52-card integrity validation                             | ✅ Patched        |
| NM2 | MEDIUM   | rebuyPlayer doesn't reset finishPosition/eliminationOrder → ghost payout | ✅ Patched        |
| NM3 | MEDIUM   | Rebuy maxPerPlayer defaults to 0, silently prevents rebuys when enabled  | ⚠️ Needs decision |
