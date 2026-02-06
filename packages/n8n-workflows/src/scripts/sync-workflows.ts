#!/usr/bin/env ts-node
/**
 * Sync Workflows Script
 * Continuous sync script for keeping workflows up to date
 */

import * as path from 'path';
import { WorkflowService } from '../services/WorkflowService';

const SYNC_INTERVAL_HOURS = 24; // Sync every 24 hours

async function sync() {
  console.log(`[${new Date().toISOString()}] Starting workflow sync...`);

  const service = new WorkflowService({
    storageDir: path.join(process.cwd(), '.n8n-workflows-registry'),
    enablePersistence: true,
  });

  await service.initialize();

  try {
    const result = await service.syncWorkflows();

    console.log(`[${new Date().toISOString()}] Sync completed:`);
    console.log(`  - Total workflows: ${result.totalWorkflows}`);
    console.log(`  - Success: ${result.success}`);
    console.log(`  - Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.error('Errors during sync:');
      result.errors.forEach((error) => console.error(`  - ${error}`));
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Sync failed:`, error);
  }
}

async function main() {
  console.log('=== N8N Workflow Sync Service ===');
  console.log(`Sync interval: ${SYNC_INTERVAL_HOURS} hours`);

  // Initial sync
  await sync();

  // Schedule periodic syncs
  setInterval(
    async () => {
      await sync();
    },
    SYNC_INTERVAL_HOURS * 60 * 60 * 1000
  );

  console.log('Sync service running. Press Ctrl+C to stop.');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
