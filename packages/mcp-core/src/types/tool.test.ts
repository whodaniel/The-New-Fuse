/**
 * Tests for MCP Tool types and validation
 */

import { mcpValidator } from '../validation/validator';
import {
  NetworkAccessConfig,
  QueueStatistics,
  ToolExecutionContext,
  ToolExecutionLog,
  ToolExecutionStatus,
  ToolSandboxConfig,
  ToolSearchCriteria,
  ToolType,
} from './tool';

describe('Tool Types', () => {
  describe('Enumerations', () => {
    it('should define tool types', () => {
      expect(ToolType.FUNCTION).toBe('function');
      expect(ToolType.SCRIPT).toBe('script');
      expect(ToolType.API_CALL).toBe('api_call');
      expect(ToolType.DATABASE_QUERY).toBe('database_query');
      expect(ToolType.FILE_OPERATION).toBe('file_operation');
      expect(ToolType.CUSTOM).toBe('custom');
    });

    it('should define execution statuses', () => {
      expect(ToolExecutionStatus.PENDING).toBe('pending');
      expect(ToolExecutionStatus.RUNNING).toBe('running');
      expect(ToolExecutionStatus.COMPLETED).toBe('completed');
      expect(ToolExecutionStatus.FAILED).toBe('failed');
      expect(ToolExecutionStatus.CANCELLED).toBe('cancelled');
      expect(ToolExecutionStatus.TIMEOUT).toBe('timeout');
    });
  });

  describe('Interface Validation', () => {
    it('should validate tool execution context', () => {
      const context: ToolExecutionContext = {
        executionId: 'exec-123',
        toolName: 'test-tool',
        executor: 'user-456',
        parameters: { input: 'test' },
        startTime: new Date(),
        timeout: 30000,
        metadata: {
          priority: 'high',
          retryCount: 0,
        },
        parentExecutionId: 'parent-exec-789',
      };

      expect(context.executionId).toBe('exec-123');
      expect(context.toolName).toBe('test-tool');
      expect(context.executor).toBe('user-456');
      expect(context.parameters).toEqual({ input: 'test' });
      expect(context.startTime).toBeInstanceOf(Date);
      expect(context.timeout).toBe(30000);
      expect(context.metadata?.priority).toBe('high');
      expect(context.parentExecutionId).toBe('parent-exec-789');
    });

    it('should validate tool execution log', () => {
      const log: ToolExecutionLog = {
        id: 'log-456',
        executionId: 'exec-123',
        level: 'info',
        message: 'Tool execution started',
        timestamp: new Date(),
        data: {
          step: 'initialization',
          progress: 0,
        },
      };

      expect(log.id).toBe('log-456');
      expect(log.executionId).toBe('exec-123');
      expect(log.level).toBe('info');
      expect(log.message).toBe('Tool execution started');
      expect(log.timestamp).toBeInstanceOf(Date);
      expect(log.data?.step).toBe('initialization');
    });

    it('should validate tool search criteria', () => {
      const criteria: ToolSearchCriteria = {
        name: 'test-*',
        type: ToolType.FUNCTION,
        description: 'testing',
        capabilities: ['validation', 'execution'],
        tags: ['utility', 'test'],
      };

      expect(criteria.name).toBe('test-*');
      expect(criteria.type).toBe(ToolType.FUNCTION);
      expect(criteria.description).toBe('testing');
      expect(criteria.capabilities).toContain('validation');
      expect(criteria.tags).toContain('utility');
    });

    it('should validate queue statistics', () => {
      const stats: QueueStatistics = {
        currentSize: 5,
        totalEnqueued: 100,
        totalDequeued: 95,
        averageWaitTime: 250.5,
        peakSize: 15,
        createdAt: new Date(),
      };

      expect(stats.currentSize).toBe(5);
      expect(stats.totalEnqueued).toBe(100);
      expect(stats.totalDequeued).toBe(95);
      expect(stats.averageWaitTime).toBe(250.5);
      expect(stats.peakSize).toBe(15);
      expect(stats.createdAt).toBeInstanceOf(Date);
    });

    it('should validate tool sandbox configuration', () => {
      const sandboxConfig: ToolSandboxConfig = {
        enabled: true,
        type: 'docker',
        resourceLimits: {
          cpuTime: 10000,
          memory: 512 * 1024 * 1024,
          fileOperations: 100,
          networkOperations: 50,
        },
        allowedPaths: ['/tmp', '/var/tmp'],
        blockedPaths: ['/etc', '/root'],
        environment: {
          NODE_ENV: 'sandbox',
          PATH: '/usr/local/bin:/usr/bin:/bin',
        },
        networkAccess: {
          enabled: true,
          allowedDomains: ['api.example.com'],
          blockedDomains: ['malicious.com'],
          allowedPorts: [80, 443],
          blockedPorts: [22, 23],
        },
      };

      expect(sandboxConfig.enabled).toBe(true);
      expect(sandboxConfig.type).toBe('docker');
      expect(sandboxConfig.resourceLimits.memory).toBe(512 * 1024 * 1024);
      expect(sandboxConfig.allowedPaths).toContain('/tmp');
      expect(sandboxConfig.blockedPaths).toContain('/etc');
      expect(sandboxConfig.environment?.NODE_ENV).toBe('sandbox');
      expect(sandboxConfig.networkAccess?.enabled).toBe(true);
      expect(sandboxConfig.networkAccess?.allowedDomains).toContain('api.example.com');
    });

    it('should validate network access configuration', () => {
      const networkConfig: NetworkAccessConfig = {
        enabled: true,
        allowedDomains: ['trusted.com', '*.api.example.com'],
        blockedDomains: ['malware.com', 'phishing.net'],
        allowedPorts: [80, 443, 8080],
        blockedPorts: [22, 23, 3389],
      };

      expect(networkConfig.enabled).toBe(true);
      expect(networkConfig.allowedDomains).toContain('trusted.com');
      expect(networkConfig.allowedDomains).toContain('*.api.example.com');
      expect(networkConfig.blockedDomains).toContain('malware.com');
      expect(networkConfig.allowedPorts).toContain(443);
      expect(networkConfig.blockedPorts).toContain(22);
    });
  });

  describe('MCP Tool Validation', () => {
    it('should validate a complete MCP tool', () => {
      const tool = {
        name: 'calculator',
        description: 'A simple calculator tool',
        inputSchema: {
          type: 'object',
          properties: {
            operation: {
              type: 'string',
              enum: ['add', 'subtract', 'multiply', 'divide'],
            },
            operands: {
              type: 'array',
              items: { type: 'number' },
              minItems: 2,
              maxItems: 2,
            },
          },
          required: ['operation', 'operands'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            result: { type: 'number' },
            operation: { type: 'string' },
          },
        },
        config: {
          timeout: 5000,
          maxMemory: 1024 * 1024,
          sandboxed: true,
        },
      };

      const result = mcpValidator.validateMCPTool(tool);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject tool without required fields', () => {
      const invalidTool = {
        name: 'incomplete-tool',
        // missing description and inputSchema
      };

      const result = mcpValidator.validateMCPTool(invalidTool);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((error) => error.includes('description'))).toBe(true);
      expect(result.errors.some((error) => error.includes('inputSchema'))).toBe(true);
    });

    it('should reject tool with invalid input schema', () => {
      const invalidTool = {
        name: 'bad-schema-tool',
        description: 'Tool with bad schema',
        inputSchema: {
          // missing required 'type' field
          properties: {
            input: { type: 'string' },
          },
        },
      };

      const result = mcpValidator.validateMCPTool(invalidTool);
      expect(result.valid).toBe(false);
      expect(result.errors.some((error) => error.includes('type'))).toBe(true);
    });

    it('should accept tool with minimal required fields', () => {
      const minimalTool = {
        name: 'minimal-tool',
        description: 'A minimal tool',
        inputSchema: {
          type: 'object',
        },
      };

      const result = mcpValidator.validateMCPTool(minimalTool);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate tool with complex configuration', () => {
      const tool = {
        name: 'complex-tool',
        description: 'A tool with complex configuration',
        inputSchema: {
          type: 'object',
          properties: {
            data: { type: 'string' },
          },
          required: ['data'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            processed: { type: 'string' },
          },
        },
        config: {
          timeout: 30000,
          maxMemory: 256 * 1024 * 1024,
          sandboxed: true,
          environment: {
            TOOL_MODE: 'production',
            LOG_LEVEL: 'info',
          },
          resourceLimits: {
            cpuTime: 15000,
            memory: 256 * 1024 * 1024,
            fileOperations: 200,
            networkOperations: 100,
          },
        },
      };

      const result = mcpValidator.validateMCPTool(tool);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Tool Interface Implementations', () => {
    it('should validate tool result structure', () => {
      const successResult = {
        success: true,
        result: { output: 'processed data' },
        metadata: {
          executionTime: 150,
          memoryUsage: 1024,
          toolVersion: '1.2.0',
          context: { step: 'final' },
          warnings: ['Minor issue detected'],
        },
      };

      expect(successResult.success).toBe(true);
      expect(successResult.result?.output).toBe('processed data');
      expect(successResult.metadata?.executionTime).toBe(150);
      expect(successResult.metadata?.warnings).toContain('Minor issue detected');

      const errorResult = {
        success: false,
        error: 'Processing failed',
        metadata: {
          executionTime: 75,
          toolVersion: '1.2.0',
          context: { error: 'Invalid input format' },
        },
      };

      expect(errorResult.success).toBe(false);
      expect(errorResult.error).toBe('Processing failed');
      expect(errorResult.metadata?.context?.error).toBe('Invalid input format');
    });

    it('should validate validation result structure', () => {
      const validationResult = {
        valid: true,
        normalizedParams: {
          input: 'normalized input',
          options: { format: 'json' },
        },
      };

      expect(validationResult.valid).toBe(true);
      expect(validationResult.normalizedParams?.input).toBe('normalized input');

      const invalidResult = {
        valid: false,
        errors: ['Missing required field: input', 'Invalid format for field: options'],
      };

      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toHaveLength(2);
      expect(invalidResult.errors).toContain('Missing required field: input');
    });

    it('should validate tool usage statistics', () => {
      const usageStats = {
        totalExecutions: 1000,
        successfulExecutions: 950,
        failedExecutions: 50,
        averageExecutionTime: 125.5,
        lastExecution: new Date(),
      };

      expect(usageStats.totalExecutions).toBe(1000);
      expect(usageStats.successfulExecutions).toBe(950);
      expect(usageStats.failedExecutions).toBe(50);
      expect(usageStats.averageExecutionTime).toBe(125.5);
      expect(usageStats.lastExecution).toBeInstanceOf(Date);
      expect(usageStats.successfulExecutions + usageStats.failedExecutions).toBe(
        usageStats.totalExecutions
      );
    });

    it('should validate tool permissions structure', () => {
      const permissions = {
        execute: true,
        requiredRoles: ['tool-user', 'admin'],
        acl: [
          {
            principal: 'user:alice',
            permissions: ['execute'],
            type: 'allow' as const,
          },
          {
            principal: 'role:guest',
            permissions: ['execute'],
            type: 'deny' as const,
          },
        ],
        rateLimit: {
          maxRequests: 100,
          windowSeconds: 3600,
          burstSize: 10,
        },
      };

      expect(permissions.execute).toBe(true);
      expect(permissions.requiredRoles).toContain('tool-user');
      expect(permissions.acl).toHaveLength(2);
      expect(permissions.acl![0].type).toBe('allow');
      expect(permissions.acl![1].type).toBe('deny');
      expect(permissions.rateLimit?.maxRequests).toBe(100);
      expect(permissions.rateLimit?.windowSeconds).toBe(3600);
    });
  });

  describe('JSON Schema Validation', () => {
    it('should validate JSON schema structure', () => {
      const schema = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
          },
          age: {
            type: 'number',
            minimum: 0,
            maximum: 150,
          },
          email: {
            type: 'string',
            format: 'email',
          },
          preferences: {
            type: 'object',
            properties: {
              theme: {
                type: 'string',
                enum: ['light', 'dark'],
              },
            },
            additionalProperties: false,
          },
        },
        required: ['name', 'email'],
        additionalProperties: false,
      };

      expect(schema.type).toBe('object');
      expect(schema.properties?.name?.type).toBe('string');
      expect(schema.properties?.age?.minimum).toBe(0);
      expect(schema.properties?.email?.format).toBe('email');
      expect(schema.required).toContain('name');
      expect(schema.required).toContain('email');
      expect(schema.additionalProperties).toBe(false);
    });

    it('should validate nested schema structures', () => {
      const nestedSchema = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              profile: {
                type: 'object',
                properties: {
                  bio: { type: 'string' },
                  avatar: { type: 'string', format: 'uri' },
                },
              },
            },
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            uniqueItems: true,
          },
        },
      };

      expect(nestedSchema.properties?.user?.type).toBe('object');
      expect(nestedSchema.properties?.user?.properties?.profile?.type).toBe('object');
      expect(nestedSchema.properties?.tags?.type).toBe('array');
      expect(nestedSchema.properties?.tags?.items?.type).toBe('string');
      expect(nestedSchema.properties?.tags?.uniqueItems).toBe(true);
    });
  });
});
