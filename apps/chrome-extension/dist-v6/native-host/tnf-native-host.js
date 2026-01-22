#!/usr/bin/env node

/**
 * The New Fuse - Native Messaging Host
 * Controls TNF services from Chrome Extension
 *
 * This host uses relative paths and auto-discovers the project root.
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Auto-discover project root by looking for package.json with "the-new-fuse" name
function findProjectRoot() {
  // Start from this script's directory and go up
  let currentDir = __dirname;

  // Also check common locations
  const possibleRoots = [
    path.resolve(currentDir, '../../../..'), // From dist-v5/native-host
    path.resolve(currentDir, '../../..'), // From src/v5/native-host
    path.resolve(os.homedir(), 'Desktop/A1-Inter-LLM-Com/The-New-Fuse'),
    path.resolve(os.homedir(), 'projects/The-New-Fuse'),
    path.resolve(os.homedir(), 'The-New-Fuse'),
  ];

  for (const dir of possibleRoots) {
    try {
      const pkgPath = path.join(dir, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.name === 'the-new-fuse' || pkg.name === '@the-new-fuse/monorepo') {
          return dir;
        }
      }
    } catch (e) {
      // Continue searching
    }
  }

  // Fallback to environment variable
  if (process.env.TNF_PROJECT_ROOT) {
    return process.env.TNF_PROJECT_ROOT;
  }

  // Last resort: go up from script location
  return path.resolve(currentDir, '../../../..');
}

const PROJECT_ROOT = findProjectRoot();
const LOG_FILE = path.join(os.homedir(), '.tnf-native-host.log');

// Service definitions (relative to project root)
const SERVICES = {
  relay: {
    name: 'TNF Relay',
    command: 'pnpm',
    args: ['run', 'relay'],
    cwd: 'packages/relay-core',
    port: 3000,
  },
  backend: {
    name: 'TNF Backend',
    command: 'pnpm',
    args: ['run', 'dev'],
    cwd: 'apps/backend',
    port: 3000,
  },
  frontend: {
    name: 'TNF Frontend',
    command: 'pnpm',
    args: ['run', 'dev'],
    cwd: 'apps/frontend',
    port: 3002,
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

// Get service status
async function getServiceStatus(serviceName) {
  const service = SERVICES[serviceName];
  if (!service) {
    return { running: false, error: 'Unknown service' };
  }

  const portInUse = await isPortInUse(service.port);
  const processRunning = runningProcesses.has(serviceName);

  return {
    name: service.name,
    running: portInUse || processRunning,
    port: service.port,
    pid: runningProcesses.get(serviceName)?.pid || null,
  };
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
async function startService(serviceName) {
  const service = SERVICES[serviceName];
  if (!service) {
    return { success: false, error: 'Unknown service' };
  }

  // Check if already running
  const status = await getServiceStatus(serviceName);
  if (status.running) {
    return { success: true, message: `${service.name} is already running`, port: service.port };
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
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      env: { ...process.env, FORCE_COLOR: '0' },
    });

    proc.stdout.on('data', (data) => {
      log(`[${serviceName}] ${data.toString().trim()}`);
    });

    proc.stderr.on('data', (data) => {
      log(`[${serviceName}] ERROR: ${data.toString().trim()}`);
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

    // Wait a bit for the service to start
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Verify it started
    const newStatus = await getServiceStatus(serviceName);

    return {
      success: newStatus.running,
      message: newStatus.running
        ? `${service.name} started successfully`
        : `${service.name} failed to start`,
      port: service.port,
      pid: proc.pid,
    };
  } catch (error) {
    log(`Error starting ${serviceName}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Stop a service
async function stopService(serviceName) {
  const service = SERVICES[serviceName];
  if (!service) {
    return { success: false, error: 'Unknown service' };
  }

  log(`Stopping ${service.name}...`);

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

// Main
async function main() {
  log(`Native messaging host started. Project root: ${PROJECT_ROOT}`);

  try {
    const message = await readMessage();
    const response = await handleMessage(message);
    sendMessage(response);
  } catch (error) {
    log(`Error: ${error.message}`);
    sendMessage({ action: 'error', message: error.message });
  }

  process.exit(0);
}

main().catch((error) => {
  log(`Fatal error: ${error.message}`);
  process.exit(1);
});
