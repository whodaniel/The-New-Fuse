const { execSync } = require('child_process');
const { RedisAgentClient } = require('../../packages/tnf-cli/dist/index');

/**
 * Continuous Improver Script (v2.0 - Flywheel Integrated)
 * 
 * Objectives:
 * 1. Run system diagnostics (tnf doctor).
 * 2. Scan for tech debt (TODOs, FIXMEs).
 * 3. Dispatch maintenance tasks to the swarm via Redis.
 */

async function runImprover() {
  console.log('🛠️ Continuous Improver: Scanning system health...');

  const client = new RedisAgentClient();
  try {
    await client.initialize();
    await client.register('Continuous-Improver', 'worker', 'improver', ['diagnostics', 'self-repair']);
  } catch (e) {
    console.warn('⚠️ Redis not available. Running in offline diagnostic mode.');
  }

  // 1. Run TNF Doctor
  try {
    console.log('Running TNF Doctor...');
    execSync('pnpm run -s tnf:doctor', { stdio: 'pipe' });
    console.log('✅ TNF Doctor passed.');
  } catch (e) {
    const errorMsg = 'TNF Doctor reported configuration issues.';
    console.warn(`⚠️ ${errorMsg}`);
    
    if (client.publisher) {
      await client.publisher.lpush('tnf:master:tasks:planning', JSON.stringify({
        id: `task_improver_doctor_${Date.now()}`,
        title: "Fix System Configuration (Doctor Alert)",
        description: "The Continuous Improver detected failures in 'tnf doctor'. Review system environment and dependencies.",
        priority: 'high',
        status: 'queued',
        source: 'continuous-improver'
      }));
    }
  }

  // 2. Lint Check
  try {
    console.log('Running lint baseline...');
    execSync('pnpm run -s lint', {
      stdio: 'pipe',
      timeout: 180000,
      maxBuffer: 10 * 1024 * 1024
    });
    console.log('✅ Lint baseline passed.');
  } catch (e) {
    const lintOutput = [
      e?.stdout?.toString?.() || '',
      e?.stderr?.toString?.() || ''
    ].join('\n');
    const lintSummary = lintOutput
      .split('\n')
      .filter(Boolean)
      .slice(-25)
      .join('\n');
    console.warn('⚠️ Lint baseline failed. Dispatching cleanup task.');

    if (client.publisher) {
      await client.publisher.lpush('tnf:master:tasks:planning', JSON.stringify({
        id: `task_improver_lint_${Date.now()}`,
        title: 'Fix Workspace Lint Baseline',
        description: `Workspace lint failed. Last output lines:\n${lintSummary}`,
        priority: 'high',
        status: 'queued',
        source: 'continuous-improver'
      }));
    }
  }

  // 3. TODO/FIXME Scan
  try {
    console.log('Scanning for tech debt (TODO/FIXME)...');
    const debtCount = execSync(
      'rg -n -S "TODO|FIXME" --glob "!node_modules/**" --glob "!.git/**" --glob "!.turbo/**" --glob "!dist/**" --glob "!build/**" --glob "!coverage/**" . | wc -l',
      { stdio: 'pipe' }
    )
      .toString()
      .trim();
    console.log(`ℹ️ Found ${debtCount} TODO/FIXME markers in codebase.`);

    const debtHotspots = execSync(
      'rg -n -S "TODO|FIXME" --glob "!node_modules/**" --glob "!.git/**" --glob "!.turbo/**" --glob "!dist/**" --glob "!build/**" --glob "!coverage/**" . | awk -F: \'{print $1}\' | awk -F/ \'{print $1"/"$2}\' | sort | uniq -c | sort -nr | head -n 10',
      { stdio: 'pipe' }
    )
      .toString()
      .trim();
    
    if (parseInt(debtCount, 10) > 20 && client.publisher) {
      console.warn('⚠️ Tech debt threshold exceeded. Dispatching cleanup task.');
      await client.publisher.lpush('tnf:master:tasks:planning', JSON.stringify({
        id: `task_improver_debt_${Date.now()}`,
        title: "Codebase Tech Debt Cleanup",
        description: `Backlog of ${debtCount} TODO/FIXME markers detected. Top hotspots:\n${debtHotspots}`,
        priority: 'normal',
        status: 'queued',
        source: 'continuous-improver'
      }));
    }
  } catch (e) {
    console.log('✅ No critical tech debt found via ripgrep.');
  }

  console.log('✅ Continuous Improver: Scan complete.');
  if (client) await client.cleanup();
}

runImprover().catch(err => {
  console.error('❌ Continuous Improver failed:', err);
  process.exit(1);
});
