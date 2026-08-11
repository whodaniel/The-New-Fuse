#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const TNF_ROOT_DIR = process.env.TNF_ROOT_DIR || process.cwd();
const AGENTS_DIR = path.join(TNF_ROOT_DIR, '.agent/agents');
const LEDGER_PATH = path.join(TNF_ROOT_DIR, 'docs/protocols/AGENT_STATUS_LEDGER.md');

function extractFrontmatterName(content) {
  const match = content.match(/^name:\s*([^\n]+)/m);
  return match ? match[1].trim() : null;
}

const HISTORICAL_HEADING = '## Historical Agents (Knowledge-Only)';

/**
 * Move stale definition-layer identities into a Historical section,
 * preserving their federation/tenant scope of origin. Knowledge is kept —
 * the identity, where it lived, when and why it was retired — while the
 * active sections stop asserting the expectation. Only full table rows
 * containing the identity are removed from active sections; prose mentions
 * elsewhere are knowledge and stay untouched.
 */
function archiveStaleIdentities(staleIdentities, ledgerPath, ledgerContent) {
  try {
    let content = ledgerContent;
    const today = new Date().toISOString().slice(0, 10);

    // Ensure the Historical section exists (before Session Logs if present).
    if (!content.includes(HISTORICAL_HEADING)) {
      const historicalBlock = [
        '',
        HISTORICAL_HEADING,
        '',
        'Retired identities kept for ecosystem knowledge. Entries here are never',
        'expected at boot; they record which federation/tenant scope each agent',
        'served and why it was retired. See data/boot-stale-expectations.json',
        'for path/artifact-level equivalents.',
        '',
        '| Identity | Origin Scope | Archived | Reason |',
        '| -------- | ------------ | -------- | ------ |',
        '',
      ].join('\n');
      const sessionLogsIdx = content.indexOf('## Session Logs');
      content =
        sessionLogsIdx >= 0
          ? content.slice(0, sessionLogsIdx) + historicalBlock + '\n' + content.slice(sessionLogsIdx)
          : content + '\n' + historicalBlock;
    }

    for (const s of staleIdentities) {
      // Drop full table rows in active sections that assert this identity.
      content = content
        .split('\n')
        .filter((line) => !(line.trimStart().startsWith('|') && line.includes(`\`${s.id}\``) && !line.includes('Origin Scope')))
        .join('\n');
      // Append the archive row under the Historical table header.
      const row = `| \`${s.id}\` | ${s.section} | ${today} | no current definition; past edge case |`;
      const headerIdx = content.indexOf('| Identity | Origin Scope | Archived | Reason |');
      if (headerIdx >= 0) {
        const insertAt = content.indexOf('\n', content.indexOf('\n', headerIdx) + 1) + 1;
        content = content.slice(0, insertAt) + row + '\n' + content.slice(insertAt);
      } else {
        content += `\n${row}\n`;
      }
    }

    fs.writeFileSync(ledgerPath, content);
    return true;
  } catch {
    return false;
  }
}

function isOperationalAgent(filePath, content) {
  if (content.includes('[native-cron]') || content.includes('[tnf-native]')) return true;
  if (content.includes('schedule:') && content.match(/schedule:\s*every|schedule:\s*\*\//m)) return true;
  if (content.includes('supervisor:') && content.match(/supervisor:\s*(true|false)/m)) return true;
  if (content.includes('Runtime:') || content.includes('runtime:')) return true;
  const basename = path.basename(filePath, '.md');
  if (['continuous-improver', 'thenewfuse-frontend-tester', 'tnf-fleet-health-probe', 'staff-review-agent', 'staffing-director-agent', 'agent-registry-manager', 'reputation-management-agent'].includes(basename)) return true;
  const importedIndicators = ['MUST BE USED to', 'When the user asks for', 'This skill is for', 'imported-claude-agents'];
  const hasImportedIndicator = importedIndicators.some((ind) => content.includes(ind));
  if (hasImportedIndicator) return false;
  return false;
}

function scanAgentFiles(agentsDir) {
  const agents = [];
  if (!fs.existsSync(agentsDir)) return agents;

  const files = fs.readdirSync(agentsDir).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    const filePath = path.join(agentsDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const name = extractFrontmatterName(content);
      if (name && isOperationalAgent(filePath, content)) {
        agents.push({ name, file, path: filePath });
      }
    } catch {
    }
  }
  return agents;
}

function extractRegisteredAgents(ledgerContent) {
  const registered = new Set();

  const greenMatch = ledgerContent.match(/## Green Federation[\s\S]*?(?=## |\n##|$)/);
  if (greenMatch) {
    const greenSection = greenMatch[0];
    const componentMatches = greenSection.match(/\| [^|]+ \| `([^`]+)` \|/g);
    if (componentMatches) {
      for (const match of componentMatches) {
        const idMatch = match.match(/`([^`]+)`/);
        if (idMatch && idMatch[1] && !idMatch[1].includes('*') && !idMatch[1].includes('+')) {
          registered.add(idMatch[1]);
        }
      }
    }
  }

  const tableRows = ledgerContent.match(/\|[^|\n]+AGENT[^|\n]+\|/gi);
  if (tableRows) {
    for (const row of tableRows) {
      const cells = row.split('|').filter((c) => c.trim());
      if (cells.length >= 2) {
        const lastCell = cells[cells.length - 1].trim();
        const idMatch = lastCell.match(/`([^`]+)`/);
        if (idMatch && idMatch[1]) {
          registered.add(idMatch[1]);
        }
      }
    }
  }

  const agentIds = ledgerContent.match(/`TNF:[^`]+`/g);
  if (agentIds) {
    for (const id of agentIds) {
      // Store bare identity tokens (matching uses TNF:... without markdown fences).
      registered.add(id.replace(/^`|`$/g, ''));
    }
  }

  const nameMatches = ledgerContent.match(/\*\*Agent\*\*:\s*([^\n*]+)/gi);
  if (nameMatches) {
    for (const match of nameMatches) {
      const name = match.replace(/\*\*Agent\*\*:\s*/i, '').trim();
      if (name && name.length > 2 && name.length < 100) {
        registered.add(name);
      }
    }
  }

  return registered;
}

function identitySlug(name) {
  return String(name || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function agentIdentity(name) {
  return `TNF:LOCAL:AGENT:${identitySlug(name)}:001`;
}

function appendToLedger(newAgents, ledgerPath) {
  if (!fs.existsSync(ledgerPath)) {
    console.error('Ledger file not found');
    return false;
  }

  let content = fs.readFileSync(ledgerPath, 'utf8');

  const timestamp = new Date().toISOString();
  const entries = [];

  for (const agent of newAgents) {
    entries.push(
      `| ${agent.name} | \`${agentIdentity(agent.name)}\` | **NEW** — registered at ${timestamp} |`
    );
  }

  if (entries.length === 0) {
    return true;
  }

  let insertIndex = content.length;
  const headerMatch = content.match(/## Session Logs/);
  if (headerMatch && typeof headerMatch.index === 'number') {
    insertIndex = headerMatch.index;
  }

  const newSection =
    '\n\n### Newly Registered (This Session)\n\n| Agent | Identity | Status |\n| ----- | -------- | ------ |\n' +
    entries.join('\n') +
    '\n\n';

  content = content.slice(0, insertIndex) + newSection + content.slice(insertIndex);

  fs.writeFileSync(ledgerPath, content, 'utf8');
  console.log(`Auto-registered ${newAgents.length} agent(s) to ledger`);
  return true;
}

function printUsage() {
  console.log('Usage: node scripts/check-agent-registration.cjs [options]');
  console.log('');
  console.log('Options:');
  console.log('  -h, --help    Show this help');
  console.log('  --fix         Auto-register missing agents in the ledger');
  console.log('  --archive     Move stale ledger identities into the Historical (knowledge-only) section');
  console.log('  --verbose     Show detailed output');
}

function parseArgs(argv) {
  const result = { help: false, fix: false, verbose: false, archive: false };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') {
      result.help = true;
    } else if (arg === '--fix') {
      result.fix = true;
    } else if (arg === '--verbose') {
      result.verbose = true;
    } else if (arg === '--archive') {
      result.archive = true;
    }
  }

  return result;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  console.log('TNF Agent Registration Checker');
  console.log(`Workspace: ${TNF_ROOT_DIR}`);
  console.log('');

  if (!fs.existsSync(AGENTS_DIR)) {
    console.error(`Error: .agent/agents/ directory not found at ${AGENTS_DIR}`);
    process.exit(1);
  }

  if (!fs.existsSync(LEDGER_PATH)) {
    console.error(`Error: AGENT_STATUS_LEDGER.md not found at ${LEDGER_PATH}`);
    process.exit(1);
  }

  const agents = scanAgentFiles(AGENTS_DIR);
  console.log(`Found ${agents.length} agent definition(s) in .agent/agents/`);

  const ledgerContent = fs.readFileSync(LEDGER_PATH, 'utf8');
  const registeredAgents = extractRegisteredAgents(ledgerContent);
  console.log(`Found ${registeredAgents.size} registered agent identity/ies in ledger`);

  if (args.verbose) {
    console.log('');
    console.log('Registered identities:');
    for (const id of registeredAgents) {
      console.log(`  - ${id}`);
    }
  }

  const unregistered = [];

  for (const agent of agents) {
    let isRegistered = false;

    const identity = agentIdentity(agent.name);
    if (registeredAgents.has(identity)) {
      isRegistered = true;
    }

    const nameVariants = [
      agent.name,
      agent.name.toLowerCase(),
      agent.name.toUpperCase(),
      `**Agent**: ${agent.name}`,
      agent.name.replace(/-agent$/, ''),
    ];

    for (const variant of nameVariants) {
      if (registeredAgents.has(variant) || ledgerContent.includes(variant)) {
        isRegistered = true;
        break;
      }
    }

    if (!isRegistered) {
      unregistered.push(agent);
    }
  }

  // Reverse check (operator directive 2026-07-22): ledger identities with no
  // current definition are stale expectations from past edge cases. Knowledge
  // of them is fine; counting them as registered actives is not.
  //
  // Federated/multitenant scoping: an identity's scope is the ledger section
  // it lives in. Federation-section identities are live components of that
  // federation layer (exempt from definition-based staleness); Historical-
  // section identities are already archived knowledge (exempt). Expectations
  // bind only to this workspace/tenant's definition layer (TNF_ROOT_DIR).
  const { parseLedgerIdentityScopes } = require('./lib/tnf-boot-triage.cjs');
  const definedNormalized = new Set();
  for (const file of fs.readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md'))) {
    definedNormalized.add(
      path.basename(file, '.md').toUpperCase().replace(/[^A-Z0-9]+/g, '-')
    );
    try {
      const name = extractFrontmatterName(fs.readFileSync(path.join(AGENTS_DIR, file), 'utf8'));
      if (name) definedNormalized.add(name.toUpperCase().replace(/[^A-Z0-9]+/g, '-'));
    } catch {}
  }
  const identityScopes = parseLedgerIdentityScopes(ledgerContent);
  const staleIdentities = [];
  for (const [id, scope] of identityScopes) {
    if (scope.federated) continue; // federation-layer component; liveness owned there
    if (scope.historical) continue; // already archived knowledge
    const name = (id.split(':')[3] || '').toUpperCase().replace(/[^A-Z0-9]+/g, '-');
    if (name && !definedNormalized.has(name)) staleIdentities.push({ id, section: scope.section });
  }
  if (staleIdentities.length > 0) {
    console.log('');
    console.log(
      `Stale ledger identities — knowledge-only, no current definition (${staleIdentities.length}):`
    );
    for (const s of staleIdentities) {
      console.log(`  - ${s.id}  [past edge case; scope: ${s.section}]`);
    }
    if (args.archive) {
      console.log('');
      const archived = archiveStaleIdentities(staleIdentities, LEDGER_PATH, ledgerContent);
      console.log(
        archived
          ? `Archived ${staleIdentities.length} identity/ies to "## Historical Agents (Knowledge-Only)".`
          : 'Archive step failed; ledger left unchanged.'
      );
    } else {
      console.log('  Run with --archive to move them into "## Historical Agents (Knowledge-Only)".');
    }
  }

  console.log('');
  if (unregistered.length === 0) {
    console.log(
      staleIdentities.length === 0
        ? 'All agents are registered.'
        : `All current agents are registered (${staleIdentities.length} stale ledger identity/ies noted above).`
    );
    process.exit(0);
  } else {
    console.log(`Unregistered agents (${unregistered.length}):`);
    for (const agent of unregistered) {
      console.log(`  - ${agent.name} (${agent.file})`);
    }

    if (args.fix) {
      console.log('');
      const success = appendToLedger(unregistered, LEDGER_PATH);
      if (success) {
        console.log('');
        console.log('Auto-registration complete.');
        process.exit(0);
      } else {
        console.error('');
        console.error('Auto-registration failed.');
        process.exit(1);
      }
    } else {
      console.log('');
      console.log('Run with --fix to auto-register missing agents.');
      process.exit(1);
    }
  }
}

main().catch((error) => {
  console.error(`Agent registration check failed: ${error?.message || 'unknown error'}`);
  process.exit(1);
});