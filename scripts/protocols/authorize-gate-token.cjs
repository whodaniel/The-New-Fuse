#!/usr/bin/env node
'use strict';

/**
 * Interactive authorization for TNF_GATE_POLICY_TOKEN.
 *
 * Run when the gate token is missing (a fresh box, or after ~/.tnf was wiped).
 * The operator authorizes once; the token is then verified against the live
 * endpoint and persisted to ~/.tnf/credentials.env at 0600, so every consumer
 * that uses `resolveGateToken` picks it up without further setup.
 *
 * The token is a fleet-wide shared secret, so generating a new one is not the
 * default path: it invalidates the credential on the API, the relay, and every
 * other machine until each is redeployed. Adoption of the existing token is the
 * default; rotation requires typing ROTATE.
 *
 * Usage:
 *   node scripts/protocols/authorize-gate-token.cjs [--status] [--endpoint <url>]
 *
 *   --status    report resolution + verification state, change nothing
 */

const readline = require('node:readline');

const {
  CREDENTIAL_PATHS,
  DEFAULT_ENDPOINT,
  generateGateToken,
  persistGateToken,
  resolveGateToken,
  verifyGateToken,
} = require('../lib/tnf-gate-token.cjs');

function parseArgs(argv) {
  const opts = { status: false, endpoint: DEFAULT_ENDPOINT };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--status') opts.status = true;
    else if (arg === '--endpoint') opts.endpoint = argv[++i];
    else if (arg === '--help' || arg === '-h') opts.help = true;
  }
  return opts;
}

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())));
}

/** Read without echoing, so a pasted secret never lands in the scrollback. */
function askSecret(rl, question) {
  return new Promise((resolve) => {
    const input = rl.input;
    const wasRaw = input.isRaw;
    let buffer = '';
    const onData = (chunk) => {
      const str = chunk.toString('utf8');
      for (const ch of str) {
        if (ch === '\r' || ch === '\n') {
          input.removeListener('data', onData);
          if (input.isTTY && wasRaw === false) input.setRawMode(false);
          input.pause();
          process.stdout.write('\n');
          resolve(buffer.trim());
          return;
        }
        if (ch === '\u0003') {
          // Ctrl-C: leave the terminal usable, write nothing.
          process.stdout.write('\n');
          process.exit(130);
        }
        if (ch === '\u007f' || ch === '\b') {
          buffer = buffer.slice(0, -1);
          continue;
        }
        buffer += ch;
      }
    };
    process.stdout.write(question);
    if (input.isTTY) input.setRawMode(true);
    input.resume();
    input.on('data', onData);
  });
}

function describe(state, detail) {
  if (state === 'valid') return `verified — ${detail}`;
  if (state === 'rejected') return `REJECTED — ${detail}`;
  return `unverified — ${detail}`;
}

async function reportStatus(endpoint) {
  const { token, source } = resolveGateToken();
  if (!token) {
    console.log('[gate-token] absent — not in env, not in credential files:');
    for (const p of CREDENTIAL_PATHS) console.log(`[gate-token]   ${p}`);
    console.log('[gate-token] remediate: node scripts/protocols/authorize-gate-token.cjs');
    return 1;
  }
  const { state, detail } = await verifyGateToken(token, { endpoint });
  console.log(`[gate-token] resolved from ${source} (length ${token.length})`);
  console.log(`[gate-token] ${describe(state, detail)}`);
  return state === 'valid' ? 0 : 1;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(
      [
        'Usage: node scripts/protocols/authorize-gate-token.cjs [--status] [--endpoint <url>]',
        '',
        '  --status            report resolution + verification state, change nothing',
        '  --endpoint <url>    gate endpoint (default: TNF_GATE_POLICY_ENDPOINT or the shared worker)',
      ].join('\n')
    );
    return 0;
  }

  if (opts.status) return reportStatus(opts.endpoint);

  const existing = resolveGateToken();
  if (existing.token) {
    const { state, detail } = await verifyGateToken(existing.token, { endpoint: opts.endpoint });
    console.log(`[gate-token] already provisioned from ${existing.source}`);
    console.log(`[gate-token] ${describe(state, detail)}`);
    if (state === 'valid') {
      console.log('[gate-token] nothing to do');
      return 0;
    }
    console.log('[gate-token] continuing so the bad credential can be replaced');
  }

  if (!process.stdin.isTTY) {
    console.error('[gate-token] authorization requires an interactive terminal');
    console.error('[gate-token] run it yourself: node scripts/protocols/authorize-gate-token.cjs');
    return 1;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    console.log('');
    console.log(`  TNF_GATE_POLICY_TOKEN not usable.`);
    console.log(`  Endpoint: ${opts.endpoint}`);
    console.log('');
    console.log('  [1] Paste existing fleet token   (default)');
    console.log('  [2] Generate a NEW token         (ROTATES the fleet)');
    console.log('');
    const choice = (await ask(rl, '> ')) || '1';

    let token = '';
    if (choice === '1') {
      token = await askSecret(rl, '  Token: ');
      if (!token) {
        console.error('[gate-token] no token entered — aborted, nothing written');
        return 1;
      }
      process.stdout.write('  Verifying against live endpoint... ');
      const { state, detail } = await verifyGateToken(token, { endpoint: opts.endpoint });
      console.log(detail);
      if (state !== 'valid') {
        console.error(`[gate-token] ${describe(state, detail)}`);
        console.error('[gate-token] refusing to persist a token the endpoint did not accept');
        return 1;
      }
    } else if (choice === '2') {
      console.log('');
      console.log('  ! Rotating invalidates the token on api, relay-server,');
      console.log('  ! and every other machine until redeployed.');
      const confirm = await ask(rl, '  Type ROTATE to confirm > ');
      if (confirm !== 'ROTATE') {
        console.error('[gate-token] not confirmed — aborted, nothing written');
        return 1;
      }
      token = generateGateToken();
      console.log('[gate-token] generated a new token (not yet accepted by the endpoint)');
    } else {
      console.error(`[gate-token] unrecognized choice '${choice}' — aborted, nothing written`);
      return 1;
    }

    const written = persistGateToken(token);
    console.log(`  ✓ Persisted to ${written} (0600)`);

    if (choice === '2') {
      console.log('');
      console.log('  Rotation is only half-applied: the fleet still expects the old secret.');
      console.log('  Push it, then re-verify:');
      console.log('    TNF_GATE_POLICY_TOKEN=<new> scripts/cloud-run/set-federation-gate-mode.sh warn');
      console.log('    node scripts/protocols/authorize-gate-token.cjs --status');
      return 1; // not healthy until the fleet actually accepts it
    }
    return 0;
  } finally {
    rl.close();
  }
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(`[gate-token] fatal: ${err.message}`);
    process.exit(1);
  });
