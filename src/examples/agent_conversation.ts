/**
 * Agent Conversation Example
 * 
 * This script demonstrates how two AI agents can communicate with each other
 * using the Model Context Protocol (MCP) in The New Fuse framework.
 */

import { AgentMCPIntegration } from '../agent_mcp_integration.js';
import * as fs from 'fs';
import * as path from 'path';

// Simple Agent class to simulate an AI agent
class SimpleAgent {
  private id: string;
  private name: string;
  private mcpIntegration: AgentMCPIntegration;
  private tools: any[] = [];
  private messageHandlers: Map<string, (message: any) => Promise<any>> = new Map();
  private conversationLog: any[] = [];

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this.mcpIntegration = new AgentMCPIntegration();
    
    // Register the default message handler
    this.messageHandlers.set('default', this.defaultMessageHandler.bind(this));
  }

  // Initialize the agent
  async initialize(): Promise<boolean> {
    console.log(`[${this.name}] Initializing...`);
    
    try {
      // Initialize MCP integration
      const success = await this.mcpIntegration.initialize();
      if (!success) {
        console.warn(`[${this.name}] MCP initialization failed`);
        return false;
      }
      
      // Get available tools
      this.tools = this.mcpIntegration.getTools();
      console.log(`[${this.name}] Available tools: ${this.tools.map(t => t.name).join(', ')}`);
      
      // Set up message listener
      this.mcpIntegration.on('agentMessage', (message: any) => {
        if (message.target === this.id) {
          this.handleIncomingMessage(message);
        }
      });
      
      console.log(`[${this.name}] Initialized successfully`);
      return true;
    } catch (error) {
      console.error(`[${this.name}] Initialization error:`, error);
      return false;
    }
  }

  // Send a message to another agent
  async sendMessage(targetAgentId: string, message: any): Promise<any> {
    console.log(`[${this.name}] Sending message to ${targetAgentId}:`, message);
    
    // Find the agent_communicate tool
    const communicateTool = this.tools.find(tool => tool.name === 'agent_communicate');
    if (!communicateTool) {
      throw new Error(`[${this.name}] agent_communicate tool not found`);
    }
    
    // Prepare the full message with metadata
    const fullMessage = {
      content: message,
      metadata: {
        source: this.id,
        timestamp: new Date().toISOString(),
        type: 'message'
      }
    };
    
    // Add to conversation log
    this.conversationLog.push({
      direction: 'out',
      target: targetAgentId,
      message: fullMessage,
      timestamp: new Date().toISOString()
    });
    
    // Send the message using the tool
    return await communicateTool.execute({
      agentId: targetAgentId,
      message: fullMessage
    });
  }

  // Register a message handler for a specific message type
  registerMessageHandler(messageType: string, handler: (message: any) => Promise<any>): void {
    this.messageHandlers.set(messageType, handler);
  }

  // Handle an incoming message
  private async handleIncomingMessage(message: any): Promise<void> {
    console.log(`[${this.name}] Received message:`, message);
    
    // Add to conversation log
    this.conversationLog.push({
      direction: 'in',
      source: message.content.metadata?.source || 'unknown',
      message: message.content,
      timestamp: new Date().toISOString()
    });
    
    // Determine the message type
    const messageType = message.content.metadata?.type || 'default';
    
    // Find the appropriate handler
    const handler = this.messageHandlers.get(messageType) || this.messageHandlers.get('default');
    
    if (handler) {
      try {
        // Process the message
        const response = await handler(message.content);
        
        // If the handler returns a response, send it back
        if (response && message.content.metadata?.source) {
          await this.sendMessage(message.content.metadata.source, response);
        }
      } catch (error) {
        console.error(`[${this.name}] Error handling message:`, error);
      }
    } else {
      console.warn(`[${this.name}] No handler found for message type: ${messageType}`);
    }
  }

  // Default message handler
  private async defaultMessageHandler(message: any): Promise<any> {
    console.log(`[${this.name}] Processing message with default handler:`, message);
    
    // Simple echo response
    return {
      content: `[${this.name}] Acknowledged: ${JSON.stringify(message.content)}`,
      metadata: {
        type: 'response',
        inResponseTo: message.metadata?.id
      }
    };
  }

  // Save the conversation log to a file
  async saveConversationLog(filePath: string): Promise<void> {
    const logData = {
      agent: {
        id: this.id,
        name: this.name
      },
      timestamp: new Date().toISOString(),
      messages: this.conversationLog
    };
    
    fs.writeFileSync(filePath, JSON.stringify(logData, null, 2));
    console.log(`[${this.name}] Conversation log saved to ${filePath}`);
  }

  // Cleanup resources
  async cleanup(): Promise<void> {
    await this.mcpIntegration.cleanup();
    console.log(`[${this.name}] Cleaned up resources`);
  }
}

/**
 * Run a conversation between two agents
 */
async function runAgentConversation(): Promise<void> {
  console.log("Starting agent conversation example...");
  
  // Create data directory if it doesn't exist
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Create two agents
  const agent1 = new SimpleAgent('agent1', 'Research Assistant');
  const agent2 = new SimpleAgent('agent2', 'Code Assistant');
  
  try {
    // Initialize agents
    await Promise.all([
      agent1.initialize(),
      agent2.initialize()
    ]);
    
    // Register custom message handlers for agent2
    agent2.registerMessageHandler('query', async (message: any) => {
      if (message.content.includes('code')) {
        return {
          content: "Here's a simple TypeScript function:\n```typescript\nfunction greet(name: string): string {\n  return `Hello, ${name}!`;\n}\n```",
          metadata: {
            type: 'code_snippet',
            language: 'typescript'
          }
        };
      } else {
        return {
          content: "I'm sorry, I can only help with code-related questions.",
          metadata: {
            type: 'text'
          }
        };
      }
    });
    
    // Start the conversation
    console.log("\n--- Starting conversation ---\n");
    
    // Agent 1 sends a message to Agent 2
    await agent1.sendMessage('agent2', {
      content: "Can you help me with some TypeScript code for a greeting function?",
      metadata: {
        type: 'query'
      }
    });
    
    // Give some time for the messages to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Agent 1 sends another message
    await agent1.sendMessage('agent2', {
      content: "Thanks! Can you also provide a more complex example with interfaces?",
      metadata: {
        type: 'query'
      }
    });
    
    // Give some time for the messages to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Save conversation logs
    await agent1.saveConversationLog(path.join(dataDir, 'agent1_conversation.json'));
    await agent2.saveConversationLog(path.join(dataDir, 'agent2_conversation.json'));
    
    console.log("\n--- Conversation completed ---\n");
  } catch (error) {
    console.error("Error in agent conversation:", error);
  } finally {
    // Cleanup
    await Promise.all([
      agent1.cleanup(),
      agent2.cleanup()
    ]);
    
    console.log("Agent conversation example completed");
  }
}

// Run the example
if (require.main === module) {
  runAgentConversation()
    .catch(error => console.error("Error in agent conversation example:", error))
    .finally(() => process.exit(0));
}

export { SimpleAgent, runAgentConversation };