/**
 * Comprehensive Database Seed Script
 * Drizzle ORM Migration - Creates diverse agent examples with all agent types, statuses, and capabilities
 */

import { eq } from 'drizzle-orm';
import { db } from './drizzle/client.js';
import { agents } from './drizzle/schema/agents.js';
import { users } from './drizzle/schema/users.js';

// =============================================================================
// AGENT TYPES
// =============================================================================
const AGENT_TYPES = [
  'BASIC',
  'CHAT',
  'WORKFLOW',
  'TASK',
  'ASSISTANT',
  'ANALYSIS',
  'CONVERSATIONAL',
  'IDE_EXTENSION',
  'API',
] as const;

// =============================================================================
// AGENT STATUSES
// =============================================================================
const AGENT_STATUSES = [
  'ACTIVE',
  'INACTIVE',
  'IDLE',
  'BUSY',
  'ERROR',
  'OFFLINE',
  'INITIALIZING',
  'READY',
  'TERMINATED',
] as const;

// =============================================================================
// 25 AGENT CAPABILITIES
// =============================================================================
const AGENT_CAPABILITIES = [
  'TEXT_GENERATION',
  'CODE_GENERATION',
  'CODE_ANALYSIS',
  'TEXT_ANALYSIS',
  'DATA_PROCESSING',
  'WEB_SEARCH',
  'FILE_MANAGEMENT',
  'DATABASE_QUERY',
  'API_INTEGRATION',
  'WORKFLOW_ORCHESTRATION',
  'TASK_SCHEDULING',
  'NOTIFICATION_SENDING',
  'EMAIL_PROCESSING',
  'DOCUMENT_PARSING',
  'TRANSLATION',
  'SENTIMENT_ANALYSIS',
  'IMAGE_PROCESSING',
  'AUDIO_TRANSCRIPTION',
  'VIDEO_ANALYSIS',
  'LOG_ANALYSIS',
  'PERFORMANCE_MONITORING',
  'SECURITY_SCAN',
  'BUG_DETECTION',
  'DOCUMENTATION',
  'TEST_GENERATION',
] as const;

// =============================================================================
// 10 DIVERSE AGENT EXAMPLES
// =============================================================================
const SEED_AGENTS = [
  {
    name: 'CodeMaster Pro',
    description:
      'Advanced AI assistant specialized in code generation and analysis across multiple programming languages',
    type: 'CODE_GENERATION' as any,
    status: 'ACTIVE' as any,
    capabilities: [
      'CODE_GENERATION',
      'CODE_ANALYSIS',
      'BUG_DETECTION',
      'TEST_GENERATION',
      'DOCUMENTATION',
    ],
    systemPrompt:
      'You are CodeMaster Pro, an expert AI coding assistant. You help developers write clean, efficient, and maintainable code.',
    configuration: {
      maxTokens: 4096,
      temperature: 0.7,
      supportedLanguages: ['TypeScript', 'Python', 'JavaScript', 'Rust', 'Go'],
    },
  },
  {
    name: 'DataFlow Orchestrator',
    description: 'Workflow automation agent for data processing pipelines and ETL operations',
    type: 'WORKFLOW' as any,
    status: 'ACTIVE' as any,
    capabilities: [
      'WORKFLOW_ORCHESTRATION',
      'DATA_PROCESSING',
      'TASK_SCHEDULING',
      'DATABASE_QUERY',
      'API_INTEGRATION',
    ],
    systemPrompt:
      'You are DataFlow Orchestrator, a workflow automation expert. You design and execute efficient data pipelines.',
    configuration: {
      parallelExecution: true,
      retryPolicy: 'exponential',
      timeout: 3600000,
    },
  },
  {
    name: 'ChatBot Ultimate',
    description: 'Conversational AI agent for customer support and general inquiries',
    type: 'CONVERSATIONAL' as any,
    status: 'ACTIVE' as any,
    capabilities: [
      'TEXT_GENERATION',
      'SENTIMENT_ANALYSIS',
      'TRANSLATION',
      'NOTIFICATION_SENDING',
      'EMAIL_PROCESSING',
    ],
    systemPrompt:
      'You are ChatBot Ultimate, a friendly and helpful conversational AI. You assist users with their inquiries while maintaining a positive tone.',
    configuration: {
      responseLength: 'medium',
      empathyMode: true,
      languages: ['en', 'es', 'fr', 'de'],
    },
  },
  {
    name: 'Analytics Insight',
    description:
      'Data analysis agent for generating insights and visualizations from complex datasets',
    type: 'ANALYSIS' as any,
    status: 'READY' as any,
    capabilities: [
      'DATA_PROCESSING',
      'TEXT_ANALYSIS',
      'SENTIMENT_ANALYSIS',
      'LOG_ANALYSIS',
      'PERFORMANCE_MONITORING',
    ],
    systemPrompt:
      'You are Analytics Insight, a data analysis expert. You transform raw data into actionable insights and recommendations.',
    configuration: {
      visualizationFormats: ['chart', 'graph', 'table'],
      insightDepth: 'comprehensive',
    },
  },
  {
    name: 'WebResearch Agent',
    description: 'Intelligent web scraping and research agent for gathering information',
    type: 'TASK' as any,
    status: 'ACTIVE' as any,
    capabilities: [
      'WEB_SEARCH',
      'FILE_MANAGEMENT',
      'DOCUMENT_PARSING',
      'DATA_PROCESSING',
      'TEXT_ANALYSIS',
    ],
    systemPrompt:
      'You are WebResearch Agent, a research specialist. You efficiently gather and synthesize information from web sources.',
    configuration: {
      maxResults: 50,
      scrapeDepth: 'detailed',
      respectRobotsTxt: true,
    },
  },
  {
    name: 'SecureScan Pro',
    description: 'Security analysis agent for vulnerability detection and security audits',
    type: 'SECURITY' as any,
    status: 'ACTIVE' as any,
    capabilities: [
      'SECURITY_SCAN',
      'CODE_ANALYSIS',
      'BUG_DETECTION',
      'LOG_ANALYSIS',
      'PERFORMANCE_MONITORING',
    ],
    systemPrompt:
      'You are SecureScan Pro, a security analysis expert. You identify vulnerabilities and recommend security improvements.',
    configuration: {
      scanIntensity: 'thorough',
      complianceStandards: ['OWASP', 'CIS'],
    },
  },
  {
    name: 'DocuWriter Assistant',
    description: 'Documentation generation agent for creating technical documentation',
    type: 'DOCUMENTATION' as any,
    status: 'IDLE' as any,
    capabilities: [
      'DOCUMENTATION',
      'TEXT_GENERATION',
      'CODE_ANALYSIS',
      'FILE_MANAGEMENT',
      'TRANSLATION',
    ],
    systemPrompt:
      'You are DocuWriter Assistant, a documentation expert. You create clear, comprehensive technical documentation.',
    configuration: {
      documentationStyle: 'technical',
      includeCodeExamples: true,
    },
  },
  {
    name: 'IDE Integration Bot',
    description:
      'IDE extension agent for providing AI-powered coding assistance within development environments',
    type: 'IDE_EXTENSION' as any,
    status: 'READY' as any,
    capabilities: [
      'CODE_GENERATION',
      'CODE_ANALYSIS',
      'BUG_DETECTION',
      'TEST_GENERATION',
      'FILE_MANAGEMENT',
    ],
    systemPrompt:
      'You are IDE Integration Bot, an in-editor AI assistant. You provide context-aware coding suggestions and assistance.',
    configuration: {
      autoComplete: true,
      inlineSuggestions: true,
      keyboardShortcuts: true,
    },
  },
  {
    name: 'API Gateway Agent',
    description:
      'API integration agent for managing external service connections and data exchange',
    type: 'API' as any,
    status: 'BUSY' as any,
    capabilities: [
      'API_INTEGRATION',
      'DATABASE_QUERY',
      'DATA_PROCESSING',
      'NOTIFICATION_SENDING',
      'WORKFLOW_ORCHESTRATION',
    ],
    systemPrompt:
      'You are API Gateway Agent, an integration specialist. You manage API connections and ensure smooth data flow.',
    configuration: {
      rateLimiting: true,
      authenticationMethods: ['OAuth2', 'API_KEY', 'JWT'],
    },
  },
  {
    name: 'Multimedia Processor',
    description: 'Media processing agent for handling images, audio, and video content',
    type: 'TASK' as any,
    status: 'OFFLINE' as any,
    capabilities: [
      'IMAGE_PROCESSING',
      'AUDIO_TRANSCRIPTION',
      'VIDEO_ANALYSIS',
      'FILE_MANAGEMENT',
      'TEXT_ANALYSIS',
    ],
    systemPrompt:
      'You are Multimedia Processor, a media analysis expert. You process and analyze various media formats efficiently.',
    configuration: {
      supportedFormats: ['jpg', 'png', 'mp3', 'mp4', 'wav'],
      processingPriority: 'quality',
    },
  },
];

// =============================================================================
// SEED FUNCTIONS
// =============================================================================

async function seedUsers() {
  console.log('👤 Seeding users...');

  const email = 'admin@thenewfuse.com';
  let user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    console.log('Creating default admin user...');
    [user] = await db
      .insert(users)
      .values({
        email,
        username: 'admin',
        name: 'Admin User',
        hashedPassword: 'placeholder_hash',
        role: 'ADMIN',
      })
      .returning();
    console.log(`✅ Created admin user: ${user.id}`);
  } else {
    console.log(`ℹ️  Admin user already exists: ${user.id}`);
  }

  return user.id;
}

// function seedCapabilities() {
//   console.log('🔧 Seeding agent capabilities - SKIPPED (Schema mismatch)');
// }

function getCapabilityCategory(capability: string): string {
  const categories: Record<string, string[]> = {
    CODE: ['CODE_GENERATION', 'CODE_ANALYSIS', 'BUG_DETECTION', 'TEST_GENERATION'],
    DATA: ['DATA_PROCESSING', 'DATABASE_QUERY', 'LOG_ANALYSIS'],
    TEXT: ['TEXT_GENERATION', 'TEXT_ANALYSIS', 'TRANSLATION', 'DOCUMENTATION'],
    MEDIA: ['IMAGE_PROCESSING', 'AUDIO_TRANSCRIPTION', 'VIDEO_ANALYSIS'],
    WEB: ['WEB_SEARCH', 'FILE_MANAGEMENT', 'DOCUMENT_PARSING'],
    SYSTEM: [
      'WORKFLOW_ORCHESTRATION',
      'TASK_SCHEDULING',
      'PERFORMANCE_MONITORING',
      'SECURITY_SCAN',
    ],
    INTEGRATION: [
      'API_INTEGRATION',
      'NOTIFICATION_SENDING',
      'EMAIL_PROCESSING',
      'SENTIMENT_ANALYSIS',
    ],
  };

  for (const [category, capabilities] of Object.entries(categories)) {
    if (capabilities.includes(capability)) {
      return category;
    }
  }
  return 'OTHER';
}

async function seedAgents(userId: string) {
  console.log('🤖 Seeding agents...');

  for (const agentData of SEED_AGENTS) {
    const existing = await db.query.agents.findFirst({
      where: eq(agents.name, agentData.name),
    });

    if (!existing) {
      const [agent] = await db
        .insert(agents)
        .values({
          name: agentData.name,
          description: agentData.description,
          type: agentData.type,
          status: agentData.status,
          userId,
          capabilities: agentData.capabilities,
          systemPrompt: agentData.systemPrompt,
          config: agentData.configuration as any,
        })
        .returning();
      console.log(`✅ Created agent: ${agent.name} (${agent.type})`);
    } else {
      console.log(`ℹ️  Agent exists: ${agentData.name}`);
    }
  }
}

async function seedAdditionalAgents(userId: string) {
  console.log('🌱 Seeding additional test agents...');

  const additionalAgents = [
    {
      name: 'Backup Agent Alpha',
      description: 'Backup and recovery specialist',
      type: 'TASK' as any,
      status: 'INACTIVE' as any,
      capabilities: ['FILE_MANAGEMENT', 'DATA_PROCESSING', 'NOTIFICATION_SENDING'],
      systemPrompt: 'You are Backup Agent Alpha, focused on data backup and recovery operations.',
      configuration: { backupSchedule: 'daily', retentionDays: 30 },
    },
    {
      name: 'Error Handler Beta',
      description: 'Error handling and debugging assistant',
      type: 'ANALYSIS' as any,
      status: 'ERROR' as any,
      capabilities: ['BUG_DETECTION', 'LOG_ANALYSIS', 'CODE_ANALYSIS', 'NOTIFICATION_SENDING'],
      systemPrompt: 'You are Error Handler Beta, an expert at diagnosing and resolving errors.',
      configuration: { alertSeverity: 'critical' },
    },
    {
      name: 'System Initializer Gamma',
      description: 'System initialization and setup agent',
      type: 'TASK' as any,
      status: 'INITIALIZING' as any,
      capabilities: ['FILE_MANAGEMENT', 'API_INTEGRATION', 'WORKFLOW_ORCHESTRATION'],
      systemPrompt:
        'You are System Initializer Gamma, responsible for system setup and initialization.',
      configuration: { setupSteps: ['configure', 'validate', 'start'] },
    },
    {
      name: 'Terminated Agent Delta',
      description: 'Agent marked for cleanup',
      type: 'BASIC' as any,
      status: 'TERMINATED' as any,
      capabilities: ['TEXT_GENERATION'],
      systemPrompt: 'You are Terminated Agent Delta.',
      configuration: {},
    },
  ];

  for (const agentData of additionalAgents) {
    const existing = await db.query.agents.findFirst({
      where: eq(agents.name, agentData.name),
    });

    if (!existing) {
      const [agent] = await db
        .insert(agents)
        .values({
          name: agentData.name,
          description: agentData.description,
          type: agentData.type,
          status: agentData.status,
          userId,
          capabilities: agentData.capabilities,
          systemPrompt: agentData.systemPrompt,
          config: agentData.configuration as any,
        })
        .returning();
      console.log(`✅ Created additional agent: ${agent.name} (${agent.status})`);
    }
  }
}

// =============================================================================
// MAIN SEED FUNCTION
// =============================================================================

async function seed() {
  console.log('🚀 Starting comprehensive database seed...');
  console.log('='.repeat(50));

  try {
    // Seed users first
    const userId = await seedUsers();

    // Capabilities are now linked to registrations, so we skip global seeding
    // await seedCapabilities();

    // Seed main agents
    await seedAgents(userId);

    // Seed additional test agents
    await seedAdditionalAgents(userId);

    console.log('='.repeat(50));
    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Users: 1 (admin)`);
    console.log(`   - Capabilities: ${AGENT_CAPABILITIES.length}`);
    console.log(`   - Main Agents: ${SEED_AGENTS.length}`);
    console.log(`   - Additional Agents: 4`);
    console.log(`   - Total Agents: ${SEED_AGENTS.length + 4}`);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

// Export for use in other modules
export { AGENT_CAPABILITIES, AGENT_STATUSES, AGENT_TYPES, seed, SEED_AGENTS };

// Run if executed directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
