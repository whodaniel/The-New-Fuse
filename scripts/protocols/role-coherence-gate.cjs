#!/usr/bin/env node
/**
 * role-coherence-gate.cjs — make TNF's role stack verifiable.
 *
 * D23 states the rule plainly: "Authority comes from verified identity, never
 * from a wire claim," and names one sanctioned lookup —
 * `resolveRole(verifiedAgentId)` against the operator-owned
 * `~/.tnf/authority/roles.json`. That primitive is correct: it fails closed to
 * `worker`, never returns a claimed role, and rejects path abuse.
 *
 * Nothing in the running runtime calls it. TNF carries three role vocabularies:
 *
 *   authority      worker | sub-director | super-director | super-admin
 *                                                           (registry, Ed25519)
 *   classification director | orchestrator | broker | worker | participant
 *                                                           (filename substring)
 *   declared       whatever an agent writes about itself     (bus payload, agent.yaml)
 *
 * Only the first authorizes. The runtime reads the third. This gate exists so
 * that gap is measured on every run instead of rediscovered by audit.
 *
 * Checks
 * ------
 *  C1  registry integrity — every grant names a role in VALID_ROLES
 *  C2  no authorization decision reads a declared/classification role
 *  C3  authority-role literals are not compared outside sanctioned modules
 *  C4  no invented authority-shaped roles (local-director, subdirector, ...)
 *  C5  autonomy configuration fails closed when absent, not only when corrupt
 *  C6  the operator identity file uses each vocabulary correctly
 *  C7  every authority grant is traceable to an entity (did:tnf)
 *
 * C3 judges by intent, not by the comparison: routing and natural-language
 * interpretation may match loosely, authorization may not. See
 * docs/protocols/TNF_AUTHORITY_IDENTIFIER_STANDARD.md.
 *
 * Usage
 * -----
 *   node scripts/protocols/role-coherence-gate.cjs           # advisory
 *   node scripts/protocols/role-coherence-gate.cjs --strict  # exit 1
 *   node scripts/protocols/role-coherence-gate.cjs --json
 */

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const ROOT = path.resolve(__dirname, '..', '..');

/**
 * The only vocabulary that authorizes. Mirrors VALID_ROLES in tnf-identity.cjs;
 * C1 fails if the two ever diverge, which is how this list was caught trailing
 * the addition of `super-admin`.
 */
const AUTHORITY_ROLES = Object.freeze([
  'worker',
  'sub-director',
  'super-director',
  'super-admin',
]);

/** Classification only. D23: "none of them authorize anything." */
const CLASSIFICATION_ROLES = Object.freeze([
  'director',
  'orchestrator',
  'broker',
  'worker',
  'participant',
]);

/**
 * Role strings that look like authority but are not.
 *
 * `local-director` is NOT a hallucination — TNF_FEDERATED_DIRECTOR_ORCHESTRATION_RUNBOOK_2026-03-18.md
 * §2.1 names "Local Director (`tnf-agent` / `tnf-cli-agent`)" as original
 * vocabulary, four months before the session D23 credits with inventing it. It
 * is retired here for the right reason: residency does not belong in a role
 * name. The rest are spelling drift.
 */
const INVENTED_AUTHORITY_ROLES = Object.freeze([
  'local-director',
  'local-subdirector',
  'subdirector',
  'super_director',
  'sub_director',
  'superdirector',
]);

/** Modules permitted to compare authority-role literals. */
const SANCTIONED_ROLE_READERS = Object.freeze([
  'scripts/lib/tnf-identity.cjs',
  // The minting counterpart to tnf-identity: it validates the role vocabulary of
  // a grant it is about to sign. It is not resolving anyone's claim.
  'scripts/lib/tnf-grant-issuer.cjs',
  'scripts/lib/tnf-elevation-broker.cjs',
  'scripts/lib/tnf-authority-client.cjs',
  'scripts/protocols/role-coherence-gate.cjs',
]);

const findings = [];
function finding(check, severity, message, evidence) {
  findings.push({ check, severity, message, evidence: evidence || null });
}

function read(rel) {
  try {
    return fs.readFileSync(path.join(ROOT, rel), 'utf8');
  } catch {
    return null;
  }
}

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (/node_modules|\.git|dist|coverage|\.next|build/.test(e.name)) continue;
      walk(rel, out);
    } else if (/\.(cjs|mjs|js|ts|tsx)$/.test(e.name) && !/\.test\.|\.backup/.test(e.name)) {
      out.push(rel);
    }
  }
  return out;
}

// ---------------------------------------------------------------- C1
function checkRegistry() {
  let identity;
  try {
    identity = require(path.join(ROOT, 'scripts/lib/tnf-identity.cjs'));
  } catch (err) {
    finding('C1', 'error', `cannot load the identity module: ${err.message}`);
    return;
  }

  const declared = identity.VALID_ROLES || AUTHORITY_ROLES;
  const mismatch = AUTHORITY_ROLES.filter((r) => !declared.includes(r)).concat(
    declared.filter((r) => !AUTHORITY_ROLES.includes(r))
  );
  if (mismatch.length) {
    finding(
      'C1',
      'error',
      `this gate and tnf-identity disagree on the authority vocabulary: ${mismatch.join(', ')}`
    );
  }

  let registry;
  try {
    registry = identity.loadRoleRegistry();
  } catch (err) {
    finding('C1', 'error', `role registry unreadable: ${err.message}`);
    return;
  }
  const agents = registry.agents || {};
  for (const [id, entry] of Object.entries(agents)) {
    if (!entry || typeof entry !== 'object' || !AUTHORITY_ROLES.includes(entry.role)) {
      finding('C1', 'error', `registry grant "${id}" has invalid role ${JSON.stringify(entry && entry.role)}`);
    }
  }
  if (Object.keys(agents).length === 0) {
    finding('C1', 'warn', 'role registry holds no grants; every agent resolves to worker');
  }
}

// ---------------------------------------------------------------- C2
/**
 * The load-bearing check. An authorization decision must derive its role from
 * resolveRole(), not from an identity file, an environment variable, or a bus
 * payload. Flags functions that both (a) read a declared role source and
 * (b) feed a privilege-shaped variable.
 */
const DECLARED_SOURCES = [
  { pattern: /process\.env\.AGENT_ROLE/, label: 'process.env.AGENT_ROLE' },
  { pattern: /pick\(['"]dacc_role['"]\)/, label: "agent.yaml dacc_role" },
  { pattern: /pick\(['"]role['"]\)/, label: 'agent.yaml role' },
  { pattern: /parsed\.role/, label: 'bus self-registration payload role' },
  { pattern: /identity\.role/, label: 'local identity file role' },
];
const PRIVILEGE_SINKS = [
  { pattern: /autonomous\s*=\s*true/, label: 'autonomy grant' },
  { pattern: /autonomyEnabled/, label: 'autonomy configuration' },
  { pattern: /canRequestElevation/, label: 'elevation eligibility' },
  { pattern: /yolo|--force/, label: 'force/yolo bypass' },
];

function checkAuthorizationInputs() {
  const files = [...walk('scripts'), ...walk('packages/tnf-cli/src')];
  for (const rel of files) {
    if (SANCTIONED_ROLE_READERS.includes(rel)) continue;
    const text = read(rel);
    if (!text) continue;

    const sources = DECLARED_SOURCES.filter((s) => s.pattern.test(text));
    const sinks = PRIVILEGE_SINKS.filter((s) => s.pattern.test(text));
    if (!sources.length || !sinks.length) continue;

    const usesResolveRole = /resolve(Authority)?Role\s*\(/.test(text);
    const severity = usesResolveRole ? 'warn' : 'error';
    finding(
      'C2',
      severity,
      `${rel} reaches a privilege decision from a declared role source` +
        (usesResolveRole ? ' (also calls resolveRole — verify which one wins)' : ''),
      {
        declaredSources: sources.map((s) => s.label),
        privilegeSinks: sinks.map((s) => s.label),
        callsResolveRole: usesResolveRole,
      }
    );
  }
}

// ---------------------------------------------------------------- C3
/**
 * Routing is not authorization, and only one of them may be fuzzy.
 *
 * `agents.filter(a => a.role === 'worker')` picking a work queue, or
 * `/worker/i.test(id)` interpreting what a human typed, are legitimate. An agent
 * deciding what it may *do* from the same string is not. The difference is not
 * the comparison — it is what the answer is used for.
 *
 * The standard, per TNF_AUTHORITY_IDENTIFIER_STANDARD.md:
 *
 *   ROUTING / natural-language interpretation — fuzzy matching allowed. Which
 *   queue, which pool, which agent did the user mean. A wrong answer misroutes
 *   work, and the cost is a retry.
 *
 *   AUTHORIZATION — exact, and only via resolveRole(). A wrong answer grants
 *   privilege, and the cost is unbounded.
 *
 * So this check classifies by surrounding intent rather than flagging every
 * comparison. Reporting routing code as a defect is how a gate trains people to
 * ignore it.
 */
const AUTHORIZATION_CONTEXT =
  /autonom|elevat|privileg|authoriz|permit|allow(ed)?\b|grant|escalat|canRequest|isAdmin|bypass/i;
const ROUTING_CONTEXT =
  /queue|dispatch|rout(e|ing)|filter|pool|select|assign|callable|eligible|list|find|match|target/i;

function checkRoleLiteralComparisons() {
  const files = [...walk('scripts'), ...walk('packages/tnf-cli/src')];
  const literal = new RegExp(
    `(===|==)\\s*['"](${AUTHORITY_ROLES.join('|')})['"]|['"](${AUTHORITY_ROLES.join('|')})['"]\\s*(===|==)`
  );
  for (const rel of files) {
    if (SANCTIONED_ROLE_READERS.includes(rel)) continue;
    const text = read(rel);
    if (!text) continue;
    const lines = text.split(/\r?\n/);
    lines.forEach((line, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
      if (!literal.test(line)) return;
      // Judge by what the answer is used for, using the line plus a small
      // window of context around it.
      // Wide enough to span a multi-line condition and the resolve call that
      // feeds it — a narrow window reports correctly-guarded code as a defect.
      const window = lines.slice(Math.max(0, i - 8), i + 5).join('\n');
      const authorizing = AUTHORIZATION_CONTEXT.test(window);
      const routing = ROUTING_CONTEXT.test(window);
      if (authorizing && !/resolve(Authority)?Role\s*\(/.test(window)) {
        finding('C3', 'error', `${rel}:${i + 1} decides authorization from a role literal without resolveRole()`, {
          line: line.trim().slice(0, 140),
          remedy: 'authorization must resolve through resolveRole(); only routing may match loosely',
        });
      } else if (!routing && !authorizing) {
        finding('C3', 'warn', `${rel}:${i + 1} compares an authority-role literal with unclear intent`, {
          line: line.trim().slice(0, 140),
          note: 'name the intent (routing vs authorization) so this reads unambiguously',
        });
      }
    });
  }
}

// ---------------------------------------------------------------- C4
function checkInventedRoles() {
  const files = [...walk('scripts'), ...walk('packages/tnf-cli/src')];
  for (const rel of files) {
    if (SANCTIONED_ROLE_READERS.includes(rel)) continue;
    const text = read(rel);
    if (!text) continue;
    const lines = text.split(/\r?\n/);

    for (const invented of INVENTED_AUTHORITY_ROLES) {
      lines.forEach((line, i) => {
        // Prose in a comment is documentation, not a role usage. A gate that
        // flags the sentence explaining a defect teaches people to ignore it.
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
        // Only a *role* usage counts. `tnf-local-subdirector` as an agent id,
        // a filename, or a service name is legitimate and must not be flagged —
        // an over-reporting gate is as untrustworthy as a silent one.
        const asRoleValue = new RegExp(`\\brole\\s*[:=]\\s*['"]${invented}['"]`, 'i');
        const asRoleCompare = new RegExp(
          `\\brole\\b[^\\n]{0,40}(===|==)\\s*['"]${invented}['"]|['"]${invented}['"]\\s*(===|==)[^\\n]{0,40}\\brole\\b`,
          'i'
        );
        const inRoleList = new RegExp(
          `(VALID_ROLES|ROLE_TRAITS|ROLES)\\b[^\\n]{0,80}['"]${invented}['"]`,
          'i'
        );
        if (!asRoleValue.test(line) && !asRoleCompare.test(line) && !inRoleList.test(line)) return;
        // `tnf-local-subdirector` is a real agent id; don't read it as the role.
        if (new RegExp(`['"][\\w-]*-${invented}['"]`).test(line)) return;
        // An alias table that maps a legacy spelling ONTO a canonical role is
        // where retired vocabulary is supposed to live. The invented string is
        // being eliminated on such a line, not used as authority.
        const retiringAlias = new RegExp(
          `['"]?${invented}['"]?\\s*:\\s*['"](${AUTHORITY_ROLES.join('|')})['"]`,
          'i'
        );
        if (retiringAlias.test(line)) return;
        finding('C4', 'error', `${rel}:${i + 1} uses invented authority-shaped role "${invented}"`, {
          line: line.trim().slice(0, 140),
          allowed: AUTHORITY_ROLES,
        });
      });
    }
  }
}

// ---------------------------------------------------------------- C5
function checkAutonomyFailsClosed() {
  const rel = 'packages/tnf-cli/src/services/LocalSubdirectorAuthorityService.ts';
  const text = read(rel);
  if (!text) {
    finding('C5', 'warn', `${rel} not found; autonomy default not verified`);
    return;
  }
  const defaultBlock = text.match(/DEFAULT_LOCAL_SUBDIRECTOR_CONFIG[^=]*=\s*\{[^}]*\}/s);
  if (defaultBlock && /autonomyEnabled:\s*true/.test(defaultBlock[0])) {
    finding(
      'C5',
      'error',
      `${rel}: the default returned when no config file exists has autonomyEnabled: true — absence grants full autonomy`,
      { remedy: 'a missing config must fail closed, exactly as an unreadable one does' }
    );
  }
  if (defaultBlock && /capabilities:\s*\[\s*['"]all['"]\s*\]/.test(defaultBlock[0])) {
    finding('C5', 'error', `${rel}: the absent-config default grants capabilities: ['all']`);
  }
}

// ---------------------------------------------------------------- C6
function checkOperatorIdentityFile() {
  const p = path.join(os.homedir(), '.tnf', 'agent.yaml');
  let text;
  try {
    text = fs.readFileSync(p, 'utf8');
  } catch {
    return; // absent is fine; defaults apply
  }
  const pick = (k) => {
    const m = text.match(new RegExp(`^${k}:\\s*["']?([^"'\\n]+)["']?\\s*$`, 'm'));
    return m && m[1] ? m[1].trim() : null;
  };
  const fields = {
    role: pick('role'),
    dacc_role: pick('dacc_role'),
    embodiment: pick('embodiment'),
    corporate_title: pick('corporate_title'),
  };
  // `role` and `dacc_role` are DIFFERENT vocabularies by design — D23 keeps
  // classification and authority deliberately separate, so `role: sub-director`
  // alongside `dacc_role: director` is correct, not a conflict. Validate each
  // against its own vocabulary; never against each other.
  if (fields.role && !AUTHORITY_ROLES.includes(fields.role.toLowerCase())) {
    finding('C6', 'error', `~/.tnf/agent.yaml role "${fields.role}" is not an authority role`, {
      allowed: AUTHORITY_ROLES,
      note: 'this field is read by loadDefaultAgentIdentity(); keep it in the authority vocabulary',
    });
  }
  if (fields.dacc_role && !CLASSIFICATION_ROLES.includes(fields.dacc_role.toLowerCase())) {
    finding('C6', 'warn', `~/.tnf/agent.yaml dacc_role "${fields.dacc_role}" is not a classification role`, {
      allowed: CLASSIFICATION_ROLES,
    });
  }
  if (
    fields.role &&
    fields.embodiment &&
    AUTHORITY_ROLES.includes(fields.role.toLowerCase()) &&
    fields.embodiment.toLowerCase() !== fields.role.toLowerCase()
  ) {
    finding('C6', 'warn', `~/.tnf/agent.yaml embodiment "${fields.embodiment}" disagrees with role "${fields.role}"`);
  }
  if (fields.corporate_title) {
    finding('C6', 'warn', '~/.tnf/agent.yaml uses "corporate_title"; the corporate metaphor is deprecated by TNF_SYSTEM_LEXICON §2');
  }
}

// ---------------------------------------------------------------- C7
/**
 * Every authority grant must be traceable to an entity.
 *
 * TNF carries nine identifier systems, and until 2026-09-03 the only one that
 * authorized anything — the key of roles.json — was a bare ad-hoc string with no
 * tenant, no residency and no instance. A grant that cannot be traced to an
 * entity cannot be audited, and a role without residency cannot express the
 * difference between a user's own harness and a tenant's cloud agent.
 *
 * `did:tnf:<scope>:<category>:<provider>:<name>:<instance>` is the traceable
 * form. Legacy bare-string grants are reported as warnings, not errors — they
 * still resolve correctly and breaking them would revoke live authority.
 */
function checkGrantTraceability() {
  let identity;
  try {
    identity = require(path.join(ROOT, 'scripts/lib/tnf-identity.cjs'));
  } catch {
    return; // C1 already reported the load failure
  }
  if (typeof identity.parseAgentDid !== 'function') {
    finding('C7', 'error', 'tnf-identity exposes no did:tnf parser; authority grants cannot be traced');
    return;
  }
  let agents;
  try {
    agents = identity.loadRoleRegistry().agents || {};
  } catch {
    return;
  }
  for (const [id, entry] of Object.entries(agents)) {
    const parsed = identity.parseAgentDid(id);
    if (!parsed) {
      finding('C7', 'warn', `authority grant "${id}" is a legacy bare-string id, not a did:tnf`, {
        role: entry && entry.role,
        remedy: `re-grant as did:tnf:local:agent:tnfcli:${String(id).toLowerCase().replace(/[^a-z0-9]+/g, '_')}:001`,
        note: 'residency and tenant cannot be derived from a bare string',
      });
      continue;
    }
    if (parsed.residency === 'cloud' && !parsed.tenantId && parsed.category === 'agent') {
      finding('C7', 'warn', `cloud agent grant "${id}" names no tenant`, {
        note: 'a server-side agent should carry scope cloud_<tenantId>',
      });
    }
  }
}

function main() {
  const argv = process.argv.slice(2);
  const strict = argv.includes('--strict');
  const asJson = argv.includes('--json');

  checkRegistry();
  checkGrantTraceability();
  checkAuthorizationInputs();
  checkRoleLiteralComparisons();
  checkInventedRoles();
  checkAutonomyFailsClosed();
  checkOperatorIdentityFile();

  const errors = findings.filter((f) => f.severity === 'error');
  const warns = findings.filter((f) => f.severity === 'warn');

  if (asJson) {
    console.log(JSON.stringify({ ok: errors.length === 0, errors: errors.length, warnings: warns.length, findings }, null, 2));
  } else {
    console.log('=== TNF Role Coherence Gate ===');
    console.log(`- authority vocabulary: ${AUTHORITY_ROLES.join(' | ')}`);
    console.log(`- findings: ${errors.length} error(s), ${warns.length} warning(s)`);
    console.log('');
    for (const f of findings) {
      console.log(`${f.severity === 'error' ? '!' : '▲'} [${f.check}] ${f.message}`);
      if (f.evidence) {
        for (const [k, v] of Object.entries(f.evidence)) {
          console.log(`      ${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
        }
      }
    }
    if (errors.length === 0 && warns.length === 0) console.log('PASS — the role stack is coherent.');
    console.log('');
    console.log('Authority is granted only from an operator shell:');
    console.log('  node -e \'require("./scripts/lib/tnf-identity.cjs").setAgentRole("<agentId>","<role>")\'');
  }

  if (strict && errors.length) process.exit(1);
}

if (require.main === module) main();

module.exports = {
  AUTHORITY_ROLES,
  CLASSIFICATION_ROLES,
  INVENTED_AUTHORITY_ROLES,
  checkRegistry,
  checkAuthorizationInputs,
  checkAutonomyFailsClosed,
  checkOperatorIdentityFile,
};
