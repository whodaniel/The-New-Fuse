import { PrismaClient, TaskStatus } from '@the-new-fuse/database/client'

export type ExtendedPrismaClient = PrismaClient & {
  $extends: (extension: {
    name: string
    client: {
      [K: string]: unknown
    }
  }) => ExtendedPrismaClient
}

interface UserWithAuth {
  id: string
  email: string
  authSessions: string // JSON string of auth sessions
}

interface PipelineWithTasks {
  id: string
  name: string
  task_count: number
}

interface TaskWithInfo {
  id: string
  status: TaskStatus
  completedAt: Date
  error: string | null
  pipelineId: string
  pipeline_name: string
  agentId: string
  agent_capabilities: string[]
}

interface AgentMetrics {
  id: string
  capabilities: string[]
  pipeline_count: number
  completed_tasks: number
}

interface ChatAnalytics {
  userId: string
  email: string
  message_count: number
}

export async function getActiveUserSessions(prisma: ExtendedPrismaClient, email: string): Promise<UserWithAuth[]> {
  return await prisma.$queryRaw`
    WITH user_data AS (
      SELECT id, email
      FROM users
      WHERE email = ${email}
      AND "deletedAt" IS NULL
      LIMIT 1
    ),
    active_sessions AS (
      SELECT 
        "userId",
        json_agg(json_build_object(
          'id', id,
          'token', token,
          'expiresAt', "expiresAt",
          'lastActivity', "lastActivity"
        ) ORDER BY "lastActivity" DESC) as sessions
      FROM auth_sessions
      WHERE "userId" = (SELECT id FROM user_data)
      AND "expiresAt" > NOW()
      GROUP BY "userId"
    )
    SELECT 
      u.id,
      u.email,
      COALESCE(s.sessions::text, '[]') as "authSessions"
    FROM user_data u
    LEFT JOIN active_sessions s ON s."userId" = u.id
  `
}

export async function getPipelineMetrics(prisma: ExtendedPrismaClient): Promise<PipelineWithTasks[]> {
  return await prisma.$queryRaw`
    WITH active_pipelines AS (
      SELECT id, name
      FROM pipelines
      WHERE "deletedAt" IS NULL
    ),
    completed_tasks AS (
      SELECT 
        t."pipelineId",
        COUNT(*) as task_count
      FROM tasks t
      INNER JOIN active_pipelines p ON p.id = t."pipelineId"
      WHERE t.status = 'COMPLETED'
      AND t."deletedAt" IS NULL
      GROUP BY t."pipelineId"
    )
    SELECT 
      p.id,
      p.name,
      COALESCE(ct.task_count, 0) as task_count
    FROM active_pipelines p
    LEFT JOIN completed_tasks ct ON ct."pipelineId" = p.id
    ORDER BY ct.task_count DESC NULLS LAST
  `
}

export async function getAgentMetrics(prisma: ExtendedPrismaClient): Promise<AgentMetrics[]> {
  return await prisma.$queryRaw`
    WITH active_agents AS (
      SELECT id, capabilities
      FROM agents
      WHERE status = 'ACTIVE'
      AND "deletedAt" IS NULL
    ),
    pipeline_stats AS (
      SELECT 
        p."agentId",
        COUNT(DISTINCT p.id) as pipeline_count
      FROM pipelines p
      INNER JOIN active_agents a ON a.id = p."agentId"
      WHERE p."deletedAt" IS NULL
      GROUP BY p."agentId"
    ),
    task_stats AS (
      SELECT 
        p."agentId",
        COUNT(DISTINCT t.id) as completed_tasks
      FROM tasks t
      INNER JOIN pipelines p ON p.id = t."pipelineId"
      INNER JOIN active_agents a ON a.id = p."agentId"
      WHERE t.status = 'COMPLETED'
      AND t."deletedAt" IS NULL
      GROUP BY p."agentId"
    )
    SELECT 
      a.id,
      a.capabilities,
      COALESCE(ps.pipeline_count, 0) as pipeline_count,
      COALESCE(ts.completed_tasks, 0) as completed_tasks
    FROM active_agents a
    LEFT JOIN pipeline_stats ps ON ps."agentId" = a.id
    LEFT JOIN task_stats ts ON ts."agentId" = a.id
    ORDER BY ts.completed_tasks DESC NULLS LAST
  `
}

export async function getRecentTaskAnalytics(prisma: ExtendedPrismaClient): Promise<TaskWithInfo[]> {
  return await prisma.$queryRaw`
    WITH recent_tasks AS (
      SELECT 
        t.id,
        t.status,
        t."completedAt",
        t.error,
        t."pipelineId"
      FROM tasks t
      WHERE t."completedAt" >= NOW() - INTERVAL '7 days'
      AND t."deletedAt" IS NULL
      AND t.status = 'COMPLETED'
    )
    SELECT 
      t.id,
      t.status,
      t."completedAt",
      t.error,
      t."pipelineId",
      p.name as pipeline_name,
      p."agentId",
      a.capabilities as agent_capabilities
    FROM recent_tasks t
    INNER JOIN pipelines p ON p.id = t."pipelineId" AND p."deletedAt" IS NULL
    INNER JOIN agents a ON a.id = p."agentId" AND a."deletedAt" IS NULL
    ORDER BY t."completedAt" DESC
  `
}

export async function getChatMetrics(prisma: ExtendedPrismaClient): Promise<ChatAnalytics[]> {
  return await prisma.$queryRaw`
    WITH active_users AS (
      SELECT id, email
      FROM users
      WHERE "deletedAt" IS NULL
    ),
    recent_messages AS (
      SELECT 
        m."userId",
        COUNT(*) as message_count
      FROM chat_messages m
      INNER JOIN active_users u ON u.id = m."userId"
      WHERE m."createdAt" >= NOW() - INTERVAL '30 days'
      GROUP BY m."userId"
    )
    SELECT 
      u.id as "userId",
      u.email,
      COALESCE(rm.message_count, 0) as message_count
    FROM active_users u
    LEFT JOIN recent_messages rm ON rm."userId" = u.id
    ORDER BY rm.message_count DESC NULLS LAST
  `
}
