#!/usr/bin/env node
/*
 * TNF Parity Audit
 * Real evidence-driven parity checks across CLI, App UI, Library UI, and API surfaces.
 * Exits non-zero when parity is incomplete.
 */
const fs = require('node:fs');
const path = require('node:path');
const chalk = require('chalk');

const ROOT = process.cwd();

const CANDIDATE_SURFACES = {
  CLI: ['packages/tnf-cli/src/cli.ts'],
  APP: ['apps/frontend/src'],
  LIBRARY: [
    'apps/virtual-library-blueprints/src',
    'Projects/virtual-library-blueprints/src',
    '../Projects/virtual-library-blueprints/src',
  ],
  API_SAAS: ['apps/api/src'],
  API_CORE: ['apps/backend/src'],
};

function resolveFirstExisting(candidates) {
  for (const rel of candidates) {
    const abs = path.join(ROOT, rel);
    if (fs.existsSync(abs)) {
      return { rel, abs };
    }
  }
  return null;
}

function resolveSurfaces() {
  return {
    CLI: resolveFirstExisting(CANDIDATE_SURFACES.CLI),
    APP: resolveFirstExisting(CANDIDATE_SURFACES.APP),
    LIBRARY: resolveFirstExisting(CANDIDATE_SURFACES.LIBRARY),
    API_SAAS: resolveFirstExisting(CANDIDATE_SURFACES.API_SAAS),
    API_CORE: resolveFirstExisting(CANDIDATE_SURFACES.API_CORE),
  };
}

function relToAbs(relPath) {
  return path.join(ROOT, relPath);
}

function within(relRoot, subPath) {
  return path.join(relRoot, subPath);
}

function readFileSafe(relPath) {
  try {
    return fs.readFileSync(relToAbs(relPath), 'utf8');
  } catch {
    return null;
  }
}

function pathExists(relPath) {
  return fs.existsSync(relToAbs(relPath));
}

function matchOne(content, pattern) {
  if (typeof pattern === 'string') return content.includes(pattern);
  return pattern.test(content);
}

function fileContainsAll(relPath, patterns) {
  const content = readFileSafe(relPath);
  if (!content) {
    return { ok: false, reason: `missing file ${relPath}` };
  }
  const missing = patterns.filter((pattern) => !matchOne(content, pattern));
  if (missing.length > 0) {
    return {
      ok: false,
      reason: `pattern miss in ${relPath}`,
    };
  }
  return { ok: true, reason: `matched ${relPath}` };
}

function allChecks(checks) {
  const failed = [];
  for (const check of checks) {
    const result = check();
    if (!result.ok) failed.push(result.reason);
  }
  return failed.length === 0
    ? { ok: true, reason: 'all checks passed' }
    : { ok: false, reason: failed.join('; ') };
}

function anyChecks(checks) {
  const reasons = [];
  for (const check of checks) {
    const result = check();
    if (result.ok) return { ok: true, reason: result.reason };
    reasons.push(result.reason);
  }
  return { ok: false, reason: reasons.join('; ') };
}

function nAReason() {
  return { ok: true, reason: 'n/a', na: true };
}

const MODULES = [
  {
    id: 'story',
    name: 'Story Architect',
    checks: (surfaces) => ({
      cli: allChecks([
        () => fileContainsAll(surfaces.CLI.rel, ["program.command('story')", ".command('draft')", ".command('capture')"]),
      ]),
      app: allChecks([
        () => fileContainsAll('apps/frontend/src/pages/Timeline/index.tsx', ['readSources', 'evidenceRefs']),
        () => fileContainsAll('apps/frontend/src/services/unifiedLedgerApi.ts', ['/api/unified-ledger/timeline', 'timelineApiFetch']),
      ]),
      library: surfaces.LIBRARY
        ? allChecks([
            () =>
              fileContainsAll(within(surfaces.LIBRARY.rel, 'lib/persistence.ts'), [
                'story_sessions',
                'timeline_events',
                'owner_principal_id',
              ]),
            () =>
              fileContainsAll(within(surfaces.LIBRARY.rel, 'components/ui/AIGuidePanel.tsx'), [
                'Story Architect',
              ]),
          ])
        : { ok: false, reason: 'library surface missing' },
      api: allChecks([
        () => fileContainsAll('apps/api/src/modules/unified-ledger/unified-ledger.service.ts', [
          'listPublicTimelineEvents',
          'story_sessions',
          'timeline_events',
          'owner_principal_id',
          'extractStoryArchitectSourceRefs',
          'question:',
          'session:',
        ]),
      ]),
    }),
  },
  {
    id: 'timeline',
    name: 'Unified Timeline',
    checks: (surfaces) => ({
      cli: allChecks([
        () => fileContainsAll(surfaces.CLI.rel, ["program.command('story')", ".command('timeline')"]),
      ]),
      app: allChecks([
        () => fileContainsAll('apps/frontend/src/pages/Timeline/index.tsx', ['readPayload', 'readSources']),
        () => fileContainsAll('apps/frontend/src/config/sitemap.ts', ["'/timeline'"]),
      ]),
      library: surfaces.LIBRARY
        ? allChecks([
            () => fileContainsAll(within(surfaces.LIBRARY.rel, 'store/index.ts'), ['timelineEvents']),
            () => fileContainsAll(within(surfaces.LIBRARY.rel, 'lib/persistence.ts'), ['timeline_events']),
          ])
        : { ok: false, reason: 'library surface missing' },
      api: allChecks([
        () => fileContainsAll('apps/api/src/modules/unified-ledger/unified-ledger.controller.ts', ["@Get('timeline/events')"]),
        () => fileContainsAll('apps/api/src/modules/unified-ledger/unified-ledger.service.ts', ['listTimelineEvents']),
      ]),
    }),
  },
  {
    id: 'relay',
    name: 'Relay Server',
    checks: (surfaces) => ({
      cli: allChecks([
        () => fileContainsAll(surfaces.CLI.rel, ["program.command('relay')"]),
      ]),
      app: anyChecks([
        () => fileContainsAll('apps/frontend/src/pages/PerpetualStatus.tsx', ['/api/relay/health']),
        () => fileContainsAll('apps/frontend/src/pages/Admin/ComprehensiveAdminDashboard.tsx', ['/health', '/channels', '/agents']),
      ]),
      library: nAReason(),
      api: anyChecks([
        () => ({ ok: pathExists('apps/backend/src/modules/relay'), reason: 'apps/backend relay module exists' }),
        () => ({ ok: pathExists('apps/api/src/modules/relay'), reason: 'apps/api relay module exists' }),
      ]),
    }),
  },
  {
    id: 'agents',
    name: 'Agent Management',
    checks: (surfaces) => ({
      cli: anyChecks([
        () => fileContainsAll(surfaces.CLI.rel, ["program.command('agents')"]),
        () => fileContainsAll(surfaces.CLI.rel, ["program.command('agent')"]),
      ]),
      app: allChecks([
        () => fileContainsAll('apps/frontend/src/config/sitemap.ts', ["'/agents'", 'Agent Fleet']),
        () => fileContainsAll('apps/frontend/src/store/agentSlice.tsx', ['fetchAgents', "api.get('/agents')"]),
      ]),
      library: surfaces.LIBRARY
        ? anyChecks([
            () => fileContainsAll(within(surfaces.LIBRARY.rel, 'lib/persistence.ts'), ['agent_allowlist']),
            () =>
              fileContainsAll(within(surfaces.LIBRARY.rel, 'lib/database.types.ts'), [
                'story_session_agent_access',
              ]),
          ])
        : { ok: false, reason: 'library surface missing' },
      api: anyChecks([
        () => ({ ok: pathExists('apps/api/src/modules/agent-registry'), reason: 'apps/api agent-registry module exists' }),
        () => ({ ok: pathExists('apps/backend/src/modules/agent-registry'), reason: 'apps/backend agent-registry module exists' }),
      ]),
    }),
  },
  {
    id: 'auth',
    name: 'Identity & Auth',
    checks: (surfaces) => ({
      cli: allChecks([
        () => fileContainsAll(surfaces.CLI.rel, ["program.command('auth')"]),
      ]),
      app: allChecks([
        () => fileContainsAll('apps/frontend/src/config/sitemap.ts', ["'/auth/login'", "'/auth/register'", "'/auth/callback'"]),
      ]),
      library: nAReason(),
      api: allChecks([
        () => ({ ok: pathExists('apps/api/src/modules/auth'), reason: 'apps/api auth module exists' }),
      ]),
    }),
  },
  {
    id: 'goals',
    name: 'Strategic Goals',
    checks: (surfaces) => ({
      cli: allChecks([
        () => fileContainsAll(surfaces.CLI.rel, ["program.command('goals')", ".command('list')", ".command('create')", ".command('stats')"]),
      ]),
      app: allChecks([
        () => fileContainsAll('apps/frontend/src/config/sitemap.ts', ["'/goals'"]),
      ]),
      library: nAReason(),
      api: anyChecks([
        () => fileContainsAll('apps/api/src/modules/unified-ledger/unified-ledger.controller.ts', ["@Post('goals')", "@Get('goals')"]),
        () => fileContainsAll('apps/api/src/modules/unified-ledger/unified-ledger.service.ts', ['createGoal', 'listGoals']),
        () => ({ ok: pathExists('apps/backend/src/modules/orchestrator'), reason: 'apps/backend orchestrator module exists' }),
      ]),
    }),
  },
];

function auditPrivacyGuardrails() {
  const checks = [
    () => fileContainsAll('apps/api/src/modules/unified-ledger/unified-ledger.service.ts', [
      'resolveTimelineAccess',
      'ownerUserId',
      'viewerUserId',
      'owner_principal_id',
    ]),
    () => fileContainsAll('apps/api/src/modules/unified-ledger/unified-ledger.service.ts', [
      'extractStoryArchitectSourceRefs',
      'session:',
      'question:',
    ]),
    () => fileContainsAll('packages/tnf-cli/src/services/StoryService.ts', [
      '.eq(\'owner_principal_id\'',
      'validate story session ownership',
      'SUPABASE_SERVICE_ROLE_KEY',
    ]),
  ];

  return allChecks(checks);
}

function renderCell(result) {
  if (result && result.na) return chalk.dim(' - ');
  return result.ok ? chalk.green(' OK ') : chalk.red('MISS');
}

function summarizeSurface(resolved) {
  return {
    CLI: resolved.CLI ? resolved.CLI.rel : 'missing',
    APP: resolved.APP ? resolved.APP.rel : 'missing',
    LIBRARY: resolved.LIBRARY ? resolved.LIBRARY.rel : 'missing',
    API_SAAS: resolved.API_SAAS ? resolved.API_SAAS.rel : 'missing',
    API_CORE: resolved.API_CORE ? resolved.API_CORE.rel : 'missing',
  };
}

function main() {
  const strict = !process.argv.includes('--soft');
  const resolved = resolveSurfaces();
  const surfaceSummary = summarizeSurface(resolved);

  console.log(chalk.bold.blue('\n  TNF Completeness & Parity Audit'));
  console.log('  ' + '='.repeat(70));
  console.log(`\n  Surfaces:`);
  console.log(`  - CLI:     ${surfaceSummary.CLI}`);
  console.log(`  - App:     ${surfaceSummary.APP}`);
  console.log(`  - Library: ${surfaceSummary.LIBRARY}`);
  console.log(`  - API:     ${surfaceSummary.API_SAAS}`);
  console.log(`  - Core:    ${surfaceSummary.API_CORE}`);

  if (!resolved.CLI || !resolved.APP || !resolved.API_SAAS || !resolved.API_CORE) {
    console.log(chalk.red('\n  Fatal: One or more required surfaces are missing.'));
    process.exit(1);
  }

  const rows = [];
  for (const mod of MODULES) {
    const checks = mod.checks(resolved);
    rows.push({ name: mod.name, checks });
  }

  console.log(`\n  ${'Module'.padEnd(20)} | ${'CLI'.padEnd(5)} | ${'App'.padEnd(5)} | ${'Lib'.padEnd(5)} | ${'API (S+C)'.padEnd(10)}`);
  console.log('  ' + '-'.repeat(70));

  let totalPoints = 0;
  let earnedPoints = 0;
  const misses = [];

  for (const row of rows) {
    const surfaces = [row.checks.cli, row.checks.app, row.checks.library, row.checks.api];
    surfaces.forEach((result) => {
      if (result && result.na) return;
      totalPoints += 1;
      if (result.ok) earnedPoints += 1;
    });

    if (!row.checks.cli.ok) misses.push(`${row.name} CLI: ${row.checks.cli.reason}`);
    if (!row.checks.app.ok) misses.push(`${row.name} App: ${row.checks.app.reason}`);
    if (!row.checks.library.ok && !(row.checks.library && row.checks.library.na)) {
      misses.push(`${row.name} Library: ${row.checks.library.reason}`);
    }
    if (!row.checks.api.ok) misses.push(`${row.name} API: ${row.checks.api.reason}`);

    console.log(
      `  ${row.name.padEnd(20)} | ${renderCell(row.checks.cli)} | ${renderCell(row.checks.app)} | ${renderCell(row.checks.library)} | ${renderCell(row.checks.api)}`
    );
  }

  const privacy = auditPrivacyGuardrails();

  console.log('\n  ' + chalk.bold('Privacy Guardrail Audit (Multi-tenant):'));
  console.log('  - Verifying owner scoping + source-ref parsing...');
  if (privacy.ok) {
    console.log(chalk.green('  ✅ Guardrail checks passed.'));
  } else {
    console.log(chalk.red(`  ❌ Guardrail checks failed: ${privacy.reason}`));
  }

  const score = totalPoints === 0 ? 0 : Math.round((earnedPoints / totalPoints) * 100);

  console.log('\n  ' + chalk.bold('Summary:'));
  console.log(`  Overall Parity Score: ${score === 100 ? chalk.green(`${score}%`) : chalk.yellow(`${score}%`)}`);

  if (misses.length > 0) {
    console.log(chalk.red('\n  Missing / Failed Checks:'));
    for (const miss of misses) {
      console.log(`  - ${miss}`);
    }
  }

  const success = score === 100 && privacy.ok;
  if (success) {
    console.log(chalk.green('\n  ✅ All modules are functionally complete across checked surfaces.\n'));
  } else {
    console.log(chalk.red('\n  ❌ Parity is incomplete. Resolve misses before production readiness.\n'));
  }

  if (strict && !success) {
    process.exit(1);
  }
}

main();
