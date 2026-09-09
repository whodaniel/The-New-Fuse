/**
 * Minimal WordPress REST client using Application Passwords.
 * TNF is the hub; WordPress is only a content/metadata sink.
 */

export interface WordpressCredentials {
  siteUrl: string;
  username: string;
  appPassword: string;
}

export interface WpPublishInput {
  title: string;
  content: string;
  status: 'draft' | 'publish' | 'pending';
  categories?: string[];
  tags?: string[];
  slug?: string;
  meta?: Record<string, unknown>;
  featuredMediaId?: number;
}

export interface WpContentGraphItem {
  id: number;
  title: string;
  slug: string;
  link: string;
  status: string;
  categories: number[];
  modified: string;
}

function normalizeSiteUrl(url: string): string {
  return url.trim().replace(/\/$/, '');
}

function basicAuthHeader(username: string, appPassword: string): string {
  const raw = `${username}:${appPassword.replace(/\s+/g, '')}`;
  const token =
    typeof Buffer !== 'undefined' ? Buffer.from(raw, 'utf8').toString('base64') : btoa(raw);
  return `Basic ${token}`;
}

export class WordpressRestClient {
  private readonly base: string;
  private readonly siteRoot: string;
  private readonly auth: string;

  constructor(creds: WordpressCredentials) {
    this.siteRoot = normalizeSiteUrl(creds.siteUrl);
    this.base = `${this.siteRoot}/wp-json/wp/v2`;
    this.auth = basicAuthHeader(creds.username, creds.appPassword);
  }

  private async requestRaw(
    url: string,
    method: string,
    body?: unknown,
    extraHeaders?: Record<string, string>
  ): Promise<any> {
    const res = await fetch(url, {
      method,
      headers: {
        authorization: this.auth,
        'content-type': 'application/json',
        accept: 'application/json',
        'user-agent': 'TNF-Agent/1.0 (+https://thenewfuse.com)',
        ...extraHeaders,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });

    const text = await res.text();
    let parsed: any = text;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      /* keep text */
    }

    if (!res.ok) {
      const detail =
        typeof parsed === 'object' && parsed && 'message' in parsed
          ? String(parsed.message)
          : text.slice(0, 400);
      throw new Error(`WordPress HTTP ${res.status}: ${detail || res.statusText}`);
    }
    return parsed;
  }

  private async request(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, unknown>
  ): Promise<any> {
    const qs = new URLSearchParams();
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== '') qs.set(k, String(v));
      }
    }
    const url = `${this.base}${path}${qs.toString() ? `?${qs}` : ''}`;
    return await this.requestRaw(url, method, body);
  }

  /** Resolve category names to IDs (create missing terms when possible). */
  async resolveCategoryIds(names: string[]): Promise<number[]> {
    const ids: number[] = [];
    for (const name of names) {
      const trimmed = name.trim();
      if (!trimmed) continue;
      const existing = await this.request('GET', '/categories', undefined, {
        search: trimmed,
        per_page: 20,
      });
      const hit = existing.find((c: any) => c.name.toLowerCase() === trimmed.toLowerCase());
      if (hit) {
        ids.push(hit.id);
        continue;
      }
      const created = await this.request('POST', '/categories', { name: trimmed });
      ids.push(created.id);
    }
    return ids;
  }

  async publishPost(input: WpPublishInput): Promise<{
    id: number;
    link: string;
    status: string;
  }> {
    const categoryIds = input.categories?.length
      ? await this.resolveCategoryIds(input.categories)
      : undefined;

    const body: Record<string, unknown> = {
      title: input.title,
      content: input.content,
      status: input.status,
    };
    if (input.slug) body.slug = input.slug;
    if (categoryIds?.length) body.categories = categoryIds;
    if (input.tags?.length) {
      // WP expects tag IDs; pass names via tags meta fallback as plain meta for Day-1
      body.meta = { ...(input.meta || {}), tnf_tag_names: input.tags };
    } else if (input.meta) {
      body.meta = input.meta;
    }
    if (input.featuredMediaId) body.featured_media = input.featuredMediaId;

    const post = await this.request('POST', '/posts', body);
    return { id: post.id, link: post.link, status: post.status };
  }

  async getContentGraph(limit: number = 50): Promise<WpContentGraphItem[]> {
    const perPage = Math.min(100, Math.max(1, limit));
    const posts = await this.request('GET', '/posts', undefined, {
      per_page: perPage,
      status: 'publish,draft,pending,private',
      _fields: 'id,slug,link,status,modified,categories,title',
    });
    return posts.map(
      (p: any): WpContentGraphItem => ({
        id: p.id,
        title: p.title?.rendered || '',
        slug: p.slug,
        link: p.link,
        status: p.status,
        categories: p.categories || [],
        modified: p.modified,
      })
    );
  }

  async ping(): Promise<{ ok: boolean; name?: string }> {
    try {
      const me = await this.request('GET', '/users/me');
      return { ok: true, name: me.name || me.slug };
    } catch (err) {
      return { ok: false, name: err instanceof Error ? err.message : String(err) };
    }
  }

  /** Fetch /ai-plugin.json + OpenAPI + health (agentic readiness probe). */
  async verifyAgentDiscovery(): Promise<{
    discoveryUrl: string;
    manifest: unknown;
    openapi: unknown;
    health: unknown;
  }> {
    const discoveryUrl = `${this.siteRoot}/ai-plugin.json`;
    const manifestRes = await fetch(discoveryUrl, {
      headers: { accept: 'application/json', 'user-agent': 'TNF-Agent/1.0' },
      signal: AbortSignal.timeout(30_000),
    });
    const manifestText = await manifestRes.text();
    let manifest: any = manifestText;
    try {
      manifest = JSON.parse(manifestText);
    } catch {
      /* keep */
    }
    if (!manifestRes.ok) {
      throw new Error(`ai-plugin.json HTTP ${manifestRes.status}`);
    }
    const openapi = await this.requestRaw(`${this.siteRoot}/wp-json/tnf/v1/openapi.json`, 'GET');
    const health = await this.requestRaw(`${this.siteRoot}/wp-json/tnf/v1/health`, 'GET');
    return { discoveryUrl, manifest, openapi, health };
  }

  async getAgentOptimizedPost(postId: number): Promise<unknown> {
    return this.requestRaw(`${this.base}/posts/${postId}`, 'GET', undefined, {
      'x-tnf-agent-optimize': '1',
    });
  }

  async getCitationMap(postId: number): Promise<unknown> {
    return this.requestRaw(`${this.siteRoot}/wp-json/tnf/v1/citation-map/${postId}`, 'GET');
  }

  async putCitationMap(postId: number, citationMap: unknown[]): Promise<unknown> {
    return this.requestRaw(`${this.siteRoot}/wp-json/tnf/v1/citation-map/${postId}`, 'PUT', {
      citation_map: citationMap,
    });
  }
}
