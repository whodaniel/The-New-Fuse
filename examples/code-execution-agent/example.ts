/**
 * Example script demonstrating how to use the Code Execution Agent
 */

import { CodeExecutionAgent } from './code-execution-agent.js';
import { MCPClient } from '../../packages/core/src/mcp/MCPClient.js'; // Replace with actual import

async function main() {
  // Create MCP client
  const mcpClient = new MCPClient({
    serverUrl: 'http://localhost:3000',
    apiKey: 'test-agent-key-123',
  });

  // Create Code Execution Agent
  const agent = new CodeExecutionAgent('code-execution-agent-1', mcpClient);

  // Initialize agent
  await agent.initialize();

  // Example 1: Execute simple JavaScript code
  const result1 = await agent.executeJavaScript(`
    const x = 10;
    const y = 20;
    return x + y;
  `);
  console.log('Example 1 Result:', result1);

  // Example 2: Execute JavaScript code with context
  const result2 = await agent.executeJavaScript(`
    return customFunc(customVar);
  `, {
    context: {
      customVar: 42,
      customFunc: (x) => x * 2,
    },
  });
  console.log('Example 2 Result:', result2);

  // Example 3: Execute TypeScript code
  const result3 = await agent.executeTypeScript(`
    interface Person {
      name: string;
      age: number;
    }
    
    const person: Person = {
      name: 'John',
      age: 30,
    };
    
    return person;
  `);
  console.log('Example 3 Result:', result3);

  // Example 4: Get pricing information
  const pricing = await agent.getPricing();
  console.log('Pricing Information:', pricing);

  // Example 5: Get usage information
  const usage = await agent.getUsage();
  console.log('Usage Information:', usage);
}

main().catch(console.error);
