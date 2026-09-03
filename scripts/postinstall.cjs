const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Skip native module builds in CI/Docker/CloudRuntime environments
if (process.env.CLOUD_RUNTIME_ENVIRONMENT || process.env.CI || process.env.DOCKER || process.env.KUBERNETES_SERVICE_HOST) {
  console.log('[postinstall.js] Skipping native module builds in CI/Docker/CloudRuntime environment');
  process.exit(0);
}

const canvasModulePath = path.join(__dirname, '..', 'node_modules', 'canvas');
const canvasNodeFile = path.join(canvasModulePath, 'build', 'Release', 'canvas.node');

function log(message) {
  console.log(`[postinstall.js] ${message}`);
}

function rebuildCanvas() {
  log('Canvas module is missing or broken. Attempting to rebuild...');
  try {
    const nodeGypPath = path.join(__dirname, '..', 'node_modules', 'node-gyp', 'bin', 'node-gyp.js');
    execSync(`node "${nodeGypPath}" rebuild`, { cwd: canvasModulePath, stdio: 'inherit' });
    log('Canvas rebuild successful.');
  } catch (error) {
    log('ERROR: Canvas rebuild failed.');
    console.error(error);
    log('Please try running "bun run fix:native-modules" manually.');
  }
}

if (fs.existsSync(canvasModulePath)) {
  if (!fs.existsSync(canvasNodeFile)) {
    rebuildCanvas();
  } else {
    log('Canvas module found and appears to be correctly built.');
  }
} else {
  log('Canvas module not found in node_modules. Skipping rebuild.');
}

/**
 * Turn Zero frontload wiring.
 *
 * Until 2026-08-05 a local install left every agent runtime to discover Turn
 * Zero on its own, which mostly meant not discovering it: of eight runtime
 * context surfaces on a typical TNF machine, one carried the mandate. Per the
 * Non-Temporal Proliferation Mandate this belongs in the installer.
 *
 * Default is REPORT-ONLY. This is a public repo, and `pnpm install` must never
 * silently write to a stranger's ~/GEMINI.md or ~/.codex/AGENTS.md. Operators
 * who want it wired automatically set TNF_AUTO_FRONTLOAD=1 (e.g. in
 * .tnf.local.env, the documented home for machine-specific settings).
 *
 * Never fails the install: onboarding wiring is not a build dependency.
 */
function checkAgentFrontload() {
  const script = path.join(__dirname, 'install-agent-frontload.cjs');
  if (!fs.existsSync(script)) return;

  const autoInstall = process.env.TNF_AUTO_FRONTLOAD === '1';
  const args = autoInstall ? '' : ' --verify';
  try {
    const out = execSync(`node "${script}"${args}`, { encoding: 'utf8', stdio: 'pipe' });
    const summary = out.split('\n').filter((l) => /file\(s\) changed|Claude Code /.test(l));
    if (autoInstall) {
      log('Agent frontload wiring installed.');
      summary.forEach((l) => log(l.trim()));
    } else {
      log('Agent frontload audit (report-only):');
      summary.forEach((l) => log(l.trim()));
      log('To wire every runtime: node scripts/install-agent-frontload.cjs');
      log('To do it automatically on install: set TNF_AUTO_FRONTLOAD=1 in .tnf.local.env');
    }
  } catch (error) {
    // Exit 1 from the installer means "surfaces are unwired" — informational
    // here, not a build failure. Surface it rather than swallowing it.
    const out = `${error.stdout || ''}${error.stderr || ''}`;
    const summary = out.split('\n').filter((l) => /file\(s\) changed|Claude Code |FAILED/.test(l));
    log('Agent frontload: some runtimes are not wired for Turn Zero.');
    summary.forEach((l) => log(l.trim()));
    log('Fix with: node scripts/install-agent-frontload.cjs');
  }
}

/**
 * Restore the operator's own setup from their profile.
 *
 * Operator-only capabilities used to require remembering env vars at the moment
 * of use (TNF_OPERATOR_CATALOG, TNF_AUTHORITY_EDIT_CONFIRM). Binding them to
 * ~/.tnf/authority/operator-profile.json means a fresh install on the operator's
 * machine restores their setup with nothing to type. No-ops for everyone else:
 * no profile, or agent context, means nothing is applied.
 */
function applyOperatorProfile() {
  try {
    const script = path.join(__dirname, 'setup', 'apply-operator-profile.cjs');
    if (!fs.existsSync(script)) return;
    const out = execSync(`node ${JSON.stringify(script)} --quiet`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    out.split('\n').filter(Boolean).forEach((l) => log(l.replace(/^\[operator-profile\] /, 'operator-profile: ')));
  } catch (error) {
    // Never fail an install over an optional operator convenience.
    log(`operator-profile: skipped (${error.message.split('\n')[0]})`);
  }
}

checkAgentFrontload();
applyOperatorProfile();
