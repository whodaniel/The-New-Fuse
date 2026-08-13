---
name: clawhub-skill-scout
description: Discover and rank ClawHub skills using live API data, with safe filtering and install-ready output.
metadata:
  short-description: Find top ClawHub skills quickly
---

# ClawHub Skill Scout

## Purpose

Discover high-signal ClawHub skills from live registry data, rank them by a chosen metric, and return install-ready recommendations.

## Pre-Flight Checklist

1. Confirm network access is available.
2. Confirm `python3` is available.
3. Verify ClawHub API responds:
   - `python3 scripts/check_clawhub_api.py`
4. For safer discovery defaults, use:
   - `--sort downloads --non-suspicious true`

## Self-Referential Knowledge

This skill references:

- `/Users/<owner>/.codex/skills/skill-builder/SKILL.md`
- `/Users/<owner>/.codex/skills/openai-docs/SKILL.md` (workflow style reference)

## Workflow Diagram

```text
User intent
  ->
Parse filters (query/sort/non-suspicious/limit)
  ->
Fetch live skills from ClawHub API
  ->
Rank + trim output
  ->
Return install-ready recommendations
  ->
Optional follow-up: compare alternatives
```

## Core Workflow

1. Run health check:
   - `python3 scripts/check_clawhub_api.py`
2. Fetch ranked skills:
   - `python3 scripts/list_skills.py --sort downloads --non-suspicious true --limit 10`
3. Build install/open shortlist:
   - `python3 scripts/install_shortlist.py --sort downloads --non-suspicious true --limit 5`
   - CloudRuntime CLI execution (project env):  
     `cloud_runtime run -p <project-id> -e <environment> -s <service> python3 scripts/install_shortlist.py --sort downloads --non-suspicious true --limit 5`
   - Open pages directly: `python3 scripts/install_shortlist.py --open --limit 3`
   - Print install commands from your CLI template:
     `python3 scripts/install_shortlist.py --install-template 'openclaw skills add {owner_slug}' --limit 3`
   - Built-in ClawHub installer preset (recommended):
     `python3 scripts/install_shortlist.py --installer clawhub-pnpm --limit 3`
   - CloudRuntime + ClawHub preset:
     `cloud_runtime run -p <project-id> -e <environment> -s <service> python3 scripts/install_shortlist.py --installer clawhub-pnpm --workdir /app --limit 3`
   - Execute install commands:
     `python3 scripts/install_shortlist.py --install-template 'openclaw skills add {owner_slug}' --apply --limit 3`
   - Add resilience for registry rate limits:
     `python3 scripts/install_shortlist.py --installer clawhub-pnpm --apply --retries 2 --retry-delay 12 --limit 3`
4. Surface top candidates with:
   - Name, slug, downloads, stars, installs, latest version, summary.
5. Provide install command pattern:
   - Use `install_shortlist.py` with `--install-template` to match the user's CLI.
   - The script resolves owner handles and produces `<owner>/<slug>` safely.

## Common Mistakes to Avoid

- Using stale cached lists instead of querying the live API.
- Forgetting the `non-suspicious` filter for default recommendations.
- Ranking by stars when user asked for downloads.
- Recommending without showing why (stats + summary).
- Passing `owner/slug` to `clawhub install`; ClawHub expects just `slug`.

## Testing

Run:

```bash
python3 scripts/check_clawhub_api.py
python3 scripts/list_skills.py --sort downloads --non-suspicious true --limit 5
python3 scripts/install_shortlist.py --limit 3
cloud_runtime run -p <project-id> -e <environment> -s <service> python3 scripts/install_shortlist.py --limit 3
python3 scripts/install_shortlist.py --installer clawhub-pnpm --limit 2
```

Expected:

- Health check prints API OK with item count.
- List command prints top 5 rows sorted by downloads.
- Shortlist command prints rank, owner, and ClawHub URLs.

## Integration with TNF

- Use this skill whenever users ask for "best skills", "top downloaded skills", "safe skills", or "find skill for X" against ClawHub.
- Pair with installation workflows after shortlist generation.
