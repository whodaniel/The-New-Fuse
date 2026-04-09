# Payments and Token Flow

## End-to-End Fiat -> Token -> Play

1. Client creates payment intent via `POST /api/payments/intent` with provider
   (`stripe|paypal`) and token target units.
2. Server runs compliance/risk checks (KYC, geo, AML, velocity).
3. Order stored in `paymentOrders` with status `requires_payment`.
4. If provider credentials are configured, server creates live provider objects:
   - Stripe PaymentIntent
   - PayPal Checkout Order Otherwise server falls back to mock checkout mode.
5. Provider webhook posts completion event to:
   - `POST /api/payments/webhook/stripe`
   - `POST /api/payments/webhook/paypal`
6. Server verifies webhook HMAC signature + timestamp.
7. Server normalizes provider event shape and fraud indicators.
8. Server enforces replay protection by persisted `eventId`.
9. Server posts token units to cashier ledger as idempotent deposit.
10. Wallet balances available via `GET /api/cashier/wallet`.

## Cashier Token Accounting

- `availableUnits`: spendable balance.
- `reservedUnits`: in-play reserved buy-ins.
- `pendingWithdrawalUnits`: requested withdrawals awaiting finalization.

## Key Cashier Operations

- Deposit: `POST /api/cashier/deposit`
- Reserve buy-in: `POST /api/cashier/reserve`
- Settle hand/tourney result: `POST /api/cashier/settle`
- Withdraw request/finalize:
  - `POST /api/cashier/withdraw-request`
  - `POST /api/cashier/withdraw-finalize`

## Sponsorship Economy Flow

1. Open position: `POST /api/sponsorships/open`
2. Fund by sponsors: `POST /api/sponsorships/fund`
3. Close funding: `POST /api/sponsorships/close`
4. Settle and credit sponsors in one atomic server operation:
   - `POST /api/sponsorships/settle-and-credit`
5. Sponsor claims also supported via:
   - `POST /api/sponsorships/claim`
6. Marketplace + productized sponsor APIs:
   - `GET /api/sponsorships/marketplace`
   - `POST /api/sponsorships/one-click-fund`
   - `GET /api/sponsorships/sponsor-analytics`

## Operational Notes

- All mutation endpoints rely on idempotency keys where value transfer occurs.
- Risk alerts can be queried with `GET /api/risk/alerts` (role-gated).
- Compliance profile management:
  - `POST /api/compliance/upsert`
  - `GET /api/compliance/status`
- DB persistence and migration tooling:
  - `node scripts/db/migrate-risk-db.mjs`
  - `node scripts/db/backfill-risk-db.mjs`
