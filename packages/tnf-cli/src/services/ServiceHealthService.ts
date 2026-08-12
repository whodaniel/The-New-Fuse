/**
 * packages/tnf-cli/src/services/ServiceHealthService.ts
 *
 * Health of TNF's launchd services — the surface whose absence let two
 * services fail silently for hours.
 *
 * WHAT THIS CLOSES
 *   On 2026-08-12, `com.tnf.ws-green-blue-bridge` was in a permanent crash
 *   loop (V8 OOM at ~4 GB, SIGABRT every ~39 minutes, restarted by launchd
 *   each time) and `com.tnf.subdirector-autopilot` had died of ENOSPC and been
 *   unloaded entirely. Neither appeared in `tnf agents list`, `tnf doctor`, or
 *   any other health surface. Both were visible only by reading `launchctl
 *   list` exit codes by hand.
 *
 *   TNF_UNBOUNDED_GROWTH_AUDIT.md states the rule this implements: a service
 *   that can only be observed by noticing it is missing is not monitored.
 *
 * WHY EXIT CODES ARE NOT ENOUGH ON THEIR OWN
 *   launchd reports the LAST exit status. A KeepAlive service that crashes and
 *   is restarted looks identical to a healthy one a moment later — the status
 *   flickers between 0 and the failure. So a negative status (killed by
 *   signal) is treated as failing even though the process is running again,
 *   and the plist's own log paths are checked for recent fatal output. That
 *   combination is what distinguishes "restarted cleanly" from "restarting
 *   forever".
 */

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

export type ServiceState =
  | 'running'
  | 'crash-loop'
  | 'restarted'
  | 'failed'
  | 'not-loaded'
  | 'idle';

export interface ServiceHealth {
  label: string;
  state: ServiceState;
  /** launchd PID, or null when not currently running. */
  pid: number | null;
  /** Last exit status as launchd reports it. Negative means killed by signal. */
  lastExit: number | null;
  /** Human-readable explanation, suitable for a terminal line. */
  detail: string;
  /** Plist present on disk but not loaded into launchd. */
  plistPath?: string;
  /** Recent fatal-looking lines from the service's own stderr, if any. */
  evidence?: string[];
}

/** Signals worth naming, so `-6` reads as SIGABRT rather than a magic number. */
const SIGNALS: Record<number, string> = {
  1: 'SIGHUP',
  2: 'SIGINT',
  6: 'SIGABRT',
  9: 'SIGKILL',
  11: 'SIGSEGV',
  15: 'SIGTERM',
};

/** Patterns that mean "this did not merely stop, it broke". */
const FATAL_PATTERNS = [
  /FATAL ERROR/i,
  /heap out of memory/i,
  /ENOSPC/i,
  /EADDRINUSE/i,
  /Cannot find module/i,
  /\bfatal:/i,
  /unhandled (rejection|exception)/i,
];

export interface LaunchctlRow {
  pid: number | null;
  status: number | null;
  label: string;
}

/** Parse `launchctl list` output. Never throws — a parse failure is empty. */
export function parseLaunchctlList(raw: string): LaunchctlRow[] {
  const rows: LaunchctlRow[] = [];
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('PID')) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length < 3) continue;
    const [pidRaw, statusRaw, ...labelParts] = parts;
    const label = labelParts.join(' ');
    if (!label) continue;
    rows.push({
      pid: pidRaw === '-' ? null : Number.parseInt(pidRaw, 10),
      status: statusRaw === '-' ? null : Number.parseInt(statusRaw, 10),
      label,
    });
  }
  return rows;
}

function describeExit(status: number | null): string {
  if (status === null) return 'no recorded exit';
  if (status === 0) return 'exit 0';
  if (status < 0) {
    const sig = SIGNALS[Math.abs(status)];
    return `killed by ${sig ?? `signal ${Math.abs(status)}`} (${status})`;
  }
  return `exit ${status}`;
}

/**
 * Classify one launchd row.
 *
 * A negative status means the process was killed by a signal. Under
 * KeepAlive that is a crash LOOP rather than a one-off, because launchd has
 * already restarted it — which is exactly how the WS bridge stayed broken for
 * hours while `launchctl list` intermittently showed a healthy pid.
 */
export function classify(row: LaunchctlRow, hasRecentFatal = false): ServiceState {
  if (row.status !== null && row.status < 0) {
    // Killed by a signal. If it is running again, that alone does NOT mean a
    // crash loop — an operator `launchctl kickstart -k` leaves exactly this
    // trace, and reporting seven healthy services as crash-looping is the same
    // trust-destroying false signal, inverted, that this surface exists to
    // remove. Only corroborated failure earns 'crash-loop'.
    if (row.pid !== null && !hasRecentFatal) return 'restarted';
    return 'crash-loop';
  }
  if (row.status !== null && row.status > 0)
    return row.pid !== null && !hasRecentFatal ? 'restarted' : 'failed';
  if (row.pid !== null) return 'running';
  return 'idle';
}

export class ServiceHealthService {
  constructor(
    private readonly home: string = os.homedir(),
    private readonly labelPrefixes: string[] = ['com.tnf.', 'com.thenewfuse.']
  ) {}

  private launchAgentsDir(): string {
    return path.join(this.home, 'Library', 'LaunchAgents');
  }

  /** Plists on disk whose label we manage, mapped label -> path. */
  private plistsOnDisk(): Map<string, string> {
    const out = new Map<string, string>();
    try {
      for (const name of fs.readdirSync(this.launchAgentsDir())) {
        // `.disabled.*` suffixes are deliberate operator parking, not faults.
        if (!name.endsWith('.plist')) continue;
        const label = name.replace(/\.plist$/, '');
        if (!this.labelPrefixes.some((p) => label.startsWith(p))) continue;
        out.set(label, path.join(this.launchAgentsDir(), name));
      }
    } catch {
      /* no LaunchAgents dir — nothing to report */
    }
    return out;
  }

  private launchctlRows(): LaunchctlRow[] {
    try {
      const raw = execFileSync('launchctl', ['list'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      return parseLaunchctlList(raw).filter((r) =>
        this.labelPrefixes.some((p) => r.label.startsWith(p))
      );
    } catch {
      return [];
    }
  }

  /** Log paths declared by a plist, so evidence comes from the service itself. */
  private logPathsFor(plistPath: string): string[] {
    try {
      const raw = fs.readFileSync(plistPath, 'utf8');
      return [...raw.matchAll(/<key>Standard(?:Out|Error)Path<\/key>\s*<string>([^<]+)<\/string>/g)]
        .map((m) => m[1])
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  /**
   * Recent fatal-looking lines, newest last. Bounded read — logs can be huge.
   *
   * Age-gated deliberately. The first version of this surfaced a
   * "Cannot find module tnf-fleet-mode.cjs" from master-heartbeat that had
   * already been fixed by a re-sync hours earlier — a stale line from a log
   * tail, presented as a current fault. A health surface that reports
   * long-resolved errors as live is the same false signal this whole surface
   * exists to remove, so evidence is only drawn from logs written recently.
   *
   * The age label describes the LOG, not the line. A live service can hold an
   * old fatal line inside the tail window — relay-monitor does exactly that,
   * still writing while its ENOSPC lines predate the disk being freed. Without
   * per-line timestamps (which these formats do not reliably carry) claiming
   * line-level recency would be a fresh false signal, so the label says
   * "log active Nm ago" and leaves the judgement to the reader.
   */
  /**
   * Start time of a running process, in epoch ms. Null when unavailable.
   *
   * This is what makes evidence belong to the CURRENT run. Without it, a
   * service that crashed hours ago, was restarted, and is now perfectly
   * healthy still looks broken because its old fatal lines sit inside the log
   * tail — relay-monitor did exactly that, flagged as crash-looping while
   * running cleanly and not writing at all.
   */
  private processStartMs(pid: number | null): number | null {
    if (!pid) return null;
    try {
      const out = execFileSync('ps', ['-o', 'lstart=', '-p', String(pid)], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      const ms = Date.parse(out);
      return Number.isFinite(ms) ? ms : null;
    } catch {
      return null;
    }
  }

  private evidenceFrom(
    logPaths: string[],
    maxLines = 3,
    maxAgeMs = 6 * 60 * 60 * 1000,
    sinceMs: number | null = null
  ): string[] {
    const found: string[] = [];
    for (const p of logPaths) {
      try {
        const stat = fs.statSync(p);
        if (!stat.isFile() || stat.size === 0) continue;
        const ageMs = Date.now() - stat.mtimeMs;
        if (ageMs > maxAgeMs) continue; // resolved long ago; not current evidence
        // Written before the current process started => it belongs to a prior
        // run that has already been replaced. Not evidence about now.
        if (sinceMs !== null && stat.mtimeMs < sinceMs) continue;
        const ageLabel =
          ageMs < 60_000
            ? `${Math.round(ageMs / 1000)}s ago`
            : ageMs < 3_600_000
              ? `${Math.round(ageMs / 60_000)}m ago`
              : `${Math.round(ageMs / 3_600_000)}h ago`;
        // Read only the tail; these files have reached gigabytes before.
        const readBytes = Math.min(stat.size, 64 * 1024);
        const fd = fs.openSync(p, 'r');
        const buf = Buffer.alloc(readBytes);
        fs.readSync(fd, buf, 0, readBytes, stat.size - readBytes);
        fs.closeSync(fd);
        for (const line of buf.toString('utf8').split('\n').reverse()) {
          if (found.length >= maxLines) break;
          const t = line.trim();
          if (t && FATAL_PATTERNS.some((re) => re.test(t))) {
            found.push(`[log active ${ageLabel}] ${t.slice(0, 160)}`);
          }
        }
      } catch {
        /* unreadable log is not itself a fault */
      }
      if (found.length >= maxLines) break;
    }
    return found;
  }

  /**
   * Full health report across every managed service.
   *
   * `evidence: false` skips reading service logs. Gathering evidence stats and
   * tail-reads every declared log path, which pushed `tnf doctor` past its 30s
   * latency budget when this was first wired in. Callers that only need states
   * — doctor's summary panel, cron checks — should opt out; `tnf services`
   * keeps it on.
   */
  report(options: { evidence?: boolean } = {}): ServiceHealth[] {
    const wantEvidence = options.evidence !== false;
    const rows = this.launchctlRows();
    const plists = this.plistsOnDisk();
    const seen = new Set<string>();
    const out: ServiceHealth[] = [];

    for (const row of rows) {
      seen.add(row.label);
      const plistPath = plists.get(row.label);
      // Evidence must be gathered before classification, not after: it is what
      // separates a crash loop from an operator restart.
      const nonZero = row.status !== null && row.status !== 0;
      const evidence =
        wantEvidence && nonZero
          ? this.evidenceFrom(plistPath ? this.logPathsFor(plistPath) : [])
          : [];
      const state = classify(row, evidence.length > 0);
      out.push({
        label: row.label,
        state,
        pid: row.pid,
        lastExit: row.status,
        detail: describeExit(row.status),
        plistPath,
        evidence: evidence.length ? evidence : undefined,
      });
    }

    // A plist on disk that launchd does not know about is the failure mode
    // that hid subdirector-autopilot: it did not fail, it stopped existing.
    for (const [label, plistPath] of plists) {
      if (seen.has(label)) continue;
      out.push({
        label,
        state: 'not-loaded',
        pid: null,
        lastExit: null,
        detail: 'plist present but not loaded into launchd',
        plistPath,
      });
    }

    const rank: Record<ServiceState, number> = {
      'crash-loop': 0,
      failed: 1,
      'not-loaded': 2,
      restarted: 3,
      idle: 4,
      running: 5,
    };
    return out.sort((a, b) => rank[a.state] - rank[b.state] || a.label.localeCompare(b.label));
  }

  /** True when anything needs an operator's attention. */
  static hasProblems(report: ServiceHealth[]): boolean {
    return report.some(
      (s) => s.state === 'crash-loop' || s.state === 'failed' || s.state === 'not-loaded'
    );
  }
}
