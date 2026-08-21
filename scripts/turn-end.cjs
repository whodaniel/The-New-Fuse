#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const { upgrade: upgradeSessionHandoff } = require('./turn-end-v2.cjs');

const TNF_ROOT_DIR = process.env.TNF_ROOT_DIR || process.cwd();
const LIVING_STATE_PATH = path.join(TNF_ROOT_DIR, 'docs/protocols/LIVING_STATE.md');
const SESSION_HANDOFF_JSON_PATH = path.join(TNF_ROOT_DIR, 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json');
const SESSION_HANDOFF_MD_PATH = path.join(TNF_ROOT_DIR, 'docs/protocols/reports/SESSION_HANDOFF_LATEST.md');
const AGENTS_DIR = path.join(TNF_ROOT_DIR, '.agent/agents');
const SKILLS_DIR = path.join(TNF_ROOT_DIR, '.agent/skills');
const SCRIPTS_AGENTS_DIR = path.join(TNF_ROOT_DIR, 'scripts/agents');

function runGit(cmd, cwd) {
  try {
    return execSync(cmd, {
      cwd: cwd || TNF_ROOT_DIR,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (error) {
    return null;
  }
}

function generateUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function parsePorcelainLine(line) {
  // XY + space + path. Some environments emit a single-space form (`M path`);
  // naive slice(3) then truncates the first path character (`ata/...`).
  if (!line || line.length < 3) return null;
  const status = line.slice(0, 2);
  const filePath = line.charAt(2) === ' ' ? line.slice(3) : line.slice(2).trimStart();
  if (!filePath) return null;
  const normalizedPath = filePath.includes(' -> ') ? filePath.split(' -> ').pop() : filePath;
  return { status, filePath: normalizedPath };
}

function getGitStatus() {
  const output = runGit('git status --short', TNF_ROOT_DIR);
  if (!output) return { changed: [], added: [], deleted: [] };

  const lines = output.trim().split('\n').filter(Boolean);
  const changed = [];
  const added = [];
  const deleted = [];

  for (const line of lines) {
    const parsed = parsePorcelainLine(line);
    if (!parsed) continue;
    const { status, filePath } = parsed;
    // Ignore build artifacts in handoff inventories — they blow up changed_paths
    // counts and create phantom "Deleted: N" floods when dist/ is cleaned.
    if (
      filePath.includes('node_modules/') ||
      filePath.includes('/dist/') ||
      filePath.endsWith('/dist') ||
      filePath.startsWith('dist/')
    ) {
      continue;
    }
    if (status.includes('D') && !status.includes('A') && !status.includes('?')) {
      deleted.push(filePath);
    } else if (status.includes('A') || status.includes('?')) {
      // Untracked (`??`) must count as added — previously fell into `changed`.
      added.push(filePath);
    } else if (status.trim()) {
      changed.push(filePath);
    }
  }

  return { changed, added, deleted };
}

function getGitLog() {
  const output = runGit('git log --oneline -20', TNF_ROOT_DIR);
  if (!output) return [];
  return output.trim().split('\n').filter(Boolean);
}

function getGitBranch() {
  const output = runGit('git rev-parse --abbrev-ref HEAD', TNF_ROOT_DIR);
  return output ? output.trim() : 'unknown';
}

function getHeadSha() {
  const output = runGit('git rev-parse HEAD', TNF_ROOT_DIR);
  return output ? output.trim() : 'unknown';
}

function getNewFilesInDir(dir, since = 'HEAD') {
  if (!fs.existsSync(dir)) return [];
  const output = runGit(`git log --diff-filter=A --name-only --pretty=format: ${since}`, TNF_ROOT_DIR);
  if (!output) return [];
  const files = output.trim().split('\n').filter(Boolean);
  return files.filter((f) => f.startsWith(dir.replace(TNF_ROOT_DIR + '/', '')) && !f.includes('.git'));
}

function getDeletedAgentFiles(statusOutput) {
  const deleted = [];
  if (!statusOutput) return deleted;
  const lines = statusOutput.trim().split('\n');
  for (const line of lines) {
    if (line.startsWith('D ') && (line.includes('.agent/agents/') || line.includes('.agent/fleet/users/agents/'))) {
      deleted.push(line.slice(3));
    }
  }
  return deleted;
}

function getDeletedAgents() {
  const statusOutput = runGit('git status --short', TNF_ROOT_DIR);
  const deletedFiles = getDeletedAgentFiles(statusOutput);
  const agents = [];
  for (const file of deletedFiles) {
    const match = file.match(/\/agents\/([^/]+)\.md$/);
    if (match) {
      agents.push(match[1]);
    }
  }
  return agents;
}

function getNewAgents() {
  const statusOutput = runGit('git status --short', TNF_ROOT_DIR);
  if (!statusOutput) return [];
  const lines = statusOutput.trim().split('\n');
  const newAgents = [];

  for (const line of lines) {
    if ((line.startsWith('A ') || line.startsWith('?? ')) && line.includes('.agent/agents/')) {
      const filePath = line.slice(3).replace(/^\?\? /, '');
      if (filePath.endsWith('.md')) {
        try {
          const content = fs.readFileSync(path.join(TNF_ROOT_DIR, filePath), 'utf8');
          const nameMatch = content.match(/^name:\s*([^\n]+)/m);
          if (nameMatch) {
            newAgents.push({ file: filePath, name: nameMatch[1].trim() });
          }
        } catch {
        }
      }
    }
  }
  return newAgents;
}

function scanAgentsForNames(agentsDir) {
  const agents = [];
  if (!fs.existsSync(agentsDir)) return agents;

  const files = fs.readdirSync(agentsDir).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    const filePath = path.join(agentsDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const nameMatch = content.match(/^name:\s*([^\n]+)/m);
      if (nameMatch) {
        agents.push({ file, name: nameMatch[1].trim() });
      }
    } catch {
    }
  }
  return agents;
}

function parseLivingStateSteps(livingStatePath) {
  if (!fs.existsSync(livingStatePath)) return [];

  const content = fs.readFileSync(livingStatePath, 'utf8');
  const stepRegex = /-\s*\[✅\]\s*([^\]]+)\s*([^\]]*)\s*([^-]*)/g;
  const steps = [];
  let match;

  while ((match = stepRegex.exec(content)) !== null) {
    const timestamp = match[1] ? match[1].trim() : '';
    const description = match[3] ? match[3].trim() : '';
    if (description) {
      steps.push({ timestamp, description });
    }
  }

  return steps;
}

function updateLivingState(newSteps) {
  if (!fs.existsSync(LIVING_STATE_PATH)) {
    console.error('LIVING_STATE.md not found');
    return false;
  }

  if (newSteps.length === 0) {
    console.log('No new steps to add to LIVING_STATE.md');
    return true;
  }

  const content = fs.readFileSync(LIVING_STATE_PATH, 'utf8');
  const lines = content.split('\n');

  let insertIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('## ⚡ Active Steps') || lines[i].includes('## ⚡')) {
      insertIndex = i + 1;
      while (insertIndex < lines.length && lines[insertIndex].trim() === '') {
        insertIndex++;
      }
      while (insertIndex < lines.length && (lines[insertIndex].startsWith('#') || lines[insertIndex].startsWith('1. [') || lines[insertIndex].startsWith('- [') || lines[insertIndex].startsWith('1.'))) {
        if (lines[insertIndex].match(/^[0-9]+\.\s*\[/)) {
          insertIndex++;
        } else if (lines[insertIndex].startsWith('- [✅]')) {
          insertIndex++;
        } else {
          break;
        }
      }
      break;
    }
  }

  if (insertIndex === -1) {
    console.error('Could not find Active Steps section in LIVING_STATE.md');
    return false;
  }

  const existingSteps = parseLivingStateSteps(LIVING_STATE_PATH);
  const existingDescriptions = existingSteps.map((s) =>
    s.description.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
  );

  function isDuplicate(newStep) {
    const newWords = newStep.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    if (newWords.length === 0) return true;
    for (const existing of existingDescriptions) {
      const overlap = newWords.filter((w) => existing.includes(w)).length;
      if (overlap >= 5) return true;
    }
    return false;
  }

  const uniqueSteps = newSteps.filter((step) => !isDuplicate(step));
  if (uniqueSteps.length === 0) {
    console.log('All steps already present in LIVING_STATE.md — nothing to add');
    return true;
  }

  const timestamp = new Date().toISOString();
  const newEntries = uniqueSteps.map((step) => {
    return `- [✅] ${timestamp} ${step}`;
  });

  lines.splice(insertIndex, 0, ...newEntries, '');

  fs.writeFileSync(LIVING_STATE_PATH, lines.join('\n'), 'utf8');
  console.log(`Updated LIVING_STATE.md with ${uniqueSteps.length} new step(s) (${uniqueSteps.length} duplicates skipped)`);
  return true;
}

function detectCompletedSteps(gitStatus, newAgents, deletedAgents, TNF_ROOT_DIR) {
  const steps = [];
  const NF = (s) => steps.push(s);

  if (newAgents.length > 0) {
    NF(`New agent(s) created: ${newAgents.map((a) => a.name).join(', ')}`);
  }

  if (deletedAgents.length > 0) {
    NF(`Agent(s) archived: ${deletedAgents.join(', ')}`);
  }

  const newScripts = gitStatus.added.filter(
    (f) => (f.includes('scripts/agents/') || f.includes('scripts/')) && (f.endsWith('.cjs') || f.endsWith('.sh'))
  );
  if (newScripts.length > 0) {
    NF(`New script(s) created: ${newScripts.map((s) => path.basename(s)).join(', ')}`);
  }

  const newAgentDefs = gitStatus.added.filter((f) => f.includes('.agent/agents/') && f.endsWith('.md'));
  const deletedAgentDefs = gitStatus.deleted.filter((f) => f.includes('.agent/agents/') && f.endsWith('.md'));
  if (newAgentDefs.length > 0 || deletedAgentDefs.length > 0) {
    NF(`Agent definition change: ${newAgentDefs.length} added, ${deletedAgentDefs.length} removed`);
  }

  const runtimeConfigAdded = gitStatus.added.some((f) => f.includes('fleet-endpoints.json'));
  if (runtimeConfigAdded) {
    NF('Fleet health endpoint config created at ~/.tnf/config/fleet-endpoints.json');
  }

  // Crontab presence is steady-state infrastructure, not a completed work step.
  // Logging it on every turn filled Active Steps with dozens of duplicate
  // "System cron entries installed…" bullets and starved the real work queue.
  // Do not append cron presence to LIVING_STATE Active Steps (see Living State
  // steady-state infra note instead).

  const archiveCreated = gitStatus.added.some(
    (f) => f.includes('archive/picoclaw-deprecated') || f.includes('archive/disabled-launch-agents')
  );
  if (archiveCreated) {
    NF('OpenClaw migration: 7 launchd agents replaced by 3 native system-cron entries');
  }

  const turnEndScript = gitStatus.added.some((f) => f.includes('turn-end.cjs'));
  if (turnEndScript) {
    NF('Turn End protocol implemented: auto-update LIVING_STATE + SESSION_HANDOFF at session close');
  }

  const checkAgentScript = gitStatus.added.some((f) => f.includes('check-agent-registration'));
  if (checkAgentScript) {
    NF('Agent registration gate created: auto-verify all agents registered in AGENT_STATUS_LEDGER');
  }

  const livingStatePath = path.join(TNF_ROOT_DIR, 'docs/protocols/LIVING_STATE.md');
  if (fs.existsSync(livingStatePath)) {
    const lsContent = fs.readFileSync(livingStatePath, 'utf8');
    if (lsContent.includes('MEMORY.md drift') || lsContent.includes('canonicalize') || lsContent.includes('§ delimiter')) {
      NF('Fix MEMORY.md drift: canonicalize § delimiter format, split oversized entry');
    }
  }

  const agentDefs = gitStatus.added.some((f) => f.includes('continuous-improver'));
  if (agentDefs) {
    NF('Continuous-improver agent enhanced with watchdog subset (disk, Redis, scheduler probes)');
  }

  return steps;
}

function buildWorkSummary(gitStatus, newAgents, deletedAgents, gitLog) {
  const summary = [];

  if (newAgents.length > 0) {
    summary.push(`Created ${newAgents.length} new agent(s): ${newAgents.map((a) => a.name).join(', ')}`);
  }

  if (deletedAgents.length > 0) {
    summary.push(`Archived ${deletedAgents.length} agent(s): ${deletedAgents.join(', ')}`);
  }

  const newScripts = gitStatus.added.filter((f) => f.includes('scripts/') && (f.endsWith('.cjs') || f.endsWith('.js')));
  if (newScripts.length > 0) {
    summary.push(`Added ${newScripts.length} new script file(s)`);
  }

  const modifiedCount = gitStatus.changed.length;
  if (modifiedCount > 0) {
    summary.push(`Modified ${modifiedCount} file(s)`);
  }

  if (summary.length === 0 && gitLog.length > 0) {
    summary.push(`Committed: ${gitLog[0]}`);
  }

  return summary.length > 0 ? summary : ['Session completed - see git log for details'];
}

function isOperatorNotice(action) {
  const text = String(action || '');
  return (
    text.includes('NEEDS LIVE OPERATOR CONFIRMATION') ||
    text.startsWith('NOTICE:') ||
    text.startsWith('⚠️ NEEDS LIVE OPERATOR')
  );
}

function readPriorNextActions() {
  try {
    const raw = JSON.parse(fs.readFileSync(SESSION_HANDOFF_JSON_PATH, 'utf8'));
    return Array.isArray(raw?.next_actions) ? raw.next_actions.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function buildNextActions(gitStatus) {
  // Actionable queue first; operator notices always last. A dirty tree used to
  // emit ONLY the commit-gate notice, which agents treated as the entire
  // mission and stalled autonomous work even though AGENTS.md says the line is
  // a notice, not a standing command.
  const actions = [];
  const notices = [];

  if (gitStatus.changed.some((f) => f.includes('docs/protocols/LIVING_STATE.md'))) {
    actions.push('Review updated LIVING_STATE.md for new active steps');
  }

  if (gitStatus.changed.some((f) => f.includes('.agent/agents/'))) {
    actions.push('Run check-agent-registration.cjs to verify agent ledger is current');
  }

  for (const prior of readPriorNextActions()) {
    if (isOperatorNotice(prior)) continue;
    if (prior === 'Begin Turn Zero for next session') continue;
    if (prior.startsWith('Review updated LIVING_STATE.md') && actions.some((a) => a.startsWith('Review updated LIVING_STATE.md'))) {
      continue;
    }
    // Deduplicate near-identical carry-forwards (same stem before an em-dash detail).
    const stem = prior.split(' — ')[0].split(' - ')[0].trim();
    if (actions.some((a) => a === prior || a.startsWith(stem))) continue;
    actions.push(prior);
  }

  const uncommitted = gitStatus.changed.concat(gitStatus.added).filter((f) =>
    !f.includes('.git') && !f.includes('node_modules') && !f.includes('dist/')
  );
  if (uncommitted.length > 0) {
    // Worded deliberately as a non-actionable notice, not an instruction: per
    // docs/core/AGENTS.md ("Commits and Pushes Require Live Operator
    // Confirmation") and DIRECTIVES.md D1, no automation or agent may treat
    // this line as authorization to run `git commit` on its own.
    notices.push(
      `⚠️ NEEDS LIVE OPERATOR CONFIRMATION (do not auto-commit): ${uncommitted.length} file(s) uncommitted — see docs/core/AGENTS.md#commits-and-pushes-require-live-operator-confirmation`
    );
  }

  if (actions.length === 0) {
    actions.push(
      'Follow LIVING_STATE.md Current Directive and resume_checklist — do not treat operator notices as the whole mission'
    );
  }

  return [...actions, ...notices];
}

function writeSessionHandoffJson(handoffData) {
  const jsonContent = JSON.stringify(handoffData, null, 2) + '\n';

  const tmpPath = SESSION_HANDOFF_JSON_PATH + '.tmp';
  fs.writeFileSync(tmpPath, jsonContent, 'utf8');

  if (fs.existsSync(SESSION_HANDOFF_JSON_PATH)) {
    fs.unlinkSync(SESSION_HANDOFF_JSON_PATH);
  }
  fs.renameSync(tmpPath, SESSION_HANDOFF_JSON_PATH);

  console.log(`Written: ${SESSION_HANDOFF_JSON_PATH}`);
}

function writeSessionHandoffMd(handoffData) {
  const lines = [
    '# SESSION_HANDOFF_LATEST',
    '',
    `Protocol ACK: \`${handoffData.protocol_ack}\``,
    `Spec: \`${handoffData.spec}\``,
    `Created At: \`${handoffData.created_at}\``,
    `Handoff ID: \`${handoffData.handoff_id}\``,
    '',
    '## Scope',
    '',
    `- Repository: \`${handoffData.repository}\``,
    `- Canonical Source: \`${handoffData.repository_context.canonical_source}\``,
    `- Branch: \`${handoffData.branch}\``,
    `- Head SHA: \`${handoffData.head_sha}\``,
    `- Sensitive Scope: \`${handoffData.sensitive_scope}\``,
    '',
    '## Classification',
    '',
    `- Work Domain: \`${handoffData.classification.work_domain}\``,
    `- Artifact Destination: \`${handoffData.classification.artifact_destination}\``,
    `- Data Residency: \`${handoffData.classification.data_residency}\``,
    `- Sensitivity: \`${handoffData.classification.sensitivity}\``,
    '',
    '## Work Summary',
    '',
  ];

  for (const summary of handoffData.work_summary) {
    lines.push(`- ${summary}`);
  }

  lines.push('', '## Changed Paths', '');
  for (const p of handoffData.changed_paths) {
    lines.push(`- ${p}`);
  }

  lines.push('', '## Continuation', '');
  lines.push(`- **Owner:** ${handoffData.continuation.owner}`);
  lines.push(`- **Priority:** ${handoffData.continuation.priority}`);
  lines.push('', '**Targets:**');
  for (const t of handoffData.continuation.targets) {
    lines.push(`- ${t}`);
  }
  lines.push('', '**Resume Checklist:**');
  for (const r of handoffData.continuation.resume_checklist) {
    lines.push(`- ${r}`);
  }

  lines.push('', '## Next Actions', '');
  for (const a of handoffData.next_actions) {
    lines.push(`- ${a}`);
  }

  if (handoffData.artifacts && handoffData.artifacts.commits && handoffData.artifacts.commits.length > 0) {
    lines.push('', '## Artifacts', '');
    lines.push('**Commits:**');
    for (const c of handoffData.artifacts.commits) {
      lines.push(`- ${c}`);
    }
  }

  fs.writeFileSync(SESSION_HANDOFF_MD_PATH, lines.join('\n'), 'utf8');
  console.log(`Written: ${SESSION_HANDOFF_MD_PATH}`);
}

function stageProtocolFiles() {
  const files = [
    'docs/protocols/LIVING_STATE.md',
    'docs/protocols/reports/SESSION_HANDOFF_LATEST.json',
    'docs/protocols/reports/SESSION_HANDOFF_LATEST.md',
  ];

  for (const file of files) {
    const fullPath = path.join(TNF_ROOT_DIR, file);
    if (fs.existsSync(fullPath)) {
      try {
        runGit(`git add ${file}`, TNF_ROOT_DIR);
        console.log(`Staged: ${file}`);
      } catch {
        console.log(`Warning: Could not stage ${file}`);
      }
    }
  }
}

function printUsage() {
  console.log('Usage: node scripts/turn-end.cjs [options]');
  console.log('');
  console.log('Options:');
  console.log('  -h, --help           Show this help');
  console.log('  --summary <text>     Override work summary (comma-separated)');
  console.log('  --no-stage           Skip staging protocol files');
}

function parseArgs(argv) {
  const result = { help: false, workSummaryOverride: null, stage: true };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') {
      result.help = true;
    } else if (arg === '--summary') {
      const next = argv[i + 1];
      if (next) {
        result.workSummaryOverride = next.split(',').map((s) => s.trim());
        i++;
      }
    } else if (arg === '--no-stage') {
      result.stage = false;
    }
  }

  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  // Probe with a command that ALWAYS prints on success, even when the working
  // tree is clean. `git status --short` returns an empty string for a clean
  // tree, and runGit returns null on failure — using `!gitTest` conflated the
  // two, so turn-end wrongly reported "git not available" whenever everything
  // was already committed.
  const gitTest = runGit('git rev-parse --is-inside-work-tree', TNF_ROOT_DIR);
  if (gitTest === null || gitTest.trim() !== 'true') {
    console.error('Error: git is not available or TNF_ROOT_DIR is not a git repository');
    console.error(`TNF_ROOT_DIR: ${TNF_ROOT_DIR}`);
    process.exit(1);
  }

  if (!fs.existsSync(path.join(TNF_ROOT_DIR, '.agent'))) {
    console.error('Error: TNF_ROOT_DIR does not contain .agent/ directory');
    console.error(`TNF_ROOT_DIR: ${TNF_ROOT_DIR}`);
    process.exit(1);
  }

  console.log('TNF Turn End');
  console.log(`Workspace: ${TNF_ROOT_DIR}`);
  console.log('');

  const gitStatus = getGitStatus();
  const gitLog = getGitLog();
  const branch = getGitBranch();
  const headSha = getHeadSha();
  const newAgents = getNewAgents();
  const deletedAgents = getDeletedAgents();

  console.log('=== Session Activity ===');
  console.log(`Branch: ${branch}`);
  console.log(`Head: ${headSha}`);
  console.log(`Changed: ${gitStatus.changed.length}, Added: ${gitStatus.added.length}, Deleted: ${gitStatus.deleted.length}`);
  console.log(`New agents: ${newAgents.length}, Deleted agents: ${deletedAgents.length}`);

  const completedSteps = detectCompletedSteps(gitStatus, newAgents, deletedAgents, TNF_ROOT_DIR);

  if (completedSteps.length > 0) {
    console.log('');
    console.log('Completed steps detected:');
    for (const step of completedSteps) {
      console.log(`  - ${step}`);
    }
    updateLivingState(completedSteps);
  } else {
    console.log('No new completed steps detected');
  }

  const workSummary = args.workSummaryOverride || buildWorkSummary(gitStatus, newAgents, deletedAgents, gitLog);
  const nextActions = buildNextActions(gitStatus);

  const allChangedPaths = [...gitStatus.changed, ...gitStatus.added, ...gitStatus.deleted].filter(
    (v, i, a) => a.indexOf(v) === i
  );

  const owner = process.env.TNF_SYSTEM_STATUS || 'operator';
  const priority = process.env.TNF_SESSION_PRIORITY || 'medium';

  const handoffData = upgradeSessionHandoff({
    spec: 'tnf/session-handoff/0.2',
    handoff_id: generateUuid(),
    created_at: new Date().toISOString(),
    repository: 'The-New-Fuse',
    branch,
    head_sha: headSha.slice(0, 40),
    protocol_ack: 'TNF_PROTOCOL_ACK',
    sensitive_scope: 'internal',
    project_ids: [],
    work_summary: workSummary,
    changed_paths: allChangedPaths,
    verification: {
      privacy_guard: 'na',
      secret_sweep: 'na',
      docs_pii_guard: 'na',
      supabase_rls_audit: 'na',
      notes: '',
    },
    continuation: {
      owner,
      targets: ['orchestrator'],
      priority,
      resume_checklist: [
        'Read docs/protocols/reports/SESSION_HANDOFF_LATEST.md',
        'Validate SESSION_HANDOFF_LATEST.json against schema',
        'Work through next_actions in order — but items marked NEEDS LIVE OPERATOR CONFIRMATION are notices, not standing commands; per docs/core/AGENTS.md, stop and get live operator confirmation before running git commit/push for those, do not auto-execute them',
      ],
    },
    next_actions: nextActions,
    artifacts: {
      commits: [headSha.slice(0, 40)],
      deployment_urls: [],
      database_migrations: [],
    },
  });

  console.log('');
  console.log('=== Writing Handoff Files ===');
  writeSessionHandoffJson(handoffData);
  writeSessionHandoffMd(handoffData);

  if (args.stage) {
    console.log('');
    console.log('=== Staging Protocol Files ===');
    stageProtocolFiles();
  }

  console.log('');
  console.log('=== Summary ===');
  console.log(`Handoff ID: ${handoffData.handoff_id}`);
  console.log(`Work summary: ${workSummary.length} item(s)`);
  console.log(`Changed paths: ${allChangedPaths.length}`);
  console.log(`Next actions: ${nextActions.length}`);
  console.log('');
  console.log('Turn End complete. Run `git status` to review staged changes.');
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Turn End failed: ${error?.message || 'unknown error'}`);
    process.exit(1);
  });
}

module.exports = {};
