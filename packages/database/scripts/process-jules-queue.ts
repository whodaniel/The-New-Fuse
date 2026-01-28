#!/usr/bin/env -S npx tsx

import { spawnSync } from 'child_process';
import { eq } from 'drizzle-orm';
import { db } from '../src/drizzle/client';
import * as drizzleSchema from '../src/drizzle/schema/index';

const { julesSessions: sessionsTable } = drizzleSchema;

async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log('Checking for pending Jules sessions...');

  try {
    const pendingSessions = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.status, 'PENDING'));

    console.log(`Found ${pendingSessions.length} pending sessions.`);

    for (const session of pendingSessions) {
      console.log(`Processing session ${session.id} (Jules ID: ${session.julesSessionId})`);

      const prompt = (session.metadata as any)?.prompt;
      if (!prompt) {
          console.error(`Session ${session.id} has no prompt in metadata.`);
          if (!isDryRun) {
             await db.update(sessionsTable).set({ status: 'FAILED', error: 'No prompt found' }).where(eq(sessionsTable.id, session.id));
          }
          continue;
      }

      if (isDryRun) {
          console.log(`[Dry Run] Would execute Jules with prompt:\n${prompt.substring(0, 100)}...`);
          continue;
      }

      // Update status to IN_PROGRESS
      await db.update(sessionsTable).set({ status: 'IN_PROGRESS', startedAt: new Date() }).where(eq(sessionsTable.id, session.id));

      try {
          console.log(`Executing Jules command...`);
          // Use spawnSync with array arguments to avoid shell injection
          const result = spawnSync('jules', ['new', prompt], {
              encoding: 'utf-8',
              timeout: 300000, // 5 min timeout
              stdio: 'pipe'
          });

          if (result.error) {
              throw result.error;
          }

          if (result.status !== 0) {
              throw new Error(result.stderr || `Jules process exited with code ${result.status}`);
          }

          console.log('Jules execution successful.');

          // Update to COMPLETED
          await db.update(sessionsTable).set({
              status: 'COMPLETED',
              result: { output: result.stdout },
              completedAt: new Date()
          }).where(eq(sessionsTable.id, session.id));

      } catch (error: any) {
          console.error(`Jules execution failed: ${error.message}`);
          await db.update(sessionsTable).set({
              status: 'FAILED',
              error: error.message,
              completedAt: new Date()
          }).where(eq(sessionsTable.id, session.id));
      }
    }
  } catch (error) {
    console.error('Error querying database:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
