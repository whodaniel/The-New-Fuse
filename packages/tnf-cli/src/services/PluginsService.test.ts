import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { PluginsService } from './PluginsService.js';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail = ''): void {
  if (condition) {
    console.log(`  PASS  ${name}`);
    passed += 1;
  } else {
    console.error(`  FAIL  ${name} ${detail}`);
    failed += 1;
  }
}

function writeExtension(
  root: string,
  id: string,
  options: {
    kind?: string;
    version?: string;
    failActivation?: boolean;
    exitActivation?: boolean;
  } = {}
): string {
  const extensionPath = path.join(root, id);
  fs.mkdirSync(extensionPath, { recursive: true });
  const kind = options.kind || 'loadable-extension';
  const entrypoints =
    kind === 'external-service' ? { service: 'https://example.com/mcp' } : { main: 'index.mjs' };
  fs.writeFileSync(
    path.join(extensionPath, 'tnf-extension.json'),
    JSON.stringify(
      {
        apiVersion: 'tnf.extension/v1',
        kind,
        id,
        name: id,
        version: options.version || '1.0.0',
        description: `${id} extension`,
        compatibility: { tnf: '^1.0.0', node: '>=20' },
        capabilities: [`${id}.run`],
        entrypoints,
        permissions: [],
        lifecycle: { activation: 'manual', timeoutMs: 1000 },
      },
      null,
      2
    )
  );
  if (kind === 'loadable-extension') {
    fs.writeFileSync(
      path.join(extensionPath, 'index.mjs'),
      options.exitActivation
        ? 'export function activate() { process.exit(7); }\n'
        : options.failActivation
          ? 'export function activate() { throw new Error("activation failed"); }\n'
          : `import fs from 'node:fs'; import path from 'node:path';
export function activate(context) { fs.appendFileSync(path.join(context.extensionPath, 'events.log'), 'activate\\n'); }
export function deactivate(context) { fs.appendFileSync(path.join(context.extensionPath, 'events.log'), 'deactivate\\n'); }
`
    );
  }
  return extensionPath;
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-plugins-test-'));
const home = path.join(root, 'home');
const sources = path.join(root, 'sources');
fs.mkdirSync(home, { recursive: true });
fs.mkdirSync(sources, { recursive: true });

try {
  const service = new PluginsService({ homeDir: home, projectRoot: root, runtimeVersion: '1.0.0' });
  const healthySource = writeExtension(sources, 'healthy');
  const installed = await service.install(healthySource);
  check('installs a real local source as inactive', installed.status === 'installed');

  const active = await service.enable('healthy');
  check('runs the activation lifecycle', active.status === 'active');
  const installedDir = path.join(home, '.tnf', 'plugins', 'healthy');
  check(
    'activation evidence is written by the real module',
    fs.readFileSync(path.join(installedDir, 'events.log'), 'utf8') === 'activate\n'
  );

  await service.disable('healthy');
  check(
    'runs the deactivation lifecycle',
    fs.readFileSync(path.join(installedDir, 'events.log'), 'utf8').endsWith('deactivate\n')
  );

  const externalSource = writeExtension(sources, 'external', { kind: 'external-service' });
  let externalRejected = false;
  try {
    await service.install(externalSource);
  } catch (error) {
    externalRejected =
      error instanceof Error && error.message.includes('satellite deployment lifecycle');
  }
  check('rejects standalone satellite kinds from plugin install', externalRejected);

  const failingSource = writeExtension(sources, 'failing', { failActivation: true });
  await service.install(failingSource);
  let activationRejected = false;
  try {
    await service.enable('failing');
  } catch {
    activationRejected = true;
  }
  check('contains an activation failure', activationRejected);
  check(
    'records the failing extension state',
    (await service.getStatus('failing'))?.status === 'error'
  );
  check(
    'does not corrupt another extension',
    (await service.getStatus('healthy'))?.status === 'disabled'
  );

  const exitingSource = writeExtension(sources, 'exiting', { exitActivation: true });
  await service.install(exitingSource);
  let exitContained = false;
  try {
    await service.enable('exiting');
  } catch (error) {
    exitContained = error instanceof Error && error.message.includes('worker exited with code 7');
  }
  check('contains an extension process exit in its worker', exitContained);
  check(
    'the CLI process survives extension process exit',
    (await service.getStatus('healthy'))?.status === 'disabled'
  );

  writeExtension(sources, 'healthy', { version: '1.1.0' });
  const [updated] = await service.update('healthy');
  check('updates from the recorded real source', updated.version === '1.1.0');

  let aliasRejected = false;
  try {
    await service.install('registry-placeholder-name');
  } catch (error) {
    aliasRejected =
      error instanceof Error && error.message.includes('Unsupported extension source');
  }
  check('rejects unsupported registry aliases instead of creating placeholders', aliasRejected);

  let credentialUrlRejected = false;
  try {
    await service.install('https://token@example.com/owner/extension.git');
  } catch (error) {
    credentialUrlRejected =
      error instanceof Error && error.message.includes('Credential-bearing Git URLs');
  }
  check('rejects credential-bearing Git URLs before cloning or persistence', credentialUrlRejected);
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}

console.log(`\nplugins-service: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
