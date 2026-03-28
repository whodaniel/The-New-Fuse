export interface Env {
  ENVIRONMENT: string;
  SHAREDSTATE_BUCKET: R2Bucket;
  SHAREDSTATE_DB: D1Database;
  RECEIPT_SEQ: DurableObjectNamespace;
  SHAREDSTATE_AUTH_TOKEN?: string;
}

type ReceiptType =
  | 'deposit'
  | 'withdraw'
  | 'state_change'
  | 'note'
  | 'check'
  | 'stall'
  | 'handoff'
  | 'sync';

type Receipt = {
  id: string;
  ts: string;
  type: ReceiptType;
  by: string;
  scope: { runtime: string; agent: string; session?: string };
  perm?: { visibility?: 'private' | 'team' | 'public'; writeScope?: string };
  refs?: { kind: 'file' | 'url' | 'snapshot' | 'diff' | 'task'; ref: string; sha256?: string }[];
  data: Record<string, unknown>;
  // hash chain (v1 optional)
  prevHash?: string;
  hash?: string;
};

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers || {}),
    },
  });
}

function isoNow() {
  return new Date().toISOString();
}

function rid(prefix = 'rcpt') {
  return `${prefix}_${crypto.randomUUID()}`;
}

const DEFAULT_CRON_REGISTRY = {
  policies: {
    system_scope_edit_roles: ['SUPER_ADMIN'],
    delegated_system_scope_requires_approval: true,
    tenant_scope_edit_roles: ['USER', 'ADMIN', 'SUPER_ADMIN'],
    tenant_scope_requires_owner_match: true,
  },
  categories: [
    { category: 'system_framework', scope: 'system_framework', requires_approval: true },
    { category: 'orchestration_gate', scope: 'system_framework', requires_approval: true },
    { category: 'federation_sync', scope: 'system_framework', requires_approval: true },
    { category: 'self_improvement_core', scope: 'system_framework', requires_approval: true },
    { category: 'observability', scope: 'system_framework', requires_approval: false },
    { category: 'tenant_automation', scope: 'tenant', requires_approval: false },
    { category: 'tenant_agent_loop', scope: 'tenant', requires_approval: false },
    { category: 'tenant_experiment', scope: 'tenant', requires_approval: false },
  ],
  jobs: [],
};

const DEFAULT_SELF_EDIT_REGISTRY = {
  owners: [],
};

const CRON_REQUIRED_GATES = [
  'TENANT_SCOPE_GATE',
  'TRACE_CONTINUITY_GATE',
  'CHANNEL_MEMBERSHIP_GATE',
  'CRON_SCOPE_GATE',
  'CRON_CATEGORY_GATE',
  'CRON_OWNERSHIP_GATE',
];

const SELF_EDIT_REQUIRED_GATES = [
  'TENANT_SCOPE_GATE',
  'TRACE_CONTINUITY_GATE',
  'CHANNEL_MEMBERSHIP_GATE',
  'OWNERSHIP_GATE',
  'PATH_SCOPE_GATE',
  'CONTENT_POLICY_GATE',
  'WRITE_RATE_LIMIT_GATE',
];

const CRON_APPROVAL_CATEGORIES = new Set([
  'system_framework',
  'orchestration_gate',
  'federation_sync',
  'self_improvement_core',
]);

function toUpperSet(items: unknown): Set<string> {
  const set = new Set<string>();
  if (!Array.isArray(items)) return set;
  for (const value of items) {
    if (typeof value === 'string' && value.trim()) set.add(value.trim().toUpperCase());
  }
  return set;
}

function hasPermission(request: any, permission: string): boolean {
  const values = Array.isArray(request?.actor?.permissions) ? request.actor.permissions : [];
  const normalized = permission.trim().toLowerCase();
  return values.some(
    (entry: unknown) =>
      String(entry || '')
        .trim()
        .toLowerCase() === normalized
  );
}

function gateMap(gateDecisions: unknown): Map<string, any> {
  const map = new Map<string, any>();
  if (!Array.isArray(gateDecisions)) return map;
  for (const entry of gateDecisions) {
    const gate = entry?.gate;
    if (typeof gate === 'string' && gate.trim()) {
      map.set(gate, entry);
    }
  }
  return map;
}

function isSuperAdmin(request: any): boolean {
  const roles = toUpperSet(request?.actor?.roles);
  return roles.has('SUPER_ADMIN') || roles.has('SYSTEM') || hasPermission(request, 'system:access');
}

function hasTenantMutationRole(request: any, registry: any): boolean {
  const roles = toUpperSet(request?.actor?.roles);
  const allowed = new Set<string>(
    Array.isArray(registry?.policies?.tenant_scope_edit_roles)
      ? registry.policies.tenant_scope_edit_roles.map((entry: any) => String(entry).toUpperCase())
      : []
  );
  for (const role of roles) {
    if (allowed.has(role)) return true;
  }
  return false;
}

function cronExpressionLooksValid(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  const text = String(value).trim();
  if (!text) return false;
  const parts = text.split(/\s+/);
  return parts.length >= 5 && parts.length <= 7;
}

function evaluateCronGovernanceRequest(request: any, providedRegistry?: any) {
  const registry = providedRegistry || DEFAULT_CRON_REGISTRY;
  const reasons: string[] = [];
  const target = request?.target || {};
  const scheduleId = String(target.schedule_id || '');
  const scope = String(target.scope || '');
  const category = String(target.category || '');
  const gates = gateMap(request?.gate_decisions);
  const superAdmin = isSuperAdmin(request);
  const categoryConfig = Array.isArray(registry?.categories)
    ? registry.categories.find((entry: any) => entry.category === category)
    : null;
  const jobConfig = Array.isArray(registry?.jobs)
    ? registry.jobs.find((entry: any) => entry.schedule_id === scheduleId)
    : null;

  if (!request || typeof request !== 'object') reasons.push('request must be an object');
  if (!request?.tenant_id) reasons.push('tenant_id is required');
  if (!target?.schedule_id) reasons.push('target.schedule_id is required');
  if (!target?.scope) reasons.push('target.scope is required');
  if (!target?.category) reasons.push('target.category is required');

  if ((request?.tenant_id || '') !== (request?.cumulative_id?.scope?.tenant_id || '')) {
    reasons.push('tenant mismatch between request and cumulative scope');
  }
  if (
    request?.cumulative_id?.lineage?.schedule_id &&
    request?.cumulative_id?.lineage?.schedule_id !== scheduleId
  ) {
    reasons.push('cumulative lineage schedule_id must match target.schedule_id');
  }

  for (const gateName of CRON_REQUIRED_GATES) {
    const gate = gates.get(gateName);
    if (!gate) reasons.push(`missing required gate: ${gateName}`);
    else if (gate.decision !== 'allow') reasons.push(`required gate ${gateName} is not allow`);
  }

  if (!categoryConfig) {
    reasons.push(`category ${category} is not registered`);
  } else if (String(categoryConfig.scope || '') !== scope) {
    reasons.push(`target.scope ${scope} does not match category scope ${categoryConfig.scope}`);
  }

  if (!cronExpressionLooksValid(target?.cron_expression)) {
    reasons.push('target.cron_expression token pattern is invalid');
  }

  if (scope === 'system_framework') {
    const delegated = Boolean(request?.delegation?.delegated_by_super_admin);
    const approvalGate = gates.get('APPROVAL_GATE');
    const approvalAllowed = Boolean(approvalGate && approvalGate.decision === 'allow');
    if (!superAdmin && !(delegated && approvalAllowed)) {
      reasons.push(
        'system_framework scope requires SUPER_ADMIN or delegated_by_super_admin + APPROVAL_GATE=allow'
      );
    }
  }

  if (scope === 'tenant') {
    if (!superAdmin && !hasTenantMutationRole(request, registry)) {
      reasons.push('actor lacks tenant cron mutation role');
    }

    if (registry?.policies?.tenant_scope_requires_owner_match) {
      if (
        request?.actor?.kind === 'user' &&
        target?.owner_user_id &&
        request?.actor?.user_id !== target.owner_user_id
      ) {
        reasons.push('tenant user mutation requires owner_user_id match');
      }
      if (
        request?.actor?.kind === 'agent' &&
        target?.owner_agent_id &&
        request?.actor?.agent_id !== target.owner_agent_id
      ) {
        reasons.push('tenant agent mutation requires owner_agent_id match');
      }
    }
  }

  if (jobConfig?.locked && !superAdmin) {
    reasons.push(`schedule_id ${scheduleId} is locked and requires SUPER_ADMIN`);
  }

  const requiresApproval =
    scope === 'system_framework' ||
    CRON_APPROVAL_CATEGORIES.has(category) ||
    Boolean(categoryConfig?.requires_approval);
  if (requiresApproval) {
    const approvalGate = gates.get('APPROVAL_GATE');
    if (!approvalGate || approvalGate.decision !== 'allow') {
      reasons.push('APPROVAL_GATE=allow is required for this scope/category');
    }
  }

  return {
    ok: reasons.length === 0,
    decision: reasons.length === 0 ? 'allow' : 'deny',
    reasons,
    scope,
    category,
    schedule_id: scheduleId,
  };
}

function escapeRegex(input: string): string {
  return input.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

function globToRegex(globPattern: string): RegExp {
  const normalized = globPattern.trim();
  if (!normalized) return /^$/;
  const placeholder = '__DOUBLE_STAR__';
  const singleReplaced = normalized.replace(/\*\*/g, placeholder);
  const escaped = escapeRegex(singleReplaced)
    .replace(new RegExp(placeholder, 'g'), '.*')
    .replace(/\\\*/g, '[^/]*');
  return new RegExp(`^${escaped}$`);
}

function matchesPattern(value: string, patterns: unknown): boolean {
  if (!Array.isArray(patterns) || patterns.length === 0) return false;
  return patterns.some((pattern) => {
    if (typeof pattern !== 'string') return false;
    return globToRegex(pattern).test(value);
  });
}

function evaluateAgentSelfEditRequest(request: any, providedRegistry?: any) {
  const registry = providedRegistry || DEFAULT_SELF_EDIT_REGISTRY;
  const reasons: string[] = [];
  const target = request?.target || {};
  const operation = request?.operation || {};
  const gateByName = gateMap(request?.gate_decisions);
  const pathValue = String(target?.path || '');
  const ownerAgentId = String(target?.owner_agent_id || '');
  const actorAgentId = String(request?.agent?.agent_id || '');

  if (!request || typeof request !== 'object') reasons.push('request must be an object');
  if (!request?.tenant_id) reasons.push('tenant_id is required');
  if (!actorAgentId) reasons.push('agent.agent_id is required');
  if (!pathValue) reasons.push('target.path is required');
  if (!ownerAgentId) reasons.push('target.owner_agent_id is required');
  if (!operation?.mode) reasons.push('operation.mode is required');

  if ((request?.tenant_id || '') !== (request?.cumulative_id?.scope?.tenant_id || '')) {
    reasons.push('tenant mismatch between request and cumulative scope');
  }

  if (ownerAgentId && actorAgentId && ownerAgentId !== actorAgentId) {
    reasons.push('agent.agent_id must match target.owner_agent_id');
  }

  if (pathValue.startsWith('/') || pathValue.includes('..')) {
    reasons.push('target.path must be relative and cannot traverse directories');
  }

  const ownerRecord = Array.isArray(registry?.owners)
    ? registry.owners.find((entry: any) => entry?.owner_agent_id === ownerAgentId)
    : null;

  if (!ownerRecord) {
    reasons.push(`owner registry entry missing for ${ownerAgentId || 'unknown_owner'}`);
  } else {
    if (!matchesPattern(pathValue, ownerRecord.allowed_paths)) {
      reasons.push('target.path is outside allowed_paths for owner');
    }
  }

  const needsApproval =
    Boolean(request?.approval?.required) ||
    Boolean(ownerRecord && matchesPattern(pathValue, ownerRecord.approval_required_paths));

  const requiredGates = needsApproval
    ? [...SELF_EDIT_REQUIRED_GATES, 'APPROVAL_GATE']
    : [...SELF_EDIT_REQUIRED_GATES];

  for (const gateName of requiredGates) {
    const gate = gateByName.get(gateName);
    if (!gate) reasons.push(`missing required gate: ${gateName}`);
    else if (gate.decision !== 'allow') reasons.push(`required gate ${gateName} is not allow`);
  }

  if (needsApproval && !request?.approval?.approved) {
    reasons.push('approval.required path is not approved');
  }

  return {
    ok: reasons.length === 0,
    decision: reasons.length === 0 ? 'allow' : 'deny',
    reasons,
    target_path: pathValue,
    owner_agent_id: ownerAgentId,
    approval_required: needsApproval,
  };
}

function evaluateFederationPacket(request: any) {
  const reasons: string[] = [];
  const gates = gateMap(request?.gateDecisions ?? request?.gate_decisions);
  const scopeTenant = String(request?.scope?.tenantId || request?.scope?.tenant_id || '');
  const mcidTenant = String(
    request?.cumulativeId?.scope?.tenant_id || request?.cumulative_id?.scope?.tenant_id || ''
  );
  const tags: string[] = Array.isArray(request?.tags)
    ? request.tags.map((entry: any) => String(entry))
    : [];
  const twid =
    request?.payload?.twipRef?.twid ||
    request?.payload?.twip_ref?.twid ||
    request?.cumulativeId?.lineage?.twid ||
    request?.cumulative_id?.lineage?.twid ||
    null;

  if (!scopeTenant) reasons.push('scope tenant is required');
  if (!mcidTenant) reasons.push('cumulative tenant is required');
  if (scopeTenant && mcidTenant && scopeTenant !== mcidTenant) {
    reasons.push('tenant mismatch between scope and cumulative_id');
  }

  for (const gateName of [
    'TENANT_SCOPE_GATE',
    'TRACE_CONTINUITY_GATE',
    'TERMINAL_BINDING_GATE',
    'HIGH_RISK_RUNTIME_GATE',
    'CHANNEL_MEMBERSHIP_GATE',
  ]) {
    const gate = gates.get(gateName);
    if (!gate) reasons.push(`missing required gate: ${gateName}`);
    else if (gate.decision !== 'allow') reasons.push(`required gate ${gateName} is not allow`);
  }

  const terminalBound =
    tags.includes('terminal-bound') ||
    Boolean(request?.payload?.twipRef || request?.payload?.twip_ref);
  if (terminalBound && !twid) {
    reasons.push('terminal-bound packet requires twid');
  }

  return {
    ok: reasons.length === 0,
    decision: reasons.length === 0 ? 'allow' : 'deny',
    reasons,
    tenant_id: scopeTenant || mcidTenant || null,
    terminal_bound: terminalBound,
    twid,
  };
}

function isLocalEnvironment(value: string | undefined): boolean {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  return ['local', 'localhost', 'devlocal', 'test'].includes(normalized);
}

function isLocalRuntimeRequest(req: Request, env: Env): boolean {
  if (isLocalEnvironment(env.ENVIRONMENT)) return true;
  try {
    const hostname = new URL(req.url).hostname.toLowerCase();
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return false;
  }
}

function authorized(req: Request, env: Env, localRuntime: boolean) {
  if (!env.SHAREDSTATE_AUTH_TOKEN) {
    return localRuntime;
  }
  const token = req.headers.get('x-auth-token');
  return token === env.SHAREDSTATE_AUTH_TOKEN;
}

async function readJson(req: Request) {
  const ct = req.headers.get('content-type') || '';
  if (!ct.includes('application/json')) throw new Error('CONTENT_TYPE_NOT_JSON');
  return (await req.json()) as any;
}

export class ReceiptSequencer implements DurableObject {
  private state: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === '/seq/status') {
      const last = (await this.state.storage.get<string>('lastHash')) || null;
      return json({ ok: true, lastHash: last });
    }

    if (url.pathname === '/seq/append' && req.method === 'POST') {
      const body = await req.json<Receipt>();
      const last = (await this.state.storage.get<string>('lastHash')) || null;

      // v1 hash-chain placeholder: prevHash points to prior receipt hash/id.
      body.prevHash = last || undefined;
      const newLast = body.hash || body.id;

      const day = body.ts.slice(0, 10); // YYYY-MM-DD
      const key = `receipts/${day}/receipts.jsonl`;
      const line = JSON.stringify(body) + '\n';

      // Serialized by DO instance: safe append semantics at canonical writer.
      const existing = await this.env.SHAREDSTATE_BUCKET.get(key);
      const prevText = existing ? await existing.text() : '';
      await this.env.SHAREDSTATE_BUCKET.put(key, prevText + line, {
        httpMetadata: { contentType: 'application/jsonl' },
      });

      await this.state.storage.put('lastHash', newLast);
      await this.state.storage.put('lastReceiptTs', body.ts);

      return json({ ok: true, receipt: body, lastHash: newLast, receiptLog: key });
    }

    return json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });
  }
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

type FinalizeMirrorArgs = {
  runtime: string;
  ts: string;
  by: string;
  agent: string;
  visibility: 'private' | 'team' | 'public';
  prefix: string;
  blobKey: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  blobSha256?: string;
};

async function finalizeMirrorMetadata(env: Env, args: FinalizeMirrorArgs) {
  const {
    runtime,
    ts,
    by,
    agent,
    visibility,
    prefix,
    blobKey,
    filename,
    contentType,
    sizeBytes,
    blobSha256,
  } = args;
  const manifestKey = `${prefix}/manifest.json`;

  const manifest = {
    runtime,
    ts,
    filename,
    contentType,
    sizeBytes,
    blobKey,
    blobSha256,
    note: 'Sanitized filesystem snapshot recorded. Ensure excludes/redaction were applied client-side.',
  };

  const manifestText = JSON.stringify(manifest, null, 2);
  const digest = await sha256Hex(manifestText);
  await env.SHAREDSTATE_BUCKET.put(manifestKey, manifestText, {
    httpMetadata: { contentType: 'application/json; charset=utf-8' },
  });

  const mid = rid('mir');
  await env.SHAREDSTATE_DB.batch([
    env.SHAREDSTATE_DB.prepare(
      `INSERT INTO mirror_history (id, runtime, created_at, r2_prefix, manifest_key, sha256, size_bytes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(mid, runtime, ts, prefix, manifestKey, digest, sizeBytes),
    env.SHAREDSTATE_DB.prepare(
      `INSERT INTO mirror_latest (runtime, updated_at, r2_prefix, manifest_key, sha256, size_bytes)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(runtime) DO UPDATE SET
         updated_at=excluded.updated_at,
         r2_prefix=excluded.r2_prefix,
         manifest_key=excluded.manifest_key,
         sha256=excluded.sha256,
         size_bytes=excluded.size_bytes`
    ).bind(runtime, ts, prefix, manifestKey, digest, sizeBytes),
  ]);

  const receipt: Receipt = {
    id: rid('rcpt'),
    ts,
    type: 'sync',
    by,
    scope: { runtime, agent },
    perm: { visibility, writeScope: 'sharedstate' },
    refs: [
      { kind: 'file', ref: blobKey, sha256: blobSha256 },
      { kind: 'file', ref: manifestKey, sha256: digest },
    ],
    data: {
      action: 'mirror_filesystem_snapshot',
      runtime,
      r2_prefix: prefix,
      blobKey,
      manifestKey,
      sizeBytes,
      blobSha256,
    },
  };

  const appended = await appendReceipt(env, receipt);
  return {
    ok: true,
    runtime,
    mirror: { ts, prefix, blobKey, manifestKey, sizeBytes, blobSha256 },
    receipt,
    receiptLog: appended.key,
  };
}

async function appendReceipt(env: Env, receipt: Receipt) {
  // Canonical write path is DO-serialized append to avoid R2 concurrent write races.
  const id = env.RECEIPT_SEQ.idFromName('canonical');
  const stub = env.RECEIPT_SEQ.get(id);
  const seqRes = await stub.fetch('https://do/seq/append', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(receipt),
  });
  const seqJson = (await seqRes.json().catch(() => null)) as any;

  return { key: seqJson?.receiptLog, sequencer: seqJson };
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const localRuntime = isLocalRuntimeRequest(req, env);
    const authConfigured = Boolean(env.SHAREDSTATE_AUTH_TOKEN);

    if (url.pathname === '/health') {
      const healthy = authConfigured || localRuntime;
      return json(
        {
          ok: healthy,
          env: env.ENVIRONMENT,
          localRuntime,
          authConfigured,
          authRequired: !localRuntime,
        },
        { status: healthy ? 200 : 503 }
      );
    }

    if (!authConfigured && !localRuntime) {
      return json(
        {
          ok: false,
          error: 'MISCONFIGURED_MISSING_SECRET',
          missing: ['SHAREDSTATE_AUTH_TOKEN'],
        },
        { status: 503 }
      );
    }

    if (!authorized(req, env, localRuntime)) {
      return json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    if (url.pathname === '/gates/cron/evaluate' && req.method === 'POST') {
      const body = await readJson(req);
      const request = body?.request ?? body;
      const registry = body?.registry ?? DEFAULT_CRON_REGISTRY;
      const evaluation = evaluateCronGovernanceRequest(request, registry);
      return json(evaluation, { status: evaluation.ok ? 200 : 422 });
    }

    if (url.pathname === '/gates/self-edit/evaluate' && req.method === 'POST') {
      const body = await readJson(req);
      const request = body?.request ?? body;
      const registry = body?.registry ?? DEFAULT_SELF_EDIT_REGISTRY;
      const evaluation = evaluateAgentSelfEditRequest(request, registry);
      return json(evaluation, { status: evaluation.ok ? 200 : 422 });
    }

    if (url.pathname === '/gates/federation/evaluate' && req.method === 'POST') {
      const body = await readJson(req);
      const request = body?.request ?? body;
      const evaluation = evaluateFederationPacket(request);
      return json(evaluation, { status: evaluation.ok ? 200 : 422 });
    }

    // POST /deposit — canonical receipt deposit
    if (url.pathname === '/deposit' && req.method === 'POST') {
      const body = await readJson(req);

      const receipt: Receipt = {
        id: body?.id || rid('rcpt'),
        ts: body?.ts || isoNow(),
        type: body?.type || 'deposit',
        by: body?.by || 'unknown',
        scope: body?.scope || { runtime: 'unknown', agent: 'unknown' },
        perm: body?.perm,
        refs: body?.refs,
        data: body?.data || {},
      };

      const appended = await appendReceipt(env, receipt);
      return json({ ok: true, receipt, receiptLog: appended.key, sequencer: appended.sequencer });
    }

    // PUT /mirror/:runtime — upload a context pack + pointers
    if (url.pathname.startsWith('/mirror/') && req.method === 'PUT') {
      const runtime = decodeURIComponent(url.pathname.slice('/mirror/'.length)).trim();
      if (!runtime) return json({ ok: false, error: 'RUNTIME_REQUIRED' }, { status: 400 });

      const body = await readJson(req);
      const contextPack = body?.contextPack;
      const by = body?.by || 'unknown';
      const agent = body?.agent || 'unknown';
      const visibility = body?.visibility || 'team';

      if (!contextPack || typeof contextPack !== 'object') {
        return json({ ok: false, error: 'CONTEXT_PACK_REQUIRED' }, { status: 400 });
      }

      const ts = isoNow();
      const payloadText = JSON.stringify(
        {
          runtime,
          ts,
          contextPack,
        },
        null,
        2
      );

      const digest = await sha256Hex(payloadText);
      const key = `context/${runtime}/${ts}.json`;
      await env.SHAREDSTATE_BUCKET.put(key, payloadText, {
        httpMetadata: { contentType: 'application/json; charset=utf-8' },
      });

      // Update D1 latest pointer + history
      const sizeBytes = payloadText.length;
      const id = rid('ctx');
      await env.SHAREDSTATE_DB.batch([
        env.SHAREDSTATE_DB.prepare(
          `INSERT INTO context_history (id, runtime, created_at, r2_key, sha256, size_bytes)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(id, runtime, ts, key, digest, sizeBytes),
        env.SHAREDSTATE_DB.prepare(
          `INSERT INTO context_latest (runtime, updated_at, r2_key, sha256, size_bytes)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(runtime) DO UPDATE SET
             updated_at=excluded.updated_at,
             r2_key=excluded.r2_key,
             sha256=excluded.sha256,
             size_bytes=excluded.size_bytes`
        ).bind(runtime, ts, key, digest, sizeBytes),
      ]);

      const receipt: Receipt = {
        id: rid('rcpt'),
        ts,
        type: 'sync',
        by,
        scope: { runtime, agent },
        perm: { visibility, writeScope: 'sharedstate' },
        refs: [
          { kind: 'file', ref: key, sha256: digest },
          { kind: 'task', ref: 'context-pack' },
        ],
        data: { action: 'mirror_context_pack', runtime, r2_key: key, sha256: digest, sizeBytes },
      };

      const appended = await appendReceipt(env, receipt);
      return json({
        ok: true,
        runtime,
        context: { ts, r2_key: key, sha256: digest, sizeBytes },
        receipt,
        receiptLog: appended.key,
      });
    }

    // GET /context/:runtime — fetch latest context pack pointer (+ optionally inline)
    if (url.pathname.startsWith('/context/') && req.method === 'GET') {
      const runtime = decodeURIComponent(url.pathname.slice('/context/'.length)).trim();
      if (!runtime) return json({ ok: false, error: 'RUNTIME_REQUIRED' }, { status: 400 });

      const row = await env.SHAREDSTATE_DB.prepare(
        `SELECT runtime, updated_at, r2_key, sha256, size_bytes FROM context_latest WHERE runtime = ?`
      )
        .bind(runtime)
        .first<any>();

      if (!row) return json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });

      const inline = url.searchParams.get('inline') === '1';
      let payload: unknown = undefined;
      if (inline) {
        const obj = await env.SHAREDSTATE_BUCKET.get(row.r2_key);
        payload = obj ? await obj.json() : null;
      }

      return json({ ok: true, latest: row, inline: inline ? payload : undefined });
    }

    // POST /withdraw — query latest context pointers and optionally inline payload
    if (url.pathname === '/withdraw' && req.method === 'POST') {
      const body = await readJson(req);
      const by = body?.by || 'unknown';
      const agent = body?.agent || 'unknown';

      const runtimes: string[] = Array.isArray(body?.runtimes)
        ? body.runtimes.map((r: any) => String(r))
        : body?.runtime
          ? [String(body.runtime)]
          : [];

      if (runtimes.length === 0) {
        return json({ ok: false, error: 'RUNTIME_REQUIRED' }, { status: 400 });
      }

      const inline = Boolean(body?.inline);
      const results: any[] = [];

      for (const runtime of runtimes) {
        const row = await env.SHAREDSTATE_DB.prepare(
          `SELECT runtime, updated_at, r2_key, sha256, size_bytes FROM context_latest WHERE runtime = ?`
        )
          .bind(runtime)
          .first<any>();

        if (!row) {
          results.push({ runtime, found: false });
          continue;
        }

        let payload: unknown = undefined;
        if (inline) {
          const obj = await env.SHAREDSTATE_BUCKET.get(row.r2_key);
          payload = obj ? await obj.json() : null;
        }

        results.push({ runtime, found: true, latest: row, inline: inline ? payload : undefined });
      }

      // store withdraw history + receipt
      const ts = isoNow();
      const wid = rid('wd');
      const queryText = JSON.stringify({ runtimes, inline });
      await env.SHAREDSTATE_DB.prepare(
        `INSERT INTO withdraw_history (id, runtime, created_at, query, result_count, r2_key) VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind(wid, runtimes.length === 1 ? runtimes[0] : null, ts, queryText, results.length, null)
        .run();

      const receipt: Receipt = {
        id: rid('rcpt'),
        ts,
        type: 'withdraw',
        by,
        scope: { runtime: 'tnf', agent },
        perm: { visibility: 'team', writeScope: 'sharedstate' },
        refs: results
          .filter((r) => r.found)
          .map((r) => ({ kind: 'file' as const, ref: r.latest.r2_key, sha256: r.latest.sha256 })),
        data: {
          action: 'withdraw_context',
          runtimes,
          inline,
          withdrawId: wid,
          resultCount: results.length,
        },
      };

      const appended = await appendReceipt(env, receipt);
      return json({ ok: true, results, receipt, receiptLog: appended.key });
    }

    // PUT /mirrorfs/:runtime — upload a sanitized filesystem snapshot tarball (or any binary)
    // NOTE: subject to Workers request body size limits.
    if (url.pathname.startsWith('/mirrorfs/') && req.method === 'PUT') {
      const runtime = decodeURIComponent(url.pathname.slice('/mirrorfs/'.length)).trim();
      if (!runtime) return json({ ok: false, error: 'RUNTIME_REQUIRED' }, { status: 400 });

      const by = req.headers.get('x-by') || 'unknown';
      const agent = req.headers.get('x-agent') || 'unknown';
      const visibility = (req.headers.get('x-visibility') || 'team') as any;
      const filename = req.headers.get('x-filename') || 'fs-snapshot.tar.gz';
      const contentType = req.headers.get('content-type') || 'application/octet-stream';

      const buf = await req.arrayBuffer();
      const sizeBytes = buf.byteLength;
      const ts = isoNow();
      const prefix = `mirrors/${runtime}/${ts}`;
      const blobKey = `${prefix}/${filename}`;

      await env.SHAREDSTATE_BUCKET.put(blobKey, buf, { httpMetadata: { contentType } });

      const result = await finalizeMirrorMetadata(env, {
        runtime,
        ts,
        by,
        agent,
        visibility,
        prefix,
        blobKey,
        filename,
        contentType,
        sizeBytes,
        blobSha256: undefined,
      });

      return json(result);
    }

    // POST /mirrorfs_ref/:runtime — for large snapshots uploaded out-of-band (e.g., wrangler r2 object put)
    if (url.pathname.startsWith('/mirrorfs_ref/') && req.method === 'POST') {
      const runtime = decodeURIComponent(url.pathname.slice('/mirrorfs_ref/'.length)).trim();
      if (!runtime) return json({ ok: false, error: 'RUNTIME_REQUIRED' }, { status: 400 });

      const body = await readJson(req);
      const by = body?.by || 'unknown';
      const agent = body?.agent || 'unknown';
      const visibility = body?.visibility || 'team';

      const ts = body?.ts || isoNow();
      const prefix = body?.prefix || `mirrors/${runtime}/${ts}`;
      const blobKey = body?.blobKey;
      const filename = body?.filename || 'fs-snapshot.tar.gz';
      const contentType = body?.contentType || 'application/octet-stream';
      const sizeBytes = Number(body?.sizeBytes || 0);
      const blobSha256 = body?.blobSha256;

      if (!blobKey || typeof blobKey !== 'string') {
        return json({ ok: false, error: 'BLOBKEY_REQUIRED' }, { status: 400 });
      }

      const result = await finalizeMirrorMetadata(env, {
        runtime,
        ts,
        by,
        agent,
        visibility,
        prefix,
        blobKey,
        filename,
        contentType,
        sizeBytes,
        blobSha256,
      });

      return json(result);
    }

    return json(
      {
        ok: false,
        error: 'NOT_IMPLEMENTED',
        routes: [
          '/health',
          'POST /deposit',
          'POST /gates/cron/evaluate',
          'POST /gates/self-edit/evaluate',
          'POST /gates/federation/evaluate',
          'PUT /mirror/:runtime',
          'GET /context/:runtime',
          'POST /withdraw',
          'PUT /mirrorfs/:runtime',
        ],
      },
      { status: 404 }
    );
  },
};
