/**
 * Compact session orientation for TNF CLI / agents-run.
 * Names and pointers only — no skill/agent body dumps.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { formatDepartmentOrientation } from './departments.js';

export function formatRememberOrientation(): string {
  return [
    '## Remember',
    '',
    'If the operator says "remember this", persist it. Chat acknowledgement is not memory.',
    '- Retain: `tnf remember retain "<fact>"` or tool `memory_retain`',
    '- Recall: `tnf remember recall "<query>"` or tool `memory_recall`',
  ].join('\n');
}

export function formatHostProfileOrientation(repoRoot: string): string {
  const catalogPath = path.join(repoRoot, 'data/harness/host-prompt-profiles.json');
  if (!fs.existsSync(catalogPath)) {
    return [
      '## Host prompt files',
      '',
      '- Catalog missing: `data/harness/host-prompt-profiles.json`.',
    ].join('\n');
  }
  try {
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8')) as {
      hosts?: Array<{ id: string; runtime: string; expected_files?: string[] }>;
    };
    const names = (catalog.hosts || [])
      .slice(0, 12)
      .map((h) => `${h.id} (${h.expected_files?.[0] || h.runtime})`);
    return [
      '## Host prompt files',
      '',
      'Each host injects different files (Hermes=`SOUL.md`, Codex=`AGENTS.md`, Claude=SessionStart hook).',
      `Known maps: ${names.join('; ')}.`,
      'Verify enlisted hosts: `tnf harness host-profiles`, `tnf scout host-profiles`, or `node scripts/harness/host-prompt-profiles.cjs --verify`.',
      'Do not invent a second Stage A list inside a host file.',
    ].join('\n');
  } catch {
    return '## Host prompt files\n\n- Catalog unreadable.';
  }
}

export function formatScoutMissionOrientation(repoRoot: string): string {
  const runtimeBrief = path.join(repoRoot, '.agent/runtime-state/scout-mission-latest.md');
  const reportsBrief = path.join(repoRoot, 'reports/scouting/scout-mission-brief.md');
  const brief = fs.existsSync(runtimeBrief) ? runtimeBrief : reportsBrief;
  const jsonPath = path.join(repoRoot, 'reports/scouting/scout-mission-latest.json');
  if (!fs.existsSync(jsonPath)) {
    return [
      '## Scout missions',
      '',
      'No current scout brief. Build/staff with `tnf scout staff` when ecosystem research is due.',
      'Do not automatically crawl every agent platform on an interactive turn.',
    ].join('\n');
  }
  try {
    const mission = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as {
      dueCount?: number;
      assignedTo?: string;
      generatedAt?: string;
      tasks?: Array<{ id: string; kind?: string; priority?: string }>;
    };
    const ids = (mission.tasks || []).slice(0, 6).map((t) => t.id);
    return [
      '## Scout missions (staffed)',
      '',
      `Assigned to \`${mission.assignedTo || 'tnf-cli-agent'}\` at ${mission.generatedAt || 'unknown'}.`,
      `Due: ${mission.dueCount ?? 0}. Showing: ${ids.join(', ') || '(none)'}.`,
      `Brief: ${path.relative(repoRoot, fs.existsSync(brief) ? brief : jsonPath)}`,
      'Work one named task. Official sources first. Then `tnf remember retain` material facts.',
      'Live agent run is opt-in: `TNF_SCOUT_RUN_AGENT=1 tnf scout staff`.',
    ].join('\n');
  } catch {
    return '## Scout missions\n\n- Brief present but unreadable. Run `tnf scout staff`.';
  }
}

export function buildTnfAgentOrientation(repoRoot: string): string {
  return [
    formatDepartmentOrientation(repoRoot),
    formatRememberOrientation(),
    formatHostProfileOrientation(repoRoot),
    formatScoutMissionOrientation(repoRoot),
  ].join('\n\n');
}
