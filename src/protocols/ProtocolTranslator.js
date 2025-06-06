"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtocolTranslator = exports.ProtocolType = void 0;
const events_1 = require("events");
// Protocol types we can support
var ProtocolType;
(function (ProtocolType) {
    ProtocolType["A2A_V1"] = "a2a-v1.0";
    ProtocolType["A2A_V2"] = "a2a-v2.0";
    ProtocolType["MCP"] = "mcp-v1.0";
    ProtocolType["GOOGLE_A2A"] = "google-a2a-v1.0";
    ProtocolType["ANTHROPIC_MCP"] = "anthropic-mcp-v1.0";
    ProtocolType["ANTHROPIC_XML"] = "anthropic-xml-v1.0";
    ProtocolType["OPENAI_ASSISTANT"] = "openai-assistant-v1.0";
    ProtocolType["LANGCHAIN"] = "langchain-v1.0";
    ProtocolType["AUTOGEN"] = "autogen-v1.0";
    ProtocolType["CREWAI"] = "crewai-v1.0";
    ProtocolType["PYDANTIC"] = "pydantic-v1.0";
})(ProtocolType = exports.ProtocolType || (exports.ProtocolType = {}));
/**
 * Protocol Translator Service
 *
 * Translates messages and capabilities between different protocols
 */
class ProtocolTranslator extends events_1.EventEmitter {
    constructor(logger) {
        super();
        this.adapters = new Map();
        this.logger = logger || console;
    }
    /**
     * Register a protocol adapter
     */
    registerAdapter(adapter) {
        this.adapters.set(adapter.name, adapter);
        this.logger.info(`Registered protocol adapter: ${adapter.name} v${adapter.version}`);
    }
    /**
     * Get all registered adapters
     */
    getAdapters() {
        return Array.from(this.adapters.values());
    }
    /**
     * Find an adapter that can handle the specified protocols
     */
    findAdapter(sourceProtocol, targetProtocol) {
        for (const adapter of this.adapters.values()) {
            if (adapter.supportedProtocols.includes(sourceProtocol) &&
                adapter.supportedProtocols.includes(targetProtocol)) {
                return adapter;
            }
        }
        return null;
    }
    /**
     * Translate a message from one protocol to another
     */
    async translateMessage(message, sourceProtocol, targetProtocol) {
        if (sourceProtocol === targetProtocol) {
            return message; // No translation needed
        }
        const adapter = this.findAdapter(sourceProtocol, targetProtocol);
        if (!adapter) {
            // If no direct adapter found, try to find a path between protocols
            return this.translateMessageWithIntermediaries(message, sourceProtocol, targetProtocol);
        }
        try {
            const result = await adapter.adaptMessage(message, sourceProtocol, targetProtocol);
            this.emit('messagetranslated', {
                sourceProtocol,
                targetProtocol,
                adapter: adapter.name
            });
            return result;
        }
        catch (error) {
            this.logger.error(`Error translating message: ${error.message}`);
            throw new Error(`Failed to translate message from ${sourceProtocol} to ${targetProtocol}: ${error.message}`);
        }
    }
    /**
     * Translate a message using intermediary protocols if needed
     */
    async translateMessageWithIntermediaries(message, sourceProtocol, targetProtocol) {
        // Use A2A_V2 as an intermediary protocol
        const intermediaryProtocol = ProtocolType.A2A_V2;
        // Find adapters to and from the intermediary
        const sourceToIntermediary = this.findAdapter(sourceProtocol, intermediaryProtocol);
        const intermediaryToTarget = this.findAdapter(intermediaryProtocol, targetProtocol);
        if (!sourceToIntermediary || !intermediaryToTarget) {
            throw new Error(`No adapter path found from ${sourceProtocol} to ${targetProtocol}`);
        }
        // Translate in two steps
        const intermediaryMessage = await sourceToIntermediary.adaptMessage(message, sourceProtocol, intermediaryProtocol);
        return intermediaryToTarget.adaptMessage(intermediaryMessage, intermediaryProtocol, targetProtocol);
    }
    /**
     * Translate a capability from one protocol to another
     */
    async translateCapability(capability, sourceProtocol, targetProtocol) {
        if (sourceProtocol === targetProtocol) {
            return capability; // No translation needed
        }
        const adapter = this.findAdapter(sourceProtocol, targetProtocol);
        if (!adapter) {
            throw new Error(`No adapter found for translating capability from ${sourceProtocol} to ${targetProtocol}`);
        }
        try {
            return await adapter.adaptCapability(capability, sourceProtocol, targetProtocol);
        }
        catch (error) {
            this.logger.error(`Error translating capability: ${error.message}`);
            throw new Error(`Failed to translate capability from ${sourceProtocol} to ${targetProtocol}: ${error.message}`);
        }
    }
    /**
     * Translate a tool from one protocol to another
     */
    async translateTool(tool, sourceProtocol, targetProtocol) {
        if (sourceProtocol === targetProtocol) {
            return tool; // No translation needed
        }
        const adapter = this.findAdapter(sourceProtocol, targetProtocol);
        if (!adapter) {
            throw new Error(`No adapter found for translating tool from ${sourceProtocol} to ${targetProtocol}`);
        }
        try {
            return await adapter.adaptTool(tool, sourceProtocol, targetProtocol);
        }
        catch (error) {
            this.logger.error(`Error translating tool: ${error.message}`);
            throw new Error(`Failed to translate tool from ${sourceProtocol} to ${targetProtocol}: ${error.message}`);
        }
    }
}
exports.ProtocolTranslator = ProtocolTranslator;
//# sourceMappingURL=ProtocolTranslator.js.map