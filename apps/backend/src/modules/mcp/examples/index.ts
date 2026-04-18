/**
 * MCP Examples Index
 *
 * Export all example agents and coordination patterns
 */

export { CoordinatorAgent, runCoordinatorExample } from './coordinator-agent.js';
export { DataProcessingAgent, runDataProcessingExample } from './data-processing-agent.js';
export { APIIntegrationAgent, runAPIIntegrationExample } from './api-integration-agent.js';
export {
  runMultiAgentCoordination,
  AdvancedCoordinationPatterns,
} from './multi-agent-coordination.js';

/**
 * Run all examples sequentially
 */
export async function runAllExamples(): Promise<void> {
  console.log('=== Running All MCP Examples ===\n');

  try {
    console.log('1. Running Coordinator Example...');
    const { runCoordinatorExample } = await import('./coordinator-agent');
    await runCoordinatorExample();
    console.log('✓ Coordinator Example completed\n');

    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log('2. Running Data Processing Example...');
    const { runDataProcessingExample } = await import('./data-processing-agent');
    await runDataProcessingExample();
    console.log('✓ Data Processing Example completed\n');

    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log('3. Running API Integration Example...');
    const { runAPIIntegrationExample } = await import('./api-integration-agent');
    await runAPIIntegrationExample();
    console.log('✓ API Integration Example completed\n');

    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log('4. Running Multi-Agent Coordination Example...');
    const { runMultiAgentCoordination } = await import('./multi-agent-coordination');
    await runMultiAgentCoordination();
    console.log('✓ Multi-Agent Coordination Example completed\n');

    console.log('=== All Examples Completed Successfully ===');
  } catch (error) {
    console.error('Example failed:', error);
    throw error;
  }
}

/**
 * Main entry point
 */
if (require.main === module) {
  runAllExamples()
    .then(() => {
      console.log('\n✓ All examples completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Examples failed:', error);
      process.exit(1);
    });
}
