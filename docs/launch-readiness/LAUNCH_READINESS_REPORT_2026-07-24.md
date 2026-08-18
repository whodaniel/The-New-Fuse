# TNF Launch Readiness Report — 2026-07-24

Evidence-based assessment produced while driving public-launch readiness. Every
line below was verified against the live repo / Cloud Run, not assumed.

## Verdict

**Not yet public-launch ready.** Two hard blockers, both operator-only. The
codebase, build, and live services are otherwise healthy. The source repo is
currently **private**, which is the only thing containing the outstanding
exposure — do not flip it public until Blocker 2 is resolved.

---

## 🔴 Blockers (must clear before public launch)

### 1. Leaked Supabase DB password is still the LIVE production credential

- The originally-leaked Supabase database password is still present in the env
  of **all four** Cloud Run services (`api-server`, `backend`, `relay-server`,
  `api-gateway`) — verified via `gcloud run services describe`.
- Local `.env` files were scrubbed to a `<ROTATED_PASSWORD>` placeholder, but
  the actual credential was **never rotated at Supabase** — prod is healthy
  precisely because it is still running on the old, exposed password.
- Contrast: the Upstash token and `SHAREDSTATE_AUTH_TOKEN` **were** properly
  rotated (old values absent from prod). Only the DB password remains.
- **Action (operator):** reset the `postgres` password in Supabase, then sync to
  Cloud Run (runbook below). This is the real close-out of the credential leak.

### 2. Git history still contains leaked secrets + personal PII

- The repo is currently **private**, so exposure is contained. But the git
  **history** still holds: the original leaked credentials, and 42 now-untracked
  personal-data files (`data/private/` email-archaeology backups for
  owner-daniel, mailbox/emlx references, private task ledgers).
- Untracking (done this session) stops _future_ exposure only. **Making the repo
  public would re-expose all of it from history.**
- **Action (operator decision):** either keep source private and launch the app
  publicly, or purge history (`git filter-repo`) before any public flip. Treat
  all historically-exposed values as compromised regardless.

---

## 🟡 Review / recommended before launch

- **`api-gateway` /health returns 000** — no response at that path. Confirm the
  gateway health route / that it is serving (api-server `/health` returns 200).
- **GitHub secret scanning + push protection: not enabled** on the repo. Enable
  before it ever goes public (and ideally now).
- **3 email methodology docs** still tracked (`docs/library/EMAIL_*.md`) —
  flagged by the privacy guard on `emlx`/`mailbox` keywords. They contain **no**
  real email addresses (methodology only). Your call: untrack, redact, or
  accept.
- **6 `data/wiki-inbox/video-analysis-*.json`** flagged by the privacy guard —
  appear to be YouTube-curator output, not PII. Review or allowlist in the
  guard.
- **This session's commits** are on `fix/a2a-signature-verification`, not merged
  to `main`. Open a PR when ready.
- **Local `apps/api/.env` `DATABASE_URL`** still shows the `<ROTATED_PASSWORD>`
  placeholder — fill with the new password after rotation (operator; it's a
  secret).

---

## ✅ Verified healthy

- **Repo secret sweep** (`pnpm secret:sweep:repo`): clean — no high-risk secrets
  tracked.
- **Release gate** (quick): PASSED — env baseline, clean-room Docker boundary,
  local-runtime boundary, critical UI de-mock checks all green.
- **api-server type-check**: 0 TypeScript errors.
- **10 Cloud Run services live**; `api-server /health` → 200; `thenewfuse.com`
  → 200.
- **Local env hygiene**: no leaked secret bodies in tracked/live env files;
  ai-arcade Supabase anon key re-synced to the new publishable key.
- **Repo hygiene** (this session): personal PII untracked + gitignored;
  Railway-era scripts separated to a private archive repo;
  `CLOUD_MIGRATION_BLUEPRINT.md` restored.

---

## Operator runbook (commands you run — they carry secret values)

### A. Rotate the Supabase DB password and sync to Cloud Run

1. Supabase dashboard → Project Settings → Database → reset the `postgres`
   password.
2. Build the new `DATABASE_URL` (URL-encode special chars in the password).
3. Update each service (merges env, does not replace):
   ```bash
   source scripts/lib/tnf-cloud-run.sh
   for svc in api-server backend relay-server api-gateway; do
     tnf_cloud_run_update_env "$svc" "DATABASE_URL=<new-url>"
   done
   ```
4. Paste the same value into local `apps/api/.env` (and any other consumer).
5. Verify:
   `gcloud run services describe api-server --project=the-new-fuse-2025 \ --region=us-central1 --format=json | jq '.status.conditions'`
   → Ready=True.

### B. Enable GitHub security controls

```bash
gh api -X PATCH repos/whodaniel/The-New-Fuse \
  -f security_and_analysis[secret_scanning][status]=enabled \
  -f security_and_analysis[secret_scanning_push_protection][status]=enabled
```

### C. If making source public — purge history first

Use `git filter-repo` to remove the leaked-secret blobs and `data/private/**`,
then force-push. Coordinate (this rewrites history). Confirm scope before
running.
