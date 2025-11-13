/**
 * JSON Schema definitions for MCP protocol validation
 */
/**
 * JSON-RPC 2.0 base message schema
 */
export declare const jsonrpcMessageSchema: {
    type: string;
    properties: {
        jsonrpc: {
            type: string;
            const: string;
        };
    };
    required: string[];
    additionalProperties: boolean;
};
/**
 * JSON-RPC 2.0 request schema
 */
export declare const jsonrpcRequestSchema: {
    properties: {
        id: {
            anyOf: {
                type: string;
            }[];
        };
        method: {
            type: string;
            minLength: number;
        };
        params: {
            anyOf: {
                type: string;
            }[];
        };
        jsonrpc: {
            type: string;
            const: string;
        };
    };
    required: string[];
    type: string;
    additionalProperties: boolean;
};
/**
 * JSON-RPC 2.0 response schema
 */
export declare const jsonrpcResponseSchema: {
    properties: {
        id: {
            anyOf: {
                type: string;
            }[];
        };
        result: {};
        error: {
            type: string;
            properties: {
                code: {
                    type: string;
                };
                message: {
                    type: string;
                };
                data: {};
            };
            required: string[];
            additionalProperties: boolean;
        };
        jsonrpc: {
            type: string;
            const: string;
        };
    };
    required: string[];
    anyOf: {
        required: string[];
        not: {
            required: string[];
        };
    }[];
    type: string;
    additionalProperties: boolean;
};
/**
 * JSON-RPC 2.0 notification schema
 */
export declare const jsonrpcNotificationSchema: {
    properties: {
        method: {
            type: string;
            minLength: number;
        };
        params: {
            anyOf: {
                type: string;
            }[];
        };
        jsonrpc: {
            type: string;
            const: string;
        };
    };
    required: string[];
    not: {
        required: string[];
    };
    type: string;
    additionalProperties: boolean;
};
/**
 * MCP request schema (extends JSON-RPC request)
 */
export declare const mcpRequestSchema: {
    properties: {
        meta: {
            type: string;
            properties: {
                timestamp: {
                    type: string;
                    format: string;
                };
                source: {
                    type: string;
                };
                priority: {
                    type: string;
                    enum: string[];
                };
                timeout: {
                    type: string;
                    minimum: number;
                };
            };
            additionalProperties: boolean;
        };
        id: {
            anyOf: {
                type: string;
            }[];
        };
        method: {
            type: string;
            minLength: number;
        };
        params: {
            anyOf: {
                type: string;
            }[];
        };
        jsonrpc: {
            type: string;
            const: string;
        };
    };
    required: string[];
    type: string;
    additionalProperties: boolean;
};
/**
 * MCP response schema (extends JSON-RPC response)
 */
export declare const mcpResponseSchema: {
    properties: {
        meta: {
            type: string;
            properties: {
                timestamp: {
                    type: string;
                    format: string;
                };
                processingTime: {
                    type: string;
                    minimum: number;
                };
                serverId: {
                    type: string;
                };
            };
            additionalProperties: boolean;
        };
        id: {
            anyOf: {
                type: string;
            }[];
        };
        result: {};
        error: {
            type: string;
            properties: {
                code: {
                    type: string;
                };
                message: {
                    type: string;
                };
                data: {};
            };
            required: string[];
            additionalProperties: boolean;
        };
        jsonrpc: {
            type: string;
            const: string;
        };
    };
    required: string[];
    anyOf: {
        required: string[];
        not: {
            required: string[];
        };
    }[];
    type: string;
    additionalProperties: boolean;
};
/**
 * MCP notification schema (extends JSON-RPC notification)
 */
export declare const mcpNotificationSchema: {
    properties: {
        meta: {
            type: string;
            properties: {
                timestamp: {
                    type: string;
                    format: string;
                };
                source: {
                    type: string;
                };
                type: {
                    type: string;
                    enum: string[];
                };
            };
            additionalProperties: boolean;
        };
        method: {
            type: string;
            minLength: number;
        };
        params: {
            anyOf: {
                type: string;
            }[];
        };
        jsonrpc: {
            type: string;
            const: string;
        };
    };
    required: string[];
    not: {
        required: string[];
    };
    type: string;
    additionalProperties: boolean;
};
/**
 * MCP resource schema
 */
export declare const mcpResourceSchema: {
    type: string;
    properties: {
        uri: {
            type: string;
            format: string;
        };
        name: {
            type: string;
            minLength: number;
        };
        description: {
            type: string;
        };
        mimeType: {
            type: string;
        };
        metadata: {
            type: string;
        };
        permissions: {
            type: string;
            properties: {
                read: {
                    type: string;
                };
                write: {
                    type: string;
                };
                subscribe: {
                    type: string;
                };
                requiredRoles: {
                    type: string;
                    items: {
                        type: string;
                    };
                };
            };
            required: string[];
        };
    };
    required: string[];
    additionalProperties: boolean;
};
/**
 * MCP tool schema
 */
export declare const mcpToolSchema: {
    type: string;
    properties: {
        name: {
            type: string;
            minLength: number;
        };
        description: {
            type: string;
            minLength: number;
        };
        inputSchema: {
            type: string;
            properties: {
                type: {
                    type: string;
                };
                properties: {
                    type: string;
                };
                required: {
                    type: string;
                    items: {
                        type: string;
                    };
                };
            };
            required: string[];
        };
        outputSchema: {
            type: string;
            properties: {
                type: {
                    type: string;
                };
                properties: {
                    type: string;
                };
            };
        };
        config: {
            type: string;
            properties: {
                timeout: {
                    type: string;
                    minimum: number;
                };
                maxMemory: {
                    type: string;
                    minimum: number;
                };
                sandboxed: {
                    type: string;
                };
            };
        };
    };
    required: string[];
    additionalProperties: boolean;
};
/**
 * MCP capability schema
 */
export declare const mcpCapabilitySchema: {
    type: string;
    properties: {
        name: {
            type: string;
            minLength: number;
        };
        version: {
            type: string;
            pattern: string;
        };
        description: {
            type: string;
            minLength: number;
        };
        methods: {
            type: string;
            items: {
                type: string;
                minLength: number;
            };
            minItems: number;
        };
        notifications: {
            type: string;
            items: {
                type: string;
                minLength: number;
            };
        };
        experimental: {
            type: string;
        };
        metadata: {
            type: string;
            properties: {
                author: {
                    type: string;
                };
                documentation: {
                    type: string;
                    format: string;
                };
                license: {
                    type: string;
                };
                tags: {
                    type: string;
                    items: {
                        type: string;
                    };
                };
            };
        };
    };
    required: string[];
    additionalProperties: boolean;
};
/**
 * MCP service info schema
 */
export declare const mcpServiceInfoSchema: {
    type: string;
    properties: {
        id: {
            type: string;
            minLength: number;
        };
        name: {
            type: string;
            minLength: number;
        };
        version: {
            type: string;
            pattern: string;
        };
        endpoint: {
            type: string;
            format: string;
        };
        capabilities: {
            type: string;
            items: {
                type: string;
            };
        };
        resources: {
            type: string;
            items: {
                type: string;
                properties: {
                    uri: {
                        type: string;
                        format: string;
                    };
                    name: {
                        type: string;
                        minLength: number;
                    };
                    description: {
                        type: string;
                    };
                    mimeType: {
                        type: string;
                    };
                    metadata: {
                        type: string;
                    };
                    permissions: {
                        type: string;
                        properties: {
                            read: {
                                type: string;
                            };
                            write: {
                                type: string;
                            };
                            subscribe: {
                                type: string;
                            };
                            requiredRoles: {
                                type: string;
                                items: {
                                    type: string;
                                };
                            };
                        };
                        required: string[];
                    };
                };
                required: string[];
                additionalProperties: boolean;
            };
        };
        tools: {
            type: string;
            items: {
                type: string;
                properties: {
                    name: {
                        type: string;
                        minLength: number;
                    };
                    description: {
                        type: string;
                        minLength: number;
                    };
                    inputSchema: {
                        type: string;
                        properties: {
                            type: {
                                type: string;
                            };
                            properties: {
                                type: string;
                            };
                            required: {
                                type: string;
                                items: {
                                    type: string;
                                };
                            };
                        };
                        required: string[];
                    };
                    outputSchema: {
                        type: string;
                        properties: {
                            type: {
                                type: string;
                            };
                            properties: {
                                type: string;
                            };
                        };
                    };
                    config: {
                        type: string;
                        properties: {
                            timeout: {
                                type: string;
                                minimum: number;
                            };
                            maxMemory: {
                                type: string;
                                minimum: number;
                            };
                            sandboxed: {
                                type: string;
                            };
                        };
                    };
                };
                required: string[];
                additionalProperties: boolean;
            };
        };
        status: {
            type: string;
            enum: string[];
        };
        metadata: {
            type: string;
        };
        registeredAt: {
            type: string;
            format: string;
        };
        lastHeartbeat: {
            type: string;
            format: string;
        };
    };
    required: string[];
    additionalProperties: boolean;
};
/**
 * All schemas collection
 */
export declare const schemas: {
    jsonrpcMessage: {
        type: string;
        properties: {
            jsonrpc: {
                type: string;
                const: string;
            };
        };
        required: string[];
        additionalProperties: boolean;
    };
    jsonrpcRequest: {
        properties: {
            id: {
                anyOf: {
                    type: string;
                }[];
            };
            method: {
                type: string;
                minLength: number;
            };
            params: {
                anyOf: {
                    type: string;
                }[];
            };
            jsonrpc: {
                type: string;
                const: string;
            };
        };
        required: string[];
        type: string;
        additionalProperties: boolean;
    };
    jsonrpcResponse: {
        properties: {
            id: {
                anyOf: {
                    type: string;
                }[];
            };
            result: {};
            error: {
                type: string;
                properties: {
                    code: {
                        type: string;
                    };
                    message: {
                        type: string;
                    };
                    data: {};
                };
                required: string[];
                additionalProperties: boolean;
            };
            jsonrpc: {
                type: string;
                const: string;
            };
        };
        required: string[];
        anyOf: {
            required: string[];
            not: {
                required: string[];
            };
        }[];
        type: string;
        additionalProperties: boolean;
    };
    jsonrpcNotification: {
        properties: {
            method: {
                type: string;
                minLength: number;
            };
            params: {
                anyOf: {
                    type: string;
                }[];
            };
            jsonrpc: {
                type: string;
                const: string;
            };
        };
        required: string[];
        not: {
            required: string[];
        };
        type: string;
        additionalProperties: boolean;
    };
    mcpRequest: {
        properties: {
            meta: {
                type: string;
                properties: {
                    timestamp: {
                        type: string;
                        format: string;
                    };
                    source: {
                        type: string;
                    };
                    priority: {
                        type: string;
                        enum: string[];
                    };
                    timeout: {
                        type: string;
                        minimum: number;
                    };
                };
                additionalProperties: boolean;
            };
            id: {
                anyOf: {
                    type: string;
                }[];
            };
            method: {
                type: string;
                minLength: number;
            };
            params: {
                anyOf: {
                    type: string;
                }[];
            };
            jsonrpc: {
                type: string;
                const: string;
            };
        };
        required: string[];
        type: string;
        additionalProperties: boolean;
    };
    mcpResponse: {
        properties: {
            meta: {
                type: string;
                properties: {
                    timestamp: {
                        type: string;
                        format: string;
                    };
                    processingTime: {
                        type: string;
                        minimum: number;
                    };
                    serverId: {
                        type: string;
                    };
                };
                additionalProperties: boolean;
            };
            id: {
                anyOf: {
                    type: string;
                }[];
            };
            result: {};
            error: {
                type: string;
                properties: {
                    code: {
                        type: string;
                    };
                    message: {
                        type: string;
                    };
                    data: {};
                };
                required: string[];
                additionalProperties: boolean;
            };
            jsonrpc: {
                type: string;
                const: string;
            };
        };
        required: string[];
        anyOf: {
            required: string[];
            not: {
                required: string[];
            };
        }[];
        type: string;
        additionalProperties: boolean;
    };
    mcpNotification: {
        properties: {
            meta: {
                type: string;
                properties: {
                    timestamp: {
                        type: string;
                        format: string;
                    };
                    source: {
                        type: string;
                    };
                    type: {
                        type: string;
                        enum: string[];
                    };
                };
                additionalProperties: boolean;
            };
            method: {
                type: string;
                minLength: number;
            };
            params: {
                anyOf: {
                    type: string;
                }[];
            };
            jsonrpc: {
                type: string;
                const: string;
            };
        };
        required: string[];
        not: {
            required: string[];
        };
        type: string;
        additionalProperties: boolean;
    };
    mcpResource: {
        type: string;
        properties: {
            uri: {
                type: string;
                format: string;
            };
            name: {
                type: string;
                minLength: number;
            };
            description: {
                type: string;
            };
            mimeType: {
                type: string;
            };
            metadata: {
                type: string;
            };
            permissions: {
                type: string;
                properties: {
                    read: {
                        type: string;
                    };
                    write: {
                        type: string;
                    };
                    subscribe: {
                        type: string;
                    };
                    requiredRoles: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                };
                required: string[];
            };
        };
        required: string[];
        additionalProperties: boolean;
    };
    mcpTool: {
        type: string;
        properties: {
            name: {
                type: string;
                minLength: number;
            };
            description: {
                type: string;
                minLength: number;
            };
            inputSchema: {
                type: string;
                properties: {
                    type: {
                        type: string;
                    };
                    properties: {
                        type: string;
                    };
                    required: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                };
                required: string[];
            };
            outputSchema: {
                type: string;
                properties: {
                    type: {
                        type: string;
                    };
                    properties: {
                        type: string;
                    };
                };
            };
            config: {
                type: string;
                properties: {
                    timeout: {
                        type: string;
                        minimum: number;
                    };
                    maxMemory: {
                        type: string;
                        minimum: number;
                    };
                    sandboxed: {
                        type: string;
                    };
                };
            };
        };
        required: string[];
        additionalProperties: boolean;
    };
    mcpCapability: {
        type: string;
        properties: {
            name: {
                type: string;
                minLength: number;
            };
            version: {
                type: string;
                pattern: string;
            };
            description: {
                type: string;
                minLength: number;
            };
            methods: {
                type: string;
                items: {
                    type: string;
                    minLength: number;
                };
                minItems: number;
            };
            notifications: {
                type: string;
                items: {
                    type: string;
                    minLength: number;
                };
            };
            experimental: {
                type: string;
            };
            metadata: {
                type: string;
                properties: {
                    author: {
                        type: string;
                    };
                    documentation: {
                        type: string;
                        format: string;
                    };
                    license: {
                        type: string;
                    };
                    tags: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                };
            };
        };
        required: string[];
        additionalProperties: boolean;
    };
    mcpServiceInfo: {
        type: string;
        properties: {
            id: {
                type: string;
                minLength: number;
            };
            name: {
                type: string;
                minLength: number;
            };
            version: {
                type: string;
                pattern: string;
            };
            endpoint: {
                type: string;
                format: string;
            };
            capabilities: {
                type: string;
                items: {
                    type: string;
                };
            };
            resources: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        uri: {
                            type: string;
                            format: string;
                        };
                        name: {
                            type: string;
                            minLength: number;
                        };
                        description: {
                            type: string;
                        };
                        mimeType: {
                            type: string;
                        };
                        metadata: {
                            type: string;
                        };
                        permissions: {
                            type: string;
                            properties: {
                                read: {
                                    type: string;
                                };
                                write: {
                                    type: string;
                                };
                                subscribe: {
                                    type: string;
                                };
                                requiredRoles: {
                                    type: string;
                                    items: {
                                        type: string;
                                    };
                                };
                            };
                            required: string[];
                        };
                    };
                    required: string[];
                    additionalProperties: boolean;
                };
            };
            tools: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        name: {
                            type: string;
                            minLength: number;
                        };
                        description: {
                            type: string;
                            minLength: number;
                        };
                        inputSchema: {
                            type: string;
                            properties: {
                                type: {
                                    type: string;
                                };
                                properties: {
                                    type: string;
                                };
                                required: {
                                    type: string;
                                    items: {
                                        type: string;
                                    };
                                };
                            };
                            required: string[];
                        };
                        outputSchema: {
                            type: string;
                            properties: {
                                type: {
                                    type: string;
                                };
                                properties: {
                                    type: string;
                                };
                            };
                        };
                        config: {
                            type: string;
                            properties: {
                                timeout: {
                                    type: string;
                                    minimum: number;
                                };
                                maxMemory: {
                                    type: string;
                                    minimum: number;
                                };
                                sandboxed: {
                                    type: string;
                                };
                            };
                        };
                    };
                    required: string[];
                    additionalProperties: boolean;
                };
            };
            status: {
                type: string;
                enum: string[];
            };
            metadata: {
                type: string;
            };
            registeredAt: {
                type: string;
                format: string;
            };
            lastHeartbeat: {
                type: string;
                format: string;
            };
        };
        required: string[];
        additionalProperties: boolean;
    };
};
//# sourceMappingURL=schemas.d.ts.map