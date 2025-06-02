"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicXmlAdapter = void 0;
const common_1 = require("@nestjs/common");
const logger_js_1 = require("../../utils/logger.js");
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
let AnthropicXmlAdapter = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AnthropicXmlAdapter = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AnthropicXmlAdapter = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        logger = new logger_js_1.Logger(AnthropicXmlAdapter.name);
        name = 'anthropic-xml-adapter';
        version = '1.0.0';
        supportedProtocols = ['a2a-v2.0', 'anthropic-xml-v1.0'];
        /**
         * Check if this adapter can handle the given protocol
         * @param protocol Protocol identifier
         * @returns True if the adapter can handle the protocol
         */
        canHandle(protocol) {
            return this.supportedProtocols.includes(protocol);
        }
        /**
         * Adapt a message between protocols
         * @param message Message to adapt
         * @param targetProtocol Target protocol
         * @returns Adapted message
         */
        async adaptMessage(message, targetProtocol) {
            if (targetProtocol === 'anthropic-xml-v1.0') {
                return this.convertToAnthropicXmlFormat(message);
            }
            else if (targetProtocol === 'a2a-v2.0') {
                return this.convertFromAnthropicXmlFormat(message);
            }
            throw new Error(`Unsupported target protocol: ${targetProtocol}`);
        }
        /**
         * Convert a standard A2A message to Anthropic XML format
         * @param message A2A message
         * @returns Anthropic XML formatted string
         */
        convertToAnthropicXmlFormat(message) {
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
        convertFromAnthropicXmlFormat(xmlString) {
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
        parseXmlFunctionCall(xmlString) {
            // Simple regex-based parsing for demonstration
            // In a production environment, use a proper XML parser
            // Extract function name
            const functionNameMatch = xmlString.match(/<invoke name="([^"]+)">/);
            if (!functionNameMatch) {
                throw new Error('Invalid XML function call: missing function name');
            }
            const functionName = functionNameMatch[1];
            // Extract parameters
            const parameters = {};
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
                    }
                    catch (e) {
                        parameters[paramName] = paramValue;
                    }
                }
                else {
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
        createFunctionCallResponse(functionName, content) {
            const contentString = typeof content === 'object' ? JSON.stringify(content) : String(content);
            return `<function_results>\n<${functionName}>${contentString}</${functionName}>\n</function_results>`;
        }
        /**
         * Parse an Anthropic XML function call response
         * @param xmlString XML formatted response string
         * @returns Function call response information
         */
        parseFunctionCallResponse(xmlString) {
            // Extract function name and content using regex
            // In a production environment, use a proper XML parser
            const match = xmlString.match(/<function_results>\s*<([^>]+)>(.*)<\/\1>\s*<\/function_results>/s);
            if (!match) {
                throw new Error('Invalid XML function call response');
            }
            const functionName = match[1];
            const contentString = match[2];
            // Try to parse content as JSON if it looks like an object or array
            let content = contentString;
            if ((contentString.startsWith('{') && contentString.endsWith('}')) ||
                (contentString.startsWith('[') && contentString.endsWith(']'))) {
                try {
                    content = JSON.parse(contentString);
                }
                catch (e) {
                    // Keep as string if parsing fails
                }
            }
            return {
                name: functionName,
                content,
            };
        }
    };
    return AnthropicXmlAdapter = _classThis;
})();
exports.AnthropicXmlAdapter = AnthropicXmlAdapter;
//# sourceMappingURL=AnthropicXmlAdapter.js.map