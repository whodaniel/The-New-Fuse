#!/usr/bin/env node
/* eslint-disable no-console */

const { spawn, spawnSync } = require('node:child_process');

function usage() {
  console.log(`Usage: node scripts/codex-mcp-oauth-login.cjs [server] [options]

Wraps 'codex mcp login <server>' and opens the OAuth authorize URL automatically.

Options:
  --server <name>       MCP server name (default: TNF_CODEX_MCP_SERVER or supabase)
  --scopes <list>       Comma-separated OAuth scopes to pass through to Codex
  --codex-bin <path>    Codex executable (default: codex)
  --browser <command>   Browser/open command to use before platform fallbacks
  --no-open             Print the authorize URL but do not open it
  --dry-run             Verify Codex/server discovery without starting OAuth
  --json                Print a final JSON summary
  -h, --help            Show this help
`);
}

function parseArgs(argv) {
  const options = {
    server: process.env.TNF_CODEX_MCP_SERVER || 'supabase',
    codexBin: process.env.CODEX_BIN || 'codex',
    browser: process.env.BROWSER || '',
    scopes: '',
    open: true,
    dryRun: false,
    json: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') {
      options.help = true;
    } else if (arg === '--server') {
      options.server = argv[++i];
    } else if (arg === '--codex-bin') {
      options.codexBin = argv[++i];
    } else if (arg === '--browser') {
      options.browser = argv[++i];
    } else if (arg === '--scopes') {
      options.scopes = argv[++i];
    } else if (arg === '--no-open') {
      options.open = false;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (!arg.startsWith('-')) {
      options.server = arg;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (!options.server) throw new Error('Missing MCP server name');
  return options;
}

function runCapture(cmd, args) {
  return spawnSync(cmd, args, {
    encoding: 'utf8',
    env: process.env,
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function preflightCodex(options) {
  const getResult = runCapture(options.codexBin, ['mcp', 'get', options.server]);
  if (getResult.error) {
    throw new Error(`Unable to run ${options.codexBin}: ${getResult.error.message}`);
  }
  if ((getResult.status ?? 1) !== 0) {
    throw new Error(
      `Codex MCP server '${options.server}' is not available.\n${getResult.stderr || getResult.stdout}`.trim()
    );
  }

  const listResult = runCapture(options.codexBin, ['mcp', 'list']);
  const listOutput = `${listResult.stdout || ''}\n${listResult.stderr || ''}`;
  const serverLine = listOutput
    .split(/\r?\n/)
    .find((line) => new RegExp(`^\\s*${escapeRegExp(options.server)}\\s+`).test(line));
  const authColumn = serverLine?.match(/\b(OAuth|Unknown|Unsupported)\b\s*$/)?.[1] || 'unavailable';
  const oauthListed = authColumn === 'OAuth' || authColumn === 'Unknown';

  return {
    configured: true,
    oauthListed,
    authColumn,
    getOutput: getResult.stdout || '',
  };
}

function candidateOpenCommands(url, options) {
  const candidates = [];
  if (options.browser) candidates.push([options.browser, [url]]);

  if (process.platform === 'darwin') {
    candidates.push(['/usr/bin/open', [url]]);
    candidates.push(['/usr/bin/open', ['-a', 'Google Chrome', url]]);
    candidates.push(['/usr/bin/open', ['-a', 'Safari', url]]);
    candidates.push(['/usr/bin/open', ['-a', 'Firefox', url]]);
  } else if (process.platform === 'win32') {
    candidates.push(['cmd', ['/c', 'start', '', url]]);
  } else {
    candidates.push(['xdg-open', [url]]);
  }

  return candidates;
}

function openAuthorizeUrl(url, options) {
  if (!options.open) return { opened: false, skipped: true, attempts: [] };

  const attempts = [];
  for (const [cmd, args] of candidateOpenCommands(url, options)) {
    const result = spawnSync(cmd, args, {
      stdio: 'ignore',
      env: process.env,
    });
    attempts.push({ cmd, code: result.status ?? (result.error ? 1 : 0) });
    if (!result.error && (result.status ?? 0) === 0) {
      return { opened: true, skipped: false, attempts };
    }
  }

  return { opened: false, skipped: false, attempts };
}

function findAuthorizeUrl(text) {
  const matches = text.match(/https?:\/\/[^\s<>"']+/g) || [];
  return matches.find((url) => /oauth|authorize|response_type=code/i.test(url));
}

async function runLogin(options) {
  const preflight = preflightCodex(options);
  if (!preflight.oauthListed) {
    console.warn(
      `[codex-mcp-oauth] '${options.server}' is configured, but 'codex mcp list' did not mark it as OAuth. Continuing.`
    );
  }

  const args = ['mcp', 'login', options.server];
  if (options.scopes) args.push('--scopes', options.scopes);

  if (options.dryRun) {
    return {
      ok: true,
      dryRun: true,
      server: options.server,
      oauthListed: preflight.oauthListed,
      authColumn: preflight.authColumn,
      command: [options.codexBin, ...args],
      opened: false,
    };
  }

  console.log(`[codex-mcp-oauth] Starting: ${options.codexBin} ${args.join(' ')}`);

  const child = spawn(options.codexBin, args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: process.env,
  });

  let buffered = '';
  let authorizeUrl = '';
  let openResult = { opened: false, skipped: false, attempts: [] };

  const handleChunk = (chunk, stream) => {
    const text = chunk.toString();
    stream.write(text);
    buffered += text;

    if (!authorizeUrl) {
      const found = findAuthorizeUrl(buffered);
      if (found) {
        authorizeUrl = found;
        console.log(`[codex-mcp-oauth] Opening OAuth URL for '${options.server}'...`);
        openResult = openAuthorizeUrl(authorizeUrl, options);
        if (!openResult.opened) {
          console.warn(`[codex-mcp-oauth] Could not open automatically. Open this URL manually:\n${authorizeUrl}`);
        }
      }
    }
  };

  child.stdout.on('data', (chunk) => handleChunk(chunk, process.stdout));
  child.stderr.on('data', (chunk) => handleChunk(chunk, process.stderr));

  return await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      resolve({
        ok: code === 0,
        dryRun: false,
        server: options.server,
        oauthListed: preflight.oauthListed,
        authColumn: preflight.authColumn,
        authorizeUrlSeen: Boolean(authorizeUrl),
        opened: openResult.opened,
        openSkipped: openResult.skipped,
        openAttempts: openResult.attempts,
        exitCode: code,
        signal,
      });
    });
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    usage();
    return;
  }

  const result = await runLogin(options);
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  }
  if (!result.ok) {
    process.exit(result.exitCode || 1);
  }
}

main().catch((error) => {
  console.error(`[codex-mcp-oauth] ${error.message}`);
  process.exit(1);
});
