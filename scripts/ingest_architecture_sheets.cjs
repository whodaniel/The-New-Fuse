/**
 * ingest_architecture_sheets.cjs
 * 
 * Extracts full datasets from Google Sheets in Container [01] TNF Architecture & Design:
 * - 1PD3Izn67SyDIE4teYQFf7254xwBTAd1JG2S_RhOyOKk (TNF Data Design & API Logging - 1738 rows)
 * - 1aF5jxzlwZ6jl8PrApHncmKu5xwfUM5CyEuOdDcwad2k (UAT & Product Readiness Criteria)
 * 
 * Generates canonical database schemas and UAT matrices in docs/architecture/.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const TNF_ROOT = '/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse';
const MCP_DIR = '/Users/danielgoldberg/.gemini/extensions/google-workspace';
const ARCH_DIR = path.join(TNF_ROOT, 'docs/architecture');

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
  console.log('[Ingest Arch Sheets] Starting Google Workspace MCP...');
  const { cp, send, call } = startMcp();

  send({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'arch-ingest', version: '1.0' }
    }
  });

  await new Promise(r => setTimeout(r, 1000));
  send({ jsonrpc: '2.0', method: 'notifications/initialized' });

  if (!fs.existsSync(ARCH_DIR)) {
    fs.mkdirSync(ARCH_DIR, { recursive: true });
  }

  // 1. Ingest Data Design & API Logging (1,738 rows)
  console.log('[Ingest Arch Sheets] Fetching Data Design & API Logging (1PD3Izn67SyDIE4teYQFf7254xwBTAd1JG2S_RhOyOKk)...');
  const dataDesignRes = await call('sheets.getRange', {
    spreadsheetId: '1PD3Izn67SyDIE4teYQFf7254xwBTAd1JG2S_RhOyOKk',
    range: 'Sheet1!A1:E1738'
  });
  const dataDesignJson = JSON.parse(dataDesignRes.result?.content?.[0]?.text || '{}');
  const dataDesignRows = dataDesignJson.values || [];
  console.log(`[Ingest Arch Sheets] Received ${dataDesignRows.length} rows for Data Design.`);

  const dataDesignOutPath = path.join(ARCH_DIR, 'TNF_DATA_DESIGN_SPECIFICATIONS.json');
  fs.writeFileSync(dataDesignOutPath, JSON.stringify(dataDesignRows, null, 2), 'utf-8');

  // Convert to Markdown summary
  let mdSchema = '# 🏛️ TNF Data Design & Entity Specifications\n\n';
  mdSchema += `**Source Sheet:** \`1PD3Izn67SyDIE4teYQFf7254xwBTAd1JG2S_RhOyOKk\`\n`;
  mdSchema += `**Total Extracted Rows:** ${dataDesignRows.length}\n`;
  mdSchema += `**Extracted:** ${new Date().toISOString()}\n\n`;

  let currentCategory = '';
  let currentEntity = '';

  for (let i = 1; i < dataDesignRows.length; i++) {
    const [category, name, field, typeDetails, desc] = dataDesignRows[i] || [];
    if (!category && !name && !field) continue;

    if (category && category !== currentCategory) {
      currentCategory = category;
      mdSchema += `\n## ${currentCategory}\n\n`;
    }

    if (name && name !== currentEntity) {
      currentEntity = name;
      mdSchema += `\n### Entity: \`${currentEntity}\`\n\n`;
      mdSchema += '| Field / Sub-component | Type / Details | Description / Constraints |\n';
      mdSchema += '| :--- | :--- | :--- |\n';
    }

    if (field) {
      mdSchema += `| **\`${field}\`** | ${typeDetails || '—'} | ${(desc || '').replace(/\|/g, '\\|')} |\n`;
    }
  }

  const mdSchemaPath = path.join(ARCH_DIR, 'TNF_DATA_DESIGN_SPECIFICATIONS.md');
  fs.writeFileSync(mdSchemaPath, mdSchema, 'utf-8');
  console.log(`[Ingest Arch Sheets] Wrote ${mdSchemaPath}`);

  // 2. Ingest UAT & Product Readiness Criteria
  console.log('[Ingest Arch Sheets] Fetching UAT & Product Readiness (1aF5jxzlwZ6jl8PrApHncmKu5xwfUM5CyEuOdDcwad2k)...');
  const uatRes = await call('sheets.getRange', {
    spreadsheetId: '1aF5jxzlwZ6jl8PrApHncmKu5xwfUM5CyEuOdDcwad2k',
    range: 'Sheet1!A1:E600'
  });
  const uatJson = JSON.parse(uatRes.result?.content?.[0]?.text || '{}');
  const uatRows = uatJson.values || [];
  console.log(`[Ingest Arch Sheets] Received ${uatRows.length} rows for UAT Criteria.`);

  const uatOutPath = path.join(ARCH_DIR, 'TNF_UAT_PRODUCT_READINESS.json');
  fs.writeFileSync(uatOutPath, JSON.stringify(uatRows, null, 2), 'utf-8');

  let mdUat = '# 🎯 TNF Product Readiness & UAT Criteria\n\n';
  mdUat += `**Source Sheet:** \`1aF5jxzlwZ6jl8PrApHncmKu5xwfUM5CyEuOdDcwad2k\`\n`;
  mdUat += `**Total Criteria Rows:** ${uatRows.length}\n`;
  mdUat += `**Extracted:** ${new Date().toISOString()}\n\n`;

  let currentUatCategory = '';
  for (let i = 1; i < uatRows.length; i++) {
    const [category, critId, title, description, suggestion] = uatRows[i] || [];
    if (!category && !critId && !title) continue;

    if (category && category.trim()) {
      currentUatCategory = category.trim();
      mdUat += `\n## ${currentUatCategory}\n\n`;
      continue;
    }

    if (critId || title) {
      mdUat += `### [${critId || '—'}] ${title || 'Criterion'}\n\n`;
      if (description) mdUat += `* **Specification:** ${description}\n`;
      if (suggestion) mdUat += `* **Implementation & Verification:** ${suggestion}\n\n`;
    }
  }

  const mdUatPath = path.join(ARCH_DIR, 'TNF_UAT_PRODUCT_READINESS.md');
  fs.writeFileSync(mdUatPath, mdUat, 'utf-8');
  console.log(`[Ingest Arch Sheets] Wrote ${mdUatPath}`);

  cp.kill();
  console.log('[Ingest Arch Sheets] Complete!');
  process.exit(0);
}

run().catch(err => {
  console.error('[Ingest Arch Sheets] Error:', err);
  process.exit(1);
});
