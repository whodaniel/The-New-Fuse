# Full-auto installation and recovery

A successful CLI build refreshes the install seal only when the installed pnpm
lock matches the workspace lock and every CLI-critical artifact exists. Run
`pnpm install --frozen-lockfile` before building. If installation rejects a
manifest/lock mismatch, reconcile the dependency change first; do not bless the
old installation by overwriting its seal.

The protected `tnf full-auto once` command is also the recovery entrypoint for a
quarantined loop. It admits exactly one attempt after the normal substrate,
Redis, doctor, and exclusive-PID checks. Recovery requires every stage and the
strict quality gate; skip flags cannot clear quarantine. A failed attempt leaves
the quarantine in place and appends its actual error to the run log. A strict
pass clears quarantine while preserving historical success/failure totals and
monotonic cycle numbering.

After recovery, run `tnf full-auto status`, then `tnf full-auto daemon start`.
Verify the live process, current state, and new cycle receipts. A process launch
or old passing scorecard alone is not proof that the next cycle succeeded.

Full-auto command outcomes retain action receipts but use the cycle circuit
breaker instead of the global command-escalation state. Repeated audit failures
therefore quarantine full-auto without blocking unrelated boot commands. Other
global escalation halts remain enforced and require their own remediation.
