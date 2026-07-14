# DOC AUDIT — Policy Classification (Pass concurrent with leaf surveys)

`[CLASS:INTEL] [STATUS:PENDING]`

**Date:** 2026-07-14  
**Head:** `befcc140e847`  
**Companion:** `DOC_AUDIT_COHESION_REPORT_2026-07-14.md`

---

## 1. Ground-truth delta (this turn)

| Claim surface         | Advertised                           | Actual                                              | Verdict                                             |
| --------------------- | ------------------------------------ | --------------------------------------------------- | --------------------------------------------------- |
| Node                  | GitHub badge **22+**                 | `.nvmrc` **v20.20.2**; `engines.node` **>=20.20.0** | **FAIL** — badge wrong; engines + nvmrc agree on 20 |
| TypeScript            | Badge **5.4**                        | root `devDependencies.typescript` **^6.0.2**        | **FAIL**                                            |
| License               | README defers; GITHUB badges MIT     | Root `LICENSE` = MIT                                | **POLICY** — pick narrative                         |
| Monorepo slug         | `the-new-fuse-next-gen` (many docs)  | origin `The-New-Fuse`                               | **FAIL — systemic**                                 |
| Self-host clone       | `fuse-open-runtime` in GITHUB_README | remote `split-open-runtime` exists                  | **OK contingent** on sync script health             |
| package name          | `@the-new-fuse/core` in demos        | `packages/core` name matches                        | **OK name / FAIL API surface**                      |
| Directives canonicity | Two files with PROTOCOL ID           | See §2                                              | **Resolved structurally**                           |

Root scripts verified present: `release:gate` → `node scripts/release-gate.cjs`;
`sync:repos` / dry-run → `scripts/sync-repos.sh`.

---

## 2. Directives triad — classification (not a contradiction)

| File                                       | Role                          | Authority                                                     |
| ------------------------------------------ | ----------------------------- | ------------------------------------------------------------- |
| `docs/protocols/DIRECTIVES.md`             | **Canonical** full directives | Wins on conflict; Protocol ID `TNF_DIRECTIVES_CANONICAL`      |
| `docs/protocols/LIVING_DIRECTIVES_CARD.md` | One-page load card            | Explicitly defers to `DIRECTIVES.md`                          |
| `docs/protocols/TNF_DIRECTIVES.md`         | **ARCHIVED** archaeology      | Banner `[STATUS:ARCHIVED]` + `[SUPERSEDED-BY: DIRECTIVES.md]` |

**Verdict:** Hermes "two directives contradict" is **overstated**. Structure is
correct per Archive-don't-delete. Residual risk: body below the archival divider
still contains a nested `[STATUS:LOCKED]` / "ACTIVE" draft — naive scrapers
loading the whole file may ingest stale LOCKED.

**Remediation (Act):** Move archived body to
`docs/protocols/_archive/TNF_DIRECTIVES.md` **or** wrap archived section so only
the archival banner is above the fold for agent loaders; keep pointer stub at
old path.

---

## 3. Stale slug `the-new-fuse-next-gen` — blast radius (md/sh sample)

Confirmed hits beyond Tier A:

- `docs/REPO_SEPARATION.md` (TL;DR)
- `scripts/sync-repos.sh` (header comment)
- `docs/reference/local-oss-with-hosted-account.md` (table + clone URL)
- `docs/lineage/REPO_LINEAGE.md` (claims canonical = next-gen)
- `docs/lineage/REPO_PARITY_the-new-fuse-next-gen.md`
- `docs/lineage/ARCHIVE_STATUS.md`, `TAGS_BRANCHES_EXPORT.md`, parity notes for
  fuse/fuse-master
- `docs/consolidation/PUBLIC_DISTRIBUTION_AND_PERSONAL_RUNTIME.md`

**Class:** Systemic naming debt from rename `the-new-fuse-next-gen` →
`The-New-Fuse` without lineage doc update.

**Act policy:**

- Treat `The-New-Fuse` as L1 live/dev origin.
- **Verified 2026-07-14:** `https://github.com/whodaniel/the-new-fuse-next-gen`
  returns **HTTP 301 → The-New-Fuse** (GitHub rename redirect). API resolves
  `full_name: whodaniel/The-New-Fuse`. Document next-gen as **historical slug /
  redirect alias** in lineage — never as current canonical name.
- `fuse-open-runtime` confirmed public and live.

---

## 4. Dual public face — README vs GITHUB_README

| Doc                | Audience                                             | Tension                                                                      |
| ------------------ | ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| `README.md`        | GitHub default render                                | Honest local-dev + monorepo + license caution                                |
| `GITHUB_README.md` | Agent/marketing mirror (NOT auto-rendered by GitHub) | MIT badge, Node 22, TS 5.4, npm install fantasy API, clone fuse-open-runtime |

**Policy options (need Go):**

| Option  | Action                                                                      |
| ------- | --------------------------------------------------------------------------- |
| **P-A** | Delete or archive `GITHUB_README.md` → single face = `README.md`            |
| **P-B** | Rewrite `GITHUB_README.md` to match ground truth; optionally copy to README |
| **P-C** | Keep both: mark `GITHUB_README.md` `[STATUS:ARCHIVED]` marketing draft      |

Recommend **P-B** if marketing site scrapes it; else **P-A**.

---

## 5. Node engine story — decided by facts (pending operator seal)

Facts already agree:

- `.nvmrc` = 20.20.2
- `engines.node` = `>=20.20.0`
- Merkaba/Hardhat docs separately require Node 22+ for that subsystem only

**Preferred Act:** Badge → **Node.js 20.20+**; add note that Merkaba/Hardhat
paths need 22+. Do **not** bump whole monorepo to 22 without engines + CI
change.

---

## 6. TypeScript story

Badge 5.4 vs root `typescript ^6.0.2` → update badge to **6.x** (or pin and
document workspace variance if packages still on 5.x — leaf survey should
confirm).

---

## 7. Parallel leaf agents (dispatched)

| Agent                                  | Focus                                    | ID                                     |
| -------------------------------------- | ---------------------------------------- | -------------------------------------- |
| Tier C claim survey                    | 983 curated non-protocol docs sample ≥40 | `3703cd56-d429-4c74-9e50-1c2a3d708d72` |
| Directives + skills + AGENTS paths     | Triad + 545 skills sample                | `ba72d4ce-a654-44fe-b68c-c00937aa7b7b` |
| Package/app README + proprietary paths | Tier E + sync-repos arrays               | `de14d214-b7ad-4220-8397-f925c20d0091` |

Synthesis update will merge their FAIL/WARN lists into
`DOC_AUDIT_COHESION_REPORT_2026-07-14.md` §addendum when they return.

---

## 8. Operator decisions still required before Act

1. License narrative: monorepo MIT end-to-end vs dual-license caution in README
2. GITHUB_README disposition: P-A / P-B / P-C
3. Confirm GitHub fate of `the-new-fuse-next-gen` (live / redirect / gone)
4. Approve Act batch 1 factual renames after leaf surveys land

**Not blocked for Act batch 1** once Go: next-gen→The-New-Fuse string fixes in
REPO_SEPARATION + sync-repos comment + Node/TS badge correction to match
engines.
