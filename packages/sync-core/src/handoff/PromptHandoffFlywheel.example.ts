/**
 * Example Usage of Prompt Handoff Flywheel System
 *
 * Demonstrates how to use the flywheel system for seamless agent handoffs
 * with context preservation, load balancing, and analytics.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { ConflictManager } from '../services/ConflictManager';
import { MasterClockService } from '../services/MasterClockService';
import { SyncOrchestrator } from '../services/SyncOrchestrator';
import {
  EnhancedAgentHandoffTemplateService,
  PromptHandoffFlywheel,
  PromptTemplateIntegration,
} from './index';

/**
 * Example 1: Basic Handoff Setup and Execution
 */
async function basicHandoffExample() {
  console.log('=== Basic Handoff Example ===');

  // Initialize services (in real app, these would be injected)
  const syncOrchestrator = new SyncOrchestrator({} as any, {} as any, {} as any);
  const masterClock = new MasterClockService({} as any, {} as any);
  const conflictManager = new ConflictManager({} as any, {} as any);

  // Create flywheel instance
  const flywheel = new PromptHandoffFlywheel(syncOrchestrator, masterClock, conflictManager);

  // Create enhanced handoff service
  const handoffService = new EnhancedAgentHandoffTemplateService(
    flywheel,
    syncOrchestrator,
    masterClock
  );

  // Step 1: Register agents with their capabilities
  await flywheel.registerAgent('code-agent', ['coding', 'debugging', 'review']);
  await flywheel.registerAgent('analysis-agent', ['analysis', 'research', 'planning']);
  await flywheel.registerAgent('writing-agent', ['writing', 'documentation', 'communication']);

  console.log('✓ Registered 3 agents with different capabilities');

  // Step 2: Create a handoff template
  const templateId = await handoffService.createEnhancedHandoffTemplate({
    name: 'Code Review Handoff',
    description: 'Handoff template for code review workflow',
    version: '1.0.0',
    content: `# Code Review Handoff

## Previous Context
{{execution_history}}

## Current Task
Review the following code changes:
{{code_changes}}

## Review Criteria
- Code quality and best practices
- Security considerations
- Performance implications
- Documentation completeness

## Agent Context
Previous agent: {{source_agent}}
Review focus: {{review_focus}}

## Success Criteria
- All code reviewed thoroughly
- Issues documented with severity levels
- Recommendations provided for improvements
- Context preserved for next handoff

Please provide a comprehensive code review maintaining full context from previous analysis.`,
    variables: {
      code_changes: 'No code changes specified',
      review_focus: 'General review',
      source_agent: 'Unknown',
    },
    contextRequirements: ['code_changes', 'execution_history'],
    agentCapabilities: ['coding', 'review'],
    successCriteria: [
      'code_reviewed',
      'issues_documented',
      'recommendations_provided',
      'context_preserved',
    ],
    backpressureThreshold: 5,
    loadBalancingWeight: 1.0,
    integrationMetadata: {
      syncEnabled: true,
      conflictResolution: 'merge',
    },
  });

  console.log(`✓ Created handoff template: ${templateId}`);

  // Step 3: Initiate a handoff session
  const sessionId = await handoffService.initiateHandoffSession(
    'analysis-agent',
    templateId,
    {
      code_changes: `
        function calculateTotal(items) {
          let total = 0;
          for (let item of items) {
            total += item.price * item.quantity;
          }
          return total;
        }
      `,
      review_focus: 'Performance and error handling',
      source_agent: 'analysis-agent',
    },
    {
      preserveContext: true,
      memoryIntegration: true,
      targetAgentId: 'code-agent',
    }
  );

  console.log(`✓ Initiated handoff session: ${sessionId}`);

  // Step 4: Monitor session progress
  const session = await handoffService.getSession(sessionId);
  console.log(`✓ Session status: ${session?.status}`);
  console.log(`✓ Contexts created: ${session?.contexts.length}`);

  return { flywheel, handoffService, templateId, sessionId };
}

/**
 * Example 2: Advanced Load Balancing and Backpressure
 */
async function loadBalancingExample() {
  console.log('\n=== Load Balancing Example ===');

  const { flywheel, handoffService } = await basicHandoffExample();

  // Register additional agents with varying loads
  await flywheel.registerAgent('agent-1', ['general']);
  await flywheel.registerAgent('agent-2', ['general']);
  await flywheel.registerAgent('agent-3', ['general']);

  // Set different load levels
  await flywheel.updateAgentStatus('agent-1', 'available', 20); // Low load
  await flywheel.updateAgentStatus('agent-2', 'available', 80); // High load
  await flywheel.updateAgentStatus('agent-3', 'available', 45); // Medium load

  console.log('✓ Set different load levels for agents');

  // Create template with load balancing configuration
  const templateId = await handoffService.createEnhancedHandoffTemplate({
    name: 'Load Balanced Task',
    description: 'Template demonstrating load balancing',
    version: '1.0.0',
    content: 'Task: {{task_description}}\nAgent Load: {{agent_load}}',
    variables: {
      task_description: 'General task',
      agent_load: 'Unknown',
    },
    contextRequirements: ['task_description'],
    agentCapabilities: ['general'],
    successCriteria: ['task_completed'],
    backpressureThreshold: 3, // Low threshold for demonstration
    loadBalancingWeight: 2.0, // Higher weight for load consideration
    integrationMetadata: {
      syncEnabled: true,
      conflictResolution: 'latest',
    },
  });

  // Get optimal handoff target (should select agent-1 with lowest load)
  const optimalTarget = await handoffService.getOptimalHandoffTarget(
    templateId,
    { 'agent-1': 20, 'agent-2': 80, 'agent-3': 45 },
    {
      'agent-1': ['general'],
      'agent-2': ['general'],
      'agent-3': ['general'],
    }
  );

  console.log(`✓ Optimal target selected: ${optimalTarget} (should be agent-1)`);

  // Demonstrate backpressure by overloading an agent
  await flywheel.updateAgentStatus('agent-1', 'available', 95); // Overload agent-1

  const backpressureTarget = await handoffService.getOptimalHandoffTarget(
    templateId,
    { 'agent-1': 95, 'agent-2': 80, 'agent-3': 45 },
    {
      'agent-1': ['general'],
      'agent-2': ['general'],
      'agent-3': ['general'],
    }
  );

  console.log(`✓ Backpressure applied: ${backpressureTarget} (should be null or agent-3)`);
}

/**
 * Example 3: Template Integration with Existing Services
 */
async function templateIntegrationExample() {
  console.log('\n=== Template Integration Example ===');

  const { flywheel, handoffService } = await basicHandoffExample();

  // Mock existing prompt template service
  const mockPromptTemplateService = {
    createTemplate: async (template: any) => ({
      id: `base_${Date.now()}`,
      ...template,
      currentVersion: 'v1.0.0',
      versions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    getTemplate: async (id: string) => ({
      id,
      name: 'Base Template',
      content: 'Base template content',
      variables: { base_var: 'base_value' },
      updatedAt: new Date(),
    }),
    updateTemplate: async (id: string, updates: any) => ({ id, ...updates }),
    getTemplateAnalytics: async (id: string) => ({
      totalRuns: 50,
      successRate: 92.5,
      averageResponseTime: 1200,
    }),
    recordExecution: async (result: any) => {},
    createVersion: async (templateId: string, version: any) => ({
      id: `version_${Date.now()}`,
      ...version,
    }),
    setActiveVersion: async (templateId: string, versionId: string) => ({}),
  };

  // Create integration service
  const integration = new PromptTemplateIntegration(
    handoffService,
    flywheel,
    {} as any, // syncOrchestrator
    mockPromptTemplateService as any
  );

  // Create handoff template
  const templateId = await handoffService.createEnhancedHandoffTemplate({
    name: 'Integrated Template',
    description: 'Template with base service integration',
    version: '1.0.0',
    content: 'Integrated task: {{task}} with base data: {{base_data}}',
    variables: {
      task: 'integration test',
      base_data: 'from base service',
    },
    contextRequirements: ['task'],
    agentCapabilities: ['general'],
    successCriteria: ['integration_successful'],
    backpressureThreshold: 10,
    loadBalancingWeight: 1.0,
    integrationMetadata: {
      syncEnabled: true,
      conflictResolution: 'merge',
    },
  });

  console.log(`✓ Created handoff template: ${templateId}`);

  // Integrate with base template service
  await integration.integrateTemplate(templateId, {
    createBaseTemplate: true,
    autoSync: true,
    conflictResolution: 'merge',
  });

  console.log('✓ Integrated with base template service');

  // Execute via different methods
  const handoffResult = await integration.executeIntegratedTemplate(
    templateId,
    { task: 'handoff execution', base_data: 'handoff data' },
    { executionType: 'handoff', targetAgentId: 'code-agent' }
  );

  const directResult = await integration.executeIntegratedTemplate(
    templateId,
    { task: 'direct execution', base_data: 'direct data' },
    { executionType: 'direct' }
  );

  console.log(`✓ Handoff execution: ${handoffResult.success ? 'Success' : 'Failed'}`);
  console.log(`✓ Direct execution: ${directResult.success ? 'Success' : 'Failed'}`);

  // Get integrated analytics
  const analytics = await integration.getIntegratedAnalytics(templateId);
  console.log('✓ Analytics collected:');
  console.log(`  - Total executions: ${analytics.combinedMetrics.totalExecutions}`);
  console.log(`  - Handoff executions: ${analytics.combinedMetrics.handoffExecutions}`);
  console.log(`  - Direct executions: ${analytics.combinedMetrics.directExecutions}`);
}

/**
 * Example 4: Error Handling and Recovery
 */
async function errorHandlingExample() {
  console.log('\n=== Error Handling Example ===');

  const { flywheel, handoffService } = await basicHandoffExample();

  // Create template with retry configuration
  const templateId = await handoffService.createEnhancedHandoffTemplate({
    name: 'Error Recovery Template',
    description: 'Template demonstrating error handling',
    version: '1.0.0',
    content: 'Error-prone task: {{task}}',
    variables: { task: 'might fail' },
    contextRequirements: ['task'],
    agentCapabilities: ['general'],
    successCriteria: ['error_handled'],
    backpressureThreshold: 5,
    loadBalancingWeight: 1.0,
    integrationMetadata: {
      syncEnabled: true,
      conflictResolution: 'latest',
    },
  });

  // Register agents
  await flywheel.registerAgent('reliable-agent', ['general']);
  await flywheel.registerAgent('unreliable-agent', ['general']);

  // Simulate agent failure
  await flywheel.updateAgentStatus('unreliable-agent', 'error');

  console.log('✓ Simulated agent failure');

  // Start handoff session - should handle failure gracefully
  try {
    const sessionId = await handoffService.initiateHandoffSession(
      'reliable-agent',
      templateId,
      { task: 'recovery test' },
      { targetAgentId: 'unreliable-agent' }
    );

    console.log(`✓ Session created despite agent error: ${sessionId}`);

    // The system should either retry or reassign to another agent
    const session = await handoffService.getSession(sessionId);
    console.log(`✓ Session status: ${session?.status}`);
  } catch (error) {
    console.log(`✓ Error handled gracefully: ${error.message}`);
  }
}

/**
 * Example 5: Analytics and Reporting
 */
async function analyticsExample() {
  console.log('\n=== Analytics Example ===');

  const { flywheel, handoffService, templateId } = await basicHandoffExample();

  // Create multiple sessions to generate data
  const sessionIds = [];
  for (let i = 0; i < 3; i++) {
    const sessionId = await handoffService.initiateHandoffSession('analysis-agent', templateId, {
      code_changes: `function test${i}() { return ${i}; }`,
      review_focus: `Test function ${i}`,
      source_agent: 'analysis-agent',
    });
    sessionIds.push(sessionId);
  }

  console.log(`✓ Created ${sessionIds.length} sessions for analytics`);

  // Get template analytics
  const templateAnalytics = await handoffService.getTemplateAnalytics(templateId);
  console.log('✓ Template Analytics:');
  console.log(`  - Total executions: ${templateAnalytics?.totalExecutions || 0}`);
  console.log(`  - Success rate: ${templateAnalytics?.successRate || 0}%`);
  console.log(`  - Context preservation: ${templateAnalytics?.contextPreservationRate || 0}%`);

  // Get session metrics
  for (const sessionId of sessionIds) {
    const metrics = await handoffService.getSessionMetrics(sessionId);
    console.log(`✓ Session ${sessionId} metrics:`, {
      totalHandoffs: metrics?.totalHandoffs || 0,
      successfulHandoffs: metrics?.successfulHandoffs || 0,
      averageHandoffTime: metrics?.averageHandoffTime || 0,
      contextPreservationScore: metrics?.contextPreservationScore || 0,
    });
  }

  // Generate comprehensive report
  const report = await handoffService.generateHandoffReport(templateId, {
    start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
    end: new Date(),
  });

  console.log('✓ Generated handoff report:');
  console.log(`  - Template: ${report.template.name}`);
  console.log(`  - Sessions analyzed: ${report.sessions.length}`);
  console.log(`  - Recommendations: ${report.recommendations.length}`);
  report.recommendations.forEach((rec, index) => {
    console.log(`    ${index + 1}. ${rec}`);
  });
}

/**
 * Example 6: Real-time Monitoring and Events
 */
async function monitoringExample() {
  console.log('\n=== Monitoring Example ===');

  const { flywheel, handoffService } = await basicHandoffExample();

  // Set up event listeners for real-time monitoring
  flywheel.on('handoffInitiated', (context) => {
    console.log(`🚀 Handoff initiated: ${context.id} from ${context.sourceAgentId}`);
  });

  flywheel.on('handoffCompleted', (context, execution) => {
    console.log(`✅ Handoff completed: ${context.id} in ${execution.metrics.processingTime}ms`);
  });

  flywheel.on('handoffRetry', (context, error, delay) => {
    console.log(`🔄 Handoff retry: ${context.id} after ${delay}ms (${error.message})`);
  });

  flywheel.on('handoffEscalated', (context, error) => {
    console.log(`🚨 Handoff escalated: ${context.id} - ${error.message}`);
  });

  flywheel.on('backpressureApplied', (context, queue) => {
    console.log(`⚠️ Backpressure applied: ${context.id} on queue ${queue.id}`);
  });

  flywheel.on('agentRegistered', (capability) => {
    console.log(
      `👤 Agent registered: ${capability.agentId} with capabilities: ${capability.capabilities.join(', ')}`
    );
  });

  flywheel.on('agentStatusUpdated', (capability) => {
    console.log(
      `📊 Agent status updated: ${capability.agentId} - ${capability.status} (load: ${capability.currentLoad}%)`
    );
  });

  console.log('✓ Event listeners configured for real-time monitoring');

  // Trigger some events
  await flywheel.registerAgent('monitor-agent', ['monitoring']);
  await flywheel.updateAgentStatus('monitor-agent', 'busy', 75);

  console.log('✓ Monitoring example completed');
}

/**
 * Main example runner
 */
async function runAllExamples() {
  try {
    console.log('🎯 Prompt Handoff Flywheel Examples\n');

    await basicHandoffExample();
    await loadBalancingExample();
    await templateIntegrationExample();
    await errorHandlingExample();
    await analyticsExample();
    await monitoringExample();

    console.log('\n🎉 All examples completed successfully!');
    console.log('\nKey Features Demonstrated:');
    console.log('✓ Context preservation across handoffs');
    console.log('✓ Load balancing and backpressure management');
    console.log('✓ Template versioning and integration');
    console.log('✓ Error handling and recovery');
    console.log('✓ Comprehensive analytics and reporting');
    console.log('✓ Real-time monitoring and events');
  } catch (error) {
    console.error('❌ Example failed:', error);
  }
}

// Export for use in other modules
export {
  analyticsExample,
  basicHandoffExample,
  errorHandlingExample,
  loadBalancingExample,
  monitoringExample,
  runAllExamples,
  templateIntegrationExample,
};

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}
