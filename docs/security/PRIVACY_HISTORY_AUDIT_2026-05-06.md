# Privacy History Audit (2026-05-06)

## Scope

- Repository: `The-New-Fuse`
- Audit date (UTC): 2026-05-06
- Objective: verify current tracked exposure, history risk surface, and define
  deterministic cleanup actions.

## Method

- Current tree scans were run on tracked files using `git grep`.
- History metadata baseline was generated with `git filter-repo --analyze`.
- Results were captured before any destructive history rewrite.

## Current Tree Findings

1. Absolute owner home-path references (owner-local home path marker): **651
   files**.
2. Mailbox-format markers (Apple Mail container/extension signatures): **1
   file** (the privacy guard regex definition itself).
3. Personal-domain email references (`@yahoo.com`, `@gmail.com`, `@icloud.com`,
   `@hotmail.com`, `@outlook.com`): **153 files**.

Top-level directories with owner home-path references:

- `.agent`: 200
- `.skills`: 193
- `apps`: 102
- `scripts`: 61
- `docs`: 25
- `data`: 25
- `packages`: 19
- `cloudflare-sharedstate`: 15

Top-level directories with personal-domain email references:

- `worktrees`: 41
- `apps`: 41
- `packages`: 36
- `docs`: 16
- `.agent`: 12

## History Baseline (`git filter-repo --analyze`)

From `.git/filter-repo/analysis/README`:

- Commits: **5897**
- Filenames in history: **117200**
- Directories in history: **22363**
- Total unpacked content size: **6,449,120,557 bytes**

This confirms a large historical surface where sensitive strings may exist
beyond current HEAD.

## Controls Added In This Workstream

1. Hook-based privacy guardrails are active in pre-commit and pre-push.
2. Commit identity is enforced away from personal mailbox accounts.
3. Private archaeology artifacts are routed by default to ignored local storage
   (`data/private/`).
4. Timeline/Supabase pipeline script defaults now write to
   `data/private/protocols/` unless explicitly overridden.
5. Guard now blocks commits from:

- `data/private/**`
- `data/protocols/*.json|jsonl`
- `docs/library/*.md`
- other known private archaeology surfaces

## History Remediation Plan (Required Before Public Mirror Guarantee)

1. Freeze pushes from this repo until rewrite is complete.
2. Create a mirror backup: `git clone --mirror ...`.
3. Build `replace-text` rules for:

- owner home-path signature
- personal mailbox addresses
- known local mailbox path fragments

4. Run `git filter-repo` rewrite against all refs.
5. Re-run this audit (`git grep` + `filter-repo --analyze`) and confirm zero
   residual matches for blocked private signatures.
6. Force-push rewritten refs and coordinate clone reset for all consumers.

## Residual Risk

- Until history rewrite is executed and remote refs are replaced, previously
  pushed sensitive strings may still exist in git history even if removed from
  current HEAD.
