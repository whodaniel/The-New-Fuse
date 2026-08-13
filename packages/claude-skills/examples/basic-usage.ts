/**
 * Basic Usage Examples for Claude Skills
 */

import {
  ClaudeSkillsManager,
  SkillCategory,
  SkillExecutionContext,
} from '../src/index.js';

async function main() {
  console.log('=== Claude Skills Integration - Basic Usage ===\n');

  // 1. Create and initialize manager
  console.log('1. Initializing Claude Skills Manager...');
  const manager = new ClaudeSkillsManager({
    loader: {
      localCachePath: '.cache/anthropic-skills',
      autoUpdate: false,
    },
    prioritySkills: ['mcp-builder', 'pdf', 'xlsx', 'webapp-testing'],
  });

  // Initialize (this clones the repo and loads skills)
  const initResult = await manager.initialize();
  console.log(`   ✓ Initialized: ${initResult.imported} skills loaded`);
  console.log(`   ✓ Failed: ${initResult.failed}`);
  console.log(`   ✓ Skipped: ${initResult.skipped}\n`);

  // 2. List all loaded skills
  console.log('2. Listing all loaded skills...');
  const allSkills = await manager.listSkills();
  console.log(`   ✓ Total skills: ${allSkills.length}`);
  for (const skill of allSkills.slice(0, 5)) {
    console.log(`   - ${skill.name} (${skill.category})`);
  }
  console.log(`   ... and ${allSkills.length - 5} more\n`);

  // 3. Search for skills
  console.log('3. Searching for PDF-related skills...');
  const pdfSkills = await manager.searchSkills('pdf');
  console.log(`   ✓ Found ${pdfSkills.length} skills`);
  for (const skill of pdfSkills) {
    console.log(`   - ${skill.name}: ${skill.description.substring(0, 60)}...`);
  }
  console.log();

  // 4. Get skills by category
  console.log('4. Getting document processing skills...');
  const docSkills = await manager.getSkillsByCategory(
    SkillCategory.DOCUMENT_PROCESSING
  );
  console.log(`   ✓ Found ${docSkills.length} document skills`);
  for (const skill of docSkills) {
    console.log(`   - ${skill.name}`);
  }
  console.log();

  // 5. Get a specific skill
  console.log('5. Getting PDF skill details...');
  const pdfSkill = await manager.getSkill('anthropic.skill.pdf');
  if (pdfSkill) {
    console.log(`   ✓ Skill: ${pdfSkill.name}`);
    console.log(`   ✓ Description: ${pdfSkill.description.substring(0, 80)}...`);
    console.log(`   ✓ Category: ${pdfSkill.category}`);
    console.log(`   ✓ Tags: ${pdfSkill.tags.join(', ')}`);
    console.log(`   ✓ Instructions length: ${pdfSkill.instructions.length} chars`);
  }
  console.log();

  // 6. Execute a skill
  console.log('6. Executing MCP Builder skill...');
  const context: SkillExecutionContext = {
    skillId: 'anthropic.skill.mcp-builder',
    parameters: {
      task: 'Create a GitHub integration MCP server',
      language: 'typescript',
    },
    userId: 'example-user',
    sessionId: 'example-session',
  };

  const result = await manager.executeSkill(context);
  if (result.success) {
    console.log('   ✓ Execution successful');
    console.log(`   ✓ Execution time: ${result.metadata?.executionTime}ms`);
    console.log('   ✓ Output includes instructions and skill content');
  } else {
    console.log('   ✗ Execution failed:', result.error?.message);
  }
  console.log();

  // 7. Get statistics
  console.log('7. Getting statistics...');
  const stats = manager.getStatistics();
  console.log(`   ✓ Total skills: ${stats.registry.totalSkills}`);
  console.log(`   ✓ Categories: ${stats.registry.categoriesCount}`);
  console.log(`   ✓ Tags: ${stats.registry.tagsCount}`);
  console.log('   ✓ Skills by category:');
  for (const [category, count] of Object.entries(stats.registry.skillsByCategory)) {
    console.log(`      - ${category}: ${count}`);
  }
  console.log();

  // 8. MCP Integration
  console.log('8. MCP Integration...');
  const mcpProvider = manager.getMCPProvider();

  const resources = await mcpProvider.getSkillResources();
  console.log(`   ✓ MCP Resources: ${resources.length}`);

  const tools = await mcpProvider.getSkillTools();
  console.log(`   ✓ MCP Tools: ${tools.length}`);

  const categories = await mcpProvider.getCategories();
  console.log(`   ✓ Available categories: ${categories.join(', ')}`);

  const tags = await mcpProvider.getTags();
  console.log(`   ✓ Available tags (first 10): ${tags.slice(0, 10).join(', ')}`);
  console.log();

  // 9. Search with MCP Provider
  console.log('9. Searching via MCP Provider...');
  const searchResults = await mcpProvider.searchSkills('document');
  console.log(`   ✓ Found ${searchResults.length} skills matching 'document'`);
  for (const result of searchResults.slice(0, 3)) {
    console.log(`   - ${result.name} (relevance: ${result.relevance})`);
  }
  console.log();

  // 10. Get available skill names from repository
  console.log('10. Available skills in repository...');
  const availableSkills = await manager.getAvailableSkillNames();
  console.log(`   ✓ Total available: ${availableSkills.length}`);
  console.log(`   ✓ Skills: ${availableSkills.slice(0, 10).join(', ')}`);
  console.log(`   ... and ${availableSkills.length - 10} more\n`);

  // Cleanup
  console.log('=== Cleanup ===');
  await manager.cleanup();
  console.log('✓ Manager cleaned up\n');

  console.log('=== Example Complete ===');
}

// Run the example
main().catch((error) => {
  console.error('Error running example:', error);
  process.exit(1);
});
