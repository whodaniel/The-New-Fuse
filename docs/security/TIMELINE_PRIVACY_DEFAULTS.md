# Timeline Privacy Defaults

As of 2026-05-06, email/timeline archaeology scripts default to private output.

## Default Behavior

- Output target (default): `data/private/protocols/`
- Public output is opt-in only.

## Control Variables

- `TNF_TIMELINE_OUTPUT_SCOPE=private|public` (default: `private`)
- `TNF_TIMELINE_PRIVATE_DIR=/absolute/or/relative/path`
- `TNF_TIMELINE_PUBLIC_DIR=/absolute/or/relative/path`
- service-role API key environment variable (preferred for private Supabase
  timeline sync/validation scripts)

Helper used by scripts:

- `scripts/timeline/lib/output-paths.mjs`

## Guardrails

Pre-commit/pre-push privacy guard blocks commits that include:

- `data/private/**`
- `data/protocols/*.json|*.jsonl`
- `docs/library/*.md`
- other known personal archaeology artifacts

If public export is intentionally needed, sanitize and copy derivative artifacts
into reviewed documentation paths before commit.
