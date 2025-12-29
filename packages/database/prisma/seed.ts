// Load environment variables FIRST - before any other imports that use them
import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { EncryptionService } from '@the-new-fuse/core';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import {
  AgentCapability,
  AgentStatus,
  AgentType,
  PrismaClient,
  UserRole,
} from '../generated/prisma';

// Validate required environment variable
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set. Please check your .env file.');
}

console.log('📡 Connecting to database...');
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const encryptionService = new EncryptionService();

/**
 * Database Seed Script
 *
 * This script initializes the database with essential data needed for the application to function.
 * It's idempotent - running it multiple times won't create duplicates.
 *
 * Run with: npx prisma db seed
 */

async function main() {
  console.log('🌱 Starting database seeding...');

  // =============================================================================
  // ADMIN USER SETUP
  // =============================================================================

  console.log('👤 Creating admin user...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@thenewfuse.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123!'; // CHANGE IN PRODUCTION

  if (adminPassword === 'changeme123!') {
    console.warn('⚠️  WARNING: Using default admin password. Please change immediately!');
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      username: 'admin',
      name: 'System Administrator',
      hashedPassword,
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      isActive: true,
      emailVerified: true,
    },
  });

  console.log(`✅ Admin user created/verified: ${adminUser.email}`);

  // =============================================================================
  // MASTER ADMIN SETUP - owner@example.com
  // =============================================================================

  console.log('👑 Creating Master Admin user...');

  const masterAdminEmail = 'owner@example.com';
  const masterAdminPassword = process.env.MASTER_ADMIN_PASSWORD || 'changeme123!'; // CHANGE IN PRODUCTION

  if (masterAdminPassword === 'changeme123!') {
    console.warn('⚠️  WARNING: Using default master admin password. Please change immediately!');
  }

  const masterHashedPassword = await bcrypt.hash(masterAdminPassword, 12);

  const masterAdmin = await prisma.user.upsert({
    where: { email: masterAdminEmail },
    update: {
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      isActive: true,
    },
    create: {
      email: masterAdminEmail,
      username: 'bizsynth',
      name: 'Master Administrator',
      hashedPassword: masterHashedPassword,
      role: UserRole.SUPER_ADMIN,
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      isActive: true,
      emailVerified: true,
    },
  });

  console.log(`✅ Master Admin created/verified: ${masterAdmin.email} (Role: SUPER_ADMIN)`);

  // =============================================================================
  // DEMO USER SETUP (Optional - for development)
  // =============================================================================

  if (process.env.NODE_ENV === 'development') {
    console.log('👥 Creating demo users...');

    const demoUsers = [
      {
        email: 'demo@thenewfuse.com',
        username: 'demo',
        name: 'Demo User',
        roles: [UserRole.USER],
      },
      {
        email: 'agency@thenewfuse.com',
        username: 'agency_owner',
        name: 'Agency Owner Demo',
        roles: [UserRole.AGENCY_OWNER, UserRole.USER],
      },
    ];

    for (const user of demoUsers) {
      const hashedPwd = await bcrypt.hash('demo123', 12);
      await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: {
          ...user,
          hashedPassword: hashedPwd,
          isActive: true,
          emailVerified: true,
        },
      });
      console.log(`✅ Demo user created: ${user.email}`);
    }
  }

  // =============================================================================
  // DEFAULT LLM CONFIGURATIONS
  // =============================================================================

  console.log('🤖 Setting up default LLM configurations...');

  const llmConfigs = [
    {
      name: 'OpenAI GPT-4',
      provider: 'openai',
      modelName: 'gpt-4',
      apiKey: process.env.OPENAI_API_KEY || 'placeholder-key',
      apiEndpoint: 'https://api.openai.com/v1',
      enabled: !!process.env.OPENAI_API_KEY,
      priority: 100,
      isCustom: false,
    },
    {
      name: 'OpenAI GPT-3.5 Turbo',
      provider: 'openai',
      modelName: 'gpt-3.5-turbo',
      apiKey: process.env.OPENAI_API_KEY || 'placeholder-key',
      apiEndpoint: 'https://api.openai.com/v1',
      enabled: !!process.env.OPENAI_API_KEY,
      priority: 50,
      isCustom: false,
    },
    {
      name: 'Anthropic Claude 3',
      provider: 'anthropic',
      modelName: 'claude-3-opus-20240229',
      apiKey: process.env.ANTHROPIC_API_KEY || 'placeholder-key',
      apiEndpoint: 'https://api.anthropic.com/v1',
      enabled: !!process.env.ANTHROPIC_API_KEY,
      priority: 90,
      isCustom: false,
    },
  ];

  for (const config of llmConfigs) {
    const encryptedApiKey = await encryptionService.encryptString(config.apiKey);
    // Check if config exists by name
    const existing = await prisma.lLMConfig.findFirst({
      where: { name: config.name },
    });

    if (existing) {
      await prisma.lLMConfig.update({
        where: { id: existing.id },
        data: {
          enabled: config.enabled,
          priority: config.priority,
          apiKey: encryptedApiKey,
        },
      });
    } else {
      await prisma.lLMConfig.create({
        data: { ...config, apiKey: encryptedApiKey },
      });
    }
    console.log(`✅ LLM config created/updated: ${config.name}`);
  }

  // =============================================================================
  // SYSTEM AGENTS (Optional starter agents)
  // =============================================================================

  if (process.env.CREATE_SYSTEM_AGENTS === 'true') {
    console.log('🤖 Creating system agents...');

    const systemAgents = [
      {
        name: 'Code Assistant',
        type: AgentType.ASSISTANT,
        status: AgentStatus.ACTIVE,
        description:
          'General-purpose coding assistant specialized in multiple programming languages',
        systemPrompt:
          'You are a helpful coding assistant. Help users write, debug, and optimize code across multiple languages including TypeScript, Python, JavaScript, and more.',
        capabilities: [
          AgentCapability.CODE_GENERATION,
          AgentCapability.CODE_REVIEW,
          AgentCapability.DEBUGGING,
          AgentCapability.CODE_REFACTORING,
          AgentCapability.TESTING,
          AgentCapability.CODE_COMPLETION,
        ],
        provider: 'default',
        userId: adminUser.id,
        config: {
          maxTokens: 4000,
          temperature: 0.7,
          language: 'typescript',
        },
      },
      {
        name: 'Chat Agent',
        type: AgentType.CHAT,
        status: AgentStatus.ACTIVE,
        description: 'Conversational AI agent for natural language interactions',
        systemPrompt:
          'You are a friendly and helpful AI assistant. Engage in natural conversation and help users with various tasks.',
        capabilities: [AgentCapability.CHAT, AgentCapability.RESEARCH, AgentCapability.ANALYSIS],
        provider: 'default',
        userId: adminUser.id,
        config: {
          conversationStyle: 'friendly',
          contextWindow: 8000,
        },
      },
      {
        name: 'Workflow Orchestrator',
        type: AgentType.WORKFLOW,
        status: AgentStatus.ACTIVE,
        description: 'Manages and executes complex multi-step workflows with error handling',
        systemPrompt:
          'You are a workflow orchestration agent. Coordinate tasks, manage execution flow, and handle errors gracefully.',
        capabilities: [
          AgentCapability.WORKFLOW,
          AgentCapability.TASK_EXECUTION,
          AgentCapability.PROJECT_MANAGEMENT,
          AgentCapability.DEBUGGING,
        ],
        provider: 'default',
        userId: adminUser.id,
        config: {
          maxConcurrentTasks: 5,
          retryAttempts: 3,
        },
      },
      {
        name: 'Security Auditor',
        type: AgentType.ANALYSIS,
        status: AgentStatus.ACTIVE,
        description: 'Specialized agent for security audits and vulnerability detection',
        systemPrompt:
          'You are a security analysis expert. Review code and systems for vulnerabilities, suggest security improvements, and ensure best practices.',
        capabilities: [
          AgentCapability.SECURITY_AUDIT,
          AgentCapability.CODE_REVIEW,
          AgentCapability.ANALYSIS,
          AgentCapability.DEBUGGING,
        ],
        provider: 'default',
        userId: adminUser.id,
        config: {
          scanDepth: 'deep',
          reportFormat: 'detailed',
        },
      },
      {
        name: 'Documentation Writer',
        type: AgentType.ASSISTANT,
        status: AgentStatus.ACTIVE,
        description: 'Creates comprehensive documentation from code and requirements',
        systemPrompt:
          'You are a technical documentation specialist. Create clear, concise, and comprehensive documentation for code, APIs, and systems.',
        capabilities: [
          AgentCapability.DOCUMENTATION,
          AgentCapability.CODE_REVIEW,
          AgentCapability.ANALYSIS,
        ],
        provider: 'default',
        userId: adminUser.id,
        config: {
          format: 'markdown',
          includeExamples: true,
        },
      },
      {
        name: 'Test Generator',
        type: AgentType.TASK,
        status: AgentStatus.ACTIVE,
        description: 'Automatically generates comprehensive test suites for code',
        systemPrompt:
          'You are a test automation specialist. Generate comprehensive unit tests, integration tests, and e2e tests.',
        capabilities: [
          AgentCapability.TESTING,
          AgentCapability.CODE_GENERATION,
          AgentCapability.ANALYSIS,
          AgentCapability.DEBUGGING,
        ],
        provider: 'default',
        userId: adminUser.id,
        config: {
          testFramework: 'jest',
          coverage: 'high',
        },
      },
      {
        name: 'Code Reviewer Pro',
        type: AgentType.ANALYSIS,
        status: AgentStatus.ACTIVE,
        description: 'Advanced code review agent with architectural insights',
        systemPrompt:
          'You are a senior software architect. Perform thorough code reviews, suggest architectural improvements, and ensure code quality.',
        capabilities: [
          AgentCapability.CODE_REVIEW,
          AgentCapability.ARCHITECTURE_DESIGN,
          AgentCapability.OPTIMIZATION,
          AgentCapability.ANALYSIS,
        ],
        provider: 'default',
        userId: adminUser.id,
        config: {
          strictness: 'high',
          focusAreas: ['performance', 'maintainability', 'security'],
        },
      },
      {
        name: 'Data Analyst',
        type: AgentType.ANALYSIS,
        status: AgentStatus.ACTIVE,
        description: 'Analyzes data patterns and generates insights',
        systemPrompt:
          'You are a data analysis expert. Process data, identify patterns, and generate actionable insights.',
        capabilities: [
          AgentCapability.ANALYSIS,
          AgentCapability.RESEARCH,
          AgentCapability.DOCUMENTATION,
          AgentCapability.INTEGRATION,
        ],
        provider: 'default',
        userId: adminUser.id,
        config: {
          visualizationType: 'interactive',
          analysisDepth: 'comprehensive',
        },
      },
      {
        name: 'DevOps Helper',
        type: AgentType.TASK,
        status: AgentStatus.INACTIVE,
        description: 'Assists with DevOps tasks, CI/CD, and deployment automation',
        systemPrompt:
          'You are a DevOps specialist. Help with deployment, CI/CD pipelines, infrastructure as code, and monitoring.',
        capabilities: [
          AgentCapability.TASK_EXECUTION,
          AgentCapability.FILE_MANAGEMENT,
          AgentCapability.CODE_EXECUTION,
          AgentCapability.INTEGRATION,
        ],
        provider: 'default',
        userId: adminUser.id,
        config: {
          platform: 'kubernetes',
          cicdTool: 'github-actions',
        },
      },
      {
        name: 'API Designer',
        type: AgentType.API,
        status: AgentStatus.ACTIVE,
        description: 'Designs RESTful and GraphQL APIs following best practices',
        systemPrompt:
          'You are an API design expert. Create well-structured, documented, and maintainable APIs.',
        capabilities: [
          AgentCapability.ARCHITECTURE_DESIGN,
          AgentCapability.DOCUMENTATION,
          AgentCapability.CODE_GENERATION,
          AgentCapability.ANALYSIS,
        ],
        provider: 'default',
        userId: adminUser.id,
        config: {
          apiStyle: 'REST',
          versioning: 'semantic',
        },
      },
      // CRITICAL SYSTEM AGENTS FOR MULTI-AGENT COORDINATION
      {
        name: 'Master Orchestrator',
        type: AgentType.WORKFLOW,
        status: AgentStatus.ACTIVE,
        description:
          'Central nervous system for The New Fuse. Coordinates all agents, manages task distribution, and maintains system heartbeat.',
        systemPrompt: `You are the Master Orchestrator Agent for The New Fuse platform. Your responsibilities:
1. Register and track all agents in the network
2. Coordinate task assignments between agents
3. Monitor agent heartbeats and detect stagnation
4. Escalate issues requiring human intervention
5. Maintain documentation and handoff protocols
6. Ensure seamless coordination between human users and AI agents`,
        capabilities: [
          AgentCapability.WORKFLOW,
          AgentCapability.PROJECT_MANAGEMENT,
          AgentCapability.TASK_EXECUTION,
          AgentCapability.ANALYSIS,
          AgentCapability.INTEGRATION,
        ],
        provider: 'system',
        userId: adminUser.id,
        config: {
          role: 'orchestrator',
          heartbeatIntervalMs: 5000,
          stagnationThresholdMs: 30000,
          maxConcurrentAgents: 50,
          escalationEnabled: true,
          selfRegistration: true,
        },
      },
      {
        name: 'Message Broker',
        type: AgentType.WORKFLOW,
        status: AgentStatus.ACTIVE,
        description:
          'Facilitates communication between all agents via Redis pub/sub. Routes messages, maintains queues, and ensures delivery.',
        systemPrompt: `You are the Message Broker Agent for The New Fuse platform. Your responsibilities:
1. Route messages between agents using Redis pub/sub
2. Maintain message queues for async processing
3. Ensure message delivery and retry failed messages
4. Track communication patterns for optimization
5. Provide inter-agent communication APIs`,
        capabilities: [
          AgentCapability.INTEGRATION,
          AgentCapability.TASK_EXECUTION,
          AgentCapability.WORKFLOW,
        ],
        provider: 'system',
        userId: adminUser.id,
        config: {
          role: 'broker',
          redisChannel: 'fuse:agents:broadcast',
          taskChannel: 'fuse:tasks:assignment',
          heartbeatChannel: 'fuse:heartbeat',
          maxQueueSize: 10000,
          retryAttempts: 3,
        },
      },
    ];

    for (const agent of systemAgents) {
      // Check if agent exists
      const existingAgent = await prisma.agent.findFirst({
        where: {
          name: agent.name,
          userId: agent.userId,
        },
      });

      if (!existingAgent) {
        await prisma.agent.create({
          data: agent,
        });
        console.log(`✅ System agent created: ${agent.name}`);
      } else {
        console.log(`✅ System agent already exists: ${agent.name}`);
      }
    }
  }

  // =============================================================================
  // REGISTERED ENTITIES (System tools and integrations)
  // =============================================================================

  console.log('🔧 Registering system entities...');

  const systemEntities = [
    {
      name: 'file-system-tool',
      type: 'TOOL' as any,
      description: 'File system operations tool',
      status: 'ACTIVE' as any,
      version: '1.0.0',
      namespace: 'system',
      tags: ['file-system', 'io'],
      capabilities: ['read', 'write', 'delete', 'list'],
      isPublic: true,
    },
    {
      name: 'code-execution-service',
      type: 'SERVICE' as any,
      description: 'Code execution service',
      status: 'ACTIVE' as any,
      version: '1.0.0',
      namespace: 'system',
      tags: ['code-execution', 'sandbox'],
      capabilities: ['javascript', 'python', 'typescript'],
      isPublic: true,
    },
  ];

  for (const entity of systemEntities) {
    // Check if entity exists
    const existingEntity = await prisma.registeredEntity.findFirst({
      where: { name: entity.name },
    });

    if (!existingEntity) {
      await prisma.registeredEntity.create({
        data: entity,
      });
      console.log(`✅ Registered entity created: ${entity.name}`);
    } else {
      console.log(`✅ Registered entity already exists: ${entity.name}`);
    }
  }

  // =============================================================================
  // VERIFICATION
  // =============================================================================

  console.log('\n📊 Database seeding summary:');

  const stats = await getDatabaseStats();
  console.log(`  Users: ${stats.users}`);
  console.log(`  Agents: ${stats.agents}`);
  console.log(`  LLM Configs: ${stats.llmConfigs}`);
  console.log(`  Registered Entities: ${stats.entities}`);

  console.log('\n✅ Database seeding completed successfully!');
  console.log('\n⚠️  IMPORTANT: Change default admin password immediately in production!');
}

/**
 * Get database statistics
 */
async function getDatabaseStats() {
  const [users, agents, llmConfigs, entities] = await Promise.all([
    prisma.user.count(),
    prisma.agent.count(),
    prisma.lLMConfig.count(),
    prisma.registeredEntity.count(),
  ]);

  return { users, agents, llmConfigs, entities };
}

/**
 * Cleanup function
 */
async function cleanup() {
  await prisma.$disconnect();
}

// Execute main function
main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(cleanup);
