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

  // This script exists to be consumed as `PORT=$(find-available-port.cjs svc)`,
  // so it MUST exit. PortRegistryService holds a Redis connection and a
  // monitoring interval; without destroy() the event loop never drains and the
  // command substitution hangs forever instead of returning a port.
  const portRegistry = new PortRegistryService();
  try {
    const availablePort = await portRegistry.findAvailablePort(serviceName, environment);
    console.log(availablePort);
  } catch (error) {
    console.error(`Failed to find available port for ${serviceName}: ${error.message}`);
    portRegistry.destroy();
    process.exit(1);
  }
  portRegistry.destroy();
}

main().catch((error) => {
  console.error(`Script failed: ${error.message}`);
  process.exit(1);
});
