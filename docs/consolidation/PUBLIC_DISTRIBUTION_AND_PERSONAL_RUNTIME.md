# Public Distribution vs Personal Runtime

> **Goal:** Ship a clean `fuse-open-runtime` for the public, while keeping your
> Mac free of duplicate emergency copies and confusing legacy trees.

## Two audiences, two surfaces

| Audience           | What they get                                   | Where it lives                                |
| ------------------ | ----------------------------------------------- | --------------------------------------------- |
| **Public**         | Open runtime (~90%), stubs at proprietary paths | `fuse-open-runtime` via `pnpm run sync:repos` |
| **You (operator)** | Full monorepo + local voice + `~/.tnf` runtime  | `The-New-Fuse` on disk                        |

Public users do **not** need voice bridge, `~/bin` copies, or emergency `~/apps`
stubs.

---

## Public distribution readiness

| Gate                                 | Command                                                           | Status (2026-06-22)           |
| ------------------------------------ | ----------------------------------------------------------------- | ----------------------------- |
| No proprietary leakage in OSS export | `pnpm run lineage:verify-export`                                  | **PASS**                      |
| Leakage scan                         | `pnpm run lineage:check-leakage`                                  | Run before release            |
| Repo parity                          | `docs/lineage/REPO_LINEAGE.md`                                    | Lineage archives **PASS**     |
| Release gates                        | `docs/release-readiness/CHECKLIST_V1_PUBLIC_RELEASE_READINESS.md` | Cloud deploy items still open |

**What ships publicly (core):**

- `apps/api`, `apps/api-gateway`, `apps/frontend`, `apps/relay-server`,
  `apps/backend` (stub orchestrator in OSS)
- `packages/*` (with proprietary files stubbed)
- `scripts/system/` — optional operator voice tools (included in OSS; not
  required to run hosted app)

**Excluded from public sync (`ALWAYS_EXCLUDE` + proprietary lists):**

- `.env`, `.env.local`
- `voice-bridge-package-20260325/` — removed from tree; was duplicate snapshot
- Proprietary apps: `nexus-orchestrator`, `picoclaw-overseer`, orchestrator
  module, etc.

**Optional in monorepo, not core product:** `apps/audio-trigger-kws-mvp`
(pilot), `casin8-games`, `poker-room` (demos).

---

## Personal machine: keep vs remove

### Keep

| Path                                      | Why                                                   |
| ----------------------------------------- | ----------------------------------------------------- |
| `~/Desktop/A1-Inter-LLM-Com/The-New-Fuse` | Canonical dev checkout                                |
| `~/.tnf/`                                 | Operator runtime (health, director loops, `tnf-boot`) |
| `The-New-Fuse/.voicebridge/`              | Voice stream + targets (if using voice)               |
| `~/.whisper-models/`                      | Local STT models (if using voice)                     |
| `~/bin/gh`, icloud*, pcloud*              | Personal utilities unrelated to TNF                   |

### Already removed (good)

| Path                         | Was                         |
| ---------------------------- | --------------------------- |
| `~/app`                      | Hermes emergency page stubs |
| `~/apps/*`                   | Emergency API/login copies  |
| `~/.openclaw/workspace/apps` | Merged into monorepo        |

### Remove or symlink (voice duplicates)

Do **not** maintain a second copy of voice tools in `~/bin`. Use one of:

```bash
# Recommended: ~/.tnf/bin symlinks to scripts/system
bash scripts/install-voice-bridge-symlinks.sh
export PATH="$HOME/.tnf/bin:$PATH"

# Or full personal cleanup (dry-run first)
bash scripts/consolidation/personal-runtime-cleanup.sh
bash scripts/consolidation/personal-runtime-cleanup.sh --apply
```

Canonical voice source: **`scripts/system/`** only.

---

## Tidiness rules

1. **One dev tree** — `The-New-Fuse` (origin remote; historical slug
   `the-new-fuse-next-gen` redirects)
2. **One voice source** — `scripts/system/` (not `~/apps`, not
   `voice-bridge-package`)
3. **One PATH for voice** — `~/.tnf/bin` symlinks, not stale `~/bin` copies
4. **Public sync** — `pnpm run lineage:verify-export` then `pnpm run sync:repos`
5. **Voice optional** — `app.thenewfuse.com` works without `./tnf voice`

---

## Quick commands

```bash
# Public export check
pnpm run lineage:verify-export

# Personal drift
pnpm run voice:drift-audit
bash scripts/consolidation/personal-runtime-cleanup.sh

# Local product (no voice required)
pnpm run dev
```

See also:
[HOME_DIRECTORY_CONSOLIDATION_MANIFEST.md](./HOME_DIRECTORY_CONSOLIDATION_MANIFEST.md),
[REPO_SEPARATION.md](../REPO_SEPARATION.md).
