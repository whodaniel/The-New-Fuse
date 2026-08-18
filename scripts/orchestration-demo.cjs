#!/usr/bin/env node

/**
 * Orchestration Demo - Coordinator + Broker + Workers
 *
 * Demonstrates multi-agent coordination with orthogonal role/platform axes:
 * 1. Antigravity (platform=antigravity, role=worker) - coordination capabilities
 * 2. Claude (platform=claude, role=broker) - timing / turn-taking
 * 3. Gemini (platform=gemini, role=worker) - analysis
 * 4. Jules (platform=jules, role=worker) - implementation
 *
 * The DACC baton (ORCHESTRATOR-{ts}) is held by master-clock, not by any
 * demo agent below.
 *
 * Usage:
 *   node orchestration-demo.cjs
 */

const { RedisAgentClient } = require('./tnf-agent-cli.cjs');

// ============================================================================
// AGENT CONFIGURATIONS
// ============================================================================

const AGENTS = {
  coordinator: {
    name: 'antigravity',
    role: 'worker',
    platform: 'antigravity',
    capabilities: ['orchestration', 'planning', 'delegation', 'coordination'],
  },
  broker: {
    name: 'claude',
    role: 'broker',
    platform: 'claude',
    capabilities: ['timing_control', 'turn_management', 'conflict_resolution'],
  },
  analyst: {
    name: 'gemini',
    role: 'worker',
    platform: 'gemini',
    capabilities: ['code_analysis', 'research', 'review'],
  },
  implementer: {
    name: 'jules',
    role: 'worker',
    platform: 'jules',
    capabilities: ['implementation', 'refactoring', 'batch_processing'],
  },
};

// ============================================================================
// WORKFLOW DEFINITION
// ============================================================================

const DEMO_WORKFLOW = {
  name: 'Code Review & Improvement',
  description: 'Multi-agent workflow to analyze and improve code',
  steps: [
    {
      id: 'step1',
      type: 'analysis',
      assignee: 'gemini',
      instruction:
        'Analyze the codebase for TypeScript errors and code quality issues. Report findings.',
      expectedDuration: 30000, // 30 seconds
    },
    {
      id: 'step2',
      type: 'review',
      assignee: 'claude',
      instruction: 'Review the analysis findings and prioritize the issues by severity.',
      expectedDuration: 20000, // 20 seconds
      dependsOn: ['step1'],
    },
    {
      id: 'step3',
      type: 'implementation',
      assignee: 'jules',
      instruction: 'Implement fixes for the top 3 priority issues identified.',
      expectedDuration: 60000, // 60 seconds (async)
      dependsOn: ['step2'],
    },
    {
      id: 'step4',
      type: 'verification',
      assignee: 'gemini',
      instruction:
        'Verify that the implemented fixes resolve the issues without introducing new problems.',
      expectedDuration: 20000,
      dependsOn: ['step3'],
    },
  ],
};

// ============================================================================
// ORCHESTRATOR CLASS
// ============================================================================

class MultiAgentOrchestrator {
  constructor() {
    this.agents = new Map();
    this.workflow = null;
    this.stepResults = new Map();
    this.currentStep = null;
  }

  /**
   * Initialize all agents
   */
  async initialize() {
    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║        TNF Multi-Agent Orchestration Demo                         ║
║                                                                   ║
║  Roles (role ⊥ platform; baton = master-clock):                   ║
║  👑 Antigravity - worker + coordination caps (assigns tasks)      ║
║  🎯 Claude - broker seat (manages timing)                         ║
║  ⚙️  Gemini - worker (analysis)                                    ║
║  ⚙️  Jules - worker (implementation)                               ║
╚═══════════════════════════════════════════════════════════════════╝
`);

    // Create and register all agents
    for (const [key, config] of Object.entries(AGENTS)) {
      const client = new RedisAgentClient();
      await client.initialize();
      await client.register(config.name, config.role, config.platform, config.capabilities);
      this.agents.set(key, { client, config });

      // Set up message handlers
      this.setupAgentHandlers(key, client);
    }

    console.log('\n✅ All agents registered and connected!\n');
  }

  /**
   * Set up message handlers for each agent
   */
  setupAgentHandlers(agentKey, client) {
    // Handle incoming commands (for workers)
    client.onMessage('command', async (msg) => {
      console.log(
        `\n📋 [${AGENTS[agentKey].name}] Received command: ${msg.content.substring(0, 50)}...`
      );

      // Simulate processing
      await this.simulateAgentWork(agentKey, msg);
    });

    // Handle incoming messages
    client.onMessage('message', async (msg) => {
      if (msg.from.agentName !== AGENTS[agentKey].name) {
        console.log(`\n💬 [${AGENTS[agentKey].name}] Heard: ${msg.content.substring(0, 50)}...`);
      }
    });
  }

  /**
   * Simulate agent work (in real scenario, this would call actual AI)
   */
  async simulateAgentWork(agentKey, msg) {
    const agent = this.agents.get(agentKey);
    const config = agent.config;

    // Simulate work with delay
    const delay = 2000 + Math.random() * 3000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Generate simulated response based on agent type
    let response;
    switch (config.platform) {
      case 'gemini':
        response = `[Gemini Analysis Complete] Found 5 TypeScript errors and 12 code quality issues. Key findings: 3 missing type annotations, 2 unused imports, potential null reference at line 42.`;
        break;
      case 'claude':
        response = `[Claude Review Complete] Prioritized issues: 1) Null reference (High), 2) Missing types (Medium), 3) Unused imports (Low). Recommend fixing in this order.`;
        break;
      case 'jules':
        response = `[Jules Implementation Complete] Created PR #42 with fixes for: null reference check added, 3 type annotations added. Ready for review.`;
        break;
      default:
        response = `[${config.name}] Task completed.`;
    }

    // Send response
    await agent.client.send(response, {
      replyTo: msg.id,
      type: 'response',
    });

    // Store result
    this.stepResults.set(this.currentStep?.id, response);
  }

  /**
   * Run the workflow
   */
  async runWorkflow(workflow) {
    this.workflow = workflow;
    const coordinator = this.agents.get('coordinator');
    const broker = this.agents.get('broker');

    console.log(`\n🚀 Starting Workflow: "${workflow.name}"\n`);
    console.log('─'.repeat(60));

    // Start a conversation
    await coordinator.client.startConversation(`workflow-${Date.now()}`);

    // Coordinator announces the workflow
    await coordinator.client.send(
      `Starting workflow: ${workflow.name}. ${workflow.description}. Total steps: ${workflow.steps.length}`,
      { type: 'message' }
    );

    // Execute each step
    for (const step of workflow.steps) {
      this.currentStep = step;

      console.log(`\n📍 Step ${step.id}: ${step.type}`);
      console.log(`   Assignee: ${step.assignee}`);
      console.log(`   Instruction: ${step.instruction.substring(0, 50)}...`);

      // Broker announces turn
      await broker.client.send(
        `🎯 [Broker] It's ${step.assignee}'s turn. Step: ${step.id} (${step.type})`,
        { type: 'message' }
      );

      // Coordinator assigns task
      await coordinator.client.command(step.assignee, step.instruction, {
        stepId: step.id,
        stepType: step.type,
      });

      // Wait for step to complete (simulated)
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Check for result
      const result = this.stepResults.get(step.id);
      if (result) {
        console.log(`\n✅ Step ${step.id} completed!`);
        console.log(`   Result: ${result.substring(0, 60)}...`);

        // Broker confirms completion
        await broker.client.send(
          `✓ Step ${step.id} completed by ${step.assignee}. Moving to next step.`,
          { type: 'message' }
        );
      }
    }

    // Workflow complete
    console.log('\n' + '═'.repeat(60));
    console.log('🎉 WORKFLOW COMPLETE!');
    console.log('═'.repeat(60));

    // Coordinator announces completion
    await coordinator.client.send(
      `✨ Workflow "${workflow.name}" completed successfully! All ${workflow.steps.length} steps finished.`,
      { type: 'message' }
    );

    // Summary
    console.log('\n📊 Results Summary:');
    for (const [stepId, result] of this.stepResults.entries()) {
      console.log(`   ${stepId}: ${result.substring(0, 50)}...`);
    }
  }

  /**
   * Cleanup all agents
   */
  async cleanup() {
    console.log('\n🧹 Cleaning up agents...');
    for (const [key, agent] of this.agents) {
      await agent.client.cleanup();
    }
    console.log('✅ All agents disconnected');
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const orchestrator = new MultiAgentOrchestrator();

  try {
    await orchestrator.initialize();

    // Wait a moment for all agents to be ready
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Run the demo workflow
    await orchestrator.runWorkflow(DEMO_WORKFLOW);

    // Cleanup
    await orchestrator.cleanup();

    console.log('\n👋 Demo complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error running demo:', error);
    await orchestrator.cleanup();
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { MultiAgentOrchestrator, DEMO_WORKFLOW, AGENTS };
