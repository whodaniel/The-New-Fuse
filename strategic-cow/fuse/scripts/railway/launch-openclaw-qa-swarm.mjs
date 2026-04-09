#!/usr/bin/env node

import { execSync } from 'node:child_process';

function usage() {
  console.log(`Usage:
  node scripts/railway/launch-openclaw-qa-swarm.mjs [options]

Options:
  --services CSV            Railway services (default: openclaw-cloud,openclaw-primary,openclaw-sandbox-cloud)
  --agents-per-service N    Agents per service (default: 3)
  --workspace NAME          OpenClaw workspace slug (default: tnf-qa)
  --session NAME            Session suffix (default: qa-main)
  --timeout-ms N            Per-agent timeout in ms (default: 60000)
  -h, --help                Show help
`);
}

function parseArgs(argv) {
  const cfg = {
    services: ['openclaw-cloud', 'openclaw-primary', 'openclaw-sandbox-cloud'],
    agentsPerService: 3,
    workspace: 'tnf-qa',
    session: 'qa-main',
    timeoutMs: 60000,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '-h' || a === '--help') {
      usage();
      process.exit(0);
    }
    if (a === '--services') {
      cfg.services = String(argv[++i] || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
      continue;
    }
    if (a === '--agents-per-service') {
      cfg.agentsPerService = Number(argv[++i] || '0');
      continue;
    }
    if (a === '--workspace') {
      cfg.workspace = String(argv[++i] || '').trim();
      continue;
    }
    if (a === '--session') {
      cfg.session = String(argv[++i] || '').trim();
      continue;
    }
    if (a === '--timeout-ms') {
      cfg.timeoutMs = Number(argv[++i] || '0');
      continue;
    }
    throw new Error(`Unknown argument: ${a}`);
  }

  if (!cfg.services.length) throw new Error('No services provided');
  if (!Number.isFinite(cfg.agentsPerService) || cfg.agentsPerService < 1) {
    throw new Error('--agents-per-service must be >= 1');
  }
  if (!cfg.workspace) throw new Error('--workspace is required');
  if (!cfg.session) throw new Error('--session is required');
  if (!Number.isFinite(cfg.timeoutMs) || cfg.timeoutMs < 10000) {
    throw new Error('--timeout-ms must be >= 10000');
  }
  return cfg;
}

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function rid() {
  return `${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
}

function slug(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48);
}

function getServiceVars(service) {
  const raw = sh(`railway variable list --service ${service} --json`);
  const vars = JSON.parse(raw);
  const token = String(vars.OPENCLAW_GATEWAY_TOKEN || '').trim();
  const domain = String(vars.RAILWAY_PUBLIC_DOMAIN || '').trim();
  if (!token) throw new Error(`[${service}] OPENCLAW_GATEWAY_TOKEN missing`);
  if (!domain) throw new Error(`[${service}] RAILWAY_PUBLIC_DOMAIN missing`);
  const urls = [];
  for (const [k, v] of Object.entries(vars)) {
    if (typeof v !== 'string') continue;
    if ((k.startsWith('RAILWAY_SERVICE_') && k.endsWith('_URL')) || k === 'RAILWAY_STATIC_URL') {
      if (v.startsWith('http://') || v.startsWith('https://')) urls.push(v);
    }
  }
  return { token, domain, urls: [...new Set(urls)].sort() };
}

function buildMission({ service, sessionKey, urls }) {
  const scoped = urls.slice(0, 25);
  const urlBlock = scoped.length
    ? scoped.map((u, i) => `${i + 1}. ${u}`).join('\n')
    : '1. https://openclaw-cloud-production-934c.up.railway.app';

  return [
    `TNF SWARM QA MISSION`,
    `Service: ${service}`,
    `Session: ${sessionKey}`,
    ``,
    `Objective: Critique and refine TNF SaaS quality continuously. Run deep functional checks across listed TNF/network websites and produce concrete remediation recommendations.`,
    ``,
    `Targets:`,
    urlBlock,
    ``,
    `Execution plan:`,
    `1. For each target, test core navigation, auth flows (where accessible), forms, API-driven UI states, error paths, and responsiveness.`,
    `2. Validate critical UX: broken routes, stale data, loading deadlocks, non-returning chat responses, and settings persistence.`,
    `3. Probe integration points: gateway connectivity, session behavior, model selection/routing labels, and obvious provider mismatches.`,
    `4. Record findings with severity (P0/P1/P2), exact reproduction steps, and likely root cause hypotheses.`,
    `5. Propose prioritized fix list with smallest high-impact changes first.`,
    ``,
    `Output format (strict):`,
    `- FINDINGS: bullet list with [Severity] [URL] [Issue] [Repro] [Likely cause]`,
    `- FIX_QUEUE: ordered numbered list`,
    `- QUICK_WINS_24H: numbered list`,
    `- RISKS: numbered list`,
    ``,
    `Start now.`,
  ].join('\n');
}

async function runAgentMission({ service, token, domain, workspace, sessionSuffix, agentName, mission, timeoutMs }) {
  const ws = new WebSocket(`wss://${domain}`);

  const connectId = rid();
  const createId = rid();
  const patchId = rid();
  const sendId = rid();

  const out = {
    service,
    domain,
    agentName,
    agentId: null,
    sessionKey: null,
    runId: null,
  };

  return await new Promise((resolve, reject) => {
    let done = false;
    const timeout = setTimeout(() => finish(false, new Error(`[${service}] timeout`)), timeoutMs);

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
      ws.send(
        JSON.stringify({
          type: 'req',
          id: connectId,
          method: 'connect',
          params: {
            minProtocol: 3,
            maxProtocol: 3,
            client: {
              id: 'gateway-client',
              version: '1.0',
              platform: 'node',
              mode: 'backend',
              instanceId: `swarm-${Date.now()}`,
            },
            role: 'operator',
            scopes: ['operator.admin', 'operator.approvals', 'operator.pairing'],
            auth: { token },
          },
        })
      );
    };

    ws.onerror = () => finish(false, new Error(`[${service}] websocket error`));
    ws.onclose = (ev) => {
      if (!done) finish(false, new Error(`[${service}] socket closed (${ev.code}) ${ev.reason || ''}`));
    };

    ws.onmessage = (ev) => {
      let msg;
      try {
        msg = JSON.parse(typeof ev.data === 'string' ? ev.data : String(ev.data));
      } catch {
        return;
      }

      if (msg.type === 'res' && msg.id === connectId) {
        if (!msg.ok) return finish(false, new Error(`[${service}] connect failed: ${msg.error?.message || 'unknown'}`));
        ws.send(
          JSON.stringify({
            type: 'req',
            id: createId,
            method: 'agents.create',
            params: { workspace, name: agentName },
          })
        );
        return;
      }

      if (msg.type === 'res' && msg.id === createId) {
        let agentId = String(msg.payload?.agentId || '').trim();
        if (!msg.ok) {
          const m = String(msg.error?.message || 'unknown');
          const exists = /agent\s+"([^"]+)"\s+already exists/i.exec(m);
          if (!exists) return finish(false, new Error(`[${service}] agents.create failed: ${m}`));
          agentId = exists[1];
        }
        if (!agentId) return finish(false, new Error(`[${service}] empty agentId`));
        out.agentId = agentId;
        out.sessionKey = `agent:${agentId}:${sessionSuffix}`;
        ws.send(
          JSON.stringify({
            type: 'req',
            id: patchId,
            method: 'sessions.patch',
            params: {
              key: out.sessionKey,
              label: `${agentName} (${sessionSuffix})`,
            },
          })
        );
        return;
      }

      if (msg.type === 'res' && msg.id === patchId) {
        if (!msg.ok) return finish(false, new Error(`[${service}] sessions.patch failed: ${msg.error?.message || 'unknown'}`));
        ws.send(
          JSON.stringify({
            type: 'req',
            id: sendId,
            method: 'chat.send',
            params: {
              sessionKey: out.sessionKey,
              message: mission,
              deliver: false,
              idempotencyKey: rid(),
            },
          })
        );
        return;
      }

      if (msg.type === 'res' && msg.id === sendId) {
        if (!msg.ok) return finish(false, new Error(`[${service}] chat.send failed: ${msg.error?.message || 'unknown'}`));
        out.runId = msg.payload?.runId || null;
        return finish(true, out);
      }
    };
  });
}

async function main() {
  const cfg = parseArgs(process.argv.slice(2));

  const results = [];
  for (const service of cfg.services) {
    const env = getServiceVars(service);
    for (let i = 1; i <= cfg.agentsPerService; i += 1) {
      const name = `TNF QA ${service} ${i}`;
      const mission = buildMission({
        service,
        sessionKey: `agent:${slug(name)}:${cfg.session}`,
        urls: env.urls,
      });

      const res = await runAgentMission({
        service,
        token: env.token,
        domain: env.domain,
        workspace: cfg.workspace,
        sessionSuffix: cfg.session,
        agentName: name,
        mission,
        timeoutMs: cfg.timeoutMs,
      });
      results.push(res);
      console.log(`[spawned] ${service} :: ${res.agentId} :: ${res.sessionKey} :: runId=${res.runId || 'n/a'}`);
    }
  }

  console.log('\nSWARM_LAUNCH_SUMMARY');
  console.log(JSON.stringify({
    services: cfg.services,
    agentsPerService: cfg.agentsPerService,
    total: results.length,
    launched: results,
  }, null, 2));
}

main().catch((err) => {
  console.error(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
