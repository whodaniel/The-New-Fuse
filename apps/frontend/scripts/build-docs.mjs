import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.join(__dirname, '../public/visualizations');

// Read all MD files
const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md'));

const template = (title, content) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${title} — The New Fuse Documentation</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
      rel="stylesheet"
    />
    <style>
      :root {
        --bg: #06080f;
        --surface: #0f1319;
        --border: #1c2333;
        --text: #e2e8f0;
        --muted: #8892a4;
        --accent: #3b82f6;
      }
      body {
        font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
        background: var(--bg);
        color: var(--text);
        min-height: 100vh;
        -webkit-font-smoothing: antialiased;
        margin: 0;
        padding: 0;
      }
      .nav {
        position: sticky;
        top: 0;
        z-index: 100;
        background: rgba(6, 8, 15, 0.85);
        backdrop-filter: blur(16px) saturate(1.8);
        -webkit-backdrop-filter: blur(16px) saturate(1.8);
        border-bottom: 1px solid var(--border);
        padding: 0 40px;
      }
      .nav-inner {
        max-width: 900px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 56px;
      }
      .nav-brand {
        font-size: 16px;
        font-weight: 700;
        letter-spacing: -0.3px;
        color: var(--text);
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .back-link {
        color: var(--muted);
        text-decoration: none;
        font-size: 13px;
        font-weight: 500;
      }
      .back-link:hover {
        color: var(--text);
      }
      .md-viewer {
        max-width: 900px;
        margin: 60px auto;
        padding: 40px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 16px;
        line-height: 1.7;
        font-size: 15px;
      }
      .md-viewer h1 { font-size: 28px; margin-bottom: 24px; font-weight: 800; letter-spacing: -0.5px; }
      .md-viewer h2 { font-size: 22px; margin: 32px 0 16px; color: var(--accent); font-weight: 700; letter-spacing: -0.3px; }
      .md-viewer h3 { font-size: 18px; margin: 24px 0 12px; font-weight: 600; }
      .md-viewer p { margin-bottom: 16px; color: #cbd5e1; }
      .md-viewer a { color: var(--accent); text-decoration: none; }
      .md-viewer a:hover { text-decoration: underline; }
      .md-viewer ul, .md-viewer ol { margin: 12px 0 20px 24px; color: #cbd5e1; }
      .md-viewer li { margin: 6px 0; }
      .md-viewer code {
        background: rgba(255, 255, 255, 0.06);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 13.5px;
        font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
      }
      .md-viewer pre {
        background: #0a0f18;
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 16px;
        overflow-x: auto;
        margin: 20px 0;
      }
      .md-viewer pre code {
        background: none;
        padding: 0;
        color: #7dd3fc;
      }
      .md-viewer blockquote {
        margin: 20px 0;
        padding: 12px 20px;
        border-left: 4px solid var(--accent);
        background: rgba(59, 130, 246, 0.05);
        border-radius: 0 8px 8px 0;
        color: #94a3b8;
      }
      .md-viewer table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
      }
      .md-viewer th, .md-viewer td {
        border: 1px solid var(--border);
        padding: 10px 14px;
        clear: left;
        font-size: 14px;
      }
      .md-viewer th {
        background: rgba(255, 255, 255, 0.04);
        font-weight: 600;
        text-align: left;
      }
      @media (max-width: 768px) {
        .md-viewer {
          margin: 0;
          padding: 24px;
          border-radius: 0;
          border-left: none;
          border-right: none;
        }
      }
    </style>
  </head>
  <body>
    <nav class="nav">
      <div class="nav-inner">
        <div class="nav-brand">
          The New Fuse Docs
        </div>
        <a href="dashboard.html" class="back-link">← Back to Dashboard</a>
      </div>
    </nav>
    <div class="md-viewer">
      ${content}
    </div>
  </body>
</html>`;

files.forEach(file => {
  const mdPath = path.join(DOCS_DIR, file);
  const htmlPath = path.join(DOCS_DIR, file.replace(/\.md$/, '.html'));

  const mdContent = fs.readFileSync(mdPath, 'utf8');
  const htmlContent = marked.parse(mdContent);

  // Try to extract title from first h1
  const titleMatch = mdContent.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : file.replace(/\.md$/, '').replace(/-/g, ' ');

  const finalHtml = template(title, htmlContent);
  fs.writeFileSync(htmlPath, finalHtml);
  console.log(`Converted: ${file} -> ${path.basename(htmlPath)}`);
});

console.log('✅ All markdown files converted successfully!');
