"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAnthropicXmlTools = registerAnthropicXmlTools;
const zod_1 = require("zod");
const AnthropicXmlTools_1 = require("../../../packages/core/src/tools/AnthropicXmlTools");
/**
 * Register Anthropic XML tools with the MCP server
 * @param mcpServer MCP server instance
 * @param logger Logger instance
 */
function registerAnthropicXmlTools(mcpServer, logger) {
    const anthropicXmlTools = new AnthropicXmlTools_1.AnthropicXmlTools();
    // Register parseXmlFunctionCall tool
    mcpServer.registerTool('anthropic.parseXmlFunctionCall', {
        description: 'Parse an Anthropic XML function call',
        parameters: zod_1.z.object({
            xmlString: zod_1.z.string().describe('XML function call string'),
        }),
        execute: async (params) => {
            try {
                return await anthropicXmlTools.parseXmlFunctionCall(params.xmlString);
            }
            catch (error) {
                logger.error(`Error parsing XML function call: ${error.message}`);
                throw new Error(`Failed to parse XML function call: ${error.message}`);
            }
        },
    });
    // Register createXmlFunctionCall tool
    mcpServer.registerTool('anthropic.createXmlFunctionCall', {
        description: 'Create an Anthropic XML function call',
        parameters: zod_1.z.object({
            functionName: zod_1.z.string().describe('Function name'),
            parameters: zod_1.z.record(zod_1.z.any()).describe('Function parameters'),
        }),
        execute: async (params) => {
            try {
                return await anthropicXmlTools.createXmlFunctionCall(params.functionName, params.parameters);
            }
            catch (error) {
                logger.error(`Error creating XML function call: ${error.message}`);
                throw new Error(`Failed to create XML function call: ${error.message}`);
            }
        },
    });
    // Register createXmlFunctionCallResponse tool
    mcpServer.registerTool('anthropic.createXmlFunctionCallResponse', {
        description: 'Create an Anthropic XML function call response',
        parameters: zod_1.z.object({
            functionName: zod_1.z.string().describe('Function name'),
            content: zod_1.z.any().describe('Response content'),
        }),
        execute: (params) => {
            try {
                return anthropicXmlTools.createXmlFunctionCallResponse(params.functionName, params.content);
            }
            catch (error) {
                logger.error(`Error creating XML function call response: ${error.message}`);
                throw new Error(`Failed to create XML function call response: ${error.message}`);
            }
        },
    });
    // Register parseXmlFunctionCallResponse tool
    mcpServer.registerTool('anthropic.parseXmlFunctionCallResponse', {
        description: 'Parse an Anthropic XML function call response',
        parameters: zod_1.z.object({
            xmlString: zod_1.z.string().describe('XML function call response string'),
        }),
        execute: (params) => {
            try {
                return anthropicXmlTools.parseXmlFunctionCallResponse(params.xmlString);
            }
            catch (error) {
                logger.error(`Error parsing XML function call response: ${error.message}`);
                throw new Error(`Failed to parse XML function call response: ${error.message}`);
            }
        },
    });
    // Register convertToolToXmlFormat tool
    mcpServer.registerTool('anthropic.convertToolToXmlFormat', {
        description: 'Convert a tool definition to Anthropic XML format',
        parameters: zod_1.z.object({
            tool: zod_1.z.object({
                name: zod_1.z.string().describe('Tool name'),
                description: zod_1.z.string().describe('Tool description'),
                parameters: zod_1.z.record(zod_1.z.any()).describe('Tool parameters'),
            }).describe('Tool definition'),
        }),
        execute: (params) => {
            try {
                return anthropicXmlTools.convertToolToXmlFormat(params.tool);
            }
            catch (error) {
                logger.error(`Error converting tool to XML format: ${error.message}`);
                throw new Error(`Failed to convert tool to XML format: ${error.message}`);
            }
        },
    });
    // Register convertToolsToXmlFormat tool
    mcpServer.registerTool('anthropic.convertToolsToXmlFormat', {
        description: 'Convert multiple tool definitions to Anthropic XML format',
        parameters: zod_1.z.object({
            tools: zod_1.z.array(zod_1.z.object({
                name: zod_1.z.string().describe('Tool name'),
                description: zod_1.z.string().describe('Tool description'),
                parameters: zod_1.z.record(zod_1.z.any()).describe('Tool parameters'),
            })).describe('Tool definitions'),
        }),
        execute: (params) => {
            try {
                return anthropicXmlTools.convertToolsToXmlFormat(params.tools);
            }
            catch (error) {
                logger.error(`Error converting tools to XML format: ${error.message}`);
                throw new Error(`Failed to convert tools to XML format: ${error.message}`);
            }
        },
    });
    logger.info('Registered Anthropic XML tools');
}
//# sourceMappingURL=anthropic-xml-tools.js.map