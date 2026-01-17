#!/usr/bin/env node
/**
 * Jules Session Monitor & Manager
 *
 * Provides scheduled monitoring for Jules tasks with:
 * - Status dashboard
 * - Automatic result pulling for completed tasks
 * - Alert notifications for awaiting feedback
 * - Session history logging
 *
 * @module JulesMonitor
 * @version 1.0.0
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  pollIntervalMs: 60000, // 1 minute between polls
  logDir: '.agent/jules-logs',
  historyFile: '.agent/jules-logs/session-history.json',
  alertFile: '.agent/jules-logs/alerts.json',
  dashboardFile: '.agent/jules-logs/dashboard.json',
  maxHistoryEntries: 1000,
  repo: 'whodaniel/fuse',
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @typedef {Object} JulesSession
 * @property {string} id
 * @property {string} description
 * @property {string} repo
 * @property {string} lastActive
 * @property {string} status
 */

/**
 * @typedef {Object} SessionHistory
 * @property {string} sessionId
 * @property {string} status
 * @property {string} timestamp
 * @property {string} [previousStatus]
 */

/**
 * @typedef {Object} Alert
 * @property {string} type
 * @property {string} sessionId
 * @property {string} message
 * @property {string} timestamp
 * @property {boolean} acknowledged
 */

// ═══════════════════════════════════════════════════════════════════════════
// CORE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Execute a Jules CLI command safely
 */
function executeCommand(command) {
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      timeout: 120000,
      maxBuffer: 50 * 1024 * 1024,
    });
    return { success: true, output: output.trim() };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * List all sessions
 */
function listSessions() {
  const result = executeCommand('jules remote list --session');

  if (!result.success || !result.output) {
    return [];
  }

  const lines = result.output.split('\n');
  if (lines.length <= 1) {
    return [];
  }

  return lines
    .slice(1)
    .filter((line) => line.trim())
    .map((line) => parseSessionLine(line))
    .filter((session) => session !== null);
}

/**
 * Parse a single session line
 */
function parseSessionLine(line) {
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
 */
function normalizeStatus(status) {
  const s = status.toLowerCase().trim();
  if (s.includes('completed')) return 'Completed';
  if (s.includes('in progress')) return 'In Progress';
  if (s.includes('awaiting') || s.includes('feedback')) return 'Awaiting Feedback';
  if (s.includes('failed')) return 'Failed';
  return 'Unknown';
}

// ═══════════════════════════════════════════════════════════════════════════
// MONITORING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Load previous session states
 */
function loadPreviousStates() {
  try {
    if (fs.existsSync(CONFIG.dashboardFile)) {
      const data = JSON.parse(fs.readFileSync(CONFIG.dashboardFile, 'utf8'));
      return data.sessions || {};
    }
  } catch (error) {
    console.error('Error loading previous states:', error.message);
  }
  return {};
}

/**
 * Save current session states
 */
function saveCurrentStates(sessions) {
  ensureLogDir();

  const sessionMap = {};
  sessions.forEach((s) => {
    sessionMap[s.id] = {
      status: s.status,
      description: s.description,
      lastActive: s.lastActive,
      lastChecked: new Date().toISOString(),
    };
  });

  const dashboard = {
    lastUpdated: new Date().toISOString(),
    totalSessions: sessions.length,
    byStatus: {
      completed: sessions.filter((s) => s.status === 'Completed').length,
      inProgress: sessions.filter((s) => s.status === 'In Progress').length,
      awaitingFeedback: sessions.filter((s) => s.status === 'Awaiting Feedback').length,
      failed: sessions.filter((s) => s.status === 'Failed').length,
    },
    sessions: sessionMap,
  };

  fs.writeFileSync(CONFIG.dashboardFile, JSON.stringify(dashboard, null, 2));
  return dashboard;
}

/**
 * Record session history
 */
function recordHistory(sessionId, status, previousStatus) {
  ensureLogDir();

  let history = [];
  try {
    if (fs.existsSync(CONFIG.historyFile)) {
      history = JSON.parse(fs.readFileSync(CONFIG.historyFile, 'utf8'));
    }
  } catch (error) {
    history = [];
  }

  history.push({
    sessionId,
    status,
    previousStatus,
    timestamp: new Date().toISOString(),
  });

  // Keep only recent history
  if (history.length > CONFIG.maxHistoryEntries) {
    history = history.slice(-CONFIG.maxHistoryEntries);
  }

  fs.writeFileSync(CONFIG.historyFile, JSON.stringify(history, null, 2));
}

/**
 * Create an alert
 */
function createAlert(type, sessionId, message) {
  ensureLogDir();

  let alerts = [];
  try {
    if (fs.existsSync(CONFIG.alertFile)) {
      alerts = JSON.parse(fs.readFileSync(CONFIG.alertFile, 'utf8'));
    }
  } catch (error) {
    alerts = [];
  }

  alerts.push({
    type,
    sessionId,
    message,
    timestamp: new Date().toISOString(),
    acknowledged: false,
  });

  fs.writeFileSync(CONFIG.alertFile, JSON.stringify(alerts, null, 2));

  // Console notification
  console.log(`\n🔔 ALERT [${type}]: ${message}`);
}

/**
 * Ensure log directory exists
 */
function ensureLogDir() {
  if (!fs.existsSync(CONFIG.logDir)) {
    fs.mkdirSync(CONFIG.logDir, { recursive: true });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN MONITORING LOOP
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Run a single monitoring cycle
 */
function runMonitoringCycle() {
  console.log(`\n[${new Date().toISOString()}] Running monitoring cycle...`);

  const previousStates = loadPreviousStates();
  const currentSessions = listSessions();

  if (currentSessions.length === 0) {
    console.log('  No sessions found or error fetching sessions');
    return null;
  }

  // Detect status changes
  let statusChanges = 0;
  for (const session of currentSessions) {
    const prevState = previousStates[session.id];

    if (prevState && prevState.status !== session.status) {
      statusChanges++;
      console.log(
        `  📝 Status change: ${session.id.substring(0, 10)}... ${prevState.status} → ${session.status}`
      );
      recordHistory(session.id, session.status, prevState.status);

      // Create alerts for specific transitions
      if (session.status === 'Completed') {
        createAlert(
          'COMPLETED',
          session.id,
          `Session completed: ${session.description.substring(0, 50)}...`
        );
      } else if (session.status === 'Failed') {
        createAlert(
          'FAILED',
          session.id,
          `Session failed: ${session.description.substring(0, 50)}...`
        );
      }
    }
  }

  // Save current states
  const dashboard = saveCurrentStates(currentSessions);

  // Print summary
  console.log(`  ✅ Completed: ${dashboard.byStatus.completed}`);
  console.log(`  🔄 In Progress: ${dashboard.byStatus.inProgress}`);
  console.log(`  ⏳ Awaiting Feedback: ${dashboard.byStatus.awaitingFeedback}`);
  console.log(`  ❌ Failed: ${dashboard.byStatus.failed}`);

  if (statusChanges > 0) {
    console.log(`  📊 ${statusChanges} status change(s) detected`);
  }

  return dashboard;
}

/**
 * Start continuous monitoring
 */
function startMonitoring() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  JULES SESSION MONITOR                                        ║');
  console.log('║  Polling interval: ' + CONFIG.pollIntervalMs / 1000 + ' seconds'.padEnd(41) + '║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');

  // Initial run
  runMonitoringCycle();

  // Start polling
  const intervalId = setInterval(() => {
    runMonitoringCycle();
  }, CONFIG.pollIntervalMs);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\nShutting down monitor...');
    clearInterval(intervalId);
    process.exit(0);
  });

  console.log('\nMonitor running. Press Ctrl+C to stop.');
}

// ═══════════════════════════════════════════════════════════════════════════
// REPORTING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a status report
 */
function generateReport() {
  const sessions = listSessions();

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  JULES SESSIONS REPORT                                        ║');
  console.log('║  Generated: ' + new Date().toISOString().padEnd(47) + '║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Summary
  const completed = sessions.filter((s) => s.status === 'Completed');
  const inProgress = sessions.filter((s) => s.status === 'In Progress');
  const awaiting = sessions.filter((s) => s.status === 'Awaiting Feedback');
  const failed = sessions.filter((s) => s.status === 'Failed');

  console.log('SUMMARY');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log(`  Total Sessions: ${sessions.length}`);
  console.log(`  ✅ Completed: ${completed.length}`);
  console.log(`  🔄 In Progress: ${inProgress.length}`);
  console.log(`  ⏳ Awaiting Feedback: ${awaiting.length}`);
  console.log(`  ❌ Failed: ${failed.length}`);

  // Awaiting feedback details
  if (awaiting.length > 0) {
    console.log('\n\nAWAITING USER FEEDBACK');
    console.log('─────────────────────────────────────────────────────────────────');
    awaiting.forEach((s, i) => {
      console.log(`  ${i + 1}. [${s.id}]`);
      console.log(`     ${s.description.substring(0, 60)}...`);
      console.log(`     Last Active: ${s.lastActive}`);
      console.log();
    });
  }

  // In progress details
  if (inProgress.length > 0) {
    console.log('\nIN PROGRESS');
    console.log('─────────────────────────────────────────────────────────────────');
    inProgress.forEach((s, i) => {
      console.log(`  ${i + 1}. [${s.id}]`);
      console.log(`     ${s.description.substring(0, 60)}...`);
      console.log();
    });
  }

  // Recent completions
  console.log('\nRECENT COMPLETIONS (Last 5)');
  console.log('─────────────────────────────────────────────────────────────────');
  completed.slice(0, 5).forEach((s, i) => {
    console.log(`  ${i + 1}. [${s.id}]`);
    console.log(`     ${s.description.substring(0, 60)}...`);
    console.log(`     Last Active: ${s.lastActive}`);
    console.log();
  });
}

/**
 * List unacknowledged alerts
 */
function listAlerts() {
  try {
    if (!fs.existsSync(CONFIG.alertFile)) {
      console.log('No alerts found.');
      return [];
    }

    const alerts = JSON.parse(fs.readFileSync(CONFIG.alertFile, 'utf8'));
    const unacknowledged = alerts.filter((a) => !a.acknowledged);

    if (unacknowledged.length === 0) {
      console.log('No unacknowledged alerts.');
      return [];
    }

    console.log(`\n${unacknowledged.length} unacknowledged alert(s):\n`);
    unacknowledged.forEach((alert, i) => {
      console.log(`  ${i + 1}. [${alert.type}] ${alert.message}`);
      console.log(`     Session: ${alert.sessionId}`);
      console.log(`     Time: ${alert.timestamp}`);
      console.log();
    });

    return unacknowledged;
  } catch (error) {
    console.error('Error loading alerts:', error.message);
    return [];
  }
}

/**
 * Acknowledge all alerts
 */
function acknowledgeAlerts() {
  try {
    if (!fs.existsSync(CONFIG.alertFile)) {
      console.log('No alerts to acknowledge.');
      return;
    }

    const alerts = JSON.parse(fs.readFileSync(CONFIG.alertFile, 'utf8'));
    alerts.forEach((a) => (a.acknowledged = true));
    fs.writeFileSync(CONFIG.alertFile, JSON.stringify(alerts, null, 2));

    console.log(`Acknowledged ${alerts.length} alert(s).`);
  } catch (error) {
    console.error('Error acknowledging alerts:', error.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CLI INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'start':
    case 'watch':
      startMonitoring();
      break;

    case 'once':
    case 'check':
      runMonitoringCycle();
      break;

    case 'report':
      generateReport();
      break;

    case 'alerts':
      listAlerts();
      break;

    case 'ack':
    case 'acknowledge':
      acknowledgeAlerts();
      break;

    case 'dashboard':
      try {
        if (fs.existsSync(CONFIG.dashboardFile)) {
          const dashboard = JSON.parse(fs.readFileSync(CONFIG.dashboardFile, 'utf8'));
          console.log(JSON.stringify(dashboard, null, 2));
        } else {
          console.log('No dashboard data. Run "check" first.');
        }
      } catch (error) {
        console.error('Error loading dashboard:', error.message);
      }
      break;

    default:
      console.log('Jules Session Monitor');
      console.log('');
      console.log('Commands:');
      console.log('  start, watch      Start continuous monitoring');
      console.log('  once, check       Run one monitoring cycle');
      console.log('  report            Generate detailed status report');
      console.log('  alerts            List unacknowledged alerts');
      console.log('  ack, acknowledge  Acknowledge all alerts');
      console.log('  dashboard         Show dashboard JSON');
      break;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  CONFIG,
  listSessions,
  runMonitoringCycle,
  startMonitoring,
  generateReport,
  listAlerts,
  acknowledgeAlerts,
  createAlert,
};

// Run CLI if executed directly
if (require.main === module) {
  main().catch(console.error);
}
