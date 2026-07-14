# Master Clock Sync Audit

Generated at: 2026-03-26T20:29:07.310Z

## Summary

- Processes: 23
- Enabled: 21
- Manual cadence: 1
- Escalations: 10 (7 critical / 3 warning)

## Process Map

| Process                                        | Cadence         | SLA start delay | Runtime status | Last run                 | Escalation                |
| ---------------------------------------------- | --------------- | --------------- | -------------- | ------------------------ | ------------------------- |
| tnf-master-clock-super-cycle                   | _/15 _ \* \* \* | 30m             | healthy        | 2026-03-26T17:00:27.161Z | critical:stale_run_window |
| tnf-self-improvement-scorecard                 | 0 _/6 _ \* \*   | 720m            | healthy        | 2026-03-26T16:49:57.933Z | none                      |
| tnf-twip-macro-board-refresh                   | _/10 _ \* \* \* | 20m             | healthy        | 2026-03-26T17:00:56.902Z | critical:stale_run_window |
| tnf-terminal-awareness-reminder                | _/30 _ \* \* \* | 60m             | healthy        | 2026-03-26T17:01:46.794Z | critical:stale_run_window |
| tenant-terminal-awareness-default              | 0 \* \* \* \*   | 120m            | healthy        | 2026-03-26T17:01:01.980Z | warning:stale_run_window  |
| tenant-personal-archaeology-master-loop        | _/30 _ \* \* \* | 60m             | healthy        | 2026-03-26T17:00:59.594Z | critical:stale_run_window |
| tenant-personal-archaeology-investigator-pulse | 15 _/2 _ \* \*  | n/a             | healthy        | 2026-03-23T06:15:12.779Z | none                      |
| tenant-personal-archaeology-digest             | 0 _/12 _ \* \*  | 1440m           | healthy        | 2026-03-26T16:50:04.578Z | none                      |
| tenant-personal-archaeology-blocker-watch      | _/15 _ \* \* \* | 30m             | healthy        | 2026-03-26T17:01:05.658Z | critical:stale_run_window |
| tenant-daily-priority-plan                     | 0 9 \* \* \*    | 2880m           | healthy        | 2026-03-26T16:50:06.062Z | none                      |
| tenant-nightly-maintenance                     | 30 3 \* \* \*   | n/a             | healthy        | 2026-03-23T07:30:18.707Z | none                      |
| tenant-orchestrator-pulse                      | _/30 _ \* \* \* | 60m             | running        | 2026-03-26T17:01:03.646Z | critical:stale_run_window |
| tenant-self-improvement-loop                   | 0 _/2 _ \* \*   | 240m            | healthy        | 2026-03-26T16:50:07.431Z | none                      |
| tenant-continuous-qa-loop                      | 0 _/6 _ \* \*   | 720m            | healthy        | 2026-03-26T16:50:08.134Z | none                      |
| tenant-hourly-attribution-audit                | 0 \* \* \* \*   | 120m            | healthy        | 2026-03-26T17:01:11.338Z | warning:stale_run_window  |
| tenant-knowledge-scout-sprint                  | 0 _/4 _ \* \*   | 480m            | healthy        | 2026-03-26T16:50:09.487Z | none                      |
| tenant-loop-watchdog                           | _/15 _ \* \* \* | 30m             | unknown        | never                    | none                      |
| tenant-launch-validation                       | manual          | n/a             | unknown        | never                    | none                      |
| tnf-openclaw-runtime-sync                      | _/15 _ \* \* \* | 30m             | healthy        | 2026-03-26T16:50:09.730Z | critical:stale_run_window |
| tnf-staff-role-call-and-scheduling             | _/20 _ \* \* \* | 40m             | healthy        | 2026-03-26T20:28:34.665Z | none                      |
| tnf-growth-blocker-audit                       | 0 _/4 _ \* \*   | 480m            | unknown        | never                    | warning:last_run_presence |
| tnf-staffing-director-cycle                    | 30 _/6 _ \* \*  | n/a             | healthy        | 2026-03-26T20:28:34.515Z | none                      |
| tnf-staff-review-cycle                         | 15 _/2 _ \* \*  | n/a             | healthy        | 2026-03-26T20:28:34.484Z | none                      |

## Contract Compliance

- Inputs enforced: schedule expression, target task command, environment
  context, artifact locations.
- Outputs emitted: run status, artifact pointers, escalation signal.
- Validation gates: lock overlap prevention, bounded retries, and surfaced
  failures via control-plane state/runtime history.
