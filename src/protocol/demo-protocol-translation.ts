// Example usage of the Protocol Translator through the MCP system
import dotenv from 'dotenv';
import { MCPServer } from '../mcp/MCPServer.js';
import { registerProtocolTranslatorTools } from './register-protocol-tools.js';
import { Logger } from '../utils/logger.js';

// Load environment variables
dotenv.config();

// Example of how to use the LLM-powered Protocol Translator in The New Fuse

async function demonstrateProtocolTranslation() {
  // Setup logger
  const logger = new Logger('ProtocolTranslationDemo');
  
  // Check for OpenAI API Key
  const llmApiKey = process.env.OPENAI_API_KEY;
  if (!llmApiKey) {
    logger.error('OPENAI_API_KEY environment variable is required');
    process.exit(1);
  }
  
  logger.info('Starting Protocol Translation demonstration');
  
  // Initialize the MCP server
  const mcpServer = new MCPServer({
    logger,
    workspaceRoot: process.cwd()
  });
  
  // Register protocol translator tools
  registerProtocolTranslatorTools(mcpServer, {
    llmApiKey,
    logger,
    cacheEnabled: true
  });
  
  logger.info('Protocol Translator tools registered with MCP server');
  
  // Example MCP message in MCP format
  const mcpMessage = {
    version: "1.0",
    messageType: "request",
    id: "msg-123",
    timestamp: new Date().toISOString(),
    source: { agentId: "agent-1", name: "Source Agent" },
    target: { agentId: "agent-2", name: "Target Agent" },
    content: { text: "Can you help analyze this dataset?" }
  };
  
  logger.info('Translating MCP message to A2A format', { message: mcpMessage });
  
  try {
    // Execute the translation tool via MCP
    const result = await mcpServer.executeTool('translateMessage', {
      message: mcpMessage,
      sourceProtocol: 'mcp',
      targetProtocol: 'a2a'
    }, { agentId: 'demo-agent' });
    
    logger.info('Translation successful', { result });
    console.log('\nOriginal MCP Message:');
    console.log(JSON.stringify(mcpMessage, null, 2));
    console.log('\nTranslated to A2A Format:');
    console.log(JSON.stringify(result.translatedMessage, null, 2));
    
    // Example tool definition in OpenAI format
    const openAITool = {
      type: "function",
      function: {
        name: "getWeatherData",
        description: "Get current weather data for a location",
        parameters: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "The city and state, e.g. San Francisco, CA"
            },
            unit: {
              type: "string",
              enum: ["celsius", "fahrenheit"],
              description: "The unit of temperature"
            }
          },
          required: ["location"]
        }
      }
    };
    
    logger.info('Translating OpenAI tool to MCP format', { tool: openAITool });
    
    // Execute the tool translation
    const toolResult = await mcpServer.executeTool('translateTool', {
      tool: openAITool,
      sourceProtocol: 'openai-assistant',
      targetProtocol: 'mcp'
    }, { agentId: 'demo-agent' });
    
    logger.info('Tool translation successful', { result: toolResult });
    console.log('\nOriginal OpenAI Tool:');
    console.log(JSON.stringify(openAITool, null, 2));
    console.log('\nTranslated to MCP Format:');
    console.log(JSON.stringify(toolResult.translatedTool, null, 2));
    
    // Learning a custom protocol example
    const customProtocolExample = {
      protocolName: "custom-agent-protocol",
      messageExamples: [
        {
          sample: {
            uid: "msg-1234",
            from: "agent-alpha",
            to: "agent-beta",
            type: "command",
            payload: {
              action: "process",
              data: { key: "value" }
            },
            priority: "high",
            created: Date.now()
          },
          explanation: "This is a high-priority command message from agent-alpha to agent-beta to process some data"
        }
      ]
    };
    
    logger.info('Teaching the system about a custom protocol', { example: customProtocolExample });
    
    // Execute the learn custom protocol tool
    const learnResult = await mcpServer.executeTool('learnCustomProtocol', 
      customProtocolExample, 
      { agentId: 'demo-agent' }
    );
    
    logger.info('Custom protocol learning complete', { result: learnResult });
    console.log('\nLearned new custom protocol:');
    console.log(JSON.stringify(learnResult, null, 2));
    
    // Test dynamic translation with the newly learned protocol
    const customMessage = {
      uid: "msg-5678",
      from: "agent-gamma",
      to: "agent-delta",
      type: "request",
      payload: {
        action: "analyze",
        data: { samples: [1, 2, 3, 4, 5] }
      },
      priority: "normal",
      created: Date.now()
    };
    
    const dynamicResult = await mcpServer.executeTool('dynamicTranslate', {
      source: customMessage,
      sourceProtocolInfo: {
        name: "custom-agent-protocol",
        description: "A custom protocol with unique message structure including priority levels",
        examples: [customProtocolExample.messageExamples[0].sample]
      },
      targetProtocolInfo: {
        name: "mcp",
        description: "Model Context Protocol used for tool calling and agent coordination"
      }
    }, { agentId: 'demo-agent' });
    
    logger.info('Dynamic translation complete', { result: dynamicResult });
    console.log('\nOriginal Custom Protocol Message:');
    console.log(JSON.stringify(customMessage, null, 2));
    console.log('\nDynamically Translated to MCP Format:');
    console.log(JSON.stringify(dynamicResult.translatedData, null, 2));
    
  } catch (error) {
    logger.error('Error during protocol translation demonstration', error);
  }
  
  logger.info('Protocol Translation demonstration complete');
}

// Run the demonstration if this file is executed directly
if (require.main === module) {
  demonstrateProtocolTranslation()
    .then(() => {
      console.log('Demonstration completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Demonstration failed:', err);
      process.exit(1);
    });
}

export { demonstrateProtocolTranslation };