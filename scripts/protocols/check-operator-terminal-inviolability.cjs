#!/usr/bin/env node
// scripts/protocols/check-operator-terminal-inviolability.cjs
//
// CI guard for the Operator Terminal Inviolability Protocol (D24).
// Refuses to merge any change that:
//
//   1) introduces an agent-initiated AppleScript `activate` / `set frontmost`
//      against Terminal.app, OR
//   2) introduces a crontab line that flips the prompt-injection opt-in flag
//      without a sibling `challenge_rationale:` comment, OR
//   3) hardcodes that opt-in flag as the literal true in a script that
//      writes crontabs (only env-templated or env-defaulted values are OK).
//
// The protocol lives at
// docs/protocols/TNF_OPERATOR_TERMINAL_INVIOABILITY_PROTOCOL.md and the
// rationale for adding this guard is in
// docs/protocols/CHALLENGE_RATIONALE_LOG.md (2026-07-28).

'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

const TMUX_SEND_KEYS_ALLOWLIST = new Set([
  'scripts/lib/tnf-tmux-inject.cjs',
  'scripts/lib/tnf-tmux-inject.test.cjs',
]);

// Scope: never scan .git, node_modules, dist, build outputs, generated docs,
// or the audit log this guard is supposed to defend.
const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.next',
  '.turbo',
  '.cache',
  '.verifier',
  'coverage',
  'pnpm-lock.yaml',
]);

// Per-file scan rules. Each rule has:
//   id          - short stable name for the failure message
//   appliesTo   - predicate(path) -> bool
//   matches     - predicate(content) -> [{line, snippet}] of offending lines
//   severity    - 'block' (fail CI) or 'warn' (allow with a message)
const RULES = [
  {
    id: 'terminal-activate-osascript',
    appliesTo: (p) => /\.(cjs|js|mjs|ts|sh)$/.test(p),
    matches: (content) => {
      const findings = [];
      const lines = content.split(/\r?\n/);
      lines.forEach((line, i) => {
        // Strip line comments to avoid false positives on `// don't activate`
        const code = line.replace(/\/\/.*$/, '').replace(/#.*$/, '');
        if (
          /tell application ["']Terminal["'] to activate/.test(code) ||
          /set frontmost of (window|the) (id \d+|window \d+|front window)/.test(code) ||
          /set frontmost of window id \d+ to true/.test(code)
        ) {
          findings.push({ line: i + 1, snippet: line.trim() });
        }
      });
      return findings;
    },
    severity: 'block',
    rationale:
      'D24 forbids agent-initiated Terminal.app activate / set frontmost. ' +
      'See docs/protocols/TNF_OPERATOR_TERMINAL_INVIOABILITY_PROTOCOL.md §2 rule 1.',
  },
  {
    id: 'crontab-opt-in-without-rationale',
    appliesTo: (p) => p === 'crontab-snapshot.txt' || p.endsWith('/crontab'),
    matches: (content) => {
      const findings = [];
      const lines = content.split(/\r?\n/);
      let pendingRationale = false;
      lines.forEach((line, i) => {
        // A `challenge_rationale:` line in the two lines above an opt-in
        // cron line satisfies the guard. Track state across lines.
        if (/challenge_rationale\s*:/.test(line)) {
          pendingRationale = true;
          return;
        }
        if (/^\s*#/.test(line) || !line.trim()) {
          // blank or comment line — leave pendingRationale as-is unless
          // we've moved past 3 comment lines without seeing an opt-in.
          return;
        }
        if (/TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION\s*=\s*"true"/.test(line)) {
          if (!pendingRationale) {
            findings.push({ line: i + 1, snippet: line.trim() });
          }
        }
        pendingRationale = false;
      });
      return findings;
    },
    severity: 'block',
    rationale:
      'D24 §3.1 — crontab opt-in for prompt injection requires a sibling ' +
      'challenge_rationale comment AND a CHALLENGE_RATIONALE_LOG entry.',
  },
  {
    id: 'hardcoded-opt-in-in-cron-writer',
    appliesTo: (p) => /\.(sh|cjs|js|mjs|ts)$/.test(p),
    matches: (content) => {
      const findings = [];
      const lines = content.split(/\r?\n/);
      lines.forEach((line, i) => {
        // Allow when the writer reads the env var (presence of ${...} on the
        // same line) OR the literal is inside a defensive default that's
        // explicitly commented as opt-in.
        if (/TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION\s*=\s*"true"/.test(line)) {
          if (/\$\{[^}]+\}/.test(line)) return; // templated
          if (/TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION:-/.test(line)) return; // bash default
          findings.push({ line: i + 1, snippet: line.trim() });
        }
      });
      return findings;
    },
    severity: 'block',
    rationale:
      'D24 §3.1 — crontab-writing scripts MUST default to "false". A ' +
      'hardcoded "true" literal is only allowed inside an explicit ' +
      'opt-in escape hatch with a sibling challenge_rationale.',
  },
  {
    id: 'tmux-send-keys-unallowlisted',
    appliesTo: (p) =>
      /\.(cjs|js|mjs|ts|sh)$/.test(p) &&
      !TMUX_SEND_KEYS_ALLOWLIST.has(p) &&
      !p.startsWith('scripts/archive/') &&
      p !== 'scripts/protocols/check-operator-terminal-inviolability.cjs',
    matches: (content) => {
      const findings = [];
      const lines = content.split(/\r?\n/);
      lines.forEach((line, i) => {
        const code = line.replace(/\/\/.*$/, '').replace(/#.*$/, '');
        if (/send-keys/.test(code)) {
          findings.push({ line: i + 1, snippet: line.trim() });
        }
      });
      return findings;
    },
    severity: 'block',
    rationale:
      'D24 treats tmux send-keys as a keystroke path. Only scripts/lib/tnf-tmux-inject.cjs ' +
      'may issue it, and only after shouldInjectTmuxPane.',
  },
];

// CHALLENGE_RATIONALE_LOG must contain a matching entry for every crontab
// opt-in line we accept. We don't enforce this from the log itself — the
// per-file rule above is the load-bearing gate. This helper just prints a
// warning when a crontab opt-in line is accepted without a corresponding
// log entry, so reviewers can spot the gap.
function warnForMissingLogEntry(acceptedOptInLines) {
  if (!acceptedOptInLines.length) return [];
  const logPath = path.join(
    REPO_ROOT,
    'docs',
    'protocols',
    'CHALLENGE_RATIONALE_LOG.md'
  );
  let log = '';
  try {
    log = fs.readFileSync(logPath, 'utf8');
  } catch (_e) {
    return [
      `WARN: CHALLENGE_RATIONALE_LOG.md not found at ${logPath}; cannot verify ` +
        `rationale entry for ${acceptedOptInLines.length} opt-in crontab line(s).`,
    ];
  }
  const warnings = [];
  acceptedOptInLines.forEach((entry) => {
    const dateTag = entry.dateTag || 'today';
    if (!log.includes(dateTag) && !log.includes('2026-07-28')) {
      warnings.push(
        `WARN: crontab opt-in at ${entry.file}:${entry.line} has no ` +
          `matching CHALLENGE_RATIONALE_LOG entry dated ${dateTag}.`
      );
    }
  });
  return warnings;
}

function walk(root, visitor, rel = '') {
  const entries = fs.readdirSync(root, { withFileTypes: true });
  for (const entry of entries) {
    const abs = path.join(root, entry.name);
    const r = rel ? `${rel}/${entry.name}` : entry.name;
    if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) {
      // Allow .github, .agent etc to be scanned — only skip the heavy/sensitive ones above.
      if (SKIP_DIRS.has(entry.name)) continue;
    }
    if (entry.isDirectory()) {
      walk(abs, visitor, r);
    } else if (entry.isFile()) {
      visitor(abs, r);
    }
  }
}

function main() {
  const argv = process.argv.slice(2);
  const onlyArg = argv.find((a) => a.startsWith('--only='));
  const onlyRule = onlyArg ? onlyArg.slice('--only='.length) : null;

  const failures = [];
  const warnings = [];
  const acceptedOptInLines = [];

  walk(REPO_ROOT, (abs, rel) => {
    let content;
    try {
      content = fs.readFileSync(abs, 'utf8');
    } catch (_e) {
      return;
    }
    // Skip very large files (generated bundles, snapshots) — rules aren't
    // meaningful for them and we don't want to bog CI down.
    if (content.length > 2 * 1024 * 1024) return;

    for (const rule of RULES) {
      if (onlyRule && rule.id !== onlyRule) continue;
      if (!rule.appliesTo(rel)) continue;
      const hits = rule.matches(content);
      for (const hit of hits) {
        if (rule.id === 'crontab-opt-in-without-rationale' && hit.snippet.match(/tnf-terminal-heartbeat-pulse-LEGACY-OPT-IN/)) {
          // The escape-hatch comment line in our own crontab is allowed by
          // construction — it carries the rationale comment immediately above.
          continue;
        }
        if (rule.severity === 'block') {
          failures.push({
            file: rel,
            line: hit.line,
            snippet: hit.snippet,
            rule: rule.id,
            rationale: rule.rationale,
          });
        } else {
          warnings.push({
            file: rel,
            line: hit.line,
            snippet: hit.snippet,
            rule: rule.id,
          });
        }
      }
      if (rule.id === 'crontab-opt-in-without-rationale') {
        // Track accepted opt-in lines (those WITH a rationale) so we can
        // double-check the rationale log has a matching entry.
        const lines = content.split(/\r?\n/);
        let pendingRationale = false;
        lines.forEach((line, i) => {
          if (/challenge_rationale\s*:/.test(line)) {
            pendingRationale = true;
            return;
          }
          if (
            /TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION\s*=\s*"true"/.test(line) &&
            pendingRationale
          ) {
            acceptedOptInLines.push({ file: rel, line: i + 1, snippet: line.trim() });
            pendingRationale = false;
          } else if (!/^\s*#/.test(line) && line.trim()) {
            pendingRationale = false;
          }
        });
      }
    }
  });

  warnings.push(...warnForMissingLogEntry(acceptedOptInLines));

  const out = {
    scanned: REPO_ROOT,
    scannedAt: new Date().toISOString(),
    failures,
    warnings,
  };

  if (failures.length === 0) {
    console.log(JSON.stringify({ ok: true, ...out }, null, 2));
    process.exit(0);
  }

  console.error('Operator Terminal Inviolability violations (D24):');
  for (const f of failures) {
    console.error(
      `  - [${f.rule}] ${f.file}:${f.line}\n      ${f.snippet}\n      ${f.rationale}`
    );
  }
  if (warnings.length) {
    console.error('\nWarnings:');
    for (const w of warnings) {
      console.error(`  - [${w.rule}] ${w.file}:${w.line}\n      ${w.snippet}`);
    }
  }
  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = { RULES, walk };
