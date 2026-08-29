#!/usr/bin/env node

/**
 * The New Fuse - Native Messaging Host
 * Controls TNF services from Chrome Extension
 *
 * This host uses relative paths and auto-discovers the project root.
 */

const { spawn, exec, execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Auto-discover project root by looking for package.json with "the-new-fuse" name
function isTNFProjectRoot(candidateDir) {
  if (!candidateDir) return false;
  try {
    const pkgPath = path.join(candidateDir, 'package.json');
    if (!fs.existsSync(pkgPath)) return false;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return pkg.name === 'the-new-fuse' || pkg.name === '@the-new-fuse/monorepo';
  } catch (_error) {
    return false;
  }
}

function enumerateAncestors(startDir) {
  const results = [];
  let current = path.resolve(startDir);
  while (true) {
    results.push(current);
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return results;
}

function findProjectRoot() {
  const envRoots = [
    process.env.TNF_PROJECT_ROOT,
    process.env.TNF_REPO_DIR,
    process.env.TNF_REPO,
  ].filter((value) => typeof value === 'string' && value.length > 0);

  for (const envRoot of envRoots) {
    if (isTNFProjectRoot(envRoot)) {
      return path.resolve(envRoot);
    }
  }

  // Persistent pointer written by scripts/install-tnf-host-wrappers.cjs
  try {
    const pointer = fs
      .readFileSync(path.join(os.homedir(), '.tnf', 'repo-root'), 'utf8')
      .trim();
    if (pointer && isTNFProjectRoot(pointer)) {
      return path.resolve(pointer);
    }
  } catch (_error) {
    // ignore missing pointer
  }

  const seedDirs = [process.cwd(), process.env.INIT_CWD, process.env.PWD, __dirname].filter(
    (value) => typeof value === 'string' && value.length > 0
  );

  const candidates = new Set();
  for (const seed of seedDirs) {
    for (const candidate of enumerateAncestors(seed)) {
      candidates.add(candidate);
    }
  }

  // Well-known operator checkouts (avoid /path/to placeholders + broken worktrees)
  for (const known of [
    path.join(os.homedir(), 'Repos', 'tnf-monorepo'),
    path.join(os.homedir(), 'Desktop', 'A1-Inter-LLM-Com', 'TNF', 'The-New-Fuse'),
    path.join(os.homedir(), 'Desktop', 'A1-Inter-LLM-Com', 'The-New-Fuse'),
    path.join(os.homedir(), '.tnf-cli', 'fuse'),
  ]) {
    candidates.add(known);
  }

  for (const candidate of candidates) {
    if (isTNFProjectRoot(candidate)) {
      return candidate;
    }
  }

  // Last resort: deterministic repo-relative guess from this script location.
  return path.resolve(__dirname, '../../../..');
}

const PROJECT_ROOT = findProjectRoot();
const LOG_FILE = path.join(os.homedir(), '.tnf-native-host.log');
const RELAY_PORT_CANDIDATES = [3000, 3001, 3010, 3100];
const RELAY_HEALTH_TIMEOUT_MS = 1500;
const SERVICE_START_LOCK_DIR = path.join(os.homedir(), '.tnf', 'native-host', 'start-locks');
const SERVICE_START_LOCK_STALE_MS = 30000;

// Service definitions (relative to project root)
const SERVICES = {
  relay: {
    name: 'TNF Relay',
    command: process.env.PNPM_BIN || 'pnpm',
    args: ['run', 'relay:start'],
    cwd: '.',
    port: 3000,
  },
  backend: {
    name: 'TNF Backend',
    command: process.env.PNPM_BIN || 'pnpm',
    args: ['run', 'dev'],
    cwd: 'apps/backend',
    port: 3000,
  },
  frontend: {
    name: 'TNF Frontend',
    command: process.env.PNPM_BIN || 'pnpm',
    args: ['run', 'dev'],
    cwd: 'apps/frontend',
    port: 3002,
  },
  monitor: {
    name: 'Relay Monitor',
    command: process.env.PNPM_BIN || 'pnpm',
    args: ['run', 'relay:monitor'],
    cwd: '.',
    matchPattern: '(scripts/)?relay-channel-monitor[.]cjs',
    stopCommand: 'pkill -f "relay-channel-monitor.cjs" 2>/dev/null || true',
  },
  masterClock: {
    name: 'Master Clock',
    command: process.env.PNPM_BIN || 'pnpm',
    args: ['run', 'master-clock'],
    cwd: '.',
    matchPattern: '(packages/relay-core/)?(dist|src)/master-clock[.](js|ts)',
    stopCommand: 'pkill -f "master-clock" 2>/dev/null || true',
  },
};

// Track running processes
const runningProcesses = new Map();

// Logging
function log(message) {
  const timestamp = new Date().toISOString();
  const logMsg = `[${timestamp}] ${message}\n`;
  try {
    fs.appendFileSync(LOG_FILE, logMsg);
  } catch (e) {
    // Ignore log errors
  }
}

// Read message from stdin (Chrome native messaging protocol)
function readMessage() {
  return new Promise((resolve, reject) => {
    let chunks = [];
    let messageLength = null;

    process.stdin.on('readable', () => {
      let chunk;
      while ((chunk = process.stdin.read()) !== null) {
        chunks.push(chunk);

        // First 4 bytes are the message length
        if (messageLength === null && Buffer.concat(chunks).length >= 4) {
          const buffer = Buffer.concat(chunks);
          messageLength = buffer.readUInt32LE(0);
          chunks = [buffer.slice(4)];
        }

        // Check if we have the full message
        if (messageLength !== null) {
          const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
          if (totalLength >= messageLength) {
            const buffer = Buffer.concat(chunks);
            const messageBuffer = buffer.slice(0, messageLength);
            try {
              const message = JSON.parse(messageBuffer.toString('utf8'));
              resolve(message);
            } catch (e) {
              reject(new Error('Failed to parse message'));
            }
            return;
          }
        }
      }
    });

    process.stdin.on('end', () => {
      reject(new Error('stdin closed'));
    });
  });
}

// Send message to Chrome (native messaging protocol)
function sendMessage(message) {
  const messageString = JSON.stringify(message);
  const messageBuffer = Buffer.from(messageString, 'utf8');
  const header = Buffer.alloc(4);
  header.writeUInt32LE(messageBuffer.length, 0);

  process.stdout.write(header);
  process.stdout.write(messageBuffer);
}

// Check if a port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    exec(`lsof -i :${port}`, (error, stdout) => {
      resolve(!error && stdout.trim().length > 0);
    });
  });
}

// Native-host reconnections lose in-memory state; direct process-table inspection prevents duplicate detached services.
function isProcessRunning(pattern, execFileFn = execFile) {
  return new Promise((resolve) => {
    execFileFn('pgrep', ['-f', pattern], (error, stdout = '') => {
      // Exit 0: matching process found
      if (!error && stdout.trim().length > 0) {
        return resolve({ running: true, unknown: false });
      }
      // Exit 1: no matching process found
      if (error && error.code === 1) {
        return resolve({ running: false, unknown: false });
      }
      // Any other exit code or invocation failure: unknown process state
      return resolve({
        running: false,
        unknown: true,
        error: error ? error.message : 'Process table query failed',
      });
    });
  });
}

function acquireServiceStartLock(serviceName, options = {}) {
  const fsImpl = options.fsImpl || fs;
  const lockDir = options.lockDir || SERVICE_START_LOCK_DIR;
  const staleMs = options.staleMs || SERVICE_START_LOCK_STALE_MS;
  const now = options.now || Date.now;
  const lockPath = path.join(lockDir, `${serviceName}.lock`);

  try {
    fsImpl.mkdirSync(lockDir, { recursive: true, mode: 0o700 });
  } catch (error) {
    return { acquired: false, error: `Cannot create service lock directory: ${error.message}` };
  }

  const createLock = () => {
    try {
      const fd = fsImpl.openSync(lockPath, 'wx', 0o600);
      fsImpl.writeFileSync(
        fd,
        `${JSON.stringify({ pid: process.pid, serviceName, acquiredAt: new Date(now()).toISOString() })}\n`
      );
      let released = false;
      return {
        acquired: true,
        lockPath,
        release() {
          if (released) return;
          released = true;
          try {
            fsImpl.closeSync(fd);
          } catch (_error) {
            // The descriptor may already be closed during process shutdown.
          }
          try {
            fsImpl.unlinkSync(lockPath);
          } catch (error) {
            if (error.code !== 'ENOENT') {
              log(`Failed to release ${serviceName} start lock: ${error.message}`);
            }
          }
        },
      };
    } catch (error) {
      if (error.code === 'EEXIST') return { acquired: false, busy: true, lockPath };
      return {
        acquired: false,
        error: `Cannot acquire ${serviceName} start lock: ${error.message}`,
      };
    }
  };

  let result = createLock();
  if (!result.busy) return result;

  try {
    const ageMs = now() - fsImpl.statSync(lockPath).mtimeMs;
    if (ageMs <= staleMs) return result;
    fsImpl.unlinkSync(lockPath);
    result = createLock();
    return result;
  } catch (error) {
    if (error.code === 'ENOENT') return createLock();
    return {
      acquired: false,
      error: `Cannot inspect ${serviceName} start lock: ${error.message}`,
    };
  }
}

function killPort(port) {
  return new Promise((resolve) => {
    exec(`lsof -ti :${port} | xargs kill -9 2>/dev/null`, () => resolve());
  });
}

async function isRelayHealthyOnPort(port) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), RELAY_HEALTH_TIMEOUT_MS);
    const response = await fetch(`http://127.0.0.1:${port}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) return false;
    const data = await response.json();
    return data && data.status === 'ok' && data.relay === 'running';
  } catch (_error) {
    return false;
  }
}

async function getRunningRelayPorts() {
  const running = [];
  for (const port of RELAY_PORT_CANDIDATES) {
    if (await isRelayHealthyOnPort(port)) {
      running.push(port);
    }
  }
  return running;
}

async function chooseRelayStartPort() {
  const runningPorts = await getRunningRelayPorts();
  if (runningPorts.length > 0) {
    return { kind: 'already-running', port: runningPorts[0] };
  }

  for (const port of RELAY_PORT_CANDIDATES) {
    // Skip occupied ports; they may belong to unrelated services.
    if (await isPortInUse(port)) continue;
    return { kind: 'start', port };
  }

  return { kind: 'no-port', port: null };
}

// Get service status
async function getServiceStatus(serviceName) {
  const service = SERVICES[serviceName];
  if (!service) {
    return { running: false, error: 'Unknown service' };
  }

  if (serviceName === 'relay') {
    const runningPorts = await getRunningRelayPorts();
    return {
      name: service.name,
      running: runningPorts.length > 0,
      port: runningPorts[0] || null,
      pid: null,
    };
  }

  const portInUse = service.port ? await isPortInUse(service.port) : false;
  const processRunning = runningProcesses.has(serviceName);
  const procCheck = service.matchPattern
    ? await isProcessRunning(service.matchPattern)
    : { running: false, unknown: false };
  const alreadyOnHost = procCheck.running;

  const result = {
    name: service.name,
    running: portInUse || processRunning || alreadyOnHost,
    port: service.port || null,
    pid: runningProcesses.get(serviceName)?.pid || null,
  };

  if (procCheck.unknown) {
    result.processCheckUnknown = true;
    result.processCheckError = procCheck.error;
  }

  return result;
}

// Get all services status
async function getAllServicesStatus() {
  const statuses = {};
  for (const [name] of Object.entries(SERVICES)) {
    statuses[name] = await getServiceStatus(name);
  }
  return statuses;
}

// Start a service
async function startServiceWhileLocked(serviceName, service) {
  let relayStartPort = null;
  if (serviceName === 'relay') {
    const relayPortDecision = await chooseRelayStartPort();
    if (relayPortDecision.kind === 'already-running') {
      return {
        success: true,
        message: `${service.name} is already running`,
        port: relayPortDecision.port,
      };
    }
    if (relayPortDecision.kind === 'no-port') {
      return {
        success: false,
        error: `${service.name} failed to start: no available relay ports (${RELAY_PORT_CANDIDATES.join(', ')})`,
      };
    }
    relayStartPort = relayPortDecision.port;
  }

  // Check if already running
  const status = serviceName === 'relay' ? { running: false } : await getServiceStatus(serviceName);
  if (status.running) {
    return { success: true, message: `${service.name} is already running`, port: service.port };
  }
  if (status.processCheckUnknown) {
    return {
      success: false,
      error: `Cannot verify running state for ${service.name}: ${status.processCheckError || 'process inspection failed'}`,
    };
  }

  const cwd = path.join(PROJECT_ROOT, service.cwd);

  // Verify the directory exists
  if (!fs.existsSync(cwd)) {
    return { success: false, error: `Directory not found: ${service.cwd}` };
  }

  log(`Starting ${service.name} in ${cwd}...`);

  try {
    const proc = spawn(service.command, service.args, {
      cwd,
      detached: true,
      stdio: 'ignore',
      shell: true,
      env: {
        ...process.env,
        FORCE_COLOR: '0',
        ...(serviceName === 'relay' && relayStartPort ? { PORT: String(relayStartPort) } : {}),
      },
    });

    proc.on('error', (error) => {
      log(`[${serviceName}] Failed to start: ${error.message}`);
      runningProcesses.delete(serviceName);
    });

    proc.on('exit', (code) => {
      log(`[${serviceName}] Exited with code ${code}`);
      runningProcesses.delete(serviceName);
    });

    proc.unref();
    runningProcesses.set(serviceName, proc);

    // Wait for startup and verify service health.
    if (serviceName === 'relay') {
      let relayReady = false;
      for (let i = 0; i < 12; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if ((await getRunningRelayPorts()).length > 0) {
          relayReady = true;
          break;
        }
      }
      if (!relayReady) {
        log('[relay] Relay did not become healthy within startup window');
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    // Verify it started
    const newStatus = await getServiceStatus(serviceName);
    const resolvedPort = serviceName === 'relay' ? newStatus.port || relayStartPort : service.port;

    return {
      success: newStatus.running,
      message: newStatus.running
        ? `${service.name} started successfully`
        : `${service.name} failed to start`,
      port: resolvedPort,
      pid: proc.pid,
    };
  } catch (error) {
    log(`Error starting ${serviceName}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function startService(serviceName) {
  const service = SERVICES[serviceName];
  if (!service) {
    return { success: false, error: 'Unknown service' };
  }

  const startLock = acquireServiceStartLock(serviceName);
  if (!startLock.acquired) {
    return {
      success: false,
      error: startLock.busy
        ? `${service.name} start is already in progress`
        : startLock.error || `Cannot acquire ${service.name} start lock`,
    };
  }

  try {
    return await startServiceWhileLocked(serviceName, service);
  } finally {
    startLock.release();
  }
}

// Stop a service
async function stopService(serviceName) {
  const service = SERVICES[serviceName];
  if (!service) {
    return { success: false, error: 'Unknown service' };
  }

  log(`Stopping ${service.name}...`);

  if (serviceName === 'relay') {
    const runningPorts = await getRunningRelayPorts();
    for (const port of runningPorts) {
      await killPort(port);
    }
    runningProcesses.delete(serviceName);
    return {
      success: true,
      message:
        runningPorts.length > 0
          ? `${service.name} stopped`
          : `${service.name} already stopped`,
    };
  }

  if (service.port) {
    return new Promise((resolve) => {
      exec(`lsof -ti :${service.port} | xargs kill -9 2>/dev/null`, () => {
        runningProcesses.delete(serviceName);
        resolve({
          success: true,
          message: `${service.name} stopped`,
        });
      });
    });
  }

  return new Promise((resolve) => {
    const cmd = service.stopCommand || `pkill -f "${service.command} ${service.args.join(' ')}"`;
    exec(cmd, () => {
      runningProcesses.delete(serviceName);
      resolve({
        success: true,
        message: `${service.name} stopped`,
      });
    });
  });
}

// Start all services
async function startAllServices() {
  const results = {};
  for (const serviceName of Object.keys(SERVICES)) {
    results[serviceName] = await startService(serviceName);
  }
  return results;
}

// Stop all services
async function stopAllServices() {
  const results = {};
  for (const serviceName of Object.keys(SERVICES)) {
    results[serviceName] = await stopService(serviceName);
  }
  return results;
}

// Open Terminal.app with a command (macOS)
async function openTerminalWithCommand(command) {
  const fullCommand = `cd "${PROJECT_ROOT}" && ${command}`;

  // AppleScript to open Terminal and run the command
  const appleScript = `
    tell application "Terminal"
      activate
      do script "${fullCommand.replace(/"/g, '\\"')}"
    end tell
  `;

  return new Promise((resolve) => {
    exec(`osascript -e '${appleScript.replace(/'/g, "'\"'\"'")}'`, (error, stdout, stderr) => {
      if (error) {
        log(`Error opening terminal: ${error.message}`);
        resolve({
          action: 'open-terminal_response',
          success: false,
          error: error.message,
        });
      } else {
        log(`Opened Terminal with command: ${command}`);
        resolve({
          action: 'open-terminal_response',
          success: true,
          command: fullCommand,
        });
      }
    });
  });
}

// Open Finder at a specific path (macOS)
async function openFolder(folderPath) {
  const targetPath = path.isAbsolute(folderPath) ? folderPath : path.join(PROJECT_ROOT, folderPath);

  return new Promise((resolve) => {
    exec(`open "${targetPath}"`, (error) => {
      if (error) {
        log(`Error opening folder: ${error.message}`);
        resolve({
          action: 'open-folder_response',
          success: false,
          error: error.message,
        });
      } else {
        log(`Opened Finder at: ${targetPath}`);
        resolve({
          action: 'open-folder_response',
          success: true,
          path: targetPath,
        });
      }
    });
  });
}

// Handle incoming message
async function handleMessage(message) {
  log(`Received message: ${JSON.stringify(message)}`);

  try {
    switch (message.action) {
      case 'ping':
        return { action: 'pong', timestamp: Date.now(), projectRoot: PROJECT_ROOT };

      case 'status':
        return {
          action: 'status_response',
          services: await getAllServicesStatus(),
          projectRoot: PROJECT_ROOT,
        };

      case 'start':
        if (message.service === 'all') {
          return {
            action: 'start_response',
            results: await startAllServices(),
          };
        } else {
          return {
            action: 'start_response',
            result: await startService(message.service),
          };
        }

      case 'stop':
        if (message.service === 'all') {
          return {
            action: 'stop_response',
            results: await stopAllServices(),
          };
        } else {
          return {
            action: 'stop_response',
            result: await stopService(message.service),
          };
        }

      case 'restart':
        await stopService(message.service);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return {
          action: 'restart_response',
          result: await startService(message.service),
        };

      case 'logs':
        const lines = message.lines || 50;
        try {
          const logContent = fs.readFileSync(LOG_FILE, 'utf8');
          const logLines = logContent.split('\n').slice(-lines);
          return { action: 'logs_response', logs: logLines };
        } catch (e) {
          return { action: 'logs_response', logs: [], error: 'No logs available' };
        }

      case 'config':
        return {
          action: 'config_response',
          config: {
            projectRoot: PROJECT_ROOT,
            services: Object.fromEntries(
              Object.entries(SERVICES).map(([k, v]) => [k, { name: v.name, port: v.port }])
            ),
          },
        };

      case 'open-terminal':
        // Open Terminal.app with the command to start the relay
        return await openTerminalWithCommand(message.command || 'pnpm relay:start');

      case 'open-folder':
        // Open Finder at the project root or specified path
        return await openFolder(message.path || PROJECT_ROOT);

      default:
        return { action: 'error', message: `Unknown action: ${message.action}` };
    }
  } catch (error) {
    log(`Error handling message: ${error.message}`);
    return { action: 'error', message: error.message };
  }
}

// Main — Chrome sendNativeMessage is one-shot: one request → one response → exit.
async function main() {
  log(`Native messaging host started. Project root: ${PROJECT_ROOT}`);

  try {
    const message = await readMessage();
    const response = await handleMessage(message);
    sendMessage(response);
  } catch (error) {
    const errMsg = error?.message || String(error);
    log(`Error: ${errMsg}`);
    // Chrome often closes stdin when tearing down; writing after that makes
    // Chrome report "Native host has exited" instead of a clean disconnect.
    if (errMsg !== 'stdin closed') {
      try {
        sendMessage({ action: 'error', message: errMsg });
      } catch (_sendErr) {
        log(`Failed to send error response: ${_sendErr?.message || _sendErr}`);
      }
    }
  }

  process.exit(0);
}

if (require.main === module) {
  main().catch((error) => {
    log(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  SERVICES,
  acquireServiceStartLock,
  isProcessRunning,
  startService,
};
