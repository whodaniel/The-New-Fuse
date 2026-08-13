# Codebase Map — Technical Documentation

This document describes the TNF interactive codebase map, auth matrix, and supporting tooling.

## Overview

The codebase map is a ReactFlow-based interactive visualization of The New Fuse (TNF) monorepo. It reads a generated JSON file (`codebase_map.json`) and renders all packages, files, classes, and methods as a navigable graph.

## Files

| File | Purpose |
|---|---|
| `apps/frontend/src/data/codebase_map.json` | Generated data source (15,707 nodes / 15,706 edges) |
| `apps/frontend/src/components/visualization/InteractiveCodebaseMap.tsx` | Main interactive graph component |
| `apps/frontend/src/components/visualization/InteractiveCodebaseMap.test.ts` | Vitest test suite (6 tests, all passing) |
| `scripts/parsers/mermaid_to_reactflow.mjs` | Node.js script that generates `codebase_map.json` from AST + protocol docs |
| `scripts/ci-fallback-codegen.sh` | Shell script that detects source changes and regenerates the map |
| `codebase_index.html` | Standalone HTML index (searchable, categorized, click-to-detail, tracker integrated) |
| `codebase_tracker.json` | AI Reading Tracker state (generated) |
| `docs/CODEBASE-TRACKER-SCHEMA.md` | Full tracker schema, 7-lens taxonomy, and workflow documentation |

## Generating the Map

```bash
# Direct generation
node scripts/parsers/mermaid_to_reactflow.mjs

# Or via CI fallback (detects changes, writes .codebase-map-last-run marker)
./scripts/ci-fallback-codegen.sh
```

## Auth Matrix (Role-Based Gates)

The auth matrix gates access based on user roles. The hierarchy is:

```
SUPER_ADMIN > ADMIN > DEVELOPER > any authenticated user
```

### Rules
- **Super Admins** (`isSuperAdmin`) bypass all gates.
- **Admins** (`isAdmin`) bypass locks that require `DEVELOPER`.
- **Developers** (`hasRole(['DEVELOPER'])`) can access their nodes but not admin/super-admin ones.
- **Authenticated users** see all unlocked nodes.
- **Unauthenticated users** cannot access the map at all (the page itself is gated).

### Locked Nodes

| Node ID | Label | Required Role |
|---|---|---|
| `DOMAIN_AGENTS` | Agent Matrix & Personas | `DEVELOPER` |
| `AGENT_SKILL_0` | webpilot | `DEVELOPER` |
| `AGENT_SKILL_1` | sspdf | `DEVELOPER` |
| `AGENT_SKILL_2` | sspdf-theme-generator | `DEVELOPER` |
| `PROTO_14` | ⚖️ TNF Governance Tenets | `SUPER_ADMIN` |
| `PROTO_27` | TNF Cron Governance Protocol | `SUPER_ADMIN` |
| `PROTO_7` | 📍 LIVING_STATE.md | `ADMIN` |

### How It Works in the UI

1. **Click a locked node** → Shows red "Authentication Required" overlay, no drill-down.
2. **Locked root** (e.g., `DOMAIN_AGENTS`) → Children hidden from initial view.
3. **Unlocked node** → Normal drill-down as before.

## Parser Logic

The parser (`mermaid_to_reactflow.mjs`) assigns roles based on label keywords (case-insensitive):

```javascript
const upperLabel = label.toUpperCase();
if (upperLabel.includes('GOVERNANCE') || upperLabel.includes('SECURITY')) {
  requiredRole = 'SUPER_ADMIN';
} else if (upperLabel.includes('LIVING_STATE') || upperLabel.includes('AUTH') || upperLabel.includes('STATUS_LEDGER')) {
  requiredRole = 'ADMIN';
}
```

Agent skills and the `DOMAIN_AGENTS` node are hard-coded to `DEVELOPER`.

## Testing

Run the Vitest suite:

```bash
cd apps/frontend
npx vitest run src/components/visualization/InteractiveCodebaseMap.test.ts
```

Assertions:
- 7 nodes have `requiredRole`.
- Governance protocol requires `SUPER_ADMIN`.
- Living state protocol requires `ADMIN`.
- Agents domain and skills require `DEVELOPER`.
- Code files (e.g., `SecurityScanner`) have no `requiredRole`.

## CI Fallback

`scripts/ci-fallback-codegen.sh` is used when GitHub Actions is unavailable. It:
1. Reads a `.codebase-map-last-run` marker file.
2. Compares `mtime` of source files (AST map, protocol docs) against the marker.
3. If anything changed, regenerates `codebase_map.json` and runs the parser.

### Usage
```bash
# Manual
./scripts/ci-fallback-codegen.sh

# Cron (every 5 minutes)
*/5 * * * * cd /path/to/repo && ./scripts/ci-fallback-codegen.sh
```

## AI Reading Tracker

The Tracker turns the codebase map into a **living state machine** for AI reading progress. See `docs/CODEBASE-TRACKER-SCHEMA.md` for the full schema.

### Quick Start
```bash
# Initialize tracker from codebase_map.json
node scripts/trackers/init_tracker.mjs
# → Creates codebase_tracker.json with all 15,707 nodes as UNREAD

# Simulate an agent reading a node
node scripts/trackers/update_node.mjs --id "PROTO_14" --status ANALYZED \
  --agent "claude-v1" --intent "governance" --maturity "stable" \
  --actionability "monitor" --criticality "critical" --confidence 0.98 \
  --findings "Rulebook mandates API registration"

# Check progress
node scripts/trackers/report_tracker.mjs

# Detect stale analyses (source changed after last read)
node scripts/trackers/check_stale.mjs
```

### 7-Lens Classification
When an AI reads a document, it classifies it across:
1. **Intent** — `governance` · `architecture` · `implementation` · `operational`
2. **Scope** — `meta_system` · `system` · `module` · `component` · `function`
3. **Maturity** — `draft` · `review` · `stable` · `deprecated` · `archived`
4. **Actionability** — `implement` · `review` · `migrate` · `monitor` · `archive`
5. **Ownership** — `agent:<name>` · `human:<role>` · `system`
6. **Semantic Vibe** — `security` · `performance` · `api-contract` (for RAG)
7. **Criticality** — `critical` · `important` · `ancillary` · `exploratory`

## HTML Index

`codebase_index.html` is a standalone, zero-build HTML file for browsing the map outside the React app.

### Features
- **Progress Dashboard**: Shows Analyzed / Reading / Stale progress bars with percentages
- **Lens Distribution**: Visual bar chart of intent classifications
- **Categorized Tables**: Domains, Protocols, Files, Classes, Methods
- **Search**: Real-time filtering across all categories
- **Auth Indicators**: 🔒 with role badge for locked nodes; ✓ Open for public
- **Read Status**: UNREAD / READING / ANALYZED / STALE color-coded pills
- **Click-to-Detail**: Side panel with full node metadata, 7-lens classification, and key findings

### Open
1. Navigate to the project root in a browser.
2. Open `codebase_index.html`.
3. Or serve it: `npx serve .` and visit `/codebase_index.html`.

## Future Enhancements

- [ ] **Tree view** — Expandable parent/child hierarchy (like a file explorer).
- [ ] **Graph visualization** — Render the full graph edges with a layout library.
- [ ] **Audit export** — Export the locked-node list as a separate JSON for admin reviews.
- [ ] **Auto-assignment** — Agents self-register for nodes matching their `semantic_vibe`.
- [ ] **CI Gating** — Block deployment if `critical` docs are `UNREAD` or `STALE`.
