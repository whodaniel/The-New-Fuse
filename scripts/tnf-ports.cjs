#!/usr/bin/env node
/* eslint-disable no-console */
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const glob = require('glob');
const yaml = require('js-yaml'); // Moved js-yaml to top-level require

const repoRoot = path.resolve(__dirname, '..');
const LOCAL_ENV_FILES = ['.env', '.env.local', '.tnf.local.env'];

const DEFAULT_PORTS = [
  { port: 3000, service: 'relay-core/frontend', protected: false },
  { port: 3001, service: 'api/backend', protected: false },
  { port: 3004, service: 'backend', protected: false },
  { port: 3005, service: 'api-gateway/ws-bridge', protected: false },
  { port: 3006, service: 'skideancer/ws', protected: false },
  { port: 3007, service: 'skideancer/ide', protected: false },
  { port: 3008, service: 'skideancer websocket', protected: true },
  { port: 5173, service: 'vite', protected: false },
  { port: 5174, service: 'vite-alt', protected: false },
  { port: 5555, service: 'drizzle-studio', protected: true },
  { port: 6379, service: 'redis', protected: true },
  { port: 5432, service: 'postgres', protected: true },
];

function parseArgs(argv) {
  const command = argv[0] || 'help';
  const options = {
    json: false,
    autoResolve: false,
    yes: false,
    includeProtected: false,
    strict: false,
    allowOccupied: [],
    port: null,
  };

  for (let i = 1; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') options.json = true;
    else if (arg === '--auto-resolve') options.autoResolve = true;
    else if (arg === '--yes' || arg === '-y') options.yes = true;
    else if (arg === '--include-protected') options.includeProtected = true;
    else if (arg === '--strict') options.strict = true;
    else if (arg === '--allow-occupied') {
      options.allowOccupied.push(...parsePortList(argv[i + 1] || ''));
      i += 1;
    } else if (arg.startsWith('--allow-occupied=')) {
      options.allowOccupied.push(...parsePortList(arg.slice('--allow-occupied='.length)));
    }
    else if (arg === '--port' || arg === '-p') {
      const value = Number.parseInt(argv[i + 1], 10);
      if (!Number.isInteger(value)) throw new Error('Missing or invalid --port value');
      options.port = value;
      i += 1;
    } else if (arg.startsWith('--port=')) {
      const value = Number.parseInt(arg.slice('--port='.length), 10);
      if (!Number.isInteger(value)) throw new Error('Invalid --port value');
      options.port = value;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return { command, options };
}

function parsePortList(value) {
  return String(value || '')
    .split(',')
    .map((item) => Number.parseInt(item.trim(), 10))
    .filter(Number.isInteger);
}

function parseEnvValue(rawValue) {
  const value = rawValue.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function loadLocalEnv(rootDir) {
  const exportedKeys = new Set(Object.keys(process.env));
  for (const envFile of LOCAL_ENV_FILES) {
    const envPath = path.join(rootDir, envFile);
    if (!fs.existsSync(envPath)) continue;

    for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const normalizedLine = line.startsWith('export ') ? line.slice('export '.length).trim() : line;
      const separatorIndex = normalizedLine.indexOf('=');
      if (separatorIndex <= 0) continue;

      const key = normalizedLine.slice(0, separatorIndex).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || exportedKeys.has(key)) continue;

      process.env[key] = parseEnvValue(normalizedLine.slice(separatorIndex + 1));
    }
  }
}

loadLocalEnv(repoRoot);

function parsePortEnv() {
  const raw = process.env.TNF_PORTS || '';
  if (!raw.trim()) return [];
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [portPart, servicePart = 'custom'] = entry.split(':');
      const port = Number.parseInt(portPart, 10);
      if (!Number.isInteger(port)) return null;
      return { port, service: servicePart || 'custom', protected: false };
    })
    .filter(Boolean);
}

async function getCatalog() {
  let allPorts = [...DEFAULT_PORTS, ...parsePortEnv()];

  // Dynamically discover ports from workspace package.json files
  const workspacePorts = await discoverWorkspacePorts();
  allPorts = allPorts.concat(workspacePorts);

  // Filter out duplicates based on port number, but keep the latest service name if duplicated
  const uniquePortsMap = new Map();
  for (const entry of allPorts) {
    uniquePortsMap.set(entry.port, entry);
  }

  return Array.from(uniquePortsMap.values()).sort((a, b) => a.port - b.port);
}

async function discoverWorkspacePorts() {
  const workspacePaths = getWorkspacePaths();
  const discoveredPorts = [];

  for (const wsPath of workspacePaths) {
    const packageJsonPath = path.join(repoRoot, wsPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const packageName = packageJson.name || path.basename(wsPath);
        if (packageJson.scripts) {
          for (const scriptName of ['dev', 'start', 'serve']) {
            const script = packageJson.scripts[scriptName];
            if (script) {
              console.log(`Checking script: ${packageName}:${scriptName} -> ${script}`); // Debug log
              let portsFound = [];

              // 1. Regex to find explicit port definitions
              const explicitPortMatches = script.match(/(?:PORT=|--port\s+)(\d{3,5})|:(\d{3,5})/g);
              if (explicitPortMatches) {
                for (const match of explicitPortMatches) {
                  const port = Number.parseInt(match.replace(/[^\d]/g, ''), 10);
                  if (Number.isInteger(port)) {
                    portsFound.push(port);
                  }
                }
              }

              // 2. Add default ports for known frameworks if script indicates usage
              if (script.includes('next dev') || script.includes('next start')) {
                portsFound.push(3000); // Default Next.js port
              }
              if (script.includes('vite')) {
                portsFound.push(5173); // Default Vite port
              }
              if (script.includes('nest start') || script.includes('nestjs')) {
                portsFound.push(3000); // Default NestJS port (often for API)
              }

              // Add found ports to discoveredPorts
              for (const port of portsFound) {
                discoveredPorts.push({ port, service: `${packageName}/${scriptName}`, protected: false });
              }
              if (portsFound.length > 0) {
                console.log(`Discovered ports for ${packageName}:${scriptName}:`, portsFound); // Debug log
              }
            }
          }
        }
      } catch (e) {
        console.error(`Error parsing package.json in ${packageJsonPath}: ${e.message}`);
        console.error(e); // Added to log full error for debugging
      }
    }
  }
  return discoveredPorts;
}

function getWorkspacePaths() {
  const pnpmWorkspacePath = path.join(repoRoot, 'pnpm-workspace.yaml');
  if (fs.existsSync(pnpmWorkspacePath)) {
    const workspaceConfig = yaml.load(fs.readFileSync(pnpmWorkspacePath, 'utf8'));
    const patterns = workspaceConfig.packages || [];
    console.log('Workspace patterns:', patterns); // Debug log
    let workspacePaths = [];

    for (const pattern of patterns) {
      if (pattern.startsWith('!')) {
        // Exclude pattern, filter out existing matches
        const excludePattern = pattern.slice(1);
        const excluded = glob.sync(excludePattern, { cwd: repoRoot, absolute: false });
        workspacePaths = workspacePaths.filter(p => !excluded.includes(p));
      } else {
        // Include pattern
        const matchedPaths = glob.sync(pattern, { cwd: repoRoot, absolute: false });
        console.log(`Glob pattern: ${pattern}, matched: ${matchedPaths.length} paths`); // Debug log
        workspacePaths.push(...matchedPaths);
      }
    }
    // Filter out duplicate paths and return unique ones
    const uniqueWorkspacePaths = Array.from(new Set(workspacePaths));
    console.log('Discovered unique workspace paths:', uniqueWorkspacePaths); // Debug log
    return uniqueWorkspacePaths;
  }

  // Fallback if pnpm-workspace.yaml is not found or malformed
  // This would typically involve reading the 'workspaces' field from the root package.json
  // For simplicity, assuming pnpm-workspace.yaml is present and correct.
  return [];
}

function getAllowedOccupiedPorts(options) {
  return new Set([
    ...parsePortList(process.env.TNF_PORTS_ALLOW_OCCUPIED || ''),
    ...options.allowOccupied,
  ]);
}

function run(command, args) {
  try {
    return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
}

function getPidCommand(pid) {
  const output = run('ps', ['-p', String(pid), '-o', 'comm=']);
  return output.trim() || 'unknown';
}

function pidsFromLsof(port) {
  const output = run('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t']);
  return output
    .split(/\s+/)
    .map((value) => Number.parseInt(value, 10))
    .filter(Number.isInteger);
}

function pidsFromSs(port) {
  const output = run('ss', ['-ltnp', `sport = :${port}`]);
  const pids = new Set();
  for (const match of output.matchAll(/pid=(\d+)/g)) {
    pids.add(Number.parseInt(match[1], 10));
  }
  return Array.from(pids);
}

function pidsOnPort(port) {
  const pids = pidsFromLsof(port);
  if (pids.length > 0) return pids;
  return pidsFromSs(port);
}

function getRuntimeHealth(entry) {
  // Only attempt health checks for HTTP-based services
  // Ports like Redis (6379) or Postgres (5432) do not expose HTTP health endpoints
  if (
    ![3000, 3001, 3004, 3005, 3006, 3007, 5173, 5174].includes(entry.port)
  ) {
    return null;
  }

  const raw = run('curl', ['-fsS', '--max-time', '1', `http://127.0.0.1:${entry.port}/health`]);
  if (!raw.trim()) return null;

  try {
    const body = JSON.parse(raw);
    // Specific health checks for known services
    if (entry.port === 3000) {
      if (body.relay === 'running') {
        return { ok: true, service: 'relay-core', status: body.status || 'ok' };
      }
      if (Object.prototype.hasOwnProperty.call(body, 'queueLength') &&
          ['ok', 'connected', 'disconnected'].includes(String(body.status || ''))) {
        return { ok: true, service: 'hermes/whatsapp-bridge', status: body.status };
      }
    }
    if (entry.port === 3005 && body.status === 'ok') {
      return { ok: true, service: 'api-gateway/ws-bridge', status: body.status };
    }

    // Generic health check for services returning { status: "ok" } or similar
    if (body.status === 'ok' || body.health === 'ok' || body.healthy === true) {
      return { ok: true, service: entry.service, status: body.status || 'ok' };
    }
  } catch {
    // Non-JSON response or other parsing error, treat as unhealthy
    return null;
  }

  return null;
}

async function inspectPorts() {
  const catalog = await getCatalog();
  return catalog.map((entry) => {
    const pids = pidsOnPort(entry.port);
    return {
      ...entry,
      status: pids.length > 0 ? 'occupied' : 'clear',
      processes: pids.map((pid) => ({ pid, command: getPidCommand(pid) })),
      runtimeHealth: pids.length > 0 ? getRuntimeHealth(entry) : null,
    };
  });
}

function printTable(rows) {
  const view = rows.map((row) => ({
    port: row.port,
    service: row.service,
    status: row.status,
    protected: row.protected ? 'yes' : 'no',
    processes: row.processes.map((process) => `${process.pid}:${process.command}`).join(', ') || '-',
  }));
  console.table(view);
}

function terminatePid(pid) {
  const term = spawnSync('kill', ['-TERM', String(pid)], { stdio: 'ignore' });
  if (term.status !== 0) return false;
  return true;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryTerminatePid(pid, retries = 5, delay = 200) {
  for (let i = 0; i < retries; i += 1) {
    const term = spawnSync('kill', ['-TERM', String(pid)], { stdio: 'ignore' });
    if (term.status === 0) {
      await sleep(delay); // Give some time for the process to exit
      const remainingPids = pidsOnPortByPid(pid); // Check if *this specific* pid is still on port
      if (remainingPids.length === 0) {
        return true; // Successfully terminated
      }
    }
    await sleep(delay); // Wait before retrying
  }
  return false; // Failed to terminate after retries
}

function pidsOnPortByPid(targetPid) {
  const pids = pidsFromLsof().concat(pidsFromSs()); // Get all PIDs on any port
  return pids.filter(pid => pid === targetPid); // Filter for the specific PID
}


async function clearRows(rows, options) {
  const targets = rows.filter((row) => {
    if (row.status !== 'occupied') return false;
    if (row.protected && !options.includeProtected) return false;
    return row.processes.length > 0;
  });

  if (targets.length === 0) {
    console.log('No eligible occupied ports to clear.');
    return [];
  }

  if (!options.yes && !options.autoResolve) {
    console.log('Refusing to terminate processes without --yes or --auto-resolve.');
    return [];
  }

  const killed = [];
  for (const row of targets) {
    for (const process of row.processes) {
      const ok = await retryTerminatePid(process.pid);
      killed.push({ port: row.port, pid: process.pid, command: process.command, ok });
    }
  }
  await sleep(500);
  return killed;
}

function printUsage() {
  console.log(`Usage: tnf ports <command> [options]

Commands:
  status                  Show configured TNF ports and current listeners
  conflicts               Show occupied TNF ports; use --auto-resolve to clear eligible ports
  preflight               Check whether non-protected required ports are already occupied
  clear --port <port>     Clear one port; requires --yes

Options:
  --json                  Print JSON
  --auto-resolve          For conflicts, terminate eligible listeners
  --yes, -y               Confirm termination for clear
  --include-protected     Allow protected ports such as Redis/Postgres/3008
  --strict                Exit non-zero when preflight finds blocked ports
  --allow-occupied <csv>  Ports allowed to be occupied during preflight
  --port, -p <port>       Port for clear

Environment:
  TNF_PORTS="8080:custom-api,9000:custom-ws" adds local project ports.
  TNF_PORTS_ALLOW_OCCUPIED="3005,6379" allows occupied ports during preflight.

Notes:
  Destructive operations are opt-in. Protected ports are never killed unless
  --include-protected is also provided.`);
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));
  const rows = await inspectPorts();

  if (command === 'help' || command === '--help' || command === '-h') {
    printUsage();
    return;
  }

  if (command === 'status') {
    if (options.json) console.log(JSON.stringify({ ports: rows }, null, 2));
    else printTable(rows);
    return;
  }

  if (command === 'conflicts') {
    const conflicts = rows.filter((row) => row.status === 'occupied');
    if (options.autoResolve) {
      const killed = await clearRows(conflicts, options);
      const after = await inspectPorts();
    const remainingConflicts = after.filter((row) => row.status === 'occupied');
      if (options.json) console.log(JSON.stringify({ before: conflicts, killed, after: remainingConflicts }, null, 2));
      else {
        console.log('Termination attempts:');
        console.table(killed);
        console.log('Remaining occupied ports:');
        printTable(remainingConflicts);
      }
      return;
    }
    if (options.json) console.log(JSON.stringify({ conflicts }, null, 2));
    else {
      if (conflicts.length === 0) console.log('No occupied TNF ports detected.');
      else printTable(conflicts);
    }
    return;
  }

  if (command === 'preflight') {
    const allowed = getAllowedOccupiedPorts(options);
    const blocked = rows.filter((row) => {
      if (row.status !== 'occupied') return false;
      if (row.protected && !options.includeProtected) return false;
      if (row.runtimeHealth?.ok) return false;
      return !allowed.has(row.port);
    });
    const healthyOccupied = rows.filter((row) => row.status === 'occupied' && row.runtimeHealth?.ok);
    const payload = {
      ok: blocked.length === 0,
      blocked,
      allowedOccupiedPorts: Array.from(allowed).sort((a, b) => a - b),
      healthyOccupied,
    };
    if (options.json) {
      console.log(JSON.stringify(payload, null, 2));
    } else if (blocked.length === 0) {
      console.log('Port preflight OK.');
    } else {
      console.log('Port preflight found occupied required ports:');
      printTable(blocked);
      console.log('Set TNF_PORTS_ALLOW_OCCUPIED or pass --allow-occupied for intentional listeners.');
    }
    if (!options.json && healthyOccupied.length > 0) {
      console.log('Healthy occupied TNF runtimes were detected and allowed:');
      printTable(healthyOccupied);
    }
    if (options.strict && blocked.length > 0) {
      process.exit(1);
    }
    return;
  }

  if (command === 'clear') {
    if (!options.port) throw new Error('clear requires --port <port>');
    const target = rows.find((row) => row.port === options.port) || {
      port: options.port,
      service: 'custom',
      protected: false,
      status: pidsOnPort(options.port).length > 0 ? 'occupied' : 'clear',
      processes: pidsOnPort(options.port).map((pid) => ({ pid, command: getPidCommand(pid) })),
    };
    const killed = await clearRows([target], options);
    if (options.json) console.log(JSON.stringify({ target, killed }, null, 2));
    else console.table(killed);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  console.error(`tnf ports failed: ${error.message}`);
  process.exit(1);
});
