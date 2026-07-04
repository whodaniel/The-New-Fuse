---
name: tnf-scaffold
description:
  Project-scoped scaffolding skill for The New Fuse (TNF). Use as a starting
  template when creating a new skill that lives under apps/<app>/skills/<name>/
  and should follow TNF project conventions (SKILL.md frontmatter, scripts/,
  references/, assets/ folders, no README/CHANGELOG cruft). Rename the
  directory, edit the frontmatter, and start writing procedures — the structure
  is committed.
---

# TNF Skill Scaffold

A minimal, rename-ready scaffold for adding a new project-scoped skill to a
TNF sub-application (e.g. `apps/openclaw/skills/<your-skill>/`, or any
`apps/<app>/skills/<your-skill>/`).

## What this scaffold gives you

- A valid `SKILL.md` with YAML frontmatter (`name`, `description`) — the only
  two fields required for triggering.
- Three empty resource folders matching the conventional skill anatomy:
  - `scripts/` — deterministic code (Python/Bash) that should not be rewritten
    per session.
  - `references/` — docs an agent loads into context on demand (schemas, API
    references, domain notes).
  - `assets/` — files copied into output (templates, fonts, icons).
- A placeholder script (`scripts/example.py`), reference
  (`references/example.md`), and asset (`assets/example.txt`) so the structure
  is visible at a glance. Delete any you don't need.

## How to make this your own

1. Rename the folder from `tnf-scaffold` to your skill name (lowercase,
   hyphens, ≤ 64 chars):
   `mv apps/openclaw/skills/tnf-scaffold apps/<app>/skills/<your-skill>`.
2. Edit `SKILL.md` frontmatter:
   - `name` — must match the directory name.
   - `description` — be specific. This is the trigger. Include both *what the
     skill does* and *when to invoke it*. Vague descriptions don't fire.
3. Replace the body with your workflow. Keep it imperative ("Run X", "Check Y"),
   not narrative. Aim for < 500 lines; move long content into `references/`.
4. Delete unused placeholder files in `scripts/`, `references/`, `assets/`.
   Don't ship what you don't use.
5. If you add bundled resources under `references/` or `assets/`, link them
   from SKILL.md and describe the trigger condition for each.

## Sandbox commands (rename-able, not project-specific)

These are the only operations typically needed against the scaffold itself:

```bash
# make skeleton (this is how this file came to exist)
mkdir -p apps/<app>/skills/<name>/{scripts,references,assets}

# rename to a real skill
git mv apps/openclaw/skills/tnf-scaffold apps/<app>/skills/<name>

# validate frontmatter before committing
python3 -c "import yaml,sys; d=yaml.safe_load(open('apps/<app>/skills/<name>/SKILL.md').read().split('---',2)[1]); print(d)"
```

## Conventions enforced by the rest of the repo

- **No README.md / CHANGELOG.md / QUICK_REFERENCE.md** under the skill —
  per the skill-creator spec, those add noise and are forbidden. The skill's
  consumer is an agent, not a human reader.
- **Frontmatter discipline** — `name` + `description` only. No extra keys.
- **Scripts must run** — if you keep a script under `scripts/`, test it
  before committing. Drop it if you don't need it.
- **References stay shallow** — one level deep from SKILL.md. No nested
  references-of-references.

## See also

- `apps/openclaw/skills/skill-creator/SKILL.md` — canonical guide for skill
  design (progressive disclosure, descriptions, anatomy).
- `apps/openclaw/skills/skill-builder/SKILL.md` — TNF-flavoured workflow that
  walks how to author a skill for this codebase.
