#!/usr/bin/env node
/**
 * reconciliation_dashboard.mjs
 * Generates an HTML dashboard for monitoring review progress and contradictions.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../');
const reviewDir = path.join(root, 'data/reviews');
const statusPath = path.join(reviewDir, 'node_status.json');
const contradictionsPath = path.join(reviewDir, 'contradictions.json');
const outputPath = path.join(root, 'review_dashboard.html');

function main() {
  const status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
  const contradictions = JSON.parse(fs.readFileSync(contradictionsPath, 'utf-8'));

  const nodes = Object.values(status.nodes);
  const completed = nodes.filter(n => n.status === 'RECONCILED').length;
  const total = status.total_nodes;
  const pct = ((completed / total) * 100).toFixed(2);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TNF Review Dashboard</title>
  <style>
    :root {
      --bg: #0a0a0f; --surface: #111118; --text: #e0e0e5; --text-muted: #8888a0; --accent: #3b82f6; --border: #2a2a35;
      --ok: #10b981; --warn: #f59e0b; --err: #ef4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: var(--bg); color: var(--text); padding: 2rem; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { margin-bottom: 1rem; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem; }
    .card .num { font-size: 2rem; font-weight: 700; color: var(--accent); }
    .card .name { font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; }
    .progress-bar { width: 100%; height: 20px; background: var(--bg); border-radius: 10px; overflow: hidden; margin-top: 1rem; }
    .progress-fill { height: 100%; background: var(--accent); transition: width 0.5s ease; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.9rem; }
    th, td { text-align: left; padding: 0.75rem; border-bottom: 1px solid var(--border); }
    th { color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; }
    .status-RECONCILED { color: var(--ok); }
    .status-SYNTHESIZED { color: var(--accent); }
    .status-CHALLENGED { color: var(--warn); }
    .status-DISCOVERED { color: var(--warn); }
    .status-UNREVIEWED { color: var(--text-muted); }
    .severity-high { color: var(--err); font-weight: 700; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔬 TNF Systematic Review Dashboard</h1>
    <p style="color: var(--text-muted)">Nonprejudgest, nonassuming. Every node tracked.</p>

    <div class="stats">
      <div class="card">
        <div class="num">${pct}%</div>
        <div class="name">Complete</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>
      <div class="card">
        <div class="num">${nodes.filter(n => n.status === 'RECONCILED').length.toLocaleString()}</div>
        <div class="name">Reconciled</div>
      </div>
      <div class="card">
        <div class="num">${nodes.filter(n => n.status === 'UNREVIEWED').length.toLocaleString()}</div>
        <div class="name">Unreviewed</div>
      </div>
      <div class="card">
        <div class="num">${contradictions.contradictions.filter(c => c.status === 'open').length}</div>
        <div class="name">Open Contradictions</div>
      </div>
    </div>

    <h2>📊 By Cycle</h2>
    <table>
      <thead><tr><th>Cycle</th><th>Count</th><th>% of Total</th></tr></thead>
      <tbody>
        <tr><td class="status-UNREVIEWED">UNREVIEWED</td><td>${nodes.filter(n => n.status === 'UNREVIEWED').length.toLocaleString()}</td><td>${((nodes.filter(n => n.status === 'UNREVIEWED').length / total) * 100).toFixed(1)}%</td></tr>
        <tr><td class="status-DISCOVERED">DISCOVERED</td><td>${nodes.filter(n => n.status === 'DISCOVERED').length.toLocaleString()}</td><td>${((nodes.filter(n => n.status === 'DISCOVERED').length / total) * 100).toFixed(1)}%</td></tr>
        <tr><td class="status-CHALLENGED">CHALLENGED</td><td>${nodes.filter(n => n.status === 'CHALLENGED').length.toLocaleString()}</td><td>${((nodes.filter(n => n.status === 'CHALLENGED').length / total) * 100).toFixed(1)}%</td></tr>
        <tr><td class="status-SYNTHESIZED">SYNTHESIZED</td><td>${nodes.filter(n => n.status === 'SYNTHESIZED').length.toLocaleString()}</td><td>${((nodes.filter(n => n.status === 'SYNTHESIZED').length / total) * 100).toFixed(1)}%</td></tr>
        <tr><td class="status-RECONCILED">RECONCILED</td><td>${nodes.filter(n => n.status === 'RECONCILED').length.toLocaleString()}</td><td>${((nodes.filter(n => n.status === 'RECONCILED').length / total) * 100).toFixed(1)}%</td></tr>
      </tbody>
    </table>

    <h2>⚠️ Active Contradictions</h2>
    <table>
      <thead><tr><th>From</th><th>To</th><th>Severity</th><th>Discovered</th><th>Status</th></tr></thead>
      <tbody>
        ${contradictions.contradictions.filter(c => c.status === 'open').map(c => `
          <tr>
            <td>${c.from}</td>
            <td>${c.to}</td>
            <td class="severity-${c.severity}">${c.severity}</td>
            <td>${c.discovered_at}</td>
            <td>${c.status}</td>
          </tr>
        `).join('') || '<tr><td colspan="5" style="color:var(--text-muted)">No open contradictions</td></tr>'}
      </tbody>
    </table>
  </div>
</body>
</html>`;

  fs.writeFileSync(outputPath, html);
  console.log(`✅ Dashboard generated: ${outputPath}`);
}

main();
