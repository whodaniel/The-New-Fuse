`[CLASS:PUBLIC_CONTRACT] [STATUS:ACTIVE] [VISIBILITY:PUBLIC]`

# TNF Local Policy Extension

## Purpose

Keep the TNF open agent capable of making useful local choices without publishing TNF's proprietary hosted optimization defaults.

The public runtime separates:

- **eligibility/gates** — public protocol constraints such as capability, authority, boundary, explicit operator requirements and objective compatibility; from
- **preference/optimization** — a policy that chooses among otherwise eligible options.

## Local policy ownership

An open-runtime operator may supply an inspectable local policy. TNF does not require a hosted service for this.

For model/provider observations the public runtime accepts:

```bash
TNF_LOCAL_LLM_POLICY_FILE=/path/to/local-policy.json pnpm run tnf:llm:optimize
```

Example structure:

```json
{
  "owner": "operator",
  "id": "my-local-model-policy",
  "eligibleHealth": ["live", "timeout"],
  "preferredModels": [],
  "excludedModels": [],
  "weights": {
    "arenaScore": 0,
    "arenaRank": 0,
    "latencyMs": 0,
    "healthLive": 0,
    "healthTimeout": 0,
    "preferred": 0
  }
}
```

The numbers are intentionally operator-owned. The open distribution does not embed TNF's hosted optimized weights.

## Mutation requires an explicit plan

Observation/ranking does not itself authorize changing provider configuration.

To apply changes, provide an explicit operator/user-owned plan:

```json
{
  "owner": "operator",
  "changes": [
    {
      "target": "modelProviders",
      "action": "set-priority",
      "model": "example/model",
      "priority": 10
    }
  ]
}
```

Preview:

```bash
pnpm run tnf:llm:apply-rankings -- --plan ./my-plan.json
```

Apply after review:

```bash
pnpm run tnf:llm:apply-rankings -- --plan ./my-plan.json --apply
```

## Protocol invariant

The open agent remains capable because it retains:

- local observation;
- explicit eligibility gates;
- operator-configurable policy;
- deterministic fallbacks;
- explicit mutation plans;
- receipts/backups;
- optional hosted policy contracts.

What remains proprietary is TNF's particular hosted scoring, learned parameters, private evidence/context synthesis, and cross-system optimization—not the public agent's ability to reason and act under a transparent local policy.
