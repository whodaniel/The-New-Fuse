#!/usr/bin/env node
/* eslint-disable no-console */
const { PortRegistryService } = require('@the-new-fuse/port-management');

async function main() {
  const args = process.argv.slice(2);
  const serviceName = args[0];
  const environment = args[1] || 'development';

  if (!serviceName) {
    console.error('Usage: find-available-port.cjs <serviceName> [environment]');
    process.exit(1);
  }

  try {
    const portRegistry = new PortRegistryService();
    const availablePort = await portRegistry.findAvailablePort(serviceName, environment);
    console.log(availablePort);
  } catch (error) {
    console.error(`Failed to find available port for ${serviceName}: ${error.message}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`Script failed: ${error.message}`);
  process.exit(1);
});
