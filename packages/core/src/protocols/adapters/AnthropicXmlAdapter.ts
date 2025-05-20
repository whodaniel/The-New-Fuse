import { Injectable } from '@nestjs/common';
import { Logger } from '../../utils/logger.js';
import { A2AMessage, A2AMessageContent } from '../A2AProtocolHandler.js';

/**
 * Anthropic XML Function Call Interface
 */
interface AnthropicXmlFunctionCall {
  name: string;
  parameters: Record<string, any>;
}

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
@Injectable()
export class AnthropicXmlAdapter {
  private logger = new Logger(AnthropicXmlAdapter.name);

  readonly name = 'anthropic-xml-adapter';
  readonly version = '1.0.0';
  readonly supportedProtocols = ['a2a-v2.0', 'anthropic-xml-v1.0'];

  /**
   * Check if this adapter can handle the given protocol
   * @param protocol Protocol identifier
   * @returns True if the adapter can handle the protocol
   */
  canHandle(protocol: string): boolean {
    return this.supportedProtocols.includes(protocol);
  }

  /**
   * Adapt a message between protocols
   * @param message Message to adapt
   * @param targetProtocol Target protocol
   * @returns Adapted message
   */
  async adaptMessage(message: A2AMessage, targetProtocol: string): Promise<string | A2AMessage> {
    if (targetProtocol === 'anthropic-xml-v1.0') {
      return this.convertToAnthropicXmlFormat(message);
    } else if (targetProtocol === 'a2a-v2.0') {
      return this.convertFromAnthropicXmlFormat(message as unknown as string);
    }
    throw new Error(`Unsupported target protocol: ${targetProtocol}`);
  }

  /**
   * Convert a standard A2A message to Anthropic XML format
   * @param message A2A message
   * @returns Anthropic XML formatted string
   */
  private convertToAnthropicXmlFormat(message: A2AMessage): string {
    // Extract function call information from A2A message
    const functionName = message.header.type;
    const parameters = message.body.content;

    // Build XML string
    let xmlString = '<function_calls>\n';
    xmlString += `<invoke name="${functionName}">\n`;
    
    // Add parameters
    for (const [key, value] of Object.entries(parameters)) {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      xmlString += `<parameter name="${key}">${stringValue}</parameter>\n`;
    }
    
    xmlString += '</invoke>\n';
    xmlString += '</function_calls>';
    
    return xmlString;
  }

  /**
   * Convert an Anthropic XML formatted string to standard A2A format
   * @param xmlString Anthropic XML formatted string
   * @returns A2A message
   */
  private convertFromAnthropicXmlFormat(xmlString: string): A2AMessage {
    // Parse XML string to extract function call information
    const functionCall = this.parseXmlFunctionCall(xmlString);
    
    // Create A2A message
    return {
      header: {
        id: crypto.randomUUID(),
        type: functionCall.name,
        version: '2.0',
        priority: 'medium',
        source: 'anthropic-xml-adapter',
        target: undefined,
      },
      body: {
        content: functionCall.parameters,
        metadata: {
          sent_at: Date.now(),
          timeout: undefined,
          retries: undefined,
          trace_id: crypto.randomUUID(),
        },
      },
    };
  }

  /**
   * Parse XML function call string to extract function name and parameters
   * @param xmlString XML function call string
   * @returns Function call information
   */
  private parseXmlFunctionCall(xmlString: string): AnthropicXmlFunctionCall {
    // Simple regex-based parsing for demonstration
    // In a production environment, use a proper XML parser
    
    // Extract function name
    const functionNameMatch = xmlString.match(/<invoke name="([^"]+)">/);
    if (!functionNameMatch) {
      throw new Error('Invalid XML function call: missing function name');
    }
    const functionName = functionNameMatch[1];
    
    // Extract parameters
    const parameters: Record<string, any> = {};
    const parameterRegex = /<parameter name="([^"]+)">([^<]+)<\/parameter>/g;
    let match;
    
    while ((match = parameterRegex.exec(xmlString)) !== null) {
      const paramName = match[1];
      const paramValue = match[2];
      
      // Try to parse as JSON if it looks like an object or array
      if ((paramValue.startsWith('{') && paramValue.endsWith('}')) || 
          (paramValue.startsWith('[') && paramValue.endsWith(']'))) {
        try {
          parameters[paramName] = JSON.parse(paramValue);
        } catch (e) {
          parameters[paramName] = paramValue;
        }
      } else {
        parameters[paramName] = paramValue;
      }
    }
    
    return {
      name: functionName,
      parameters,
    };
  }

  /**
   * Create an Anthropic XML function call response
   * @param functionName Function name
   * @param content Response content
   * @returns XML formatted response string
   */
  createFunctionCallResponse(functionName: string, content: any): string {
    const contentString = typeof content === 'object' ? JSON.stringify(content) : String(content);
    
    return `<function_results>\n<${functionName}>${contentString}</${functionName}>\n</function_results>`;
  }

  /**
   * Parse an Anthropic XML function call response
   * @param xmlString XML formatted response string
   * @returns Function call response information
   */
  parseFunctionCallResponse(xmlString: string): AnthropicXmlFunctionCallResponse {
    // Extract function name and content using regex
    // In a production environment, use a proper XML parser
    const match = xmlString.match(/<function_results>\s*<([^>]+)>(.*)<\/\1>\s*<\/function_results>/s);
    
    if (!match) {
      throw new Error('Invalid XML function call response');
    }
    
    const functionName = match[1];
    const contentString = match[2];
    
    // Try to parse content as JSON if it looks like an object or array
    let content: any = contentString;
    if ((contentString.startsWith('{') && contentString.endsWith('}')) || 
        (contentString.startsWith('[') && contentString.endsWith(']'))) {
      try {
        content = JSON.parse(contentString);
      } catch (e) {
        // Keep as string if parsing fails
      }
    }
    
    return {
      name: functionName,
      content,
    };
  }
}
