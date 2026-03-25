# Skill Bank Operations

Cross-LLM skill sharing for Codex/Claude/Gemini/project skills is handled by the
skill-bank pipeline.

## Purpose

The pipeline centralizes skills into `.agent/skill-bank` so they can be:

- indexed and queried
- snapshotted for reuse
- exported for resource-registry ingestion
- retried safely when registry API persistence fails

## Core commands

Package scripts:

```bash
pnpm run skills:bank:sync
pnpm run skills:bank:query -- jules
pnpm run skills:bank:status
pnpm run skills:bank:ingest
pnpm run skills:bank:retry-pending
```

Equivalent TNF CLI commands:

```bash
./tnf skills bank sync
./tnf skills bank query jules
./tnf skills bank ingest --dry-run
./tnf skills bank retry-pending
```

## Supervisor mode

Run continuously:

```bash
pnpm run skills:bank:supervisor:start
pnpm run skills:bank:supervisor:status
```

Stop:

```bash
pnpm run skills:bank:supervisor:stop
```

Equivalent TNF CLI:

```bash
./tnf skills bank supervisor-start --super-admin-token "<expected-secret>"
./tnf skills bank supervisor-status
./tnf skills bank supervisor-stop --super-admin-token "<expected-secret>"
```

## Generated artifacts

- `skills-index.json`: unified skill catalog with variants and hashes.
- `skills-summary.md`: human-readable totals and duplication summary.
- `resource-registry-import.json`: rows ready for registry API ingestion.
- `pending-import.ndjson`: failed ingests queued for retry.
- `ingest-report.json`: latest ingest run summary.
- `retry-report.json`: latest retry run summary.
- `snapshots/`: portable copies of skill resources by source and hash.

All are written under `.agent/skill-bank/`.

## Environment variables

Ingestion endpoint and auth:

- `RESOURCE_REGISTRY_API_BASE_URL` (fallback: `TNF_API_BASE_URL`,
  `API_BASE_URL`)
- `RESOURCE_REGISTRY_ENDPOINT_PATH` (default: `/api/resources`)
- `RESOURCE_REGISTRY_BEARER_TOKEN` (fallback:
  `TNF_RESOURCE_REGISTRY_BEARER_TOKEN`, `SUPER_ADMIN_TOKEN`)
- `RESOURCE_REGISTRY_API_KEY` (fallback: `TNF_RESOURCE_REGISTRY_API_KEY`,
  `API_KEY`)

Supervisor cadence:

- `SKILL_BANK_INTERVAL_SEC` (default: `900`)

## Notes

- `sync` can run without API availability.
- `ingest` writes failures to `pending-import.ndjson` for later recovery.
- `retry-pending` is idempotent and shrinks pending entries as posts succeed.
- If ingest shows `POST /api/resources -> 404` and marketplace fallback fails,
  deploy backend with `POST /api/resources` enabled or set
  `RESOURCE_REGISTRY_ENDPOINT_PATH` to a valid ingest route. Marketplace submit
  requires a valid member/admin JWT, while `/api/resources` supports API-key
  based ingest.
