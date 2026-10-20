/**
 * ingest_agent_research_lab.cjs
 *
 * Ingests and synthesizes all 10 spreadsheets inside Container [02] AI Agent Research Lab:
 * Folder ID: 1CdB83rLjTwA3hDnyifyt8ZjSIDm63mtb
 *
 * Extracts:
 * 1. Agent Personas (AgentID, Title, Domain, Function, Tools/Context, Collaboration Patterns, Skills)
 * 2. Multi-Agent Ecosystem Topologies (Holonic Architect, Policy Governance, Assimilation)
 * 3. Universal Taxonomy Comparison (Zapier, Make, n8n, Pipedream, Lindy)
 *
 * Emits canonical intelligence artifacts into docs/architecture/.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const TNF_ROOT = '/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse';
const MCP_DIR = '/Users/danielgoldberg/.gemini/extensions/google-workspace';
const ARCH_DIR = path.join(TNF_ROOT, 'docs/architecture');

const SHEET_TARGETS = [
  { id: '1hkQcP9lrQAjVazuOMfsU_S7f6QwbZIjwmHNmkmy2egA', label: 'Agent Personas Part 1' },
  { id: '1P1Fmz6gNr8JrIceJXW-Om5fiQM7xmaaSGscxNBcsXqo', label: 'Agent Personas Part 2' },
  { id: '11jZdp35uu0Ts6tZrUnHICwaLLrYFjXtbnXb2ogjwdTo', label: 'Universal Workflow Taxonomy' },
  { id: '1lMZPluAQjLMoRaaH5k6ZBi8arYHih5LelwTGRYnlKdE', label: 'Agent Personas Part 3' },
  { id: '1hbqAcSnXVm8jDnyNLS9KLtyMfD-qLm566PWHBYERh-k', label: 'Agent Personas Part 4' },
  { id: '1WxakzNujTN-XB2-koDDJrjKOqAw0ZSY87eT7ccg3710', label: 'Agent Personas Part 5' },
  { id: '1wrXnpz_EpGGM0fnJSChvnRPhorHdphp_-v_UEulndTo', label: 'Agent Personas Part 6' },
  { id: '10ayYoci4uzx-ecxxWPiw89xULHJX07q9bVA44TWiuAE', label: 'Agent Personas Part 7' },
  { id: '1Y9VxP440RmeZbFyEDDY1ZP6oZrqvQmESaBnB7ccKzZk', label: 'Agent Personas Part 8' },
  { id: '1WT14na2LHM_DE3U0gsQge6kEDCVmQqNuAezgEJshEQA', label: 'Agent Personas Part 9' }
];

function startMcp() {
  const cp = spawn('node', ['dist/index.js', '--use-dot-names'], {
    cwd: MCP_DIR,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let buffer = '';
  let nextId = 1;
  const callbacks = {};

  cp.stdout.on('data', (d) => {
    buffer += d.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        if (msg.id && callbacks[msg.id]) {
          callbacks[msg.id](msg);
          delete callbacks[msg.id];
        }
      } catch (e) {}
    }
  });

  function send(msg) {
    cp.stdin.write(JSON.stringify(msg) + '\n');
  }

  function call(name, args) {
    return new Promise((resolve) => {
      const id = ++nextId;
      callbacks[id] = (res) => resolve(res);
      send({ jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } });
    });
  }

  return { cp, send, call };
}

async function run() {
  console.log('[Ingest Agent Research Lab] Initializing Google Workspace MCP bridge...');
  const { cp, send, call } = startMcp();

  send({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'agent-research-ingest', version: '1.0' }
    }
  });

  await new Promise(r => setTimeout(r, 1000));
  send({ jsonrpc: '2.0', method: 'notifications/initialized' });

  if (!fs.existsSync(ARCH_DIR)) {
    fs.mkdirSync(ARCH_DIR, { recursive: true });
  }

  const allPersonas = [];
  const taxonomyRows = [];
  const seenAgentIds = new Set();

  for (const target of SHEET_TARGETS) {
    console.log(`[Ingest] Querying metadata for "${target.label}" (${target.id})...`);
    try {
      const meta = await call('sheets.getMetadata', { spreadsheetId: target.id });
      const metaObj = JSON.parse(meta.result?.content?.[0]?.text || '{}');
      const sheetTitle = metaObj.sheets?.[0]?.title || 'Sheet1';
      const rowCount = metaObj.sheets?.[0]?.rowCount || 500;

      console.log(`[Ingest] Fetching data from "${sheetTitle}" (up to ${rowCount} rows)...`);
      const rangeRes = await call('sheets.getRange', {
        spreadsheetId: target.id,
        range: `'${sheetTitle}'!A1:Z${Math.min(rowCount, 1000)}`
      });

      const rawJson = JSON.parse(rangeRes.result?.content?.[0]?.text || '{}');
      const rows = rawJson.values || [];
      console.log(`[Ingest] Read ${rows.length} rows from "${target.label}".`);

      if (rows.length === 0) continue;

      const header = rows[0].map(c => String(c).trim());

      if (header.includes('AgentID') || header.includes('Agent Role/Title')) {
        const idIdx = header.indexOf('AgentID');
        const roleIdx = header.indexOf('Agent Role/Title');
        const domainIdx = header.indexOf('Domain/Industry');
        const descIdx = header.indexOf('Core Function & Tasks');
        const toolsIdx = header.indexOf('Essential Context & Tools');
        const collabIdx = header.indexOf('Primary Collaboration Patterns & Interacting Agents');
        const skillsIdx = header.indexOf('Key Skills');

        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          const agentId = (r[idIdx] || '').trim();
          if (!agentId || seenAgentIds.has(agentId)) continue;
          seenAgentIds.add(agentId);

          allPersonas.push({
            agentId,
            roleTitle: (r[roleIdx] || '').trim(),
            domain: (r[domainIdx] || '').trim(),
            description: (r[descIdx] || '').trim(),
            contextAndTools: (r[toolsIdx] || '').trim(),
            collaboration: (r[collabIdx] || '').trim(),
            skills: (r[skillsIdx] || '').trim(),
            sourceSheet: target.id,
            sourceLabel: target.label
          });
        }
      } else if (header.includes('Universal Taxonomy Category')) {
        for (let i = 0; i < rows.length; i++) {
          taxonomyRows.push(rows[i]);
        }
      }
    } catch (e) {
      console.error(`[Ingest] Error fetching target ${target.id}:`, e.message);
    }
  }

  console.log(`\n========================================`);
  console.log(`[Ingest Agent Research Lab] Total Unique Personas Extracted: ${allPersonas.length}`);
  console.log(`[Ingest Agent Research Lab] Total Taxonomy Rows Extracted: ${taxonomyRows.length}`);
  console.log(`========================================\n`);

  // 1. Emit Agent Personas JSON
  const personasJsonPath = path.join(ARCH_DIR, 'TNF_AGENT_RESEARCH_LAB_PERSONAS.json');
  fs.writeFileSync(personasJsonPath, JSON.stringify(allPersonas, null, 2), 'utf-8');

  // 2. Emit Agent Personas Markdown
  let mdPersonas = '# 🤖 TNF Agent Research Lab — Discovered Personas & Topology\n\n';
  mdPersonas += `**Source Container:** \`[02] AI Agent Research Lab\` (Folder \`1CdB83rLjTwA3hDnyifyt8ZjSIDm63mtb\`)\n`;
  mdPersonas += `**Total Discovered Personas:** ${allPersonas.length}\n`;
  mdPersonas += `**Extracted:** ${new Date().toISOString()}\n\n`;

  // Domain groupings
  const domains = {};
  for (const p of allPersonas) {
    const dom = p.domain || 'General & Uncategorized';
    if (!domains[dom]) domains[dom] = [];
    domains[dom].push(p);
  }

  mdPersonas += `## Domain Breakdown\n\n`;
  for (const [dom, list] of Object.entries(domains)) {
    mdPersonas += `- **${dom}**: ${list.length} agent persona(s)\n`;
  }
  mdPersonas += '\n---\n\n## Agent Catalog\n\n';

  for (const [dom, list] of Object.entries(domains)) {
    mdPersonas += `### ${dom}\n\n`;
    for (const p of list) {
      mdPersonas += `#### \`${p.agentId}\` — ${p.roleTitle}\n`;
      mdPersonas += `- **Domain:** ${p.domain}\n`;
      mdPersonas += `- **Core Function:** ${p.description}\n`;
      if (p.contextAndTools) mdPersonas += `- **Context & Tools:** ${p.contextAndTools}\n`;
      if (p.collaboration) mdPersonas += `- **Collaboration Patterns:** ${p.collaboration}\n`;
      if (p.skills) mdPersonas += `- **Key Skills:** ${p.skills}\n`;
      mdPersonas += `- **Source Sheet:** \`${p.sourceSheet}\` (${p.sourceLabel})\n\n`;
    }
  }

  const personasMdPath = path.join(ARCH_DIR, 'TNF_AGENT_RESEARCH_LAB_PERSONAS.md');
  fs.writeFileSync(personasMdPath, mdPersonas, 'utf-8');

  // 3. Emit Universal Taxonomy JSON & MD
  if (taxonomyRows.length > 0) {
    const taxJsonPath = path.join(ARCH_DIR, 'TNF_UNIVERSAL_WORKFLOW_TAXONOMY.json');
    fs.writeFileSync(taxJsonPath, JSON.stringify(taxonomyRows, null, 2), 'utf-8');

    let mdTax = '# 🔄 Universal Workflow Automation & Agent Taxonomy\n\n';
    mdTax += `**Source:** Container \`[02] AI Agent Research Lab\` (Sheet \`11jZdp35uu0Ts6tZrUnHICwaLLrYFjXtbnXb2ogjwdTo\`)\n`;
    mdTax += `**Extracted:** ${new Date().toISOString()}\n\n`;

    mdTax += '| ' + (taxonomyRows[0] || []).map(c => String(c).replace(/\|/g, '\\|').trim()).join(' | ') + ' |\n';
    mdTax += '| ' + (taxonomyRows[0] || []).map(() => '---').join(' | ') + ' |\n';
    for (let i = 1; i < taxonomyRows.length; i++) {
      mdTax += '| ' + taxonomyRows[i].map(c => String(c).replace(/\|/g, '\\|').trim()).join(' | ') + ' |\n';
    }

    const taxMdPath = path.join(ARCH_DIR, 'TNF_UNIVERSAL_WORKFLOW_TAXONOMY.md');
    fs.writeFileSync(taxMdPath, mdTax, 'utf-8');
  }

  console.log('[Ingest] Wrote:');
  console.log(` - ${personasJsonPath}`);
  console.log(` - ${personasMdPath}`);
  console.log(`Done!`);
  process.exit(0);
}

run().catch(err => {
  console.error('[Ingest] Fatal error:', err);
  process.exit(1);
});
