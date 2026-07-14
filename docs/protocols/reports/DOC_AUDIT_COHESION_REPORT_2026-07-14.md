# DOC AUDIT — Cohesion Report

`[CLASS:INTEL] [STATUS:PENDING]`

**Date:** 2026-07-14  
**Branch:** `tnf-cli-harness-implementation`  
**Head:** `befcc140e847`  
**Protocol path:** Inspect → Act → Verify (Act deferred pending operator confirm
on policy FAIL items)  
**Gating:** `TNF_DOCUMENT_VETTING_PROCEDURE` (Five Gates)

---

## 1. Universe definition

| Source                                       |   Count | Role                                 |
| -------------------------------------------- | ------: | ------------------------------------ |
| `DOC_AUDIT_INVENTORY.json` curated tiers A–E |  ~1,272 | Canon doc surface                    |
| Residual `*.md` in tree                      | ~8,000+ | Generated/scratch — **out of scope** |
| `.agent/skills/**/SKILL.md`                  |     545 | Skill corpus (separate pass)         |

**Artifacts this pass:**

- `docs/protocols/reports/DOC_AUDIT_INVENTORY.json`
- `docs/protocols/reports/DOC_AUDIT_GROUND_TRUTH.json`
- `docs/protocols/reports/DOC_AUDIT_TIER_A_FINDINGS.json`
- `docs/protocols/reports/DOC_AUDIT_TIER_BE_FINDINGS.json`
- this report

---

## 2. Ground truth (verified)

| Fact          | Value                                                                                                           |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| Origin remote | `https://github.com/whodaniel/The-New-Fuse.git`                                                                 |
| Other remotes | `old-fuse`, `private-origin`, `split-open-runtime`, `split-control-plane`, `split-mirror`, `nexus-orchestrator` |
| Root package  | `the-new-fuse` · `pnpm@10.22.0`                                                                                 |
| `.nvmrc`      | **v20.20.2**                                                                                                    |
| Packages      | 91 dirs · 75 with `package.json` · **46 with README** · **32 missing README**                                   |
| Apps          | 29 dirs · 22 with `package.json` · **19 with README** · **7 missing README**                                    |
| Root scripts  | 374 (incl. `dev`, `release:gate`, `sync:repos`, `sync:repos:dry-run`)                                           |
| Root LICENSE  | **MIT** (2026 The New Fuse Contributors)                                                                        |

---

## 3. Pass 1 — Tier A (truth surface)

### PASS / OK (examples)

- `README.md` clone URL matches `origin` → `whodaniel/The-New-Fuse`
- Primary workspaces exist: `apps/frontend`, `apps/api`, `apps/api-gateway`,
  `packages/tnf-cli`, `packages/relay-core`
- Referenced scripts and env/docs paths exist
- `pnpm 10+` matches `packageManager`
- Root `LICENSE` is MIT

### FAIL (must fix — policy or factual)

| ID  | Severity | Files                                              | Finding                                                                                                                                                                                                                                       |
| --- | -------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | FAIL     | `README.md` vs `GITHUB_README.md`                  | License narrative conflict: README says do not assume monorepo is final OSS artifact / defer to downstream; `GITHUB_README.md` badges this repo as MIT. Root `LICENSE` is MIT — narratives must be unified.                                   |
| A2  | FAIL     | `GITHUB_README.md` vs `.nvmrc`                     | Badge claims **Node.js 22+**; `.nvmrc` is **v20.20.2**.                                                                                                                                                                                       |
| A3  | FAIL     | `GITHUB_README.md` vs `packages/core`              | Markets `import { Agent, Harness, MCPClient } from '@the-new-fuse/core'` as installable API. Package name `@the-new-fuse/core` exists, but `packages/core/src/index.ts` does **not** export the marketed `Harness` / quick-start API surface. |
| A4  | FAIL     | `docs/REPO_SEPARATION.md`, `scripts/sync-repos.sh` | TL;DR / comments still name combined monorepo `whodaniel/the-new-fuse-next-gen`; actual origin is `whodaniel/The-New-Fuse`.                                                                                                                   |
| A5  | FAIL     | `docs/REPO_SEPARATION.md`                          | Two `###` headings both titled `whodaniel/The-New-Fuse` (combined monorepo **and** open-runtime minus proprietary) — identity collision with `fuse-open-runtime`.                                                                             |

### WARN

| ID  | Files       | Finding                                                                                                                                   |
| --- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| A6  | `AGENTS.md` | References `SOUL.md` at repo-root style paths; actual file is `.agent/SOUL.md`. `SKILLS.md` / `MEMORY.md` not found at stated root paths. |

**Note:** GitHub renders `README.md`, not `GITHUB_README.md`. Drift between the
two is especially dangerous because marketing copy in `GITHUB_README.md` may be
treated as canon by agents while humans see `README.md`.

---

## 4. Pass 2 — Tier B protocols (header gate)

Scanned **135** files under `docs/protocols/` (inventory `B_protocols`).

| Metric                           |  Count |
| -------------------------------- | -----: |
| With `[CLASS]`/`[STATUS]` header |     40 |
| **Missing header (Gate 3 fail)** | **95** |
| CLASS PRIME                      |     30 |
| CLASS INTEL                      |      9 |
| CLASS none                       |     96 |
| STATUS LOCKED                    |     24 |
| STATUS none                      |     99 |

**Implication:** Tagging protocol (`TNF_DOCUMENT_TAGGING_PROTOCOL`) is not
applied consistently across the protocol library. Before LOCKED content can be
treated as gateable, headers must be backfilled or deliberately classified as
exempt (templates/ledgers).

Sample missing headers: `AGENT_STATUS_LEDGER.md`, `TNF_BOOK_OF_AXIOMS.md`,
`SESSION_HANDOFF_ENFORCEMENT.md`, `TNF_ENVIRONMENT_ADAPTER.md`, …

---

## 5. Pass 4 — Tier E package/app READMEs

| Surface   | Missing README | Name absent from README | Name present (OK) |
| --------- | -------------: | ----------------------: | ----------------: |
| packages/ |             32 |                       8 |                35 |
| apps/     |              7 |                      11 |                 4 |

Cohesion gap: nearly half of packages lack a README; most app READMEs do not
state the npm package name.

---

## 6. Skills note

`.agent/skills` contains **545** `SKILL.md` files. Not claim-verified in this
pass. Recommend separate Pass S: inventory skill names vs CLI/commands/agents
that reference them (dead skills / orphan commands).

---

## 7. Recommended Act sequence (operator confirm)

**Do not mix with the current dirty tree commit** (logs, vitest cache, turbo,
dist, submodule noise). Split work:

### Act batch 1 — factual doc fixes (no policy ambiguity)

1. Replace `the-new-fuse-next-gen` → `The-New-Fuse` in `docs/REPO_SEPARATION.md`
   TL;DR and `scripts/sync-repos.sh` header comments.
2. Disambiguate REPO_SEPARATION headings: combined = `The-New-Fuse`; published
   open artifact = `fuse-open-runtime`.
3. Align Node engine story: either bump `.nvmrc` to 22+ **or** change
   `GITHUB_README.md` badge to 20+ (verify engines fields in root `package.json`
   first).
4. Fix `AGENTS.md` path pointers to `.agent/SOUL.md` (and real MEMORY/SKILLS
   locations if any).

### Act batch 2 — policy decisions required

1. **License story:** Is the combined monorepo MIT end-to-end, or only the
   downstream open-runtime? Pick one narrative and sync `README.md` +
   `GITHUB_README.md` + `LICENSE`.
2. **GITHUB_README API demo:** Rewrite examples to APIs that actually export
   from `@the-new-fuse/core`, **or** implement/re-export the marketed surface,
   **or** mark `GITHUB_README.md` as non-canon / archive it if `README.md` is
   sole GitHub face.
3. **Protocol headers:** Batch Gate 3 backfill for the 95 untagged protocol
   files (classify PRIME vs INTEL vs template exemption).

### Act batch 3 — README coverage

- Generate minimal package/app README stubs only where package.json is real
  workspaces (not empty dirs), including canonical package name.

### Verify

- Re-run Tier A script → zero FAIL.
- Spot-check `pnpm run sync:repos:dry-run` still documents correct remotes.
- Emit fresh `SESSION_HANDOFF_LATEST` after Act batches land.

---

## 8. Explicit non-goals this pass

- Did **not** claim-verify all 983 Tier C docs line-by-line (requires multi-pass
  automation + human policy on ARCHIVE/PURGE).
- Did **not** commit the dirty working tree.
- Did **not** mutate LOCKED protocol bodies.

---

## 9. Verdict

**Docs are not cohesive.** Tier A alone has **6 FAIL** / **2 WARN**. Protocol
Gate 3 compliance is ~30%. Package README coverage is ~61% of dirs with
package.json-equivalent surfaces.

Next operator decision: approve **Act batch 1** (safe factual fixes), decide
**batch 2** policy items, then continue Tier C automated claim scanner.

---

## 10. Addendum — leaf surveys (2026-07-14; local recovery after subagent resource_exhausted)

Artifacts: `DOC_AUDIT_TIER_C_LEAF.json`,
`DOC_AUDIT_DIRECTIVES_SKILLS_LEAF.json`, `DOC_AUDIT_TIER_E_LEAF.json`,
`DOC_AUDIT_POLICY_CLASSIFICATION_2026-07-14.md`.

| Leaf              | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tier C            | 55 sampled across 273 docs/ subcats; full-C blast (first 8k/file): **8** `next-gen` slug hits, **9** legacy `fuse.git` clone refs, **2** Node 22 claims                                                                                                                                                                                                                                                                                                                                                             |
| Directives/skills | Canonical = `DIRECTIVES.md`; `TNF_DIRECTIVES` ARCHIVED correctly; **545** skills / **8**/25 sample with broken local path refs; `AGENTS.md` missing `SKILLS.md`/`MEMORY.md` at stated paths (`SOUL.md`→`.agent/SOUL.md` OK)                                                                                                                                                                                                                                                                                         |
| Tier E            | **32** pkg + **7** app missing README; name↔README gaps; **FAIL** `fairtable-adapters` README still says `airtable-adapters`; **FAIL** features command-palette imports nonexistent `@the-new-fuse/ui/command-palette`. Proprietary paths **exist** and match `PROPRIETARY_*` arrays. Material drift: missing `packages/control-plane-contracts`; doc still shows `electron-desktop` (GT has `tauri-desktop`); root `orchestrate-*.js` / `tnf-orchestrator*` listed but live under `scripts/registry/orchestrator/` |

**Conclusion:** Primary cohesion breaks are (1) rename debt
`the-new-fuse-next-gen`→`The-New-Fuse` (+ legacy `fuse.git` clone refs), (2)
marketing badges/API vs engines/exports, (3) Tier E README/name dishonest
claims + missing coverage, (4) separation doc stale paths
(`control-plane-contracts`, `electron-desktop`, root orchestrator scripts).
Ready for Act batch 1 on operator Go.
