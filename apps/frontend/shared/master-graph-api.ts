import {
  attachRuntime,
  graphAssessment,
  GraphError,
  parseGraphQuery,
  parseMasterGraph,
  queryMasterGraph,
} from './master-graph';

export type GraphContext = {
  request: Request;
  env: { ASSETS: { fetch(request: Request): Promise<Response> } };
};
const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
      Vary: 'Authorization, Cookie',
      'X-Content-Type-Options': 'nosniff',
    },
  });

/** Fixed upstreams only. Authentication is passed through; tenant selection is not accepted here. */
export async function handleMasterGraph(
  context: GraphContext,
  upstreamFetch: typeof fetch = (input, init) => globalThis.fetch(input, init)
): Promise<Response> {
  if (context.request.method !== 'GET')
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET' } });
  try {
    const url = new URL(context.request.url);
    const query = parseGraphQuery(url.searchParams);
    const asset = await context.env.ASSETS.fetch(
      new Request(new URL('/data/master-graph.json', url.origin))
    );
    if (!asset.ok || !asset.headers.get('content-type')?.includes('json'))
      throw new GraphError('Master graph build artifact unavailable', 503);
    let graph = parseMasterGraph(await asset.json());
    if (url.searchParams.get('live') !== 'false') {
      const headers = new Headers({ Accept: 'application/json' });
      for (const key of ['authorization', 'cookie']) {
        const value = context.request.headers.get(key);
        if (value) headers.set(key, value);
      }
      const results = await Promise.all(
        (['clock', 'terminals'] as const).map(async (kind) => {
          const endpoint =
            kind === 'clock'
              ? '/api/system/master-clock'
              : '/api/terminals/graph?includeCommands=false&includeProcessNodes=true&limit=100';
          const id = endpoint.split('?')[0];
          if (kind === 'terminals' && !headers.has('authorization') && !headers.has('cookie'))
            return {
              kind,
              id,
              status: 'unauthorized' as const,
              message: 'Sign in to view your tenant terminal graph',
            };
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 6000);
          try {
            // Match the existing Pages API proxy: preserve the incoming request's
            // runtime context while replacing its URL and restricting forwarded headers.
            const request = new Request(
              new URL(endpoint, 'https://api.thenewfuse.com'),
              context.request
            );
            const response = await upstreamFetch(request, {
              headers,
              signal: controller.signal,
              redirect: 'manual',
            });
            if (!response.ok)
              return {
                kind,
                id,
                status:
                  response.status === 401 || response.status === 403
                    ? ('unauthorized' as const)
                    : ('unavailable' as const),
                message: `Runtime source returned HTTP ${response.status}`,
              };
            if (!response.headers.get('content-type')?.includes('json'))
              throw new Error('Runtime source did not return JSON');
            return { kind, id, payload: await response.json() };
          } catch (error) {
            const message = error instanceof Error ? error.message : '';
            const reason = controller.signal.aborted
              ? 'timeout'
              : /redirect/i.test(message)
                ? 'redirect-policy'
                : /invocation/i.test(message)
                  ? 'fetch-context'
                  : 'transport';
            // No request headers, tokens, response bodies or exception text in logs.
            console.warn('master-graph upstream failure', kind, reason);
            return {
              kind,
              id,
              status: 'unavailable' as const,
              message: 'Runtime source unavailable or timed out',
            };
          } finally {
            clearTimeout(timeout);
          }
        })
      );
      for (const result of results) {
        if ('payload' in result) {
          try {
            const candidate = structuredClone(graph);
            attachRuntime(candidate, result.kind, result.payload, new Date().toISOString());
            graph = parseMasterGraph(candidate);
          } catch {
            graph.sources.push({
              id: result.id,
              status: 'unavailable',
              message: 'Runtime source failed validation',
            });
          }
        } else
          graph.sources.push({ id: result.id, status: result.status, message: result.message });
      }
    }
    return json({
      ...graph,
      assessment: graphAssessment(graph),
      query: queryMasterGraph(graph, query),
    });
  } catch (error) {
    return json(
      { error: error instanceof GraphError ? error.message : 'Graph could not be loaded' },
      error instanceof GraphError ? error.status : 503
    );
  }
}
