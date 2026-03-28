#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');

function usage() {
  console.log(
    'Usage: node scripts/protocols/staffops-resource-acl-gate.cjs --actor-id <id> --action <read|write> --resource <path> [--policy <path>] [--root <path>] [--json]'
  );
}

function parseArgs(argv) {
  const args = {
    actorId: '',
    action: 'read',
    resource: '',
    root: path.join(os.homedir(), 'Desktop', 'A1-Inter-LLM-Com', 'The-New-Fuse'),
    policy: '',
    json: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--actor-id') {
      args.actorId = String(argv[++i] || '').trim();
    } else if (token === '--action') {
      args.action = String(argv[++i] || '').trim();
    } else if (token === '--resource') {
      args.resource = String(argv[++i] || '').trim();
    } else if (token === '--policy') {
      args.policy = String(argv[++i] || '').trim();
    } else if (token === '--root') {
      args.root = String(argv[++i] || '').trim();
    } else if (token === '--json') {
      args.json = true;
    } else if (token === '--help' || token === '-h') {
      usage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  args.policy =
    args.policy || path.join(args.root, 'data', 'staffops', 'staffops-role-policy.json');
  return args;
}

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_error) {
    return fallback;
  }
}

function actorMatchesPattern(actorId, pattern) {
  const normalized = String(pattern || '').trim();
  if (!normalized) return false;
  if (normalized.endsWith('*')) {
    return actorId.startsWith(normalized.slice(0, -1));
  }
  return actorId === normalized;
}

function isActorAllowed(actorId, patterns = []) {
  return patterns.some((pattern) => actorMatchesPattern(actorId, pattern));
}

function evaluateAcl({ actorId, action, resource, root, policy }) {
  const allowedActorIds = Array.isArray(policy?.allowedActorIds) ? policy.allowedActorIds : [];
  const allowedActorPatterns = Array.isArray(policy?.allowedActorPatterns)
    ? policy.allowedActorPatterns
    : [];
  const actorAllowed = isActorAllowed(actorId, [...allowedActorIds, ...allowedActorPatterns]);
  const relativeResource = path.isAbsolute(resource)
    ? path.relative(root, resource).replace(/\\/g, '/')
    : resource.replace(/\\/g, '/');
  const resourceRule =
    policy?.resources && typeof policy.resources === 'object'
      ? policy.resources[relativeResource]
      : null;

  if (!actorAllowed) {
    return {
      allowed: false,
      reason: 'actor-not-allowed',
      actorId,
      action,
      resource: relativeResource,
    };
  }

  if (!resourceRule) {
    return {
      allowed: true,
      reason: 'actor-allowed-resource-unscoped',
      actorId,
      action,
      resource: relativeResource,
    };
  }

  const actionPatterns = Array.isArray(resourceRule[action]) ? resourceRule[action] : [];
  if (actionPatterns.length === 0) {
    return {
      allowed: false,
      reason: 'resource-action-not-configured',
      actorId,
      action,
      resource: relativeResource,
    };
  }

  const actionAllowed = isActorAllowed(actorId, actionPatterns);
  return {
    allowed: actionAllowed,
    reason: actionAllowed ? 'resource-action-allowed' : 'resource-action-denied',
    actorId,
    action,
    resource: relativeResource,
  };
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.actorId || !args.action || !args.resource) {
    usage();
    process.exit(1);
  }
  if (!['read', 'write'].includes(args.action)) {
    throw new Error(`Unsupported action: ${args.action}`);
  }

  const policy = readJson(args.policy, {
    allowedActorIds: [],
    allowedActorPatterns: [],
    resources: {},
  });
  const result = evaluateAcl({
    actorId: args.actorId,
    action: args.action,
    resource: args.resource,
    root: args.root,
    policy,
  });

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(
      `${result.allowed ? 'ALLOW' : 'DENY'} actor=${result.actorId} action=${result.action} resource=${result.resource} reason=${result.reason}`
    );
  }

  process.exit(result.allowed ? 0 : 2);
}

main();
