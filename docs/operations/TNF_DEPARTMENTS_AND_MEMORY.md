`[CLASS:INTEL] [STATUS:ACTIVE] [DOC_TYPE:sop] [DOMAIN:orchestration]`

# TNF Departments and Operator Memory

**Logged:** 2026-08-30  
**Canonical catalog:** `data/departments/corporate-departments.json`  
**Staffing index:** `data/departments/staffing-index.json`  
**Apply script:** `scripts/departments/apply-department-categories.cjs`

## Purpose

Operators address the TNF CLI agent by **department** (HR, Marketing, Design,
Legal, Tech, Finance, Product, Ops). Those lanes are distinct from pipeline
**Clusters** (Scouting, Library, Engineering, Governance, Journaling).

If an operator says "remember this", TNF must persist the fact. Chat
acknowledgement is not memory.

## Commands

```bash
tnf department list
tnf department show legal
tnf department route "ask HR about onboarding"
tnf department apply
tnf department apply --write

tnf remember retain "Prefer departments over generic cluster language"
tnf remember recall "departments"
tnf harness memory retain --text "..." --tags operator,remember --scope project
```

Slash: `/department`, `/hr`, `/marketing`, `/design`, `/legal`, `/tech`,
`/finance`, `/product`, `/ops`, `/remember`, `/scout`.

Rebuild / retag (idempotent; does not rewrite existing `category` values):

```bash
node scripts/departments/apply-department-categories.cjs --dry-run
node scripts/departments/apply-department-categories.cjs --apply
```

## Progressive skill injection

Department listings are **names only**. Do not dump SKILL.md or agent prompt
bodies when a department is named.

1. `tnf department show <id>` — names
2. `node scripts/skills/skill-bank-query.cjs <term>` — descriptions
3. Read **one** `SKILL.md` / `.agent/agents/<name>.md` when invoking it

Existing `category` fields remain authoritative for skill-chain / Tier-0 domain
maps. `department` is additive. Vendor packs (`imported-*`, `anthropic`,
`antigravity`, `.system`) are indexed only and are not mutated.

## Agent / skill membership (2026-08-30 apply)

| Department | Agents | Skills |
| ---------- | -----: | -----: |
| HR         |      3 |      7 |
| Marketing  |     79 |    142 |
| Design     |      3 |     64 |
| Legal      |      3 |      6 |
| Tech       |     60 |    552 |
| Finance    |      3 |      7 |
| Product    |     20 |     35 |
| Ops        |     25 |     60 |

All 196 `.agent/agents/*.md` files already had a top-level `category`. The
2026-08-30 `--apply` pass wrote `department:` on those agents and on 326
TNF-owned skills. 200 skills also received a missing `category` using the same
domain inference as `scripts/skills/build-skill-manifest.cjs`. 533 vendor skills
were indexed only. Existing `category` values were not rewritten.

## Memory stores

| Store                                 | Role                                      |
| ------------------------------------- | ----------------------------------------- |
| `docs/core/MEMORY.md`                 | Static curated standing decisions         |
| `tnf remember` / `tnf harness memory` | Dynamic retain/recall                     |
| `data/harness/memory/entries.jsonl`   | Harness layer                             |
| `~/.tnf/memory/notes.jsonl`           | Local file fallback                       |
| Session handoff / Living State        | Operational batons, not preference memory |

Agent tools: `memory_retain`, `memory_recall`, `department_route`.

## Host prompt profiles

Hosts do not share one prompt filename. Catalog:
`data/harness/host-prompt-profiles.json`. Verify enlisted surfaces:

```bash
tnf harness host-profiles
tnf scout host-profiles
node scripts/harness/host-prompt-profiles.cjs --verify
```

## Scout staffing

```bash
tnf scout queue
tnf scout staff
tnf scout status
```

Assigned agent: `tnf-cli-agent`. Brief is names/questions only.

## Super Admin note

Mechanical multi-receipt commits must **not** use `git commit --no-verify`. Use
`TNF_HANDOFF_ALLOW_MULTI_RECEIPT=1` with a matching Super Admin token. See
`scripts/protocols/enforce-session-handoff.cjs`.

## Related rails

- `docs/protocols/TNF_SYSTEM_LEXICON.md` — department vs Cluster
- `docs/core/FRONTLOAD_MANIFEST.md` — Stage C department + memory hydration
- `docs/protocols/HARNESS_MEMORY_LAYER.md` — retain/recall contract
- `.agent/SYSTEM_PROMPT.md` — interactive agent instructions
- `packages/tnf-cli/src/__tests__/departments.test.ts` — routing + index checks
