#!/usr/bin/env node
/**
 * Script to check if Docker ports are available before starting containers
 * For The New Fuse project
 */

import { execSync } from 'child_process';
import os from 'os';

const DOCKER_PORTS = [3001, 3002, 3003, 3004];
const CONTAINER_NAMES = {
  3001: 'frontend',
  3002: 'backend',
  3003: 'typescript-api',
  3004: 'backend-api'
};

console.log('🔍 Checking Docker port availability...');

function checkDockerPorts() {
  const isWindows = os.platform() === 'win32';
  const isMac = os.platform() === 'darwin';
  let allPortsAvailable = true;
  
  DOCKER_PORTS.forEach(port => {
    try {
      let isPortInUse = false;
      let processInfo = '';
      
      if (isWindows) {
        // Windows command to check port usage
        const output = execSync(`netstat -ano | findstr :${port}`).toString();
        isPortInUse = output.includes('LISTENING');
        if (isPortInUse) {
          processInfo = output.trim();
        }
      } else if (isMac || !isWindows) {
        // macOS/Linux command to check port usage
        try {
          const output = execSync(`lsof -i :${port} -P -n`).toString().trim();
          isPortInUse = output.length > 0;
          if (isPortInUse) {
            processInfo = output;
          }
        } catch (e) {
          // If lsof returns non-zero, the port is likely free
          isPortInUse = false;
        }
      }
      
      if (isPortInUse) {
        console.log(`🚨 Port ${port} is already in use!`);
        console.log(`   This port is needed for the ${CONTAINER_NAMES[port]} container.`);
        console.log(`   Process details: ${processInfo.split('\n')[0]}`);
        console.log(`   Run 'yarn kill-ports' to free up the ports.`);
        allPortsAvailable = false;
      } else {
        console.log(`✅ Port ${port} available for ${CONTAINER_NAMES[port]}`);
      }
    } catch (error) {
      console.log(`✅ Port ${port} appears to be available for ${CONTAINER_NAMES[port]}`);
    }
  });
  
  if (allPortsAvailable) {
    console.log('🚀 All Docker ports are available');
    process.exit(0);
  } else {
    console.error('❌ Cannot proceed with Docker deployment until ports are freed');
    process.exit(1);
  }
}

// Execute the function
checkDockerPorts();