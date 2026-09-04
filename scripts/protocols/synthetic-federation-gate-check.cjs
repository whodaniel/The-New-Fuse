#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');

const DEFAULT_ENDPOINT =
  process.env.TNF_GATE_POLICY_ENDPOINT || 'https://tnf-sharedstate.bizsynth.workers.dev';

function resolveDefaultToken() {
  if (process.env.TNF_GATE_POLICY_TOKEN && process.env.TNF_GATE_POLICY_TOKEN.trim()) {
    return process.env.TNF_GATE_POLICY_TOKEN.trim();
  }

  const candidatePaths = [
    path.join(os.homedir(), '.tnf', 'credentials.env'),
    path.join(os.homedir(), '.tnf.local.env'),
  ];

  for (const envPath of candidatePaths) {
    if (!fs.existsSync(envPath)) continue;
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const normalized = line.startsWith('export ') ? line.slice('export '.length).trim() : line;
        const match = normalized.match(/^TNF_GATE_POLICY_TOKEN=(.*)$/);
        if (match) {
          let val = match[1].trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (val) return val;
        }
      }
    } catch {}
  }
  return '';
}

function printUsage() {
  console.log(
    [
      'Usage:',
      '  node scripts/protocols/synthetic-federation-gate-check.cjs [options]',
      '',
      'Options:',
      '  --endpoint <url>      Gate API endpoint base URL',
      '  --token <token>       x-auth-token (or set TNF_GATE_POLICY_TOKEN)',
      '  --tenant <id>         Tenant id (default: tnf-local)',
      '  --json                Print JSON summary',
      '  --help, -h            Show help',
      '',
      'Env:',
      '  TNF_GATE_POLICY_TOKEN    Required auth token for remote endpoint',
      '  TNF_GATE_POLICY_ENDPOINT Remote policy endpoint URL',
    ].join('\n')
  );
}

function parseArgs(argv) {
  const args = {
    endpoint: DEFAULT_ENDPOINT,
    token: resolveDefaultToken(),
    tenant: 'tnf-local',
    json: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--endpoint') {
      args.endpoint = argv[++i] || args.endpoint;
    } else if (token === '--token') {
      args.token = argv[++i] || args.token;
    } else if (token === '--tenant') {
      args.tenant = argv[++i] || args.tenant;
    } else if (token === '--json') {
      args.json = true;
    } else if (token === '--help' || token === '-h') {
      printUsage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  if (!args.endpoint) throw new Error('Missing endpoint URL');
  return args;
}

function buildGateDecisions() {
  const now = new Date().toISOString();
  return [
    { gate: 'TENANT_SCOPE_GATE', decision: 'allow', at: now },
    { gate: 'TRACE_CONTINUITY_GATE', decision: 'allow', at: now },
    { gate: 'TERMINAL_BINDING_GATE', decision: 'allow', at: now },
    { gate: 'HIGH_RISK_RUNTIME_GATE', decision: 'allow', at: now },
    { gate: 'CHANNEL_MEMBERSHIP_GATE', decision: 'allow', at: now },
  ];
}

function buildValidRequest(tenant) {
  return {
    scope: {
      tenantId: tenant,
    },
    cumulativeId: {
      spec: 'tnf/mcid/0.1',
      id: 'mcid-synthetic-check',
      scope: {
        tenant_id: tenant,
        session_key: 'synthetic-check',
        workflow_id: null,
        channel_id: 'federation-gate-check',
      },
      lineage: {
        correlation_id: 'corr-synthetic-check',
        causation_id: null,
        handoff_packet_id: null,
        twid: 'TWIP-SYNTHETIC',
      },
      federation: {
        domain: 'tnf-local',
        route: ['synthetic-check'],
        hop_count: 1,
        gate_decisions: buildGateDecisions(),
      },
    },
    gateDecisions: buildGateDecisions(),
    tags: ['terminal-bound'],
    payload: {
      twipRef: {
        twid: 'TWIP-SYNTHETIC',
      },
    },
  };
}

async function evaluate(endpoint, token, request) {
  const url = `${endpoint.replace(/\/+$/, '')}/gates/federation/evaluate`;
  
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify({ request }),
    });
  } catch (error) {
    throw new Error(`Federation gate endpoint unreachable: ${error.message}`);
  }
  
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  
  if (response.status === 401 || response.status === 403) {
    throw new Error(`Authentication failed (HTTP ${response.status}): TNF_GATE_POLICY_TOKEN was rejected. Check token validity and tenant configuration.`);
  }
  if (response.status === 500) {
    throw new Error(`Federation gate server error (HTTP 500): ${JSON.stringify(body)}`);
  }
  // 422 = policy deny (valid response), 200 = policy allow (valid response)
  if (response.status !== 200 && response.status !== 422) {
    throw new Error(`Federation gate returned unexpected HTTP ${response.status}: ${JSON.stringify(body)}`);
  }
  
  return {
    status: response.status,
    ok: response.status === 200 || response.status === 422,
    body,
  };
}

// Removed mockResponse function - TNF does not use mocks. All evaluations must hit real endpoints.

function assertResult(name, result, expectOk) {
  const body = result.body || {};
  const decision = body.decision;
  
  if (expectOk && decision !== 'allow') {
    throw new Error(
      `${name} expected allow decision='allow' but got status=${result.status} decision=${decision} body=${JSON.stringify(body)}`
    );
  }
  if (!expectOk && decision !== 'deny') {
    throw new Error(
      `${name} expected deny decision='deny' but got status=${result.status} decision=${decision} body=${JSON.stringify(body)}`
    );
  }
  
  return true;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const validRequest = buildValidRequest(args.tenant);
  const invalidRequest = {
    ...validRequest,
    gateDecisions: validRequest.gateDecisions.filter(
      (entry) => entry.gate !== 'CHANNEL_MEMBERSHIP_GATE'
    ),
  };

  const startedAt = new Date().toISOString();
  const valid = await evaluate(args.endpoint, args.token, validRequest);
  const invalid = await evaluate(args.endpoint, args.token, invalidRequest);

  assertResult('valid_request', valid, true);
  assertResult('invalid_request', invalid, false);

  const output = {
    ok: true,
    startedAt,
    endpoint: args.endpoint,
    checks: {
      valid: {
        status: valid.status,
        decision: valid.body?.decision || null,
      },
      invalid: {
        status: invalid.status,
        decision: invalid.body?.decision || null,
        reasons: Array.isArray(invalid.body?.reasons) ? invalid.body.reasons : [],
      },
    },
  };

  if (args.json) {
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log(
      [
        'Synthetic federation gate check passed.',
        `- endpoint: ${args.endpoint}`,
        `- valid status: ${valid.status} decision=${output.checks.valid.decision}`,
        `- invalid status: ${invalid.status} decision=${output.checks.invalid.decision}`,
      ].join('\n')
    );
  }
}

main().catch((error) => {
  console.error(`synthetic-federation-gate-check failed: ${error.message}`);
  process.exit(1);
});
