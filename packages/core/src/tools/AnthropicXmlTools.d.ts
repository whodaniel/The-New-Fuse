/**
 * Anthropic XML Tools Service
 *
 * This service provides tools for working with Anthropic's XML-style function calling format.
 */
export declare class AnthropicXmlTools {
    private logger;
    private adapter;
    constructor();
    /**
     * Parse an Anthropic XML function call
     * @param xmlString XML function call string
     * @returns Parsed function call
     */
    parseXmlFunctionCall(xmlString: string): Promise<any>;
    /**
     * Create an Anthropic XML function call
     * @param functionName Function name
     * @param parameters Function parameters
     * @returns XML function call string
     */
    createXmlFunctionCall(functionName: string, parameters: Record<string, any>): Promise<string>;
    /**
     * Create an Anthropic XML function call response
     * @param functionName Function name
     * @param content Response content
     * @returns XML function call response string
     */
    createXmlFunctionCallResponse(functionName: string, content: any): string;
    /**
     * Parse an Anthropic XML function call response
     * @param xmlString XML function call response string
     * @returns Parsed function call response
     */
    parseXmlFunctionCallResponse(xmlString: string): any;
    /**
     * Convert a tool definition to Anthropic XML format
     * @param tool Tool definition
     * @returns XML tool definition
     */
    convertToolToXmlFormat(tool: {
        name: string;
        description: string;
        parameters: Record<string, any>;
    }): string;
    /**
     * Convert multiple tool definitions to Anthropic XML format
     * @param tools Tool definitions
     * @returns XML tool definitions
     */
    convertToolsToXmlFormat(tools: Array<{
        name: string;
        description: string;
        parameters: Record<string, any>;
    }>): string;
}
