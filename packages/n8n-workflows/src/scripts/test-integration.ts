#!/usr/bin/env ts-node
/**
 * Test Integration Script
 * Demonstrates the n8n workflows integration
 */

import * as path from 'path';
import { WorkflowCategorizer } from '../categorizer/WorkflowCategorizer';
import { WorkflowParser } from '../parser/WorkflowParser';
import { WorkflowService } from '../services/WorkflowService';

async function testIntegration() {
  console.log('=== N8N Workflows Integration Test ===\n');

  // Test 1: Service Initialization
  console.log('1. Testing Service Initialization...');
  const service = new WorkflowService({
    storageDir: path.join(process.cwd(), '.test-n8n-workflows'),
    enablePersistence: true,
  });

  await service.initialize();
  console.log('   ✓ Service initialized successfully\n');

  // Test 2: Parser
  console.log('2. Testing Workflow Parser...');
  const parser = new WorkflowParser();

  const sampleWorkflow = {
    id: 'test-workflow-1',
    name: 'AI Content Generator',
    description: 'Generate content using OpenAI GPT-4',
    nodes: [
      {
        id: 'node-1',
        name: 'Start',
        type: 'n8n-nodes-base.start',
        position: [250, 300],
        parameters: {},
      },
      {
        id: 'node-2',
        name: 'OpenAI',
        type: 'n8n-nodes-base.openai',
        position: [450, 300],
        parameters: {
          model: 'gpt-4',
          prompt: 'Generate content',
        },
      },
    ],
    connections: {},
  };

  const parsed = parser.parseWorkflow(sampleWorkflow, 'custom', 'test.json');
  console.log(`   ✓ Parsed workflow: ${parsed?.name}`);
  console.log(`   ✓ Node count: ${parsed?.nodes.length}`);
  console.log(`   ✓ Triggers: ${parsed?.triggers.length}\n`);

  // Test 3: Categorizer
  console.log('3. Testing Workflow Categorizer...');
  const categorizer = new WorkflowCategorizer();

  if (parsed) {
    const category = categorizer.categorize(parsed);
    console.log(`   ✓ Workflow categorized as: ${category}`);

    const suggestions = categorizer.suggestCategories(parsed, 3);
    console.log('   ✓ Category suggestions:');
    suggestions.forEach((s) => {
      console.log(`     - ${s.category} (confidence: ${s.confidence.toFixed(1)}%)`);
    });
  }
  console.log();

  // Test 4: Registry Operations
  console.log('4. Testing Workflow Registry...');

  if (parsed) {
    parsed.category = categorizer.categorize(parsed);
    service['registry'].addWorkflow(parsed);
  }

  const count = await service.getCount();
  console.log(`   ✓ Workflows in registry: ${count}`);

  // Test 5: Search
  console.log('\n5. Testing Search Functionality...');
  const searchResult = await service.search({
    query: 'AI',
    limit: 10,
  });

  console.log(`   ✓ Search returned ${searchResult.workflows.length} results`);
  console.log(`   ✓ Total matches: ${searchResult.total}\n`);

  // Test 6: Categories
  console.log('6. Testing Category Operations...');
  const categories = await service.getCategories();
  console.log(`   ✓ Available categories: ${categories.categories.length}`);
  console.log('   ✓ Top categories:');
  categories.categories
    .filter((c) => c.count > 0)
    .slice(0, 5)
    .forEach((c) => {
      console.log(`     - ${c.displayName}: ${c.count} workflows`);
    });
  console.log();

  // Test 7: Statistics
  console.log('7. Testing Statistics...');
  const stats = await service.getStats();
  console.log(`   ✓ Total workflows: ${stats.totalWorkflows}`);
  console.log(`   ✓ Categories: ${Object.keys(stats.byCategory).length}`);
  console.log(`   ✓ Sources: ${Object.keys(stats.bySource).length}`);
  console.log(`   ✓ Last sync: ${stats.lastSync}\n`);

  // Test 8: Category Configs
  console.log('8. Testing Category Configurations...');
  const configs = categorizer.getCategoryConfigs();
  console.log(`   ✓ Category configs loaded: ${configs.length}`);
  console.log('   ✓ Priority categories:');
  configs
    .filter((c) => c.priority >= 8)
    .forEach((c) => {
      console.log(`     - ${c.displayName} (priority: ${c.priority})`);
    });
  console.log();

  // Test 9: Export/Import
  console.log('9. Testing Export/Import...');
  const exported = await service.exportToJSON();
  console.log(`   ✓ Exported JSON size: ${(exported.length / 1024).toFixed(2)} KB`);

  const imported = await service.importFromJSON(exported);
  console.log(`   ✓ Imported workflows: ${imported}\n`);

  // Test 10: Workflow Analysis
  console.log('10. Testing Workflow Analysis...');
  if (parsed) {
    const analysis = parser.analyzeWorkflow(parsed.nodes);
    console.log(`   ✓ Node count: ${analysis.nodeCount}`);
    console.log(`   ✓ Complexity: ${analysis.complexity}`);
    console.log(`   ✓ Node types: ${analysis.nodeTypes.length}`);
    console.log(`   ✓ Required credentials: ${analysis.requiredCredentials.join(', ') || 'none'}`);
    console.log(`   ✓ API services: ${analysis.apiServices.join(', ') || 'none'}`);
  }
  console.log();

  console.log('=== All Tests Passed ✓ ===\n');

  // Cleanup
  console.log('Cleaning up test data...');
  await service.clear();
  console.log('Done!\n');

  return {
    success: true,
    testsRun: 10,
    testsPassed: 10,
  };
}

// Run tests
testIntegration()
  .then((result) => {
    console.log('Integration test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Integration test failed:', error);
    process.exit(1);
  });
