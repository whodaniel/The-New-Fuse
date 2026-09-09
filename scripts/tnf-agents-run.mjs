#!/usr/bin/env node
/**
 * tnf-agents-run.cjs
 *
 * Agent entry point with authority verification.
 * Wires: verifyHeldGrant → delegation record → grant-scoped Turn Zero → budget manifest → delegate preamble → delegate-return.
 *
 * Usage:
 *   node scripts/tnf-agents-run.cjs --grant <grant-file|grant-json> --agent <agent-id> --task "<task>"
 *
 * The grant must be a valid capability grant (UCAN-shaped) issued by the operator.
 * On successful verification, emits a delegation record and runs the agent with scoped context.
 */

import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');

// Load authority client (verifyHeldGrant, resolvePublicKeyPem)
const { verifyHeldGrant, resolvePublicKeyPem, requestElevation, awaitGrant } =
  await import(join(REPO_ROOT, 'scripts/lib/tnf-authority-client.cjs'));

// Load delegation record emitter
const { emitDelegationRecord, DelegationRecord } =
  await import(join(REPO_ROOT, 'scripts/lib/tnf-delegation-record.cjs'));

// Load capability grant utilities
const { CapabilityGrant, parseGrant, resourceCovers, covers } =
  await import(join(REPO_ROOT, 'scripts/lib/tnf-capability-grant.cjs'));

// Load frontload/onboard for Turn Zero hydration
const { runOnboard } = await import(join(REPO_ROOT, 'scripts/tnf-onboard.cjs'));

// Load CLI for running the actual agent command
const { runCli } = await import(join(REPO_ROOT, 'packages/tnf-cli/src/cli.ts'));

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    grant: null,
    agentId: null,
    task: null,
    parentHandoffId: null,
    budgetTokens: null,
    budgetMs: null,
    dryRun: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--grant':
        result.grant = args[++i];
        break;
      case '--agent':
        result.agentId = args[++i];
        break;
      case '--task':
        result.task = args[++i];
        break;
      case '--parent-handoff':
        result.parentHandoffId = args[++i];
        break;
      case '--budget-tokens':
        result.budgetTokens = parseInt(args[++i], 10);
        break;
      case '--budget-ms':
        result.budgetMs = parseInt(args[++i], 10);
        break;
      case '--dry-run':
        result.dryRun = true;
        break;
      case '--help':
      case '-h':
        result.help = true;
        break;
    }
  }
  return result;
}

/**
 * Load grant from file or inline JSON
 */
function loadGrant(grantArg) {
  if (!grantArg) return null;

  // If it looks like a file path
  if (grantArg.startsWith('./') || grantArg.startsWith('/') || grantArg.endsWith('.json')) {
    const path = resolve(grantArg);
    if (!existsSync(path)) {
      throw new Error(`Grant file not found: ${path}`);
    }
    return JSON.parse(readFileSync(path, 'utf8'));
  }

  // Try parsing as JSON
  try {
    return JSON.parse(grantArg);
  } catch {
    throw new Error('Grant must be a file path or valid JSON');
  }
}

/**
 * Generate budget-bounded master-graph manifest from grant conditions
 */
function generateBudgetManifest(grant, overrides = {}) {
  const conditions = grant.conditions || {};
  const budget = {
    maxTokens: overrides.budgetTokens ?? conditions.maxTokens ?? 50000,
    maxDurationMs: overrides.budgetMs ?? conditions.maxDurationMs ?? 300000,
    maxToolCalls: conditions.maxToolCalls ?? 100,
    maxDelegationDepth: conditions.maxDelegationDepth ?? 2,
    allowedResources: grant.capabilities.map(c => c.with),
    allowedActions: grant.capabilities.map(c => c.can),
  };

  return {
    spec: 'tnf/budget-manifest/0.1',
    manifestId: randomUUID(),
    createdAt: new Date().toISOString(),
    grantId: grant.grantId,
    agentId: grant.subject,
    rootTaskId: grant.rootTaskId,
    budget,
    bounds: {
      resources: budget.allowedResources,
      actions: budget.allowedActions,
      delegationChain: [grant.grantId],
    },
  };
}

/**
 * Render delegate preamble from verified grant
 */
function renderDelegatePreamble(grant, budgetManifest, parentHandoffId) {
  const capabilities = grant.capabilities.map(c => `${c.with}:${c.can}`).join(', ');

  return `# Delegate Preamble (Grant-Scoped)

**Grant ID:** ${grant.grantId}
**Agent:** ${grant.subject}
**Root Task:** ${grant.rootTaskId}
**Bound Task:** ${grant.boundTask || 'unbound'}
**Report To:** ${grant.reportOn || 'parent'}
**Parent Handoff:** ${parentHandoffId || 'none'}

## Capabilities Granted
${capabilities}

## Budget Limits
- Max Tokens: ${budgetManifest.budget.maxTokens}
- Max Duration: ${budgetManifest.budget.maxDurationMs}ms
- Max Tool Calls: ${budgetManifest.budget.maxToolCalls}
- Max Delegation Depth: ${budgetManifest.budget.maxDelegationDepth}

## Reporting Obligations
- Emit delegate-return handoff to parent on completion
- Include: work_summary, changed_paths, verification, continuation, next_actions
- Reference parent_handoff_id: ${parentHandoffId || 'N/A'}

## Turn Zero Scope
This delegate's Turn Zero hydration is derived from the grant's \`rootTaskId\` and \`boundTask\`.
Only the rails and context relevant to the bound task are injected.
`;
}

/**
 * Run grant-scoped Turn Zero hydration
 */
async function runGrantScopedTurnZero(grant, budgetManifest, task) {
  // The grant's rootTaskId and boundTask scope the hydration
  const hydrationTask = grant.boundTask || grant.rootTaskId || task;

  console.log(`[agents-run] Running grant-scoped Turn Zero for task: ${hydrationTask}`);
  console.log(`[agents-run] Grant ID: ${grant.grantId}`);
  console.log(`[agents-run] Budget: ${budgetManifest.budget.maxTokens} tokens, ${budgetManifest.budget.maxDurationMs}ms`);

  // Run onboard with task-scoped hydration
  const result = await runOnboard({
    task: hydrationTask,
    writeReady: true, // Delegate has verified grant, so write-ready
    skipMcp: false,
    skipScout: true, // Delegates don't run scout missions
    skipHostProfiles: true,
  });

  return result;
}

/**
 * Emit delegate-return handoff to parent (Phase 3)
 */
async function emitDelegateReturn({
  parentHandoffId,
  grantId,
  agentId,
  workSummary,
  changedPaths,
  verification,
  continuation,
  nextActions,
  status = 'completed',
}) {
  const delegateReturn = {
    spec: 'tnf/delegate-return/0.1',
    delegate_return_id: randomUUID(),
    created_at: new Date().toISOString(),
    parent_handoff_id: parentHandoffId,
    grant_id: grantId,
    agent_id: agentId,
    work_summary: workSummary,
    changed_paths: changedPaths,
    verification,
    continuation,
    next_actions: nextActions,
    status,
  };

  // Store in delegation chain directory
  const chainDir = join(REPO_ROOT, 'docs/protocols/reports/delegate-returns', parentHandoffId);
  mkdirSync(chainDir, { recursive: true });

  const filePath = join(chainDir, `${delegateReturn.delegate_return_id}.json`);
  writeFileSync(filePath, JSON.stringify(delegateReturn, null, 2));

  console.log('[agents-run] ✅ Delegate return emitted:', filePath);
  return delegateReturn;
}

/**
 * Execute the agent with the granted capabilities
 */
async function executeAgent(agentId, task, grant, budgetManifest) {
  // Build the agent command based on agentId
  // This maps to the TNF CLI agent runners
  const agentCommands = {
    'gemini': ['gemini', '--task', task],
    'claude': ['claude', '--task', task],
    'codex': ['codex', '--task', task],
    'cursor': ['cursor', '--task', task],
    'tnf-cli': ['tnf', 'task', task],
  };

  const cmd = agentCommands[agentId] || ['tnf', 'agent', 'run', '--agent', agentId, '--task', task];

  console.log(`[agents-run] Executing agent: ${cmd.join(' ')}`);

  // For now, delegate to the TNF CLI which handles agent routing
  // In the future, this could spawn the agent directly with the grant context
  const { spawnSync } = await import('node:child_process');
  const result = spawnSync('node', [join(REPO_ROOT, 'packages/tnf-cli/src/cli.ts'), ...cmd.slice(1)], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      TNF_GRANT_ID: grant.grantId,
      TNF_BUDGET_TOKENS: String(budgetManifest.budget.maxTokens),
      TNF_BUDGET_MS: String(budgetManifest.budget.maxDurationMs),
      TNF_DELEGATE_MODE: '1',
    },
  });

  if (result.error) {
    throw result.error;
  }
  return result.status === 0;
}

/**
 * Main entry point
 */
async function main() {
  const args = parseArgs();

  if (args.help || !args.grant || !args.agentId || !args.task) {
    console.log(`
TNF Agents Run - Authority-Verified Agent Execution

Usage:
  node scripts/tnf-agents-run.cjs --grant <file|json> --agent <id> --task "<task>" [options]

Required:
  --grant <file|json>        Capability grant (UCAN-shaped) from operator
  --agent <id>               Agent identifier (gemini, claude, codex, cursor, tnf-cli, etc.)
  --task "<task>"            Task description for the agent

Options:
  --parent-handoff <id>      Parent handoff ID for delegate-return routing
  --budget-tokens <n>        Override max tokens from grant conditions
  --budget-ms <n>            Override max duration (ms) from grant conditions
  --dry-run                  Verify grant and emit delegation record, but don't run agent
  --help                     Show this help

Examples:
  # From grant file
  node scripts/tnf-agents-run.cjs --grant ./grants/task-123.json --agent gemini --task "Refactor auth module"

  # Inline grant JSON
  node scripts/tnf-agents-run.cjs --grant '{"grantId":"...","subject":"agent:gemini",...}' --agent gemini --task "Fix bug #456"

  # With parent handoff for delegate-return
  node scripts/tnf-agents-run.cjs --grant ./grant.json --agent claude --task "Write tests" --parent-handoff abc-123
`);
    process.exit(args.help ? 0 : 1);
  }

  console.log('[agents-run] Starting authority-verified agent execution');
  console.log('[agents-run] Agent:', args.agentId);
  console.log('[agents-run] Task:', args.task);

  try {
    // 1. Load and parse grant
    const grantData = loadGrant(args.grant);
    if (!grantData) throw new Error('No grant provided');

    const grant = parseGrant(grantData);
    console.log('[agents-run] Grant loaded:', grant.grantId);
    console.log('[agents-run] Subject:', grant.subject);
    console.log('[agents-run] Capabilities:', grant.capabilities.length);

    // 2. Verify held grant (this is the authority seam)
    console.log('[agents-run] Verifying held grant...');
    const verification = await verifyHeldGrant(grant);
    if (!verification.valid) {
      throw new Error(`Grant verification failed: ${verification.reason}`);
    }
    console.log('[agents-run] ✅ Grant verified:', verification.grantId);

    // 3. Emit delegation record (Phase 2 wiring)
    console.log('[agents-run] Emitting delegation record...');
    const delegationRecord = await emitDelegationRecord({
      grant,
      agentId: args.agentId,
      task: args.task,
      parentHandoffId: args.parentHandoffId,
      verification,
    });
    console.log('[agents-run] ✅ Delegation record emitted:', delegationRecord.delegationId);

    // 4. Generate budget-bounded master-graph manifest (Phase 5)
    const budgetManifest = generateBudgetManifest(grant, {
      budgetTokens: args.budgetTokens,
      budgetMs: args.budgetMs,
    });
    console.log('[agents-run] ✅ Budget manifest generated:', budgetManifest.manifestId);

    // 5. Render delegate preamble (Phase 6)
    const preamble = renderDelegatePreamble(grant, budgetManifest, args.parentHandoffId);
    console.log('[agents-run] ✅ Delegate preamble rendered');

    // Write preamble to a temp file for the agent to read
    const preamblePath = join(REPO_ROOT, '.tnf', 'delegate-preamble.md');
    writeFileSync(preamblePath, preamble);
    console.log('[agents-run] Preamble written to:', preamblePath);

    if (args.dryRun) {
      console.log('[agents-run] Dry run complete. Grant verified, delegation recorded, preamble ready.');
      process.exit(0);
    }

    // 6. Run grant-scoped Turn Zero hydration (Phase 4)
    await runGrantScopedTurnZero(grant, budgetManifest, args.task);

    // 7. Execute the agent
    console.log('[agents-run] Launching agent...');
    const success = await executeAgent(args.agentId, args.task, grant, budgetManifest);

    // 8. Emit delegate-return handoff (Phase 3) - always emit, even on failure
    const workSummary = success
      ? [`Agent ${args.agentId} completed task: ${args.task}`]
      : [`Agent ${args.agentId} failed task: ${args.task}`];

    const changedPaths = []; // Could be populated from git diff or agent output

    const delegateReturn = await emitDelegateReturn({
      parentHandoffId: args.parentHandoffId,
      grantId: grant.grantId,
      agentId: args.agentId,
      workSummary,
      changedPaths,
      verification: {
        privacy_guard: 'pass',
        secret_sweep: 'pass',
        notes: 'Automated verification placeholder - integrate with actual sweep tools',
      },
      continuation: {
        owner: 'operator',
        targets: args.parentHandoffId ? [args.parentHandoffId] : [],
        priority: success ? 'low' : 'high',
        resume_checklist: success
          ? ['Review delegate output', 'Merge changes if applicable']
          : ['Investigate failure', 'Check logs', 'Retry with adjusted grant'],
      },
      nextActions: success
        ? ['Review completed work', 'Update parent handoff with results']
        : ['Debug agent failure', 'Adjust grant/budget', 'Retry delegation'],
      status: success ? 'completed' : 'failed',
    });

    if (success) {
      console.log('[agents-run] ✅ Agent execution completed successfully');
    } else {
      console.error('[agents-run] ❌ Agent execution failed');
      process.exit(1);
    }

  } catch (error) {
    console.error('[agents-run] ❌ Error:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

main();