Design a complete, production-ready, multiplayer crypto casino application
called "Casin8" with cohesive end-to-end UX for all core games and all shared
app systems.

Business and product constraints (non-negotiable):

- This is a fully featured multiplayer poker-first platform (NOT video poker).
- All gameplay, betting, buy-ins, payouts, jackpots, and fees use the native
  Casin8 token.
- Users can acquire the native token via fiat on-ramp providers represented as
  Stripe/PayPal-style rails.
- Build in the style of real-money cash game platforms with tournament depth and
  high-trust operations.

Aesthetic direction:

- Harmonize with ai-arcade.xyz worldbuilding while evolving it to a richer, more
  technical premium product aesthetic.
- Dark cinematic foundation with lush detail and depth.
- Controlled royal palette in same tonal range: royal red, royal blue, royal
  purple, royal gold.
- Accent data/health signals with emerald and cyan.
- Use glassmorphism layers for HUD/panels with clean boundaries and readable
  typography.
- Space-tech / cyborg / bot operator motifs, but never cluttered or gimmicky.
- Avoid cartoon styling and avoid neon overload.

Use these reference patterns as style anchors:

- Slots sequence quality and consistency from "Nebula Gold" style states: idle,
  spinning, big win, free spins, lobby.
- System-wide trust/operations surfaces: session & risk controls, sync/recovery,
  wallet/ledger, cashier history and pending states.
- Multiplayer poker state storytelling: waiting, hero turn, all-in, connection
  alert.
- Tournament lobby depth: all-view + progressive detail cards.

Generate the full app screen system in one cohesive family:

1. Global App Shell (desktop + mobile)

- Header: brand, wallet/token balance, chain/network, latency.
- Left rail (desktop) + bottom tabs (mobile): Poker, Tournaments, Roulette,
  Blackjack, Slots, Wallet, Cashier, Trust.
- Right utility rail (desktop) / bottom-sheet tabs (mobile): fairness, receipts,
  ledger, health, multiplayer events.
- Persistent action zone for context-sensitive controls.
- Global status chips for API, stream, and chain health.

2. Multiplayer Poker (core focus)

- Cash table screens (6-max): waiting, hero turn, all-in showdown, reconnecting.
- Tournament table variant with blind level, payout ladder context, and player
  count.
- Table elements: seats, stacks, dealer button, blinds, action timer ring, pot +
  side pots.
- Hero controls: fold/check/call/raise slider + quick token chips.
- Community cards with premium treatment and clear readability.
- Multiplayer feed: joins/leaves/actions.
- On-chain settlement strip and fairness micro-panel.

3. Tournament Ecosystem

- Tournament lobby: All, MTT, Sit & Go, Progressive, Satellite filters.
- Tournament card anatomy: token buy-in, entrants, pool, late reg, blind level,
  status.
- Progressive pool meter cards and special event highlights.
- Registration, waitlist, seat reservation, and lock states.

4. Roulette

- Main stage command-center variant + focused mobile variants.
- States: idle, placing bets, spinning (bets locked), payout result, service
  alert.
- Inside/outside betting board clarity and chip controls.
- Last spins ribbon and outcome visualization.

5. Blackjack

- Dealer + player lanes, hit/stand/double/split/insurance controls.
- States: idle, active hand, resolution (win/lose/push), reconnecting.
- Mobile and desktop layouts with consistent style language.

6. Slots

- Complete slots surface system:
  - lobby, idle, spinning, small/big/mega win, free spins HUD, rules/paytable.
- 3-reel and 5-reel layout variants.
- Token-denominated bet controls, turbo/autospin, and clear lock states.

7. Cashier / On-Ramp (critical)

- Buy native token flow with provider selection, fees, estimated receive,
  confirmation.
- Pending/confirmed/failed transaction states.
- History list with filters and receipt expansion.
- Compliance/security notices and anti-fraud reassurance.

8. Wallet / Ledger

- Balance summary, session PnL, game-by-game breakdown.
- Ledger with filters by game/table/tourney/provider/status.
- Tx lifecycle states and explorer-link placeholders.
- Progressive contribution/payout trace lines.

9. Trust / Provably Fair Center

- Commit-reveal explainer and verification inputs.
- Seed hash, client seed, nonce, digest verification result.
- Copy/export receipt JSON patterns.
- Integrity badges and incident-safe states.

10. Session, Risk, and Recovery

- Session limits and risk controls.
- Connection degraded/reconnect queue UX.
- Duplicate-action prevention and state reconciliation.
- Chain mismatch and insufficient token balance flows.

11. Shared Component + Design System Deliverable

- Tokenized color, type, spacing, radius, shadow, blur, border scales.
- Component states: default/hover/focus/active/disabled/loading/error/success.
- Motion system with reduced-motion alternatives.
- Numeric and data typography optimized for betting interfaces.

Accessibility and UX standards:

- High contrast, keyboard focus visibility, large touch targets.
- Clear hierarchy under stress conditions (spins, all-ins, payout moments).
- No critical controls hidden behind decorative surfaces.

Output expectation:

- Deliver a complete multi-screen design system with both desktop and mobile
  adaptations.
- Maintain strict visual cohesion across all games and shared app screens.
- Ensure enterprise-grade trust clarity while preserving premium sci-fi
  atmosphere.
