/**
 * Integration tests for ToolExecutionEngine security and monitoring features
 */

// @ts-expect-error - Jest globals are available without import
import { ToolHandler, ToolPermissions, ToolResult } from '../interfaces/IMCPTool';
import {
  ToolExecutionEngine,
  ToolExecutionOptions,
  ToolSecurityContext,
} from './ToolExecutionEngine';

// Mock tool handlers for integration testing
class SecureFileHandler implements ToolHandler {
  public name = 'SecureFileHandler';

  async execute(params: { path: string; operation: string }): Promise<ToolResult> {
    // Simulate file operations with security checks
    if (params.path.startsWith('/etc/') && params.operation === 'read') {
      throw new Error('Permission denied: Cannot read system files');
    }

    if (params.path.includes('..')) {
      throw new Error('Security violation: Path traversal detected');
    }

    return {
      success: true,
      result: {
        path: params.path,
        operation: params.operation,
        content: `Mock content for ${params.path}`,
      },
      metadata: {
        executionTime: 50,
        memoryUsage: 1024 * 1024,
      },
    };
  }
}

class NetworkToolHandler implements ToolHandler {
  public name = 'NetworkToolHandler';

  async execute(params: { url: string; method: string }): Promise<ToolResult> {
    // Simulate network operations with monitoring
    const startTime = Date.now();

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (params.url.includes('malicious.com')) {
      throw new Error('Network violation: Blocked domain detected');
    }

    return {
      success: true,
      result: {
        url: params.url,
        method: params.method,
        status: 200,
        response: 'Mock response data',
      },
      metadata: {
        executionTime: Date.now() - startTime,
        memoryUsage: 2 * 1024 * 1024,
      },
    };
  }
}

class ResourceIntensiveHandler implements ToolHandler {
  public name = 'ResourceIntensiveHandler';

  async execute(params: { intensity: number }): Promise<ToolResult> {
    // Simulate resource-intensive operation
    const startTime = Date.now();
    const iterations = params.intensity * 1000;

    // Simulate CPU-intensive work
    let result = 0;
    for (let i = 0; i < iterations; i++) {
      result += Math.random();
    }

    // Simulate memory usage
    const largeArray = new Array(params.intensity * 100).fill('data');

    return {
      success: true,
      result: {
        computedValue: result,
        arraySize: largeArray.length,
      },
      metadata: {
        executionTime: Date.now() - startTime,
        memoryUsage: largeArray.length * 4,
      },
    };
  }
}

class MaliciousHandler implements ToolHandler {
  public name = 'MaliciousHandler';

  async execute(params: any): Promise<ToolResult> {
    // Simulate malicious behavior
    if (params.action === 'leak_secrets') {
      return {
        success: true,
        result: {
          data: 'public info',
        },
        metadata: {
          credentials: 'mock-api-key-12345',
          internalState: { userId: 123, sessionToken: 'abc123' },
          systemInfo: '/etc/passwd content here',
        },
      };
    }

    if (params.action === 'sandbox_escape') {
      // Simulate sandbox escape attempt
      throw new Error('Permission denied: Attempted to access restricted resource');
    }

    return {
      success: true,
      result: { action: params.action },
    };
  }
}

describe('ToolExecutionEngine Integration Tests', () => {
  let engine: ToolExecutionEngine;
  let securityContext: ToolSecurityContext;

  beforeEach(() => {
    engine = new ToolExecutionEngine(
      10000, // 10 second timeout
      {
        cpuTime: 5000,
        memory: 32 * 1024 * 1024, // 32MB
        fileOperations: 100,
        networkOperations: 50,
      }
    );

    securityContext = {
      principal: 'integration-test-user',
      roles: ['user', 'tester'],
      sessionId: 'session-integration-123',
      ipAddress: '127.0.0.1',
    };
  });

  afterEach(() => {
    // Clean up any active executions
    const activeExecutions = engine.getActiveExecutions();
    for (const execution of activeExecutions) {
      engine.cancelExecution(execution.executionId);
    }
  });

  describe('End-to-End Security Scenarios', () => {
    it('should handle secure file operations with proper permissions', async () => {
      const handler = new SecureFileHandler();
      const permissions: ToolPermissions = {
        execute: true,
        requiredRoles: ['user'],
        acl: [{ principal: 'user', permissions: ['execute'], type: 'allow' }],
      };

      // Test allowed file operation
      const result1 = await engine.executeToolSecurely(
        handler,
        { path: '/tmp/test.txt', operation: 'read' },
        permissions,
        securityContext
      );

      expect(result1.success).toBe(true);
      expect(result1.result?.path).toBe('/tmp/test.txt');
      expect(result1.metadata?.context?.securityEnforced).toBe(true);

      // Test blocked file operation
      const result2 = await engine.executeToolSecurely(
        handler,
        { path: '/etc/passwd', operation: 'read' },
        permissions,
        securityContext
      );

      expect(result2.success).toBe(false);
      expect(result2.error).toContain('Permission denied');
    });

    it('should enforce network access controls', async () => {
      const handler = new NetworkToolHandler();
      const permissions: ToolPermissions = {
        execute: true,
        requiredRoles: ['user'],
        acl: [],
      };

      // Test allowed network operation
      const result1 = await engine.executeToolSecurely(
        handler,
        { url: 'https://api.example.com/data', method: 'GET' },
        permissions,
        securityContext
      );

      expect(result1.success).toBe(true);
      expect(result1.result?.status).toBe(200);

      // Test blocked network operation
      const result2 = await engine.executeToolSecurely(
        handler,
        { url: 'https://malicious.com/steal', method: 'POST' },
        permissions,
        securityContext
      );

      expect(result2.success).toBe(false);
      expect(result2.error).toContain('Network violation');
    });

    it('should handle role-based access control scenarios', async () => {
      const handler = new SecureFileHandler();

      // Admin-only permissions
      const adminPermissions: ToolPermissions = {
        execute: true,
        requiredRoles: ['admin'],
        acl: [],
      };

      // User without admin role
      const userContext: ToolSecurityContext = {
        principal: 'regular-user',
        roles: ['user'],
        sessionId: 'session-456',
      };

      const result = await engine.executeToolSecurely(
        handler,
        { path: '/tmp/test.txt', operation: 'read' },
        adminPermissions,
        userContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient roles');

      // Verify security violation was recorded
      const violations = engine.getSecurityViolations();
      expect(violations.some((v) => v.type === 'permission_denied')).toBe(true);
    });

    it('should enforce complex ACL rules', async () => {
      const handler = new NetworkToolHandler();
      const permissions: ToolPermissions = {
        execute: true,
        requiredRoles: [],
        acl: [
          // Allow all users to execute
          { principal: 'user', permissions: ['execute'], type: 'allow' },
          // But deny specific user
          { principal: 'blocked-user', permissions: ['execute'], type: 'deny' },
        ],
      };

      // Test allowed user
      const allowedResult = await engine.executeToolSecurely(
        handler,
        { url: 'https://api.example.com/data', method: 'GET' },
        permissions,
        securityContext
      );

      expect(allowedResult.success).toBe(true);

      // Test blocked user
      const blockedContext: ToolSecurityContext = {
        principal: 'blocked-user',
        roles: ['user'],
        sessionId: 'session-blocked',
      };

      const blockedResult = await engine.executeToolSecurely(
        handler,
        { url: 'https://api.example.com/data', method: 'GET' },
        permissions,
        blockedContext
      );

      expect(blockedResult.success).toBe(false);
      expect(blockedResult.error).toContain('ACL permission denied');
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should track performance across multiple tool executions', async () => {
      const handler = new ResourceIntensiveHandler();
      const permissions: ToolPermissions = {
        execute: true,
        requiredRoles: [],
        acl: [],
      };

      // Execute tool multiple times with different intensities
      const executions = [
        { intensity: 10 },
        { intensity: 20 },
        { intensity: 15 },
        { intensity: 25 },
        { intensity: 30 },
      ];

      for (const params of executions) {
        await engine.executeToolSecurely(handler, params, permissions, securityContext);
      }

      // Check performance metrics
      const metrics = engine.getToolPerformanceMetrics('ResourceIntensiveHandler');
      expect(metrics).toBeDefined();
      expect(metrics?.executionCount).toBe(5);
      expect(metrics?.successRate).toBe(1);
      expect(metrics?.averageExecutionTime).toBeGreaterThan(0);
      expect(metrics?.peakMemoryUsage).toBeGreaterThan(0);
    });

    it('should track failed executions in performance metrics', async () => {
      const handler = new SecureFileHandler();
      const permissions: ToolPermissions = {
        execute: true,
        requiredRoles: [],
        acl: [],
      };

      // Execute successful operations
      await engine.executeToolSecurely(
        handler,
        { path: '/tmp/file1.txt', operation: 'read' },
        permissions,
        securityContext
      );
      await engine.executeToolSecurely(
        handler,
        { path: '/tmp/file2.txt', operation: 'read' },
        permissions,
        securityContext
      );

      // Execute failed operations
      await engine.executeToolSecurely(
        handler,
        { path: '/etc/passwd', operation: 'read' },
        permissions,
        securityContext
      );
      await engine.executeToolSecurely(
        handler,
        { path: '../../../etc/shadow', operation: 'read' },
        permissions,
        securityContext
      );

      const metrics = engine.getToolPerformanceMetrics('SecureFileHandler');
      expect(metrics).toBeDefined();
      expect(metrics?.executionCount).toBe(4);
      expect(metrics?.successRate).toBe(0.5); // 2 success, 2 failures
      expect(metrics?.errorRate).toBe(0.5);
    });

    it('should provide comprehensive performance analytics', async () => {
      const handler1 = new NetworkToolHandler();
      const handler2 = new ResourceIntensiveHandler();
      const permissions: ToolPermissions = {
        execute: true,
        requiredRoles: [],
        acl: [],
      };

      // Execute different tools
      await engine.executeToolSecurely(
        handler1,
        { url: 'https://api1.example.com', method: 'GET' },
        permissions,
        securityContext
      );
      await engine.executeToolSecurely(handler2, { intensity: 15 }, permissions, securityContext);
      await engine.executeToolSecurely(
        handler1,
        { url: 'https://api2.example.com', method: 'POST' },
        permissions,
        securityContext
      );

      const allMetrics = engine.getAllPerformanceMetrics();
      expect(allMetrics.size).toBe(2);
      expect(allMetrics.has('NetworkToolHandler')).toBe(true);
      expect(allMetrics.has('ResourceIntensiveHandler')).toBe(true);

      const networkMetrics = allMetrics.get('NetworkToolHandler');
      expect(networkMetrics?.executionCount).toBe(2);

      const resourceMetrics = allMetrics.get('ResourceIntensiveHandler');
      expect(resourceMetrics?.executionCount).toBe(1);
    });
  });

  describe('Sandbox Security Integration', () => {
    it('should execute tools in sandbox with resource limits', async () => {
      const handler = new ResourceIntensiveHandler();
      const permissions: ToolPermissions = {
        execute: true,
        requiredRoles: [],
        acl: [],
      };
      const options: ToolExecutionOptions = {
        sandbox: {
          enabled: true,
          type: 'process',
          resourceLimits: {
            memory: 16 * 1024 * 1024, // 16MB limit
            cpuTime: 2000, // 2 second limit
            fileOperations: 10,
            networkOperations: 5,
          },
          allowedPaths: ['/tmp'],
          blockedPaths: ['/etc', '/var'],
          environment: {
            SANDBOX_MODE: 'true',
            MAX_OPERATIONS: '100',
          },
        },
      };

      const result = await engine.executeToolSecurely(
        handler,
        { intensity: 10 }, // Low intensity to stay within limits
        permissions,
        securityContext,
        options
      );

      expect(result.success).toBe(true);
      expect(result.metadata?.context?.sandboxed).toBe(true);
      expect(result.logs?.some((log) => log.message.includes('Executing tool in sandbox'))).toBe(
        true
      );
      expect(
        result.logs?.some((log) => log.message.includes('Sandbox execution completed successfully'))
      ).toBe(true);
    });

    it('should detect and handle sandbox violations', async () => {
      const handler = new MaliciousHandler();
      const permissions: ToolPermissions = {
        execute: true,
        requiredRoles: [],
        acl: [],
      };
      const options: ToolExecutionOptions = {
        sandbox: {
          enabled: true,
          type: 'process',
          resourceLimits: {
            memory: 8 * 1024 * 1024,
            cpuTime: 1000,
          },
        },
      };

      let violationDetected = false;
      engine.on('securityViolation', (context, violation) => {
        violationDetected = true;
        expect(violation.type).toBeDefined();
        expect(violation.severity).toBeDefined();
      });

      const result = await engine.executeToolSecurely(
        handler,
        { action: 'sandbox_escape' },
        permissions,
        securityContext,
        options
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should enforce rate limits across multiple requests', async () => {
      const handler = new NetworkToolHandler();
      const permissions: ToolPermissions = {
        execute: true,
        requiredRoles: [],
        acl: [],
        rateLimit: {
          maxRequests: 3,
          windowSeconds: 60,
          burstSize: 1,
        },
      };

      const results = [];

      // Execute requests up to the limit
      for (let i = 0; i < 5; i++) {
        const result = await engine.executeToolSecurely(
          handler,
          { url: `https://api.example.com/request${i}`, method: 'GET' },
          permissions,
          securityContext
        );
        results.push(result);
      }

      // First 4 should succeed (3 regular + 1 burst)
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[2].success).toBe(true);
      expect(results[3].success).toBe(true);

      // 5th should be rate limited
      expect(results[4].success).toBe(false);
      expect(results[4].error).toContain('Rate limit exceeded');
    });

    it('should apply rate limits per user', async () => {
      const handler = new NetworkToolHandler();
      const permissions: ToolPermissions = {
        execute: true,
        requiredRoles: [],
        acl: [],
        rateLimit: {
          maxRequests: 2,
          windowSeconds: 60,
        },
      };

      const user1Context: ToolSecurityContext = {
        principal: 'user1',
        roles: ['user'],
        sessionId: 'session-user1',
      };

      const user2Context: ToolSecurityContext = {
        principal: 'user2',
        roles: ['user'],
        sessionId: 'session-user2',
      };

      // User1 executes up to limit
      const user1Result1 = await engine.executeToolSecurely(
        handler,
        { url: 'https://api.example.com/user1-1', method: 'GET' },
        permissions,
        user1Context
      );
      const user1Result2 = await engine.executeToolSecurely(
        handler,
        { url: 'https://api.example.com/user1-2', method: 'GET' },
        permissions,
        user1Context
      );
      const user1Result3 = await engine.executeToolSecurely(
        handler,
        { url: 'https://api.example.com/user1-3', method: 'GET' },
        permissions,
        user1Context
      );

      // User2 should still be able to execute
      const user2Result1 = await engine.executeToolSecurely(
        handler,
        { url: 'https://api.example.com/user2-1', method: 'GET' },
        permissions,
        user2Context
      );

      expect(user1Result1.success).toBe(true);
      expect(user1Result2.success).toBe(true);
      expect(user1Result3.success).toBe(false); // Rate limited
      expect(user2Result1.success).toBe(true); // Different user, not rate limited
    });
  });

  describe('Result Sanitization Integration', () => {
    it('should sanitize sensitive information from tool results', async () => {
      const handler = new MaliciousHandler();
      const permissions: ToolPermissions = {
        execute: true,
        requiredRoles: [],
        acl: [],
      };

      const result = await engine.executeToolSecurely(
        handler,
        { action: 'leak_secrets' },
        permissions,
        securityContext
      );

      expect(result.success).toBe(true);
      expect(result.result?.data).toBe('public info'); // Public data preserved
      expect(result.metadata?.credentials).toBeUndefined(); // Sensitive data removed
      expect(result.metadata?.internalState).toBeUndefined(); // Internal state removed
      expect(result.metadata?.systemInfo).toBeUndefined(); // System info removed
    });

    it('should sanitize error messages to prevent information disclosure', async () => {
      const sensitiveErrorHandler = {
        name: 'SensitiveErrorHandler',
        async execute(_params: any): Promise<ToolResult> {
          throw new Error(
            'Database connection failed: password=[REDACTED] at /etc/database/config.json from 192.168.1.100'
          );
        },
      };

      const permissions: ToolPermissions = {
        execute: true,
        requiredRoles: [],
        acl: [],
      };

      const result = await engine.executeToolSecurely(
        sensitiveErrorHandler as any,
        {},
        permissions,
        securityContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).not.toContain('mock-password'); // Password should be redacted
      expect(result.error).not.toContain('/etc/database/config.json'); // Path should be redacted
      expect(result.error).not.toContain('192.168.1.100'); // IP should be redacted
      expect(result.error).toContain('[REDACTED]'); // Should contain redaction markers
    });
  });

  describe('Comprehensive Security Monitoring', () => {
    it('should provide comprehensive security violation reporting', async () => {
      const handler = new SecureFileHandler();

      // Create various security violations
      const scenarios = [
        {
          permissions: { execute: false, requiredRoles: [], acl: [] },
          context: securityContext,
          params: { path: '/tmp/test.txt', operation: 'read' },
        },
        {
          permissions: { execute: true, requiredRoles: ['admin'], acl: [] },
          context: { ...securityContext, roles: ['user'] },
          params: { path: '/tmp/test.txt', operation: 'read' },
        },
        {
          permissions: {
            execute: true,
            requiredRoles: [],
            acl: [{ principal: 'blocked-user', permissions: ['execute'], type: 'deny' as const }],
          },
          context: { ...securityContext, principal: 'blocked-user' },
          params: { path: '/tmp/test.txt', operation: 'read' },
        },
      ];

      for (const scenario of scenarios) {
        await engine.executeToolSecurely(
          handler,
          scenario.params,
          scenario.permissions,
          scenario.context
        );
      }

      const violations = engine.getSecurityViolations();
      expect(violations.length).toBe(3);

      const violationTypes = violations.map((v) => v.type);
      expect(violationTypes.every((type) => type === 'permission_denied')).toBe(true);

      const violationSeverities = violations.map((v) => v.severity);
      expect(violationSeverities.every((severity) => severity === 'medium')).toBe(true);
    });

    it('should track security violations over time', async () => {
      const handler = new SecureFileHandler();
      const permissions: ToolPermissions = {
        execute: false,
        requiredRoles: [],
        acl: [],
      };

      const startTime = new Date();

      // Create violations
      await engine.executeToolSecurely(
        handler,
        { path: '/tmp/1.txt', operation: 'read' },
        permissions,
        securityContext
      );
      await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay
      await engine.executeToolSecurely(
        handler,
        { path: '/tmp/2.txt', operation: 'read' },
        permissions,
        securityContext
      );

      const allViolations = engine.getSecurityViolations();
      const recentViolations = engine.getSecurityViolations(startTime);

      expect(allViolations.length).toBeGreaterThanOrEqual(2);
      expect(recentViolations.length).toBe(2);
      expect(recentViolations.every((v) => v.timestamp >= startTime)).toBe(true);
    });
  });
});
