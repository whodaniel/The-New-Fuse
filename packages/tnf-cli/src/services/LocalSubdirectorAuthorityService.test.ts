import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function tamperSignedEnvelope(token: string): string {
  const envelope = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
  envelope.hmac = `${envelope.hmac[0] === '0' ? '1' : '0'}${envelope.hmac.slice(1)}`;
  return Buffer.from(JSON.stringify(envelope)).toString('base64');
}

// Authority state is machine-local under ~/.tnf/. Redirect it so this test
// never reads or writes the operator's live configuration.
const authorityHome = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-local-subdirector-authority-'));
process.env.TNF_AUTHORITY_HOME = authorityHome;

const { LocalSubdirectorAuthorityService, DEFAULT_LOCAL_SUBDIRECTOR_CONFIG } =
  await import('./LocalSubdirectorAuthorityService.js');

try {
  const authority = new LocalSubdirectorAuthorityService(authorityHome);

  // First run ships autonomous. This is deliberate: the disabled-by-default
  // fallback is what silently denied every tool call in `tnf agents run`,
  // because no config file had ever been written on the machine.
  assert(authority.isFirstRun() === true, 'no config file yet means first run');
  assert(
    authority.getConfig().autonomyEnabled === true,
    'shipped default must enable autonomy on first run'
  );
  assert(authority.getConfig().agentId === 'tnf-cli-agent', 'authority binds to tnf-cli-agent');
  assert(authority.isAuthorized('write_file') === true, 'default "all" grant authorizes any tool');
  assert(
    DEFAULT_LOCAL_SUBDIRECTOR_CONFIG.capabilities.includes('all'),
    'exported default must be the same shape callers write'
  );

  // An existing config always wins over the shipped default, so a narrowed
  // posture is never silently re-widened.
  authority.updateConfig({ autonomyEnabled: false, capabilities: [] });
  assert(authority.isFirstRun() === false, 'writing a config ends first run');
  assert(authority.isAuthorized('read_file') === false, 'disabled autonomy must deny capabilities');

  authority.updateConfig({ autonomyEnabled: true, capabilities: ['read_file'] });
  assert(authority.isAuthorized('read_file') === true, 'explicit capability must be authorized');
  assert(authority.isAuthorized('write_file') === false, 'ungranted capability must be denied');

  const delegation = authority.signDelegation(['bash']);
  assert(authority.verifyDelegation(delegation, 'bash') === true, 'signed delegation must verify');
  assert(
    authority.verifyDelegation(delegation, 'write_file') === false,
    'delegation must remain capability-scoped'
  );
  assert(
    authority.verifyDelegation(tamperSignedEnvelope(delegation), 'bash') === false,
    'tampered delegation must fail'
  );

  const identity = authority.signLocalSubdirectorIdentity();
  assert(
    authority.verifyLocalSubdirectorIdentity(identity) === true,
    'signed Local Subdirector identity must verify'
  );
  assert(
    authority.verifyLocalSubdirectorIdentity(tamperSignedEnvelope(identity)) === false,
    'tampered identity must fail'
  );

  // The signing key is machine-local, never inside the repo. `.tnf/` is a
  // tracked directory here, so the previous repo-relative location would have
  // written a secret into a checkout that gets pushed.
  const runtimeKey = path.join(authorityHome, '.tnf', 'runtime-key');
  assert(fs.existsSync(runtimeKey), 'authority signing must materialize a runtime key');
  assert(
    (fs.statSync(runtimeKey).mode & 0o777) === 0o600,
    'runtime key must be owner-readable and owner-writable only'
  );
  assert(
    authority.configLocation().startsWith(authorityHome),
    'config must resolve under the authority home, not the caller path'
  );

  // A config that exists but cannot be parsed must fail closed. Falling back to
  // the shipped "all" default here would let a truncated write widen authority.
  fs.writeFileSync(authority.configLocation(), '{ not json', 'utf8');
  assert(
    authority.getConfig().autonomyEnabled === false,
    'unreadable config must fail closed, not fall back to the enabled default'
  );
  assert(
    authority.isAuthorized('read_file') === false,
    'unreadable config must deny every capability'
  );

  authority.updateConfig({ autonomyEnabled: true, capabilities: ['all'] });
  assert(
    authority.isAuthorized('write_file') === true,
    'all capability must authorize delegated actions'
  );

  console.log('LocalSubdirectorAuthorityService tests passed');
} finally {
  fs.rmSync(authorityHome, { recursive: true, force: true });
}
