#!/usr/bin/env node

/**
 * Antigravity (Orchestrator) Redis Wrapper
 *
 * Antigravity acts as the ORCHESTRATOR in the TNF agent network.
 * This wrapper:
 * 1. Coordinates tasks between agents
 * 2. Manages workflow execution
 * 3. Routes messages between specialists
 * 4. Collects and aggregates results
 *
 * Usage:
 *   node antigravity-redis-wrapper.cjs
 */

const { RedisAgentClient } = require('./tnf-agent-cli.cjs');
const readline = require('readline');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  agentName: process.env.AGENT_NAME || 'antigravity',
  agentRole: process.env.AGENT_ROLE || 'orchestrator',
  platform: 'antigravity',
  taskTimeout: 300000, // 5 minutes max per task
};

// ============================================================================
// WORKFLOW DEFINITIONS
// ============================================================================

const WORKFLOWS = {
  'code-review': {
    name: 'Code Review Workflow',
    description: 'Comprehensive code review using multiple AI agents',
    steps: [
      { agent: 'claude', task: 'Perform high-level architecture review', role: 'broker' },
      { agent: 'gemini', task: 'Analyze code for bugs and issues', role: 'worker' },
      { agent: 'jules', task: 'Implement suggested fixes', role: 'worker' },
    ],
  },
  'feature-implementation': {
    name: 'Feature Implementation Workflow',
    description: 'Multi-agent feature development',
    steps: [
      { agent: 'claude', task: 'Design feature architecture', role: 'broker' },
      { agent: 'gemini', task: 'Write unit tests', role: 'worker' },
      { agent: 'jules', task: 'Implement feature code', role: 'worker' },
      { agent: 'claude', task: 'Review implementation', role: 'broker' },
    ],
  },
  'codebase-analysis': {
    name: 'Codebase Analysis Workflow',
    description: 'Deep analysis of codebase structure and quality',
    steps: [
      { agent: 'gemini', task: 'Analyze file structure and dependencies', role: 'worker' },
      { agent: 'claude', task: 'Identify architectural patterns', role: 'broker' },
      { agent: 'gemini', task: 'Calculate metrics and generate report', role: 'worker' },
    ],
  },
  documentation: {
    name: 'Documentation Generation Workflow',
    description: 'Generate comprehensive documentation',
    steps: [
      { agent: 'gemini', task: 'Extract code structure and exports', role: 'worker' },
      { agent: 'claude', task: 'Write documentation prose', role: 'broker' },
      { agent: 'jules', task: 'Add documentation to codebase', role: 'worker' },
    ],
  },
};

// ============================================================================
// ORCHESTRATOR IMPLEMENTATION
// ============================================================================

class AntigravityOrchestrator {
  constructor() {
    this.client = new RedisAgentClient();
    this.isRunning = false;
    this.activeWorkflows = new Map();
    this.agentResponses = new Map();
    this.pendingTasks = new Map();
    this.providerFailoverMap = new Map();

    // Pre-populate failover map based on environment omission
    const providerChain = process.env.MODEL_WATCHDOG_PROVIDER_CHAIN || 'claude,gemini,pi';
    if (!providerChain.includes('claude')) {
      console.log(`\\n⚠️ [PREFLIGHT ALERT] 'claude' is omitted from provider chain. Pre-emptively mapping 'claude' to 'gemini'.`);
      this.providerFailoverMap.set('claude', 'gemini');
    }
  }

  /**
   * Start the orchestrator
   */
  async start() {
    console.log(`
╔═══════════════════════════════════════════════════╗
║           Antigravity - The Orchestrator          ║
║             ( Coordinating AI Agents )            ║
╚═══════════════════════════════════════════════════╝
`);

    try {
      // Initialize Redis connection
      await this.client.initialize();

      // Register as orchestrator
      await this.client.register(CONFIG.agentName, CONFIG.agentRole, CONFIG.platform, [
        'orchestration',
        'workflow_management',
        'task_routing',
        'result_aggregation',
        'agent_coordination',
      ]);

      // Set up message handlers
      this.setupHandlers();

      this.isRunning = true;
      console.log('\n🎯 Antigravity Orchestrator is ready!');
      console.log('\nAvailable workflows:');
      Object.entries(WORKFLOWS).forEach(([id, wf]) => {
        console.log(`  - ${id}: ${wf.name}`);
      });
      console.log('\nType a workflow ID to start, or "help" for more options.\n');

      // Keep running
      await this.waitForShutdown();
    } catch (error) {
      console.error('Failed to start Antigravity:', error.message);
      await this.stop();
      process.exit(1);
    }
  }

  /**
   * Set up message handlers
   */
  setupHandlers() {
    // Handle responses from agents
    this.client.onMessage('response', async (msg) => {
      console.log(`\n📨 Response from ${msg.from.agentName}:`);
      console.log(`   ${msg.content.substring(0, 200)}...`);

      // Store response
      this.agentResponses.set(msg.id, {
        from: msg.from.agentName,
        content: msg.content,
        timestamp: new Date().toISOString(),
      });

      // Check if this completes a pending task
      if (msg.metadata?.replyTo) {
        const pending = this.pendingTasks.get(msg.metadata.replyTo);
        if (pending) {
          pending.resolve(msg);
          this.pendingTasks.delete(msg.metadata.replyTo);
        }
      }
    });

    // Handle workflow requests and commands
    this.client.onMessage('command', async (msg) => {
      if (msg.content.toLowerCase().startsWith('workflow:')) {
        const workflowId = msg.content.split(':')[1].trim();
        if (WORKFLOWS[workflowId]) {
          await this.executeWorkflow(workflowId, msg.metadata);
        } else {
          await this.client.send(
            `Unknown workflow: ${workflowId}. Available: ${Object.keys(WORKFLOWS).join(', ')}`,
            { replyTo: msg.id, type: 'response' }
          );
        }
      } else if (msg.metadata && msg.metadata.event === 'model_failover_recommended') {
        const { signal, recommendation } = msg.metadata;
        if (signal && recommendation && recommendation.fallbackProvider) {
          console.log(`\\n🚨 [FAILOVER ALERT] Orchestrator mapping provider '${signal.provider}' -> '${recommendation.fallbackProvider}' due to failure signal.`);
          this.providerFailoverMap.set(signal.provider, recommendation.fallbackProvider);
        } else if (signal) {
          console.log(`\\n🚨 [FAILOVER ALERT] Orchestrator marking provider '${signal.provider}' as FAILED with no fallback.`);
          this.providerFailoverMap.set(signal.provider, 'FAILED');
        }
      }
    });

    // Handle direct messages
    this.client.onMessage('message', async (msg) => {
      console.log(`\n📨 Message from ${msg.from.agentName}:`);
      console.log(`   ${msg.content}`);

      // Acknowledge receipt
      await this.client.send('Received. Antigravity is processing your request.', {
        replyTo: msg.id,
        type: 'acknowledgment',
      });
    });
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId, context = {}) {
    const workflow = WORKFLOWS[workflowId];
    if (!workflow) {
      console.error(`Unknown workflow: ${workflowId}`);
      return;
    }

    const executionId = `exec-${Date.now()}`;
    console.log(`\n🚀 Starting workflow: ${workflow.name}`);
    console.log(`   Execution ID: ${executionId}`);

    this.activeWorkflows.set(executionId, {
      workflowId,
      startTime: new Date().toISOString(),
      status: 'running',
      results: [],
    });

    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        console.log(`\n📋 Step ${i + 1}/${workflow.steps.length}: ${step.task}`);
        console.log(`   Assigning to: ${step.agent} (${step.role})`);

        // Send task to agent
        const result = await this.assignTask(step.agent, step.task, {
          workflowId,
          executionId,
          step: i + 1,
          totalSteps: workflow.steps.length,
          ...context,
        });

        // Store result
        this.activeWorkflows.get(executionId).results.push({
          step: i + 1,
          agent: step.agent,
          task: step.task,
          result: result?.content || 'No response',
        });

        console.log(`   ✅ Step ${i + 1} completed`);
      }

      this.activeWorkflows.get(executionId).status = 'completed';
      console.log(`\n🎉 Workflow "${workflow.name}" completed successfully!`);

      // Broadcast summary
      await this.client.send(
        `Workflow "${workflow.name}" completed.\n\n` + this.formatWorkflowResults(executionId),
        { type: 'workflow_complete', metadata: { executionId } }
      );

      return this.activeWorkflows.get(executionId);
    } catch (error) {
      console.error(`\n❌ Workflow failed: ${error.message}`);
      this.activeWorkflows.get(executionId).status = 'failed';
      this.activeWorkflows.get(executionId).error = error.message;
      return null;
    }
  }

  /**
   * Assign a task to a specific agent
   */
  async assignTask(agentName, task, metadata = {}) {
    let targetAgent = agentName;
    if (this.providerFailoverMap.has(agentName)) {
      const fallback = this.providerFailoverMap.get(agentName);
      if (fallback === 'FAILED') {
         console.warn(`⚠️ Cannot route task to ${agentName}: Provider is marked as FAILED with no fallback. Aborting step.`);
         return { content: `[${agentName} failed - no fallback available]` };
      }
      console.log(`🔀 Routing task originally for ${agentName} to fallback provider ${fallback}`);
      targetAgent = fallback;
    }

    return new Promise((resolve, reject) => {
      const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Set up timeout
      const timeout = setTimeout(() => {
        this.pendingTasks.delete(taskId);
        resolve({ content: `[${targetAgent} timed out]` });
      }, CONFIG.taskTimeout);

      // Store pending task
      this.pendingTasks.set(taskId, {
        resolve: (result) => {
          clearTimeout(timeout);
          resolve(result);
        },
        reject,
        agent: targetAgent,
        task,
      });

      // Send task
      this.client.send(`[Task from Antigravity]\n\n${task}`, {
        type: 'task',
        to: targetAgent,
        metadata: { taskId, originalAgent: agentName, ...metadata },
      });
    });
  }

  /**
   * Format workflow results for display
   */
  formatWorkflowResults(executionId) {
    const workflow = this.activeWorkflows.get(executionId);
    if (!workflow) return 'No results found';

    let output = `Execution: ${executionId}\n`;
    output += `Status: ${workflow.status}\n\n`;

    for (const result of workflow.results) {
      output += `Step ${result.step}: ${result.agent}\n`;
      output += `Task: ${result.task}\n`;
      output += `Result:\n${result.result.substring(0, 500)}...\n\n`;
    }

    return output;
  }

  /**
   * Handle local commands
   */
  async handleLocalCommand(input) {
    const trimmed = input.trim().toLowerCase();

    if (trimmed === 'help') {
      console.log(`
Available Commands:
  <workflow-id>  - Start a workflow (see list below)
  status         - Show active workflows
  agents         - List connected agents
  help           - Show this help

Available Workflows:
${Object.entries(WORKFLOWS)
  .map(([id, wf]) => `  ${id.padEnd(20)} - ${wf.description}`)
  .join('\n')}
`);
    } else if (trimmed === 'status') {
      console.log('\nActive Workflows:');
      if (this.activeWorkflows.size === 0) {
        console.log('  No active workflows');
      } else {
        this.activeWorkflows.forEach((wf, id) => {
          console.log(`  ${id}: ${wf.status}`);
        });
      }
    } else if (trimmed === 'agents') {
      const agents = await this.client.listAgents();
      console.log('\nConnected Agents:');
      agents.forEach((agent) => {
        console.log(`  ${agent.name} (${agent.role}) - ${agent.platform}`);
      });
    } else if (WORKFLOWS[trimmed]) {
      await this.executeWorkflow(trimmed);
    } else if (trimmed) {
      // Broadcast as general message
      await this.client.send(input.trim());
      console.log('Message broadcasted to all agents');
    }
  }

  /**
   * Wait for shutdown signal
   */
  async waitForShutdown() {
    return new Promise((resolve) => {
      // Handle Ctrl+C
      process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down...');
        await this.stop();
        resolve();
      });

      // Handle terminal input
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: 'antigravity> ',
      });

      rl.prompt();

      rl.on('line', async (line) => {
        await this.handleLocalCommand(line);
        rl.prompt();
      });
    });
  }

  /**
   * Stop the orchestrator
   */
  async stop() {
    this.isRunning = false;
    await this.client.cleanup();
    console.log('👋 Antigravity orchestrator stopped');
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const orchestrator = new AntigravityOrchestrator();
  await orchestrator.start();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { AntigravityOrchestrator, WORKFLOWS };
