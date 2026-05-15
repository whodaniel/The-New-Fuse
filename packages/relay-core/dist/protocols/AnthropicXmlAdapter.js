"use strict";
/**
 * Anthropic XML Protocol Adapter
 *
 * Based on existing AnthropicXmlAdapter in packages/core/src/protocols/adapters/
 * Handles Anthropic's XML-based function calling and tool invocation format
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicXmlAdapter = void 0;
class AnthropicXmlAdapter {
    constructor(logger) {
        this.name = 'anthropic-xml';
        this.version = '1.0.0';
        this.supportedProtocols = ['anthropic-xml-v1.0', 'a2a-v2.0'];
        this.logger = logger;
    }
    canTranslate(from, to) {
        return this.supportedProtocols.includes(from) && this.supportedProtocols.includes(to);
    }
    async translate(message, sourceProtocol, targetProtocol) {
        if (sourceProtocol === 'anthropic-xml-v1.0' && targetProtocol === 'a2a-v2.0') {
            return this.anthropicXmlToA2A(message);
        }
        else if (sourceProtocol === 'a2a-v2.0' && targetProtocol === 'anthropic-xml-v1.0') {
            return this.a2aToAnthropicXml(message);
        }
        throw new Error(`Unsupported translation: ${sourceProtocol} -> ${targetProtocol}`);
    }
    anthropicXmlToA2A(message) {
        const { payload } = message;
        // Handle Anthropic XML function calls
        if (this.isAnthropicXmlFunctionCall(payload)) {
            return {
                ...message,
                type: 'FUNCTION_CALL',
                payload: {
                    function: this.extractFunctionName(payload),
                    parameters: this.extractFunctionParameters(payload),
                    reasoning: this.extractReasoning(payload),
                },
                metadata: {
                    ...message.metadata,
                    protocol: 'a2a-v2.0',
                    originalProtocol: 'anthropic-xml-v1.0',
                    translatedAt: new Date().toISOString(),
                },
            };
        }
        // Handle Anthropic XML tool responses
        if (this.isAnthropicXmlToolResponse(payload)) {
            return {
                ...message,
                type: 'TOOL_RESPONSE',
                payload: {
                    result: this.extractToolResult(payload),
                    success: this.extractToolSuccess(payload),
                    metadata: this.extractToolMetadata(payload),
                },
                metadata: {
                    ...message.metadata,
                    protocol: 'a2a-v2.0',
                    originalProtocol: 'anthropic-xml-v1.0',
                    translatedAt: new Date().toISOString(),
                },
            };
        }
        // Handle general Anthropic XML content
        return {
            ...message,
            payload: {
                content: this.extractTextContent(payload),
                thinking: this.extractThinking(payload),
                artifacts: this.extractArtifacts(payload),
            },
            metadata: {
                ...message.metadata,
                protocol: 'a2a-v2.0',
                originalProtocol: 'anthropic-xml-v1.0',
                translatedAt: new Date().toISOString(),
            },
        };
    }
    a2aToAnthropicXml(message) {
        const { payload } = message;
        // Convert A2A function call to Anthropic XML format
        if (message.type === 'FUNCTION_CALL') {
            return {
                ...message,
                payload: this.createAnthropicXmlFunctionCall(payload.function, payload.parameters, payload.reasoning),
                metadata: {
                    ...message.metadata,
                    protocol: 'anthropic-xml-v1.0',
                    originalProtocol: 'a2a-v2.0',
                    translatedAt: new Date().toISOString(),
                },
            };
        }
        // Convert A2A tool response to Anthropic XML format
        if (message.type === 'TOOL_RESPONSE') {
            return {
                ...message,
                payload: this.createAnthropicXmlToolResponse(payload.result, payload.success, payload.metadata),
                metadata: {
                    ...message.metadata,
                    protocol: 'anthropic-xml-v1.0',
                    originalProtocol: 'a2a-v2.0',
                    translatedAt: new Date().toISOString(),
                },
            };
        }
        // Convert general A2A message to Anthropic XML format
        return {
            ...message,
            payload: this.createAnthropicXmlContent(payload),
            metadata: {
                ...message.metadata,
                protocol: 'anthropic-xml-v1.0',
                originalProtocol: 'a2a-v2.0',
                translatedAt: new Date().toISOString(),
            },
        };
    }
    // Anthropic XML parsing helpers
    isAnthropicXmlFunctionCall(payload) {
        return typeof payload === 'string' && payload.includes('<function_calls>');
    }
    isAnthropicXmlToolResponse(payload) {
        return typeof payload === 'string' && payload.includes('<tool_result>');
    }
    extractFunctionName(xmlContent) {
        const match = xmlContent.match(/<invoke name="([^"]+)"/);
        return match ? match[1] : 'unknown_function';
    }
    extractFunctionParameters(xmlContent) {
        const paramMatch = xmlContent.match(/<parameter name="([^"]+)">([^<]+)<\/parameter>/g);
        const parameters = {};
        if (paramMatch) {
            paramMatch.forEach((param) => {
                const nameMatch = param.match(/name="([^"]+)"/);
                const valueMatch = param.match(/>([^<]+)</);
                if (nameMatch && valueMatch) {
                    parameters[nameMatch[1]] = valueMatch[1];
                }
            });
        }
        return parameters;
    }
    extractReasoning(xmlContent) {
        const match = xmlContent.match(/<thinking>(.*?)<\/thinking>/s);
        return match ? match[1].trim() : '';
    }
    extractToolResult(xmlContent) {
        const match = xmlContent.match(/<tool_result>(.*?)<\/tool_result>/s);
        if (match) {
            try {
                return JSON.parse(match[1]);
            }
            catch {
                return match[1];
            }
        }
        return null;
    }
    extractToolSuccess(xmlContent) {
        return !xmlContent.includes('<error>') && !xmlContent.includes('error="true"');
    }
    extractToolMetadata(xmlContent) {
        const metadata = {};
        // Extract tool ID
        const idMatch = xmlContent.match(/tool_call_id="([^"]+)"/);
        if (idMatch)
            metadata.toolCallId = idMatch[1];
        // Extract timestamp
        const timestampMatch = xmlContent.match(/timestamp="([^"]+)"/);
        if (timestampMatch)
            metadata.timestamp = timestampMatch[1];
        return metadata;
    }
    extractTextContent(xmlContent) {
        // Remove XML tags and extract plain text
        return xmlContent.replace(/<[^>]*>/g, '').trim();
    }
    extractThinking(xmlContent) {
        const match = xmlContent.match(/<thinking>(.*?)<\/thinking>/s);
        return match ? match[1].trim() : '';
    }
    extractArtifacts(xmlContent) {
        const artifacts = [];
        const artifactMatches = xmlContent.match(/<artifact[^>]*>(.*?)<\/artifact>/gs);
        if (artifactMatches) {
            artifactMatches.forEach((artifact) => {
                const typeMatch = artifact.match(/type="([^"]+)"/);
                const nameMatch = artifact.match(/name="([^"]+)"/);
                const contentMatch = artifact.match(/<artifact[^>]*>(.*?)<\/artifact>/s);
                artifacts.push({
                    type: typeMatch ? typeMatch[1] : 'unknown',
                    name: nameMatch ? nameMatch[1] : 'untitled',
                    content: contentMatch ? contentMatch[1] : '',
                });
            });
        }
        return artifacts;
    }
    // Anthropic XML generation helpers
    createAnthropicXmlFunctionCall(functionName, parameters, reasoning) {
        let xml = '';
        if (reasoning) {
            xml += `<thinking>\n${reasoning}\n</thinking>\n\n`;
        }
        xml += '<function_calls>\n';
        xml += `<invoke name="${functionName}">\n`;
        for (const [key, value] of Object.entries(parameters)) {
            xml += `<parameter name="${key}">${value}</parameter>\n`;
        }
        xml += '</invoke>\n';
        xml += '</function_calls>';
        return xml;
    }
    createAnthropicXmlToolResponse(result, success, metadata) {
        let xml = '<tool_result';
        if (metadata?.toolCallId) {
            xml += ` tool_call_id="${metadata.toolCallId}"`;
        }
        if (!success) {
            xml += ' error="true"';
        }
        xml += '>\n';
        if (typeof result === 'object') {
            xml += JSON.stringify(result, null, 2);
        }
        else {
            xml += result;
        }
        xml += '\n</tool_result>';
        return xml;
    }
    createAnthropicXmlContent(payload) {
        let xml = '';
        if (payload.thinking) {
            xml += `<thinking>\n${payload.thinking}\n</thinking>\n\n`;
        }
        if (payload.content) {
            xml += payload.content;
        }
        if (payload.artifacts && payload.artifacts.length > 0) {
            xml += '\n\n';
            payload.artifacts.forEach((artifact) => {
                xml += `<artifact type="${artifact.type}" name="${artifact.name}">\n`;
                xml += artifact.content;
                xml += '\n</artifact>\n';
            });
        }
        return xml;
    }
}
exports.AnthropicXmlAdapter = AnthropicXmlAdapter;
//# sourceMappingURL=AnthropicXmlAdapter.js.map