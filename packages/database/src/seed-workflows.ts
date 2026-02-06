import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from './drizzle/client';
import { users } from './drizzle/schema/users';
import { workflowExecutions, workflows } from './drizzle/schema/workflows';

async function seed() {
  console.log('🌱 Seeding workflows...');

  // 1. Ensure a user exists
  const email = 'admin@thenewfuse.com';
  let user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    console.log('Creating default user...');
    [user] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email,
        username: 'admin',
        name: 'Admin User',
        hashedPassword: 'placeholder_hash', // In reality, this would be hashed
        role: 'ADMIN',
      })
      .returning();
  }

  const userId = user.id;

  // 2. Define Workflows
  const workflowData = [
    {
      name: 'Daily Data Sync',
      description: 'Synchronizes customer data between CRM and Marketing tables.',
      status: 'ACTIVE',
      agentCount: 3,
      definition: {
        steps: [
          { id: '1', type: 'trigger', name: 'Schedule Trigger' },
          { id: '2', type: 'action', name: 'Fetch CRM Data' },
          { id: '3', type: 'action', name: 'Update Marketing DB' },
        ],
      },
    },
    {
      name: 'Lead Qualification Bot',
      description: 'Analyzes incoming leads and scores them using AI criteria.',
      status: 'DRAFT',
      agentCount: 1,
      definition: {
        steps: [
          { id: '1', type: 'trigger', name: 'New Lead Webhook' },
          { id: '2', type: 'ai', name: 'Score Lead' },
        ],
      },
    },
    {
      name: 'Social Media Monitor',
      description: 'Tracks brand mentions across platforms and generates sentiment reports.',
      status: 'ACTIVE',
      agentCount: 4,
      definition: {
        steps: [
          { id: '1', type: 'trigger', name: 'Social Mention' },
          { id: '2', type: 'ai', name: 'Analyze Sentiment' },
          { id: '3', type: 'action', name: 'Slack Notification' },
        ],
      },
    },
  ];

  for (const wf of workflowData) {
    const existing = await db.query.workflows.findFirst({
      where: eq(workflows.name, wf.name),
    });

    let workflowId;

    if (!existing) {
      console.log(`Creating workflow: ${wf.name}`);
      const [inserted] = await db
        .insert(workflows)
        .values({
          name: wf.name,
          description: wf.description,
          status: wf.status as any,
          creatorId: userId,
          definition: wf.definition,
          isActive: true,
        })
        .returning();
      workflowId = inserted.id;
    } else {
      console.log(`Workflow exists: ${wf.name}`);
      workflowId = existing.id;
      // Optionally update
      await db
        .update(workflows)
        .set({
          description: wf.description,
          status: wf.status as any,
          definition: wf.definition,
        })
        .where(eq(workflows.id, workflowId));
    }

    // 3. Create mock executions if relevant
    if (wf.name === 'Daily Data Sync') {
      // Last run 2 hours ago
      await createExecution(
        workflowId,
        'COMPLETED',
        new Date(Date.now() - 2 * 60 * 60 * 1000),
        1000 * 60 * 5.5
      ); // 5m 30s
      // Failed run 1 day ago
      await createExecution(
        workflowId,
        'FAILED',
        new Date(Date.now() - 24 * 60 * 60 * 1000),
        1000 * 80
      ); // 1m 20s
    } else if (wf.name === 'Social Media Monitor') {
      // Running now
      await createExecution(workflowId, 'RUNNING', new Date(Date.now() - 60 * 1000), 0);
      // Completed 1 hour ago
      await createExecution(
        workflowId,
        'COMPLETED',
        new Date(Date.now() - 60 * 60 * 1000),
        1000 * 60 * 3.25
      ); // 3m 15s
    }
  }

  console.log('✅ Seeding complete!');
  process.exit(0);
}

async function createExecution(
  workflowId: string,
  status: string,
  startTime: Date,
  durationMs: number
) {
  // Check if execution exists (simple check, maybe skip to avoid dupes on re-run, or just insert always)
  // To avoid clutter, let's just insert.

  // Actually, to avoid infinite growth on multiple runs, let's check recent count
  const recent = await db.query.workflowExecutions.findFirst({
    where: (ex, { eq, and }) => and(eq(ex.workflowId, workflowId), eq(ex.status, status as any)),
  });

  if (!recent || true) {
    // Always insert for now to guarantee they show up
    await db.insert(workflowExecutions).values({
      workflowId,
      status: status as any,
      startedAt: startTime,
      completedAt: status !== 'RUNNING' ? new Date(startTime.getTime() + durationMs) : null,
    });
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
