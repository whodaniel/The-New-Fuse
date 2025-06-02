import { A2AMessage } from '../A2AProtocolHandler.js';
/**
 * Anthropic XML Function Call Response
 */
interface AnthropicXmlFunctionCallResponse {
    name: string;
    content: any;
}
/**
 * Anthropic XML Protocol Adapter
 *
 * This adapter implements the Anthropic XML-style function calling format,
 * which is used by Anthropic's Claude models. Functions are called using XML tags.
 *
 * Example format:
 * <function_calls>
 * <invoke name="function_name">
 * <parameter name="param_name">param_value</parameter>
 * </invoke>
 * </function_calls>
 */
export declare class AnthropicXmlAdapter {
    private logger;
    readonly name = "anthropic-xml-adapter";
    readonly version = "1.0.0";
    readonly supportedProtocols: string[];
    /**
     * Check if this adapter can handle the given protocol
     * @param protocol Protocol identifier
     * @returns True if the adapter can handle the protocol
     */
    canHandle(protocol: string): boolean;
    /**
     * Adapt a message between protocols
     * @param message Message to adapt
     * @param targetProtocol Target protocol
     * @returns Adapted message
     */
    adaptMessage(message: A2AMessage, targetProtocol: string): Promise<string | A2AMessage>;
    /**
     * Convert a standard A2A message to Anthropic XML format
     * @param message A2A message
     * @returns Anthropic XML formatted string
     */
    private convertToAnthropicXmlFormat;
    /**
     * Convert an Anthropic XML formatted string to standard A2A format
     * @param xmlString Anthropic XML formatted string
     * @returns A2A message
     */
    private convertFromAnthropicXmlFormat;
    /**
     * Parse XML function call string to extract function name and parameters
     * @param xmlString XML function call string
     * @returns Function call information
     */
    private parseXmlFunctionCall;
    /**
     * Create an Anthropic XML function call response
     * @param functionName Function name
     * @param content Response content
     * @returns XML formatted response string
     */
    createFunctionCallResponse(functionName: string, content: any): string;
    /**
     * Parse an Anthropic XML function call response
     * @param xmlString XML formatted response string
     * @returns Function call response information
     */
    parseFunctionCallResponse(xmlString: string): AnthropicXmlFunctionCallResponse;
}
export {};
