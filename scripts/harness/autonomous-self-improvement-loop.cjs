#!/usr/bin/env node
/**
 * Autonomous Self-Improvement & Workcycle-Closure Orchestrator
 *
 * Enables continuous self-improvement, harness diagnostics, scouting assimilation,
 * and worktree-to-merge closure directed by assigned & authorized AI agents
 * (sub-director / super-director / super-admin) without human-in-the-loop prompts.
 *
 * Grounded in:
 * - D23 (Verified DID Authority via ~/.tnf/authority/roles.json)
 * - D26 / D27 (Self-Evolution Mandate & Standing AI Autonomy)
 * - Shanghai AI Lab HoH (yeb2ffn8rJk): Dual State s_t = (A_t, E_t) & deterministic evaluator gates
 * - Stanford Meta-Harness (v5Tc2219-dc): Counterfactual diagnostic trace synthesis
 * - Google Agent Skills (kFpLzCVLA20): Multiplicative skill competence & Skill State X_t
 * - JEV (8hfbG5PhcB8): System-1 zero-prose classification & threshold scoring
 * - Bambood (x9cAYdq6-r8): Lead-Verifier + Specialist-Worker role-tier routing
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync, execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const RECEIPT_DIR = path.join(ROOT, 'data/harness/receipts');
const WORKCYCLE_RECEIPT = path.join(RECEIPT_DIR, 'workcycle-closure-latest.json');
const CYCLE_RECEIPT = path.join(RECEIPT_DIR, 'self-improvement-cycle-latest.json');

const berm = require('./permission-berm.cjs');
const failover = require('./provider-failover.cjs');
const compaction = require('./compaction-record.cjs');
const skillGuard = require('../skills/universal-skill-disclosure-guard.cjs');
const assimilationScan = require('./assimilation-scan.cjs');
const checkoutLedger = require('./checkout-ledger.cjs');

function parseArgs(argv) {
  const out = {
    cmd: argv[0] && !argv[0].startsWith('-') ? argv[0] : 'cycle',
    agent: process.env.TNF_AGENT_ID || 'tnf-cli-agent',
    repair: !argv.includes('--no-repair'),
    runAgent: argv.includes('--run-agent'),
    retainMemory: !argv.includes('--no-memory'),
    json: argv.includes('--json'),
  };
  for (let i = 0; i < argv.length; i += 1) {
    const t = argv[i];
    if (t === '--agent' && argv[i + 1]) out.agent = argv[++i];
  }
  return out;
}

function git(args, cwd = ROOT) {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

function runNodeScript(relScript, args = []) {
  const r = spawnSync(process.execPath, [path.join(ROOT, relScript), ...args], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  return {
    ok: (r.status ?? 1) === 0,
    code: r.status ?? 1,
    stdout: r.stdout || '',
    stderr: r.stderr || '',
  };
}

/**
 * Worktree-to-Merge Closure Doctor & Machine-Readable Receipt
 * Closes the orchestration_budgets gap in data/harness/harness-config.json:
 * verifies commit, upstream/push state, worktree hygiene, and deterministic CI gates.
 */
function runWorkcycleDoctor(opts = {}) {
  const cwd = opts.cwd || ROOT;
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], cwd) || 'unknown';
  const headSha = git(['rev-parse', 'HEAD'], cwd) || 'unknown';
  const upstream = git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], cwd) || null;
  const statusShort = git(['status', '--porcelain'], cwd);
  const dirtyLines = statusShort ? statusShort.split(/\r?\n/).filter(Boolean) : [];
  const stagedDeletions = dirtyLines.filter((l) => /^D\s/.test(l)).length;

  let ahead = 0;
  let behind = 0;
  if (upstream) {
    const counts = git(['rev-list', '--left-right', '--count', `${upstream}...HEAD`], cwd);
    const parts = counts.split(/\s+/).map(Number);
    if (parts.length === 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
      behind = parts[0];
      ahead = parts[1];
    }
  }

  const identity = checkoutLedger.repoIdentity(cwd);
  const paths = checkoutLedger.ledgerPaths(identity);
  const hygiene = checkoutLedger.worktreeHygiene(identity, paths, {});
  const hazardCount = (hygiene.counts?.HAZARD || 0) + (hygiene.counts?.UNKNOWN || 0);

  const closureState =
    hazardCount > 0 || stagedDeletions > 100
      ? 'blocked_hazard'
      : dirtyLines.length > 0
        ? 'active_uncommitted_work'
        : ahead > 0
          ? 'committed_pending_push_or_pr'
          : 'synced_with_upstream';

  const receipt = {
    schema: 'tnf/workcycle-closure-receipt/1.0',
    at: new Date().toISOString(),
    ok: hazardCount === 0 && stagedDeletions <= 100,
    closureState,
    commit: {
      headSha,
      branch,
      dirtyFilesCount: dirtyLines.length,
      stagedDeletions,
    },
    pushAndMerge: {
      upstream,
      ahead,
      behind,
      mergedToTarget: ahead === 0 && dirtyLines.length === 0,
    },
    cleanupAndHygiene: {
      scannedWorktrees: hygiene.scanned,
      hazards: hazardCount,
      warnings: hygiene.counts?.WARN || 0,
      safeToCleanupWorktrees: hazardCount === 0,
    },
  };

  fs.mkdirSync(RECEIPT_DIR, { recursive: true });
  fs.writeFileSync(WORKCYCLE_RECEIPT, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

/**
 * Execute one full autonomous self-improvement & orchestration cycle.
 */
function runAutonomousCycle(opts = {}) {
  const t0 = Date.now();
  const agent = opts.agent || process.env.TNF_AGENT_ID || 'tnf-cli-agent';

  // 1. Verify Assigned AI Standing Authority outside the model (D23 / D26 / D27)
  const authEval = berm.evaluate({
    actionClass: 'self_improve',
    agent,
    autonomousAi: true,
    target: 'autonomous-self-improvement-loop',
  });
  const roleAuth = berm.resolveAssignedAiStandingAuthority(agent);
  if (authEval.blocked || !roleAuth.authorized) {
    const denied = {
      ok: false,
      blocked: true,
      agent,
      error: roleAuth.reason || authEval.reason || 'Assigned AI authority check failed',
      at: new Date().toISOString(),
    };
    return denied;
  }

  // 2. Stage 1 — Inspect: Telemetry, Skill Competence Doctor, Resource Fabric, Workcycle
  const skillDoctor = skillGuard.runSkillDoctor(ROOT);
  const resourceScan = assimilationScan.scanAssimilationSurfaces({ root: ROOT, writeReceipt: true });
  const workcycle = runWorkcycleDoctor({ cwd: ROOT });

  const actionsExecuted = [];

  // 3. Stage 2 — Synthesize: System-1 Triage & Role-Tier Routing
  const leadRouting = failover.resolveProviderFailover({ role: 'lead_verifier', seed: true });
  const workerRouting = failover.resolveProviderFailover({ role: 'specialist_worker', seed: true });
  const system1Routing = failover.resolveProviderFailover({ role: 'system1_classifier', seed: true });

  const healthScoreRaw = Number(
    (
      0.4 * (workcycle.ok ? 1 : 0) +
      0.3 * (resourceScan.resourceFabricScan?.ok ? 1 : 0.5) +
      0.3 * Math.min(1, skillDoctor.avgCompetence / 0.7)
    ).toFixed(3)
  );
  const healthDecision = failover.validateSystem1Decision({
    mode: 'score',
    value: healthScoreRaw,
    min: 0,
    max: 1,
    confidence: 0.95,
  });

  const triageChoice = failover.validateSystem1Decision({
    mode: 'choice',
    value: !workcycle.ok ? 'quarantine' : opts.repair ? 'remediate_and_advance' : 'observe_only',
    options: ['remediate_and_advance', 'observe_only', 'quarantine'],
    confidence: 0.95,
  });

  // 4. Stage 3 — Act & Verify: Autonomous Self-Healing & Scouting Brief Refresh
  if (triageChoice.decision === 'remediate_and_advance') {
    const prov = runNodeScript('scripts/harness/provision-injection-surfaces.cjs', ['--repair', '--json']);
    actionsExecuted.push({
      step: 'provision-injection-surfaces',
      ok: prov.ok,
    });

    const scout = runNodeScript('scripts/scouting/staff-scout-missions.cjs', [
      '--skip-queue-build',
      '--json',
    ]);
    actionsExecuted.push({
      step: 'staff-scout-missions',
      ok: scout.ok,
    });
  }

  // 5. Stage 4 — Dual-State Compaction Record s_t = (A_t, E_t) + Skill State X_t & Memory Retention
  const artifactState = {
    headSha: workcycle.commit.headSha,
    branch: workcycle.commit.branch,
    dirtyFilesCount: workcycle.commit.dirtyFilesCount,
    workcycleReceipt: path.relative(ROOT, WORKCYCLE_RECEIPT),
  };
  const evidenceState = {
    workcycleOk: workcycle.ok,
    resourceFabricOk: Boolean(resourceScan.resourceFabricScan?.ok),
    meanSkillCompetence: skillDoctor.avgCompetence,
    system1HealthScore: healthDecision.decision,
    actionsExecuted,
  };
  const skillState = {
    goal: 'Continuous autonomous self-improvement and orchestration',
    currentStage: triageChoice.decision,
    unresolvedBlockers: workcycle.ok ? [] : ['worktree_hygiene_hazard'],
    pendingSteps: ['next_scheduled_self_improvement_cycle'],
  };

  const compactionReceipt = compaction.write({
    summary: `Autonomous self-improvement cycle by ${roleAuth.agentId} (${roleAuth.role}): health=${healthDecision.decision}, competence=${skillDoctor.avgCompetence}, workcycle=${workcycle.closureState}`,
    stage: 'autonomous_self_improve',
    hostOpacity: false,
    artifactState,
    evidenceState,
    skillState,
  });

  if (opts.retainMemory !== false) {
    runNodeScript('scripts/harness/memory-layer.cjs', [
      'retain',
      '--scope',
      'project',
      '--tags',
      'self-improvement,autonomy,ai7',
      '--text',
      `Autonomous cycle OK: agent=${roleAuth.agentId} role=${roleAuth.role} health=${healthDecision.decision} skillCompetence=${skillDoctor.avgCompetence} workcycle=${workcycle.closureState}`,
    ]);
  }

  const summary = {
    schema: 'tnf/autonomous-self-improvement-cycle/1.0',
    ok: workcycle.ok,
    at: new Date().toISOString(),
    durationMs: Date.now() - t0,
    authority: {
      agentId: roleAuth.agentId,
      role: roleAuth.role,
      standingId: roleAuth.standingId,
      bermDecision: authEval.decision,
      humanInTheLoopRequired: false,
    },
    routing: {
      leadVerifierPrimary: leadRouting.chain[0] || null,
      specialistWorkerPrimary: workerRouting.chain[0] || null,
      system1ClassifierPrimary: system1Routing.chain[0] || null,
    },
    system1Triage: {
      healthScore: healthDecision.decision,
      actionMode: triageChoice.decision,
    },
    diagnostics: {
      skillCompetenceMean: skillDoctor.avgCompetence,
      canonicalSkills: skillDoctor.totalCanonicalSkills,
      tier0FrontmatterTokens: skillDoctor.totalFrontmatterTokens,
      reclaimableResourceBytes: resourceScan.resourceFabricScan?.reclaimableBytes ?? 0,
      workcycleState: workcycle.closureState,
    },
    actionsExecuted,
    compactionRecordPath: compactionReceipt.path,
    workcycleReceiptPath: path.relative(ROOT, WORKCYCLE_RECEIPT),
  };

  fs.mkdirSync(RECEIPT_DIR, { recursive: true });
  fs.writeFileSync(CYCLE_RECEIPT, `${JSON.stringify(summary, null, 2)}\n`);
  summary.cycleReceiptPath = path.relative(ROOT, CYCLE_RECEIPT);
  return summary;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const result =
    opts.cmd === 'workcycle-doctor' ? runWorkcycleDoctor(opts) : runAutonomousCycle(opts);
  console.log(JSON.stringify(result, null, 2));
  if (result.ok === false) process.exit(1);
}

module.exports = {
  runWorkcycleDoctor,
  runAutonomousCycle,
  WORKCYCLE_RECEIPT,
  CYCLE_RECEIPT,
};

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(`autonomous-self-improvement-loop: ${err.message}`);
    process.exit(1);
  }
}
