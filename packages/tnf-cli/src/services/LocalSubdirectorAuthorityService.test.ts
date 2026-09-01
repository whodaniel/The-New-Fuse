import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { LocalSubdirectorAuthorityService } from './LocalSubdirectorAuthorityService.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function tamperSignedEnvelope(token: string): string {
  const envelope = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
  envelope.hmac = `${envelope.hmac[0] === '0' ? '1' : '0'}${envelope.hmac.slice(1)}`;
  return Buffer.from(JSON.stringify(envelope)).toString('base64');
}

const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-local-subdirector-authority-'));

try {
  fs.mkdirSync(path.join(repoRoot, 'packages', 'tnf-cli'), { recursive: true });
  const authority = new LocalSubdirectorAuthorityService(repoRoot);

  assert(authority.getConfig().autonomyEnabled === false, 'autonomy must fail closed by default');
  assert(authority.isAuthorized('read_file') === false, 'disabled autonomy must deny capabilities');

  authority.updateConfig({ autonomyEnabled: true, capabilities: ['read_file'] });
  assert(authority.isAuthorized('read_file') === true, 'explicit capability must be authorized');
  assert(authority.isAuthorized('write_file') === false, 'ungranted capability must be denied');

  const delegation = authority.signDelegation(['bash']);
  assert(authority.verifyDelegation(delegation, 'bash') === true, 'signed delegation must verify');
  assert(authority.verifyDelegation(delegation, 'write_file') === false, 'delegation must remain capability-scoped');
  assert(authority.verifyDelegation(tamperSignedEnvelope(delegation), 'bash') === false, 'tampered delegation must fail');

  const identity = authority.signLocalSubdirectorIdentity();
  assert(authority.verifyLocalSubdirectorIdentity(identity) === true, 'signed Local Subdirector identity must verify');
  assert(authority.verifyLocalSubdirectorIdentity(tamperSignedEnvelope(identity)) === false, 'tampered identity must fail');

  const runtimeKey = path.join(repoRoot, '.tnf', 'runtime-key');
  assert(fs.existsSync(runtimeKey), 'authority signing must materialize a runtime key');
  assert((fs.statSync(runtimeKey).mode & 0o777) === 0o600, 'runtime key must be owner-readable and owner-writable only');

  authority.updateConfig({ capabilities: ['all'] });
  assert(authority.isAuthorized('write_file') === true, 'all capability must authorize delegated actions');

  console.log('LocalSubdirectorAuthorityService tests passed');
} finally {
  fs.rmSync(repoRoot, { recursive: true, force: true });
}
