/**
 * WorkflowGraphBridge — persist AI-designed graphs into the SAME shape the
 * visual builder / API use ({ nodes, edges } definition).
 *
 * Local authoritative mirror: ~/.tnf/workflow-graphs/ (NOT ~/.tnf/tasks).
 * Optional push to Nest POST/PATCH {base}/api/workflows when TNF_API_URL is set
 * and sync is requested (--sync-api / syncApi / TNF_DURABLE_SYNC_WORKFLOW_API=1).
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as http from 'node:http';
import * as https from 'node:https';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  designToolCallsToWorkflowSpec,
  workflowSpecToPersistedGraph,
  type AiWorkflowSpec,
  type DesignToolCallLike,
  type PersistedWorkflowGraphDoc,
} from '@the-new-fuse/shared';

function nowIso(): string {
  return new Date().toISOString();
}

function requestJson(
  url: string,
  method: string,
  body?: unknown,
  headers: Record<string, string> = {}
): Promise<{ status: number; json: any }> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const req = lib.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port,
        path: `${u.pathname}${u.search}`,
        method,
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          ...(payload ? { 'content-length': String(Buffer.byteLength(payload)) } : {}),
          ...headers,
        },
        timeout: 20_000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          let json: any = null;
          try {
            json = text ? JSON.parse(text) : null;
          } catch {
            json = { raw: text };
          }
          resolve({ status: res.statusCode || 0, json });
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`request timeout: ${url}`));
    });
    if (payload) req.write(payload);
    req.end();
  });
}

/**
 * Resolve Nest workflows base URL.
 * Accepts host, /api, or /api/workflows → always …/api/workflows
 */
export function resolveWorkflowsApiBase(
  raw: string = process.env.TNF_API_URL || process.env.VITE_API_URL || ''
): string {
  let base = String(raw || '').trim().replace(/\/$/, '');
  if (!base) return '';
  if (base.endsWith('/workflows')) return base;
  if (base.endsWith('/api')) return `${base}/workflows`;
  return `${base}/api/workflows`;
}

export type WorkflowApiSyncResult = {
  ok: boolean;
  id?: string;
  error?: string;
  status?: number;
  method?: 'POST' | 'PATCH';
  url?: string;
};

export class WorkflowGraphBridge {
  private readonly root: string;

  constructor(rootDir?: string) {
    this.root = path.resolve(
      rootDir || path.join(os.homedir(), '.tnf', 'workflow-graphs')
    );
    const forbidden = path.resolve(path.join(os.homedir(), '.tnf', 'tasks'));
    if (this.root === forbidden) {
      throw new Error('WorkflowGraphBridge must not use ~/.tnf/tasks');
    }
    fs.mkdirSync(this.root, { recursive: true });
  }

  private fileFor(id: string): string {
    const safe = id.replace(/[^a-zA-Z0-9._-]/g, '_');
    return path.join(this.root, `${safe}.json`);
  }

  list(): PersistedWorkflowGraphDoc[] {
    if (!fs.existsSync(this.root)) return [];
    return fs
      .readdirSync(this.root)
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        try {
          return JSON.parse(
            fs.readFileSync(path.join(this.root, f), 'utf8')
          ) as PersistedWorkflowGraphDoc;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as PersistedWorkflowGraphDoc[];
  }

  get(id: string): PersistedWorkflowGraphDoc | undefined {
    const p = this.fileFor(id);
    if (!fs.existsSync(p)) return undefined;
    try {
      return JSON.parse(fs.readFileSync(p, 'utf8')) as PersistedWorkflowGraphDoc;
    } catch {
      return undefined;
    }
  }

  save(doc: PersistedWorkflowGraphDoc): PersistedWorkflowGraphDoc {
    const next = { ...doc, updatedAt: nowIso() };
    if (!next.createdAt) next.createdAt = nowIso();
    fs.writeFileSync(this.fileFor(next.id), JSON.stringify(next, null, 2));
    return next;
  }

  applyDesign(input: {
    prompt?: string;
    projectId?: string;
    roomId?: string;
    toolCalls?: DesignToolCallLike[];
    workflowSpec?: AiWorkflowSpec;
    nodes?: Array<Record<string, unknown>>;
    edges?: Array<Record<string, unknown>>;
    workflowId?: string;
    name?: string;
    description?: string;
  }): {
    spec: AiWorkflowSpec;
    graph: PersistedWorkflowGraphDoc;
    builderPath: string;
    apiSynced: boolean;
    apiId?: string;
  } {
    const spec =
      input.workflowSpec && Array.isArray(input.workflowSpec.nodes)
        ? input.workflowSpec
        : designToolCallsToWorkflowSpec({
            prompt: input.prompt,
            projectId: input.projectId,
            roomId: input.roomId,
            toolCalls: input.toolCalls,
            nodes: input.nodes,
            edges: input.edges,
            name: input.name,
            description: input.description,
          });

    const graph = workflowSpecToPersistedGraph(spec, input.workflowId);
    this.save(graph);

    return {
      spec,
      graph,
      builderPath: `/workflows/builder?id=${encodeURIComponent(graph.id)}&source=local-ai`,
      apiSynced: false,
      apiId: undefined,
    };
  }

  async applyDesignAndSync(
    input: Parameters<WorkflowGraphBridge['applyDesign']>[0] & {
      syncApi?: boolean;
      token?: string;
    }
  ): Promise<{
    spec: AiWorkflowSpec;
    graph: PersistedWorkflowGraphDoc;
    builderPath: string;
    apiSynced: boolean;
    apiId?: string;
    apiSync?: WorkflowApiSyncResult;
  }> {
    const applied = this.applyDesign(input);
    const wantSync =
      input.syncApi === true ||
      process.env.TNF_DURABLE_SYNC_WORKFLOW_API === '1' ||
      process.env.TNF_DURABLE_SYNC_WORKFLOW_API === 'true';

    if (!wantSync) return { ...applied };

    const sync = await this.syncToApi(applied.graph, { token: input.token });
    if (sync.ok && sync.id) {
      const oldId = applied.graph.id;
      const merged: PersistedWorkflowGraphDoc = {
        ...applied.graph,
        id: sync.id,
        source: 'durable-design-agent+api',
        updatedAt: nowIso(),
      };
      this.save(merged);
      if (oldId !== sync.id) {
        const stale = this.fileFor(oldId);
        if (fs.existsSync(stale)) {
          try {
            fs.unlinkSync(stale);
          } catch {
            /* ignore */
          }
        }
      }
      return {
        spec: applied.spec,
        graph: merged,
        builderPath: `/workflows/builder?id=${encodeURIComponent(sync.id)}`,
        apiSynced: true,
        apiId: sync.id,
        apiSync: sync,
      };
    }

    return { ...applied, apiSynced: false, apiSync: sync };
  }

  async syncToApi(
    graph: PersistedWorkflowGraphDoc,
    options: { token?: string; forcePatch?: boolean } = {}
  ): Promise<WorkflowApiSyncResult> {
    const workflowsBase = resolveWorkflowsApiBase();
    if (!workflowsBase) {
      return { ok: false, error: 'TNF_API_URL (or VITE_API_URL) not set' };
    }

    const headers: Record<string, string> = {};
    const token =
      options.token ||
      process.env.TNF_API_TOKEN ||
      process.env.TNF_SUPER_ADMIN_TOKEN ||
      process.env.TNF_AUTH_TOKEN;
    if (token) headers.authorization = `Bearer ${token}`;

    const body = {
      name: graph.name,
      description: graph.description || '',
      nodes: graph.nodes,
      edges: graph.edges,
      tags: graph.tags || ['ai-designed', 'durable-task'],
      version: graph.version || 1,
      status: 'DRAFT',
      triggers: [],
      variables: {
        source: graph.source || 'durable-design-agent',
        localGraphId: graph.id,
      },
    };

    try {
      const looksLikeUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          graph.id
        );

      if (options.forcePatch || looksLikeUuid) {
        const patchUrl = `${workflowsBase}/${encodeURIComponent(graph.id)}`;
        const patched = await requestJson(patchUrl, 'PATCH', body, headers);
        if (patched.status >= 200 && patched.status < 300) {
          return {
            ok: true,
            id: graph.id,
            status: patched.status,
            method: 'PATCH',
            url: patchUrl,
          };
        }
        if (patched.status !== 404) {
          return {
            ok: false,
            status: patched.status,
            method: 'PATCH',
            url: patchUrl,
            error: `API PATCH ${patched.status}: ${JSON.stringify(patched.json).slice(0, 300)}`,
          };
        }
      }

      const created = await requestJson(workflowsBase, 'POST', body, headers);
      if (created.status >= 200 && created.status < 300) {
        const id =
          created.json?.id ||
          created.json?.data?.id ||
          created.json?.workflow?.id ||
          graph.id;
        return {
          ok: true,
          id: String(id),
          status: created.status,
          method: 'POST',
          url: workflowsBase,
        };
      }

      return {
        ok: false,
        status: created.status,
        method: 'POST',
        url: workflowsBase,
        error: `API POST ${created.status}: ${JSON.stringify(created.json).slice(0, 300)}`,
      };
    } catch (err: any) {
      return { ok: false, error: err?.message || String(err) };
    }
  }

  latest(): PersistedWorkflowGraphDoc | undefined {
    return this.list().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  }

  newId(): string {
    return `wf_${crypto.randomBytes(8).toString('hex')}`;
  }
}
