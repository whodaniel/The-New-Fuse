/**
 * Contract guard for the user-configurable channel registry.
 *
 * Slack and WhatsApp read eight env vars hardcoded across four files, none of
 * them in .env.example, so a local open-source install had no discoverable way
 * to configure channels. Lifting that into ~/.config/tnf/channels.json only
 * helps if the loader is non-destructive and never silently drops a channel.
 *
 * Secrets stay in the environment; the config declares only which variable
 * holds each one. Test 10 asserts a literal secret is reported rather than
 * quietly consumed.
 *
 * Run: pnpm --filter @the-new-fuse/tnf-cli test
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

let pass = 0;
let fail = 0;

function check(name: string, cond: boolean, detail = ''): void {
  if (cond) {
    console.log(`  PASS  ${name}`);
    pass += 1;
  } else {
    console.log(`  FAIL  ${name} ${detail}`);
    fail += 1;
  }
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-channel-config-'));

async function loadWith(contents: string | null): Promise<any> {
  const { loadChannelConfig } = await import('./channel-config.js');
  const p = path.join(tmpRoot, `channels-${Math.random().toString(36).slice(2)}.json`);
  if (contents !== null) fs.writeFileSync(p, contents, 'utf8');
  process.env.TNF_CHANNEL_CONFIG_PATH = p;
  return loadChannelConfig();
}

async function main(): Promise<void> {
  const { DEFAULT_CHANNELS, channelStatus } = await import('./channel-config.js');

  // --- defaults -----------------------------------------------------------
  const none = await loadWith(null);
  check('missing file yields built-in channels', none.channels.length === DEFAULT_CHANNELS.length);
  check('missing file reports source=defaults', none.source === 'defaults');
  check(
    'missing file raises no warnings',
    none.warnings.length === 0,
    JSON.stringify(none.warnings)
  );

  // --- malformed ----------------------------------------------------------
  const broken = await loadWith('{ not json');
  check(
    'malformed file still yields a usable registry',
    broken.channels.length === DEFAULT_CHANNELS.length
  );
  check(
    'malformed file degrades loudly',
    broken.warnings.some((w: string) => w.includes('not valid JSON'))
  );

  // --- partial override preserves the rest --------------------------------
  const partial = await loadWith(JSON.stringify({ channels: [{ id: 'slack', enabled: false }] }));
  check(
    'overriding one channel preserves the other',
    partial.channels.length === DEFAULT_CHANNELS.length
  );
  check('override applied', partial.channels.find((c: any) => c.id === 'slack')?.enabled === false);
  check(
    'overridden channel keeps built-in credentials it did not set',
    partial.channels.find((c: any) => c.id === 'slack')?.credentials?.length === 3
  );

  // --- settings -----------------------------------------------------------
  const tuned = await loadWith(
    JSON.stringify({ channels: [{ id: 'whatsapp', settings: { webhookPort: 9999 } }] })
  );
  check(
    'setting override applied',
    tuned.channels.find((c: any) => c.id === 'whatsapp')?.settings.webhookPort === 9999
  );

  // --- secrets must not live in the file ----------------------------------
  const leaky = await loadWith(
    JSON.stringify({
      channels: [
        {
          id: 'slack',
          credentials: [{ key: 'botToken', env: 'TNF_SLACK_BOT_TOKEN', value: 'xoxb-REAL-SECRET' }],
        },
      ],
    })
  );
  check(
    'literal secret in config is reported, not consumed',
    leaky.warnings.some((w: string) => w.includes('literal secret')),
    JSON.stringify(leaky.warnings)
  );
  check(
    'only the env var name is retained',
    JSON.stringify(leaky.channels).includes('TNF_SLACK_BOT_TOKEN') &&
      !JSON.stringify(leaky.channels).includes('xoxb-REAL-SECRET')
  );

  // --- readiness is three-valued, not pass/fail ---------------------------
  for (const v of ['TNF_SLACK_BOT_TOKEN', 'TNF_SLACK_SIGNING_SECRET', 'TNF_SLACK_APP_TOKEN'])
    delete process.env[v];
  const cfg = await loadWith(JSON.stringify({ channels: [{ id: 'whatsapp', enabled: false }] }));
  const status = channelStatus(cfg);
  check(
    'unconfigured channel reports missing-credentials, not failure',
    status.find((s: any) => s.id === 'slack')?.readiness === 'missing-credentials'
  );
  check(
    'missing list names the env vars (never values)',
    (status.find((s: any) => s.id === 'slack')?.missing || []).includes('TNF_SLACK_BOT_TOKEN')
  );
  check(
    'disabled channel reports disabled',
    status.find((s: any) => s.id === 'whatsapp')?.readiness === 'disabled'
  );

  process.env.TNF_SLACK_BOT_TOKEN = 'x';
  process.env.TNF_SLACK_SIGNING_SECRET = 'x';
  process.env.TNF_SLACK_APP_TOKEN = 'x';
  const ready = channelStatus(await loadWith(null));
  check(
    'fully-credentialed channel reports ready',
    ready.find((s: any) => s.id === 'slack')?.readiness === 'ready'
  );

  fs.rmSync(tmpRoot, { recursive: true, force: true });
  console.log(`\n  ${pass} passed, ${fail} failed\n`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
