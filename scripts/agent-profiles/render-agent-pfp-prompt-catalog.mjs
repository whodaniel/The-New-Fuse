import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..', '..');
const catalogPath = path.join(root, 'apps', 'frontend', 'src', 'data', 'agent-visual-profiles.json');
const outputDir = path.join(root, 'output', 'agent-profiles');
const outputPath = path.join(outputDir, 'agent-pfp-prompt-catalog.html');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

fs.mkdirSync(outputDir, { recursive: true });

const serializedCatalog = JSON.stringify(catalog)
  .replace(/</g, '\\u003c')
  .replace(/-->/g, '--\\>');

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>TNF Agent PFP Prompt Catalog</title>
    <style>
      :root {
        --bg: #07111f;
        --bg-soft: #0d1728;
        --card: rgba(8, 15, 27, 0.92);
        --card-edge: rgba(148, 163, 184, 0.14);
        --text: #ecf4ff;
        --muted: #9fb2ca;
        --accent: #67e8f9;
        --accent-2: #f59e0b;
        --success: #34d399;
        --shadow: 0 24px 80px rgba(0, 0, 0, 0.4);
        color-scheme: dark;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family:
          Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top left, rgba(103, 232, 249, 0.18), transparent 24%),
          radial-gradient(circle at top right, rgba(245, 158, 11, 0.12), transparent 20%),
          linear-gradient(180deg, #06101c 0%, #081321 55%, #040912 100%);
        color: var(--text);
        min-height: 100vh;
      }

      a {
        color: inherit;
      }

      .shell {
        width: min(1480px, calc(100vw - 32px));
        margin: 0 auto;
        padding: 28px 0 48px;
      }

      .hero {
        position: sticky;
        top: 0;
        z-index: 40;
        backdrop-filter: blur(18px);
        background: linear-gradient(180deg, rgba(6, 11, 20, 0.94), rgba(6, 11, 20, 0.7));
        border: 1px solid rgba(148, 163, 184, 0.1);
        box-shadow: var(--shadow);
        border-radius: 28px;
        padding: 22px;
      }

      .eyebrow {
        display: inline-flex;
        gap: 8px;
        align-items: center;
        font-size: 11px;
        letter-spacing: 0.24em;
        text-transform: uppercase;
        color: var(--accent);
        padding: 7px 12px;
        border-radius: 999px;
        background: rgba(103, 232, 249, 0.08);
        border: 1px solid rgba(103, 232, 249, 0.16);
      }

      h1 {
        font-size: clamp(2rem, 4.6vw, 4.2rem);
        line-height: 0.95;
        margin: 18px 0 14px;
        letter-spacing: -0.05em;
      }

      .subtitle {
        max-width: 980px;
        font-size: 1rem;
        line-height: 1.6;
        color: var(--muted);
        margin: 0 0 18px;
      }

      .top-meta,
      .style-meta,
      .card-meta,
      .badge-row,
      .motif-row,
      .control-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .pill,
      .badge,
      .motif {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 999px;
        padding: 7px 12px;
        font-size: 12px;
        line-height: 1;
        border: 1px solid rgba(148, 163, 184, 0.12);
        background: rgba(148, 163, 184, 0.06);
        color: var(--text);
      }

      .pill.accent {
        background: rgba(103, 232, 249, 0.1);
        border-color: rgba(103, 232, 249, 0.18);
        color: #cbfbff;
      }

      .pill.gold {
        background: rgba(245, 158, 11, 0.1);
        border-color: rgba(245, 158, 11, 0.2);
        color: #ffe4b0;
      }

      .controls {
        display: grid;
        grid-template-columns: minmax(0, 1.8fr) 220px 220px 180px;
        gap: 14px;
        margin-top: 22px;
      }

      .field,
      .stat,
      .style-panel,
      .card {
        border: 1px solid var(--card-edge);
        background: var(--card);
        border-radius: 24px;
        box-shadow: var(--shadow);
      }

      .field {
        padding: 0 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        height: 56px;
      }

      input,
      select {
        width: 100%;
        background: transparent;
        border: 0;
        color: var(--text);
        font: inherit;
        outline: none;
      }

      input::placeholder {
        color: #7e93ad;
      }

      .style-panel {
        margin: 26px 0 22px;
        padding: 20px;
      }

      .style-panel h2 {
        margin: 0 0 10px;
        font-size: 1.35rem;
      }

      .style-copy {
        margin-top: 14px;
        padding: 16px;
        border-radius: 18px;
        background: rgba(0, 0, 0, 0.26);
        border: 1px solid rgba(148, 163, 184, 0.08);
        white-space: pre-wrap;
        line-height: 1.7;
        color: #dbeafe;
      }

      .stats {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
        margin: 18px 0 24px;
      }

      .stat {
        padding: 18px;
      }

      .stat-label {
        font-size: 11px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: #8ea3be;
        margin-bottom: 8px;
      }

      .stat-value {
        font-size: 1.8rem;
        font-weight: 800;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
      }

      .card {
        padding: 18px;
      }

      .card-header {
        display: grid;
        grid-template-columns: 72px minmax(0, 1fr);
        gap: 16px;
        align-items: start;
      }

      .avatar {
        width: 72px;
        height: 72px;
        border-radius: 24px;
        display: grid;
        place-items: center;
        font-size: 1.55rem;
        font-weight: 800;
        color: #fff;
        letter-spacing: 0.08em;
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
      }

      .card-title {
        margin: 0;
        font-size: 1.2rem;
      }

      .card-role {
        margin: 6px 0 0;
        color: var(--accent);
        font-size: 12px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }

      .card-tagline {
        margin: 16px 0 10px;
        font-size: 0.96rem;
        color: #f8fafc;
        font-weight: 600;
      }

      .card-summary {
        margin: 0;
        color: var(--muted);
        line-height: 1.6;
        font-size: 0.94rem;
      }

      .section-label {
        margin: 16px 0 10px;
        font-size: 11px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: #7e93ad;
      }

      .prompt-box {
        border-radius: 18px;
        background: rgba(0, 0, 0, 0.24);
        border: 1px solid rgba(148, 163, 184, 0.08);
        padding: 14px;
        min-height: 178px;
        max-height: 230px;
        overflow: auto;
        white-space: pre-wrap;
        line-height: 1.65;
        color: #e6f0ff;
      }

      .negative-box {
        min-height: 90px;
        max-height: 120px;
      }

      button {
        appearance: none;
        border: 1px solid rgba(103, 232, 249, 0.18);
        background: rgba(103, 232, 249, 0.08);
        color: #dffcff;
        border-radius: 999px;
        padding: 11px 14px;
        font: inherit;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
      }

      button.secondary {
        border-color: rgba(245, 158, 11, 0.2);
        background: rgba(245, 158, 11, 0.08);
        color: #ffe4b0;
      }

      button.ghost {
        border-color: rgba(148, 163, 184, 0.12);
        background: rgba(255, 255, 255, 0.02);
        color: #d6e3f3;
      }

      .empty {
        display: none;
        text-align: center;
        padding: 48px 20px;
        color: var(--muted);
        border: 1px dashed rgba(148, 163, 184, 0.18);
        border-radius: 24px;
        margin-top: 18px;
      }

      .source-file {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        color: #dbeafe;
        word-break: break-word;
      }

      .footer {
        margin-top: 24px;
        color: #7e93ad;
        font-size: 13px;
      }

      @media (max-width: 1200px) {
        .grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 920px) {
        .controls,
        .stats,
        .grid {
          grid-template-columns: 1fr;
        }

        .shell {
          width: min(100vw - 20px, 1480px);
        }

        .hero {
          position: static;
        }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <section class="hero">
        <div class="eyebrow">TNF Agent Builder / PFP Prompt Catalog</div>
        <h1>Future-retro agent portraits for every definition in the bank.</h1>
        <p class="subtitle">
          This standalone HTML catalog is generated from the agent visual profile registry.
          It packages the associated agent profile, badge system, motifs, and full Gemini Nano Banana 2 image prompt for each agent so you can batch-generate PFPs without opening the app.
        </p>

        <div class="top-meta">
          <span class="pill accent" id="agent-count-pill"></span>
          <span class="pill gold" id="model-pill"></span>
          <span class="pill" id="style-pill"></span>
          <span class="pill" id="result-pill"></span>
        </div>

        <div class="controls">
          <label class="field">
            <span>Search</span>
            <input id="search-input" type="search" placeholder="Search by name, role, badge, motif, source, or prompt text..." />
          </label>
          <label class="field">
            <span>Source</span>
            <select id="source-filter"></select>
          </label>
          <label class="field">
            <span>Status</span>
            <select id="status-filter">
              <option value="all">All statuses</option>
              <option value="ready-for-generation">Ready for generation</option>
            </select>
          </label>
          <div class="field">
            <button id="copy-style-prompt" type="button">Copy Style Prompt</button>
          </div>
        </div>
      </section>

      <section class="style-panel">
        <h2>Global Style System</h2>
        <div class="style-meta">
          <span class="pill accent" id="style-model"></span>
          <span class="pill gold" id="style-name"></span>
          <span class="pill" id="style-badge-system"></span>
        </div>
        <div class="section-label">Style Prompt Prefix</div>
        <div class="style-copy" id="style-copy"></div>
        <div class="section-label">Render Notes</div>
        <div class="badge-row" id="render-notes"></div>
      </section>

      <section class="stats">
        <div class="stat">
          <div class="stat-label">Total agents</div>
          <div class="stat-value" id="stat-total"></div>
        </div>
        <div class="stat">
          <div class="stat-label">Visible results</div>
          <div class="stat-value" id="stat-visible"></div>
        </div>
        <div class="stat">
          <div class="stat-label">Unique sources</div>
          <div class="stat-value" id="stat-sources"></div>
        </div>
        <div class="stat">
          <div class="stat-label">Prompt status</div>
          <div class="stat-value" id="stat-status"></div>
        </div>
      </section>

      <main class="grid" id="catalog-grid"></main>
      <div class="empty" id="empty-state">No prompt cards match the current filter.</div>

      <div class="footer">
        Generated from <span id="generated-from"></span>. File created for browser-based review and prompt copy workflows.
      </div>
    </div>

    <script>
      const catalog = ${serializedCatalog};

      const paletteMap = {
        amber: '#f59e0b',
        blue: '#2563eb',
        burgundy: '#7f1d1d',
        cobalt: '#1d4ed8',
        crimson: '#dc2626',
        cyan: '#06b6d4',
        'deep burgundy': '#6f1d1b',
        'electric blue': '#38bdf8',
        emerald: '#10b981',
        gold: '#fbbf24',
        graphite: '#374151',
        gunmetal: '#1f2937',
        indigo: '#4f46e5',
        magenta: '#db2777',
        navy: '#1e3a8a',
        obsidian: '#0f172a',
        onyx: '#111827',
        'royal blue': '#1d4ed8',
        rose: '#fb7185',
        silver: '#94a3b8',
        slate: '#334155',
        smoke: '#64748b',
        steel: '#475569',
        teal: '#0f766e',
        titanium: '#94a3b8',
        violet: '#7c3aed',
        'white gold': '#f8fafc',
        'sunrise orange': '#f97316',
        'midnight plum': '#581c87'
      };

      const grid = document.getElementById('catalog-grid');
      const emptyState = document.getElementById('empty-state');
      const searchInput = document.getElementById('search-input');
      const sourceFilter = document.getElementById('source-filter');
      const statusFilter = document.getElementById('status-filter');
      const resultPill = document.getElementById('result-pill');
      const statVisible = document.getElementById('stat-visible');
      const statTotal = document.getElementById('stat-total');
      const statSources = document.getElementById('stat-sources');
      const statStatus = document.getElementById('stat-status');

      function escapeHtml(value) {
        return String(value || '').replace(/[&<>"]/g, (char) => {
          switch (char) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            default: return char;
          }
        });
      }

      function initials(name) {
        return String(name || '')
          .trim()
          .split(/\\s+/)
          .map((part) => part[0] || '')
          .join('')
          .slice(0, 2)
          .toUpperCase() || 'AI';
      }

      function paletteGradient(colors) {
        const primary = paletteMap[colors?.[0]] || '#1d4ed8';
        const secondary = paletteMap[colors?.[1]] || '#0f766e';
        return 'linear-gradient(135deg, ' + primary + ', ' + secondary + ')';
      }

      async function copyText(text) {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
          }
        } catch (error) {}

        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'absolute';
        area.style.left = '-9999px';
        document.body.appendChild(area);
        area.select();
        try {
          document.execCommand('copy');
          document.body.removeChild(area);
          return true;
        } catch (error) {
          document.body.removeChild(area);
          return false;
        }
      }

      function setButtonFeedback(button, successLabel, fallbackLabel) {
        const original = button.dataset.originalLabel || button.textContent;
        button.dataset.originalLabel = original;
        button.textContent = successLabel;
        window.setTimeout(() => {
          button.textContent = fallbackLabel || original;
        }, 1800);
      }

      function buildSourceOptions() {
        const kinds = Array.from(new Set(catalog.agents.map((agent) => agent.sourceKind))).sort();
        sourceFilter.innerHTML =
          '<option value="all">All sources</option>' +
          kinds.map((kind) => '<option value="' + escapeHtml(kind) + '">' + escapeHtml(kind) + '</option>').join('');
      }

      function cardMarkup(agent) {
        const prompt = escapeHtml(agent.promptSpec.imagePrompt);
        const negativePrompt = escapeHtml(agent.promptSpec.negativePrompt);
        const summary = escapeHtml(agent.profile.summary);
        const tagline = escapeHtml(agent.profile.tagline);
        const sourceFile = escapeHtml(agent.sourceFile);
        const gradient = paletteGradient(agent.profile.accentPalette || []);
        const badgeHtml = agent.profile.badgeSet
          .map((badge) => '<span class="badge">' + escapeHtml(badge.name) + '</span>')
          .join('');
        const motifHtml = agent.profile.visualMotifs
          .map((motif) => '<span class="motif">' + escapeHtml(motif) + '</span>')
          .join('');
        const renderedRole = escapeHtml(agent.profile.role);
        const renderedStatus = escapeHtml(agent.profile.promptStatus);
        const renderedSource = escapeHtml(agent.sourceKind);
        const renderedLookupCount = String(agent.lookupKeys.length || 0);

        return \`
          <article class="card">
            <div class="card-header">
              <div class="avatar" style="background: \${gradient};">\${escapeHtml(initials(agent.displayName))}</div>
              <div>
                <div class="card-meta">
                  <span class="pill accent">\${renderedSource}</span>
                  <span class="pill gold">\${renderedStatus}</span>
                </div>
                <h2 class="card-title">\${escapeHtml(agent.displayName)}</h2>
                <p class="card-role">\${renderedRole}</p>
              </div>
            </div>

            <p class="card-tagline">\${tagline}</p>
            <p class="card-summary">\${summary}</p>

            <div class="section-label">Badge System</div>
            <div class="badge-row">\${badgeHtml}</div>

            <div class="section-label">Visual Motifs</div>
            <div class="motif-row">\${motifHtml}</div>

            <div class="section-label">Agent Profile Notes</div>
            <div class="card-meta">
              <span class="pill">Machine ID: \${escapeHtml(agent.profile.machineId)}</span>
              <span class="pill">Lookup Keys: \${renderedLookupCount}</span>
            </div>

            <div class="section-label">Gemini PFP Prompt</div>
            <div class="prompt-box">\${prompt}</div>

            <div class="control-row" style="margin-top: 12px;">
              <button type="button" data-copy-type="prompt" data-copy-text="\${escapeHtml(agent.promptSpec.imagePrompt)}">Copy prompt</button>
              <button type="button" class="secondary" data-copy-type="negative" data-copy-text="\${escapeHtml(agent.promptSpec.negativePrompt)}">Copy negative</button>
            </div>

            <div class="section-label">Negative Prompt</div>
            <div class="prompt-box negative-box">\${negativePrompt}</div>

            <div class="section-label">Source File</div>
            <div class="source-file">\${sourceFile}</div>
          </article>
        \`;
      }

      function filterAgents() {
        const query = searchInput.value.trim().toLowerCase();
        const source = sourceFilter.value;
        const status = statusFilter.value;

        return catalog.agents.filter((agent) => {
          if (source !== 'all' && agent.sourceKind !== source) {
            return false;
          }

          if (status !== 'all' && agent.profile.promptStatus !== status) {
            return false;
          }

          if (!query) {
            return true;
          }

          const haystack = [
            agent.displayName,
            agent.slug,
            agent.profile.role,
            agent.profile.tagline,
            agent.profile.summary,
            agent.sourceKind,
            agent.sourceFile,
            agent.promptSpec.imagePrompt,
            agent.promptSpec.negativePrompt,
            ...(agent.profile.badgeSet || []).map((badge) => badge.name),
            ...(agent.profile.visualMotifs || []),
          ]
            .join(' ')
            .toLowerCase();

          return haystack.includes(query);
        });
      }

      function render() {
        const filteredAgents = filterAgents();
        grid.innerHTML = filteredAgents.map(cardMarkup).join('');
        emptyState.style.display = filteredAgents.length ? 'none' : 'block';
        resultPill.textContent = filteredAgents.length + ' visible cards';
        statVisible.textContent = String(filteredAgents.length);
      }

      document.getElementById('agent-count-pill').textContent = catalog.totalAgents + ' agents';
      document.getElementById('model-pill').textContent = catalog.styleSystem.modelTarget;
      document.getElementById('style-pill').textContent = catalog.styleSystem.styleName;
      document.getElementById('style-model').textContent = 'Model target: ' + catalog.styleSystem.modelTarget;
      document.getElementById('style-name').textContent = catalog.styleSystem.styleName;
      document.getElementById('style-badge-system').textContent = catalog.styleSystem.badgeSystem;
      document.getElementById('style-copy').textContent = catalog.styleSystem.promptPrefix;
      document.getElementById('generated-from').textContent = (catalog.generatedFrom || []).join(', ');
      document.getElementById('render-notes').innerHTML = (catalog.styleSystem.renderNotes || [])
        .map((note) => '<span class="badge">' + escapeHtml(note) + '</span>')
        .join('');
      statTotal.textContent = String(catalog.totalAgents);
      statSources.textContent = String(new Set(catalog.agents.map((agent) => agent.sourceKind)).size);
      statStatus.textContent = 'Ready';

      buildSourceOptions();
      render();

      searchInput.addEventListener('input', render);
      sourceFilter.addEventListener('change', render);
      statusFilter.addEventListener('change', render);

      document.getElementById('copy-style-prompt').addEventListener('click', async (event) => {
        const success = await copyText(catalog.styleSystem.promptPrefix);
        setButtonFeedback(event.currentTarget, success ? 'Copied style prompt' : 'Copy unavailable');
      });

      grid.addEventListener('click', async (event) => {
        const button = event.target.closest('button[data-copy-text]');
        if (!button) {
          return;
        }

        const text = button.getAttribute('data-copy-text') || '';
        const success = await copyText(text);
        setButtonFeedback(button, success ? 'Copied' : 'Copy unavailable');
      });
    </script>
  </body>
</html>
`;

fs.writeFileSync(outputPath, html, 'utf8');

console.log(outputPath);
