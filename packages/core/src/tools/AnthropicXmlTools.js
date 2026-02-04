"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AnthropicXmlTools_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicXmlTools = void 0;
const common_1 = require("@nestjs/common");
// Conflict 1: Use 'Incoming' imports
const logger_1 = require("../utils/logger");
let AnthropicXmlTools = AnthropicXmlTools_1 = class AnthropicXmlTools {
    logger = new logger_1.Logger(AnthropicXmlTools_1.name);
    // Conflict 2: Use 'Incoming' implementation
    convertToolToXmlFormat(tool) {
        let xmlString = '<function>\n';
        xmlString += `  <name>${tool.name}</name>\n`;
        xmlString += `  <description>${tool.description}</description>\n`;
        if (tool.parameters && Object.keys(tool.parameters).length > 0) {
            xmlString += '  <parameters>\n';
            for (const [paramName, paramSchema] of Object.entries(tool.parameters)) {
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
    convertToolsToXmlFormat(tools) {
        let xmlString = '<functions>\n';
        for (const tool of tools) {
            xmlString += this.convertToolToXmlFormat(tool) + '\n';
        }
        xmlString += '</functions>';
        return xmlString;
    }
    parseXmlResponse(xml) {
        // Conflict 3: Logic is identical, just clean up
        try {
            // Remove XML tags and extract JSON
            const jsonMatch = xml.match(/\{.*\}/s);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return null;
        }
        catch (error) {
            this.logger.error('Failed to parse XML response', { error, xml });
            return null;
        }
    }
};
exports.AnthropicXmlTools = AnthropicXmlTools;
exports.AnthropicXmlTools = AnthropicXmlTools = AnthropicXmlTools_1 = __decorate([
    (0, common_1.Injectable)()
], AnthropicXmlTools);
//# sourceMappingURL=AnthropicXmlTools.js.map