export interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Basic API Routes
    if (path === '/api/sessions' && request.method === 'GET') {
      const { results } = await env.DB.prepare(
        'SELECT * FROM sessions ORDER BY start_time DESC'
      ).all();
      return Response.json(results);
    }

    if (path === '/api/claims' && request.method === 'POST') {
      const claim = await request.json();
      // Logic to insert claim into D1
      return Response.json({ success: true, message: 'Claim logged' });
    }

    return new Response('ClaimTracker API', { status: 200 });
  },
};
