import { z } from 'zod';
import { Logger } from '../utils/logger.js';
import { AnthropicXmlTools } from '../../../packages/core/src/tools/AnthropicXmlTools.js';

/**
 * Register Anthropic XML tools with the MCP server
 * @param mcpServer MCP server instance
 * @param logger Logger instance
 */
export function registerAnthropicXmlTools(mcpServer: any, logger: Logger) {
  const anthropicXmlTools = new AnthropicXmlTools();

  // Register parseXmlFunctionCall tool
  mcpServer.registerTool('anthropic.parseXmlFunctionCall', {
    description: 'Parse an Anthropic XML function call',
    parameters: z.object({
      xmlString: z.string().describe('XML function call string'),
    }),
    execute: async (params: { xmlString: string }) => {
      try {
        return await anthropicXmlTools.parseXmlFunctionCall(params.xmlString);
      } catch (error) {
        logger.error(`Error parsing XML function call: ${error.message}`);
        throw new Error(`Failed to parse XML function call: ${error.message}`);
      }
    },
  });

  // Register createXmlFunctionCall tool
  mcpServer.registerTool('anthropic.createXmlFunctionCall', {
    description: 'Create an Anthropic XML function call',
    parameters: z.object({
      functionName: z.string().describe('Function name'),
      parameters: z.record(z.any()).describe('Function parameters'),
    }),
    execute: async (params: { functionName: string; parameters: Record<string, any> }) => {
      try {
        return await anthropicXmlTools.createXmlFunctionCall(
          params.functionName,
          params.parameters
        );
      } catch (error) {
        logger.error(`Error creating XML function call: ${error.message}`);
        throw new Error(`Failed to create XML function call: ${error.message}`);
      }
    },
  });

  // Register createXmlFunctionCallResponse tool
  mcpServer.registerTool('anthropic.createXmlFunctionCallResponse', {
    description: 'Create an Anthropic XML function call response',
    parameters: z.object({
      functionName: z.string().describe('Function name'),
      content: z.any().describe('Response content'),
    }),
    execute: (params: { functionName: string; content: any }) => {
      try {
        return anthropicXmlTools.createXmlFunctionCallResponse(
          params.functionName,
          params.content
        );
      } catch (error) {
        logger.error(`Error creating XML function call response: ${error.message}`);
        throw new Error(`Failed to create XML function call response: ${error.message}`);
      }
    },
  });

  // Register parseXmlFunctionCallResponse tool
  mcpServer.registerTool('anthropic.parseXmlFunctionCallResponse', {
    description: 'Parse an Anthropic XML function call response',
    parameters: z.object({
      xmlString: z.string().describe('XML function call response string'),
    }),
    execute: (params: { xmlString: string }) => {
      try {
        return anthropicXmlTools.parseXmlFunctionCallResponse(params.xmlString);
      } catch (error) {
        logger.error(`Error parsing XML function call response: ${error.message}`);
        throw new Error(`Failed to parse XML function call response: ${error.message}`);
      }
    },
  });

  // Register convertToolToXmlFormat tool
  mcpServer.registerTool('anthropic.convertToolToXmlFormat', {
    description: 'Convert a tool definition to Anthropic XML format',
    parameters: z.object({
      tool: z.object({
        name: z.string().describe('Tool name'),
        description: z.string().describe('Tool description'),
        parameters: z.record(z.any()).describe('Tool parameters'),
      }).describe('Tool definition'),
    }),
    execute: (params: {
      tool: {
        name: string;
        description: string;
        parameters: Record<string, any>;
      };
    }) => {
      try {
        return anthropicXmlTools.convertToolToXmlFormat(params.tool);
      } catch (error) {
        logger.error(`Error converting tool to XML format: ${error.message}`);
        throw new Error(`Failed to convert tool to XML format: ${error.message}`);
      }
    },
  });

  // Register convertToolsToXmlFormat tool
  mcpServer.registerTool('anthropic.convertToolsToXmlFormat', {
    description: 'Convert multiple tool definitions to Anthropic XML format',
    parameters: z.object({
      tools: z.array(
        z.object({
          name: z.string().describe('Tool name'),
          description: z.string().describe('Tool description'),
          parameters: z.record(z.any()).describe('Tool parameters'),
        })
      ).describe('Tool definitions'),
    }),
    execute: (params: {
      tools: Array<{
        name: string;
        description: string;
        parameters: Record<string, any>;
      }>;
    }) => {
      try {
        return anthropicXmlTools.convertToolsToXmlFormat(params.tools);
      } catch (error) {
        logger.error(`Error converting tools to XML format: ${error.message}`);
        throw new Error(`Failed to convert tools to XML format: ${error.message}`);
      }
    },
  });

  logger.info('Registered Anthropic XML tools');
}
