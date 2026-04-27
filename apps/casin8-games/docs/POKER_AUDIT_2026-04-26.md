# Poker Engine Deep Audit Report — 2026-04-26

**Date:** 2026-04-26 | **Auditor:** Hermes Agent (Cron) | **Scope:** Full TDA
rule compliance audit of holdem-engine, tournament-engine, and server.ts

---

## NEW FINDINGS (not in previous audit reports)

### 🆕 NF1-PATCHED (C): seatPlayer() allows duplicate playerId — **PATCHED**

**File:** `apps/casin8-games/core-logic/holdem-engine/index.mjs` line 387

`seatPlayer()` checked if a seat was occupied but NEVER checked if the same
`playerId` was already seated at a different seat. A player could sit at seat 0
AND seat 3 simultaneously, creating a "ghost" duplicate. `seatForPlayer()` uses
`.find()` which returns only the first match, so the second seat becomes a
phantom. This corrupts `committedBySeat` (double contribution),
`actedSinceAggression` (independent tracking per seat), `computeSidePots`
(double contribution from one identity), and pot distribution.

**Fix applied:** Added
`const existing = engine.seats.find((s) => s && s.playerId === playerId); if (existing) throw new Error('Player already seated');`
at top of `seatPlayer()`.

---

### 🆕 NF2-PATCHED (H): Tournament shuffle RNGs have modulo bias — **PATCHED**

**File:** `apps/casin8-games/core-logic/holdem-tournaments/index.mjs` lines
86-89, 156-159

Both `assignSeatsToTables()` and `mergeFinalTable()` used
`Math.floor(shuffleRng() * (i + 1))` where `shuffleRng()` returns
`int / 0x100000000`. This is the same modulo-bias pattern that the
holdem-engine's `createRng` explicitly fixes with rejection sampling. Since the
tournament ID (seed) is public, the bias is theoretically exploitable.

**Fix applied:** Replaced float-based RNG with `shuffleInt(max)` /
`mergeInt(max)` functions that use rejection sampling, mirroring the
holdem-engine's `createRng` pattern:

```js
const shuffleInt = (max) => {
  const hex = createHash('sha256')
    .update(`${seed}:shuffle:${counter}`)
    .digest('hex');
  counter += 1;
  const int = Number.parseInt(hex.slice(0, 8), 16);
  const limit = 0x100000000 - (0x100000000 % max);
  if (int < limit) return int % max;
  return shuffleInt(max); // rejection: redraw
};
```

---

### 🆕 NF3-PATCHED (H): server.ts reconnect_attempt uses stale `hand` closure — **PATCHED**

**File:** `apps/poker-room/server.ts` line 1043

The reconnect handler contained
`if (actionTimeoutTimer && hand?.actingSeat === seat)` but `hand` is NOT defined
within the reconnect handler's scope — it was a stale reference from the
`socket.on('action')` handler's closure. When no action was processed, `hand`
was undefined, meaning the action timeout timer was NEVER cleared on
reconnection. Players who disconnected and reconnected while it was their turn
would get auto-folded 25s later despite having just reconnected.

**Fix applied:** Changed `hand?.actingSeat` to `pokerEngine.hand?.actingSeat` to
read the live engine state.

---

### 🆕 NF4-PATCHED (H): computeSidePots dead money lost when ALL players at ALL tiers are folded — **PATCHED**

**File:** `apps/casin8-games/core-logic/holdem-engine/index.mjs` lines
~1058-1078

When all contributors at a tier level are folded AND no active players exist
anywhere in the hand (`activePlayers.length === 0`), the unclaimed chips
silently vanished. The old code only distributed dead money when
`activePlayers.length > 0`.

**Fix applied:** Added `else if (activePlayers.length === 0 && unclaimed > 0)`
branch that refunds the dead money proportionally to all contributors at that
tier, ensuring the full pot is always accounted for.

---

### 🆕 T1-PATCHED (M): restoreTournament doesn't restore `lateReg.open` — **PATCHED**

**File:** `apps/casin8-games/core-logic/holdem-tournaments/index.mjs` line 668

`restoreTournament` passes `snapshot.lateReg` into `createTournament`, but
`createTournament` hardcodes `lateReg.open: true` regardless of the snapshot
value. After crash recovery, a tournament that had closed late registration
would incorrectly reopen it, allowing players to buy in when they shouldn't be
able to.

**Fix applied:** Added
`t.lateReg.open = Boolean(snapshot.lateReg?.open ?? true);` after
`createTournament` in `restoreTournament`.

---

### 🆕 T2-PATCHED (M): Break scheduling off-by-one — **PATCHED**

**File:** `apps/casin8-games/core-logic/holdem-tournaments/index.mjs` line 377

The break trigger `t.levelIndex % t.breakConfig.everyLevels === 0` fires one
level too late. `levelIndex` is 0-indexed (0=level 1), but `everyLevels` is
configured in 1-indexed terms (e.g., "break every 3 levels" means after levels
3, 6, 9).

With `everyLevels = 3`:

- Level 3 → levelIndex 2 → `2 % 3 ≠ 0` → **NO BREAK** ❌ (should break after
  level 3)
- Level 4 → levelIndex 3 → `3 % 3 = 0` → **BREAK** ❌ (one level too late)

**Fix applied:** Changed to
`(t.levelIndex + 1) % t.breakConfig.everyLevels === 0`, which correctly fires
after levels 3, 6, 9 (levelIndex 2, 5, 8).

---

### 🆕 T3-PATCHED (L): computePayouts with 0 finishers — **PATCHED**

**File:** `apps/casin8-games/core-logic/holdem-tournaments/index.mjs` line 513

If `t.status === 'complete'` but 0 players have `finishPosition` set (data
corruption edge case), the function silently returned empty payouts — the entire
prize pool was undistributed (chips vanish). No crash, no error.

**Fix applied:** Added guard at top:
`if (entries.length === 0) throw new Error('No players with finishPosition — cannot compute payouts');`

---

### 🆕 S1-PATCHED (M): Same-identity multi-seat vulnerability in server.ts — **PATCHED**

**File:** `apps/poker-room/server.ts` lines 810-830

A player with identity "Alice" could occupy multiple seats by opening a new
browser tab while the old socket was still in the grace period. The `join`
handler creates a new `player-<new-socket-id>` for each socket connection, so
different sockets get different playerIds. Since the holdem-engine's NF1 check
only prevents duplicate playerIds (not duplicate identities), a single human
player could sit at two seats simultaneously.

**Fix applied:** Added identity-based duplicate check in the `join` handler:
before seating a new player, iterate `socketToPlayer` entries and check if any
existing entry has the same `identity`. If found, reject the join and emit a
`reclaim_seat` event. Also added `identity` field to `socketToPlayer` entries.

---

## PREVIOUSLY DOCUMENTED FINDINGS — VERIFICATION STATUS

| Finding                                        | Status          | Notes                                                                          |
| ---------------------------------------------- | --------------- | ------------------------------------------------------------------------------ | --- | ------------- |
| NC1 (board card truncation)                    | ✅ Patched      | `engineToGameState` correctly slices boardCards by street                      |
| NC2 (straddle lastAggressiveDelta)             | ✅ Patched      | Uses `hand.currentBet` for full straddle amount                                |
| NE1/NE2 (actedSinceAggression on short raises) | ✅ Patched      | Both raise and allin branches reset to `liveSeatNos.filter(s => s === seatNo)` |
| NEW-1 (52-card integrity check)                | ✅ Patched      | `buildDeck()` has runtime assertion                                            |
| NEW-2 (disconnect grace race)                  | ✅ Patched      | Re-checks `connected !== false` in timer callback                              |
| NEW-3 (board card slicing crash)               | ✅ Patched      | Street-aware `.slice()` + `.filter(Boolean)`                                   |
| NEW-4 (addon price units)                      | ✅ Patched      | Uses `t.addon.addonPriceUnits                                                  |     | t.buyInUnits` |
| NEW-5–9 (minRaise updates)                     | ✅ Patched      | bet, raise, allin, straddle all update minRaise; resetStreet resets it         |
| NEW-10 (rebuy price units)                     | ✅ Patched      | Uses `t.rebuy.rebuyPriceUnits                                                  |     | t.buyInUnits` |
| C2 (heads-up blind posting)                    | ✅ Patched      | Heads-up branch: `sbSeatNo = hand.buttonSeat`                                  |
| C5 (rebuy chip count check)                    | ✅ Patched      | `if (p.chips > t.startStack) throw`                                            |
| H1 (alphabetical seat assignment)              | ✅ Patched      | SHA-256 seeded shuffle (now also with rejection sampling)                      |
| H4 (WebSocket auth)                            | ✅ Present      | Socket.IO middleware checks identity                                           |
| H5 (burn cards)                                | ✅ Patched      | `dealHoldemCards` burns before flop/turn/river                                 |
| M2 (hardcoded lobby stats)                     | ⚠️ Not verified | Outside engine scope                                                           |
| M3/M4 (frontend validation)                    | ⚠️ Not verified | Outside engine scope                                                           |
| M8 (double pot collection)                     | ✅ Resolved     | server.ts uses holdem-engine integration                                       |
| Pitfall 30 (actionTimeout uses seat)           | ✅ Patched      | Both paths use `playerId`                                                      |
| Pitfall 21 (mid-hand unseat)                   | ✅ Patched      | Guarded by `hand.settled` check                                                |

---

## TDA RULE COMPLIANCE CHECKLIST — FINAL STATUS

| Rule   | Description                        | Status                                        |
| ------ | ---------------------------------- | --------------------------------------------- |
| TDA 2  | Heads-up: button posts SB          | ✅                                            |
| TDA 30 | Random/fair table balancing        | ✅ (seeded shuffle + rejection sampling)      |
| TDA 40 | Table balancing (≤1 difference)    | ✅ (round-robin distribution)                 |
| TDA 42 | Short all-in doesn't reopen action | ✅                                            |
| TDA 43 | Min-raise = max(prev raise, BB)    | ✅ (all aggressive actions update minRaise)   |
| TDA 66 | Only non-folded players show cards | ✅                                            |
| TDA 73 | Odd chip to closest left of button | ✅ (clockwise sort from button)               |
| —      | Crypto RNG for shuffle             | ✅ (SHA-256 PRNG + rejection sampling)        |
| —      | Burn cards before community cards  | ✅                                            |
| —      | 52-card deck integrity             | ✅ (runtime assertion)                        |
| —      | No duplicate playerIds             | ✅ (NF1 patched)                              |
| —      | Side pots for all-in scenarios     | ✅ (computeSidePots with dead money handling) |
| —      | Action timeout (25s)               | ✅ (server.ts implementation)                 |
| —      | Disconnect grace period (30s)      | ✅ (with race condition guard)                |
| —      | Idempotent actions                 | ✅ (hand.street included in key)              |

---

## FILES MODIFIED

1. `apps/casin8-games/core-logic/holdem-engine/index.mjs` — NF1 (duplicate
   playerId), NF4 (dead money edge case)
2. `apps/casin8-games/core-logic/holdem-tournaments/index.mjs` — NF2 (modulo
   bias), T1 (lateReg.open), T2 (break off-by-one), T3 (0-finishers guard)
3. `apps/poker-room/server.ts` — NF3 (stale hand closure), S1 (same-identity
   multi-seat)

---

## REMAINING ISSUES (not patched — require architectural decisions)

1. **addOnPlayer multi-level skip**: If `advanceTournamentClock` jumps past both
   `addon.level` and `addon.level + 1`, add-on becomes impossible. The comment
   claims the fix handles skipped levels but it only handles the exact
   `level + 1` break case. **Severity:** Low (requires unusual clock advance).

2. **PokerTechnician.mjs uses Math.random**:
   `this.agentId = 'poker-tech-${Math.random().toString(36)...}'` and
   `Math.random() > 0.5` for recommendations. **Severity:** Low (cosmetic agent,
   not game-critical path).

3. **No ICM chop/deal support**: Standard tournaments allow deal-making at final
   table. **Severity:** Medium (feature gap, not a bug).

4. **No hand-for-hand play**: When approaching the bubble, tables should play
   hand-for-hand to prevent stalling. **Severity:** Medium (tournament
   fairness).

5. **No time-bank system**: Players have no extra time bank for difficult
   decisions. **Severity:** Low (UX feature).

---

## DEPLOYMENT NOTES

All three modified files require redeployment:

- **holdem-engine/index.mjs**: No build step needed (pure ESM .mjs). Cloud Run
  redeploy if server.js imports it.
- **holdem-tournaments/index.mjs**: No build step needed. Cloud Run redeploy if
  used.
- **poker-room/server.ts**: Requires `pnpm --filter poker-room build` then
  Cloudflare Pages deploy.

Verify with health checks after deploy (use Python urllib for `.run.app`
endpoints per Pitfall #15).
