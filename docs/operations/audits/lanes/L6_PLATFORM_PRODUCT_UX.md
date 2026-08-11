# L6 — Platform / Product UX Receipt
**Lane**: L6 Platform/Product UX  
**Issued under**: `FULL_ENCHILADA_HARNESS_PLATFORM_AUDIT_MANDATE_2026-08-09.md`  
**Time**: 2026-08-09 (local)  
**Mode**: REPORT ONLY  
**Surfaces**: `tnf local-ui`, `tnf forefront`, `tnf browser-control`, TUI, journey coherence vs fleet/alive

---

## Verdict
The **interactive operator face is real and wired**: `tnf forefront` bootstraps onboard → harness → cursor harness → local UI → opens `http://localhost:1420/#/browser`, with a durable receipt. Product confusion is **overlap of surfaces** (forefront vs local-ui vs browser-control vs tui vs extension), not absence. The Best User Flow should treat Forefront as the **operator cockpit**, and Alive/Fleet as the **always-on substrate** — two products today marketed as one.

---

## What was inspected (evidence)

| Probe | Evidence |
|-------|----------|
| `tnf forefront --help` | Options: `--tauri`, `--skip-relay`, `--skip-onboard`, `--skip-cursor`, `--no-open`; subcommand `status` |
| `tnf local-ui --help` | Alias `dashboard`; options `--tauri`, `--skip-relay`, `--skip-onboard`, `--build` |
| `tnf browser-control --help` | Alias `computer-use`; standalone HTML panel + federation node; `--skip-relay`, `--no-open` |
| Boot script | `scripts/local-ui/tnf-forefront-boot.cjs`: steps onboard → `pnpm tnf:harness:boot` → cursor onboard → spawn `tnf-local-ui-boot.cjs` → open `#/browser` |
| Latest receipt | `.agent/runtime-logs/forefront-boot.latest.json` (`generatedAt` 2026-08-09T05:20:58Z): steps onboard/harness/cursor-harness ok; `uiUrl` `http://localhost:1420/#/browser` |
| Scripts present | `scripts/local-ui/{tnf-forefront-boot,tnf-local-ui-boot,serve-browser-control}.cjs` + `static/` |
| Menu placement | Forefront Ops is first-class on `tnf menu` (good discoverability for UI path) |
| TUI | Curated: `tnf tui --autonomous`; separate autonomous agent lane, not the web cockpit |
| Boot tips | `packages/tnf-cli/src/boot/pipeline.ts` advertises `forefront` / `local-ui` / `--tauri` |

---

## Findings

### P1 — Three overlapping “open the operator UI” entrypoints
- **Evidence**: `forefront` (full stack + open `#/browser`), `local-ui` (web/tauri + harness/relay), `browser-control` (standalone panel). Forefront internally calls local-ui boot with `--skip-onboard`.
- **Impact**: Operators don’t know which is canonical; receipt only exists for forefront; browser-control looks like a fourth product (`computer-use` Hermes alias).
- **Fix**: Product rule (docs + menu): **Day driver = `tnf forefront`**. `local-ui` = UI-only restart. `browser-control` = light panel without full shell. One sentence each on menu.
- **Owner**: L6

### P1 — Forefront journey skips fleet permanence
- **Evidence**: Forefront boot sequence never calls `fleet establish` or `alive up`; receipt steps are onboard/harness/cursor/local-ui/open-browser only.
- **Impact**: UI can look “up” while Local Sub-Director / Redis / launchd fleet is not endowed; matches silent fleet-alert class documented in disk/exhaustion + silent-failure reports.
- **Fix**: Soft preflight in forefront (or menu guidance): warn if `tnf alive status` / fleet core-status unhealthy; do **not** block UI by default — surface a banner/receipt field `fleetOk`.
- **Owner**: L6 (+ L2/L0 for status probe)

### P2 — Web vs Tauri vs TUI vs Chrome extension is under-explained
- **Evidence**: `--tauri` on both forefront and local-ui; `tnf extension` manages chrome/vscode/tauri; `tnf tui --autonomous` on same curated menu; legacy `tnf browser legacy-*` still listed in paths.
- **Impact**: Journey audits fragment; operators install extensions or open wrong surface.
- **Fix**: Journey matrix (docs only):

  | Goal | Command |
  |------|---------|
  | Desktop cockpit + browser panel | `tnf forefront` |
  | Native shell | `tnf forefront --tauri` |
  | Panel only | `tnf browser-control` |
  | Headless autonomous agent | `tnf tui --autonomous` |
  | Agent-driven page automation | `tnf browser …` (not browser-control) |

- **Owner**: L6

### P2 — Forefront receipt is success-biased / incomplete for act→verify
- **Evidence**: Receipt records step codes and `uiUrl`, but not relay health, local-ui HTTP readiness, or fleet status; TTY foreground leaves UI process attached (good) while non-TTY detaches (easy to orphan).
- **Impact**: `tnf forefront status` proves “boot was attempted,” not “cockpit is healthy.”
- **Fix**: Extend receipt with `httpProbe` / `relayPid` / `aliveStatus` when cheap; keep report-only for this audit.
- **Owner**: L6

### P3 — Default deep-link `#/browser` is correct for control but hides rest of shell
- **Evidence**: Hardcoded `uiUrl` in forefront boot script.
- **Impact**: First viewport is browser-control route; other Local UI journeys less discoverable inside product.
- **Fix**: Keep `#/browser` as Forefront default; ensure Local UI itself has an obvious nav to harness/fleet status (product, not CLI).
- **Owner**: L6 (app UX)

---

## What makes sense (keep)
1. **`tnf forefront` as compose boot** of onboard + harness + UI + open — this *is* the product.
2. **Receipt file** at `.agent/runtime-logs/forefront-boot.latest.json` — verify gate for UI boot.
3. **Portable web default (1420) + optional Tauri** — right progressive enhancement.
4. **Menu Forefront Ops section** — discoverable once you run `tnf menu`.

## Missing
1. Explicit product relationship: Alive/Fleet **under** Forefront (substrate vs cockpit).
2. In-UI or receipt fleet health.
3. A single “Operator Journeys” page (or `tnf menu` Day-1 block) that pairs L3 verbs with L6 surfaces.
4. Journey-audit automation tying forefront status → harness inspect → doctor (mentioned in mandate; not evidenced as one command).

## Confusing
1. `dashboard` alias for local-ui vs “browser-control” vs `#/browser`.
2. Hermes parity names (`computer-use`, `dashboard`) on TNF-primary surfaces.
3. Corporate OOO “Phase” language vs CLI “forefront” language (cross-lane with L7).

## Refactor (clarity, not ocean)
1. **Naming/docs only**: promote `forefront` as cockpit; demote sibling entrypoints to “advanced.”
2. **Receipt enrichment** (small): add substrate probes.
3. **Defer**: merging browser-control into local-ui route permanently (already partially true via `#/browser`) — avoid duplicate static servers long-term, but not this week’s ocean.

---

## Proposed Best User Flow (platform lens)

1. **Onboard** — `tnf onboard` (Turn Zero / frontload integrity).  
2. **Establish fleet** — `tnf fleet establish` (Local Sub-Director + core OSS fleet endowment).  
3. **Alive** — `tnf alive up` → `tnf alive status` (daemon + heartbeat sentinel permanence).  
4. **Forefront** — `tnf forefront` → `tnf forefront status` (cockpit + `#/browser`).  
5. **Harness cycle** — `tnf harness inspect` then `tnf harness cycle` (or `harness loop --task` for live IAV).  
6. **Audit** — `tnf growth-audit` + `tnf doctor` (+ targeted lane audits).  
7. **Act** — dispatch via Sub-Director / harness loop / staffops — one owner per task.  
8. **Verify** — re-run inspect + forefront status + alive status; `tnf turn-end`.

Fallback surfaces: `tnf local-ui` (restart UI), `tnf browser-control` (panel-only), `tnf tui --autonomous` (no browser).

---

## Lane status
**COMPLETE** — report-only; no code changes.
