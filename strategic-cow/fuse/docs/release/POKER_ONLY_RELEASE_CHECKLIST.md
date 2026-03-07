# Poker-Only Release Checklist

## Scope Lock

- [ ] `apps/ai-arcade/src/services/ArcadeService.ts` keeps
      blackjack/roulette/slots disabled.
- [ ] UI navigation and cards expose only poker for Casin8 launch.
- [ ] Any non-poker launch URLs are commented or filtered out.

## Security + Auth

- [ ] `.data` runtime files are not committed (except sanitized fixture if
      intentionally tracked).
- [ ] Rotate any previously exposed local seeds/tokens before production launch.
- [ ] `/api/payments/intent` rejects unauthenticated requests (`401`/`403`).
- [ ] `/api/payments/order` rejects unauthenticated requests (`401`/`403`).

## CI + Quality Gates

- [ ] `Poker QA` workflow installs dependencies and passes.
- [ ] `Traits Intelligence Nightly` workflow installs dependencies and passes.
- [ ] `apps/ai-arcade` typecheck passes
      (`pnpm -C apps/ai-arcade exec tsc --noEmit`).
- [ ] `apps/ai-arcade` build passes (`pnpm -C apps/ai-arcade run build`).
- [ ] `apps/casin8-games` tests pass
      (`cd apps/casin8-games && node --test *.test.mjs swarm/*.test.mjs`).

## Runtime Validation

- [ ] Server boot succeeds even when optional swarm modules are missing.
- [ ] Poker session flow works: connect -> play -> ledger -> reveal/rotate.
- [ ] No regressions in payment/compliance/risk endpoints.

## Deploy + Rollback

- [ ] Tag release commit for poker-only launch.
- [ ] Capture deployed commit SHA and workflow run URLs.
- [ ] Rollback command/path documented in deploy channel before cutover.

## Post-Deploy Watch

- [ ] Monitor error rates on `/api/play`, `/api/payments/*`, and
      `/api/v2/holdem/*`.
- [ ] Confirm no traffic reaches disabled non-poker routes.
- [ ] Log first 24h incidents and feed into next patch release.
