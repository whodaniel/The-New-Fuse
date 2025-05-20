/**
 * Example usage of the new architectural components
 * 
 * This example demonstrates how to use the refactored architecture
 * for agent communication and tool interaction.
 */

import { ConfigService } from './config/ConfigService.js';
import { ProtocolFactory, ProtocolType } from './protocols/ProtocolFactory.js';
import { MessageRouter } from './services/MessageRouter.js';
import { A2AService } from './services/A2AService.js';
import { MCPService } from './services/MCPService.js';
import { AgentRegistry, AgentType, AgentStatus } from './services/AgentRegistry.js';

/**
 * Main application entry point for demonstration
 */
async function main() {
  console.log('Initializing The New Fuse architecture components...');
  
  // Initialize configuration
  const configService = new ConfigService();
  await configService.initialize();
  
  console.log('Configuration loaded. Environment:', configService.get('environment', 'development'));

  // Create protocol factory
  const protocolFactory = new ProtocolFactory(configService);
  
  // Initialize agent registry
  const agentRegistry = new AgentRegistry({ debug: true });
  
  // Register example agents
  const llmAgent = {
    id: 'llm-agent-1',
    name: 'GPT Assistant',
    type: AgentType.LLM,
    status: AgentStatus.ACTIVE,
    capabilities: ['text_generation', 'code_generation', 'translation'],
    metadata: {
      version: '1.0.0',
      provider: 'OpenAI',
      model: 'gpt-4'
    }
  };
  
  const toolAgent = {
    id: 'tool-agent-1',
    name: 'Code Analyzer',
    type: AgentType.TOOL,
    status: AgentStatus.ACTIVE,
    capabilities: ['code_analysis', 'security_scanning'],
    metadata: {
      version: '1.0.0',
      runtime: 'node.js'
    }
  };
  
  agentRegistry.registerAgent(llmAgent);
  agentRegistry.registerAgent(toolAgent);
  
  console.log('Registered agents:');
  console.log(' - LLM Agent:', llmAgent.name);
  console.log(' - Tool Agent:', toolAgent.name);
  
  // Create communication protocols for each agent
  const llmProtocol = protocolFactory.createProtocol({
    agentId: llmAgent.id,
    type: ProtocolType.WEBSOCKET,
    debug: true
  });
  
  const toolProtocol = protocolFactory.createProtocol({
    agentId: toolAgent.id,
    type: ProtocolType.REDIS,
    debug: true
  });
  
  // Initialize protocols
  await llmProtocol.initialize();
  await toolProtocol.initialize();
  
  // Create communication services
  const a2aService = new A2AService({
    agentId: 'system',
    protocol: llmProtocol,
    agentRegistry
  });
  
  const mcpService = new MCPService({
    agentId: 'system',
    protocol: toolProtocol
  });
  
  // Create message router
  const messageRouter = new MessageRouter({
    a2aService,
    mcpService,
    agentRegistry
  });
  
  // Start listening for messages
  llmProtocol.startListening();
  toolProtocol.startListening();
  
  console.log('Communication protocols initialized and listening for messages');
  
  // Example A2A communication
  const exampleA2AMessage = await a2aService.sendMessage(
    llmAgent.id,
    'What can you tell me about TypeScript interfaces?',
    'query'
  );
  
  console.log('Sent A2A message:', exampleA2AMessage.id);
  
  // Example MCP tool invocation
  const exampleToolResult = await mcpService.invokeTool(
    toolAgent.id,
    'code_analysis',
    {
      code: 'function example() { console.log("Hello"); }',
      language: 'javascript'
    }
  );
  
  console.log('Tool invocation result:', exampleToolResult);
  
  // Example of using the message router
  const routingResult = await messageRouter.routeMessage({
    source: 'user-1',
    target: 'capability:code_analysis',
    content: 'Analyze this code snippet',
    metadata: {
      type: 'code_analysis_request',
      language: 'typescript'
    }
  });
  
  console.log('Message routing result:', routingResult);
  
  // Cleanup
  llmProtocol.stopListening();
  toolProtocol.stopListening();
  
  console.log('Example completed successfully');
}

// Run the example
if (require.main === module) {
  main()
    .then(() => console.log('Example completed successfully'))
    .catch(err => console.error('Error running example:', err));
}