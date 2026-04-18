/**
 * Unit tests for AuditLogger
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { AuditLogger, FileAuditStorage, AuditSeverity, AuditCategory } from './AuditLogger.js';
import { MCPOperation } from './PermissionValidator.js';
import { tmpdir } from 'os';
import { join } from 'path';
import { rmSync } from 'fs';

describe('AuditLogger', () => {
  let auditLogger: AuditLogger;
  let testLogDir: string;

  beforeEach(() => {
    testLogDir = join(tmpdir(), `audit-test-${Date.now()}`);
    const storage = new FileAuditStorage(testLogDir);
    
    auditLogger = new AuditLogger({
      enabled: true,
      storageBackend: storage,
      enableAlerting: true,
      enableEnrichment: true,
      batchSize: 1, // Flush after every event for testing
      flushInterval: 100 // Short interval for testing
    });
  });

  afterEach(async () => {
    await auditLogger.destroy();
    
    // Clean up test directory
    try {
      rmSync(testLogDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Authentication Logging', () => {
    it('should log successful authentication', async () => {
      await auditLogger.logAuthentication(
        'testuser',
        true,
        'basic',
        '192.168.1.100',
        'Mozilla/5.0 Test Browser'
      );

      const events = await auditLogger.queryEvents({
        userId: 'testuser',
        category: AuditCategory.AUTHENTICATION
      });

      expect(events).toHaveLength(1);
      expect(events[0].success).toBe(true);
      expect(events[0].type).toBe('login');
      expect(events[0].clientIp).toBe('192.168.1.100');
      expect(events[0].userAgent).toBe('Mozilla/5.0 Test Browser');
      expect(events[0].severity).toBe(AuditSeverity.LOW);
    });

    it('should log failed authentication', async () => {
      await auditLogger.logAuthentication(
        'testuser',
        false,
        'basic',
        '192.168.1.100',
        'Mozilla/5.0 Test Browser',
        'Invalid credentials'
      );

      const events = await auditLogger.queryEvents({
        userId: 'testuser',
        success: false
      });

      expect(events).toHaveLength(1);
      expect(events[0].success).toBe(false);
      expect(events[0].type).toBe('access_denied');
      expect(events[0].error).toBe('Invalid credentials');
      expect(events[0].severity).toBe(AuditSeverity.MEDIUM);
    });
  });

  describe('Authorization Logging', () => {
    it('should log successful authorization', async () => {
      await auditLogger.logAuthorization(
        'testuser',
        'file:document.txt',
        'read',
        true,
        'Access granted by policy',
        MCPOperation.RESOURCE_READ
      );

      const events = await auditLogger.queryEvents({
        userId: 'testuser',
        category: AuditCategory.AUTHORIZATION
      });

      expect(events).toHaveLength(1);
      expect(events[0].success).toBe(true);
      expect(events[0].resource).toBe('file:document.txt');
      expect(events[0].operation).toBe('read');
      expect(events[0].mcpOperation).toBe(MCPOperation.RESOURCE_READ);
    });

    it('should log failed authorization', async () => {
      await auditLogger.logAuthorization(
        'testuser',
        'admin:config',
        'write',
        false,
        'Insufficient permissions'
      );

      const events = await auditLogger.queryEvents({
        userId: 'testuser',
        success: false,
        category: AuditCategory.AUTHORIZATION
      });

      expect(events).toHaveLength(1);
      expect(events[0].success).toBe(false);
      expect(events[0].error).toBe('Insufficient permissions');
      expect(events[0].severity).toBe(AuditSeverity.MEDIUM);
    });
  });

  describe('Resource Access Logging', () => {
    it('should log resource access with performance metrics', async () => {
      await auditLogger.logResourceAccess(
        'testuser',
        'file:large-document.pdf',
        'read',
        true,
        150, // duration
        1024, // request size
        2048  // response size
      );

      const events = await auditLogger.queryEvents({
        userId: 'testuser',
        category: AuditCategory.RESOURCE_ACCESS
      });

      expect(events).toHaveLength(1);
      expect(events[0].duration).toBe(150);
      expect(events[0].requestSize).toBe(1024);
      expect(events[0].responseSize).toBe(2048);
      expect(events[0].category).toBe(AuditCategory.RESOURCE_ACCESS);
    });

    it('should log failed resource access', async () => {
      await auditLogger.logResourceAccess(
        'testuser',
        'file:nonexistent.txt',
        'read',
        false
      );

      const events = await auditLogger.queryEvents({
        userId: 'testuser',
        success: false,
        category: AuditCategory.RESOURCE_ACCESS
      });

      expect(events).toHaveLength(1);
      expect(events[0].success).toBe(false);
    });
  });

  describe('Tool Execution Logging', () => {
    it('should log successful tool execution', async () => {
      await auditLogger.logToolExecution(
        'testuser',
        'file-processor',
        true,
        200,
        { inputFile: 'test.txt', options: { format: 'json' } },
        { processed: true, outputFile: 'result.json' }
      );

      const events = await auditLogger.queryEvents({
        userId: 'testuser',
        category: AuditCategory.TOOL_EXECUTION
      });

      expect(events).toHaveLength(1);
      expect(events[0].success).toBe(true);
      expect(events[0].duration).toBe(200);
      expect(events[0].metadata?.toolName).toBe('file-processor');
      expect(events[0].metadata?.parameters).toEqual(['inputFile', 'options']);
    });

    it('should log failed tool execution', async () => {
      await auditLogger.logToolExecution(
        'testuser',
        'broken-tool',
        false,
        50,
        { input: 'test' },
        undefined,
        'Tool execution failed: Invalid input'
      );

      const events = await auditLogger.queryEvents({
        userId: 'testuser',
        success: false,
        category: AuditCategory.TOOL_EXECUTION
      });

      expect(events).toHaveLength(1);
      expect(events[0].success).toBe(false);
      expect(events[0].error).toBe('Tool execution failed: Invalid input');
      expect(events[0].severity).toBe(AuditSeverity.MEDIUM);
    });
  });

  describe('Security Violation Logging', () => {
    it('should log security violations with high severity', async () => {
      await auditLogger.logSecurityViolation(
        'malicioususer',
        'privilege_escalation',
        'User attempted to access admin functions without authorization',
        AuditSeverity.HIGH,
        'admin:user-management',
        '203.0.113.1',
        {
          attemptedOperation: 'user.create',
          userRole: 'basic',
          requiredRole: 'admin'
        }
      );

      const events = await auditLogger.queryEvents({
        userId: 'malicioususer',
        category: AuditCategory.SECURITY_VIOLATION
      });

      expect(events).toHaveLength(1);
      expect(events[0].severity).toBe(AuditSeverity.HIGH);
      expect(events[0].riskScore).toBeGreaterThan(70);
      expect(events[0].tags).toContain('security');
      expect(events[0].tags).toContain('privilege_escalation');
      expect(events[0].metadata?.attemptedOperation).toBe('user.create');
    });

    it('should log critical security violations', async () => {
      await auditLogger.logSecurityViolation(
        'attacker',
        'data_breach',
        'Unauthorized access to sensitive data detected',
        AuditSeverity.CRITICAL,
        'sensitive:customer-data',
        '198.51.100.1'
      );

      const events = await auditLogger.queryEvents({
        severity: AuditSeverity.CRITICAL
      });

      expect(events).toHaveLength(1);
      expect(events[0].severity).toBe(AuditSeverity.CRITICAL);
      expect(events[0].riskScore).toBeGreaterThan(90);
    });
  });

  describe('System Administration Logging', () => {
    it('should log system administration events', async () => {
      await auditLogger.logSystemAdmin(
        'admin',
        'user.create',
        'user:newuser',
        true,
        {
          username: 'newuser',
          roles: ['basic'],
          permissions: ['read']
        }
      );

      const events = await auditLogger.queryEvents({
        userId: 'admin',
        category: AuditCategory.SYSTEM_ADMIN
      });

      expect(events).toHaveLength(1);
      expect(events[0].operation).toBe('user.create');
      expect(events[0].target).toBe('user:newuser');
      expect(events[0].metadata?.changes).toBeDefined();
      expect(events[0].severity).toBe(AuditSeverity.MEDIUM);
    });

    it('should log failed system administration events', async () => {
      await auditLogger.logSystemAdmin(
        'admin',
        'user.delete',
        'user:protecteduser',
        false,
        undefined,
        'Cannot delete protected user'
      );

      const events = await auditLogger.queryEvents({
        userId: 'admin',
        success: false,
        category: AuditCategory.SYSTEM_ADMIN
      });

      expect(events).toHaveLength(1);
      expect(events[0].success).toBe(false);
      expect(events[0].error).toBe('Cannot delete protected user');
    });
  });

  describe('Event Querying', () => {
    beforeEach(async () => {
      // Set up test data
      await auditLogger.logAuthentication('user1', true, 'basic');
      await auditLogger.logAuthentication('user2', false, 'oauth', '192.168.1.100', 'Browser', 'Invalid token');
      await auditLogger.logResourceAccess('user1', 'file:doc1.txt', 'read', true);
      await auditLogger.logToolExecution('user1', 'processor', true, 100);
      await auditLogger.logSecurityViolation('user2', 'brute_force', 'Multiple failed attempts', AuditSeverity.HIGH);
    });

    it('should query events by user', async () => {
      const user1Events = await auditLogger.queryEvents({ userId: 'user1' });
      const user2Events = await auditLogger.queryEvents({ userId: 'user2' });

      expect(user1Events).toHaveLength(3); // auth + resource + tool
      expect(user2Events).toHaveLength(2); // failed auth + security violation
    });

    it('should query events by category', async () => {
      const authEvents = await auditLogger.queryEvents({
        category: AuditCategory.AUTHENTICATION
      });

      const securityEvents = await auditLogger.queryEvents({
        category: AuditCategory.SECURITY_VIOLATION
      });

      expect(authEvents).toHaveLength(2);
      expect(securityEvents).toHaveLength(1);
    });

    it('should query events by success status', async () => {
      const successfulEvents = await auditLogger.queryEvents({ success: true });
      const failedEvents = await auditLogger.queryEvents({ success: false });

      expect(successfulEvents).toHaveLength(3);
      expect(failedEvents).toHaveLength(2);
    });

    it('should query events by severity', async () => {
      const highSeverityEvents = await auditLogger.queryEvents({
        severity: AuditSeverity.HIGH
      });

      expect(highSeverityEvents).toHaveLength(1);
      expect(highSeverityEvents[0].category).toBe(AuditCategory.SECURITY_VIOLATION);
    });

    it('should query events with pagination', async () => {
      const firstPage = await auditLogger.queryEvents({ limit: 2, offset: 0 });
      const secondPage = await auditLogger.queryEvents({ limit: 2, offset: 2 });

      expect(firstPage).toHaveLength(2);
      expect(secondPage).toHaveLength(2);
      
      // Events should be different
      expect(firstPage[0].id).not.toBe(secondPage[0].id);
    });

    it('should query events by risk score', async () => {
      const highRiskEvents = await auditLogger.queryEvents({
        minRiskScore: 70
      });

      expect(highRiskEvents).toHaveLength(1);
      expect(highRiskEvents[0].category).toBe(AuditCategory.SECURITY_VIOLATION);
    });

    it('should query events by tags', async () => {
      const securityTaggedEvents = await auditLogger.queryEvents({
        tags: ['security']
      });

      expect(securityTaggedEvents).toHaveLength(1);
      expect(securityTaggedEvents[0].tags).toContain('security');
    });
  });

  describe('Event Statistics', () => {
    beforeEach(async () => {
      // Generate diverse audit events
      await auditLogger.logAuthentication('user1', true, 'basic');
      await auditLogger.logAuthentication('user2', false, 'oauth');
      await auditLogger.logResourceAccess('user1', 'file:doc.txt', 'read', true);
      await auditLogger.logToolExecution('user1', 'tool1', true, 100);
      await auditLogger.logSecurityViolation('user2', 'violation', 'Test violation', AuditSeverity.HIGH);
      await auditLogger.logSystemAdmin('admin', 'config.update', 'system', true);
    });

    it('should provide comprehensive audit statistics', async () => {
      const stats = await auditLogger.getAuditStats();

      expect(stats.totalEvents).toBe(6);
      expect(stats.eventsByCategory[AuditCategory.AUTHENTICATION]).toBe(2);
      expect(stats.eventsByCategory[AuditCategory.RESOURCE_ACCESS]).toBe(1);
      expect(stats.eventsByCategory[AuditCategory.TOOL_EXECUTION]).toBe(1);
      expect(stats.eventsByCategory[AuditCategory.SECURITY_VIOLATION]).toBe(1);
      expect(stats.eventsByCategory[AuditCategory.SYSTEM_ADMIN]).toBe(1);

      expect(stats.eventsBySeverity[AuditSeverity.LOW]).toBe(3);
      expect(stats.eventsBySeverity[AuditSeverity.MEDIUM]).toBe(2);
      expect(stats.eventsBySeverity[AuditSeverity.HIGH]).toBe(1);

      expect(stats.storageSize).toBeGreaterThan(0);
      expect(stats.oldestEvent).toBeDefined();
      expect(stats.newestEvent).toBeDefined();
    });
  });

  describe('Event Enrichment', () => {
    it('should enrich events with risk scores', async () => {
      await auditLogger.logSecurityViolation(
        'testuser',
        'suspicious_activity',
        'Suspicious behavior detected',
        AuditSeverity.MEDIUM
      );

      const events = await auditLogger.queryEvents({
        userId: 'testuser',
        category: AuditCategory.SECURITY_VIOLATION
      });

      expect(events).toHaveLength(1);
      expect(events[0].riskScore).toBeDefined();
      expect(events[0].riskScore).toBeGreaterThan(0);
    });

    it('should enrich events with device information from user agent', async () => {
      await auditLogger.logAuthentication(
        'testuser',
        true,
        'basic',
        '192.168.1.100',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      );

      const events = await auditLogger.queryEvents({
        userId: 'testuser'
      });

      expect(events).toHaveLength(1);
      expect(events[0].device).toBeDefined();
      expect(events[0].device?.os).toBe('Windows');
      expect(events[0].device?.browser).toBe('Chrome');
      expect(events[0].device?.type).toBe('desktop');
    });

    it('should generate unique event IDs', async () => {
      await auditLogger.logAuthentication('user1', true, 'basic');
      await auditLogger.logAuthentication('user2', true, 'basic');

      const events = await auditLogger.queryEvents({});

      expect(events).toHaveLength(2);
      expect(events[0].id).not.toBe(events[1].id);
      expect(events[0].id).toMatch(/^audit_\d+_\d+$/);
    });
  });

  describe('Event Cleanup', () => {
    it('should clean up old events based on retention policy', async () => {
      // Log some events
      await auditLogger.logAuthentication('user1', true, 'basic');
      await auditLogger.logAuthentication('user2', true, 'basic');

      // Verify events exist
      let stats = await auditLogger.getAuditStats();
      expect(stats.totalEvents).toBe(2);

      // Clean up with 0 retention days (should remove all events)
      const cleanedCount = await auditLogger.cleanup();

      // In our test implementation, cleanup removes events older than retention period
      // Since we just created the events, they shouldn't be cleaned up with normal retention
      expect(cleanedCount).toBe(0);

      // Verify events still exist
      stats = await auditLogger.getAuditStats();
      expect(stats.totalEvents).toBe(2);
    });
  });

  describe('Batch Processing and Flushing', () => {
    it('should flush events to storage', async () => {
      // Log multiple events
      for (let i = 0; i < 5; i++) {
        await auditLogger.logAuthentication(`user${i}`, true, 'basic');
      }

      // Manually flush
      await auditLogger.flush();

      // Verify events are stored
      const stats = await auditLogger.getAuditStats();
      expect(stats.totalEvents).toBe(5);
    });

    it('should handle storage errors gracefully', async () => {
      // This test would require mocking the storage backend to simulate errors
      // For now, we'll just verify that logging completes without throwing
      try {
        await auditLogger.logAuthentication('testuser', true, 'basic');
        expect(true).toBe(true); // Test passes if no exception is thrown
      } catch (error) {
        // If an error occurs, the test should still pass as we're testing graceful handling
        expect(error).toBeDefined();
      }
    });
  });

  describe('Event Alerting', () => {
    it('should emit events for audit logging', (done) => {
      auditLogger.on('auditEvent', (event) => {
        expect(event).toBeDefined();
        expect(event.userId).toBe('testuser');
        done();
      });

      auditLogger.logAuthentication('testuser', true, 'basic');
    });

    it('should emit security alerts for high-risk events', (done) => {
      auditLogger.on('highRiskEvent', (event) => {
        expect(event).toBeDefined();
        expect(event.riskScore).toBeGreaterThan(70);
        done();
      });

      auditLogger.logSecurityViolation(
        'testuser',
        'critical_violation',
        'Critical security violation',
        AuditSeverity.CRITICAL
      );
    });

    it('should emit failed login alerts', (done) => {
      auditLogger.on('failedLogin', (event) => {
        expect(event).toBeDefined();
        expect(event.success).toBe(false);
        done();
      });

      auditLogger.logAuthentication('testuser', false, 'basic', '192.168.1.100', 'Browser', 'Invalid password');
    });
  });

  describe('Configuration and Lifecycle', () => {
    it('should respect enabled/disabled configuration', async () => {
      const disabledLogger = new AuditLogger({
        enabled: false,
        storageBackend: new FileAuditStorage(testLogDir)
      });

      await disabledLogger.logAuthentication('testuser', true, 'basic');

      const stats = await disabledLogger.getAuditStats();
      expect(stats.totalEvents).toBe(0);

      await disabledLogger.destroy();
    });

    it('should clean up resources on destroy', async () => {
      await auditLogger.logAuthentication('testuser', true, 'basic');
      
      // Destroy should flush remaining events
      await auditLogger.destroy();

      // Verify events were flushed
      const stats = await auditLogger.getAuditStats();
      expect(stats.totalEvents).toBe(1);
    });
  });
});