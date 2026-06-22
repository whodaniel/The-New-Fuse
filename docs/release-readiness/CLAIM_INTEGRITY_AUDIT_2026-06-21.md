# Claim Integrity Audit — 2026-06-21 (updated 2026-06-22)

**Scope:** Public launch surfaces only (`thenewfuse.com`, `api.thenewfuse.com`,
`fuse-open-runtime`)  
**Method:** Live probes + codebase cross-reference + clean install test

---

## Executive Verdict

| Category                          | Score    | Ship?                               |
| --------------------------------- | -------- | ----------------------------------- |
| Infrastructure (API, TLS, routes) | **9/10** | Yes                                 |
| Open-source credibility           | **8/10** | Soft launch OK                      |
| Marketing claims accuracy         | **8/10** | Beta messaging honest               |
| Install funnel                    | **5/10** | Blocker for dev audience until rc.2 |

**Recommendation:** **Soft launch to beta list OK.** Do not Show HN until clean
install from tagged `fuse-open-runtime` release passes end-to-end.

---

## Claim → Proof Matrix

| Claim (thenewfuse.com)          | Verdict      | Evidence (2026-06-22)                                               |
| ------------------------------- | ------------ | ------------------------------------------------------------------- |
| **Open Source**                 | ✅ Pass      | `github.com/whodaniel/fuse-open-runtime` public; MIT LICENSE live   |
| **113 AI Agents**               | ✅ Removed   | Hero now shows MCP+A2A / 90% OSS / 3 Runtimes                       |
| **<100ms Latency**              | ✅ Removed   | No longer on landing                                                |
| **MCP + A2A Protocols**         | ✅ Pass      | MCP servers real; relay + Redis bridge in codebase                  |
| **Lux Bridge**                  | ✅ Partial   | `apps/tauri-desktop`, chrome extension — exists, not demo-linked    |
| **Native Tauri Desktop**        | ✅ Pass      | `apps/tauri-desktop` in open-runtime                                |
| **Universal MCP Native**        | ✅ Partial   | MCP config + CLI; full UX requires extension + local stack          |
| **A2A Redis Federation**        | ✅ Pass      | `packages/relay-core`, green coordinator verified locally           |
| **SkIDEancer Cloud IDE**        | ⚠ Partial    | Code exists; `ide.thenewfuse.com` not verified live                 |
| **Persistent Knowledge Graph**  | ⚠ Partial    | pgvector/artifacts in monorepo; not provable from public site alone |
| **Chrome Extension federation** | ✅ Pass      | `apps/chrome-extension/dist-v7` — requires manual reload            |
| **Pricing**                     | ✅ Pass      | "Free During Beta" — no false $30 tier on landing                   |
| **Star on GitHub**              | ✅ **Fixed** | All CTAs → `fuse-open-runtime`                                      |
| **API /health timestamp**       | ✅ Pass      | Live: `2026-06-22T05:08:08.162Z`                                    |
| **API /api/v1/health**          | ✅ Pass      | Live 200 JSON                                                       |
| **Legal pages distinct**        | ✅ Pass      | `X-TNF-Routing: SPA-Landing` on `/legal/privacy`                    |
| **HSTS**                        | ✅ **Fixed** | `max-age=63072000; includeSubDomains; preload`                      |
| **Landing code sample**         | ⚠ Partial    | Aspirational copy removed; verify no fake API symbols remain        |

---

## Clean-Machine Install Test

See
[FIRST_RUN_INSTALL_TEST_2026-06-22.md](./FIRST_RUN_INSTALL_TEST_2026-06-22.md).

**Summary:** `v2.0.0-rc.1` installs dependencies but **fails `tnf-cli` build**.
Fixes committed on monorepo branch; **re-sync + retag required**.

---

## URL Health (probed 2026-06-22)

| URL                                    | Status            |
| -------------------------------------- | ----------------- |
| thenewfuse.com                         | 200 + HSTS        |
| thenewfuse.com/docs                    | 200               |
| thenewfuse.com/pricing                 | 200               |
| thenewfuse.com/legal/privacy           | 200               |
| github.com/whodaniel/fuse-open-runtime | 200               |
| github.com/whodaniel/fuse              | **404** (private) |
| api.thenewfuse.com/health              | 200 + timestamp   |

---

## Credibility Risks — Status

| #   | Risk                       | Status   | Notes                                          |
| --- | -------------------------- | -------- | ---------------------------------------------- |
| 1   | GitHub links → profile     | ✅ Fixed | All → `fuse-open-runtime`                      |
| 2   | Fake code sample           | ✅ Fixed | Removed aspirational `swarmService` copy       |
| 3   | Install needs 5GB+         | ⚠ Open   | Documented; slim install not built             |
| 4   | HSTS missing               | ✅ Fixed | Cloudflare `_headers` deployed                 |
| 5   | 113 agents / <100ms        | ✅ Fixed | Hero metrics replaced                          |
| 6   | `tnf-cli` build on tag     | ⚠ Open   | Fixes local; pending open-runtime sync         |
| 7   | Frozen lockfile on install | ⚠ Open   | tauri-desktop drift breaks `--frozen-lockfile` |

---

## Verification Commands

```bash
# Live site
curl -sI https://thenewfuse.com | grep -i strict-transport
curl -sL https://thenewfuse.com | grep -oE 'fuse-open-runtime|Free During Beta|113|100ms|\$30' | sort -u

# API
curl -s https://api.thenewfuse.com/health

# Local CLI (monorepo)
pnpm --filter @the-new-fuse/tnf-cli build
node packages/tnf-cli/dist/cli.js protocol health

# Clean install (≥5GB free)
curl -fsSL https://raw.githubusercontent.com/whodaniel/fuse-open-runtime/main/scripts/install-tnf-cli.sh \
  | bash -s -- --skip-onboard
```

---

## Next Steps

1. Commit + sync monorepo fixes → `fuse-open-runtime`
2. Tag `v2.0.0-rc.2` and re-run clean install test
3. Add disk requirements banner to `scripts/install-tnf-cli.sh`
4. Load simulation + conversion instrumentation (deferred from adversarial
   audit)
