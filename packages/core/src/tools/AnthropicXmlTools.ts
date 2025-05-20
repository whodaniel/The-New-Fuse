import { z } from 'zod';
import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger.js';
import { AnthropicXmlAdapter } from '../protocols/adapters/AnthropicXmlAdapter.js';

/**
 * Anthropic XML Tools Service
 * 
 * This service provides tools for working with Anthropic's XML-style function calling format.
 */
@Injectable()
export class AnthropicXmlTools {
  private logger = new Logger(AnthropicXmlTools.name);
  private adapter: AnthropicXmlAdapter;

  constructor() {
    this.adapter = new AnthropicXmlAdapter();
  }

  /**
   * Parse an Anthropic XML function call
   * @param xmlString XML function call string
   * @returns Parsed function call
   */
  async parseXmlFunctionCall(xmlString: string): Promise<any> {
    try {
      const message = await this.adapter.adaptMessage(xmlString as any, 'a2a-v2.0');
      return {
        name: message.header.type,
        parameters: message.body.content,
      };
    } catch (error) {
      this.logger.error(`Error parsing XML function call: ${error.message}`);
      throw new Error(`Failed to parse XML function call: ${error.message}`);
    }
  }

  /**
   * Create an Anthropic XML function call
   * @param functionName Function name
   * @param parameters Function parameters
   * @returns XML function call string
   */
  async createXmlFunctionCall(functionName: string, parameters: Record<string, any>): Promise<string> {
    try {
      const message = {
        header: {
          id: crypto.randomUUID(),
          type: functionName,
          version: '2.0',
          priority: 'medium',
          source: 'anthropic-xml-tools',
          target: undefined,
        },
        body: {
          content: parameters,
          metadata: {
            sent_at: Date.now(),
            timeout: undefined,
            retries: undefined,
            trace_id: crypto.randomUUID(),
          },
        },
      };

      return await this.adapter.adaptMessage(message, 'anthropic-xml-v1.0') as string;
    } catch (error) {
      this.logger.error(`Error creating XML function call: ${error.message}`);
      throw new Error(`Failed to create XML function call: ${error.message}`);
    }
  }

  /**
   * Create an Anthropic XML function call response
   * @param functionName Function name
   * @param content Response content
   * @returns XML function call response string
   */
  createXmlFunctionCallResponse(functionName: string, content: any): string {
    return this.adapter.createFunctionCallResponse(functionName, content);
  }

  /**
   * Parse an Anthropic XML function call response
   * @param xmlString XML function call response string
   * @returns Parsed function call response
   */
  parseXmlFunctionCallResponse(xmlString: string): any {
    return this.adapter.parseFunctionCallResponse(xmlString);
  }

  /**
   * Convert a tool definition to Anthropic XML format
   * @param tool Tool definition
   * @returns XML tool definition
   */
  convertToolToXmlFormat(tool: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  }): string {
    let xmlString = '<function>\n';
    xmlString += `{"description": "${tool.description}", "name": "${tool.name}", "parameters": `;
    
    // Convert parameters to JSON string
    xmlString += JSON.stringify({
      properties: tool.parameters,
      required: Object.keys(tool.parameters).filter(key => 
        tool.parameters[key].required === true
      ),
      type: 'object',
    });
    
    xmlString += '}\n</function>';
    
    return xmlString;
  }

  /**
   * Convert multiple tool definitions to Anthropic XML format
   * @param tools Tool definitions
   * @returns XML tool definitions
   */
  convertToolsToXmlFormat(tools: Array<{
    name: string;
    description: string;
    parameters: Record<string, any>;
  }>): string {
    let xmlString = '<functions>\n';
    
    for (const tool of tools) {
      xmlString += this.convertToolToXmlFormat(tool) + '\n';
    }
    
    xmlString += '</functions>';
    
    return xmlString;
  }
}
