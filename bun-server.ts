import { serve } from "bun";
import { existsSync, readFileSync } from "fs";
import { join, extname } from "path";

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "localhost";

// MIME types for static files
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.jsx': 'application/javascript',
  '.ts': 'application/typescript',
  '.tsx': 'application/typescript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

function getMimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function createLandingPageHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The New Fuse - Frontend Showcase</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 2rem;
        }
        .header {
            text-align: center;
            color: white;
            margin-bottom: 3rem;
        }
        .header h1 {
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        .section {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .section h2 {
            color: #4F46E5;
            margin-bottom: 1.5rem;
            font-size: 1.5rem;
            border-bottom: 2px solid #E5E7EB;
            padding-bottom: 0.5rem;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1rem;
        }
        .card {
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            padding: 1.5rem;
            transition: all 0.3s ease;
            background: #FAFAFA;
        }
        .card:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            border-color: #4F46E5;
        }
        .card h3 {
            color: #1F2937;
            margin-bottom: 0.5rem;
            font-size: 1.1rem;
        }
        .card p {
            color: #6B7280;
            margin-bottom: 1rem;
            font-size: 0.9rem;
        }
        .card a {
            display: inline-block;
            background: #4F46E5;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            transition: background 0.3s ease;
        }
        .card a:hover {
            background: #3730A3;
        }
        .status {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 500;
            margin-left: 0.5rem;
        }
        .status.live { background: #D1FAE5; color: #065F46; }
        .status.demo { background: #FEF3C7; color: #92400E; }
        .status.static { background: #E0E7FF; color: #3730A3; }
        .footer {
            text-align: center;
            color: white;
            opacity: 0.8;
            margin-top: 2rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 The New Fuse</h1>
            <p>Frontend Development Showcase - Powered by Bun Runtime</p>
        </div>

        <div class="section">
            <h2>React Application Pages</h2>
            <div class="grid">
                <div class="card">
                    <h3>Main App <span class="status live">Live</span></h3>
                    <p>The main React application with full routing and components</p>
                    <a href="/home" target="_blank">Open App →</a>
                </div>
                <div class="card">
                    <h3>Test Page <span class="status demo">Demo</span></h3>
                    <p>Simple test page for routing verification</p>
                    <a href="/test" target="_blank">View Test →</a>
                </div>
                <div class="card">
                    <h3>Debug Info <span class="status demo">Debug</span></h3>
                    <p>Debug information and routing details</p>
                    <a href="/debug" target="_blank">View Debug →</a>
                </div>
                <div class="card">
                    <h3>UI Components <span class="status demo">Demo</span></h3>
                    <p>Component showcase and navigation</p>
                    <a href="/ui" target="_blank">View Components →</a>
                </div>
                <div class="card">
                    <h3>Chat Interface <span class="status live">Live</span></h3>
                    <p>AI chat interface and messaging</p>
                    <a href="/chat" target="_blank">Open Chat →</a>
                </div>
                <div class="card">
                    <h3>Dashboard <span class="status live">Live</span></h3>
                    <p>Main user dashboard with analytics</p>
                    <a href="/dashboard" target="_blank">Open Dashboard →</a>
                </div>
                <div class="card">
                    <h3>Timeline Demo <span class="status demo">Demo</span></h3>
                    <p>Interactive timeline demonstration</p>
                    <a href="/timeline-demo" target="_blank">View Demo →</a>
                </div>
                <div class="card">
                    <h3>Graph Demo <span class="status demo">Demo</span></h3>
                    <p>Graph visualization demonstration</p>
                    <a href="/graph-demo" target="_blank">View Demo →</a>
                </div>
                <div class="card">
                    <h3>Admin Panel <span class="status live">Live</span></h3>
                    <p>Administrative dashboard and controls</p>
                    <a href="/admin/dashboard" target="_blank">Open Admin →</a>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Static HTML Showcase</h2>
            <div class="grid">
                <div class="card">
                    <h3>HTML Showcase Index <span class="status static">Static</span></h3>
                    <p>Main index for all static HTML demonstrations</p>
                    <a href="/static/" target="_blank">View Index →</a>
                </div>
                <div class="card">
                    <h3>Login Page <span class="status static">Static</span></h3>
                    <p>Static HTML login form demonstration</p>
                    <a href="/static/pages/login.html" target="_blank">View Login →</a>
                </div>
                <div class="card">
                    <h3>Dashboard Demo <span class="status static">Static</span></h3>
                    <p>Static dashboard layout demonstration</p>
                    <a href="/static/pages/dashboard.html" target="_blank">View Dashboard →</a>
                </div>
                <div class="card">
                    <h3>Chat Interface <span class="status static">Static</span></h3>
                    <p>Static chat interface layout</p>
                    <a href="/static/pages/chat.html" target="_blank">View Chat →</a>
                </div>
                <div class="card">
                    <h3>Admin Panel <span class="status static">Static</span></h3>
                    <p>Static admin interface demonstration</p>
                    <a href="/static/pages/admin.html" target="_blank">View Admin →</a>
                </div>
                <div class="card">
                    <h3>Settings Page <span class="status static">Static</span></h3>
                    <p>Static settings interface layout</p>
                    <a href="/static/pages/settings.html" target="_blank">View Settings →</a>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Development Tools</h2>
            <div class="grid">
                <div class="card">
                    <h3>Server Status <span class="status live">Live</span></h3>
                    <p>Current server status: Running on http://${HOST}:${PORT}</p>
                    <a href="/api/status" target="_blank">Check Status →</a>
                </div>
                <div class="card">
                    <h3>Build Info <span class="status demo">Info</span></h3>
                    <p>Build information and environment details</p>
                    <a href="/api/build-info" target="_blank">View Info →</a>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>Powered by Bun Runtime • Built with React, TypeScript, and Tailwind CSS</p>
        </div>
    </div>
</body>
</html>`;
}

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  console.log(`${new Date().toISOString()} - ${request.method} ${pathname}`);

  // Handle root path - show our custom landing page
  if (pathname === '/') {
    return new Response(createLandingPageHTML(), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Handle API endpoints
  if (pathname.startsWith('/api/')) {
    if (pathname === '/api/status') {
      return new Response(JSON.stringify({ 
        status: 'running', 
        port: PORT, 
        host: HOST,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        bunVersion: Bun.version
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (pathname === '/api/build-info') {
      return new Response(JSON.stringify({
        runtime: 'Bun',
        version: Bun.version,
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        cwd: process.cwd()
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Handle static HTML showcase
  if (pathname.startsWith('/static/')) {
    const staticPath = pathname.replace('/static/', '');
    const filePath = join(process.cwd(), 'ui-html-css', staticPath || 'index.html');
    
    if (existsSync(filePath)) {
      const content = readFileSync(filePath);
      return new Response(content, {
        headers: { 'Content-Type': getMimeType(filePath) },
      });
    }
  }

  // Handle built React app assets
  const builtAppPath = join(process.cwd(), 'apps/frontend/dist', pathname.slice(1));
  if (existsSync(builtAppPath)) {
    const content = readFileSync(builtAppPath);
    return new Response(content, {
      headers: { 'Content-Type': getMimeType(builtAppPath) },
    });
  }

  // Handle React app routes (SPA routing)
  // For any route that doesn't match a static file, serve the React app
  const indexPath = join(process.cwd(), 'apps/frontend/dist/index.html');
  if (existsSync(indexPath)) {
    const content = readFileSync(indexPath);
    return new Response(content, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // If nothing matches, return 404
  return new Response(`
    <html>
      <head><title>404 - Not Found</title></head>
      <body style="font-family: system-ui; padding: 2rem; text-align: center;">
        <h1>404 - Page Not Found</h1>
        <p>The requested path "${pathname}" was not found.</p>
        <a href="/" style="color: #4F46E5;">← Back to Home</a>
      </body>
    </html>
  `, {
    status: 404,
    headers: { 'Content-Type': 'text/html' },
  });
}

const server = serve({
  port: PORT,
  hostname: HOST,
  fetch: handleRequest,
});

console.log(`🚀 The New Fuse Frontend Server is running!`);
console.log(`📍 Local: http://${HOST}:${PORT}`);
console.log(`🌐 Network: http://0.0.0.0:${PORT}`);
console.log(`📁 Serving: React App + Static HTML Showcase`);
console.log(`⚡ Runtime: Bun ${Bun.version}`);
console.log(`🛑 Press Ctrl+C to stop\n`);
