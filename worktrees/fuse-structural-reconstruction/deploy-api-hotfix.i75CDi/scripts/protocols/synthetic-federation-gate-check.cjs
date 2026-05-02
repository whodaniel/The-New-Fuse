#!/usr/bin/env node

const DEFAULT_ENDPOINT =
  process.env.TNF_GATE_POLICY_ENDPOINT || 'https://tnf-sharedstate.bizsynth.workers.dev';

function printUsage() {
  console.log(
    [
      'Usage:',
      '  node scripts/protocols/synthetic-federation-gate-check.cjs [options]',
      '',
      'Options:',
      '  --endpoint <url>      Gate API endpoint base URL',
      '  --token <token>       Optional x-auth-token (or set TNF_GATE_POLICY_TOKEN)',
      '  --tenant <id>         Tenant id (default: tnf-local)',
      '  --json                Print JSON summary',
      '  --help, -h            Show help',
    ].join('\n')
  );
}

function parseArgs(argv) {
  const args = {
    endpoint: DEFAULT_ENDPOINT,
    token: process.env.TNF_GATE_POLICY_TOKEN || '',
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
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { 'x-auth-token': token } : {}),
    },
    body: JSON.stringify({ request }),
  });
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return {
    status: response.status,
    ok: response.ok,
    body,
  };
}

function assertResult(name, result, expectOk) {
  const bodyOk = Boolean(result.body && result.body.ok === true);
  if (expectOk && !(result.ok && bodyOk)) {
    throw new Error(
      `${name} expected allow but got status=${result.status} body=${JSON.stringify(result.body)}`
    );
  }
  if (!expectOk && (result.ok || bodyOk)) {
    throw new Error(
      `${name} expected deny but got status=${result.status} body=${JSON.stringify(result.body)}`
    );
  }
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
