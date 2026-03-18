export interface Env {
  COMMUNITY_DB: D1Database;
  COMMUNITY_R2: R2Bucket;
  COMMUNITY_API_KEY?: string;
  CORS_ORIGIN?: string;
  TNF_API_BASE_URL?: string;
}

type BuildOption =
  | 'workers'
  | 'pages'
  | 'durable-objects'
  | 'queues'
  | 'd1'
  | 'r2'
  | 'ai-gateway'
  | 'agents-sdk';

const VALID_OPTIONS = new Set<BuildOption>([
  'workers',
  'pages',
  'durable-objects',
  'queues',
  'd1',
  'r2',
  'ai-gateway',
  'agents-sdk',
]);

const DAY_MS = 24 * 60 * 60 * 1000;
const COMMUNITY_API_KEY_HEADER = 'x-community-api-key';

const json = (data: unknown, status = 200, corsOrigin = '*') =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': corsOrigin,
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'content-type, authorization, x-community-api-key',
    },
  });

const normalizeUserId = (request: Request, provided?: string) => {
  const p = (provided || '').trim();
  if (p) return p;
  const cfIp = request.headers.get('cf-connecting-ip') || 'anon';
  return cfIp;
};

const verifyCommunityRequest = (request: Request, env: Env) => {
  const secret = env.COMMUNITY_API_KEY ? env.COMMUNITY_API_KEY.trim() : '';
  if (!secret) return false;
  const header = (request.headers.get(COMMUNITY_API_KEY_HEADER) || '').trim();
  return header === secret;
};

type MembershipRecord = {
  username: string;
  status: string;
  role: string;
  source?: 'local' | 'tnf';
  tier?: string;
};

const membershipCache = new Map<string, { expiresAt: number; record: MembershipRecord | null }>();
const MEMBERSHIP_CACHE_TTL_MS = 90 * 1000;

const findMember = async (env: Env, identity: string) => {
  const normalized = String(identity || '').trim();
  if (!normalized) return null;
  const cacheKey = normalized.toLowerCase();
  const cached = membershipCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.record;
  }

  const local = await env.COMMUNITY_DB.prepare(
    'SELECT username, status, role FROM community_members WHERE lower(username) = lower(?)'
  )
    .bind(normalized)
    .first<{ username: string; status: string; role: string }>();
  if (local?.status === 'active') {
    const localRecord: MembershipRecord = { ...local, source: 'local' };
    membershipCache.set(cacheKey, {
      expiresAt: Date.now() + MEMBERSHIP_CACHE_TTL_MS,
      record: localRecord,
    });
    return localRecord;
  }

  const baseUrl = (env.TNF_API_BASE_URL || 'https://thenewfuse.com/api').replace(/\/$/, '');
  const apiKey = env.COMMUNITY_API_KEY ? env.COMMUNITY_API_KEY.trim() : '';
  if (!apiKey) {
    membershipCache.set(cacheKey, {
      expiresAt: Date.now() + MEMBERSHIP_CACHE_TTL_MS,
      record: null,
    });
    return null;
  }

  try {
    const response = await fetch(
      `${baseUrl}/billing/membership/${encodeURIComponent(normalized)}`,
      {
        method: 'GET',
        headers: {
          'x-community-api-key': apiKey,
        },
      }
    );
    if (response.ok) {
      const json = (await response.json()) as {
        found?: boolean;
        active?: boolean;
        tier?: string;
        user?: { username?: string | null; role?: string };
      };
      if (json?.found && json?.active) {
        const tnfRecord: MembershipRecord = {
          username: json.user?.username || normalized,
          status: 'active',
          role: json.user?.role || 'member',
          source: 'tnf',
          tier: json.tier,
        };
        membershipCache.set(cacheKey, {
          expiresAt: Date.now() + MEMBERSHIP_CACHE_TTL_MS,
          record: tnfRecord,
        });
        return tnfRecord;
      }
    }
  } catch {
    // Fail closed for protected actions.
  }

  membershipCache.set(cacheKey, { expiresAt: Date.now() + MEMBERSHIP_CACHE_TTL_MS, record: null });
  return null;
};

const trendFromEvents = (
  events: Array<{ type: string; user_id: string; timestamp: string }>,
  days: number
) => {
  const now = Date.now();
  const buckets = Array.from({ length: days }).map((_, idx) => {
    const dayStart = new Date(now - (days - idx - 1) * DAY_MS);
    dayStart.setUTCHours(0, 0, 0, 0);
    return {
      date: dayStart.toISOString().slice(0, 10),
      views: 0,
      launches: 0,
      votes: 0,
      uniqueUsers: new Set<string>(),
    };
  });

  const bucketMap = new Map(buckets.map((b) => [b.date, b]));
  for (const event of events) {
    const ts = Date.parse(event.timestamp);
    if (!Number.isFinite(ts)) continue;
    const d = new Date(ts);
    d.setUTCHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    const bucket = bucketMap.get(key);
    if (!bucket) continue;
    bucket.uniqueUsers.add(event.user_id);
    if (event.type === 'view') bucket.views += 1;
    if (event.type === 'launch') bucket.launches += 1;
    if (event.type === 'vote') bucket.votes += 1;
  }

  return buckets.map((b) => ({
    date: b.date,
    views: b.views,
    launches: b.launches,
    votes: b.votes,
    uniqueUsers: b.uniqueUsers.size,
  }));
};

const badgesForApp = (app: {
  featured: number;
  votes: number;
  total_views: number;
  total_launches: number;
}) => {
  const badges: Array<{ id: string; name: string; description: string }> = [];
  if (app.featured) {
    badges.push({
      id: 'featured',
      name: 'Featured',
      description: 'Highlighted by AI-ARCADE curation',
    });
  }
  if (app.votes >= 10) {
    badges.push({
      id: 'community-spark',
      name: 'Community Spark',
      description: 'Reached 10+ upvotes',
    });
  }
  if (app.votes >= 100) {
    badges.push({
      id: 'crowd-favorite',
      name: 'Crowd Favorite',
      description: 'Reached 100+ upvotes',
    });
  }
  if (app.total_launches >= 50) {
    badges.push({
      id: 'battle-tested',
      name: 'Battle Tested',
      description: 'Launched 50+ times',
    });
  }
  if (app.total_views >= 500) {
    badges.push({
      id: 'high-traffic',
      name: 'High Traffic',
      description: 'Viewed 500+ times',
    });
  }
  return badges;
};

const snapshotToR2 = async (env: Env) => {
  const [apps, comments, events] = await Promise.all([
    env.COMMUNITY_DB.prepare('SELECT * FROM community_apps ORDER BY created_at DESC').all(),
    env.COMMUNITY_DB.prepare(
      'SELECT * FROM community_comments ORDER BY created_at DESC LIMIT 200'
    ).all(),
    env.COMMUNITY_DB.prepare(
      'SELECT * FROM community_events ORDER BY timestamp DESC LIMIT 1000'
    ).all(),
  ]);
  const payload = {
    exportedAt: new Date().toISOString(),
    apps: apps.results || [],
    comments: comments.results || [],
    events: events.results || [],
  };
  await env.COMMUNITY_R2.put('community-latest.json', JSON.stringify(payload, null, 2), {
    httpMetadata: { contentType: 'application/json' },
  });
};

const ensureSeed = async (env: Env) => {
  const countRow = await env.COMMUNITY_DB.prepare(
    'SELECT COUNT(*) as count FROM community_apps'
  ).first<{
    count: number;
  }>();
  if ((countRow?.count || 0) > 0) return;
  await env.COMMUNITY_DB.prepare(
    `INSERT INTO community_apps (
      id, name, summary, creator, category, tags_json, status, featured, votes,
      total_views, total_launches, total_submissions, cloudflare_option,
      cloudflare_project_name, cloudflare_deployment_url, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      'seed-poker-room',
      'AI Arcade Poker Room',
      'Live poker tables, tournaments, and AI strategy helpers.',
      'tnf-core',
      'cards',
      JSON.stringify(['poker', 'multiplayer', 'ai']),
      'published',
      1,
      320,
      1890,
      522,
      1,
      'workers',
      'ai-arcade-poker-room',
      'https://community-module.ai-arcade-poker.pages.dev',
      new Date().toISOString()
    )
    .run();
  await snapshotToR2(env);
};

const handler = async (request: Request, env: Env) => {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method.toUpperCase();
  const corsOrigin = env.CORS_ORIGIN || '*';

  if (method === 'OPTIONS') return json({ ok: true }, 200, corsOrigin);

  await ensureSeed(env);

  if (path === '/api/health' && method === 'GET') {
    return json({ ok: true, status: 'ok', runtime: 'cloudflare-workers' }, 200, corsOrigin);
  }

  if (path === '/api/community/access/resolve' && method === 'POST') {
    const baseUrl = (env.TNF_API_BASE_URL || 'https://thenewfuse.com/api').replace(/\/$/, '');
    const apiKey = env.COMMUNITY_API_KEY ? env.COMMUNITY_API_KEY.trim() : '';
    const body = await request.text();

    try {
      const upstream = await fetch(`${baseUrl}/access/resolve`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(apiKey ? { 'x-community-api-key': apiKey } : {}),
        },
        body: body || '{}',
      });

      const payload = await upstream.text();
      return new Response(payload, {
        status: upstream.status,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'access-control-allow-origin': corsOrigin,
          'access-control-allow-methods': 'GET,POST,OPTIONS',
          'access-control-allow-headers': 'content-type, authorization, x-community-api-key',
        },
      });
    } catch (error) {
      return json(
        {
          ok: false,
          error: 'access_resolver_unavailable',
          message: String(error || 'Failed to reach TNF access resolver'),
        },
        502,
        corsOrigin
      );
    }
  }

  if (path === '/api/community/apps' && method === 'GET') {
    const status = (url.searchParams.get('status') || 'published').toLowerCase();
    const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit') || '24') || 24));

    const rows = await env.COMMUNITY_DB.prepare(
      `SELECT * FROM community_apps
       WHERE (? = 'all' OR status = ?)
       ORDER BY votes DESC, created_at DESC
       LIMIT ?`
    )
      .bind(status, status, limit)
      .all<any>();

    const apps = await Promise.all(
      (rows.results || []).map(async (app) => {
        const since = new Date(Date.now() - 7 * DAY_MS).toISOString();
        const ev = await env.COMMUNITY_DB.prepare(
          'SELECT type, user_id, timestamp FROM community_events WHERE app_id = ? AND timestamp >= ? ORDER BY timestamp ASC'
        )
          .bind(app.id, since)
          .all<{ type: string; user_id: string; timestamp: string }>();
        const trend7d = trendFromEvents(ev.results || [], 7);
        const summary = trend7d.reduce(
          (acc, d) => {
            acc.views += d.views;
            acc.launches += d.launches;
            acc.votes += d.votes;
            return acc;
          },
          { views: 0, launches: 0, votes: 0 }
        );

        return {
          id: app.id,
          name: app.name,
          summary: app.summary,
          creator: app.creator,
          category: app.category,
          tags: JSON.parse(app.tags_json || '[]'),
          status: app.status,
          featured: !!app.featured,
          playUrl: app.play_url || undefined,
          sourceUrl: app.source_url || undefined,
          coverImageUrl: app.cover_image_url || undefined,
          votes: app.votes || 0,
          totalViews: app.total_views || 0,
          totalLaunches: app.total_launches || 0,
          totalSubmissions: app.total_submissions || 0,
          cloudflare: {
            option: app.cloudflare_option,
            projectName: app.cloudflare_project_name || undefined,
            deploymentUrl: app.cloudflare_deployment_url || undefined,
          },
          createdAt: app.created_at,
          badges: badgesForApp(app),
          trend7d,
          trendSummary7d: summary,
        };
      })
    );

    return json({ ok: true, apps }, 200, corsOrigin);
  }

  if (path === '/api/community/apps/submit' && method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as any;
    const name = String(body.name || '').trim();
    const summary = String(body.summary || '').trim();
    const creator = String(body.creator || '').trim();
    const category = String(body.category || 'misc').trim();
    const cloudflareOption = String(body.cloudflareOption || 'workers') as BuildOption;

    if (!name || !summary || !creator) {
      return json({ ok: false, error: 'name, summary, and creator are required' }, 400, corsOrigin);
    }

    const membership = await findMember(env, creator);
    if (!membership || membership.status !== 'active') {
      return json(
        {
          ok: false,
          error: 'Membership required',
          message: 'Only active members can submit community apps.',
        },
        403,
        corsOrigin
      );
    }

    const option: BuildOption = VALID_OPTIONS.has(cloudflareOption) ? cloudflareOption : 'workers';
    const appId = `community-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const tags = Array.isArray(body.tags)
      ? body.tags
          .map((t: unknown) => String(t).trim())
          .filter(Boolean)
          .slice(0, 12)
      : [];

    await env.COMMUNITY_DB.batch([
      env.COMMUNITY_DB.prepare(
        `INSERT INTO community_apps (
          id, name, summary, creator, category, tags_json, status, featured, votes,
          total_views, total_launches, total_submissions, cloudflare_option,
          cloudflare_project_name, cloudflare_deployment_url, play_url, source_url, cover_image_url,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, 0, 0, 0, 1, ?, '', '', ?, ?, ?, ?)`
      ).bind(
        appId,
        name,
        summary,
        creator,
        category,
        JSON.stringify(tags),
        option,
        body.playUrl ? String(body.playUrl).trim() : null,
        body.sourceUrl ? String(body.sourceUrl).trim() : null,
        body.coverImageUrl ? String(body.coverImageUrl).trim() : null,
        createdAt
      ),
      env.COMMUNITY_DB.prepare(
        "INSERT INTO community_events (app_id, type, user_id, timestamp) VALUES (?, 'submit', ?, ?)"
      ).bind(appId, creator, createdAt),
    ]);

    await snapshotToR2(env);

    return json(
      {
        ok: true,
        app: {
          id: appId,
          name,
          summary,
          creator,
          category,
          tags,
          status: 'pending',
          votes: 0,
          cloudflare: { option },
          createdAt,
        },
        moderation: 'queued',
        message: 'Submission received and queued for AI-ARCADE review.',
      },
      201,
      corsOrigin
    );
  }

  const voteMatch = path.match(/^\/api\/community\/apps\/([^/]+)\/vote$/);
  if (voteMatch && method === 'POST') {
    const appId = decodeURIComponent(voteMatch[1]);
    const body = (await request.json().catch(() => ({}))) as any;
    const userId = normalizeUserId(request, body.userId);
    const now = new Date().toISOString();

    const membership = await findMember(env, userId);
    if (!membership || membership.status !== 'active') {
      return json(
        {
          ok: false,
          error: 'Membership required',
          message: 'Only active members can vote on community apps.',
        },
        403,
        corsOrigin
      );
    }

    const exists = await env.COMMUNITY_DB.prepare('SELECT id FROM community_apps WHERE id = ?')
      .bind(appId)
      .first();
    if (!exists) return json({ ok: false, error: 'app not found' }, 404, corsOrigin);

    const inserted = await env.COMMUNITY_DB.prepare(
      'INSERT OR IGNORE INTO community_votes (app_id, user_id, created_at) VALUES (?, ?, ?)'
    )
      .bind(appId, userId, now)
      .run();

    const duplicate = !inserted.meta.changes;
    if (!duplicate) {
      await env.COMMUNITY_DB.batch([
        env.COMMUNITY_DB.prepare('UPDATE community_apps SET votes = votes + 1 WHERE id = ?').bind(
          appId
        ),
        env.COMMUNITY_DB.prepare(
          "INSERT INTO community_events (app_id, type, user_id, timestamp) VALUES (?, 'vote', ?, ?)"
        ).bind(appId, userId, now),
      ]);
      await snapshotToR2(env);
    }

    const votesRow = await env.COMMUNITY_DB.prepare('SELECT votes FROM community_apps WHERE id = ?')
      .bind(appId)
      .first<{ votes: number }>();
    return json({ ok: true, appId, votes: votesRow?.votes || 0, duplicate }, 200, corsOrigin);
  }

  const engagementMatch = path.match(/^\/api\/community\/apps\/([^/]+)\/engagement$/);
  if (engagementMatch && method === 'POST') {
    const appId = decodeURIComponent(engagementMatch[1]);
    const body = (await request.json().catch(() => ({}))) as any;
    const typeRaw = String(body.type || '').toLowerCase();
    if (typeRaw !== 'view' && typeRaw !== 'launch') {
      return json({ ok: false, error: 'type must be view or launch' }, 400, corsOrigin);
    }

    const userId = normalizeUserId(request, body.userId);
    const now = new Date().toISOString();

    const exists = await env.COMMUNITY_DB.prepare('SELECT id FROM community_apps WHERE id = ?')
      .bind(appId)
      .first();
    if (!exists) return json({ ok: false, error: 'app not found' }, 404, corsOrigin);

    const updateSql =
      typeRaw === 'view'
        ? 'UPDATE community_apps SET total_views = total_views + 1 WHERE id = ?'
        : 'UPDATE community_apps SET total_launches = total_launches + 1 WHERE id = ?';

    await env.COMMUNITY_DB.batch([
      env.COMMUNITY_DB.prepare(updateSql).bind(appId),
      env.COMMUNITY_DB.prepare(
        'INSERT INTO community_events (app_id, type, user_id, timestamp) VALUES (?, ?, ?, ?)'
      ).bind(appId, typeRaw, userId, now),
    ]);

    const totals = await env.COMMUNITY_DB.prepare(
      'SELECT total_views as views, total_launches as launches, votes FROM community_apps WHERE id = ?'
    )
      .bind(appId)
      .first<{ views: number; launches: number; votes: number }>();

    return json({ ok: true, appId, type: typeRaw, totals }, 200, corsOrigin);
  }

  const trendsMatch = path.match(/^\/api\/community\/apps\/([^/]+)\/trends$/);
  if (trendsMatch && method === 'GET') {
    const appId = decodeURIComponent(trendsMatch[1]);
    const days = Math.max(3, Math.min(60, Number(url.searchParams.get('days') || '14') || 14));
    const since = new Date(Date.now() - days * DAY_MS).toISOString();

    const exists = await env.COMMUNITY_DB.prepare('SELECT id FROM community_apps WHERE id = ?')
      .bind(appId)
      .first();
    if (!exists) return json({ ok: false, error: 'app not found' }, 404, corsOrigin);

    const events = await env.COMMUNITY_DB.prepare(
      'SELECT type, user_id, timestamp FROM community_events WHERE app_id = ? AND timestamp >= ? ORDER BY timestamp ASC'
    )
      .bind(appId, since)
      .all<{ type: string; user_id: string; timestamp: string }>();
    const trend = trendFromEvents(events.results || [], days);
    const summary = trend.reduce(
      (acc, d) => {
        acc.views += d.views;
        acc.launches += d.launches;
        acc.votes += d.votes;
        acc.uniqueUsers += d.uniqueUsers;
        return acc;
      },
      { views: 0, launches: 0, votes: 0, uniqueUsers: 0 }
    );

    return json({ ok: true, appId, days, trend, summary }, 200, corsOrigin);
  }

  const badgesMatch = path.match(/^\/api\/community\/apps\/([^/]+)\/achievements$/);
  if (badgesMatch && method === 'GET') {
    const appId = decodeURIComponent(badgesMatch[1]);
    const app = await env.COMMUNITY_DB.prepare(
      'SELECT featured, votes, total_views, total_launches FROM community_apps WHERE id = ?'
    )
      .bind(appId)
      .first<{ featured: number; votes: number; total_views: number; total_launches: number }>();

    if (!app) return json({ ok: false, error: 'app not found' }, 404, corsOrigin);
    return json({ ok: true, appId, badges: badgesForApp(app) }, 200, corsOrigin);
  }

  const commentsMatch = path.match(/^\/api\/community\/apps\/([^/]+)\/comments$/);
  if (commentsMatch && method === 'GET') {
    const appId = decodeURIComponent(commentsMatch[1]);
    const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit') || '20') || 20));

    const exists = await env.COMMUNITY_DB.prepare('SELECT id FROM community_apps WHERE id = ?')
      .bind(appId)
      .first();
    if (!exists) return json({ ok: false, error: 'app not found' }, 404, corsOrigin);

    const comments = await env.COMMUNITY_DB.prepare(
      'SELECT id, app_id as appId, user_id as userId, text, created_at as createdAt FROM community_comments WHERE app_id = ? ORDER BY created_at DESC LIMIT ?'
    )
      .bind(appId, limit)
      .all();
    return json({ ok: true, appId, comments: comments.results || [] }, 200, corsOrigin);
  }

  if (commentsMatch && method === 'POST') {
    const appId = decodeURIComponent(commentsMatch[1]);
    const body = (await request.json().catch(() => ({}))) as any;
    const text = String(body.text || '').trim();
    if (!text) return json({ ok: false, error: 'comment text is required' }, 400, corsOrigin);

    const exists = await env.COMMUNITY_DB.prepare('SELECT id FROM community_apps WHERE id = ?')
      .bind(appId)
      .first();
    if (!exists) return json({ ok: false, error: 'app not found' }, 404, corsOrigin);

    const userId = normalizeUserId(request, body.userId);
    const commentId = `cmt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const membership = await findMember(env, userId);
    if (!membership || membership.status !== 'active') {
      return json(
        {
          ok: false,
          error: 'Membership required',
          message: 'Only active members can comment on community apps.',
        },
        403,
        corsOrigin
      );
    }

    await env.COMMUNITY_DB.batch([
      env.COMMUNITY_DB.prepare(
        'INSERT INTO community_comments (id, app_id, user_id, text, created_at) VALUES (?, ?, ?, ?, ?)'
      ).bind(commentId, appId, userId, text.slice(0, 500), now),
      env.COMMUNITY_DB.prepare(
        "INSERT INTO community_events (app_id, type, user_id, timestamp) VALUES (?, 'comment', ?, ?)"
      ).bind(appId, userId, now),
    ]);

    await snapshotToR2(env);

    return json(
      {
        ok: true,
        appId,
        comment: {
          id: commentId,
          appId,
          userId,
          text: text.slice(0, 500),
          createdAt: now,
        },
      },
      201,
      corsOrigin
    );
  }

  if (path === '/api/community/activities/recent' && method === 'GET') {
    const limit = Math.max(1, Math.min(200, Number(url.searchParams.get('limit') || '30') || 30));
    const type = (url.searchParams.get('type') || 'all').toLowerCase();

    const actionRows = await env.COMMUNITY_DB.prepare(
      'SELECT app_id, type, user_id, timestamp FROM community_events ORDER BY timestamp DESC LIMIT 300'
    ).all<{ app_id: string; type: string; user_id: string; timestamp: string }>();
    const commentRows = await env.COMMUNITY_DB.prepare(
      'SELECT id, app_id, user_id, text, created_at FROM community_comments ORDER BY created_at DESC LIMIT 200'
    ).all<{ id: string; app_id: string; user_id: string; text: string; created_at: string }>();

    const actionItems = (actionRows.results || []).map((event) => ({
      id: `act-${event.app_id}-${event.type}-${event.timestamp}`,
      kind: 'action',
      appId: event.app_id,
      type: event.type,
      userId: event.user_id,
      text:
        event.type === 'vote'
          ? `${event.user_id} upvoted an app`
          : event.type === 'launch'
            ? `${event.user_id} launched an app`
            : event.type === 'comment'
              ? `${event.user_id} commented on an app`
              : event.type === 'submit'
                ? `${event.user_id} submitted a new app`
                : `${event.user_id} viewed an app`,
      timestamp: event.timestamp,
    }));

    const commentItems = (commentRows.results || []).map((comment) => ({
      id: `comment-${comment.id}`,
      kind: 'comment',
      appId: comment.app_id,
      type: 'comment',
      userId: comment.user_id,
      text: comment.text,
      timestamp: comment.created_at,
    }));

    let merged: Array<any> = [...actionItems, ...commentItems];
    if (type === 'actions') merged = actionItems;
    if (type === 'comments') merged = commentItems;

    merged.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
    return json({ ok: true, type, activities: merged.slice(0, limit) }, 200, corsOrigin);
  }

  if (path === '/api/community/persistence/status' && method === 'GET') {
    const dbCount = await env.COMMUNITY_DB.prepare(
      'SELECT COUNT(*) as count FROM community_apps'
    ).first<{ count: number }>();
    const r2Obj = await env.COMMUNITY_R2.head('community-latest.json');
    return json(
      {
        ok: true,
        storage: {
          d1: {
            table: 'community_apps',
            appCount: dbCount?.count || 0,
          },
          r2: {
            key: 'community-latest.json',
            exists: !!r2Obj,
            uploaded: r2Obj?.uploaded || null,
            size: r2Obj?.size || 0,
          },
        },
      },
      200,
      corsOrigin
    );
  }

  const membershipMatch = path.match(/^\/api\/community\/membership\/([^/]+)$/);
  if (membershipMatch && method === 'GET') {
    const username = decodeURIComponent(membershipMatch[1]);
    if (!username) {
      return json({ ok: false, error: 'username required' }, 400, corsOrigin);
    }
    const member = await env.COMMUNITY_DB.prepare(
      'SELECT username, status, role, added_at as addedAt FROM community_members WHERE lower(username) = lower(?)'
    )
      .bind(username)
      .first<{ username: string; status: string; role: string; addedAt: string }>();
    if (!member) {
      return json({ ok: true, exists: false, username }, 200, corsOrigin);
    }
    return json({ ok: true, exists: true, membership: member }, 200, corsOrigin);
  }

  return json({ ok: false, error: 'Not found' }, 404, corsOrigin);
};

export default {
  fetch: handler,
} satisfies ExportedHandler<Env>;
