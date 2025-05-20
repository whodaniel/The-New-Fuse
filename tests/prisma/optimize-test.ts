import { PrismaClient } from '@the-new-fuse/database/client';
import { accelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(accelerate());

async function generateTestData(): any {
  // Create test user with optimized upsert
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    create: {
      email: 'test@example.com',
      hashedPassword: 'test-password-hash',
      name: 'Test User',
      role: 'USER'
    },
    update: {},
    select: {
      id: true,
      email: true
    }
  })

  // Create test agent with optimized upsert
  const agent = await prisma.agent.upsert({
    where: { id: 'test-agent-1' },
    create: {
      id: 'test-agent-1',
      name: 'Test Agent',
      description: 'Test agent for performance testing',
      type: 'BASIC',
      capabilities: ['test', 'analyze', 'execute'],
      status: AgentStatus.ACTIVE,
      userId: user.id
    },
    update: {},
    select: {
      id: true
    }
  })

  // Create test pipeline with optimized upsert
  const pipeline = await prisma.pipeline.upsert({
    where: { id: 'test-pipeline-1' },
    create: {
      id: 'test-pipeline-1',
      name: 'Test Pipeline',
      description: 'Test pipeline for performance testing',
      userId: user.id,
      agentId: agent.id
    },
    update: {},
    select: {
      id: true
    }
  })

  // Prepare data
  const now = new Date()
  const batchSize = 25 // Optimal batch size for better performance

  // Prepare all data before transactions
  const authSessions = Array.from({ length: 2 }, () => ({
    userId: user.id,
    token: randomUUID(),
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    lastActivity: now
  }))

  const tasks = Array.from({ length: 10 }, (_, i) => ({
    title: `Test Task ${i}`,
    type: 'TEST',
    status: TaskStatus.COMPLETED,
    priority: TaskPriority.NORMAL,
    completedAt: new Date(now.getTime() - i * 60 * 60 * 1000),
    pipelineId: pipeline.id,
    error: null
  }))

  const messages = Array.from({ length: 50 }, (_, i) => ({
    userId: user.id,
    content: `Test message ${i}`,
    createdAt: new Date(now.getTime() - i * 60 * 60 * 1000)
  }))

  // Execute batch operations with optimized transaction isolation
  await prisma.$transaction(async (tx) => {
    // Create auth sessions
    if (authSessions.length > 0) {
      await tx.authSession.createMany({
        data: authSessions,
        skipDuplicates: true
      })
    }

    // Create tasks in optimal batches
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize)
      await tx.task.createMany({
        data: batch,
        skipDuplicates: true
      })
    }

    // Create messages in optimal batches
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize)
      await tx.chatMessage.createMany({
        data: batch,
        skipDuplicates: true
      })
    }
  }, {
    maxWait: 5000, // 5s max wait for transaction
    timeout: 10000, // 10s timeout
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted
  })

  return { user, agent, pipeline }
}

async function generateOptimizeTestQueries(): any {
  const userResult = await getActiveUserSessions(prisma, 'test@example.com')
  if (userResult && userResult[0]) {
    .length} active sessions`)
  }
  const pipelineResult = await getPipelineMetrics(prisma)
  if (pipelineResult && pipelineResult.length > 0) {
    }
  const taskResult = await getRecentTaskAnalytics(prisma)
  if (taskResult && taskResult.length > 0) {
    }
  const agentResult = await getAgentMetrics(prisma)
  if (agentResult && agentResult.length > 0) {
    }
  const chatResult = await getChatMetrics(prisma)
  if (chatResult && chatResult.length > 0) {
    }
  }

async function main(): any {
  try {
    await generateTestData()
    await generateOptimizeTestQueries()
  } catch (error) {
    console.error('Error running test queries:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
