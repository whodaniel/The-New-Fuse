#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const Ajv2020 = require('ajv/dist/2020').default;
const addFormats = require('ajv-formats');

const repoRoot = path.resolve(__dirname, '..', '..');
const defaultSchemaPath = path.join(
  repoRoot,
  'docs',
  'protocols',
  'schemas',
  'tnf-agent-self-edit.schema.json'
);
const defaultRegistryPath = path.join(repoRoot, 'data', 'protocols', 'agent-owned-docs.registry.json');

const REQUIRED_GATES = [
  'TENANT_SCOPE_GATE',
  'TRACE_CONTINUITY_GATE',
  'CHANNEL_MEMBERSHIP_GATE',
  'OWNERSHIP_GATE',
  'PATH_SCOPE_GATE',
  'CONTENT_POLICY_GATE',
];

function parseArgs(argv) {
  const args = {
    requestPath: '',
    schemaPath: defaultSchemaPath,
    registryPath: defaultRegistryPath,
    json: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--request') args.requestPath = argv[++i] || '';
    else if (token === '--schema') args.schemaPath = argv[++i] || args.schemaPath;
    else if (token === '--registry') args.registryPath = argv[++i] || args.registryPath;
    else if (token === '--json') args.json = true;
    else if (token === '--help' || token === '-h') {
      printUsage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  if (!args.requestPath) {
    throw new Error('Missing required --request <path/to/request.json>');
  }

  return args;
}

function printUsage() {
  console.log(
    [
      'Usage:',
      '  node scripts/protocols/agent-self-edit-gate.cjs --request ./request.json [options]',
      '',
      'Options:',
      '  --schema <path>     Override schema path (default: docs/protocols/schemas/tnf-agent-self-edit.schema.json)',
      '  --registry <path>   Override registry path (default: data/protocols/agent-owned-docs.registry.json)',
      '  --json              Emit JSON output only',
      '  --help, -h          Show help',
    ].join('\n')
  );
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizePath(rawPath) {
  const value = String(rawPath || '').replaceAll('\\', '/').replace(/^.\//, '');
  return value;
}

function matchRule(filePath, rule) {
  const normalizedRule = String(rule || '').replaceAll('\\', '/');
  if (normalizedRule.endsWith('/**')) {
    const prefix = normalizedRule.slice(0, -3);
    return filePath === prefix || filePath.startsWith(`${prefix}/`);
  }
  return filePath === normalizedRule;
}

function gateMap(gateDecisions) {
  return new Map((gateDecisions || []).map((gate) => [gate.gate, gate]));
}

function validateRequestShape(schema, request) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(request)) {
    const errors = (validate.errors || []).map((error) => `${error.instancePath || '/'} ${error.message}`);
    throw new Error(`Request schema validation failed: ${errors.join('; ')}`);
  }
}

function evaluate(request, registry) {
  const reasons = [];
  const normalizedPath = normalizePath(request.target.path);
  const ownerAgentId = request.target.owner_agent_id;
  const ownerProfile = (registry.owners || []).find((owner) => owner.owner_agent_id === ownerAgentId);
  const gateByName = gateMap(request.gate_decisions);

  if ((request.tenant_id || '') !== (request.cumulative_id?.scope?.tenant_id || '')) {
    reasons.push('tenant mismatch between request.tenant_id and cumulative_id.scope.tenant_id');
  }

  for (const requiredGate of REQUIRED_GATES) {
    const gate = gateByName.get(requiredGate);
    if (!gate) reasons.push(`missing required gate decision: ${requiredGate}`);
    if (gate && gate.decision !== 'allow') {
      reasons.push(`required gate ${requiredGate} is not allow (decision=${gate.decision})`);
    }
  }

  if (!ownerProfile) {
    reasons.push(`owner profile not found for owner_agent_id=${ownerAgentId}`);
  }

  if ((request.agent?.agent_id || '') !== ownerAgentId) {
    reasons.push('agent.agent_id must match target.owner_agent_id for self-edit operations');
  }

  if (!normalizedPath || normalizedPath.startsWith('/') || normalizedPath.includes('../')) {
    reasons.push(`target.path is not path-safe: ${request.target.path}`);
  }

  if (ownerProfile) {
    const allowed = (ownerProfile.allowed_paths || []).some((rule) => matchRule(normalizedPath, rule));
    if (!allowed) {
      reasons.push(`target.path ${normalizedPath} is outside owner allowlist`);
    }

    const approvalRequired = (ownerProfile.approval_required_paths || []).some((rule) =>
      matchRule(normalizedPath, rule)
    );
    if (approvalRequired) {
      const approved = Boolean(request.approval?.required && request.approval?.approved);
      if (!approved) {
        reasons.push(`target.path ${normalizedPath} requires explicit approval`);
      }
    }
  }

  return {
    ok: reasons.length === 0,
    decision: reasons.length === 0 ? 'allow' : 'deny',
    reasons,
    normalizedPath,
    ownerAgentId,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const schema = readJson(args.schemaPath);
  const registry = readJson(args.registryPath);
  const request = readJson(path.resolve(args.requestPath));

  validateRequestShape(schema, request);
  const result = evaluate(request, registry);

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (result.ok) {
    console.log(
      [
        'agent-self-edit gate decision: allow',
        `- owner_agent_id: ${result.ownerAgentId}`,
        `- target.path: ${result.normalizedPath}`,
      ].join('\n')
    );
  } else {
    console.log(
      [
        'agent-self-edit gate decision: deny',
        `- owner_agent_id: ${result.ownerAgentId}`,
        `- target.path: ${result.normalizedPath}`,
        ...result.reasons.map((reason) => `- reason: ${reason}`),
      ].join('\n')
    );
    process.exitCode = 2;
  }
}

try {
  main();
} catch (error) {
  console.error(`agent-self-edit-gate failed: ${error.message}`);
  process.exit(1);
}
