/**
 * Gemini Browser Skill - Example Usage
 *
 * Demonstrates how to use the Gemini browser automation
 */

import { geminiBrowser, geminiBrowserMCP } from '../src/index.js';

async function exampleDirectUsage() {
  console.log('\n=== Direct Usage Example ===\n');

  // Initialize the browser
  console.log('Initializing Gemini browser...');
  const initialized = await geminiBrowser.initialize();

  if (!initialized) {
    console.error('Failed to initialize browser');
    return;
  }

  console.log('✓ Browser initialized\n');

  // Example 1: Simple prompt
  console.log('Example 1: Simple Prompt');
  const response1 = await geminiBrowser.prompt({
    prompt: 'What are the top 3 programming languages in 2024?',
  });

  if (response1.success) {
    console.log('Response:', response1.response);
  } else {
    console.error('Error:', response1.error);
  }

  // Example 2: Prompt with context URLs
  console.log('\nExample 2: Prompt with Context URLs');
  const response2 = await geminiBrowser.prompt({
    prompt: 'Summarize the main features of this product',
    contextUrls: ['https://github.com/features'],
  });

  if (response2.success) {
    console.log('Response:', response2.response);
  } else {
    console.error('Error:', response2.error);
  }

  // Example 3: Research across multiple sources
  console.log('\nExample 3: Multi-Source Research');
  const response3 = await geminiBrowser.prompt({
    prompt: 'Compare the AI capabilities mentioned on these pages',
    contextUrls: ['https://openai.com', 'https://anthropic.com', 'https://deepmind.google'],
    timeout: 60000, // Longer timeout for complex research
  });

  if (response3.success) {
    console.log('Response:', response3.response);
  } else {
    console.error('Error:', response3.error);
  }

  // Close the browser
  console.log('\nClosing browser...');
  await geminiBrowser.close();
  console.log('✓ Browser closed\n');
}

async function exampleMCPUsage() {
  console.log('\n=== MCP Server Usage Example ===\n');

  // Get available tools
  const tools = geminiBrowserMCP.getTools();
  console.log('Available tools:');
  tools.forEach((tool) => {
    console.log(`  - ${tool.name}: ${tool.description}`);
  });

  // Initialize via MCP
  console.log('\nInitializing via MCP...');
  const initResult = await geminiBrowserMCP.executeTool({
    name: 'gemini_browser_initialize',
    arguments: {},
  });
  console.log('Result:', initResult.content[0].text);

  // Check status
  console.log('\nChecking status...');
  const statusResult = await geminiBrowserMCP.executeTool({
    name: 'gemini_browser_status',
    arguments: {},
  });
  console.log('Status:', statusResult.content[0].text);

  // Send a prompt via MCP
  console.log('\nSending prompt via MCP...');
  const promptResult = await geminiBrowserMCP.executeTool({
    name: 'gemini_browser_prompt',
    arguments: {
      prompt: 'What is The New Fuse framework?',
      contextUrls: ['https://thenewfuse.com'],
    },
  });

  if (!promptResult.isError) {
    console.log('Response:', promptResult.content[0].text);
  } else {
    console.error('Error:', promptResult.content[0].text);
  }

  // Close via MCP
  console.log('\nClosing via MCP...');
  const closeResult = await geminiBrowserMCP.executeTool({
    name: 'gemini_browser_close',
    arguments: {},
  });
  console.log('Result:', closeResult.content[0].text);
}

async function exampleTNFIntegration() {
  console.log('\n=== TNF Agent Integration Example ===\n');

  // Simulate a TNF agent delegating a research task to Gemini
  console.log('TNF Agent: I need to research AI frameworks...');
  console.log('TNF Agent: Delegating to Gemini browser automation...\n');

  await geminiBrowser.initialize();

  const researchTask = await geminiBrowser.prompt({
    prompt: `
      Research the following AI frameworks and provide a comparison:
      - Focus on their key features
      - Note their primary use cases
      - Identify their strengths and weaknesses
    `,
    contextUrls: ['https://www.tensorflow.org', 'https://pytorch.org', 'https://keras.io'],
    timeout: 90000,
  });

  if (researchTask.success) {
    console.log('TNF Agent: Received research from Gemini:');
    console.log(researchTask.response);
    console.log('\nTNF Agent: Research complete! Cost: $0 (free Gemini compute) 🎉');
  } else {
    console.error('TNF Agent: Research failed:', researchTask.error);
  }

  await geminiBrowser.close();
}

// Run examples
async function main() {
  const args = process.argv.slice(2);
  const example = args[0] || 'all';

  try {
    switch (example) {
      case 'direct':
        await exampleDirectUsage();
        break;
      case 'mcp':
        await exampleMCPUsage();
        break;
      case 'tnf':
        await exampleTNFIntegration();
        break;
      case 'all':
      default:
        await exampleDirectUsage();
        await exampleMCPUsage();
        await exampleTNFIntegration();
        break;
    }

    console.log('\n✓ All examples completed successfully!\n');
  } catch (error) {
    console.error('\n✗ Example failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { exampleDirectUsage, exampleMCPUsage, exampleTNFIntegration };
