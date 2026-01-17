#!/usr/bin/env node
/**
 * Jules CLI Integration Module
 *
 * Provides programmatic access to Jules CLI for TNF framework automation.
 * Handles session management, status monitoring, and result retrieval.
 *
 * @module JulesIntegration
 * @version 1.0.0
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  defaultRepo: 'whodaniel/fuse',
  commandTimeout: 120000, // 2 minutes
  maxBuffer: 50 * 1024 * 1024, // 50MB
  retryDelay: 2000, // 2 seconds between retries
  maxParallel: 5,
  logDir: '.agent/jules-logs',
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @typedef {Object} JulesSession
 * @property {string} id - Session ID
 * @property {string} description - Task description
 * @property {string} repo - Repository
 * @property {string} lastActive - Last activity timestamp
 * @property {SessionStatus} status - Current status
 */

/**
 * @typedef {'In Progress'|'Completed'|'Awaiting User F'|'Failed'|'Unknown'} SessionStatus
 */

/**
 * @typedef {Object} CommandResult
 * @property {boolean} success
 * @property {string} [output]
 * @property {string} [error]
 * @property {string} [errorCode]
 */

// ═══════════════════════════════════════════════════════════════════════════
// CORE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Execute a Jules CLI command safely
 * @param {string} command - The Jules command to execute
 * @returns {CommandResult}
 */
function executeCommand(command) {
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      timeout: CONFIG.commandTimeout,
      maxBuffer: CONFIG.maxBuffer,
    });
    return { success: true, output: output.trim() };
  } catch (error) {
    const errorMessage = error.message || error.toString();

    // Categorize common errors
    if (errorMessage.includes('No --repo flag')) {
      return { success: false, error: errorMessage, errorCode: 'REPO_NOT_CONNECTED' };
    }
    if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
      return { success: false, error: errorMessage, errorCode: 'RATE_LIMITED' };
    }
    if (errorMessage.includes('not logged in') || errorMessage.includes('authentication')) {
      return { success: false, error: errorMessage, errorCode: 'AUTH_REQUIRED' };
    }
    if (errorMessage.includes('timeout')) {
      return { success: false, error: errorMessage, errorCode: 'TIMEOUT' };
    }

    return { success: false, error: errorMessage, errorCode: 'UNKNOWN' };
  }
}

/**
 * Check if Jules CLI is installed and authenticated
 * @returns {{installed: boolean, authenticated: boolean, version: string|null}}
 */
function checkJulesStatus() {
  // Check installation
  const installCheck = executeCommand('which jules');
  if (!installCheck.success) {
    return { installed: false, authenticated: false, version: null };
  }

  // Check version
  const versionCheck = executeCommand('jules version');
  let version = null;
  if (versionCheck.success) {
    const match = versionCheck.output.match(/Version:\s*(v[\d.]+)/);
    version = match ? match[1] : null;
  }

  // Check authentication by trying to list sessions
  const authCheck = executeCommand('jules remote list --session 2>&1 | head -2');
  const authenticated = authCheck.success && !authCheck.output.includes('not logged in');

  return { installed: true, authenticated, version };
}

// ═══════════════════════════════════════════════════════════════════════════
// SESSION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new Jules session
 * @param {string} description - Task description
 * @param {Object} options - Session options
 * @param {string} [options.repo] - Repository (defaults to CONFIG.defaultRepo)
 * @param {number} [options.parallel=1] - Number of parallel sessions (1-5)
 * @returns {CommandResult}
 */
function createSession(description, options = {}) {
  const repo = options.repo || CONFIG.defaultRepo;
  const parallel = Math.min(Math.max(options.parallel || 1, 1), CONFIG.maxParallel);

  // Escape the description for shell
  const escapedDesc = description
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');

  let command = `jules new --repo ${repo}`;
  if (parallel > 1) {
    command += ` --parallel ${parallel}`;
  }
  command += ` "${escapedDesc}"`;

  return executeCommand(command);
}

/**
 * List all sessions
 * @param {Object} [filters] - Optional filters
 * @param {SessionStatus} [filters.status] - Filter by status
 * @param {string} [filters.repo] - Filter by repository
 * @returns {JulesSession[]}
 */
function listSessions(filters = {}) {
  const result = executeCommand('jules remote list --session');

  if (!result.success || !result.output) {
    return [];
  }

  const lines = result.output.split('\n');
  if (lines.length <= 1) {
    return []; // Only header or empty
  }

  // Parse the tabular output
  const sessions = lines
    .slice(1) // Skip header
    .filter((line) => line.trim())
    .map((line) => parseSessionLine(line))
    .filter((session) => session !== null);

  // Apply filters
  let filtered = sessions;

  if (filters.status) {
    filtered = filtered.filter((s) => s.status === filters.status);
  }

  if (filters.repo) {
    filtered = filtered.filter((s) => s.repo.includes(filters.repo));
  }

  return filtered;
}

/**
 * Parse a single session line from Jules output
 * @param {string} line - Raw line from Jules output
 * @returns {JulesSession|null}
 */
function parseSessionLine(line) {
  // The output is whitespace-aligned columns
  // Parse using regex to capture the columns
  const parts = line.trim().split(/\s{2,}/);

  if (parts.length < 5) {
    return null;
  }

  return {
    id: parts[0],
    description: parts[1],
    repo: parts[2],
    lastActive: parts[3],
    status: normalizeStatus(parts[4]),
  };
}

/**
 * Normalize status strings
 * @param {string} status - Raw status string
 * @returns {SessionStatus}
 */
function normalizeStatus(status) {
  const normalizedStatus = status.toLowerCase().trim();

  if (normalizedStatus.includes('completed')) return 'Completed';
  if (normalizedStatus.includes('in progress')) return 'In Progress';
  if (normalizedStatus.includes('awaiting') || normalizedStatus.includes('feedback'))
    return 'Awaiting User F';
  if (normalizedStatus.includes('failed')) return 'Failed';

  return 'Unknown';
}

/**
 * Get details for a specific session
 * @param {string} sessionId - Session ID
 * @returns {JulesSession|null}
 */
function getSession(sessionId) {
  const sessions = listSessions();
  return sessions.find((s) => s.id === sessionId) || null;
}

// ═══════════════════════════════════════════════════════════════════════════
// RESULT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pull session results
 * @param {string} sessionId - Session ID
 * @param {boolean} [apply=false] - Whether to apply the patch
 * @returns {CommandResult}
 */
function pullSession(sessionId, apply = false) {
  let command = `jules remote pull --session ${sessionId}`;
  if (apply) {
    command += ' --apply';
  }
  return executeCommand(command);
}

/**
 * Teleport to a session (clone + apply)
 * @param {string} sessionId - Session ID
 * @returns {CommandResult}
 */
function teleportSession(sessionId) {
  return executeCommand(`jules teleport ${sessionId}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// BATCH OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Submit multiple tasks in batch with rate limiting
 * @param {Array<{description: string, options?: Object}>} tasks - Tasks to submit
 * @param {Object} batchOptions - Batch options
 * @param {number} [batchOptions.delayMs=2000] - Delay between submissions
 * @param {Function} [batchOptions.onProgress] - Progress callback
 * @returns {Promise<Array<{task: Object, result: CommandResult}>>}
 */
async function submitBatch(tasks, batchOptions = {}) {
  const delayMs = batchOptions.delayMs || CONFIG.retryDelay;
  const results = [];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];

    if (batchOptions.onProgress) {
      batchOptions.onProgress({
        current: i + 1,
        total: tasks.length,
        task: task.description,
      });
    }

    const result = createSession(task.description, task.options);
    results.push({ task, result });

    // Rate limiting delay (except for last task)
    if (i < tasks.length - 1) {
      await sleep(delayMs);
    }
  }

  return results;
}

/**
 * Poll sessions until all reach a terminal state
 * @param {string[]} sessionIds - Session IDs to monitor
 * @param {Object} options - Polling options
 * @param {number} [options.intervalMs=30000] - Polling interval
 * @param {number} [options.timeoutMs=3600000] - Maximum wait time (1 hour default)
 * @param {Function} [options.onUpdate] - Callback when status changes
 * @returns {Promise<JulesSession[]>}
 */
async function pollUntilComplete(sessionIds, options = {}) {
  const intervalMs = options.intervalMs || 30000;
  const timeoutMs = options.timeoutMs || 3600000;
  const startTime = Date.now();

  const terminalStatuses = ['Completed', 'Failed', 'Awaiting User F'];

  while (Date.now() - startTime < timeoutMs) {
    const allSessions = listSessions();
    const targetSessions = allSessions.filter((s) => sessionIds.includes(s.id));

    if (options.onUpdate) {
      options.onUpdate(targetSessions);
    }

    const allTerminal = targetSessions.every((s) => terminalStatuses.includes(s.status));
    if (allTerminal && targetSessions.length === sessionIds.length) {
      return targetSessions;
    }

    await sleep(intervalMs);
  }

  throw new Error('Polling timeout exceeded');
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Log a Jules operation
 * @param {string} operation - Operation name
 * @param {Object} data - Data to log
 */
function logOperation(operation, data) {
  const logDir = CONFIG.logDir;
  const logFile = path.join(logDir, `jules-${new Date().toISOString().split('T')[0]}.json`);

  // Ensure log directory exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // Append to log file
  const logEntry = {
    timestamp: new Date().toISOString(),
    operation,
    ...data,
  };

  try {
    let logs = [];
    if (fs.existsSync(logFile)) {
      logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
    }
    logs.push(logEntry);
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Failed to log operation:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CLI INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Main CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'status':
      const status = checkJulesStatus();
      console.log('Jules CLI Status:');
      console.log(`  Installed: ${status.installed ? '✅' : '❌'}`);
      console.log(`  Authenticated: ${status.authenticated ? '✅' : '❌'}`);
      console.log(`  Version: ${status.version || 'N/A'}`);
      break;

    case 'list':
      const filterArg = args[1];
      let sessions = listSessions();

      if (filterArg === '--completed') {
        sessions = sessions.filter((s) => s.status === 'Completed');
      } else if (filterArg === '--inprogress') {
        sessions = sessions.filter((s) => s.status === 'In Progress');
      } else if (filterArg === '--awaiting') {
        sessions = sessions.filter((s) => s.status === 'Awaiting User F');
      }

      console.log(`Found ${sessions.length} sessions:`);
      sessions.forEach((s) => {
        console.log(`  [${s.status}] ${s.id}: ${s.description.substring(0, 50)}...`);
      });
      break;

    case 'new':
      const description = args.slice(1).join(' ');
      if (!description) {
        console.log('Usage: node jules-integration.js new <description>');
        process.exit(1);
      }
      const result = createSession(description);
      console.log(result.success ? '✅ Session created' : `❌ Failed: ${result.error}`);
      break;

    case 'pull':
      const sessionId = args[1];
      const apply = args.includes('--apply');
      if (!sessionId) {
        console.log('Usage: node jules-integration.js pull <session_id> [--apply]');
        process.exit(1);
      }
      const pullResult = pullSession(sessionId, apply);
      console.log(pullResult.success ? pullResult.output : `❌ Failed: ${pullResult.error}`);
      break;

    default:
      console.log('Jules Integration CLI');
      console.log('');
      console.log('Commands:');
      console.log('  status                    Check Jules CLI status');
      console.log(
        '  list [--filter]          List sessions (--completed, --inprogress, --awaiting)'
      );
      console.log('  new <description>        Create new session');
      console.log('  pull <id> [--apply]      Pull session results');
      break;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // Configuration
  CONFIG,

  // Core functions
  executeCommand,
  checkJulesStatus,

  // Session management
  createSession,
  listSessions,
  getSession,

  // Result management
  pullSession,
  teleportSession,

  // Batch operations
  submitBatch,
  pollUntilComplete,

  // Utilities
  sleep,
  logOperation,
};

// Run CLI if executed directly
if (require.main === module) {
  main().catch(console.error);
}
