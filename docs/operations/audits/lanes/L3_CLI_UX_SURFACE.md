# L3 — CLI / UX Surface Receipt
**Lane**: L3 CLI/UX Surface  
**Issued under**: `FULL_ENCHILADA_HARNESS_PLATFORM_AUDIT_MANDATE_2026-08-09.md`  
**Time**: 2026-08-09 (local) / evidence captured 2026-08-10T01:19Z–01:22Z  
**Mode**: REPORT ONLY  
**Surfaces**: `tnf menu`, `tnf paths` (sample), splash/taxonomy, command aliases, curated “Forefront Ops”

---

## Verdict
TNF already has a **correct curated spine** (`tnf menu` → Forefront Ops + Core Ops), but the **mandated operator happy path is not the menu’s happy path**. Fleet persistence (`alive` / `fleet establish`) and hygiene (`growth-audit`) are real commands buried in the 444-path inventory, while the curated menu leads with browser/UI/hooks/OpenClaw. Discoverability is good for *surfaces* and poor for *lifecycle*.

---

## What was inspected (evidence)

| Probe | Evidence |
|-------|----------|
| `tnf menu` | Live: “CLI paths: **444** \| tnf package scripts: **92** \| total root scripts: **415**”; curated sections Agent / Taxonomy / **Forefront Ops** / Core Ops / OpenClaw / Compat / Automation |
| Curated Forefront Ops (source) | `packages/tnf-cli/src/cli.ts` ~3680–3717: `browser-control`, `forefront`, `local-ui`, harness inspect/cycle/loop/boot, `tui --autonomous`, `turn-end` |
| Curated Core Ops | same file ~3721+: `onboard`, `doctor`, hooks\*, self-improvement\*, full-auto\*, library\*, scripts — **no** `fleet`, **no** `alive`, **no** `boot`, **no** `growth-audit` |
| `tnf paths` (sample) | Live inventory shows `alive`/`fleet establish`/`forefront`/`boot`/`browser` vs `browser-control` all as peers (flat alpha list) |
| Help aliases | `tnf local-ui\|dashboard`; `tnf browser-control\|computer-use` |
| Dual agent namespaces | `cli.ts` registers both `agent` and `agents` (multiple `.command('agent')` / `.command('agents')` sites) |
| Cold-start tax | `docs/operations/tnf-cli-restructure-scope.md`: `--help` still ~**3 s** (down from 47 s); `cli.ts` ~19,214 lines / 363 `.command(`; Stage 0 contract test still required |
| Splash | Live `tnf menu` prints large ASCII splash before useful content (even when operator wants paths/help) |

---

## Findings

### P1 — Curated menu omits the persistence spine of the Best User Flow
- **Evidence**: Menu sections list Forefront + onboarding/doctor/hooks; live `tnf paths` includes `tnf fleet establish`, `tnf alive up|status|down`, `tnf boot` — none appear in curated Forefront/Core Ops.
- **Impact**: New operator following `tnf menu` boots UI without establishing fleet permanence; contradicts mandate flow onboard → **fleet** → **alive** → forefront.
- **Fix**: Add a curated **“Fleet & Alive”** (or reorder Core Ops) section: `tnf onboard` → `tnf fleet establish` → `tnf alive up` → `tnf forefront` → `tnf harness cycle` → `tnf growth-audit` → `tnf doctor`. Keep full inventory behind `tnf menu --full` / `tnf paths`.
- **Owner**: L3 (+ L0 for wording of “establish”)

### P1 — Four “boot the stack” verbs without a primary
- **Evidence**: Descriptions coexist: `tnf boot` (“Master entry”), `tnf alive` (“persistent stack”), `tnf harness boot`, `tnf forefront` (“harness + relay + local UI + browser control”); boot pipeline also prints forefront/local-ui tips (`packages/tnf-cli/src/boot/pipeline.ts`).
- **Impact**: Operators (and agents) pick arbitrarily; receipts diverge (`forefront-boot.latest.json` vs alive/fleet establish receipts).
- **Fix**: Document one **primary** (`forefront` for interactive / `alive` for daemon / `fleet establish` for endowment) in menu + a one-line “when to use which”; do not merge implementations yet.
- **Owner**: L3 / L2 / L0

### P2 — Alias and noun collisions tax cognitive load
- **Evidence**: `local-ui|dashboard`, `browser-control|computer-use`, `browser` (agent-browser) vs `browser-control` (HTML panel), `agent` vs `agents`, `claw`/`openclaw`, `packages` alias → `workspace`.
- **Impact**: Hermes-parity aliases help migration but confuse TNF-native operators; `tnf browser` ≠ `tnf browser-control`.
- **Fix**: In menu, show **canonical** name first; parenthetical alias once. Add a one-line disambiguator under Forefront Ops: “`browser-control` = operator panel; `browser` = agent automation.”
- **Owner**: L3 / L6

### P2 — Inventory scale and slow help undermine “try --help”
- **Evidence**: 444 paths claim on menu; restructure doc scopes Stages 0–3; each `tnf * --help` pays multi-second cold start; splash precedes content.
- **Impact**: Exploration via help/paths is painful; agents time out mid-audit; operators stop reading menu.
- **Fix (no boil-ocean)**: (1) Prefer `TNF_SILENT_PREFLIGHT=1` / silent path for help; (2) land Stage 0 command-surface snapshot test; (3) splash off for `--help`/`paths`/`menu --plain` if missing.
- **Owner**: L3 (CLI restructure already scoped)

### P3 — Taxonomy paths exist but are not the operator onboarding story
- **Evidence**: Menu Taxonomy: `types list`, `traits list`, `paths`, `splash`, `menu`.
- **Impact**: Useful for harness authors; noise for day-1 operators.
- **Fix**: Keep, but demote below Fleet/Forefront in default `tnf menu` (not `--full`).
- **Owner**: L3

---

## What makes sense (keep)
1. **Curated `tnf menu` with Forefront Ops** — right idea: hide 444 behind a short list.
2. **`tnf paths` / `types` / `traits`** — good power tools once oriented.
3. **Harness cycle/loop/inspect on the curated face** — matches inspect→act→verify ritual.
4. **Documented CLI restructure** (`tnf-cli-restructure-scope.md`) — honest latency reality; Stage 0 first is correct.

## Missing
1. Curated fleet/alive/growth-audit entries.
2. A single “Day-1 Operator Path” block at top of `tnf menu` (8–10 lines max).
3. `menu --plain` / help without splash (if not already gated consistently).

## Confusing
1. Foreground UI stack (`forefront`) vs persistence (`alive`) vs endowment (`fleet establish`) vs master (`boot`).
2. `browser` vs `browser-control` vs `#/browser` UI route.
3. `agent` vs `agents` dual trees.

## Refactor (clarity, not ocean)
1. **Menu-only**: reorder + add Fleet & Alive strip; demote hooks/OpenClaw density on default menu.
2. **Copy-only**: “Primary vs alias” labeling; one boot-verb matrix (table in ops README / menu footer).
3. **Defer**: cli.ts split (follow scoped Stages 0→3); do not delete aliases this audit.

---

## Proposed Best User Flow (CLI verbs only)
See L6 receipt + Sub-Director synthesis section; L3 canonical command strip:

```text
tnf onboard
tnf fleet establish
tnf alive up && tnf alive status
tnf forefront          # or: tnf local-ui / tnf local-ui --tauri
tnf forefront status
tnf harness inspect && tnf harness cycle
tnf growth-audit
tnf doctor             # act/verify after audit findings
tnf turn-end
```

---

## Lane status
**COMPLETE** — report-only; no code changes.

---

## L4 contribution — Interop discoverability notes (2026-08-09)
*Appended by L4 INTEROP/MCP/ASSIMILATE lane. Full findings: `L4_INTEROP_MCP.md`.*

### Discoverability gaps that are CLI/UX problems (not just protocol)
1. **False golden path in Forefront Ops** — Menu entry `tnf assimilate link cursor` (“Onboard Cursor CLI into TNF harness protocol”) is a **no-op stub** (`AssimilationService.linkProvider` only logs). The real path is `tnf cursor …` (passthrough + `data/mcp.clients/cursor.mcp.json`) after `tnf mcp sync/generate`. **Action for L3**: replace/qualify that menu line until link persists a routes table.
2. **No Interop strip on curated menu** — Brand passthroughs (`cursor`/`claude`/`hermes`/`pi`/`agy`/`openclaw`), `tnf mcp *`, `tnf parity status`, and `tnf bridge status` are absent from curated Forefront/Core Ops despite being mandatory day-1 foreign-agent wiring. Add an **Interop** section (6 lines max):
   ```text
   tnf mcp sync --from repo && tnf mcp list
   tnf parity status
   tnf cursor|claude|pi|hermes|agy -- …
   tnf bridge status    # require process, not Redis alone
   ```
3. **Dual entry confusion (assimilate vs brand verbs)** — Help lists both `assimilate` and `tnf cursor|claude|…`. Operators cannot tell which injects MCP. Label brand verbs “MCP-wired passthrough” and assimilate “protocol-gated spawn (experimental)” in menu/help one-liners.
4. **agy vs gemini naming** — Help deprecates `gemini` → `agy`, but parity/menu stories still talk Gemini/OpenClaw differently; `agy` has no MCP client file and is missing from parity roster. Surface `agy` as the Gemini successor in paths/menu aliases.
5. **Cold-start blocks help-as-discovery for interop** — Full CLI load often exceeds 20–45s before `mcp`/`parity`/`assimilate` help prints; L4 audit shells needed long kills. Reinforces L3 P2: silent/preflight-off for `--help` and a future `tnf interop status` thin entrypoint.
6. **OpenClaw verb pile** — `openclaw` / `claw` / `compat openclaw` / control script vs broken `~/.local/bin/openclaw` symlink. Menu should point to one **working** control path and mark bare passthrough unhealthy when binary missing.

### Suggested Best User Flow addition (after alive/forefront)
```text
tnf mcp sync --from repo && tnf mcp health
tnf parity status
tnf bridge status   # process + fresh lastSeen
# then brand passthroughs; do not trust assimilate link until implemented
```
