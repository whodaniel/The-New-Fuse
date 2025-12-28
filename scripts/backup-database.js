/**
 * Database Backup Script
 * Exports all data from the Railway PostgreSQL database to JSON files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '../packages/database/generated/prisma/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

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
    { name: 'users', query: () => prisma.user.findMany() },
    { name: 'agents', query: () => prisma.agent.findMany() },
    { name: 'agentMetadata', query: () => prisma.agentMetadata.findMany() },
    { name: 'agentNFTs', query: () => prisma.agentNFT.findMany() },
    { name: 'wallets', query: () => prisma.wallet.findMany() },
    { name: 'chats', query: () => prisma.chat.findMany() },
    { name: 'chatRooms', query: () => prisma.chatRoom.findMany() },
    { name: 'messages', query: () => prisma.message.findMany() },
    { name: 'workflows', query: () => prisma.workflow.findMany() },
    { name: 'workflowExecutions', query: () => prisma.workflowExecution.findMany() },
    { name: 'workflowSteps', query: () => prisma.workflowStep.findMany() },
    { name: 'workflowTemplates', query: () => prisma.workflowTemplate.findMany() },
    { name: 'tasks', query: () => prisma.task.findMany() },
    { name: 'taskExecutions', query: () => prisma.taskExecution.findMany() },
    { name: 'pipelines', query: () => prisma.pipeline.findMany() },
    { name: 'llmConfigs', query: () => prisma.lLMConfig.findMany() },
    { name: 'promptTemplates', query: () => prisma.promptTemplate.findMany() },
    { name: 'promptVersions', query: () => prisma.promptVersion.findMany() },
    { name: 'authSessions', query: () => prisma.authSession.findMany() },
    { name: 'loginAttempts', query: () => prisma.loginAttempt.findMany() },
    { name: 'authEvents', query: () => prisma.authEvent.findMany() },
    { name: 'agentRegistrations', query: () => prisma.agentRegistration.findMany() },
    { name: 'agentDirectoryEntries', query: () => prisma.agentDirectoryEntry.findMany() },
    { name: 'agentPromptVersions', query: () => prisma.agentPromptVersion.findMany() },
    { name: 'marketplaceListings', query: () => prisma.marketplaceListing.findMany() },
    { name: 'marketplaceOffers', query: () => prisma.marketplaceOffer.findMany() },
    { name: 'fractionalShares', query: () => prisma.fractionalShare.findMany() },
    { name: 'revenueStreams', query: () => prisma.revenueStream.findMany() },
    { name: 'revenueDistributions', query: () => prisma.revenueDistribution.findMany() },
    { name: 'codeExecutionUsage', query: () => prisma.codeExecutionUsage.findMany() },
    { name: 'syncStates', query: () => prisma.syncState.findMany() },
    { name: 'registeredEntities', query: () => prisma.registeredEntity.findMany() },
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
  .finally(() => prisma.$disconnect());
