# Risk DB Operations

## Overview

`riskdb.json` is the persistent store for:

- compliance profiles
- payment orders
- webhook replay ledger
- velocity events
- risk alerts
- sponsorship positions
- funding abuse counters

Location:

- `apps/casin8-games/.data/riskdb.json`

## Migrations

Run:

```bash
node scripts/db/migrate-risk-db.mjs
```

The migration runner applies versioned schema upgrades from `risk-db.js` and
outputs current table counts.

## Backfill

Run:

```bash
node scripts/db/backfill-risk-db.mjs
```

Backfill sources:

- `.data/state.json` sessions -> compliance seed rows
- `.data/state.json` table events -> baseline risk alert rows when error-like
  event types are detected

## Incident Audit Queries

- See
  [risk-incident-audit-query-pack.sql](/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/casin8-games/docs/risk-incident-audit-query-pack.sql)

## Notes

- Cashier idempotency remains enforced at mutation boundaries.
- Webhook replay checks survive process restart via persisted `webhook_events`.
- Velocity checks use persisted `velocity_events` and support
  daily/rolling-window AML checks.
