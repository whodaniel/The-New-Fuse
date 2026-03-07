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

function authorized(req: Request, env: Env) {
  // Hardening: Fail closed unless strictly in 'dev' environment
  if (!env.SHAREDSTATE_AUTH_TOKEN) {
    return env.ENVIRONMENT === 'dev';
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

    if (url.pathname === '/health') {
      return json({
        ok: true,
        env: env.ENVIRONMENT,
        authConfigured: Boolean(env.SHAREDSTATE_AUTH_TOKEN),
      });
    }

    if (!authorized(req, env)) {
      return json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
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
