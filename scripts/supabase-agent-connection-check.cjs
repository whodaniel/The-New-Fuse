#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const REPORT_PATH = path.join(ROOT, 'docs/protocols/reports/SUPABASE_AGENT_CONNECTION_LATEST.json');

function usage() {
  console.log(`Usage: node scripts/supabase-agent-connection-check.cjs [options]

Verifies the evidence needed before a TNF agent claims Supabase connection.
No Codex OAuth token files are read or printed.

Options:
  --server <name>       Codex MCP server name (default: supabase)
  --codex-bin <path>    Codex executable (default: codex)
  --login               Run the Codex MCP OAuth login wrapper if configured
  --no-open             Pass --no-open to the login wrapper
  --write               Write docs/protocols/reports/SUPABASE_AGENT_CONNECTION_LATEST.json
  --strict              Exit non-zero unless Codex Supabase MCP is configured and OAuth-capable
  --json                Print machine-readable JSON
  -h, --help            Show this help
`);
}

function parseArgs(argv) {
  const options = {
    server: process.env.TNF_CODEX_MCP_SERVER || 'supabase',
    codexBin: process.env.CODEX_BIN || 'codex',
    login: false,
    open: true,
    write: false,
    strict: false,
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
    } else if (arg === '--login') {
      options.login = true;
    } else if (arg === '--no-open') {
      options.open = false;
    } else if (arg === '--write') {
      options.write = true;
    } else if (arg === '--strict') {
      options.strict = true;
    } else if (arg === '--json') {
      options.json = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (!options.server) throw new Error('Missing MCP server name');
  return options;
}

function run(cmd, args) {
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: 'utf8',
    env: process.env,
  });
  return {
    code: result.status ?? (result.error ? 1 : 0),
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    error: result.error ? result.error.message : null,
  };
}

function redactUrl(value) {
  try {
    const url = new URL(value);
    return {
      host: url.host,
      pathname: url.pathname,
      projectRef: url.searchParams.get('project_ref') || null,
      features: url.searchParams.get('features') || null,
    };
  } catch {
    return null;
  }
}

function parseCodexGet(output) {
  const lines = output.split(/\r?\n/);
  const urlLine = lines.find((line) => line.trim().startsWith('url:'));
  const enabledLine = lines.find((line) => line.trim().startsWith('enabled:'));
  const transportLine = lines.find((line) => line.trim().startsWith('transport:'));
  const url = urlLine ? urlLine.slice(urlLine.indexOf(':') + 1).trim() : '';
  return {
    enabled: enabledLine ? /true/i.test(enabledLine) : false,
    transport: transportLine ? transportLine.slice(transportLine.indexOf(':') + 1).trim() : null,
    url: redactUrl(url),
  };
}

function parseAuthColumn(server, output) {
  const escaped = server.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const serverLine = output
    .split(/\r?\n/)
    .find((line) => new RegExp(`^\\s*${escaped}\\s+`).test(line));
  return serverLine?.match(/\b(OAuth|Unknown|Unsupported)\b\s*$/)?.[1] || 'unavailable';
}

function inspectEnvironment() {
  const hasUrl = Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const hasAnon = Boolean(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY);
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY);
  return {
    hasUrl,
    hasAnonKey: hasAnon,
    hasServiceRoleKey: hasServiceRole,
    dataPlaneReady: hasUrl && (hasAnon || hasServiceRole),
  };
}

function inspectCodex(options) {
  const get = run(options.codexBin, ['mcp', 'get', options.server]);
  if (get.code !== 0) {
    return {
      configured: false,
      enabled: false,
      transport: null,
      url: null,
      authColumn: 'unavailable',
      oauthCapable: false,
      error: get.error || get.stderr.trim() || get.stdout.trim() || 'codex mcp get failed',
    };
  }

  const parsed = parseCodexGet(get.stdout);
  const list = run(options.codexBin, ['mcp', 'list']);
  const authColumn = parseAuthColumn(options.server, `${list.stdout}\n${list.stderr}`);
  return {
    configured: true,
    enabled: parsed.enabled,
    transport: parsed.transport,
    url: parsed.url,
    authColumn,
    oauthCapable: authColumn === 'OAuth' || authColumn === 'Unknown',
    error: null,
  };
}

function runLogin(options) {
  const args = ['scripts/codex-mcp-oauth-login.cjs', options.server, '--codex-bin', options.codexBin];
  if (!options.open) args.push('--no-open');
  const result = run('node', args);
  return {
    attempted: true,
    ok: result.code === 0,
    code: result.code,
    error: result.code === 0 ? null : result.stderr.trim() || result.stdout.trim() || 'login failed',
  };
}

function classify({ codex, env, login }) {
  if (login?.ok && codex.configured && codex.enabled && codex.oauthCapable) {
    return 'oauth-flow-completed';
  }
  if (codex.configured && codex.enabled && codex.oauthCapable) {
    return 'codex-mcp-oauth-configured';
  }
  if (env.dataPlaneReady) {
    return 'supabase-env-present';
  }
  return 'not-assured';
}

function buildAdvice(report) {
  const advice = [];
  if (!report.codex.configured) {
    advice.push(`Configure Codex MCP server '${report.server}' before claiming MCP access.`);
  } else if (!report.codex.enabled) {
    advice.push(`Enable Codex MCP server '${report.server}'.`);
  } else if (!report.codex.oauthCapable) {
    advice.push(`Codex MCP server '${report.server}' is not reporting an OAuth-capable auth column.`);
  }

  if (!report.login?.attempted && report.assurance !== 'oauth-flow-completed') {
    advice.push(`For callback proof, run: tnf mcp supabase-agent-check --login --write`);
  }

  if (!report.environment.dataPlaneReady) {
    advice.push('For Supabase client/data-plane access, provide SUPABASE_URL plus an anon or service-role key in the runtime environment.');
  }

  advice.push('Do not parse or print Codex OAuth token files. Verify through Codex MCP commands and harmless read-only agent tool calls.');
  return advice;
}

function writeReport(report) {
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    usage();
    return;
  }

  const initialCodex = inspectCodex(options);
  const login = options.login && initialCodex.configured ? runLogin(options) : { attempted: false };
  const codex = options.login && login.ok ? inspectCodex(options) : initialCodex;
  const environment = inspectEnvironment();

  const report = {
    spec: 'tnf/supabase-agent-connection-check/0.1',
    checkedAt: new Date().toISOString(),
    server: options.server,
    codex,
    environment,
    login,
    assurance: classify({ codex, env: environment, login }),
    reportPath: options.write ? path.relative(ROOT, REPORT_PATH) : null,
  };
  report.ok =
    report.assurance === 'oauth-flow-completed' ||
    report.assurance === 'codex-mcp-oauth-configured' ||
    (!options.strict && report.assurance === 'supabase-env-present');
  report.advice = buildAdvice(report);

  if (options.write) writeReport(report);

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`Supabase agent connection: ${report.ok ? 'OK' : 'NOT ASSURED'}`);
    console.log(`- assurance: ${report.assurance}`);
    console.log(`- codex: configured=${codex.configured} enabled=${codex.enabled} auth=${codex.authColumn}`);
    console.log(`- env: dataPlaneReady=${environment.dataPlaneReady}`);
    if (options.write) console.log(`- report: ${path.relative(ROOT, REPORT_PATH)}`);
    for (const item of report.advice) console.log(`- ${item}`);
  }

  if (!report.ok || (options.strict && report.assurance !== 'oauth-flow-completed' && report.assurance !== 'codex-mcp-oauth-configured')) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`[supabase-agent-check] ${error.message}`);
  process.exit(1);
});
