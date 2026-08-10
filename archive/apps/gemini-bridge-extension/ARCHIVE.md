# Archived: apps/gemini-bridge-extension (2026-08-09)

## Why archived

Lagging twin of **Fuse Connect** (`apps/chrome-extension`). Boundary already
marked it legacy / superseded by Fuse Connect V7.

Deep-diff of `src/` (2026-08-09):

| Metric | Count |
| --- | --- |
| Chrome `src` files | 207 |
| Gemini `src` files | 199 |
| Identical (SHA-256) | 148 |
| Content differs | 41 (mostly `_legacy` / `v5` / early `v6`) |
| Only in chrome | 18 (federation identity, progressive self-prompter, `.ts` ai-studio, tests) |
| Only in gemini | 10 (ai-studio `.js` twins already ported to `.ts` in chrome + PokerTechnician) |

Chrome is strictly ahead on federation identity, TypeScript ai-studio services,
and channel-neutrality tests. README text was nearly identical ("The New Fuse -
Chrome Extension").

## Unique capability check

| Capability | Status |
| --- | --- |
| Fuse Connect V6/V7 product path | **Live in** `apps/chrome-extension` |
| ai-studio services (`.js` in gemini) | **Chrome has `.ts` equivalents** — do not re-merge `.js` |
| `PokerTechnicianService` | Gemini-only niche optional activator; **not absorbed** into chrome (restore from this archive if product wants it) |
| Nested `aivi/` (~6MB) | Also present under chrome; shared duplication remains a chrome cleanup item |

## Prefer instead

```text
apps/chrome-extension
```

## Restore (only if needed)

```bash
mv archive/apps/gemini-bridge-extension apps/gemini-bridge-extension
```

Then re-add to `data/distribution/oss-app-boundary.json` satellites and
`scripts/sync-repos.sh` `ALWAYS_EXCLUDE`. To revive Poker Technician only,
copy:

```text
archive/apps/gemini-bridge-extension/src/v6/services/PokerTechnicianService.ts
```

into `apps/chrome-extension/src/v6/services/` and wire an opt-in toggle.
