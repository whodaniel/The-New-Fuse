/**
 * Sync Core Server Entry Point
 * Main entry point for the sync system deployment
 */

import { SyncServer } from './deployment/SyncServer.js';

// Start the server
const server = new SyncServer();
server.start().catch((error) => {
  console.error('Failed to start Sync Core server:', error);
  process.exit(1);
});