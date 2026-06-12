#!/usr/bin/env node
/* eslint-env node */
/* global console:readonly */
/**
 * Script to kill processes using specified ports before starting services
 * For The New Fuse project
 */

const { execSync } = require('child_process');
const os = require('os');

const PORTS_TO_CHECK = [3001, 3002, 3003, 3004];

console.log('🔍 Checking for processes using ports needed by The New Fuse...');

function killProcessesByPort() {
  const isWindows = os.platform() === 'win32';
  const isMac = os.platform() === 'darwin';
  
  PORTS_TO_CHECK.forEach(port => {
    let pid; // Declare pid outside the try block
    try {
      if (isWindows) {
        // Windows command to find PID
        const output = execSync(`netstat -ano | findstr :${port}`).toString();
        const match = output.match(/LISTENING\s+(\d+)/);
        pid = match && match[1];
      } else if (isMac) {
        // macOS command to find PID
        const output = execSync(`lsof -i:${port} -t`).toString().trim();
        pid = output || null;
      } else {
        // Linux command to find PID
        const output = execSync(`lsof -i:${port} -t`).toString().trim();
        pid = output || null;
      }
      
      if (pid) {
        console.log(`🔴 Found process ${pid} using port ${port}, killing it...`);
        
        if (isWindows) {
          execSync(`taskkill /F /PID ${pid}`);
        } else {
          execSync(`kill -9 ${pid}`);
        }
        
        console.log(`✅ Process on port ${port} successfully terminated`);
      } else {
        console.log(`✅ Port ${port} is free`);
      }
    } catch (error) {
      // This error could be from PID lookup (e.g., command not found) or from the kill command.
      // 'pid' is from the scope of the try block.
      if (pid) { // 'pid' would be set if the error occurred during the kill attempt
        console.error(`❌ Error killing process ${pid} on port ${port}: ${error.message}`);
      } else { // 'pid' is not set, so error occurred during PID lookup
        console.error(`❌ Error checking for process on port ${port}: ${error.message}`);
      }
    }
  });
  
  console.log('🚀 All ports have been cleared for use');
}

// Execute the function
killProcessesByPort();
