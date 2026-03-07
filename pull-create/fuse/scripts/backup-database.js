/**
 * Database Backup Script
 * Exports all data from the Railway PostgreSQL database to JSON files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DrizzleClient } from '../packages/database/generated/drizzle/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const drizzle = new DrizzleClient();

async function backupDatabase() {
  const backupDir = path.join(
    __dirname,
    '..',
    'backups',
    `backup_${new Date().toISOString().replace(/[:.]/g, '-')}`
  );
  fs.mkdirSync(backupDir, { recursive: true });

  console.log(`Backing up database to: ${backupDir}`);

  const tables = [
    { name: 'users', query: () => drizzle.user.findMany() },
    { name: 'agents', query: () => drizzle.agent.findMany() },
    { name: 'agentMetadata', query: () => drizzle.agentMetadata.findMany() },
    { name: 'agentNFTs', query: () => drizzle.agentNFT.findMany() },
    { name: 'wallets', query: () => drizzle.wallet.findMany() },
    { name: 'chats', query: () => drizzle.chat.findMany() },
    { name: 'chatRooms', query: () => drizzle.chatRoom.findMany() },
    { name: 'messages', query: () => drizzle.message.findMany() },
    { name: 'workflows', query: () => drizzle.workflow.findMany() },
    { name: 'workflowExecutions', query: () => drizzle.workflowExecution.findMany() },
    { name: 'workflowSteps', query: () => drizzle.workflowStep.findMany() },
    { name: 'workflowTemplates', query: () => drizzle.workflowTemplate.findMany() },
    { name: 'tasks', query: () => drizzle.task.findMany() },
    { name: 'taskExecutions', query: () => drizzle.taskExecution.findMany() },
    { name: 'pipelines', query: () => drizzle.pipeline.findMany() },
    { name: 'llmConfigs', query: () => drizzle.lLMConfig.findMany() },
    { name: 'promptTemplates', query: () => drizzle.promptTemplate.findMany() },
    { name: 'promptVersions', query: () => drizzle.promptVersion.findMany() },
    { name: 'authSessions', query: () => drizzle.authSession.findMany() },
    { name: 'loginAttempts', query: () => drizzle.loginAttempt.findMany() },
    { name: 'authEvents', query: () => drizzle.authEvent.findMany() },
    { name: 'agentRegistrations', query: () => drizzle.agentRegistration.findMany() },
    { name: 'agentDirectoryEntries', query: () => drizzle.agentDirectoryEntry.findMany() },
    { name: 'agentPromptVersions', query: () => drizzle.agentPromptVersion.findMany() },
    { name: 'marketplaceListings', query: () => drizzle.marketplaceListing.findMany() },
    { name: 'marketplaceOffers', query: () => drizzle.marketplaceOffer.findMany() },
    { name: 'fractionalShares', query: () => drizzle.fractionalShare.findMany() },
    { name: 'revenueStreams', query: () => drizzle.revenueStream.findMany() },
    { name: 'revenueDistributions', query: () => drizzle.revenueDistribution.findMany() },
    { name: 'codeExecutionUsage', query: () => drizzle.codeExecutionUsage.findMany() },
    { name: 'syncStates', query: () => drizzle.syncState.findMany() },
    { name: 'registeredEntities', query: () => drizzle.registeredEntity.findMany() },
  ];

  const summary = {};

  for (const table of tables) {
    try {
      console.log(`Backing up ${table.name}...`);
      const data = await table.query();
      const filePath = path.join(backupDir, `${table.name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      summary[table.name] = data.length;
      console.log(`  ✓ ${data.length} records`);
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
      summary[table.name] = `Error: ${error.message}`;
    }
  }

  // Save summary
  fs.writeFileSync(path.join(backupDir, '_summary.json'), JSON.stringify(summary, null, 2));

  console.log('\nBackup complete!');
  console.log('Summary:', summary);
  console.log(`\nBackup location: ${backupDir}`);

  return backupDir;
}

backupDatabase()
  .catch(console.error)
  .finally(() => drizzle.$disconnect());
