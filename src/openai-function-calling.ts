// Basic imports
import OpenAI from 'openai';
import { z } from 'zod';
import axios from 'axios';
import { v4 as uuid4 } from 'uuid';
import { MCPServer } from './mcp/MCPServer.js';
import path from 'path';

// MCP client for The New Fuse
class MCPClient {
  private apiKey: string;
  private baseUrl: string;
  private conversationId: string | null = null;

  constructor(apiKey: string, baseUrl: string = 'http://localhost:3000') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  // Initialize or retrieve a conversation
  async initConversation(id?: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/mcp/conversation`,
        { conversationId: id || uuid4() },
        { headers: { 'X-API-Key': this.apiKey } }
      );
      this.conversationId = response.data.data.conversationId;
      return this.conversationId;
    } catch (error) {
      console.error('Error initializing conversation:', error);
      throw error;
    }
  }

  // Get available tools
  async getTools(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/mcp/tools`,
        { headers: { 'X-API-Key': this.apiKey } }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting tools:', error);
      throw error;
    }
  }

  // Execute a tool
  async executeTool(toolName: string, parameters: any): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/mcp/request`,
        { toolName, parameters },
        { headers: { 'X-API-Key': this.apiKey } }
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error executing tool ${toolName}:`, error);
      throw error;
    }
  }

  // Add a message to the conversation
  async addMessage(role: string, content: string, toolCalls?: any): Promise<any> {
    if (!this.conversationId) {
      throw new Error('Conversation not initialized');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/mcp/conversation/${this.conversationId}/message`,
        { role, content, toolCalls },
        { headers: { 'X-API-Key': this.apiKey } }
      );
      return response.data.data.message;
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  // Get conversation history
  async getHistory(): Promise<any> {
    if (!this.conversationId) {
      throw new Error('Conversation not initialized');
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/mcp/conversation/${this.conversationId}/history`,
        { headers: { 'X-API-Key': this.apiKey } }
      );
      return response.data.data.history;
    } catch (error) {
      console.error('Error getting conversation history:', error);
      throw error;
    }
  }
}

// Task Management for asynchronous function calls
class TaskManager {
  private tasks: Record<string, any> = {};

  async createTask(description: string, executor: () => Promise<any>): Promise<string> {
    const taskId = uuid4();
    this.tasks[taskId] = {
      id: taskId,
      description,
      status: 'pending',
      result: null,
      error: null,
      startTime: Date.now()
    };

    // Execute the task asynchronously
    this.executeTask(taskId, executor);
    return taskId;
  }

  private async executeTask(taskId: string, executor: () => Promise<any>): Promise<void> {
    try {
      this.tasks[taskId].status = 'running';
      const result = await executor();
      this.tasks[taskId].status = 'completed';
      this.tasks[taskId].result = result;
      this.tasks[taskId].endTime = Date.now();
    } catch (error) {
      this.tasks[taskId].status = 'failed';
      this.tasks[taskId].error = error instanceof Error ? error.message : String(error);
      this.tasks[taskId].endTime = Date.now();
    }
  }

  getTask(taskId: string): any {
    const task = this.tasks[taskId];
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    return task;
  }

  getAllTasks(): any[] {
    return Object.values(this.tasks);
  }
}

// Function to convert MCP tools to OpenAI function definitions
function mcpToolsToOpenAIFunctions(mcpTools: any): any[] {
  const functions = [];

  for (const [name, tool] of Object.entries(mcpTools)) {
    const parameters = convertZodSchemaToJsonSchema(tool.parameters);
    
    functions.push({
      type: "function",
      function: {
        name,
        description: tool.description,
        parameters
      }
    });
  }

  return functions;
}

// Helper to convert Zod schema to JSON schema (simplified version)
function convertZodSchemaToJsonSchema(zodSchema: any): any {
  // This is a simplified conversion - a production implementation would need to be more robust
  const jsonSchema: any = {
    type: "object",
    properties: {},
    required: []
  };

  // Extract properties from the Zod schema
  const shape = zodSchema.shape || {};
  
  for (const [key, fieldSchema] of Object.entries(shape)) {
    const isOptional = fieldSchema.isOptional?.();
    
    // Get field type and description
    let fieldType = "string"; // Default type
    if (fieldSchema.constructor.name === "ZodNumber") fieldType = "number";
    if (fieldSchema.constructor.name === "ZodBoolean") fieldType = "boolean";
    
    jsonSchema.properties[key] = {
      type: fieldType,
      description: fieldSchema.description || `The ${key} parameter`
    };
    
    if (!isOptional) {
      jsonSchema.required.push(key);
    }
  }
  
  return jsonSchema;
}

// Dynamic Tool Creator that can add tools to an MCP server at runtime
class DynamicToolCreator {
  private mcpServer: MCPServer;
  
  constructor(mcpServer: MCPServer) {
    this.mcpServer = mcpServer;
  }
  
  // Add a tool from a string representation of code
  addTool(name: string, description: string, schemaDefinition: string, implementation: string): boolean {
    try {
      // Parse the schema definition to create a Zod schema
      // This is a simplified example - would need proper sandboxing in production
      const schemaCode = `return ${schemaDefinition}`;
      const parameterSchema = new Function('z', schemaCode)(z);
      
      // Create the implementation function - again, would need proper sandboxing
      const implementationFn = new Function('params', 'context', implementation);
      
      // Register the tool with the MCP server
      this.mcpServer.registerTool(name, {
        description,
        parameters: parameterSchema,
        execute: implementationFn
      });
      
      return true;
    } catch (error) {
      console.error(`Error creating dynamic tool ${name}:`, error);
      return false;
    }
  }
}

// Agent class for delegation patterns
class Agent {
  private openai: OpenAI;
  private mcpClient: MCPClient;
  private tools: any[];
  private name: string;
  private taskManager: TaskManager;
  
  constructor(openai: OpenAI, mcpClient: MCPClient, name: string) {
    this.openai = openai;
    this.mcpClient = mcpClient;
    this.name = name;
    this.tools = [];
    this.taskManager = new TaskManager();
  }
  
  async initialize() {
    // Get available tools and convert to OpenAI format
    const mcpTools = await this.mcpClient.getTools();
    this.tools = mcpToolsToOpenAIFunctions(mcpTools);
  }
  
  async processMessage(message: string): Promise<string> {
    // Add user message to conversation
    await this.mcpClient.addMessage('user', message);
    
    // First call to determine if tools are needed
    const response = await this.openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "user", content: message }],
      tools: this.tools,
      tool_choice: "auto",
    });
    
    const responseMessage = response.choices[0].message;
    
    // Process tool calls if present
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      return this.handleToolCalls(message, responseMessage);
    } else {
      // No tool calls - just return the response
      await this.mcpClient.addMessage(responseMessage.role, responseMessage.content || '');
      return responseMessage.content || '';
    }
  }
  
  private async handleToolCalls(userMessage: string, responseMessage: any): Promise<string> {
    // Add the assistant's response to the conversation
    await this.mcpClient.addMessage(
      responseMessage.role,
      responseMessage.content || '',
      responseMessage.tool_calls
    );
    
    // Process each tool call
    const toolResults = [];
    const toolExecutions = [];
    
    // Map each tool call to a promise
    for (const toolCall of responseMessage.tool_calls) {
      const toolExecPromise = (async () => {
        try {
          // Parse function arguments
          const args = JSON.parse(toolCall.function.arguments);
          
          // Create a task for this tool call
          const taskId = await this.taskManager.createTask(
            `Execute ${toolCall.function.name}`,
            async () => this.mcpClient.executeTool(toolCall.function.name, args)
          );
          
          // Wait for task completion
          let task = this.taskManager.getTask(taskId);
          while (task.status === 'pending' || task.status === 'running') {
            await new Promise(resolve => setTimeout(resolve, 100));
            task = this.taskManager.getTask(taskId);
          }
          
          if (task.status === 'completed') {
            return {
              tool_call_id: toolCall.id,
              role: "tool",
              content: JSON.stringify(task.result),
            };
          } else {
            throw new Error(task.error || 'Unknown error');
          }
        } catch (error) {
          return {
            tool_call_id: toolCall.id,
            role: "tool",
            content: JSON.stringify({ error: String(error) }),
          };
        }
      })();
      
      toolExecutions.push(toolExecPromise);
    }
    
    // Execute all tool calls in parallel
    const results = await Promise.all(toolExecutions);
    toolResults.push(...results);
    
    // Create messages array for the final response
    const messages = [
      { role: "user", content: userMessage },
      responseMessage,
      ...toolResults
    ];
    
    // Get the final response
    const finalResponse = await this.openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages,
    });
    
    const finalMessage = finalResponse.choices[0].message;
    
    // Add to conversation history
    await this.mcpClient.addMessage(finalMessage.role, finalMessage.content || '');
    
    return finalMessage.content || '';
  }
  
  // Method to delegate a task to another agent
  async delegateTask(taskDescription: string, delegateAgent: Agent): Promise<string> {
    console.log(`${this.name} delegating task to ${delegateAgent.name}: ${taskDescription}`);
    
    // Process the task with the delegate agent
    const result = await delegateAgent.processMessage(
      `As a delegated task from ${this.name}, please help with: ${taskDescription}`
    );
    
    // Record the delegation in conversation history
    await this.mcpClient.addMessage(
      'system',
      `Task "${taskDescription}" was delegated to ${delegateAgent.name} and returned: ${result}`
    );
    
    return result;
  }
}

// Main function to demonstrate OpenAI function calling with MCP
async function demonstrateFunctionCalling() {
  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key', // Replace with your actual key
  });

  // Initialize MCP client
  const mcpClient = new MCPClient('test-agent-key-123'); // Use the API key from the MCP server
  await mcpClient.initConversation();

  // Get available MCP tools
  const mcpTools = await mcpClient.getTools();
  
  // Convert MCP tools to OpenAI function definitions
  const functions = mcpToolsToOpenAIFunctions(mcpTools);
  
  // Initialize task manager for async operations
  const taskManager = new TaskManager();

  // Example user message
  const userMessage = "List the files in the src directory and then read the package.json file";
  
  // Add user message to conversation history
  await mcpClient.addMessage('user', userMessage);
  
  console.log("User:", userMessage);
  
  // First API call to get function calls
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [{ role: "user", content: userMessage }],
    tools: functions,
    tool_choice: "auto",
  });
  
  const responseMessage = response.choices[0].message;
  
  // Process tool calls if present
  if (responseMessage.tool_calls) {
    // Add the model's response to the conversation
    await mcpClient.addMessage(
      responseMessage.role,
      responseMessage.content || '',
      responseMessage.tool_calls
    );
    
    // Process each tool call
    const toolResults = [];
    
    for (const toolCall of responseMessage.tool_calls) {
      console.log(`\nExecuting function: ${toolCall.function.name}`);
      
      try {
        // Parse the function arguments
        const args = JSON.parse(toolCall.function.arguments);
        
        // Execute the tool via MCP
        const result = await mcpClient.executeTool(toolCall.function.name, args);
        toolResults.push({
          tool_call_id: toolCall.id,
          role: "tool",
          content: JSON.stringify(result),
        });
        
        console.log(`Result for ${toolCall.function.name}:`, result);
      } catch (error) {
        console.error(`Error executing ${toolCall.function.name}:`, error);
        toolResults.push({
          tool_call_id: toolCall.id,
          role: "tool",
          content: JSON.stringify({ error: String(error) }),
        });
      }
    }
    
    // Add the tool results to the messages for the next API call
    const messages = [
      { role: "user", content: userMessage },
      responseMessage,
      ...toolResults
    ];
    
    // Second API call to get the final response
    const secondResponse = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages,
    });
    
    const finalMessage = secondResponse.choices[0].message;
    
    // Add the final response to the conversation
    await mcpClient.addMessage(finalMessage.role, finalMessage.content || '');
    
    console.log("\nFinal response:", finalMessage.content);
  } else {
    // If no tool calls, just add the response to the conversation
    await mcpClient.addMessage(responseMessage.role, responseMessage.content || '');
    console.log("\nResponse (no tools used):", responseMessage.content);
  }
  
  // Example of asynchronous tool execution with tasks
  console.log("\nExample of asynchronous execution:");
  const taskId = await taskManager.createTask(
    "List workspace files async",
    async () => {
      // Simulating a longer-running task
      await new Promise(resolve => setTimeout(resolve, 2000));
      return mcpClient.executeTool('listWorkspaceFiles', { directoryPath: 'packages' });
    }
  );
  
  console.log(`Created task: ${taskId}`);
  
  // Poll for task completion
  let task = taskManager.getTask(taskId);
  console.log("Initial task status:", task.status);
  
  while (task.status === 'pending' || task.status === 'running') {
    await new Promise(resolve => setTimeout(resolve, 500));
    task = taskManager.getTask(taskId);
  }
  
  console.log("Final task status:", task.status);
  if (task.status === 'completed') {
    console.log("Task result:", task.result);
  } else {
    console.error("Task error:", task.error);
  }
  
  // Get the conversation history
  const history = await mcpClient.getHistory();
  console.log("\nConversation history:", history);
}

// Function to demonstrate agent delegation
async function demonstrateDelegation() {
  console.log("Demonstrating agent delegation pattern...");
  
  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key', // Replace with your actual key
  });

  // Create MCP clients for each agent
  const directorClient = new MCPClient('test-agent-key-123');
  await directorClient.initConversation('director-conversation');
  
  const codeSpecialistClient = new MCPClient('test-agent-key-123');
  await codeSpecialistClient.initConversation('code-specialist-conversation');
  
  const dataSpecialistClient = new MCPClient('test-agent-key-123');
  await dataSpecialistClient.initConversation('data-specialist-conversation');
  
  // Create agents
  const directorAgent = new Agent(openai, directorClient, 'Director');
  await directorAgent.initialize();
  
  const codeSpecialist = new Agent(openai, codeSpecialistClient, 'CodeSpecialist');
  await codeSpecialist.initialize();
  
  const dataSpecialist = new Agent(openai, dataSpecialistClient, 'DataSpecialist');
  await dataSpecialist.initialize();
  
  // Example task for director
  const userRequest = "I need to analyze the project structure and then create a summary of the codebase";
  console.log(`\nUser request: ${userRequest}`);
  
  // Director analyzes the task and decides on delegation
  const directorResponse = await directorAgent.processMessage(
    `${userRequest}\n\nBreak this task down and delegate appropriately to specialists if needed. ` +
    `You can delegate to: CodeSpecialist (for code analysis) or DataSpecialist (for data processing).`
  );
  
  console.log(`\nDirector's response: ${directorResponse}`);
  
  // Simulate delegation to code specialist
  const codeTask = "Analyze the project structure and list the key components";
  const codeResult = await directorAgent.delegateTask(codeTask, codeSpecialist);
  console.log(`\nCode Specialist result: ${codeResult}`);
  
  // Simulate delegation to data specialist
  const dataTask = "Create a summary of findings from the code analysis";
  const dataResult = await directorAgent.delegateTask(dataTask, dataSpecialist);
  console.log(`\nData Specialist result: ${dataResult}`);
  
  // Director combines results
  const finalResponse = await directorAgent.processMessage(
    `Based on the following specialist results, provide a comprehensive summary:\n\n` +
    `Code Analysis: ${codeResult}\n\n` +
    `Data Summary: ${dataResult}`
  );
  
  console.log(`\nFinal combined response: ${finalResponse}`);
  
  return {
    directorResponse,
    codeResult,
    dataResult,
    finalResponse
  };
}

// Demonstrate dynamic tool creation
async function demonstrateDynamicTools(mcpServer: MCPServer) {
  console.log("Demonstrating dynamic tool creation...");
  
  // Create the dynamic tool creator
  const toolCreator = new DynamicToolCreator(mcpServer);
  
  // Example: Create a simple sentiment analysis tool
  const sentimentToolName = "analyzeSentiment";
  const sentimentToolDesc = "Analyzes the sentiment of a text, returning positive, negative, or neutral.";
  const sentimentSchema = `
    z.object({
      text: z.string().describe('The text to analyze for sentiment')
    })
  `;
  const sentimentImpl = `
    // This is a simplified sentiment analysis that would be replaced with a real implementation
    const text = params.text.toLowerCase();
    const positiveWords = ['good', 'great', 'excellent', 'awesome', 'happy', 'love'];
    const negativeWords = ['bad', 'awful', 'terrible', 'hate', 'sad', 'angry'];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    positiveWords.forEach(word => {
      if (text.includes(word)) positiveScore++;
    });
    
    negativeWords.forEach(word => {
      if (text.includes(word)) negativeScore++;
    });
    
    let sentiment = 'neutral';
    if (positiveScore > negativeScore) sentiment = 'positive';
    if (negativeScore > positiveScore) sentiment = 'negative';
    
    return {
      sentiment,
      positiveScore,
      negativeScore,
      confidence: Math.abs(positiveScore - negativeScore) / (positiveScore + negativeScore + 1)
    };
  `;
  
  // Add the sentiment analysis tool
  const success = toolCreator.addTool(
    sentimentToolName,
    sentimentToolDesc,
    sentimentSchema,
    sentimentImpl
  );
  
  if (success) {
    console.log(`Successfully added dynamic tool: ${sentimentToolName}`);
  } else {
    console.error(`Failed to add dynamic tool: ${sentimentToolName}`);
  }
  
  // Create a tool to summarize text
  const summaryToolName = "summarizeText";
  const summaryToolDesc = "Creates a summary of a long text.";
  const summarySchema = `
    z.object({
      text: z.string().describe('The text to summarize'),
      maxLength: z.number().optional().describe('Maximum length of the summary in characters')
    })
  `;
  const summaryImpl = `
    // This is a simplified summarization that would be replaced with a real implementation
    const text = params.text;
    const maxLength = params.maxLength || 200;
    
    // Very basic summary: take first few sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    let summary = '';
    
    for (const sentence of sentences) {
      if ((summary + sentence).length <= maxLength) {
        summary += sentence;
      } else {
        break;
      }
    }
    
    return {
      originalLength: text.length,
      summaryLength: summary.length,
      summary
    };
  `;
  
  // Add the summarization tool
  const success2 = toolCreator.addTool(
    summaryToolName,
    summaryToolDesc,
    summarySchema,
    summaryImpl
  );
  
  if (success2) {
    console.log(`Successfully added dynamic tool: ${summaryToolName}`);
  } else {
    console.error(`Failed to add dynamic tool: ${summaryToolName}`);
  }
  
  return { success, success2 };
}

// Execute the demonstrations if run directly
if (require.main === module) {
  // Create MCP server reference for dynamic tool demo
  // Note: This is just for demonstration purposes
  const WORKSPACE_ROOT = path.resolve(__dirname, '..');
  const dummyLogger = {
    info: (msg: string) => console.log(msg),
    warn: (msg: string) => console.warn(msg),
    error: (msg: string, err?: any) => console.error(msg, err)
  };
  const mcpServer = new MCPServer({ logger: dummyLogger, workspaceRoot: WORKSPACE_ROOT });
  
  // Run all demonstrations
  Promise.all([
    demonstrateFunctionCalling()
      .then(() => console.log("Basic function calling demonstration completed")),
    demonstrateDelegation()
      .then(() => console.log("Delegation pattern demonstration completed")),
    demonstrateDynamicTools(mcpServer)
      .then(() => console.log("Dynamic tool creation demonstration completed"))
  ])
  .then(() => console.log("All demonstrations completed successfully"))
  .catch(error => console.error("Error in demonstrations:", error));
}

// Export the necessary components for use in other modules
export {
  MCPClient,
  TaskManager,
  Agent,
  DynamicToolCreator,
  mcpToolsToOpenAIFunctions,
  convertZodSchemaToJsonSchema,
  demonstrateFunctionCalling,
  demonstrateDelegation,
  demonstrateDynamicTools
};