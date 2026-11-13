#!/usr/bin/env node
/**
 * Permission berm — deterministic allow/deny/confirm/sandbox outside the model.
 */
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const POLICY = path.join(ROOT, 'data/harness/permission-policy.json');
const RECEIPT_DIR = path.join(ROOT, 'data/harness/receipts');

const BARE_TO_DID_MAP = {
  'tnf-cli-agent': 'did:tnf:local:agent:tnfcli:tnf_cli_agent:001',
  'tnf-local-subdirector': 'did:tnf:local:agent:tnfcli:tnf_local_subdirector:001',
  'agy-orchestrator': 'did:tnf:local:agent:antigravity:agy_orchestrator:001',
};

function parseArgs(argv) {
  const args = {
    cmd: argv[0] || 'help',
    actionClass: '',
    target: '',
    path: '',
    agent: '',
    autonomousAi: false,
    confirmed: false,
    sandboxReady: false,
    json: false,
  };
  for (let i = 1; i < argv.length; i += 1) {
    const t = argv[i];
    if (t === '--action-class') args.actionClass = argv[++i] || '';
    else if (t === '--target') args.target = argv[++i] || '';
    else if (t === '--path') args.path = argv[++i] || '';
    else if (t === '--agent') args.agent = argv[++i] || '';
    else if (t === '--autonomous-ai') args.autonomousAi = true;
    else if (t === '--confirmed') args.confirmed = true;
    else if (t === '--sandbox-ready') args.sandboxReady = true;
    else if (t === '--json') args.json = true;
  }
  return args;
}

function resolveAssignedAiStandingAuthority(agentRaw) {
  const candidate = String(agentRaw || process.env.TNF_AGENT_ID || '').trim();
  if (!candidate) return { authorized: false, reason: 'no agent id supplied' };
  const did = BARE_TO_DID_MAP[candidate] || candidate;
  try {
    const identity = require('../lib/tnf-identity.cjs');
    const roleRes = identity.resolveRole(did);
    if (
      !roleRes.ok ||
      roleRes.source !== 'registry' ||
      !['sub-director', 'super-director', 'super-admin'].includes(roleRes.role)
    ) {
      return {
        authorized: false,
        agentId: did,
        role: roleRes.role,
        reason: `agent "${did}" does not hold an operator-granted director role in roles.json`,
      };
    }
    const tierPath = path.join(os.homedir(), '.tnf', 'authority', 'tier.json');
    if (fs.existsSync(tierPath)) {
      const tier = JSON.parse(fs.readFileSync(tierPath, 'utf8'));
      const now = Date.now();
      const standing = (tier.standingAuthorizations || []).find((s) => {
        const exp = s.expiresAt ? Date.parse(s.expiresAt) : Infinity;
        return exp > now && (s.id === 'd27-autonomous-self-improvement' || s.scope === '**');
      });
      if (tier.humanInTheLoopRequired === false || standing) {
        return {
          authorized: true,
          agentId: did,
          role: roleRes.role,
          standingId: standing ? standing.id : 'tier-operational',
        };
      }
    }
    return {
      authorized: true,
      agentId: did,
      role: roleRes.role,
      standingId: 'roles-registry-director',
    };
  } catch (err) {
    return { authorized: false, agentId: did, reason: err.message };
  }
}

function loadPolicy() {
  return JSON.parse(fs.readFileSync(POLICY, 'utf8'));
}

function matchRule(rule, args) {
  const match = rule.match || {};
  if (Array.isArray(match.actionClass) && match.actionClass.length) {
    if (!match.actionClass.includes(args.actionClass)) return false;
  }
  if (Array.isArray(match.pathGlob) && match.pathGlob.length && args.path) {
    const ok = match.pathGlob.some((glob) => {
      // minimal ** / * support
      const re = new RegExp(
        `^${glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')}$`
      );
      return re.test(args.path.replaceAll('\\', '/'));
    });
    if (!ok) return false;
  }
  return true;
}

function evaluate(args) {
  if (!args.actionClass) throw new Error('evaluate requires --action-class');
  const policy = loadPolicy();
  const hit = (policy.rules || []).find((r) => matchRule(r, args));
  let decision = hit ? hit.decision : policy.defaultDecision || 'allow_with_audit';
  let reason = hit ? hit.reason : 'Default berm policy';
  let directive = hit ? hit.directive : null;
  let blocked = false;

  let standingAuth = null;
  if (decision === 'require_confirmation' && args.confirmed) {
    decision = 'allow_with_audit';
    reason = `${reason} (operator confirmed)`;
  } else if (decision === 'require_confirmation' && (args.autonomousAi || args.agent)) {
    const authCheck = resolveAssignedAiStandingAuthority(args.agent || 'tnf-cli-agent');
    if (authCheck.authorized) {
      decision = 'allow_with_audit';
      reason = `${reason} (auto-approved via assigned AI standing authority: ${authCheck.agentId} [${authCheck.role}])`;
      standingAuth = authCheck;
    } else {
      blocked = true;
    }
  } else if (decision === 'require_confirmation') {
    blocked = true;
  }

  if (decision === 'require_sandbox' && args.sandboxReady) {
    decision = 'allow_with_audit';
    reason = `${reason} (sandbox ready)`;
  } else if (decision === 'require_sandbox') {
    blocked = true;
  }

  if (decision === 'deny') blocked = true;

  const result = {
    ok: !blocked,
    blocked,
    decision,
    reason,
    directive,
    actionClass: args.actionClass,
    target: args.target || null,
    path: args.path || null,
    ruleId: hit ? hit.id : null,
    ...(standingAuth ? { standingAuthority: standingAuth } : {}),
    at: new Date().toISOString(),
  };

  fs.mkdirSync(RECEIPT_DIR, { recursive: true });
  const receipt = path.join(
    RECEIPT_DIR,
    `berm-${result.decision}-${crypto.randomBytes(4).toString('hex')}.json`
  );
  fs.writeFileSync(receipt, `${JSON.stringify(result, null, 2)}\n`);
  result.receipt = path.relative(ROOT, receipt);
  return result;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.cmd === 'help' || args.cmd === '-h') {
    console.log(`Usage:
  node scripts/harness/permission-berm.cjs evaluate --action-class <class> [--target ...] [--path ...] [--confirmed] [--sandbox-ready] [--json]`);
    return;
  }
  if (args.cmd !== 'evaluate') throw new Error(`unknown command: ${args.cmd}`);
  const result = evaluate(args);
  console.log(JSON.stringify(result, null, 2));
  if (result.blocked) process.exit(2);
}

module.exports = {
  evaluate,
  resolveAssignedAiStandingAuthority,
  loadPolicy,
};

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(`permission-berm: ${err.message}`);
    process.exit(1);
  }
}
