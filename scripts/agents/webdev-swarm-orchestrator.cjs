#!/usr/bin/env node
/**
 * TNF Web Dev Agent Swarm Orchestrator
 *
 * Launches 6 specialist agents in parallel to audit a target TNF component.
 * Each agent produces a JSON report. The orchestrator collates findings
 * and produces a unified action plan.
 *
 * Usage:
 *   node scripts/agents/webdev-swarm-orchestrator.cjs --target apps/frontend
 *   node scripts/agents/webdev-swarm-orchestrator.cjs --target apps/api
 *   node scripts/agents/webdev-swarm-orchestrator.cjs --target packages/ui-consolidated
 */

'use strict';

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { singleInstanceGuard } = require('../lib/tnf-single-instance-guard.cjs');
const _guard = singleInstanceGuard({ lockName: 'webdev-swarm-orchestrator', staleMs: 30 * 60 * 1000 });
if (!_guard.acquired) {
  console.log(JSON.stringify({ ok: true, skipped: true, reason: 'already-running', lock: _guard.existingLock }));
  process.exit(0);
}

const REPORT_DIR = path.join(os.homedir(), '.tnf', 'webdev-swarm-reports');
fs.mkdirSync(REPORT_DIR, { recursive: true });

function parseArgs() {
  const args = process.argv.slice(2);
  const targetIdx = args.indexOf('--target');
  const target = targetIdx >= 0 ? args[targetIdx + 1] : 'apps/frontend';
  const outDir = path.join(REPORT_DIR, target.replace(/\//g, '-'));
  fs.mkdirSync(outDir, { recursive: true });
  return { target, outDir };
}

const { target, outDir } = parseArgs();

// Agent definitions — each maps to a skill + target scope
const AGENTS = [
  {
    id: 'frontend-ui-ux',
    name: 'Frontend/UI/UX Specialist',
    lockName: 'webdev-swarm-frontend',
    skillScript: 'webdev-frontend-skill.cjs',
    focus: [
      'React/Next.js patterns', 'Tailwind architecture', 'Component design',
      'State management', 'Routing', 'Visual polish'
    ],
  },
  {
    id: 'api-backend',
    name: 'API/Backend Specialist',
    lockName: 'webdev-swarm-api',
    skillScript: 'webdev-api-skill.cjs',
    focus: [
      'REST/GraphQL design', 'Data fetching patterns', 'Caching strategy',
      'Error handling', 'Rate limiting', 'Auth flow integrity'
    ],
  },
  {
    id: 'performance-seo',
    name: 'Performance & SEO Specialist',
    lockName: 'webdev-swarm-perf',
    skillScript: 'webdev-performance-skill.cjs',
    focus: [
      'Lighthouse scores', 'Core Web Vitals', 'Bundle analysis',
      'Image optimization', 'Meta/OG tags', 'Structured data'
    ],
  },
  {
    id: 'a11y',
    name: 'Accessibility Specialist',
    lockName: 'webdev-swarm-a11y',
    skillScript: 'webdev-a11y-skill.cjs',
    focus: [
      'WCAG 2.1 AA compliance', 'Keyboard nav', 'Screen reader support',
      'Color contrast', 'Motion sensitivity', 'Form accessibility'
    ],
  },
  {
    id: 'security',
    name: 'Security Specialist',
    lockName: 'webdev-swarm-security',
    skillScript: 'webdev-security-skill.cjs',
    focus: [
      'XSS prevention', 'CSRF tokens', 'Injection prevention',
      'Auth flow security', 'Dependency audit', 'Secret exposure'
    ],
  },
  {
    id: 'devops-build',
    name: 'DevOps & Build Specialist',
    lockName: 'webdev-swarm-devops',
    skillScript: 'webdev-devops-skill.cjs',
    focus: [
      'Docker optimization', 'CI/CD pipelines', 'Bundle optimization',
      'Environment parity', 'Deployment strategy', 'Monitoring setup'
    ],
  },
];

function runAgent(agent) {
  const reportPath = path.join(outDir, `${agent.id}-audit-report.json`);
  const logPath = path.join(outDir, `${agent.id}.log`);

  console.log(`[swarm] Launching ${agent.name} → ${reportPath}`);

  // Spawn agent as child process
  const skillPath = path.join(__dirname, agent.skillScript);
  const child = spawn(
    'node',
    [skillPath, '--target', target, '--report', reportPath],
    {
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, TNF_SWARM_REPORT_DIR: outDir },
    }
  );

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', d => stdout += d);
  child.stderr.on('data', d => stderr += d);

  return new Promise((resolve) => {
    child.on('close', (code) => {
      // Write agent log
      fs.writeFileSync(logPath, `EXIT: ${code}\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`, 'utf8');
      resolve({
        id: agent.id,
        name: agent.name,
        exitCode: code,
        reportPath: fs.existsSync(reportPath) ? reportPath : null,
        logPath: fs.existsSync(logPath) ? logPath : null,
      });
    });
  });
}

async function orchestrate() {
  const timestamp = new Date().toISOString();
  console.log(`[swarm] Orchestrating 6 agents on target: ${target}`);
  console.log(`[swarm] Report directory: ${outDir}`);

  // Launch all 6 agents in parallel
  const results = await Promise.all(AGENTS.map(runAgent));

  // Generate unified report
  const unified = {
    spec: 'tnf/webdev-swarm-unified/1.0',
    timestamp,
    target,
    agents: results,
    collected: results.filter(r => r.reportPath).length,
    failed: results.filter(r => r.exitCode !== 0).length,
  };

  const unifiedPath = path.join(outDir, 'unified-audit-report.json');
  fs.writeFileSync(unifiedPath, JSON.stringify(unified, null, 2), 'utf8');

  console.log(`[swarm] Unified report: ${unifiedPath}`);
  console.log(`[swarm] Agents completed: ${unified.collected}/6, failed: ${unified.failed}`);
  console.log(`[swarm] Done.`);

  // Release lock
  _guard.release();
}

orchestrate().catch(err => {
  console.error('[swarm] Orchestrator error:', err.message);
  _guard.release();
  process.exit(1);
});
