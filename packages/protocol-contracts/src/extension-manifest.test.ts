import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  assertLoadableExtension,
  readTnfExtensionManifest,
  validateTnfExtensionManifest,
  type TnfExtensionManifestV1,
} from './extension-manifest.js';

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

function manifest(
  kind: TnfExtensionManifestV1['kind'] = 'loadable-extension'
): TnfExtensionManifestV1 {
  return {
    apiVersion: 'tnf.extension/v1',
    kind,
    id: 'audit-tool',
    name: 'Audit Tool',
    version: '1.0.0',
    description: 'Audits a TNF workspace.',
    compatibility: { tnf: '^1.0.0', node: '>=20' },
    capabilities: ['audit.read'],
    entrypoints:
      kind === 'external-service' ? { service: 'https://example.com/mcp' } : { main: 'index.mjs' },
    permissions: ['filesystem_read'],
  };
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-extension-manifest-'));
try {
  fs.writeFileSync(path.join(root, 'index.mjs'), 'export const activate = () => undefined;\n');
  fs.writeFileSync(path.join(root, 'tnf-extension.json'), JSON.stringify(manifest(), null, 2));

  const parsed = readTnfExtensionManifest(root, { tnfVersion: '1.2.0', nodeVersion: '22.0.0' });
  check('reads a compatible loadable extension', parsed.id === 'audit-tool');

  const traversal = manifest();
  traversal.entrypoints.main = '../escape.mjs';
  check(
    'rejects entrypoint traversal',
    validateTnfExtensionManifest(traversal).errors.some((error) =>
      error.includes('safe relative path')
    )
  );

  const outside = path.join(root, '..', `outside-${process.pid}.mjs`);
  fs.writeFileSync(outside, 'export const activate = () => undefined;\n');
  fs.symlinkSync(outside, path.join(root, 'linked.mjs'));
  const linked = manifest();
  linked.entrypoints.main = 'linked.mjs';
  check(
    'rejects an entrypoint symlink outside the extension',
    !validateTnfExtensionManifest(linked, { extensionPath: root }).valid
  );
  fs.rmSync(outside, { force: true });

  check(
    'rejects incompatible TNF versions',
    !validateTnfExtensionManifest(manifest(), { tnfVersion: '2.0.0' }).valid
  );

  const service = manifest('external-service');
  check('accepts an external-service classification', validateTnfExtensionManifest(service).valid);
  service.entrypoints.service = 'file:///tmp/socket';
  check(
    'rejects unsupported external-service transports',
    !validateTnfExtensionManifest(service).valid
  );
  service.entrypoints.service = 'https://example.com/mcp';
  let rejectedAsPlugin = false;
  try {
    assertLoadableExtension(service);
  } catch (error) {
    rejectedAsPlugin =
      error instanceof Error && error.message.includes('satellite deployment lifecycle');
  }
  check('external services cannot masquerade as plugins', rejectedAsPlugin);
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}

console.log(`\nextension-manifest: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
