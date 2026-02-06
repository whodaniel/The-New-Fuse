/**
 * JSON Schema definitions for MCP protocol validation
 */

/**
 * JSON-RPC 2.0 base message schema
 */
export const jsonrpcMessageSchema = {
  type: 'object',
  properties: {
    jsonrpc: {
      type: 'string',
      const: '2.0',
    },
  },
  required: ['jsonrpc'],
  additionalProperties: true,
};

/**
 * JSON-RPC 2.0 request schema
 */
export const jsonrpcRequestSchema = {
  ...jsonrpcMessageSchema,
  properties: {
    ...jsonrpcMessageSchema.properties,
    id: {
      anyOf: [{ type: 'string' }, { type: 'number' }],
    },
    method: {
      type: 'string',
      minLength: 1,
    },
    params: {
      anyOf: [{ type: 'object' }, { type: 'array' }],
    },
  },
  required: ['jsonrpc', 'id', 'method'],
};

/**
 * JSON-RPC 2.0 response schema
 */
export const jsonrpcResponseSchema = {
  ...jsonrpcMessageSchema,
  properties: {
    ...jsonrpcMessageSchema.properties,
    id: {
      anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'null' }],
    },
    result: {},
    error: {
      type: 'object',
      properties: {
        code: {
          type: 'number',
        },
        message: {
          type: 'string',
        },
        data: {},
      },
      required: ['code', 'message'],
      additionalProperties: false,
    },
  },
  required: ['jsonrpc', 'id'],
  anyOf: [
    {
      required: ['result'],
      not: { required: ['error'] },
    },
    {
      required: ['error'],
      not: { required: ['result'] },
    },
  ],
};

/**
 * JSON-RPC 2.0 notification schema
 */
export const jsonrpcNotificationSchema = {
  ...jsonrpcMessageSchema,
  properties: {
    ...jsonrpcMessageSchema.properties,
    method: {
      type: 'string',
      minLength: 1,
    },
    params: {
      anyOf: [{ type: 'object' }, { type: 'array' }],
    },
  },
  required: ['jsonrpc', 'method'],
  not: {
    required: ['id'],
  },
};

/**
 * MCP request schema (extends JSON-RPC request)
 */
export const mcpRequestSchema = {
  ...jsonrpcRequestSchema,
  properties: {
    ...jsonrpcRequestSchema.properties,
    meta: {
      type: 'object',
      properties: {
        timestamp: {
          type: 'string',
          format: 'date-time',
        },
        source: {
          type: 'string',
        },
        priority: {
          type: 'string',
          enum: ['low', 'normal', 'high'],
        },
        timeout: {
          type: 'number',
          minimum: 0,
        },
      },
      additionalProperties: true,
    },
  },
};

/**
 * MCP response schema (extends JSON-RPC response)
 */
export const mcpResponseSchema = {
  ...jsonrpcResponseSchema,
  properties: {
    ...jsonrpcResponseSchema.properties,
    meta: {
      type: 'object',
      properties: {
        timestamp: {
          type: 'string',
          format: 'date-time',
        },
        processingTime: {
          type: 'number',
          minimum: 0,
        },
        serverId: {
          type: 'string',
        },
      },
      additionalProperties: true,
    },
  },
};

/**
 * MCP notification schema (extends JSON-RPC notification)
 */
export const mcpNotificationSchema = {
  ...jsonrpcNotificationSchema,
  properties: {
    ...jsonrpcNotificationSchema.properties,
    meta: {
      type: 'object',
      properties: {
        timestamp: {
          type: 'string',
          format: 'date-time',
        },
        source: {
          type: 'string',
        },
        type: {
          type: 'string',
          enum: ['event', 'status', 'alert'],
        },
      },
      additionalProperties: true,
    },
  },
};

/**
 * MCP resource schema
 */
export const mcpResourceSchema = {
  type: 'object',
  properties: {
    uri: {
      type: 'string',
      format: 'uri',
    },
    name: {
      type: 'string',
      minLength: 1,
    },
    description: {
      type: 'string',
    },
    mimeType: {
      type: 'string',
    },
    metadata: {
      type: 'object',
    },
    permissions: {
      type: 'object',
      properties: {
        read: {
          type: 'boolean',
        },
        write: {
          type: 'boolean',
        },
        subscribe: {
          type: 'boolean',
        },
        requiredRoles: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
      required: ['read'],
    },
  },
  required: ['uri', 'name'],
  additionalProperties: false,
};

/**
 * MCP tool schema
 */
export const mcpToolSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 1,
    },
    description: {
      type: 'string',
      minLength: 1,
    },
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
        },
        properties: {
          type: 'object',
        },
        required: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
      required: ['type'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
        },
        properties: {
          type: 'object',
        },
      },
    },
    config: {
      type: 'object',
      properties: {
        timeout: {
          type: 'number',
          minimum: 0,
        },
        maxMemory: {
          type: 'number',
          minimum: 0,
        },
        sandboxed: {
          type: 'boolean',
        },
      },
    },
  },
  required: ['name', 'description', 'inputSchema'],
  additionalProperties: false,
};

/**
 * MCP capability schema
 */
export const mcpCapabilitySchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 1,
    },
    version: {
      type: 'string',
      pattern: '^\\d+\\.\\d+\\.\\d+(-[a-zA-Z0-9.-]+)?$',
    },
    description: {
      type: 'string',
      minLength: 1,
    },
    methods: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
      },
      minItems: 1,
    },
    notifications: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
      },
    },
    experimental: {
      type: 'boolean',
    },
    metadata: {
      type: 'object',
      properties: {
        author: {
          type: 'string',
        },
        documentation: {
          type: 'string',
          format: 'uri',
        },
        license: {
          type: 'string',
        },
        tags: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    },
  },
  required: ['name', 'version', 'description', 'methods'],
  additionalProperties: false,
};

/**
 * MCP service info schema
 */
export const mcpServiceInfoSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      minLength: 1,
    },
    name: {
      type: 'string',
      minLength: 1,
    },
    version: {
      type: 'string',
      pattern: '^\\d+\\.\\d+\\.\\d+(-[a-zA-Z0-9.-]+)?$',
    },
    endpoint: {
      type: 'string',
      format: 'uri',
    },
    capabilities: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    resources: {
      type: 'array',
      items: mcpResourceSchema,
    },
    tools: {
      type: 'array',
      items: mcpToolSchema,
    },
    status: {
      type: 'string',
      enum: ['online', 'offline', 'degraded', 'maintenance'],
    },
    metadata: {
      type: 'object',
    },
    registeredAt: {
      type: 'string',
      format: 'date-time',
    },
    lastHeartbeat: {
      type: 'string',
      format: 'date-time',
    },
  },
  required: [
    'id',
    'name',
    'version',
    'endpoint',
    'capabilities',
    'status',
    'registeredAt',
    'lastHeartbeat',
  ],
  additionalProperties: false,
};

/**
 * All schemas collection
 */
export const schemas = {
  jsonrpcMessage: jsonrpcMessageSchema,
  jsonrpcRequest: jsonrpcRequestSchema,
  jsonrpcResponse: jsonrpcResponseSchema,
  jsonrpcNotification: jsonrpcNotificationSchema,
  mcpRequest: mcpRequestSchema,
  mcpResponse: mcpResponseSchema,
  mcpNotification: mcpNotificationSchema,
  mcpResource: mcpResourceSchema,
  mcpTool: mcpToolSchema,
  mcpCapability: mcpCapabilitySchema,
  mcpServiceInfo: mcpServiceInfoSchema,
};
