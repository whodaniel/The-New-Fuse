# TNF Durable Compute — Cost & Pricing Model (own strategy)

**Status:** draft for profitability planning  
**Date:** 2026-09-05  
**Non-goal:** Do not copy Trigger.dev Free/$10/$50 card. TNF prices its own
product mix (agents, workflows, durable compute, BYOK).

## What we meter (product units)

| Unit                   | Meaning                                   | Used for                           |
| ---------------------- | ----------------------------------------- | ---------------------------------- |
| **Run invocation**     | Each DurableTask run that leaves QUEUED   | Flat fee per start                 |
| **Cost units**         | `durationSec × machineMultiplier`         | Relative compute burn              |
| **Machine multiplier** | small=1 · medium=2 · large=4              | Maps to vCPU/RAM class             |
| **LLM tokens**         | Separate from durable compute             | Already in billing `usageTypeEnum` |
| **Wait / idle**        | Should be **$0** once checkpointing ships | Competitive requirement            |

Cloud runs already stamp `durationMs` + `estimatedCostUnits` on completion
(`apps/api/.../durable-tasks.store.ts`) for future `usage_records` writes.

## Honest cost stack (what TNF pays)

| Layer                                         | Provider options                                                            | Notes                          |
| --------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------ |
| **Control plane**                             | Nest on existing API host (Fly/Railway/VPS)                                 | Already paid — amortize        |
| **Run state**                                 | File store MVP → **Postgres** (Drizzle)                                     | Required for multi-node HA     |
| **Fair queues**                               | In-process tick → **Redis** (Upstash or self-host) when concurrency matters | Add when >1 API replica        |
| **Heavy handlers** (FFmpeg, browsers, Python) | Optional **Cloudflare Containers / Fly Machines / AWS Fargate**             | Only for large machine class   |
| **Long waits**                                | Keep TNF wait-tokens; later checkpoint so idle ≠ billed                     | Matches market expectation     |
| **LLM**                                       | BYOK or TNF-hosted models                                                   | Keep separate SKU from compute |

**Do not** bring Temporal Cloud day-one (high floor ~$100+/mo). **Do not**
require Trigger workers. Optional later: Cloudflare Workflows for edge I/O-bound
steps if unit economics beat TNF workers.

## Competitive frame (for calibration, not cloning)

| Vendor               | Entry signal                                     |
| -------------------- | ------------------------------------------------ |
| Trigger.dev          | Free + usage; Hobby ~$10; Pro ~$50 + compute/sec |
| Inngest              | Free → Pro ~$99/mo on executions                 |
| Cloudflare Workflows | Cheap CPU + steps; sleeps free                   |
| Temporal Cloud       | ~$100+/mo floor                                  |

TNF should win on **platform bundle** (visual workflows + fleet + durable
compute + local CLI), not on being the cheapest pure job runner.

## Suggested TNF packaging (to validate with real COGS)

1. **Included with membership** — modest free durable allowance (e.g. N
   cost-units/mo) so Free/beta users can use `/durable-tasks` without a second
   checkout.
2. **Metered overage** — `$ per 1k invocations` + `$ per 1k cost-units`, priced
   at **≥2× COGS** after infra + support.
3. **Machine class premium** — large handlers only on paid tiers or higher unit
   rates.
4. **BYOK LLM** remains free of TNF token margin; hosted models stay a separate
   margin line.

Work the numbers after 2–4 weeks of `estimatedCostUnits` telemetry before
locking Stripe prices.

## Implementation path

1. ~~Cloud UI Runs / Tasks / Schedules~~ (shipped)
2. ~~Persist to Postgres + write `usage_records` on run terminal states~~
   (shipped — file fallback when DB down)
3. ~~Gate `POST .../trigger` with `MeteredExecutionCostAuthority`~~ (shipped —
   soft by default)
4. ~~Add Redis queue when horizontal scale needs fairness~~ (shipped —
   round-robin fair queue + optional worker)
5. Optional provider adapters for heavy machine classes only

### Ops knobs

| Env                            | Default                      | Meaning                                                        |
| ------------------------------ | ---------------------------- | -------------------------------------------------------------- |
| `TNF_DURABLE_STORE`            | auto                         | `postgres` \| `file` (auto = Postgres when `DATABASE_URL` set) |
| `TNF_DURABLE_FREE_UNITS_MONTH` | `1000`                       | Included cost-units / UTC month                                |
| `TNF_DURABLE_UNIT_USD`         | `0.0001`                     | Estimate USD per cost-unit                                     |
| `TNF_DURABLE_ENFORCE`          | off                          | `1` = deny when over free allowance and no credits             |
| `TNF_DURABLE_CLOUD_ROOT`       | `~/.tnf/cloud-durable-tasks` | File-store root                                                |
| `REDIS_URL`                    | —                            | Enables fair queue when set (or `TNF_DURABLE_REDIS=1`)         |
| `TNF_DURABLE_REDIS`            | auto                         | `0` disables queue; `1` forces Redis attempt                   |
| `TNF_DURABLE_REDIS_PREFIX`     | `tnf:durable`                | Redis key prefix                                               |
| `TNF_DURABLE_WORKER`           | off                          | `1` = background fair drain on this replica                    |
| `TNF_DURABLE_WORKER_POLL_MS`   | `1000`                       | Worker poll interval                                           |
| `TNF_DURABLE_WORKER_BATCH`     | `5`                          | Jobs per poll                                                  |

Fair queue: per-tenant Redis lists + round-robin cursor so one tenant cannot
starve others across API replicas. Without Redis, request-scoped `drain` still
processes the caller’s queue locally.
