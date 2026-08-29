// Static page renderer for gateway fallback.
// Previously attempted Next.js but it caused:
// 1. Symlink issues (pages/ pointed outside repo, Turbopack rejects)
// 2. OOM during build (monorepo too large for Next.js turbopack)
// 3. Dev server conflicts when next() spawns its own server
// This simple static handler serves the three demo pages directly.

// Simple HTML templates for each page
const PAGE_TEMPLATES: Record<string, string> = {
  '/pricing': `<!DOCTYPE html>
<html>
<head><title>Pricing - The New Fuse</title></head>
<body style="font-family: sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto;">
<h1>Pricing Page</h1>
<p>This is the pricing page for The New Fuse.</p>
</body>
</html>`,
  '/features': `<!DOCTYPE html>
<html>
<head><title>Features - The New Fuse</title></head>
<body style="font-family: sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto;">
<h1>Features Page</h1>
<p>This is the features page for The New Fuse.</p>
</body>
</html>`,
  '/docs': `<!DOCTYPE html>
<html>
<head><title>Docs - The New Fuse</title></head>
<body style="font-family: sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto;">
<h1>Docs Page</h1>
<p>This is the documentation page for The New Fuse.</p>
</body>
</html>`,
};

/**
 * Returns a handler for serving static pages.
 * Serves HTML for known routes, 404 for others.
 *
 * Call this ONCE at bootstrap, not per request.
 * The caller must register the resulting handler after the route table, so
 * routes the gateway owns ('/', '/health', the proxy prefixes) are matched
 * before this ever sees them. It deliberately keeps no exemption list: an
 * allowlist of "routes I must not swallow" silently rots as routes are added.
 */
export async function ensureNextHandler(): Promise<(req: any, res: any) => void> {
  return (req: any, res: any) => {
    const url = req.url || req.path || '';
    const cleanUrl = url.split('?')[0];

    if (cleanUrl in PAGE_TEMPLATES) {
      res.setHeader('Content-Type', 'text/html');
      res.end(PAGE_TEMPLATES[cleanUrl]);
    } else {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/html');
      res.end('<h1>Not Found</h1><p>The requested page does not exist.</p>');
    }
  };
}
