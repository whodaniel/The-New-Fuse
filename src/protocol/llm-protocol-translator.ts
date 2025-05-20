import { EventEmitter } from 'events';
import { Logger } from '../utils/logger.js';
import { OpenAI } from 'openai';

/**
 * Available protocol types that can be translated
 */
export enum ProtocolType {
  MCP = 'MCP',               // Model Context Protocol
  LangChain = 'LANGCHAIN',   // LangChain framework
  AutoGen = 'AUTOGEN',       // Microsoft AutoGen
  CrewAI = 'CREWAI',         // CrewAI framework
  OpenAIAssistant = 'OPENAI_ASSISTANT', // OpenAI Assistants
  LlamaIndex = 'LLAMA_INDEX', // LlamaIndex
  Custom = 'CUSTOM'          // Custom protocols
}

/**
 * Configuration options for LLM Protocol Translator
 */
export interface LLMProtocolTranslatorConfig {
  llmApiKey: string;
  llmOrganization?: string;
  logger?: Logger;
  cacheEnabled?: boolean;
}

/**
 * LLM-powered Protocol Translator
 * Uses LLM to translate between different agent communication protocols dynamically
 */
export class LLMProtocolTranslator {
  private openai: OpenAI;
  private logger: Logger;
  private cache: Map<string, any> = new Map();
  private cacheEnabled: boolean;
  
  constructor(config: LLMProtocolTranslatorConfig) {
    this.openai = new OpenAI({
      apiKey: config.llmApiKey,
      organization: config.llmOrganization
    });
    this.logger = config.logger || new Logger('LLMProtocolTranslator');
    this.cacheEnabled = config.cacheEnabled !== undefined ? config.cacheEnabled : true;
  }
  
  /**
   * Translate a message between two protocol formats using LLM
   */
  async translate(data: any, prompt: string, systemPrompt?: string): Promise<any> {
    const cacheKey = this.cacheEnabled ? 
      `${JSON.stringify(data)}_${prompt.slice(0, 100)}_${systemPrompt?.slice(0, 100) || ''}` : '';
    
    // Check cache first if enabled
    if (this.cacheEnabled && this.cache.has(cacheKey)) {
      this.logger.debug('Using cached translation result');
      return this.cache.get(cacheKey);
    }
    
    // Define system prompt if not provided
    const defaultSystemPrompt = `You are an expert in AI agent communication protocols. 
Your task is to translate data between different protocol formats accurately.
Always respond with valid JSON only. Do not include any explanations or markdown formatting.`;
    
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt || defaultSystemPrompt },
          { role: "user", content: `${prompt}\n\nData to translate: ${JSON.stringify(data, null, 2)}` }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      });
      
      const content = response.choices[0]?.message?.content || '';
      
      try {
        const result = JSON.parse(content);
        
        // Cache result if enabled
        if (this.cacheEnabled) {
          this.cache.set(cacheKey, result);
        }
        
        return result;
      } catch (error) {
        this.logger.error('Failed to parse LLM response as JSON', { content });
        throw new Error('Failed to parse translation result as JSON');
      }
    } catch (error: any) {
      this.logger.error(`LLM translation error: ${error.message}`);
      throw new Error(`Translation failed: ${error.message}`);
    }
  }
  
  /**
   * Search the web for up-to-date information about protocol formats
   */
  async searchProtocolInformation(protocolType: ProtocolType): Promise<any> {
    const prompt = `Please provide the most up-to-date information about the ${protocolType} agent protocol.
Include details about message formats, tool definitions, capability declarations, and any other relevant information.
Format your response as structured JSON with separate sections for each aspect of the protocol.`;
    
    try {
      // First, we search the web to gather current information
      const searchResponse = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: `You are an expert research assistant with access to the latest information.
Your task is to find up-to-date information about AI agent protocols and standards.`
          },
          { role: "user", content: `I need comprehensive and up-to-date information about the ${protocolType} protocol for AI agents.
Please search for specifications, documentation, examples, and best practices.
Include information about message formats, capabilities, and tools.
If possible, find the latest versions and any recent changes to the protocol.` }
        ],
        temperature: 0.1,
        tools: [
          {
            type: "function",
            function: {
              name: "search",
              description: "Search the web for relevant information",
              parameters: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "The search query"
                  }
                },
                required: ["query"]
              }
            }
          }
        ]
      });
      
      const messageContent = response.choices[0]?.message?.content || '';
      
      try {
        // Parse the response as a structured object
        return JSON.parse(messageContent);
      } catch (error) {
        // If not valid JSON, return as is
        return {
          protocol: protocolType,
          information: messageContent
        };
      }
    } catch (error: any) {
      this.logger.error(`Error searching for protocol information: ${error.message}`);
      throw new Error(`Failed to retrieve protocol information: ${error.message}`);
    }
  }
}

/**
 * Protocol Bridge that handles all translation operations between protocols
 * Extends EventEmitter to allow for observability of translation operations
 */
export class ProtocolBridge extends EventEmitter {
  private translator: LLMProtocolTranslator;
  private logger: Logger;
  private protocolSchemas: Map<string, any> = new Map();
  
  constructor(config: LLMProtocolTranslatorConfig) {
    super();
    this.translator = new LLMProtocolTranslator(config);
    this.logger = config.logger || new Logger('ProtocolBridge');
    
    // Set up initial schemas for known protocols
    this.initializeProtocolSchemas();
  }
  
  /**
   * Initialize schemas for known protocol types
   */
  private async initializeProtocolSchemas() {
    // Load built-in protocol schemas
    const mcpSchema = {
      name: ProtocolType.MCP,
      messageFormat: {
        description: "Model Context Protocol message format",
        structure: {
          id: "Unique identifier for the message",
          method: "The method being called (e.g., 'execute')",
          params: "Parameters for the method call",
          jsonrpc: "JSON-RPC version, typically '2.0'"
        }
      },
      toolFormat: {
        description: "MCP tool definition format",
        structure: {
          name: "Name of the tool",
          description: "Description of what the tool does",
          parameters: "JSON Schema object describing the parameters",
          handler: "Function that implements the tool (implementation detail)"
        }
      },
      capabilityFormat: {
        description: "MCP capability definition format",
        structure: {
          description: "Description of the capability",
          actions: "Array of action names that this capability provides"
        }
      }
    };
    
    const langchainSchema = {
      name: ProtocolType.LangChain,
      messageFormat: {
        description: "LangChain message format",
        structure: {
          type: "Message type (e.g., 'human', 'ai', 'system', 'function')",
          content: "The message content",
          additional_kwargs: "Optional additional arguments",
          example: false
        }
      },
      toolFormat: {
        description: "LangChain tool definition format",
        structure: {
          name: "Name of the tool",
          description: "Description of what the tool does",
          args_schema: "Pydantic BaseModel defining the arguments",
          return_direct: "Whether to return the result directly",
          coroutine: "Async function implementation (implementation detail)"
        }
      }
    };
    
    const autogenSchema = {
      name: ProtocolType.AutoGen,
      messageFormat: {
        description: "AutoGen message format",
        structure: {
          content: "The message content",
          role: "The role sending the message (e.g., 'user', 'assistant')",
          name: "Optional name of the sender",
          tool_calls: "Optional tool calls to execute"
        }
      },
      toolFormat: {
        description: "AutoGen tool definition format",
        structure: {
          name: "Name of the tool function",
          description: "Description of what the tool does",
          parameters: "JSON Schema object describing the parameters"
        }
      }
    };
    
    this.protocolSchemas.set(ProtocolType.MCP, mcpSchema);
    this.protocolSchemas.set(ProtocolType.LangChain, langchainSchema);
    this.protocolSchemas.set(ProtocolType.AutoGen, autogenSchema);
  }
  
  /**
   * Translate a message from one protocol format to another
   */
  async translateMessage(
    message: any, 
    sourceProtocol: ProtocolType, 
    targetProtocol: ProtocolType
  ): Promise<any> {
    this.logger.info(`Translating message from ${sourceProtocol} to ${targetProtocol}`);
    
    // If source and target are the same, return the original message
    if (sourceProtocol === targetProtocol) {
      return message;
    }
    
    const sourceSchema = this.protocolSchemas.get(sourceProtocol);
    const targetSchema = this.protocolSchemas.get(targetProtocol);
    
    if (!sourceSchema || !targetSchema) {
      throw new Error(`Schema not found for ${!sourceSchema ? sourceProtocol : targetProtocol}`);
    }
    
    const prompt = `Translate the following ${sourceProtocol} message to the ${targetProtocol} format.
    
Source format (${sourceProtocol}):
${JSON.stringify(sourceSchema.messageFormat, null, 2)}

Target format (${targetProtocol}):
${JSON.stringify(targetSchema.messageFormat, null, 2)}

Make sure the translated message is valid according to the target protocol format. 
Return only the translated message as valid JSON without any explanations.`;
    
    try {
      const result = await this.translator.translate(message, prompt);
      
      // Emit event for observability
      this.emit('messageTranslated', {
        sourceProtocol,
        targetProtocol,
        originalMessage: message,
        translatedMessage: result
      });
      
      return result;
    } catch (error: any) {
      this.logger.error(`Message translation error: ${error.message}`);
      throw new Error(`Failed to translate message: ${error.message}`);
    }
  }
  
  /**
   * Translate a tool definition from one protocol format to another
   */
  async translateTool(
    tool: any, 
    sourceProtocol: ProtocolType, 
    targetProtocol: ProtocolType
  ): Promise<any> {
    this.logger.info(`Translating tool from ${sourceProtocol} to ${targetProtocol}`);
    
    // If source and target are the same, return the original tool
    if (sourceProtocol === targetProtocol) {
      return tool;
    }
    
    const sourceSchema = this.protocolSchemas.get(sourceProtocol);
    const targetSchema = this.protocolSchemas.get(targetProtocol);
    
    if (!sourceSchema || !targetSchema) {
      throw new Error(`Schema not found for ${!sourceSchema ? sourceProtocol : targetProtocol}`);
    }
    
    const prompt = `Translate the following ${sourceProtocol} tool definition to the ${targetProtocol} format.
    
Source format (${sourceProtocol}):
${JSON.stringify(sourceSchema.toolFormat, null, 2)}

Target format (${targetProtocol}):
${JSON.stringify(targetSchema.toolFormat, null, 2)}

Make sure the translated tool definition is valid according to the target protocol format.
Return only the translated tool definition as valid JSON without any explanations.`;
    
    try {
      const result = await this.translator.translate(tool, prompt);
      
      // Emit event for observability
      this.emit('toolTranslated', {
        sourceProtocol,
        targetProtocol,
        originalTool: tool,
        translatedTool: result
      });
      
      return result;
    } catch (error: any) {
      this.logger.error(`Tool translation error: ${error.message}`);
      throw new Error(`Failed to translate tool: ${error.message}`);
    }
  }
  
  /**
   * Translate a capability definition from one protocol format to another
   */
  async translateCapability(
    capability: any, 
    sourceProtocol: ProtocolType, 
    targetProtocol: ProtocolType
  ): Promise<any> {
    this.logger.info(`Translating capability from ${sourceProtocol} to ${targetProtocol}`);
    
    // If source and target are the same, return the original capability
    if (sourceProtocol === targetProtocol) {
      return capability;
    }
    
    const sourceSchema = this.protocolSchemas.get(sourceProtocol);
    const targetSchema = this.protocolSchemas.get(targetProtocol);
    
    if (!sourceSchema || !targetSchema) {
      throw new Error(`Schema not found for ${!sourceSchema ? sourceProtocol : targetProtocol}`);
    }
    
    // Not all protocols have capability formats, use what's available
    const sourceCapabilityFormat = sourceSchema.capabilityFormat || 
      { description: "Generic capability definition" };
    
    const targetCapabilityFormat = targetSchema.capabilityFormat || 
      { description: "Generic capability definition" };
    
    const prompt = `Translate the following ${sourceProtocol} capability definition to the ${targetProtocol} format.
    
Source format (${sourceProtocol}):
${JSON.stringify(sourceCapabilityFormat, null, 2)}

Target format (${targetProtocol}):
${JSON.stringify(targetCapabilityFormat, null, 2)}

Make sure the translated capability is valid according to the target protocol format.
Return only the translated capability as valid JSON without any explanations.`;
    
    try {
      const result = await this.translator.translate(capability, prompt);
      
      // Emit event for observability
      this.emit('capabilityTranslated', {
        sourceProtocol,
        targetProtocol,
        originalCapability: capability,
        translatedCapability: result
      });
      
      return result;
    } catch (error: any) {
      this.logger.error(`Capability translation error: ${error.message}`);
      throw new Error(`Failed to translate capability: ${error.message}`);
    }
  }
  
  /**
   * Train the translator on a new custom protocol format based on examples
   */
  async learnCustomProtocol(
    protocolName: string,
    examples: {
      messages?: Array<{ sample: any, explanation: string }>,
      capabilities?: Array<{ sample: any, explanation: string }>,
      tools?: Array<{ sample: any, explanation: string }>
    }
  ): Promise<void> {
    this.logger.info(`Learning new custom protocol: ${protocolName}`);
    
    // Create a schema for the new protocol
    const newSchema: any = {
      name: protocolName
    };
    
    // Process message examples if provided
    if (examples.messages && examples.messages.length > 0) {
      const messageSamples = examples.messages.map(e => 
        `Sample: ${JSON.stringify(e.sample, null, 2)}\nExplanation: ${e.explanation}`
      ).join('\n\n');
      
      const messagePrompt = `Based on the following examples of messages in the ${protocolName} protocol, 
create a structured schema that describes the message format.

${messageSamples}

Return a JSON object with a 'description' field explaining the format and a 'structure' field 
containing a map of key fields to their descriptions.`;
      
      try {
        const messageSchema = await this.translator.translate({}, messagePrompt);
        newSchema.messageFormat = messageSchema;
      } catch (error) {
        this.logger.error(`Failed to create message schema for ${protocolName}`);
      }
    }
    
    // Process tool examples if provided
    if (examples.tools && examples.tools.length > 0) {
      const toolSamples = examples.tools.map(e => 
        `Sample: ${JSON.stringify(e.sample, null, 2)}\nExplanation: ${e.explanation}`
      ).join('\n\n');
      
      const toolPrompt = `Based on the following examples of tools in the ${protocolName} protocol, 
create a structured schema that describes the tool definition format.

${toolSamples}

Return a JSON object with a 'description' field explaining the format and a 'structure' field 
containing a map of key fields to their descriptions.`;
      
      try {
        const toolSchema = await this.translator.translate({}, toolPrompt);
        newSchema.toolFormat = toolSchema;
      } catch (error) {
        this.logger.error(`Failed to create tool schema for ${protocolName}`);
      }
    }
    
    // Process capability examples if provided
    if (examples.capabilities && examples.capabilities.length > 0) {
      const capabilitySamples = examples.capabilities.map(e => 
        `Sample: ${JSON.stringify(e.sample, null, 2)}\nExplanation: ${e.explanation}`
      ).join('\n\n');
      
      const capabilityPrompt = `Based on the following examples of capabilities in the ${protocolName} protocol, 
create a structured schema that describes the capability definition format.

${capabilitySamples}

Return a JSON object with a 'description' field explaining the format and a 'structure' field 
containing a map of key fields to their descriptions.`;
      
      try {
        const capabilitySchema = await this.translator.translate({}, capabilityPrompt);
        newSchema.capabilityFormat = capabilitySchema;
      } catch (error) {
        this.logger.error(`Failed to create capability schema for ${protocolName}`);
      }
    }
    
    // Add the new protocol schema to our collection
    this.protocolSchemas.set(protocolName, newSchema);
    
    // Emit event for observability
    this.emit('protocolLearned', {
      name: protocolName,
      schema: newSchema
    });
  }
  
  /**
   * Update protocol information from the web
   */
  async updateProtocolInformation(protocolType: ProtocolType): Promise<void> {
    this.logger.info(`Updating information for ${protocolType} protocol`);
    
    try {
      const updatedInfo = await this.translator.searchProtocolInformation(protocolType);
      
      // Update the existing schema with new information
      const existingSchema = this.protocolSchemas.get(protocolType) || {
        name: protocolType
      };
      
      // Merge in the updated information, prioritizing new data
      this.protocolSchemas.set(protocolType, {
        ...existingSchema,
        ...updatedInfo,
        lastUpdated: new Date().toISOString()
      });
      
      this.logger.info(`Successfully updated ${protocolType} protocol information`);
    } catch (error: any) {
      this.logger.error(`Failed to update protocol information: ${error.message}`);
      throw new Error(`Failed to update protocol information: ${error.message}`);
    }
  }
  
  /**
   * Dynamically translate between protocols based on descriptions
   */
  async dynamicTranslate(
    source: any,
    sourceProtocolInfo: { name: string, description: string, examples?: any[] },
    targetProtocolInfo: { name: string, description: string, examples?: any[] }
  ): Promise<any> {
    this.logger.info(`Dynamic translation from ${sourceProtocolInfo.name} to ${targetProtocolInfo.name}`);
    
    // Construct prompt using protocol descriptions and examples
    let prompt = `Translate the following data from ${sourceProtocolInfo.name} format to ${targetProtocolInfo.name} format.

Source format (${sourceProtocolInfo.name}): 
${sourceProtocolInfo.description}

Target format (${targetProtocolInfo.name}):
${targetProtocolInfo.description}`;
    
    // Add examples if provided
    if (sourceProtocolInfo.examples && sourceProtocolInfo.examples.length > 0) {
      prompt += `\n\nSource format examples:\n${JSON.stringify(sourceProtocolInfo.examples, null, 2)}`;
    }
    
    if (targetProtocolInfo.examples && targetProtocolInfo.examples.length > 0) {
      prompt += `\n\nTarget format examples:\n${JSON.stringify(targetProtocolInfo.examples, null, 2)}`;
    }
    
    prompt += `\n\nAnalyze the source data structure and convert it to match the target format.
Return only the translated data as valid JSON without any explanations.`;
    
    try {
      const result = await this.translator.translate(source, prompt);
      
      // Emit event for observability
      this.emit('dynamicTranslation', {
        sourceProtocol: sourceProtocolInfo.name,
        targetProtocol: targetProtocolInfo.name,
        originalData: source,
        translatedData: result
      });
      
      return result;
    } catch (error: any) {
      this.logger.error(`Dynamic translation error: ${error.message}`);
      throw new Error(`Failed to perform dynamic translation: ${error.message}`);
    }
  }
}