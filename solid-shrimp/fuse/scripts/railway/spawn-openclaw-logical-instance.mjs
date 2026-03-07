#!/usr/bin/env node

import { execSync } from 'node:child_process';

function usage() {
  console.log(`Usage:
  node scripts/railway/spawn-openclaw-logical-instance.mjs [options]

Options:
  --service NAME        Railway service (default: openclaw-sandbox-cloud)
  --workspace NAME      OpenClaw workspace slug (default: tnf-lab)
  --name NAME           Agent display name (default: TNF Logical Agent <ts>)
  --session NAME        Session suffix (default: main)
  --probe-message TEXT  Chat probe message text
  --skip-probe          Skip chat.send probe
  --probe-require-final Require chat final event for probe success
  --timeout-ms N        Probe timeout in ms (default: 90000)
  -h, --help            Show help
`);
}

function parseArgs(argv) {
  const cfg = {
    service: 'openclaw-sandbox-cloud',
    workspace: 'tnf-lab',
    name: `TNF Logical Agent ${Date.now()}`,
    session: 'main',
    probeMessage: `TNF logical instance probe ${new Date().toISOString()}`,
    skipProbe: false,
    probeRequireFinal: false,
    timeoutMs: 90000,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '-h' || a === '--help') {
      usage();
      process.exit(0);
    }
    if (a === '--skip-probe') {
      cfg.skipProbe = true;
      continue;
    }
    if (a === '--probe-require-final') {
      cfg.probeRequireFinal = true;
      continue;
    }
    if (a === '--service') {
      cfg.service = argv[++i] ?? '';
      continue;
    }
    if (a === '--workspace') {
      cfg.workspace = argv[++i] ?? '';
      continue;
    }
    if (a === '--name') {
      cfg.name = argv[++i] ?? '';
      continue;
    }
    if (a === '--session') {
      cfg.session = argv[++i] ?? '';
      continue;
    }
    if (a === '--probe-message') {
      cfg.probeMessage = argv[++i] ?? '';
      continue;
    }
    if (a === '--timeout-ms') {
      cfg.timeoutMs = Number(argv[++i] ?? '0');
      continue;
    }
    throw new Error(`Unknown argument: ${a}`);
  }

  if (!cfg.service.trim()) throw new Error('--service is required');
  if (!cfg.workspace.trim()) throw new Error('--workspace is required');
  if (!cfg.name.trim()) throw new Error('--name is required');
  if (!cfg.session.trim()) throw new Error('--session is required');
  if (!Number.isFinite(cfg.timeoutMs) || cfg.timeoutMs < 5000) {
    throw new Error('--timeout-ms must be a number >= 5000');
  }

  return cfg;
}

function run(cmd) {
  return execSync(cmd, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
}

function getRailwayVars(service) {
  const raw = run(`railway variable list --service ${service} --json`);
  const vars = JSON.parse(raw);
  const token = String(vars.OPENCLAW_GATEWAY_TOKEN || '').trim();
  const domain = String(vars.RAILWAY_PUBLIC_DOMAIN || '').trim();
  if (!token) throw new Error(`OPENCLAW_GATEWAY_TOKEN missing on service: ${service}`);
  if (!domain) throw new Error(`RAILWAY_PUBLIC_DOMAIN missing on service: ${service}`);
  return { token, domain };
}

function rid() {
  return `${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
}

async function gatewayRequestSequence({ token, domain, cfg }) {
  const ws = new WebSocket(`wss://${domain}`);

  const connectId = rid();
  const createId = rid();
  const patchId = rid();
  const sendId = rid();
  const sessionKey = { value: '' };

  return await new Promise((resolve, reject) => {
    let done = false;
    const timeout = setTimeout(() => {
      finish(false, new Error(`Timed out after ${cfg.timeoutMs}ms`));
    }, cfg.timeoutMs);

    function finish(ok, value) {
      if (done) return;
      done = true;
      clearTimeout(timeout);
      try {
        ws.close();
      } catch {
        // noop
      }
      if (ok) resolve(value);
      else reject(value);
    }

    ws.onopen = () => {
      const connectPayload = {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: 'gateway-client',
          version: '1.0',
          platform: 'node',
          mode: 'backend',
          instanceId: `spawn-${Date.now()}`,
        },
        role: 'operator',
        scopes: ['operator.admin', 'operator.approvals', 'operator.pairing'],
        auth: { token },
      };
      ws.send(JSON.stringify({ type: 'req', id: connectId, method: 'connect', params: connectPayload }));
    };

    ws.onerror = () => finish(false, new Error('WebSocket transport error'));
    ws.onclose = (ev) => {
      if (!done) finish(false, new Error(`WebSocket closed (${ev.code}) ${ev.reason || ''}`));
    };

    ws.onmessage = (ev) => {
      let msg;
      try {
        msg = JSON.parse(typeof ev.data === 'string' ? ev.data : String(ev.data));
      } catch {
        return;
      }

      if (msg.type === 'res' && msg.id === connectId) {
        if (!msg.ok) {
          finish(false, new Error(`connect failed: ${msg.error?.message || 'unknown'}`));
          return;
        }
        ws.send(
          JSON.stringify({
            type: 'req',
            id: createId,
            method: 'agents.create',
            params: {
              workspace: cfg.workspace,
              name: cfg.name,
            },
          })
        );
        return;
      }

      if (msg.type === 'res' && msg.id === createId) {
        let agentId = String(msg.payload?.agentId || '').trim();
        if (!msg.ok) {
          const message = String(msg.error?.message || 'unknown');
          const existing = /agent\s+"([^"]+)"\s+already exists/i.exec(message);
          if (!existing) {
            finish(false, new Error(`agents.create failed: ${message}`));
            return;
          }
          agentId = existing[1];
        }
        if (!agentId) {
          finish(false, new Error('agents.create returned empty agentId'));
          return;
        }
        sessionKey.value = `agent:${agentId}:${cfg.session}`;
        ws.send(
          JSON.stringify({
            type: 'req',
            id: patchId,
            method: 'sessions.patch',
            params: {
              key: sessionKey.value,
              label: `${cfg.name} (${cfg.session})`,
            },
          })
        );
        return;
      }

      if (msg.type === 'res' && msg.id === patchId) {
        if (!msg.ok) {
          finish(false, new Error(`sessions.patch failed: ${msg.error?.message || 'unknown'}`));
          return;
        }

        if (cfg.skipProbe) {
          finish(true, {
            probe: 'skipped',
            service: cfg.service,
            domain,
            workspace: cfg.workspace,
            agentId: sessionKey.value.split(':')[1],
            sessionKey: sessionKey.value,
            sessionEntry: msg.payload?.entry || null,
          });
          return;
        }

        ws.send(
          JSON.stringify({
            type: 'req',
            id: sendId,
            method: 'chat.send',
            params: {
              sessionKey: sessionKey.value,
              message: cfg.probeMessage,
              deliver: false,
              idempotencyKey: rid(),
            },
          })
        );
        return;
      }

      if (msg.type === 'res' && msg.id === sendId) {
        if (!msg.ok) {
          finish(false, new Error(`chat.send failed: ${msg.error?.message || 'unknown'}`));
          return;
        }
        if (!cfg.probeRequireFinal) {
          finish(true, {
            probe: 'accepted',
            service: cfg.service,
            domain,
            workspace: cfg.workspace,
            agentId: sessionKey.value.split(':')[1],
            sessionKey: sessionKey.value,
            runId: msg.payload?.runId || null,
          });
        }
        return;
      }

      if (msg.type === 'event' && msg.event === 'chat') {
        const payload = msg.payload || {};
        if (payload.sessionKey !== sessionKey.value) return;
        if (payload.state === 'final') {
          finish(true, {
            probe: 'ok',
            service: cfg.service,
            domain,
            workspace: cfg.workspace,
            agentId: sessionKey.value.split(':')[1],
            sessionKey: sessionKey.value,
            runId: payload.runId || null,
          });
          return;
        }
        if (payload.state === 'error') {
          finish(false, new Error(`chat event error: ${payload.errorMessage || 'unknown'}`));
          return;
        }
      }
    };
  });
}

async function main() {
  const cfg = parseArgs(process.argv.slice(2));
  const { token, domain } = getRailwayVars(cfg.service);

  const result = await gatewayRequestSequence({ token, domain, cfg });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
