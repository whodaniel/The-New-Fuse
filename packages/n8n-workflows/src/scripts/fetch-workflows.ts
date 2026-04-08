#!/usr/bin/env ts-node
/**
 * Fetch Workflows Script
 * Manually fetch and sync workflows from GitHub repositories
 */

import * as path from 'path';
import { WorkflowService } from '../services/WorkflowService.js';

async function main() {
  console.log('=== N8N Workflow Fetcher ===\n');

  const service = new WorkflowService({
    storageDir: path.join(process.cwd(), '.n8n-workflows-registry'),
    enablePersistence: true,
  });

  console.log('Initializing workflow service...');
  await service.initialize();

  console.log('\nSyncing workflows from all sources...');
  const result = await service.syncWorkflows();

  console.log('\n=== Sync Results ===');
  console.log(`Success: ${result.success}`);
  console.log(`Total Workflows: ${result.totalWorkflows}`);

  console.log('\n=== Statistics ===');
  console.log(`Last Sync: ${result.stats.lastSync}`);

  console.log('\n=== By Category ===');
  Object.entries(result.stats.byCategory).forEach(([category, count]) => {
    console.log(`  ${category}: ${count}`);
  });

  console.log('\n=== By Source ===');
  Object.entries(result.stats.bySource).forEach(([source, count]) => {
    console.log(`  ${source}: ${count}`);
  });

  console.log('\n=== By Complexity ===');
  console.log(`  Simple: ${result.stats.byComplexity.simple}`);
  console.log(`  Medium: ${result.stats.byComplexity.medium}`);
  console.log(`  Complex: ${result.stats.byComplexity.complex}`);

  console.log('\n=== Top Tags ===');
  result.stats.mostPopularTags.slice(0, 10).forEach(({ tag, count }) => {
    console.log(`  ${tag}: ${count}`);
  });

  if (result.errors.length > 0) {
    console.log('\n=== Errors ===');
    result.errors.forEach((error) => {
      console.error(`  - ${error}`);
    });
  }

  console.log('\n=== Done ===');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
