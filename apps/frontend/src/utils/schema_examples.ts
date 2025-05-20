export {}
exports.TOOL_SCHEMA = exports.MESSAGE_SCHEMA = exports.ERROR_SCHEMA = exports.ANALYSIS_SCHEMA = void 0;
exports.ANALYSIS_SCHEMA = {
    type: "object",
    properties: {
        summary: {
            type: "string",
            description: "Brief summary of analysis"
        },
        findings: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    category: { type: "string" },
                    description: { type: "string" },
                    severity: {
                        type: "string",
                        enum: ["low", "medium", "high"]
                    },
                    recommendations: {
                        type: "array",
                        items: { type: "string" }
                    }
                },
                required: ["category", "description", "severity"]
            }
        },
        metadata: {
            type: "object",
            properties: {
                timestamp: {
                    type: "string",
                    format: "date-time"
                },
                analyzer_version: { type: "string" },
                analysis_duration: { type: "number" }
            }
        }
    },
    required: ["summary", "findings"]
};
exports.ERROR_SCHEMA = {
    type: "object",
    properties: {
        error_code: {
            type: "string",
            description: "Unique error identifier"
        },
        message: {
            type: "string",
            description: "Human-readable error message"
        },
        details: {
            type: "object",
            description: "Additional error details"
        },
        stack_trace: {
            type: "array",
            items: { type: "string" },
            description: "Stack trace if available"
        },
        timestamp: {
            type: "string",
            format: "date-time",
            description: "When the error occurred"
        }
    },
    required: ["error_code", "message"]
};
exports.MESSAGE_SCHEMA = {
    type: "object",
    properties: {
        id: {
            type: "string",
            description: "Unique message identifier"
        },
        type: {
            type: "string",
            enum: ["text", "command", "result", "error"],
            description: "Message type"
        },
        content: {
            type: "object",
            description: "Message content"
        },
        metadata: {
            type: "object",
            properties: {
                timestamp: { type: "string", format: "date-time" },
                source: { type: "string" },
                target: { type: "string" },
                priority: {
                    type: "string",
                    enum: ["low", "medium", "high", "urgent"]
                }
            }
        }
    },
    required: ["id", "type", "content"]
};
exports.TOOL_SCHEMA = {
    type: "object",
    properties: {
        name: {
            type: "string",
            description: "Tool name"
        },
        description: {
            type: "string",
            description: "Tool description"
        },
        version: {
            type: "string",
            description: "Tool version"
        },
        parameters: {
            type: "object",
            description: "Tool parameters schema"
        },
        returns: {
            type: "object",
            description: "Return value schema"
        },
        metadata: {
            type: "object",
            properties: {
                author: { type: "string" },
                created: { type: "string", format: "date-time" },
                updated: { type: "string", format: "date-time" },
                tags: {
                    type: "array",
                    items: { type: "string" }
                }
            }
        }
    },
    required: ["name", "description", "parameters", "returns"]
};
export {};
//# sourceMappingURL=schema_examples.js.map