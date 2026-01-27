import * as dotenv from 'dotenv';
import * as path from 'path';
import { ClawdScheduler } from '../src/implementations/ClawdScheduler';

// Load environment variables from root .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function run() {
  console.log('--- ClawdScheduler Distributed Test ---');

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.error('Error: REDIS_URL not found in environment');
    process.exit(1);
  }

  console.log(`Connecting to Redis at: ${redisUrl}`);

  const scheduler = new ClawdScheduler({
    redisUrl,
    nodeId: 'test-script-' + Date.now(),
  });

  // Schedule a task for 1 minute from now
  // Bull cron syntax might differ slightly, but standard cron usually works.
  // Or we can just add a one-off job manually via the queue if we exposed it,
  // but scheduleSkill uses 'repeat' options.
  // For immediate testing, maybe we want a one-off?
  // ClawdScheduler currently only supports 'scheduleSkill' which does recurring.

  // Let's modify ClawdScheduler later to support one-off, but for now let's use a recurring task that runs every minute
  // "*/1 * * * *"

  const skillName = 'system-status';
  const cronExpression = '*/1 * * * *';

  console.log(`Scheduling skill '${skillName}' to run every minute (${cronExpression})...`);

  await scheduler.scheduleSkill(skillName, cronExpression, {
    requester: 'test-script',
    reason: 'verification',
  });

  console.log('✅ Task scheduled successfully via Redis!');
  console.log('Check the Backend logs to see the AgentExecutionProcessor picking it up.');
  console.log('Press Ctrl+C to exit.');

  // Keep alive to ensure event emission if needed, though with Redis we can probably exit.
  // But let's verify if we receive any events back? No, it's one way push.

  setTimeout(() => {
    console.log('Exiting...');
    process.exit(0);
  }, 5000);
}

run().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
