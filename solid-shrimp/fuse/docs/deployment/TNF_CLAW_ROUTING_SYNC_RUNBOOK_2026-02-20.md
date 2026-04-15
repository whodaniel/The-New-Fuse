# TNF Claw Routing Variable Sync Runbook (2026-02-20)

## Purpose

Apply centralized adaptive-routing environment variables to all claw services in
one repeatable command.

## Services Covered

- `zeroclaw-sandbox`
- `picoclaw-perplexity`
- `picoclaw-subject`
- `picoclaw-tester`
- `picoclaw-tester-v2`

## Variables Applied

- `TNF_LLM_ROUTING_API_BASE` (default:
  `https://api-production-48f1.up.railway.app`)
- `TNF_LLM_TARGET` (service-specific target)

## Command

From repository root:

```bash
scripts/railway/sync-claw-routing-vars.sh
```

Optional overrides:

```bash
TNF_LLM_ROUTING_API_BASE=https://api-production-48f1.up.railway.app MAX_RETRIES=12 SLEEP_SECONDS=5 scripts/railway/sync-claw-routing-vars.sh
```

## Expected Outcome

- Script exits `0` when all services are updated.
- Script exits `2` when one or more services fail after retry budget.

## Failure Diagnostics

If you see DNS lookup failures against `backboard.railway.com`:

1. Check local resolver health:

```bash
scutil --dns | sed -n '1,120p'
```

2. Confirm Railway domain resolution:

```bash
curl -sS --max-time 8 https://railway.com -I
```

3. Retry sync when DNS recovers:

```bash
scripts/railway/sync-claw-routing-vars.sh
```

## Verification

After successful sync, verify service deployments and health:

```bash
railway status --json | jq -r '.environments.edges[].node.serviceInstances.edges[].node | [.serviceName, .latestDeployment.id, .latestDeployment.status] | @tsv'
```

Then verify adaptive routing payloads for each claw target:

```bash
scripts/railway/verify-adaptive-routing.sh
```
