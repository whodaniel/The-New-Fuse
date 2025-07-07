#!/usr/bin/env node

import { execSync } from 'child_process';

/**
 * Clear ports before starting dev server
 * Standard ports for The New Fuse:
 * - Frontend: 3000
 * - Backend API: 3001  
 * - WebSocket: 3002
 * - Database UI: 5555 (Prisma Studio)
 */

const PORTS_TO_CLEAR = [3000, 3001, 3002, 5555];

function findProcessOnPort(port) {
  try {
    const result = execSync(`lsof -ti:${port}`, { encoding: 'utf8', stdio: 'pipe' });
    return result.trim().split('\n').filter(pid => pid);
  } catch (error) {
    // No process found on port
    return [];
  }
}

function killProcess(pid) {
  try {
    execSync(`kill -9 ${pid}`, { stdio: 'pipe' });
    return true;
  } catch (error) {
    console.warn(`⚠️  Could not kill process ${pid}:`, error.message);
    return false;
  }
}

function clearPort(port) {
  const pids = findProcessOnPort(port);
  
  if (pids.length === 0) {
    console.log(`✅ Port ${port} is already clear`);
    return;
  }

  console.log(`🔄 Clearing port ${port}... (${pids.length} process(es) found)`);
  
  let killed = 0;
  pids.forEach(pid => {
    if (killProcess(pid)) {
      killed++;
    }
  });
  
  if (killed > 0) {
    console.log(`✅ Port ${port} cleared (killed ${killed} process(es))`);
  } else {
    console.log(`⚠️  Could not clear port ${port}`);
  }
}

function main() {
  console.log('🚀 The New Fuse - Port Clearing Script');
  console.log('=====================================');
  
  PORTS_TO_CLEAR.forEach(port => {
    clearPort(port);
  });
  
  console.log('');
  console.log('✨ Port clearing complete! Starting dev server...');
  console.log('');
}

// Run main function if this is the entry point
main();

export { clearPort, PORTS_TO_CLEAR };