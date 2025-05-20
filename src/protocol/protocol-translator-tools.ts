import { z } from 'zod';
import { LLMProtocolTranslator, ProtocolType, ProtocolBridge } from './llm-protocol-translator.js';
import { Logger } from '../utils/logger.js';

// Tool schemas for the Protocol Translator MCP tools
export const translateMessageSchema = z.object({
  message: z.any().describe('The message to translate'),
  sourceProtocol: z.enum(Object.values(ProtocolType) as [string, ...string[]]).describe('The source protocol format'),
  targetProtocol: z.enum(Object.values(ProtocolType) as [string, ...string[]]).describe('The target protocol format')
});

export const translateCapabilitySchema = z.object({
  capability: z.any().describe('The capability to translate'),
  sourceProtocol: z.enum(Object.values(ProtocolType) as [string, ...string[]]).describe('The source protocol format'),
  targetProtocol: z.enum(Object.values(ProtocolType) as [string, ...string[]]).describe('The target protocol format')
});

export const translateToolSchema = z.object({
  tool: z.any().describe('The tool definition to translate'),
  sourceProtocol: z.enum(Object.values(ProtocolType) as [string, ...string[]]).describe('The source protocol format'),
  targetProtocol: z.enum(Object.values(ProtocolType) as [string, ...string[]]).describe('The target protocol format')
});

export const learnCustomProtocolSchema = z.object({
  protocolName: z.string().describe('Name of the custom protocol to learn'),
  messageExamples: z.array(
    z.object({
      sample: z.any().describe('Sample message in the custom protocol format'),
      explanation: z.string().describe('Explanation of the message format')
    })
  ).optional().describe('Examples of messages in the custom protocol'),
  capabilityExamples: z.array(
    z.object({
      sample: z.any().describe('Sample capability in the custom protocol format'),
      explanation: z.string().describe('Explanation of the capability format')
    })
  ).optional().describe('Examples of capabilities in the custom protocol'),
  toolExamples: z.array(
    z.object({
      sample: z.any().describe('Sample tool in the custom protocol format'),
      explanation: z.string().describe('Explanation of the tool format')
    })
  ).optional().describe('Examples of tools in the custom protocol')
});

export const updateProtocolInfoSchema = z.object({
  protocol: z.enum(Object.values(ProtocolType) as [string, ...string[]]).describe('The protocol to update information for')
});

export const dynamicTranslateSchema = z.object({
  source: z.any().describe('The source data to translate'),
  sourceProtocolInfo: z.object({
    name: z.string().describe('Name of the source protocol'),
    description: z.string().describe('Description of the source protocol'),
    examples: z.array(z.any()).optional().describe('Examples of the source protocol format')
  }).describe('Information about the source protocol'),
  targetProtocolInfo: z.object({
    name: z.string().describe('Name of the target protocol'),
    description: z.string().describe('Description of the target protocol'),
    examples: z.array(z.any()).optional().describe('Examples of the target protocol format')
  }).describe('Information about the target protocol')
});

/**
 * Protocol Translator Tools for MCP integration
 */
export class ProtocolTranslatorTools {
  private protocolBridge: ProtocolBridge;
  private logger: Logger;

  constructor(config: {
    llmApiKey: string,
    llmOrganization?: string,
    logger?: Logger,
    cacheEnabled?: boolean
  }) {
    this.logger = config.logger || new Logger('ProtocolTranslatorTools');
    
    this.protocolBridge = new ProtocolBridge({
      llmApiKey: config.llmApiKey,
      llmOrganization: config.llmOrganization,
      logger: this.logger,
      cacheEnabled: config.cacheEnabled
    });
    
    // Set up logging for translation events
    this.protocolBridge.on('messageTranslated', (data) => {
      this.logger.info(`Translated message from ${data.sourceProtocol} to ${data.targetProtocol}`);
    });
    
    this.protocolBridge.on('capabilityTranslated', (data) => {
      this.logger.info(`Translated capability from ${data.sourceProtocol} to ${data.targetProtocol}`);
    });
    
    this.protocolBridge.on('toolTranslated', (data) => {
      this.logger.info(`Translated tool from ${data.sourceProtocol} to ${data.targetProtocol}`);
    });
    
    this.protocolBridge.on('protocolLearned', (data) => {
      this.logger.info(`Learned new protocol: ${data.name}`);
    });
  }

  /**
   * Translate a message between protocols
   */
  async translateMessage(params: z.infer<typeof translateMessageSchema>, context: any) {
    this.logger.info(`[translateMessage] Agent ${context.agentId} requested message translation from ${params.sourceProtocol} to ${params.targetProtocol}`);
    
    try {
      const result = await this.protocolBridge.translateMessage(
        params.message,
        params.sourceProtocol as ProtocolType,
        params.targetProtocol as ProtocolType
      );
      
      this.logger.info(`[translateMessage] Successfully translated message`);
      return {
        success: true,
        translatedMessage: result,
        sourceProtocol: params.sourceProtocol,
        targetProtocol: params.targetProtocol
      };
    } catch (error: any) {
      this.logger.error(`[translateMessage] Error translating message:`, error);
      return {
        success: false,
        error: error.message || 'Unknown error during translation',
        sourceProtocol: params.sourceProtocol,
        targetProtocol: params.targetProtocol
      };
    }
  }

  /**
   * Translate a capability between protocols
   */
  async translateCapability(params: z.infer<typeof translateCapabilitySchema>, context: any) {
    this.logger.info(`[translateCapability] Agent ${context.agentId} requested capability translation from ${params.sourceProtocol} to ${params.targetProtocol}`);
    
    try {
      const result = await this.protocolBridge.translateCapability(
        params.capability,
        params.sourceProtocol as ProtocolType,
        params.targetProtocol as ProtocolType
      );
      
      this.logger.info(`[translateCapability] Successfully translated capability`);
      return {
        success: true,
        translatedCapability: result,
        sourceProtocol: params.sourceProtocol,
        targetProtocol: params.targetProtocol
      };
    } catch (error: any) {
      this.logger.error(`[translateCapability] Error translating capability:`, error);
      return {
        success: false,
        error: error.message || 'Unknown error during translation',
        sourceProtocol: params.sourceProtocol,
        targetProtocol: params.targetProtocol
      };
    }
  }

  /**
   * Translate a tool definition between protocols
   */
  async translateTool(params: z.infer<typeof translateToolSchema>, context: any) {
    this.logger.info(`[translateTool] Agent ${context.agentId} requested tool translation from ${params.sourceProtocol} to ${params.targetProtocol}`);
    
    try {
      const result = await this.protocolBridge.translateTool(
        params.tool,
        params.sourceProtocol as ProtocolType,
        params.targetProtocol as ProtocolType
      );
      
      this.logger.info(`[translateTool] Successfully translated tool`);
      return {
        success: true,
        translatedTool: result,
        sourceProtocol: params.sourceProtocol,
        targetProtocol: params.targetProtocol
      };
    } catch (error: any) {
      this.logger.error(`[translateTool] Error translating tool:`, error);
      return {
        success: false,
        error: error.message || 'Unknown error during translation',
        sourceProtocol: params.sourceProtocol,
        targetProtocol: params.targetProtocol
      };
    }
  }

  /**
   * Learn a new custom protocol from examples
   */
  async learnCustomProtocol(params: z.infer<typeof learnCustomProtocolSchema>, context: any) {
    this.logger.info(`[learnCustomProtocol] Agent ${context.agentId} requested to learn custom protocol: ${params.protocolName}`);
    
    try {
      await this.protocolBridge.learnCustomProtocol(params.protocolName, {
        messages: params.messageExamples,
        capabilities: params.capabilityExamples,
        tools: params.toolExamples
      });
      
      this.logger.info(`[learnCustomProtocol] Successfully learned protocol: ${params.protocolName}`);
      return {
        success: true,
        protocolName: params.protocolName,
        message: `Successfully learned protocol: ${params.protocolName}`
      };
    } catch (error: any) {
      this.logger.error(`[learnCustomProtocol] Error learning protocol:`, error);
      return {
        success: false,
        protocolName: params.protocolName,
        error: error.message || 'Unknown error learning custom protocol'
      };
    }
  }

  /**
   * Update protocol information from web search
   */
  async updateProtocolInfo(params: z.infer<typeof updateProtocolInfoSchema>, context: any) {
    this.logger.info(`[updateProtocolInfo] Agent ${context.agentId} requested to update protocol info for: ${params.protocol}`);
    
    try {
      await this.protocolBridge.updateProtocolInformation(params.protocol as ProtocolType);
      
      this.logger.info(`[updateProtocolInfo] Successfully updated protocol information: ${params.protocol}`);
      return {
        success: true,
        protocol: params.protocol,
        message: `Successfully updated protocol information for ${params.protocol}`
      };
    } catch (error: any) {
      this.logger.error(`[updateProtocolInfo] Error updating protocol information:`, error);
      return {
        success: false,
        protocol: params.protocol,
        error: error.message || 'Unknown error updating protocol information'
      };
    }
  }

  /**
   * Dynamically translate between unknown protocols
   */
  async dynamicTranslate(params: z.infer<typeof dynamicTranslateSchema>, context: any) {
    this.logger.info(`[dynamicTranslate] Agent ${context.agentId} requested dynamic translation from ${params.sourceProtocolInfo.name} to ${params.targetProtocolInfo.name}`);
    
    try {
      const result = await this.protocolBridge.dynamicTranslate(
        params.source,
        params.sourceProtocolInfo,
        params.targetProtocolInfo
      );
      
      this.logger.info(`[dynamicTranslate] Successfully performed dynamic translation`);
      return {
        success: true,
        translatedData: result,
        sourceProtocol: params.sourceProtocolInfo.name,
        targetProtocol: params.targetProtocolInfo.name
      };
    } catch (error: any) {
      this.logger.error(`[dynamicTranslate] Error in dynamic translation:`, error);
      return {
        success: false,
        error: error.message || 'Unknown error during dynamic translation',
        sourceProtocol: params.sourceProtocolInfo.name,
        targetProtocol: params.targetProtocolInfo.name
      };
    }
  }
}