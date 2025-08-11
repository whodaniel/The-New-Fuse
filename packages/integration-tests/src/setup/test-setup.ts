/**
 * Integration Test Setup
 * 
 * Configures test environment with all unified framework components
 */

import { Logger, HeartbeatMonitoringService, MasterAgentRegistry } from '@tnf/relay-core';
import { WorkflowEngineFactory } from '@the-new-fuse/workflow-engine';
import { ExtensionSystemFactory } from '@the-new-fuse/extension-system';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs-extra';

// Global test configuration
export interface TestEnvironment {
  logger: Logger;
  prisma: PrismaClient;
  agentRegistry: MasterAgentRegistry;
  heartbeatService: HeartbeatMonitoringService;
  workflowEngine: any;
  extensionManager: any;
  testDataDir: string;
  cleanup: () => Promise<void>;
}

let globalTestEnv: TestEnvironment | null = null;

/**
 * Setup test environment
 */
export async function setupTestEnvironment(): Promise<TestEnvironment> {
  if (globalTestEnv) {
    return globalTestEnv;
  }

  const testDataDir = path.join(__dirname, '../../test-data');
  await fs.ensureDir(testDataDir);

  // Setup logger
  const logger = new Logger('debug', testDataDir);

  // Setup database (use in-memory SQLite for tests)
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'file:./test.db'
      }
    }
  });

  // Setup Heartbeat Monitoring
  const heartbeatConfig = {
    intervalMs: 5000,
    timeoutMs: 30000,
    maxRetries: 3,
    escalationDelay: 10000,
    stagnationThresholdMs: 30000
  };

  const heartbeatService = new HeartbeatMonitoringService(heartbeatConfig, logger);

  // Setup MasterAgentRegistry
  const masterRegistry = new MasterAgentRegistry(
    prisma,
    logger,
    {
      enabled: false,
      providerUrl: 'http://localhost:8545',
      contractAddress: '0x0000000000000000000000000000000000000000',
      privateKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
      chainId: 1337,
      gasLimit: 3000000,
      maxGasPrice: '20'
    }
  );

  // Create adapters for workflow engine compatibility

  // Setup Workflow Engine - uses local HeartbeatMonitoringService interface
  const workflowSystem = WorkflowEngineFactory.createDefault(
    prisma,
    masterRegistry,
    heartbeatService,
    logger
  );

  // Setup Extension System - ExtensionSystemFactory expects AgentRegistry interface
  // Create adapter for extension system compatibility
  const extensionManager = ExtensionSystemFactory.createDefault(
    testDataDir,
    logger,
    masterRegistry,
    workflowSystem.engine
  );

  // Initialize all systems
  // Note: These services don't have initialize methods
  await extensionManager.initialize();

  const cleanup = async () => {
    await extensionManager.shutdown();
    heartbeatService.stop();
    // agentRegistry doesn't have shutdown method
    await prisma.$disconnect();
    await fs.remove(testDataDir);
  };

  globalTestEnv = {
    logger,
    prisma,
    agentRegistry: masterRegistry,
    heartbeatService,
    workflowEngine: workflowSystem,
    extensionManager,
    testDataDir,
    cleanup
  };

  return globalTestEnv;
}

/**
 * Cleanup test environment
 */
export async function cleanupTestEnvironment(): Promise<void> {
  if (globalTestEnv) {
    await globalTestEnv.cleanup();
    globalTestEnv = null;
  }
}

/**
 * Get current test environment
 */
export function getTestEnvironment(): TestEnvironment {
  if (!globalTestEnv) {
    throw new Error('Test environment not initialized. Call setupTestEnvironment() first.');
  }
  return globalTestEnv;
}

// Jest global setup and teardown
beforeAll(async () => {
  await setupTestEnvironment();
}, 30000);

afterAll(async () => {
  await cleanupTestEnvironment();
}, 10000);

// Helper functions for tests
export const TestHelpers = {
  /**
   * Create a test agent with standard configuration
   */
  async createTestAgent(name: string, type: string = 'TEST_AGENT') {
    const env = getTestEnvironment();
    
    const agentProfile = {
      name,
      type: type as any,
      userId: 'test-user',
      capabilities: {
        codeGeneration: false,
        fileOperations: true,
        webBrowsing: false,
        apiAccess: true,
        terminalAccess: false,
        gitOperations: false,
        databaseAccess: false,
        realTimeChat: false,
        imageProcessing: false,
        documentAnalysis: false,
        workflowExecution: false,
        agentCoordination: false,
        relayIntegration: false,
        protocolTranslation: false,
        heartbeatCompliance: false,
        handoffTemplating: false,
        stagnationRecovery: false
      },
      platform: 'integrated' as const,
      location: 'test-environment',
      description: `Test agent: ${name}`,
      systemPrompt: `You are a test agent named ${name} for integration testing purposes.`,
      configuration: {
        maxConcurrentTasks: 5,
        timeoutMs: 30000
      }
    };

    const result = await env.agentRegistry.registerAgent(agentProfile);
    if (!result.success) {
      throw new Error(`Failed to register test agent: ${result.agentId}`);
    }
    
    const profile = env.agentRegistry.getAgentProfile(result.agentId);
    return {
      agentId: result.agentId,
      profile: profile
    };
  },

  /**
   * Create a test workflow
   */
  async createTestWorkflow(name: string, description: string = 'Test workflow') {
    const env = getTestEnvironment();
    
    const workflow = env.workflowEngine.builder.createWorkflow(name, description);
    
    // Add basic workflow structure
    const startNode = env.workflowEngine.builder.addNode('start', 'Start', { x: 100, y: 100 });
    const endNode = env.workflowEngine.builder.addNode('end', 'End', { x: 500, y: 100 });
    
    return {
      workflow,
      startNode,
      endNode,
      builder: env.workflowEngine.builder
    };
  },

  /**
   * Create a test extension
   */
  async createTestExtension(name: string, type: string = 'custom') {
    const env = getTestEnvironment();
    
    const extensionDir = path.join(env.testDataDir, 'extensions', name);
    await fs.ensureDir(extensionDir);
    
    // Create manifest
    const manifest = {
      name: `@test/${name}`,
      version: '1.0.0',
      description: `Test extension: ${name}`,
      type,
      category: 'utility',
      main: 'index.js',
      author: 'Test Suite',
      keywords: ['test'],
      permissions: []
    };
    
    await fs.writeJson(path.join(extensionDir, 'extension.json'), manifest, { spaces: 2 });
    
    // Create main file
    const mainContent = `
class TestExtension {
  constructor(config) {
    this.config = config;
    this.name = '${name}';
  }

  async onLoad(context) {
    console.log('Test extension loaded:', this.name);
  }

  async execute(input) {
    return { processed: true, input, extension: this.name };
  }
}

module.exports = TestExtension;
`;
    
    await fs.writeFile(path.join(extensionDir, 'index.js'), mainContent);
    
    return {
      extensionDir,
      manifest,
      name: manifest.name
    };
  },

  /**
   * Wait for condition with timeout
   */
  async waitForCondition(
    condition: () => Promise<boolean> | boolean,
    timeoutMs: number = 10000,
    intervalMs: number = 100
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    
    throw new Error(`Condition not met within ${timeoutMs}ms`);
  },

  /**
   * Generate test data
   */
  generateTestData(size: number = 100): any[] {
    return Array.from({ length: size }, (_, i) => ({
      id: i,
      value: Math.random() * 1000,
      category: ['A', 'B', 'C'][i % 3],
      timestamp: new Date(Date.now() - i * 1000)
    }));
  }
};