/**
 * Next.js gateway handler for serving static pages via the API Gateway.
 * Uses the Next.js installation from the monorepo root node_modules.
 * Pages are located at the repo root (../../../.. from dist/next-handler.js).
 */

let nextHandlerReady: Promise<(req: any, res: any) => Promise<void>>;

async function ensureNextHandler(): Promise<(req: any, res: any) => Promise<void>> {
  if (nextHandlerReady) return nextHandlerReady;

  try {
    // Dynamic import of Next.js from monorepo root node_modules
    // Using absolute path to bypass pnpm's strict node_modules resolution
    const nextModule =
      await import('/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse/node_modules/next/dist/server/next.js');
    const next = nextModule.default;

    if (process.env.NODE_ENV === 'development') {
      console.log('[TNF-next] Starting Next.js handler');
    }

    // Point to repo root (so it finds pages/ and package.json)
    // In compiled dist/next-handler.js, __dirname = apps/api-gateway/dist
    // Repo root is ../../..
    const path = await import('node:path');
    // eslint-disable-next-line no-underscore-dangle
    const dirname = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
    const repoRoot = path.resolve(dirname, '..', '..', '..');

    const nextApp = next({
      dev: process.env.NODE_ENV !== 'production',
      dir: repoRoot,
    });

    await nextApp.prepare();
    const handler = nextApp.getRequestHandler();
    nextHandlerReady = Promise.resolve(handler);
    return handler;
  } catch (err) {
    console.warn(
      '[TNF-next] Next.js handler not available:',
      err instanceof Error ? err.message : String(err)
    );

    // Safe fallback: 404 page stub
    const fallbackHandler = async (_req: any, res: any) => {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/html');
      res.end('<h1>Not Found</h1><p>Static pages handler unavailable</p>');
    };
    nextHandlerReady = Promise.resolve(fallbackHandler);
    return nextHandlerReady;
  }
}

export { ensureNextHandler };
