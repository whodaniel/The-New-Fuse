# 🛡️ TNF Collision Provision — All Collision Types

**Status:** ACTIVE · **Class:** [CLASS:PRIME] · **Protocol ID:**
TNF_COLLISION_PROVISION_CANONICAL **Scope:** Any concurrent or sequential
agents, processes, cron jobs, daemon loops, build pipelines, or operator actions
that touch shared state in the TNF monorepo or its runtime surfaces (Redis,
filesystem, ports, git, processes, APIs, build artifacts). **Location:**
`docs/protocols/TNF_COLLISION_PROVISION.md` **Companion:**
`TNF_CONCURRENT_AGENT_COORDINATION_PROTOCOL.md` (conceptual overlap),
`MULTI_AGENT_INTEGRATION_PROTOCOL.md` (git-level merge conflicts),
`STATE_FRESHNESS_AXIOM_SUITE.md`, `DIRECTIVES.md` (D7, D14, D21).

> This provision answers: **when two or more actors touch the same resource at
> the same or overlapping time, what happens, how do we detect it, and how do we
> prevent data loss or silent corruption?** It sits _below_ the conceptual
> coordination protocol — it governs the mechanical collision of processes
> against shared physical resources, not the conceptual overlap of goals.

---

## 0. The Canonical Incident (do not repeat)

On 2026-08-07, an operator ran `tnf boot` while a parallel build process was
rebuilding workspace packages. The build ran `tsc --build` which cleaned the
`dist/` directory as part of its composite project reference logic. Boot, which
spawns child processes referencing `dist/cli.js`, crashed with
`ERR_MODULE_NOT_FOUND` — not because the code was wrong, but because the build
_artifact_ was transiently absent. Both processes individually succeeded; their
_timing overlap_ produced the failure. This provision exists to prevent every
variant of this class.

---

## 1. Collision Type Taxonomy

Every collision in TNF falls into exactly one of these categories. The table is
exhaustive. When you encounter a collision, classify it here before acting.

| ID  | Collision Type            | Surface                         | Concurrency Model       | Detection                      |
| --- | ------------------------- | ------------------------------- | ----------------------- | ------------------------------ |
| C1  | Build Artifact Clobber    | `dist/`, `node_modules/.cache/` | Sequential / concurrent | File existence check           |
| C2  | Git Working Tree Conflict | Working directory, index, HEAD  | Sequential (git lock)   | `git status`, index lock check |
| C3  | Port Bind Collision       | TCP/UDP ports                   | Concurrent              | `lsof`, port preflight         |
| C4  | Redis Key Race            | Redis KV, pub/sub, streams      | Concurrent              | `SET NX`, `WATCH`/`MULTI`      |
| C5  | Process Spawn Collision   | PID table, detached children    | Concurrent              | `pgrep`, pidfile               |
| C6  | Filesystem Write Race     | Config files, logs, state JSON  | Concurrent              | Atomic writes, mtime check     |
| C7  | Disk Space Exhaustion     | Disk blocks, inodes             | Concurrent              | `df`, disk watchdog            |
| C8  | Terminal/PTY Contention   | TTY allocation                  | Concurrent (1 owner)    | `tty`, `pgrep`                 |
| C9  | Cron/Schedule Overlap     | Cron slots, job timers          | Concurrent              | Lock on job start              |
| C10 | Network/Endpoint Resource | HTTP/WebSocket connections      | Concurrent              | Health check / connect test    |
| C11 | Agent Registry Collision  | Redis `tnf:agent-registry` hash | Concurrent              | `HSET NX` / compare            |
| C12 | Credential/Token Race     | OS keystore, OAuth refresh      | Concurrent              | Token expiry / single writer   |

---

## 2. Per-Type Provisions

### C1 — Build Artifact Clobber

**Trigger:** Concurrent `tsc --build` / `turbo run build` / `pnpm run build` or
rebuild while runtime (boot, dev server, tests) reads from the same `dist/`.

**Prevention:**

1. **Build lock file.** `scripts/build-production.cjs` already acquires
   `.build-production.lock` via `fs.open(path, 'wx')` (exclusive create). All
   build entrypoints (turbo, tsc, boot preflight) MUST check this lock before
   mutating `dist/`. If the lock exists, wait or yield — do not proceed
   concurrently.
2. **Boot must not write, only read.** `tnf boot` launches child processes that
   import from `dist/`. Boot MUST NOT trigger a rebuild as part of its step
   pipeline. If `dist/` is missing, boot reports a clear error pointing to
   `pnpm --filter <package> run build` and aborts — it does not attempt to
   build.
3. **Stale lock cleanup.** Locks older than 10 minutes with no holding process
   (PID in lock file is dead) are safe to remove. The lock file must contain the
   PID of the holder, the start time, and the target package.
4. **No mid-build deletion.** `tsc --build` with `composite: true` may clean
   `dist/` before rebuilding. Wrap with `tmpdir` output + atomic rename, or gate
   the clean behind the lock. If `--clean` is passed, it must hold the exclusive
   lock for the full duration.

**Recovery:**

- If `dist/` is missing and no build is running:
  `pnpm --filter <package> run build` for each missing package, in dependency
  order (infra → shared → core → note-taking → browser → cli).
- If `dist/` was deleted while a runtime process was mid-execution: re-run the
  build, then re-invoke the runtime command. Do NOT retry blindly — the child
  process is dead.

**Canonical command:** `pnpm run build` (root, with lock).

---

### C2 — Git Working Tree Conflict

**Trigger:** Two actors modifying the same files simultaneously, or `git`
operations racing against working-tree edits.

**Prevention:**

1. **Git index lock.** Git's built-in `.git/index.lock` serializes index writes.
   If the lock exists (another actor is mid-commit/add), wait or yield — do not
   `rm .git/index.lock` (it means a process is actively writing).
2. **Overlap Check.** Per `TNF_CONCURRENT_AGENT_COORDINATION_PROTOCOL.md` §2,
   run `git status --short` before producing output against shared artifacts. If
   the target file is already modified by another actor, coordinate.
3. **Stash discipline.** Stashes (`git stash list`) are a tell of interrupted
   flows. Clean stashes before starting new work. Do not let stashes accumulate
   beyond 3 entries — beyond that, they rot.
4. **No concurrent `git checkout` / `git reset`.** These mutate the working tree
   and will corrupt concurrent edits. Only one actor may checkout/reset at a
   time.

**Recovery:**

- If `.git/index.lock` is stale (holder PID is dead): `rm .git/index.lock` is
  safe. Verify PID first.
- If working tree is corrupted: `git checkout -- .` from a clean branch.

---

### C3 — Port Bind Collision

**Trigger:** Two processes binding the same port (e.g., two relay servers on
:3000, two dev servers on :3001). Already addressed by `tnf ports preflight`.

**Prevention:**

1. **Port preflight gate.** `scripts/tnf-ports.cjs preflight` runs before boot
   and before `pnpm dev`. All services MUST declare their ports and the
   preflight MUST resolve conflicts before launch.
2. **Kill-then-rebind is NOT safe** unless the owning process is known to be
   dead. Prefer `--port <next-available>` or abort with diagnostic.
3. **Protected ports.** Core service ports (3000, 3001, 3005, 6379, 6380)
   require `TNF_ALLOW_PROTECTED_PORT_TERMINATION=true` to kill.

**Recovery:**

- `lsof -i :<port>` to identify the holder.
- If the holder is a known daemon (relay, master-clock):
  `tnf services stop <name>` then retry.
- If the holder is unknown: do not kill. Report and yield.

---

### C4 — Redis Key Race

**Trigger:** Concurrent writes to the same Redis key, or `BRPOP` consumers
racing for the same queue element.

**Prevention:**

1. **`SET NX` for locks.** Distributed locks use `SET key value NX PX <millis>`.
   The holder MUST release via Lua compare-and-delete to avoid releasing
   another's lock. (Pattern exists in `RedisTransport.ts`.)
2. **`WATCH`/`MULTI` for read-modify-write.** When an agent reads a value and
   then writes a new one based on it, wrap in `WATCH` → `MULTI` → `EXEC`. If
   `EXEC` returns null, the key changed since `WATCH` — retry or yield.
3. **`BRPOP` ownership.** Redis `BRPOP` is atomic — one consumer gets the
   element. Do not have two consumers on the same queue unless they are
   idempotent (safe to both process). Broker Agent is the designated consumer of
   `tnf:master:tasks:realtime`; other agents should not also `BRPOP` it.
4. **Agent registry.** Use `HSETNX` or `HSET NX`-equivalent for agent
   registration to avoid two agents overwriting each other's heartbeat key.
5. **Heartbeat keys are authoritative.** Agent heartbeats are overwritten on
   each tick — this is intentional. Read the heartbeat to determine liveness,
   don't cache it past 10s.

**Recovery:**

- If a distributed lock is stuck (holder PID dead): check TTL; wait for expiry
  or force-delete if TTL is missing.
- If a queue element was consumed twice (rare under Redis semantics): design
  consumers to be idempotent. If not, replay from the handoff log.

---

### C5 — Process Spawn Collision

**Trigger:** Daemon launched twice, or a child process spawned while its
predecessor is still alive (zombie accumulation).

**Prevention:**

1. **PID files.** All daemons write a PID file on launch (`~/.tnf/<daemon>.pid`
   or similar). Before spawning, read the PID file; if the PID is alive
   (`kill -0 $(cat pidfile)`), do not spawn — either reuse the existing or
   report "already running".
2. **`detached: true` with `unref`.** Detached daemons must `unref()` so they
   survive parent exit and do not hold the parent's stdout/stderr.
3. **Zombie cleanup.** Daemon watchdogs (e.g., heartbeat selfwake) kill stale
   processes idle beyond threshold. Existing: `tnf-heartbeat-selfwake.py` kills
   Redis connections idle >300s with <5s activity.
4. **No blind `pkill`.** Pattern-matching `pkill tnf` kills everything including
   unrelated processes. Use PID-targeted kills.

**Recovery:**

- `pgrep -f <daemon>` to find instances.
- Kill by PID, not by pattern. If pattern-matching is unavoidable, scope with
  exact-match flags (`pgrep -f "${REPO}/scripts/<name>"` not just `<name>`).

---

### C6 — Filesystem Write Race

**Trigger:** Two processes writing the same config file, log file, or state JSON
simultaneously.

**Prevention:**

1. **Atomic writes.** All file writes that other processes read must be atomic:
   write to `<path>.tmp` then `rename` to `<path>`. `write_file` in the Hermes
   tool stack does this. Direct `fs.writeFileSync` to shared paths is forbidden.
2. **Append-only logs.** Log files are append-only. Use `>>` (shell) or
   `flags: 'a'` (Node). Never truncate (`>` or `fs.writeFile` without `'a'`).
3. **No truncated-then-write on shared state.** State files
   (`runtime-state.json`, boot receipt, handoff packets) are atomic-write-only.
   If two actors both need to write, they write to different files and a
   convergence step picks canonical.
4. **mtime check.** Before writing a shared file, check `stat.mtimeMs`. If the
   file is newer than your session start, _read it before overwriting_ — it may
   have been written by another actor. Merge or yield.

**Recovery:**

- If a state file is corrupted (truncated, invalid JSON): check `.bak` sidecar
  files. Most protocol state files have `.bak` variants (e.g.,
  `LIVING_STATE.md.bak`).
- If two actors both overwrote each other's state: converge by taking the union
  of non-conflicting fields, picking the later for conflicting fields, and
  recording the divergence in `swarm-context.md`.

---

### C7 — Disk Space Exhaustion

**Trigger:** Concurrent processes (builds, logs, audio cache) fill the disk.
Common on small SSDs (2015 MacBook Pro, ~14GB free).

**Prevention:**

1. **Disk watchdog.** Run `ops:disk-retention`
   (`scripts/operations/swarm-disk- retention.sh`) periodically. Below 1GB free,
   abort non-essential processes and alert.
2. **Audio cache cleanup.** `~/.hermes/audio_cache/` grows fast. Cap at 500MB,
   auto-prune oldest.
3. **Gateway error log rotation.** Rotate at 10MB; keep 3 generations.
4. **No concurrent large builds.** If disk is below 5GB, do not run two
   TypeScript builds simultaneously. The lock (C1) serializes this.
5. **find/du on large trees causes emergencies.** Do not run `find /` or
   `du -sh /` when disk is tight — their own I/O kills the machine. Scope finds
   to specific directories.

**Recovery:**

- Run `skill:disk-emergency-recovery` — it has triage steps.
- Quick wins: `rm -rf ~/.hermes/audio_cache/*`, truncate gateway error logs.

---

### C8 — Terminal/PTY Contention

**Trigger:** Multiple agents, daemons, or operator sessions vying for the same
TTY. Node `detached` processes that still reference a parent TTY block the
parent.

**Prevention:**

1. **One TTY per lane.** When launching an AI CLI (Codex, Claude, Gemini), it
   owns its TTY. Do not spawn another interactive process in the same window —
   background or new terminal.
2. **Detached daemons use no TTY.**
   `spawn(..., { detached: true, stdio: ['ignore', 'ignore', 'ignore'] })` —
   never inherit a TTY for long-running daemons.
3. **Boxed-TUI guard.** Existing: terminal attention guard detects boxed-TUI
   composers (commit 894318ea22). Do not bypass.

**Recovery:**

- `pkill -f <tui-process>` if stuck.
- Reset terminal: `reset` (not `clear` — `reset` re-initializes).

---

### C9 — Cron/Schedule Overlap

**Trigger:** A cron job fires again before the previous run completed (long-
running job + short interval). Two cron jobs touch the same artifact.

**Prevention:**

1. **Per-job lock.** Each cron job acquires a lock (filesystem or Redis) on
   start. If locked, skip this run — the previous instance is still running.
   Release on exit (including error exit).
2. **Idempotent jobs.** Where possible, design jobs so re-running produces the
   same result without side-effect accumulation (e.g., "summarize latest state"
   is idempotent; "append a log entry" is not).
3. **No overlapping schedule for non-idempotent jobs.** If a job takes 6
   minutes, do not schedule every 5 minutes. Add 50% headroom.
4. **Bow-wave / no recursive scheduling.** Cron-run sessions SHALL NOT
   recursively `cronjob create` more jobs (per Hermes tool description).

**Recovery:**

- If two job instances overlapped and both wrote artifacts: converge as C6.
- Kill the later instance by PID, preserve the earlier.

---

### C10 — Network/Endpoint Resource

**Trigger:** Two processes holding HTTP/WebSocket connections to the same
endpoint, exhausting connection limits or session slots.

**Prevention:**

1. **Connection pooling.** HTTP clients reuse connections via `keepAlive`. Do
   not open a new connection per request.
2. **WebSocket: one client per channel.** The Hermes ↔ TNF bridge is one
   WebSocket per direction. Do not create a second bridge connection — it will
   duplicate messages and may receive stale callbacks.
3. **Health check before connect.** For a process that depends on a remote
   service (API, frontend), health-check before use. If the service reports
   unhealthy, back off — do not hammer.

**Recovery:**

- `lsof -i :<port>` for connection counts.
- Restart the misbehaving client.

---

### C11 — Agent Registry Collision

**Trigger:** Two agents register with the same ID, or one agent re-registers
while its old heartbeat record is still live.

**Prevention:**

1. **ID uniqueness.** Agent IDs are determined by `.agent/agents/<id>.md` — do
   not pick an ID that already exists. When in doubt, `tnf agents who`.
2. **Heartbeat overwrite is expected.** An agent re-registering with the same ID
   overwrites the old record — this is how liveness refreshes. The old record is
   safe to overwrite because the agent is the same identity.
3. **Bus registration counts.** The boot summary shows "Bus registrations: 431
   across 13 agent name(s)". If the count of agents drops or duplicates
   unexpectedly, run `tnf agents who` and `check-agent-registration.cjs`.
4. **Checkout `tnf:agent-registry` before writing.** Use
   `HGETALL tnf:agent-registry` to see who's already there.

**Recovery:**

- `redis-cli DEL tnf:agent-registry` (full reset, only when all agents are down
  and re-registering from scratch is intended).
- Otherwise, remove specific stale entries with `HDEL`.

---

### C12 — Credential/Token Race

**Trigger:** Two processes both refresh an OAuth token at the same time,
invalidating each other. Or a credential is rotated while an agent is mid-use.

**Prevention:**

1. **Single writer for credentials.** Only the credential broker
   (`packages/relay-core` CredentialBroker) writes credentials to the keystore.
   Other agents request credentials via the broker — they do not write directly.
2. **Refresh serialization.** Token refresh must hold a distributed lock (C4) so
   two simultaneous refreshes don't fight. The first refresh writes the new
   token; the second sees it already refreshed and reuses it.
3. **No token sharing by file.** Do not write tokens to disk for inter-process
   sharing — use the broker's in-memory store or Redis.

**Recovery:**

- If both processes get a different token: the later refresh wins; the earlier
  is invalid. Re-auth via the broker.
- If the keystore itself is corrupted: re-run OAuth flow via `tnf auth`.

---

## 3. Universal Detection — the Pre-Action Check

Before any actor (agent, daemon, cron job, build, boot) mutates a shared
resource, run this check:

1. **Build lock** (if mutating `dist/`): is `.build-production.lock` present and
   holder alive?
2. **Git index** (if committing/staging): is `.git/index.lock` present?
3. **Port availability** (if binding): `lsof -i :<port>` — is someone there?
4. **Redis lock** (if mutating a shared key): acquire `SET NX` on
   `tnf:lock:<resource>` with TTL.
5. **Process liveness** (if spawning a daemon): does the PID file exist and is
   the PID alive?
6. **Disk headroom** (if writing >100MB): `df -h .` — is there room?
7. **File mtime** (if overwriting shared state): is the file newer than your
   session start?

If any check shows contention: wait, yield, or coordinate. Do not proceed
blindly.

---

## 4. Universal Recovery — the Post-Collision Check

After any collision, verify:

1. **Artifact integrity**: re-run the build that produced the artifact; confirm
   it succeeds and the output matches.
2. **State convergence**: confirm exactly one canonical state. Read all the
   usual sources (`LIVING_STATE.md`, `swarm-context.md`, Redis hash) and confirm
   they agree.
3. **Process cleanup**: confirm no orphaned processes, no stale locks, no leaked
   file descriptors.
4. **Log the collision**: record what collided, the detection signal, and the
   resolution in `data/protocols/COLLISION_LOG.jsonl` (gitignored, append-only).

---

## 5. Escalation

- If you cannot classify the collision within this taxonomy, it is a new
  collision type. Record it in `swarm-context.md` and propose an addition here.
- If two agents both attempt recovery and their recoveries conflict, escalate to
  the Director (`tnf活着`) to pick one recovery path.
- State-dir damage (one "cleaned up" another's `.agent/` or `.tnf/`) is
  Anti-Lobotomy (D7) violation — HITL only, document in the collision log.

---

## 6. Relationship to Other Protocols

| Protocol                                     | Scope                                                        | This provision's role                                                                                       |
| -------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `TNF_CONCURRENT_AGENT_COORDINATION_PROTOCOL` | Conceptual overlap (two agents adopt the same goal/artifact) | Sibling — that governs _what_ gets produced; this governs _how the runtime survives concurrent production_. |
| `MULTI_AGENT_INTEGRATION_PROTOCOL`           | Git-level merge conflicts                                    | Sibling — that governs branch integration; this governs working-tree integrity outside merge.               |
| `STATE_FRESHNESS_AXIOM_SUITE`                | Knowledge freshness                                          | Foundation — freshness is the signal that detects many collisions (stale state means another actor wrote).  |
| `DIRECTIVES.md` (D7)                         | Anti-Lobotomy                                                | Enforcement — state-dir damage is both a collision (C5/C6) and an Anti-Lobotomy violation.                  |
| `DIRECTIVES.md` (D14)                        | Handoff Enforcement                                          | Handoff packets are a collision surface (C6) — atomic writes required.                                      |
| `TNF_ARTIFACTS_LIFECYCLE_PROTOCOL`           | Artifact lifecycle                                           | Adjacent — artifacts move through lifecycle states; collisions happen at transitions.                       |

---

## 7. Failure Modes to Avoid

- **Silent concurrent rebuild** — two builds run at once, one clobbers the
  other's `dist/`. → Build lock (C1) before any `tsc --build`.
- **Blind retry after lock** — a locked resource becomes available, but the
  retrying actor uses stale state from before the lock. → Pre-Action Check (§3)
  after acquiring the lock, not before.
- **PID-file reuse by the OS** — a daemon's PID file still records the old PID,
  which the OS has since given to an unrelated process. → Verify the PID matches
  the expected process, not just that the PID is alive.
- **Lock file orphaned on crash** — a process crashed without releasing its
  lock; subsequent actors see the lock forever. → Locks contain PID + start
  time; stale locks (>TTL, dead PID) are safe to remove.
- **Two actors, one file, no merge** — both write the same state file; last
  writer wins silently. → Atomic writes + mtime check (C6); if overlap detected,
  converge and log.

---

_Sources: `TNF_CONCURRENT_AGENT_COORDINATION_PROTOCOL.md` ·
`MULTI_AGENT_INTEGRATION_PROTOCOL.md` · `STATE_FRESHNESS_AXIOM_SUITE.md` ·
`DIRECTIVES.md` (D7, D14, D21) · `scripts/build-production.cjs` (existing lock
pattern) · `packages/relay-core/src/transports/RedisTransport.ts` (existing
distributed lock pattern) · 2026-08-07 build-vs-boot incident_
