import re

with open("apps/frontend/vite.config.ts", "r") as f:
    content = f.read()

# 1. Remove configureServer from server object
server_pattern = re.compile(r"(\s*)// Add CORS headers for development and SPA fallback\s+configureServer: \(server: \{[\s\S]*?      \},", re.MULTILINE)
content = server_pattern.sub("", content)

# 2. Add plugin to plugins array
plugin_code = """      // Custom SPA fallback and CORS plugin
      {
        name: 'spa-fallback-plugin',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
            if (req.method === 'OPTIONS') {
              res.writeHead(204);
              res.end();
              return;
            }
            next();
          });

          // SPA fallback - serve app.html for all non-API routes, except root
          server.middlewares.use((req, res, next) => {
            if (!req.url) return next();
            if (
              req.url !== '/' &&
              !req.url.startsWith('/api') &&
              !req.url.startsWith('/ws') &&
              !req.url.match(/\.[a-zA-Z0-9]+$/) &&
              req.method === 'GET'
            ) {
              console.log(`[SPA Fallback] Rewriting ${req.url} to /app.html`);
              req.url = '/app.html';
            }
            next();
          });
        }
      },"""

content = content.replace("ethersBrowserResolve(),", "ethersBrowserResolve(),\n" + plugin_code)

with open("apps/frontend/vite.config.ts", "w") as f:
    f.write(content)
