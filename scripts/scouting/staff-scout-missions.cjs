#!/usr/bin/env node
/**
 * Turn the local scout queue into a tnf-cli-agent mission brief.
 *
 * Does not run paid inference by default. Writes a compact assignment that
 * interactive / agents-run sessions inject. Set TNF_SCOUT_RUN_AGENT=1 to
 * also spawn `tnf agents run` against the brief.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const QUEUE_JSON = path.join(ROOT, 'reports/scouting/scout-queue.json');
const OUT_JSON = path.join(ROOT, 'reports/scouting/scout-mission-latest.json');
const OUT_MD = path.join(ROOT, 'reports/scouting/scout-mission-brief.md');
const RUNTIME_MD = path.join(ROOT, '.agent/runtime-state/scout-mission-latest.md');

function parseArgs(argv) {
  return {
    json: argv.includes('--json'),
    skipQueue: argv.includes('--skip-queue-build'),
    limit: Number((argv.find((a) => a.startsWith('--limit=')) || '--limit=8').slice(8)) || 8,
  };
}

function buildQueue() {
  const script = path.join(ROOT, 'scripts/scouting/build-scout-queue.cjs');
  const result = spawnSync(process.execPath, [script], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return {
    ok: (result.status ?? 1) === 0,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

function loadQueue() {
  if (!fs.existsSync(QUEUE_JSON)) return { tasks: [], generatedAt: null };
  try {
    return JSON.parse(fs.readFileSync(QUEUE_JSON, 'utf8'));
  } catch {
    return { tasks: [], generatedAt: null };
  }
}

function writeBrief(queue, limit) {
  const tasks = (queue.tasks || []).slice(0, limit);
  const assignedTo = 'tnf-cli-agent';
  const payload = {
    schema: 'tnf.scout-mission/1.0',
    generatedAt: new Date().toISOString(),
    assignedTo,
    department: 'tech',
    cluster: 'Scouting',
    policy: {
      localFirst: true,
      noPaidInferenceUnlessOptIn: true,
      officialSourcesPreferred: true,
      progressiveInjection: 'names and questions only until a task is invoked',
    },
    commands: {
      queue: 'tnf scout queue',
      staff: 'tnf scout staff',
      runAgent: 'TNF_SCOUT_RUN_AGENT=1 tnf scout staff',
      assimilate: 'tnf assimilate / .agent/skills/tnf-parody-assimilate-cycle/SKILL.md',
    },
    dueCount: (queue.tasks || []).length,
    tasks,
  };

  const lines = [
    '# TNF CLI Agent — Scout Mission Brief',
    '',
    `Assigned: \`${assignedTo}\``,
    `Generated: ${payload.generatedAt}`,
    `Due tasks: ${payload.dueCount} (showing ${tasks.length})`,
    '',
    'This is a staffing receipt, not permission to dump every host prompt or skill body.',
    'Research only the named task. Prefer official docs. Record material change or explicit none.',
    '',
    '```bash',
    'tnf scout queue',
    'tnf scout status',
    'node scripts/harness/host-prompt-profiles.cjs --verify',
    '```',
    '',
  ];

  if (!tasks.length) {
    lines.push('No stale/due scout tasks. HEARTBEAT_OK for ecosystem scouting.');
  }

  for (const task of tasks) {
    lines.push(`## ${task.id}`);
    lines.push('');
    lines.push(`- Kind: ${task.kind}`);
    lines.push(`- Priority: ${task.priority}`);
    lines.push(`- Days until stale: ${task.daysUntilStale}`);
    lines.push('- Questions:');
    for (const q of task.scoutQuestions || []) lines.push(`  - ${q}`);
    lines.push('');
  }

  lines.push('After a material finding, run the parody/assimilate cycle and retain the fact:');
  lines.push('`tnf remember retain "<material change>" --tags scout,ecosystem`');
  lines.push('');

  const md = `${lines.join('\n')}\n`;
  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.mkdirSync(path.dirname(RUNTIME_MD), { recursive: true });
  fs.writeFileSync(OUT_JSON, `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(OUT_MD, md);
  fs.writeFileSync(RUNTIME_MD, md);
  return payload;
}

function maybeRunAgent(payload) {
  if (!/^(1|true|yes)$/i.test(String(process.env.TNF_SCOUT_RUN_AGENT || ''))) {
    return { skipped: true, reason: 'TNF_SCOUT_RUN_AGENT not set' };
  }
  const cli = path.join(ROOT, 'packages/tnf-cli/dist/cli.js');
  const src = path.join(ROOT, 'packages/tnf-cli/src/cli.ts');
  // Cap the loop. `tnf agents run` defaults to UNLIMITED iterations, so pairing
  // it with a fixed wrapper timeout guarantees the worst outcome available: the
  // agent researches until the budget expires and is then killed mid-thought,
  // discarding everything it had done. A mission that cannot finish inside the
  // budget should return partial findings, not nothing.
  const maxIterations = String(Number(process.env.TNF_SCOUT_MAX_ITERATIONS || 24));
  const runArgs = [
    'agents',
    'run',
    '--task-file',
    OUT_MD,
    '--max-iterations',
    maxIterations,
    '--quiet',
  ];
  const args = fs.existsSync(cli)
    ? [cli, ...runArgs]
    : ['--import', 'tsx', src, ...runArgs];
  // The wrapper budget must exceed the agent's own per-call LLM budget, or the
  // scout kills every run mid-first-request and no mission can ever complete.
  // `tnf agents run` defaults to TNF_LLM_TIMEOUT_MS, else 600000ms, so the old
  // 180000ms default guaranteed a SIGTERM before the first model reply.
  const llmTimeoutMs = Number(process.env.TNF_LLM_TIMEOUT_MS || 600000);
  const timeoutMs = Number(process.env.TNF_SCOUT_RUN_TIMEOUT_MS || llmTimeoutMs + 120000);
  const result = spawnSync(process.execPath, args, {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, TNF_AGENT_ID: 'tnf-cli-agent' },
    // stdin must be closed, not an open pipe: the CLI accepts a piped prompt,
    // and an inherited-but-never-written pipe is an invitation to block.
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: timeoutMs,
  });
  // spawnSync reports a timeout kill as status:null + signal:'SIGTERM'. Reading
  // only `status` made that indistinguishable from a clean run, which is how
  // this path reported healthy scouting while producing nothing at all.
  const timedOut = result.signal === 'SIGTERM' && result.status === null;
  return {
    skipped: false,
    ok: result.status === 0,
    status: result.status,
    signal: result.signal || null,
    timedOut,
    timeoutMs,
    error: result.error ? String(result.error.message || result.error) : null,
    stdoutPreview: String(result.stdout || '').slice(0, 500),
    stderrPreview: String(result.stderr || '').slice(0, 500),
    assignedTo: payload.assignedTo,
  };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const queueBuild = opts.skipQueue ? { ok: true, skipped: true } : buildQueue();
  const queue = loadQueue();
  const payload = writeBrief(queue, opts.limit);
  const agent = maybeRunAgent(payload);
  // When the agent was actually asked to run, its outcome is part of the
  // result. Previously `ok` tracked only the queue build, so a killed or
  // crashed agent still reported success.
  const agentOk = agent.skipped ? true : agent.ok === true;
  const receipt = { ok: queueBuild.ok !== false && agentOk, queueBuild, mission: payload, agent };
  if (opts.json) {
    console.log(JSON.stringify(receipt, null, 2));
  } else {
    let agentSummary = 'brief-only';
    if (!agent.skipped) {
      if (agent.timedOut) agentSummary = `timeout after ${agent.timeoutMs}ms (no output)`;
      else if (agent.signal) agentSummary = `killed by ${agent.signal}`;
      else agentSummary = `exit=${agent.status}`;
    }
    console.log(
      JSON.stringify(
        {
          ok: receipt.ok,
          assignedTo: payload.assignedTo,
          dueCount: payload.dueCount,
          brief: path.relative(ROOT, OUT_MD),
          agent: agentSummary,
        },
        null,
        2
      )
    );
  }
  process.exit(receipt.ok ? 0 : 1);
}

try {
  main();
} catch (error) {
  console.error(`staff-scout-missions: ${error.message}`);
  process.exit(1);
}
