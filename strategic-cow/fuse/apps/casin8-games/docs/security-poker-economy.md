# Security Poker Economy Threat Model + Mitigations

## Scope

- Poker-only economy rails for buying/holding/withdrawing platform token units.
- Fiat ingress via Stripe/PayPal webhooks into on-platform cashier ledger.
- Agent sponsorship pools and sponsor payout settlements.

## Assets

- Player balances (`available/reserved/pendingWithdrawal`).
- Payment orders and webhook event processing state.
- Sponsorship principal, markup, settlement, and sponsor claim balances.
- API credentials (admin/risk/compliance role tokens, webhook secrets).

## Trust Boundaries

- Browser/app client -> API.
- API -> payment provider webhook callbacks.
- API -> chain RPC settlement checks.
- Internal privileged operations (`/api/compliance/*`, `/api/risk/*`).

## Primary Threats

1. Forged payment webhooks minting fake deposits.
2. Webhook replay causing duplicate credits.
3. Unauthorized mutation of compliance/risk state.
4. Geo/KYC bypass for fiat flow.
5. Velocity abuse and bot-driven cashier attacks.
6. Sponsorship payout manipulation or duplicate settlement crediting.
7. Secret leakage and over-privileged API access.

## Implemented Mitigations

- HMAC webhook verification with timestamp skew checks.
- Replay protection keyed by provider `eventId`.
- Idempotent ledger writes for deposits/reserve/settle/withdraw.
- Role-gated privileged endpoints with token-role mapping (`CASIN8_API_TOKENS`).
- KYC/geo/AML/velocity controls before fiat-intent and cashier critical actions.
- Risk alert stream for blocked/reviewed transactions.
- Deterministic sponsorship settle-and-credit idempotency keys per
  `(positionId,eventId,sponsorId)`.
- Persistent risk DB tables with migration support and restart-safe
  replay/velocity state.
- Sponsorship abuse controls (cooldown, daily count/volume caps, wash-sponsoring
  block).

## Residual Risks

- Provider-side webhook signature verification is simplified HMAC mode in this
  implementation.
- No external WAF/device fingerprint/risk-scoring provider integration yet.
- Cashier and risk persistence is file-backed; production should migrate to
  managed database HA.

## Smart Contract Review Checklist (Custody/Escrow/Rake/Tournament Pools)

- Ownership and upgrade controls: timelock + multi-sig required.
- Escrow invariants: no withdrawal path can exceed credited balances.
- Rake math: deterministic, bounded, and integer-safe for all stake sizes.
- Tournament pool accounting: sum(entries) == sum(prizes+rake+refunds).
- Reentrancy and callback surfaces guarded for token transfers.
- Flash-loan and intra-block manipulation vectors reviewed on payout paths.
- Event completeness for audit trails (join, buy-in, payout, rake, refund,
  emergency actions).
- Pausable emergency controls with explicit resumption process.
- Independent audit before production custody.

## Environment Secrets Required

- `CASIN8_STRIPE_WEBHOOK_SECRET`
- `CASIN8_PAYPAL_WEBHOOK_SECRET`
- `CASIN8_API_TOKENS` (JSON or compact map)
- Optional risk tuning:
  - `CASIN8_BLOCKED_COUNTRIES`
  - `CASIN8_ALLOWED_COUNTRIES`
  - `CASIN8_AML_SINGLE_TX_UNITS`
  - `CASIN8_AML_DAILY_UNITS`
  - `CASIN8_VELOCITY_WINDOW_MS`
  - `CASIN8_VELOCITY_MAX_TX`
  - `CASIN8_VELOCITY_MAX_UNITS`
