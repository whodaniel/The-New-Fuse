# Claim Integrity Audit — 2026-06-21

**Scope:** Public launch surfaces only (`thenewfuse.com`, `api.thenewfuse.com`,
`fuse-open-runtime`)  
**Method:** Live probes + codebase cross-reference + simulated clean install

---

## Executive Verdict

| Category                          | Score    | Ship?                    |
| --------------------------------- | -------- | ------------------------ |
| Infrastructure (API, TLS, routes) | **8/10** | Yes                      |
| Open-source credibility           | **6/10** | Soft launch only         |
| Marketing claims accuracy         | **5/10** | Fix top 5 before Show HN |
| Install funnel                    | **4/10** | Blocker for dev audience |

**Recommendation:** Soft launch to beta list OK. **Do not Show HN** until GitHub
links, code samples, and install path are fixed.

---

## Claim → Proof Matrix

| Claim (thenewfuse.com)                                         | Verdict       | Evidence                                                                   |
| -------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------- |
| **Open Source**                                                | ✅ Pass       | `github.com/whodaniel/fuse-open-runtime` public (200), install script live |
| **113 AI Agents**                                              | ⚠ Unverified  | No public API exposing live count; likely registry inventory, not runtime  |
| **<100ms Latency**                                             | ⚠ Unverified  | Landing probe ~150ms; no published benchmark; relay local fast, API ~1-2s  |
| **MCP + A2A Protocols**                                        | ✅ Pass       | MCP servers real (M04 clean); relay + Redis bridge in codebase             |
| **Lux Bridge**                                                 | ✅ Partial    | `apps/tauri-desktop`, chrome extension v6 — exists, not demo-linked        |
| **Native Tauri Desktop**                                       | ✅ Pass       | `apps/tauri-desktop` in open-runtime                                       |
| **Universal MCP Native**                                       | ✅ Partial    | MCP config + CLI; full UX requires extension + local stack                 |
| **A2A Redis Federation**                                       | ✅ Pass       | `packages/relay-core`, green coordinator, local relay verified             |
| **SkIDEancer Cloud IDE**                                       | ⚠ Partial     | Code exists; `ide.thenewfuse.com` not verified live                        |
| **Persistent Knowledge Graph**                                 | ⚠ Partial     | pgvector/artifacts in monorepo; not provable from public site alone        |
| **Chrome Extension federation**                                | ✅ Pass       | `apps/chrome-extension/dist-v7` — requires manual reload                   |
| **Pricing ($0 / $30 / Enterprise)**                            | ❓ Unverified | Site shows tiers; billing enforcement not probed                           |
| **Star on GitHub**                                             | ❌ **Fail**   | Links to `github.com/whodaniel` (profile), not repo; `whodaniel/fuse` 404  |
| **API /health timestamp**                                      | ✅ Pass       | Live: `2026-06-21T17:40:10.554Z`                                           |
| **API /api/v1/health**                                         | ✅ Pass       | Live 200 JSON                                                              |
| **Legal pages distinct**                                       | ✅ Pass       | `X-TNF-Routing: SPA-Landing` on `/legal/privacy`                           |
| **HSTS**                                                       | ❌ Fail       | No `Strict-Transport-Security` on default response                         |
| **Landing code sample** (`swarmService.initializeAgencySwarm`) | ❌ **Fail**   | **No such symbol in codebase** — aspirational copy                         |

---

## Clean-Machine Install Test

**Environment:** Isolated `$HOME` under `/tmp`, `TNF_INSTALL_AUTO_ONBOARD=0`  
**Script:** `curl …/fuse-open-runtime/main/scripts/install-tnf-cli.sh | bash`

| Step                                             | Result                                    |
| ------------------------------------------------ | ----------------------------------------- |
| Fetch install script                             | ✅ 200, points to `fuse-open-runtime.git` |
| `git clone --depth=1`                            | ✅ Started                                |
| `pnpm install --filter @the-new-fuse/tnf-cli...` | ❌ **ENOSPC** at ~924MB (disk full)       |
| `tnf --help`                                     | ❌ Not reached                            |

**Findings:**

1. Install pulls **entire monorepo** + full pnpm dependency tree — needs **≥5 GB
   free disk**
2. No documented minimum requirements in install script output
3. Help text still says default `fuse.git` in usage block (cosmetic; DEFAULT is
   correct)
4. Docker daemon unavailable locally — could not test in container

**Launch fix:** Document disk/RAM requirements; consider slim install that
doesn't clone full monorepo.

---

## URL Health (all probed 2026-06-21)

| URL                                    | Status            |
| -------------------------------------- | ----------------- |
| thenewfuse.com                         | 200               |
| thenewfuse.com/docs                    | 200               |
| thenewfuse.com/pricing                 | 200               |
| thenewfuse.com/legal/privacy           | 200               |
| thenewfuse.com/legal/terms             | 200               |
| thenewfuse.com/about                   | 200               |
| github.com/whodaniel/fuse-open-runtime | 200               |
| github.com/whodaniel/fuse              | **404** (private) |
| api.thenewfuse.com/health              | 200 + timestamp   |
| api.thenewfuse.com/api/v1/health       | 200 + timestamp   |

---

## Top 5 Credibility Risks (fix before Show HN)

| #   | Risk                                  | Fix                                                        | Effort |
| --- | ------------------------------------- | ---------------------------------------------------------- | ------ |
| 1   | **Star on GitHub** → profile not repo | Point all links to `fuse-open-runtime`                     | 15 min |
| 2   | **Fake code sample** on landing       | Replace with real `tnf onboard` or verified API snippet    | 30 min |
| 3   | **Install needs 5GB+** undocumented   | Add requirements + slim install path                       | 2-4 hr |
| 4   | **HSTS missing**                      | Cloudflare edge setting                                    | 5 min  |
| 5   | **113 agents / <100ms** unverified    | Soften to "100+ agent templates" or link to live dashboard | 30 min |

---

## Fixes Applied This Session

- `apps/frontend/index.html` — GitHub links → `fuse-open-runtime`
- `apps/frontend/public/landing.html` — same
- `apps/frontend/src/components/SiteFooter.tsx` — same
- `docs/release-readiness/CHECKLIST_V1` — M02/M03 marked clean
- `docs/release-readiness/RELEASE_NOTES_PUBLIC.md` — drafted

---

## Next Verification (post-fix deploy)

```bash
# After frontend redeploy
curl -sI https://thenewfuse.com | grep -i strict-transport
curl -sL https://thenewfuse.com | grep -o 'github.com/whodaniel/[^"]*' | head -3

# Clean install (machine with ≥5GB free)
curl -fsSL https://raw.githubusercontent.com/whodaniel/fuse-open-runtime/main/scripts/install-tnf-cli.sh | bash -s -- --skip-onboard
tnf --version
```
