---
name: tnf-master-clock-sync
description: Sync TNF reliability and self-improvement audit loops with master clock cron protocols, including schedule mapping, trigger contracts, escalation paths, and verification checks. Use when Codex must operationalize or harden scheduled TNF loops beyond ad hoc CI triggers.
---

# TNF Master Clock Sync

## Workflow
1. Identify CI loop tasks that require master clock ownership.
2. Map each task to cron cadence and SLA.
3. Define trigger payload contract and expected artifacts.
4. Validate idempotency and lock behavior.
5. Add post-run verification checks and alerting thresholds.

## Reference
Read [references/cron-sync-contract.md](references/cron-sync-contract.md).
