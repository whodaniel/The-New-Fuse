import { PrismaClient, UserRole, AgentType, AgentStatus, AgentCapability } from '../generated/prisma';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

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
    await prisma.lLMConfig.upsert({
      where: {
        // Use a composite unique constraint if available
        name: config.name,
      },
      update: {
        enabled: config.enabled,
        priority: config.priority,
      },
      create: config,
    });
    console.log(`✅ LLM config created: ${config.name}`);
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
        description: 'General-purpose coding assistant',
        systemPrompt: 'You are a helpful coding assistant. Help users write, debug, and optimize code.',
        capabilities: [
          AgentCapability.CODE_GENERATION,
          AgentCapability.CODE_REVIEW,
          AgentCapability.DEBUGGING,
          AgentCapability.CODE_REFACTORING,
        ],
        provider: 'default',
        userId: adminUser.id,
      },
      {
        name: 'Chat Agent',
        type: AgentType.CHAT,
        status: AgentStatus.ACTIVE,
        description: 'Conversational AI agent',
        systemPrompt: 'You are a friendly and helpful AI assistant. Engage in natural conversation.',
        capabilities: [
          AgentCapability.CHAT,
          AgentCapability.RESEARCH,
          AgentCapability.ANALYSIS,
        ],
        provider: 'default',
        userId: adminUser.id,
      },
      {
        name: 'Workflow Orchestrator',
        type: AgentType.WORKFLOW,
        status: AgentStatus.ACTIVE,
        description: 'Manages and executes complex workflows',
        systemPrompt: 'You are a workflow orchestration agent. Coordinate tasks and manage execution flow.',
        capabilities: [
          AgentCapability.WORKFLOW,
          AgentCapability.TASK_EXECUTION,
          AgentCapability.PROJECT_MANAGEMENT,
        ],
        provider: 'default',
        userId: adminUser.id,
      },
    ];

    for (const agent of systemAgents) {
      await prisma.agent.upsert({
        where: {
          // Composite unique on name + userId if available, or use name only
          name_userId: {
            name: agent.name,
            userId: agent.userId,
          },
        },
        update: {},
        create: agent,
      });
      console.log(`✅ System agent created: ${agent.name}`);
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
    await prisma.registeredEntity.upsert({
      where: {
        // Use composite unique if available
        name: entity.name,
      },
      update: {},
      create: entity,
    });
    console.log(`✅ Registered entity: ${entity.name}`);
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
