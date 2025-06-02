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
exports.AnthropicXmlTools = void 0;
const common_1 = require("@nestjs/common");
const logger_js_1 = require("../utils/logger.js");
const AnthropicXmlAdapter_js_1 = require("../protocols/adapters/AnthropicXmlAdapter.js");
/**
 * Anthropic XML Tools Service
 *
 * This service provides tools for working with Anthropic's XML-style function calling format.
 */
let AnthropicXmlTools = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AnthropicXmlTools = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AnthropicXmlTools = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        logger = new logger_js_1.Logger(AnthropicXmlTools.name);
        adapter;
        constructor() {
            this.adapter = new AnthropicXmlAdapter_js_1.AnthropicXmlAdapter();
        }
        /**
         * Parse an Anthropic XML function call
         * @param xmlString XML function call string
         * @returns Parsed function call
         */
        async parseXmlFunctionCall(xmlString) {
            try {
                const message = await this.adapter.adaptMessage(xmlString, 'a2a-v2.0');
                return {
                    name: message.header.type,
                    parameters: message.body.content,
                };
            }
            catch (error) {
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
        async createXmlFunctionCall(functionName, parameters) {
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
                return await this.adapter.adaptMessage(message, 'anthropic-xml-v1.0');
            }
            catch (error) {
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
        createXmlFunctionCallResponse(functionName, content) {
            return this.adapter.createFunctionCallResponse(functionName, content);
        }
        /**
         * Parse an Anthropic XML function call response
         * @param xmlString XML function call response string
         * @returns Parsed function call response
         */
        parseXmlFunctionCallResponse(xmlString) {
            return this.adapter.parseFunctionCallResponse(xmlString);
        }
        /**
         * Convert a tool definition to Anthropic XML format
         * @param tool Tool definition
         * @returns XML tool definition
         */
        convertToolToXmlFormat(tool) {
            let xmlString = '<function>\n';
            xmlString += `{"description": "${tool.description}", "name": "${tool.name}", "parameters": `;
            // Convert parameters to JSON string
            xmlString += JSON.stringify({
                properties: tool.parameters,
                required: Object.keys(tool.parameters).filter(key => tool.parameters[key].required === true),
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
        convertToolsToXmlFormat(tools) {
            let xmlString = '<functions>\n';
            for (const tool of tools) {
                xmlString += this.convertToolToXmlFormat(tool) + '\n';
            }
            xmlString += '</functions>';
            return xmlString;
        }
    };
    return AnthropicXmlTools = _classThis;
})();
exports.AnthropicXmlTools = AnthropicXmlTools;
//# sourceMappingURL=AnthropicXmlTools.js.map