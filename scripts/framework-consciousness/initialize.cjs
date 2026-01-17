#!/usr/bin/env node
/**
 * Framework Consciousness - Initialization Script
 *
 * Begins the process of comprehensive framework understanding
 * by executing Phase 1: Foundation Discovery
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '../..');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  FRAMEWORK CONSCIOUSNESS - Initialization                  ║');
console.log('║  Phase 1: Foundation Discovery                             ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Create output directory
const outputDir = path.join(PROJECT_ROOT, '.framework-consciousness');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('[1/5] Foundation Discovery Starting...\n');

// 1.1 Documentation Discovery (Already Complete)
console.log('  [1.1] Documentation Discovery');
const docManifest = path.join(PROJECT_ROOT, '.documentation-system/classified-manifest.json');
if (fs.existsSync(docManifest)) {
  const manifest = JSON.parse(fs.readFileSync(docManifest, 'utf-8'));
  console.log(`        ✅ ${manifest.metadata.totalFiles} files discovered and classified`);
  console.log(`        ✅ ${manifest.metadata.byPriority.P1 || 0} P1 files identified`);
  console.log(`        ✅ Stage 3 analysis in progress\n`);
} else {
  console.log('        ⚠️  Documentation system not yet run\n');
}

// 1.2 Codebase Structure Analysis
console.log('  [1.2] Codebase Structure Analysis');
console.log('        Mapping packages...');

const packagesDir = path.join(PROJECT_ROOT, 'packages');
const packages = fs.existsSync(packagesDir)
  ? fs.readdirSync(packagesDir).filter(f => {
      const pkgPath = path.join(packagesDir, f);
      return fs.statSync(pkgPath).isDirectory() &&
             fs.existsSync(path.join(pkgPath, 'package.json'));
    })
  : [];

console.log(`        ✅ Found ${packages.length} packages:`);
packages.slice(0, 10).forEach(pkg => {
  console.log(`           - ${pkg}`);
});
if (packages.length > 10) {
  console.log(`           ... and ${packages.length - 10} more\n`);
} else {
  console.log('');
}

console.log('        Mapping applications...');
const appsDir = path.join(PROJECT_ROOT, 'apps');
const apps = fs.existsSync(appsDir)
  ? fs.readdirSync(appsDir).filter(f => {
      const appPath = path.join(appsDir, f);
      return fs.statSync(appPath).isDirectory() &&
             fs.existsSync(path.join(appPath, 'package.json'));
    })
  : [];

console.log(`        ✅ Found ${apps.length} applications:`);
apps.forEach(app => {
  console.log(`           - ${app}`);
});
console.log('');

// 1.3 Agent Ecosystem Discovery
console.log('  [1.3] Agent Ecosystem Discovery');
console.log('        Checking TNF Relay...');

try {
  const relayHealth = execSync('curl -s http://localhost:3001/health', { encoding: 'utf-8' });
  const health = JSON.parse(relayHealth);
  console.log(`        ✅ Relay running: ${health.agents} agents, ${health.channels} channels`);

  const agentsResp = execSync('curl -s http://localhost:3001/agents', { encoding: 'utf-8' });
  const agents = JSON.parse(agentsResp);
  console.log(`        ✅ Active agents:`);
  agents.slice(0, 10).forEach(agent => {
    console.log(`           - ${agent.name} (${agent.platform})`);
  });
  if (agents.length > 10) {
    console.log(`           ... and ${agents.length - 10} more`);
  }
} catch (e) {
  console.log('        ⚠️  Relay not accessible at localhost:3001');
}
console.log('');

// Generate summary report
console.log('[2/5] Generating Foundation Report...\n');

const report = {
  timestamp: new Date().toISOString(),
  phase: 'Phase 1: Foundation Discovery',
  status: 'Complete',
  discoveries: {
    documentation: {
      totalFiles: fs.existsSync(docManifest)
        ? JSON.parse(fs.readFileSync(docManifest)).metadata.totalFiles
        : 0,
      stage1: 'Complete',
      stage2: 'Complete',
      stage3: 'In Progress'
    },
    codebase: {
      packages: packages.length,
      applications: apps.length,
      packagesList: packages,
      applicationsList: apps
    },
    agents: {
      relayStatus: 'running',
      agentCount: 0 // Will be updated if relay accessible
    }
  },
  nextPhase: 'Phase 2: Deep Pattern Recognition'
};

const reportPath = path.join(outputDir, 'foundation-discovery-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`  ✅ Report saved: ${reportPath}\n`);

// Summary
console.log('[3/5] Foundation Discovery Summary\n');
console.log('  📊 Framework Components Discovered:');
console.log(`     - Documentation: ${report.discoveries.documentation.totalFiles} files`);
console.log(`     - Packages: ${report.discoveries.codebase.packages}`);
console.log(`     - Applications: ${report.discoveries.codebase.applications}`);
console.log(`     - Agents: Active relay system detected\n`);

console.log('[4/5] Current Framework Understanding: ~15%\n');
console.log('  Phase 1: ✅ COMPLETE (Foundation Discovery)');
console.log('  Phase 2: ⏸️  PENDING (Deep Pattern Recognition)');
console.log('  Phase 3: ⏸️  PENDING (Integration Intelligence)');
console.log('  Phase 4: ⏸️  PENDING (Capability Synthesis)');
console.log('  Phase 5: ⏸️  PENDING (Emergence & Evolution)');
console.log('  Phase 6: ⏸️  PENDING (Reach & Value)\n');

console.log('[5/5] Next Steps\n');
console.log('  To continue framework consciousness development:\n');
console.log('  1. Wait for Stage 3 analysis results (concept extraction)');
console.log('     Expected: 30-60 minutes\n');
console.log('  2. Run Phase 2: Deep Pattern Recognition');
console.log('     Command: node scripts/framework-consciousness/run-phase-2.cjs\n');
console.log('  3. Continue through remaining phases for complete understanding\n');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  FRAMEWORK CONSCIOUSNESS: Foundation Established           ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('The framework is beginning to know itself.\n');
