/**
 * MCP Server Integration Example
 */

import { ClaudeSkillsManager } from '../src/index.js';

/**
 * Mock MCP Server for demonstration
 */
class MockMCPServer {
  private resources: Map<string, any> = new Map();
  private tools: Map<string, any> = new Map();

  registerResource(resource: any) {
    this.resources.set(resource.uri, resource);
    console.log(`   ✓ Registered resource: ${resource.name}`);
  }

  registerTool(tool: any) {
    this.tools.set(tool.name, tool);
    console.log(`   ✓ Registered tool: ${tool.name}`);
  }

  getResourcesCount() {
    return this.resources.size;
  }

  getToolsCount() {
    return this.tools.size;
  }

  listResources() {
    return Array.from(this.resources.values());
  }

  listTools() {
    return Array.from(this.tools.values());
  }
}

async function main() {
  console.log('=== MCP Server Integration Example ===\n');

  // 1. Initialize Claude Skills Manager
  console.log('1. Initializing Claude Skills Manager...');
  const manager = new ClaudeSkillsManager({
    prioritySkills: ['pdf', 'xlsx', 'mcp-builder', 'webapp-testing'],
  });

  await manager.initialize();
  console.log('   ✓ Manager initialized\n');

  // 2. Create mock MCP server
  console.log('2. Creating MCP Server...');
  const mcpServer = new MockMCPServer();
  console.log('   ✓ MCP Server created\n');

  // 3. Get MCP provider
  console.log('3. Getting MCP Provider...');
  const mcpProvider = manager.getMCPProvider();
  console.log('   ✓ MCP Provider ready\n');

  // 4. Register all skills as MCP resources
  console.log('4. Registering skills as MCP resources...');
  const resources = await mcpProvider.getSkillResources();
  for (const resource of resources) {
    mcpServer.registerResource(resource);
  }
  console.log(`   ✓ Registered ${mcpServer.getResourcesCount()} resources\n`);

  // 5. Register all skills as MCP tools
  console.log('5. Registering skills as MCP tools...');
  const tools = await mcpProvider.getSkillTools();
  for (const tool of tools) {
    mcpServer.registerTool({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      handler: async (params: any) => {
        return await mcpProvider.executeSkillTool(tool.name, params);
      },
    });
  }
  console.log(`   ✓ Registered ${mcpServer.getToolsCount()} tools\n`);

  // 6. Test resource access
  console.log('6. Testing resource access...');
  const pdfContent = await mcpProvider.getSkillContent('skill://anthropic.skill.pdf');
  if (pdfContent) {
    console.log('   ✓ Retrieved PDF skill content');
    console.log(`   ✓ Content length: ${pdfContent.length} chars`);
    console.log(`   ✓ First 100 chars: ${pdfContent.substring(0, 100)}...`);
  }
  console.log();

  // 7. Test tool execution
  console.log('7. Testing tool execution...');
  try {
    const result = await mcpProvider.executeSkillTool('skill_mcp_builder', {
      task: 'Create a GitHub MCP server',
      language: 'typescript',
    });
    console.log('   ✓ Tool executed successfully');
    console.log(`   ✓ Skill: ${result.skillName}`);
    console.log(`   ✓ Instructions available: ${result.instructions ? 'Yes' : 'No'}`);
  } catch (error) {
    console.log('   ✗ Tool execution failed:', error);
  }
  console.log();

  // 8. Test category-based resource listing
  console.log('8. Testing category-based resource listing...');
  const docResources = await mcpProvider.getSkillsByCategory('document-processing');
  console.log(`   ✓ Found ${docResources.length} document processing resources`);
  for (const resource of docResources) {
    console.log(`   - ${resource.name}`);
  }
  console.log();

  // 9. Test search functionality
  console.log('9. Testing search functionality...');
  const searchResults = await mcpProvider.searchSkills('testing');
  console.log(`   ✓ Found ${searchResults.length} skills matching 'testing'`);
  for (const result of searchResults) {
    console.log(`   - ${result.name} (relevance: ${result.relevance})`);
  }
  console.log();

  // 10. Display final statistics
  console.log('10. Final MCP Server Statistics...');
  console.log(`   ✓ Total resources: ${mcpServer.getResourcesCount()}`);
  console.log(`   ✓ Total tools: ${mcpServer.getToolsCount()}`);
  console.log(`   ✓ Categories: ${(await mcpProvider.getCategories()).length}`);
  console.log(`   ✓ Tags: ${(await mcpProvider.getTags()).length}`);
  console.log();

  // Cleanup
  console.log('=== Cleanup ===');
  await manager.cleanup();
  console.log('✓ Manager cleaned up\n');

  console.log('=== MCP Integration Example Complete ===');
}

// Run the example
main().catch((error) => {
  console.error('Error running example:', error);
  process.exit(1);
});
