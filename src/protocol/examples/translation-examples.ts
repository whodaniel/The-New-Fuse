import { ProtocolType } from '../protocol/llm-protocol-translator.js';

/**
 * Protocol Translation Examples
 * 
 * This file demonstrates how to use the LLM-backed protocol translation tools
 * provided by The New Fuse to translate between different agent frameworks.
 */

/**
 * Example: Translating messages between MCP and AutoGen
 */
async function demonstrateMessageTranslation(mcpClient: any) {
  console.log('Demonstrating message translation between protocols...');
  
  // Example MCP message
  const mcpMessage = {
    id: '12345',
    method: 'execute',
    params: {
      tool: 'searchWeb',
      arguments: {
        query: 'latest developments in AI agents'
      }
    },
    jsonrpc: '2.0'
  };
  
  console.log('Original MCP message:');
  console.log(JSON.stringify(mcpMessage, null, 2));
  
  // Translate MCP message to AutoGen format
  const translatedMessage = await mcpClient.executeTool('protocol', 'translateMessage', {
    message: mcpMessage,
    sourceProtocol: ProtocolType.MCP,
    targetProtocol: ProtocolType.AutoGen
  });
  
  console.log('Translated to AutoGen format:');
  console.log(JSON.stringify(translatedMessage.translatedMessage, null, 2));
  
  // Translate back to MCP format
  const roundTripMessage = await mcpClient.executeTool('protocol', 'translateMessage', {
    message: translatedMessage.translatedMessage,
    sourceProtocol: ProtocolType.AutoGen,
    targetProtocol: ProtocolType.MCP
  });
  
  console.log('Round-trip back to MCP format:');
  console.log(JSON.stringify(roundTripMessage.translatedMessage, null, 2));
}

/**
 * Example: Translating tool definitions between LangChain and MCP
 */
async function demonstrateToolTranslation(mcpClient: any) {
  console.log('Demonstrating tool translation between protocols...');
  
  // Example LangChain tool definition
  const langchainTool = {
    name: 'search_web',
    description: 'Search the web for information',
    args_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query'
        }
      },
      required: ['query']
    },
    return_direct: false
  };
  
  console.log('Original LangChain tool:');
  console.log(JSON.stringify(langchainTool, null, 2));
  
  // Translate LangChain tool to MCP format
  const translatedTool = await mcpClient.executeTool('protocol', 'translateTool', {
    tool: langchainTool,
    sourceProtocol: ProtocolType.LangChain,
    targetProtocol: ProtocolType.MCP
  });
  
  console.log('Translated to MCP format:');
  console.log(JSON.stringify(translatedTool.translatedTool, null, 2));
}

/**
 * Example: Dynamic translation between unknown or custom protocols
 */
async function demonstrateDynamicTranslation(mcpClient: any) {
  console.log('Demonstrating dynamic translation between custom protocols...');
  
  // Custom protocol message
  const customMessage = {
    type: 'command',
    agent: 'research_assistant',
    content: {
      action: 'search',
      parameters: {
        topic: 'machine learning',
        limit: 5
      }
    },
    metadata: {
      priority: 'high',
      requester: 'user_123'
    }
  };
  
  // Information about the custom protocol
  const customProtocolInfo = {
    name: 'CustomResearchProtocol',
    description: 'A custom protocol for research assistants that uses a command-based structure with agent identifier, content object containing action and parameters, and metadata.'
  };
  
  // Information about the target protocol
  const targetProtocolInfo = {
    name: 'StandardAPIProtocol',
    description: 'A standard API protocol that uses HTTP-like structure with method, path, headers, and body.',
    examples: [
      {
        method: 'POST',
        path: '/api/v1/search',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token123'
        },
        body: {
          query: 'search query',
          options: {
            limit: 10
          }
        }
      }
    ]
  };
  
  console.log('Original custom protocol message:');
  console.log(JSON.stringify(customMessage, null, 2));
  
  // Perform dynamic translation
  const dynamicResult = await mcpClient.executeTool('protocol', 'dynamicTranslate', {
    source: customMessage,
    sourceProtocolInfo: customProtocolInfo,
    targetProtocolInfo: targetProtocolInfo
  });
  
  console.log('Dynamically translated message:');
  console.log(JSON.stringify(dynamicResult.translatedData, null, 2));
}

/**
 * Example: Learning a new custom protocol format
 */
async function demonstrateProtocolLearning(mcpClient: any) {
  console.log('Demonstrating learning a new custom protocol...');
  
  // Define examples of the custom protocol
  const protocolName = 'ProjectAIAssistantProtocol';
  
  const messageExamples = [
    {
      sample: {
        timestamp: '2023-04-24T12:34:56Z',
        direction: 'incoming',
        channel: 'chat',
        payload: {
          text: 'Help me with a coding task',
          user: {
            id: 'user123',
            preferences: {
              language: 'typescript'
            }
          }
        }
      },
      explanation: 'This is an incoming user message with timestamp, direction, and payload containing text and user information'
    },
    {
      sample: {
        timestamp: '2023-04-24T12:35:12Z',
        direction: 'outgoing',
        channel: 'chat',
        payload: {
          text: 'I can help you with TypeScript. What would you like to know?',
          suggestions: ['Types', 'Functions', 'Classes']
        }
      },
      explanation: 'This is an outgoing assistant response with timestamp, direction, and payload containing text and suggested quick replies'
    }
  ];
  
  const toolExamples = [
    {
      sample: {
        id: 'tool_123',
        capabilities: ['file_access', 'code_generation'],
        definition: {
          name: 'generate_code',
          inputs: [
            {
              name: 'language',
              type: 'string',
              required: true
            },
            {
              name: 'description',
              type: 'string',
              required: true
            }
          ],
          output: {
            type: 'object',
            properties: {
              code: 'string',
              explanation: 'string'
            }
          }
        }
      },
      explanation: 'This is a tool definition with ID, capabilities, and definition containing name, inputs schema, and output schema'
    }
  ];
  
  // Teach the translator about this new protocol
  await mcpClient.executeTool('protocol', 'learnCustomProtocol', {
    protocolName,
    messageExamples,
    toolExamples
  });
  
  console.log(`Custom protocol "${protocolName}" has been learned by the translator`);
  
  // After learning, we can translate to/from this protocol
  // For demonstration, let's check the protocols we know about now
  const protocols = await mcpClient.executeTool('protocol', 'listProtocols', {});
  
  console.log('Available protocols after learning:');
  console.log(protocols.protocols);
}

/**
 * Main example function to demonstrate protocol translation capabilities
 */
export async function demonstrateProtocolTranslation(mcpClient: any) {
  console.log('==========================================');
  console.log('Protocol Translation Capabilities Demo');
  console.log('==========================================');
  
  try {
    // Demonstrate different translation capabilities
    await demonstrateMessageTranslation(mcpClient);
    console.log('\n');
    
    await demonstrateToolTranslation(mcpClient);
    console.log('\n');
    
    await demonstrateDynamicTranslation(mcpClient);
    console.log('\n');
    
    await demonstrateProtocolLearning(mcpClient);
    
    console.log('\n==========================================');
    console.log('Protocol Translation Demo Complete');
    console.log('==========================================');
  } catch (error: any) {
    console.error('Error during protocol translation demonstration:', error.message);
  }
}