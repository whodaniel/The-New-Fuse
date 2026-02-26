# OpenClaw Provider Rollout

## Purpose

Expand OpenClaw OAuth routing from Codex to additional providers in controlled
phases: `openai-codex` -> `anthropic` -> `google-antigravity` -> `kilo`.

## Pre-Flight Checklist

1. Confirm Codex path is already stable on at least one instance.
2. Confirm provider-specific OAuth tokens are available and valid.
3. Confirm model IDs exist in gateway provider catalogs.
4. Confirm fallback models are defined for each provider rollout.
5. Confirm rollback target binding exists before applying any new provider.

## Workflow

1. Add provider binding to `scripts/railway/openclaw-oauth-instances.json`.
2. Execute single provider canary on one low-risk service.
3. Validate chat response and logs for model resolution errors.
4. Promote to more services after success.
5. Keep previous provider binding for rollback.

## Provider Mapping Reference

- `openai-codex`:
  - vars: `OPENAI_CODEX_*`, `OPENCLAW_USE_CODEX_OAUTH=true`
- `anthropic`:
  - vars: `ANTHROPIC_OAUTH_ACCESS_TOKEN`, `ANTHROPIC_OAUTH_REFRESH_TOKEN`
- `google-antigravity`:
  - vars: `GOOGLE_ANTIGRAVITY_*`
- `kilo`:
  - vars: `KILO_ACCESS_TOKEN`, `KILO_REFRESH_TOKEN`

## Rollout Guardrails

- One service at a time for first deployment.
- Require `SUCCESS` deploy + `/overview` 200 before next target.
- Enforce audit logs for each binding update and execution.
- Keep each tenant isolated by unique binding key.

## Integration with TNF

Pair this skill with:

- `.agent/skills/openclaw-oauth-rotation/SKILL.md`
- centralized routing controls in Super Admin panel
- orchestration tasks that periodically verify provider validity and trigger
  re-rotation if drift is detected
