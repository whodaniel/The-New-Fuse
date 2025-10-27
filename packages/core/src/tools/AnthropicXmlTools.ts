import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/LoggingUtils_clean';
import { Tool } from './types';

@Injectable()
export class AnthropicXmlTools {
  private readonly logger = new Logger(AnthropicXmlTools.name);

  convertToolToXmlFormat(tool: Tool): string {
    let xmlString = '<function_description>\n';
    xmlString += `  <function_name>${tool.name}</function_name>\n`;
    xmlString += `  <description>${tool.description}</description>\n`;
    if (tool.parameters) {
      xmlString += '  <parameters>\n';
      for (const param of tool.parameters) {
        xmlString += `    <parameter>\n`;
        xmlString += `      <name>${param.name}</name>\n`;
        xmlString += `      <type>${param.type || 'string'}</type>\n`;
        if (param.description) {
          xmlString += `      <description>${param.description}</description>\n`;
        }
        if (param.required) {
          xmlString += `      <required>true</required>\n`;
        }
        xmlString += `    </parameter>\n`;
      }
      xmlString += '  </parameters>\n';
    }
    xmlString += '</function_description>';
    return xmlString;
  }

  convertToolsToXmlFormat(tools: Tool[]): string {
    let xmlString = '<tools>\n';
    for (const tool of tools) {
      xmlString += this.convertToolToXmlFormat(tool) + '\n';
    }
    xmlString += '</tools>';
    return xmlString;
  }

  parseXmlResponse(xml: string): any {
    // Basic XML parsing for Anthropic responses
    try {
      // Remove XML tags and extract JSON
      const jsonMatch = xml.match(/\{.*\}/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch (error) {
      this.logger.error('Failed to parse XML response', { error, xml });
      return null;
    }
  }
}
