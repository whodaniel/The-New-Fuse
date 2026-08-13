import { Injectable } from '@nestjs/common';
// Conflict 1: Use 'Incoming' imports
import { Logger } from '../utils/logger.js';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

@Injectable()
export class AnthropicXmlTools {
  private readonly logger = new Logger(AnthropicXmlTools.name);

  // Conflict 2: Use 'Incoming' implementation
  convertToolToXmlFormat(tool: ToolDefinition): string {
    let xmlString = '<function>\n';
    xmlString += `  <name>${tool.name}</name>\n`;
    xmlString += `  <description>${tool.description}</description>\n`;

    if (tool.parameters && Object.keys(tool.parameters).length > 0) {
      xmlString += '  <parameters>\n';

      for (const [paramName, paramSchema] of Object.entries(
        tool.parameters,
      )) {
        xmlString += `    <parameter>\n`;
        xmlString += `      <name>${paramName}</name>\n`;
        xmlString += `      <type>${paramSchema.type || 'string'}</type>\n`;

        if (paramSchema.description) {
          xmlString += `      <description>${paramSchema.description}</description>\n`;
        }

        if (paramSchema.required) {
          xmlString += `      <required>true</required>\n`;
        }

        xmlString += `    </parameter>\n`;
      }

      xmlString += '  </parameters>\n';
    }

    xmlString += '</function>';
    return xmlString;
  }

  convertToolsToXmlFormat(tools: ToolDefinition[]): string {
    let xmlString = '<functions>\n';

    for (const tool of tools) {
      xmlString += this.convertToolToXmlFormat(tool) + '\n';
    }

    xmlString += '</functions>';
    return xmlString;
  }

  parseXmlResponse(xml: string): any {
    // Conflict 3: Logic is identical, just clean up
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