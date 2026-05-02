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
  'tnf-cron-governance.schema.json'
);
const defaultRegistryPath = path.join(repoRoot, 'data', 'protocols', 'cron-jobs.registry.json');

const REQUIRED_GATES = [
  'TENANT_SCOPE_GATE',
  'TRACE_CONTINUITY_GATE',
  'CHANNEL_MEMBERSHIP_GATE',
  'CRON_SCOPE_GATE',
  'CRON_CATEGORY_GATE',
  'CRON_OWNERSHIP_GATE',
];

const REQUIRED_APPROVAL_GATES = new Set([
  'system_framework',
  'orchestration_gate',
  'federation_sync',
  'self_improvement_core',
]);

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
      '  node scripts/protocols/cron-governance-gate.cjs --request ./request.json [options]',
      '',
      'Options:',
      '  --schema <path>     Override schema path (default: docs/protocols/schemas/tnf-cron-governance.schema.json)',
      '  --registry <path>   Override registry path (default: data/protocols/cron-jobs.registry.json)',
      '  --json              Emit JSON output only',
      '  --help, -h          Show help',
    ].join('\n')
  );
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function toUpperSet(items) {
  const set = new Set();
  for (const item of Array.isArray(items) ? items : []) {
    if (typeof item === 'string' && item.trim()) set.add(item.trim().toUpperCase());
  }
  return set;
}

function hasPermission(request, permission) {
  const list = Array.isArray(request?.actor?.permissions) ? request.actor.permissions : [];
  const target = String(permission || '').trim().toLowerCase();
  return list.some((entry) => String(entry || '').trim().toLowerCase() === target);
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

function isSuperAdmin(request) {
  const roles = toUpperSet(request?.actor?.roles);
  return roles.has('SUPER_ADMIN') || roles.has('SYSTEM') || hasPermission(request, 'system:access');
}

function hasTenantMutationRole(request, registry) {
  const roles = toUpperSet(request?.actor?.roles);
  const allowed = new Set((registry?.policies?.tenant_scope_edit_roles || []).map((r) => String(r).toUpperCase()));
  for (const role of roles) {
    if (allowed.has(role)) return true;
  }
  return false;
}

function isCronExpressionLikelyValid(value) {
  if (value === null || value === undefined) return true;
  const raw = String(value).trim();
  if (!raw) return false;
  const parts = raw.split(/\s+/);
  return parts.length >= 5 && parts.length <= 7;
}

function evaluate(request, registry) {
  const reasons = [];
  const target = request.target || {};
  const scheduleId = String(target.schedule_id || '');
  const category = String(target.category || '');
  const scope = String(target.scope || '');
  const roles = toUpperSet(request?.actor?.roles);
  const superAdmin = isSuperAdmin(request);
  const gateByName = gateMap(request.gate_decisions);
  const categoryConfig = (registry.categories || []).find((entry) => entry.category === category);
  const registeredJob = (registry.jobs || []).find((entry) => entry.schedule_id === scheduleId);

  if ((request.tenant_id || '') !== (request.cumulative_id?.scope?.tenant_id || '')) {
    reasons.push('tenant mismatch between request.tenant_id and cumulative_id.scope.tenant_id');
  }

  if ((request.cumulative_id?.lineage?.schedule_id || '') !== scheduleId) {
    reasons.push('cumulative_id.lineage.schedule_id must match target.schedule_id');
  }

  for (const requiredGate of REQUIRED_GATES) {
    const gate = gateByName.get(requiredGate);
    if (!gate) reasons.push(`missing required gate decision: ${requiredGate}`);
    if (gate && gate.decision !== 'allow') {
      reasons.push(`required gate ${requiredGate} is not allow (decision=${gate.decision})`);
    }
  }

  if (!categoryConfig) {
    reasons.push(`category ${category} is not registered in cron registry`);
  } else if (categoryConfig.scope !== scope) {
    reasons.push(`target.scope ${scope} does not match category scope ${categoryConfig.scope}`);
  }

  if (!isCronExpressionLikelyValid(target.cron_expression)) {
    reasons.push('target.cron_expression is not a valid cron token pattern');
  }

  if (scope === 'system_framework') {
    const delegated = Boolean(request?.delegation?.delegated_by_super_admin);
    const approvalGate = gateByName.get('APPROVAL_GATE');
    const approvalAllowed = approvalGate && approvalGate.decision === 'allow';

    if (!superAdmin) {
      if (!(delegated && approvalAllowed)) {
        reasons.push(
          'system_framework schedule mutations require SUPER_ADMIN or explicit delegated_by_super_admin with APPROVAL_GATE=allow'
        );
      }
    }
  }

  if (scope === 'tenant') {
    if (!superAdmin && !hasTenantMutationRole(request, registry)) {
      reasons.push('actor lacks tenant cron mutation role');
    }

    if (registry?.policies?.tenant_scope_requires_owner_match) {
      if (request.actor?.kind === 'user' && target.owner_user_id && request.actor.user_id !== target.owner_user_id) {
        reasons.push('tenant scope mutation requires actor.user_id to match target.owner_user_id');
      }
      if (
        request.actor?.kind === 'agent' &&
        target.owner_agent_id &&
        request.actor.agent_id !== target.owner_agent_id
      ) {
        reasons.push('tenant scope mutation requires actor.agent_id to match target.owner_agent_id');
      }
    }
  }

  if (registeredJob?.locked && !superAdmin) {
    reasons.push(`schedule_id ${scheduleId} is locked and requires SUPER_ADMIN`);
  }

  if (categoryConfig?.requires_approval || REQUIRED_APPROVAL_GATES.has(category) || scope === 'system_framework') {
    const approvalGate = gateByName.get('APPROVAL_GATE');
    if (!approvalGate || approvalGate.decision !== 'allow') {
      reasons.push('APPROVAL_GATE=allow is required for this scope/category');
    }
  }

  const roleSnapshot = [...roles].sort();
  return {
    ok: reasons.length === 0,
    decision: reasons.length === 0 ? 'allow' : 'deny',
    reasons,
    scope,
    category,
    scheduleId,
    superAdmin,
    roleSnapshot,
    registeredJobLocked: Boolean(registeredJob?.locked),
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
    if (!result.ok) process.exitCode = 2;
  } else if (result.ok) {
    console.log(
      [
        'cron-governance gate decision: allow',
        `- schedule_id: ${result.scheduleId}`,
        `- scope: ${result.scope}`,
        `- category: ${result.category}`,
      ].join('\n')
    );
  } else {
    console.log(
      [
        'cron-governance gate decision: deny',
        `- schedule_id: ${result.scheduleId}`,
        `- scope: ${result.scope}`,
        `- category: ${result.category}`,
        ...result.reasons.map((reason) => `- reason: ${reason}`),
      ].join('\n')
    );
    process.exitCode = 2;
  }
}

try {
  main();
} catch (error) {
  console.error(`cron-governance-gate failed: ${error.message}`);
  process.exit(1);
}
