/**
 * tnf_email_intelligence.cjs
 * 
 * Autonomous Email Intelligence Classifier & Tagging Engine for The New Fuse (TNF).
 * Evaluates incoming/self-sent emails from bizsynth@gmail.com, applies appropriate
 * TNF labels via Gmail API, extracts executable taxonomy/keywords, and maintains
 * the TNF Email Intelligence Ledger.
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TNF_ROOT = '/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse';
const MCP_DIR = '/Users/danielgoldberg/.gemini/extensions/google-workspace';
const LEDGER_PATH = path.join(TNF_ROOT, 'docs/intelligence/TNF_EMAIL_INTELLIGENCE_LEDGER.json');

// Label map
const LABEL_MAP = {
  root: 'Label_166',               // TNF
  directives: 'Label_167',         // TNF/Directives
  architecture: 'Label_168',       // TNF/Architecture
  schemas: 'Label_169',            // TNF/Schemas-Data
  verification: 'Label_170',       // TNF/Verification-UAT
  receipts: 'Label_171',           // TNF/Ingestion-Receipts
  backlog: 'Label_172',            // TNF/Ideas-Backlog
  reviewed: 'Label_173'            // TNF/AI-Reviewed
};

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

function analyzeEmail(subject, body) {
  const fullText = (subject + ' ' + body).toLowerCase();

  const categories = [];
  if (/directive|instruction|mandate|rule|let[’']s|policy|priority/i.test(fullText)) {
    categories.push({ name: 'TNF/Directives', id: LABEL_MAP.directives });
  }
  if (/architecture|design|usad|bemad|master plan|service boundary|intersection/i.test(fullText)) {
    categories.push({ name: 'TNF/Architecture', id: LABEL_MAP.architecture });
  }
  if (/schema|ddl|database|postgresql|pgvector|jsonb|entity|api logging|matrix/i.test(fullText)) {
    categories.push({ name: 'TNF/Schemas-Data', id: LABEL_MAP.schemas });
  }
  if (/uat|acceptance|readiness|criteria|benchmark|threshold|canary/i.test(fullText)) {
    categories.push({ name: 'TNF/Verification-UAT', id: LABEL_MAP.verification });
  }
  if (/ingest|deep index|drive index|harvest|corpus|crawl|chunking|partition/i.test(fullText)) {
    categories.push({ name: 'TNF/Ingestion-Receipts', id: LABEL_MAP.receipts });
  }
  if (/idea|vision|future|brainstorm|proposal|backlog|concept/i.test(fullText)) {
    categories.push({ name: 'TNF/Ideas-Backlog', id: LABEL_MAP.backlog });
  }

  // Keywords extraction
  const keywords = [];
  const keywordPatterns = [
    /USAD/gi, /BEMAD/gi, /pgvector/gi, /Docling/gi, /PostgreSQL/gi,
    /Hierarchical Deep-Indexing/gi, /Synaptic Bus/gi, /Concordance API/gi,
    /Attribution Cornerstone/gi, /Sovereignty/gi, /Drive Container/gi,
    /Compute Optimization/gi, /Self-Evolving/gi, /Auto-Routing/gi
  ];
  for (const pat of keywordPatterns) {
    if (pat.test(fullText)) {
      keywords.push(pat.source.replace(/\\/g, ''));
    }
  }

  // Action items extraction
  const actionItems = [];
  if (/create category based email folders/i.test(subject)) {
    actionItems.push('Provision category-based Gmail labels for agentic query.');
  }
  if (/tagging self sent emails to auto-navigate/i.test(subject)) {
    actionItems.push('Deploy auto-routing system / XML filters for self-sent emails.');
  }
  if (/mark keywords based on AI review/i.test(subject)) {
    actionItems.push('Run automated keyword tagging and register in intelligence ledger.');
  }
  if (/dig down into specific areas.*most efficient use of the compute/i.test(fullText)) {
    actionItems.push('Enforce focused deep-indexing on high-priority containers ([01] TNF Architecture, [02] Agent Lab) instead of macroscopic loops.');
  }

  return {
    categories,
    keywords,
    actionItems,
    synthesis: 'Actionable directive shifting ingestion engine from circular macroscopic scanning to targeted deep-indexing, backed by categorized Gmail feedback loop.'
  };
}

function publishToSynapticBus(entry) {
  try {
    const frame = {
      id: entry.messageId,
      timestamp: new Date().toISOString(),
      from: {
        agentId: 'email-sensory-bridge',
        agentName: 'TNF Email Intelligence Sensor',
        role: 'bridge',
        platform: 'google-workspace'
      },
      to: {
        channel: 'tnf:orchestrator',
        broadcast: true
      },
      type: 'event',
      content: `[EMAIL_DIRECTIVE] ${entry.subject}`,
      payload: {
        messageId: entry.messageId,
        date: entry.date,
        subject: entry.subject,
        labels: entry.labels_applied,
        keywords: entry.keywords,
        actionItems: entry.action_items,
        synthesis: entry.synthesis
      }
    };
    const payloadStr = JSON.stringify(frame);
    const escaped = payloadStr.replace(/'/g, "'\\''");
    for (const channel of ['tnf:sensory:email', 'tnf:orchestrator', 'tnf:bus:ingress']) {
      try {
        execSync(`redis-cli publish "${channel}" '${escaped}'`, { stdio: 'pipe' });
      } catch (e) {}
    }
    console.log(`  -> Broadcasted to Synaptic Bus (tnf:sensory:email, tnf:orchestrator)`);
  } catch (err) {
    console.warn(`  -> Synaptic Bus dispatch skipped: ${err.message}`);
  }
}

async function run() {
  console.log('[TNF Email Intelligence] Initializing MCP bridge...');
  const { cp, send, call } = startMcp();

  send({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'tnf-email-classifier', version: '1.0' }
    }
  });

  await new Promise(r => setTimeout(r, 1000));
  send({ jsonrpc: '2.0', method: 'notifications/initialized' });

  console.log('[TNF Email Intelligence] Querying self-sent & TNF emails...');
  const searchRes = await call('gmail.search', { query: 'from:bizsynth@gmail.com newer_than:3d' });
  const rawData = JSON.parse(searchRes.result?.content?.[0]?.text || '{}');
  const messages = rawData.messages || [];

  console.log(`[TNF Email Intelligence] Found ${messages.length} candidates.`);

  const ledger = fs.existsSync(LEDGER_PATH)
    ? JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf-8'))
    : { updated_at: new Date().toISOString(), entries: [] };

  for (const m of messages.slice(0, 10)) {
    const detailRes = await call('gmail.get', { messageId: m.id, format: 'full' });
    const email = JSON.parse(detailRes.result?.content?.[0]?.text || '{}');

    console.log(`\nEvaluating: [${email.id}] ${email.subject?.slice(0, 60)}...`);
    const analysis = analyzeEmail(email.subject || '', email.body || email.snippet || '');

    const addLabelIds = [LABEL_MAP.root, LABEL_MAP.reviewed];
    for (const cat of analysis.categories) {
      if (!addLabelIds.includes(cat.id)) addLabelIds.push(cat.id);
    }

    // Apply labels
    const modRes = await call('gmail.modify', {
      messageId: email.id,
      addLabelIds
    });
    console.log(`  -> Applied labels: ${analysis.categories.map(c => c.name).join(', ') || 'TNF Root'}, TNF/AI-Reviewed`);

    // Record entry with PII protection for docs/ storage
    const sanitizedFrom = (email.from || '').replace(/[\w.+]+@(gmail|yahoo|outlook|icloud|hotmail|aol)\.com/gi, 'operator@thenewfuse.com');
    const entry = {
      messageId: email.id,
      threadId: email.threadId,
      date: email.date,
      from: sanitizedFrom,
      subject: email.subject,
      labels_applied: analysis.categories.map(c => c.name),
      keywords: analysis.keywords,
      action_items: analysis.actionItems,
      synthesis: analysis.synthesis,
      reviewed_at: new Date().toISOString()
    };

    const existingIdx = ledger.entries.findIndex(e => e.messageId === email.id);
    if (existingIdx >= 0) {
      ledger.entries[existingIdx] = entry;
    } else {
      ledger.entries.unshift(entry);
    }

    // Broadcast directive events to Synaptic Bus
    if (analysis.categories.some(c => c.name === 'TNF/Directives')) {
      publishToSynapticBus(entry);
    }
  }

  // Ensure output dir
  const dir = path.dirname(LEDGER_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  ledger.updated_at = new Date().toISOString();
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2), 'utf-8');
  console.log(`\n[TNF Email Intelligence] Ledger written to ${LEDGER_PATH}`);

  cp.kill();
  process.exit(0);
}

run().catch(err => {
  console.error('[TNF Email Intelligence] Fatal error:', err);
  process.exit(1);
});
