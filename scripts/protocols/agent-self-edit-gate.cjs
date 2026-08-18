#!/usr/bin/env node

const fs = require('node:fs');
const os = require('node:os');
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
    else if (token === '--staged') args.staged = true;
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

  if (args.staged) return args;

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

  // Registry-wide approval gate, applied to every agent regardless of profile.
  //
  // An agent that can edit its own authority can grant itself authority.
  // TURN_ZERO_MANDATE.md records precisely that failure: "an earlier,
  // uncommitted edit to this file made the same claim without a real operator
  // confirmation behind it". Authority documents, protocol schemas, the
  // proprietary boundary, CI workflows and .gitignore are therefore
  // approval-gated for everyone, and no per-owner allowlist can widen past it.
  const globalApproval = (registry.globally_approval_required || []).some((rule) =>
    matchRule(normalizedPath, rule)
  );
  if (globalApproval) {
    const approved = Boolean(request.approval?.required && request.approval?.approved);
    if (!approved) {
      reasons.push(
        `target.path ${normalizedPath} is registry-wide approval-required (authority surface) and carries no approved approval block`
      );
    }
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

/**
 * Enforce the registry's authority surfaces against the git index.
 *
 * WHY THIS MODE EXISTS
 *   Until 2026-08-06 this gate had ZERO call sites. It could evaluate a
 *   self-edit request beautifully and nothing ever asked it. Meanwhile
 *   TNF_OPERATOR_CONFIRM=1 is asserted once per session and then authorizes
 *   every commit that follows, including edits to TURN_ZERO_MANDATE.md,
 *   DIRECTIVES.md, .github/workflows/ and sync-repos.sh. The registry declared
 *   those approval-required for every agent; the commit path never asked.
 *
 *   TURN_ZERO_MANDATE.md itself records an agent editing that file to assert
 *   operator authorization it did not have. A blanket session token is exactly
 *   the shape of authority that incident exploited.
 *
 * WHAT IT ADDS
 *   A second, narrower acknowledgement for authority surfaces only.
 *   TNF_OPERATOR_CONFIRM says "a human is committing this session".
 *   TNF_AUTHORITY_EDIT_CONFIRM says "and I know this commit changes the rules".
 *   Ordinary commits are untouched — the check is a no-op unless a staged path
 *   matches globally_approval_required.
 *
 *   Every authorized authority edit is written to the audit log by path, so the
 *   record answers "which rule changed, and who said so" rather than a count.
 */
function checkStagedAuthoritySurfaces(registryPath, asJson) {
  const registry = readJson(registryPath);
  const rules = registry.globally_approval_required || [];
  if (!rules.length) {
    console.error('[self-edit-gate] BLOCKED: registry declares no authority surfaces — refusing to pass silently');
    process.exit(2);
  }

  const staged = require('node:child_process')
    // maxBuffer: the default 1 MB overflows with ENOBUFS on large changesets
    // (~30k staged paths), which aborted the commit before the gate could
    // evaluate anything. A gate that crashes open on big diffs inspects the
    // changes least likely to be routine, so give it room to read them.
    .execSync('git diff --cached --name-only', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 256 * 1024 * 1024,
    })
    .split('\n')
    .map((s) => normalizePath(s))
    .filter(Boolean);

  const hits = staged.filter((p) => rules.some((r) => matchRule(p, r)));

  if (asJson) {
    console.log(JSON.stringify({ ok: hits.length === 0 || Boolean(process.env.TNF_AUTHORITY_EDIT_CONFIRM), staged: staged.length, authoritySurfaces: hits }, null, 2));
  }

  if (!hits.length) {
    if (!asJson) console.log(`[self-edit-gate] OK: no authority surfaces staged (${staged.length} path(s))`);
    return;
  }

  const audit = path.join(os.homedir(), '.tnf', 'audit', 'commit-attempts.jsonl');
  const confirmed = Boolean(process.env.TNF_AUTHORITY_EDIT_CONFIRM);
  try {
    fs.mkdirSync(path.dirname(audit), { recursive: true });
    for (const p of hits) {
      fs.appendFileSync(
        audit,
        `${JSON.stringify({
          ts: new Date().toISOString(),
          action: 'authority-surface-edit',
          decision: confirmed ? 'allowed' : 'blocked',
          path: p,
          branch: (() => {
            try {
              return require('node:child_process')
                .execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
                .trim();
            } catch {
              return 'unknown';
            }
          })(),
        })}\n`
      );
    }
  } catch {
    /* auditing must never be the reason a commit fails */
  }

  if (confirmed) {
    if (!asJson) {
      console.log(`[self-edit-gate] AUTHORITY EDIT acknowledged (${hits.length}):`);
      for (const p of hits) console.log(`    ${p}`);
    }
    return;
  }

  console.error('');
  console.error(`  BLOCKED — this commit changes ${hits.length} authority surface(s):`);
  console.error('');
  for (const p of hits) console.error(`      ${p}`);
  console.error('');
  console.error('  These govern what agents may do. data/protocols/agent-owned-docs.registry.json');
  console.error('  marks them approval-required for every agent, with no self-approval path.');
  console.error('');
  console.error('  TNF_OPERATOR_CONFIRM authorizes committing this session.');
  console.error('  It does not authorize changing the rules.');
  console.error('');
  console.error('  Operator:  TNF_AUTHORITY_EDIT_CONFIRM=1 TNF_OPERATOR_CONFIRM=1 git commit ...');
  console.error('');
  console.error('  If you are an automated agent: neither variable is yours to set.');
  console.error('  Surface the blocked authority edit to the operator instead.');
  console.error('');
  process.exit(1);
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.staged) return checkStagedAuthoritySurfaces(args.registryPath, args.json);
  const schema = readJson(args.schemaPath);
  const registry = readJson(args.registryPath);
  const request = readJson(path.resolve(args.requestPath));

  validateRequestShape(schema, request);
  const result = evaluate(request, registry);

  // Exit code must reflect the decision in BOTH output modes. Until 2026-08-05
  // `--json` printed decision:"deny" and exited 0, because exitCode was set only
  // in the human branch below — so the machine-readable mode, the one any
  // wiring would actually use, reported a denial as success. That is the exact
  // defect class this gate exists to prevent, sitting inside the gate.
  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 2;
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
