# Private Content Protection Runbook

This runbook standardizes how TNF protects private user content, personal narratives, and business assets.

## 1. Non-Negotiable Rules

- Never commit user-private datasets to git.
- Never commit live secrets, tokens, or credential-bearing URLs.
- All private narrative data must live behind authenticated access and RLS.
- Public repo artifacts must only contain placeholders/examples for secrets.

## 2. Required Local Gates

Run before every push:

```bash
pnpm run privacy:guard:repo
pnpm run secret:sweep:repo
pnpm run supabase:rls:audit:strict
```

Hooks also enforce this on staged/push deltas:

- `.husky/pre-commit`: privacy guard + secret sweep + lint-staged
- `.husky/pre-push`: privacy guard + secret sweep on outgoing files

## 3. CI Enforcement

GitHub workflow:

- `.github/workflows/privacy-security-gate.yml`

It blocks merges when:

- private-path policy is violated
- high-risk secret patterns are found
- new Supabase public tables are introduced without RLS/policy coverage (baseline-aware)

## 4. Supabase Private Data Standard

For all user-authored stories/books/timelines:

- Use per-user ownership keys (`user_id` / `workspace_id`) on each row.
- Enable RLS for all public-schema tables.
- Add explicit `SELECT/INSERT/UPDATE/DELETE` policies scoped to owner/team.
- Explicitly grant Data API table privileges when needed; do not assume auto-exposure defaults for new tables.
- Keep service-role usage server-only (never in frontend env or client code).
- Store large/private artifacts in Supabase Storage buckets with path-level policy constraints.

## 5. Baseline-Managed RLS Audit

Current baseline file:

- `scripts/security/supabase-rls-baseline.json`

If schema intentionally changes:

```bash
pnpm run supabase:rls:audit
pnpm run supabase:rls:baseline:update
pnpm run supabase:rls:audit:strict
```

Review baseline diffs manually before commit.

## 6. Secret Rotation Procedure

If any secret appears in tracked files or pushed history:

1. Revoke/rotate immediately in provider dashboards.
2. Remove from tracked files.
3. Rewrite git history if the value was pushed.
4. Force-push sanitized history.
5. Re-run local + CI gates.
6. Record incident + rotated systems in private operations logs.

## 7. User Backup & Recovery Standard

For every TNF user:

- Daily encrypted backup export of narrative records.
- Immutable snapshot retention policy (minimum 30 days).
- Per-user restore manifest that maps timeline IDs to source records.
- Quarterly restore drills to validate recoverability.
