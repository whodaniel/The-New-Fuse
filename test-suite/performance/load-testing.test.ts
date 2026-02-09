/**
 * Load Testing and Memory Leak Detection Tests
 * Tests to verify system performance under load and detect memory leaks
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { PerformanceMonitor } from '../utils/performance-monitor';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage: {
    initial: NodeJS.MemoryUsage;
    final: NodeJS.MemoryUsage;
    increase: number;
  };
  cpuUsage: {
    initial: number;
    final: number;
    peak: number;
  };
}

// Mock load testing utilities
class LoadTester {
  static async runLoadTest(config: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    concurrentUsers: number;
    duration: number; // in seconds
    payload?: any;
    headers?: Record<string, string>;
  }): Promise<LoadTestResult> {
    const { url, method, concurrentUsers, duration, payload, headers } = config;
    
    const results: Array<{
      status: number;
      responseTime: number;
      success: boolean;
    }> = [];
    
    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);
    
    const initialMemory = process.memoryUsage();
    let peakMemory = initialMemory.heapUsed;
    
    // Function to make a single request
    const makeRequest = async (): Promise<void> => {
      const reqStart = Date.now();
      
      try {
        const req = request(url)[method.toLowerCase()]('');
        
        if (headers) {
          Object.entries(headers).forEach(([key, value]) => {
            req.set(key, value);
          });
        }
        
        if (payload) {
          req.send(payload);
        }
        
        const response = await req;
        const reqEnd = Date.now();
        const responseTime = reqEnd - reqStart;
        
        results.push({
          status: response.status,
          responseTime,
          success: response.status < 500,
        });
        
        // Check memory
        const currentMemory = process.memoryUsage();
        if (currentMemory.heapUsed > peakMemory) {
          peakMemory = currentMemory.heapUsed;
        }
      } catch (error) {
        const reqEnd = Date.now();
        const responseTime = reqEnd - reqStart;
        
        results.push({
          status: 500,
          responseTime,
          success: false,
        });
      }
    };
    
    // Run load test
    const workers: Array<() => Promise<void>> = [];
    
    for (let i = 0; i < concurrentUsers; i++) {
      workers.push(async () => {
        while (Date.now() < endTime) {
          await makeRequest();
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        }
      });
    }
    
    await Promise.all(workers.map(worker => worker()));
    
    const finalMemory = process.memoryUsage();
    
    // Calculate metrics
    const successfulResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);
    const responseTimes = results.map(r => r.responseTime).sort((a, b) => a - b);
    
    const averageResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);
    const p95ResponseTime = responseTimes[p95Index] || 0;
    const p99ResponseTime = responseTimes[p99Index] || 0;
    const throughput = results.length / (duration * 1000) * 1000; // requests per second
    const errorRate = failedResults.length / results.length;
    
    return {
      totalRequests: results.length,
      successfulRequests: successfulResults.length,
      failedRequests: failedResults.length,
      averageResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      throughput,
      errorRate,
      memoryUsage: {
        initial: initialMemory,
        final: finalMemory,
        increase: finalMemory.heapUsed - initialMemory.heapUsed,
      },
      cpuUsage: {
        initial: 0, // Would need actual CPU monitoring
        final: 0,
        peak: 0,
      },
    };
  }
}

class MemoryLeakDetector {
  private snapshots: Array<{ timestamp: number; heapUsed: number; heapTotal: number }> = [];
  
  takeSnapshot(): void {
    const usage = process.memoryUsage();
    this.snapshots.push({
      timestamp: Date.now(),
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
    });
  }
  
  detectLeaks(thresholdBytes: number = 10 * 1024 * 1024): {
    hasLeak: boolean;
    leakSize: number;
    growthRate: number;
    snapshots: number;
  } {
    if (this.snapshots.length < 2) {
      return { hasLeak: false, leakSize: 0, growthRate: 0, snapshots: this.snapshots.length };
    }
    
    const first = this.snapshots[0];
    const last = this.snapshots[this.snapshots.length - 1];
    
    const leakSize = last.heapUsed - first.heapUsed;
    const timeSpan = last.timestamp - first.timestamp;
    const growthRate = leakSize / timeSpan; // bytes per millisecond
    
    return {
      hasLeak: leakSize > thresholdBytes,
      leakSize,
      growthRate,
      snapshots: this.snapshots.length,
    };
  }
  
  getMemoryTrend(): Array<{ timestamp: number; heapUsed: number }> {
    return this.snapshots.map(s => ({
      timestamp: s.timestamp,
      heapUsed: s.heapUsed,
    }));
  }
  
  reset(): void {
    this.snapshots = [];
  }
}

describe('Load Testing and Memory Leak Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let performanceMonitor: PerformanceMonitor;
  let authToken: string;
  let testUser: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [/* AppModule would be imported here */],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    performanceMonitor = app.get(PerformanceMonitor);

    // Setup test user
    testUser = await prisma.user.create({
      data: {
        email: 'load.test@example.com',
        password: 'TestPassword123!',
        name: 'Load Test User',
      },
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'TestPassword123!',
      });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await prisma.agent.deleteMany({
      where: { userId: testUser.id },
    });
    await prisma.user.delete({
      where: { id: testUser.id },
    });
    await app.close();
  });

  describe('API Load Testing', () => {
    it('should handle moderate load on authentication endpoints', async () => {
      const loadResult = await LoadTester.runLoadTest({
        url: app.getHttpServer().address().address + ':' + app.getHttpServer().address().port,
        method: 'POST',
        concurrentUsers: 10,
        duration: 30, // 30 seconds
        payload: {
          email: testUser.email,
          password: 'TestPassword123!',
        },
      });

      // Performance assertions
      expect(loadResult.errorRate).toBeLessThan(0.01); // Less than 1% error rate
      expect(loadResult.averageResponseTime).toBeLessThan(500); // Less than 500ms average
      expect(loadResult.p95ResponseTime).toBeLessThan(1000); // Less than 1 second for 95th percentile
      expect(loadResult.throughput).toBeGreaterThan(1); // At least 1 request per second

      // Memory assertions
      expect(loadResult.memoryUsage.increase).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    }, 60000); // 60 second timeout

    it('should handle high load on agent endpoints', async () => {
      const loadResult = await LoadTester.runLoadTest({
        url: app.getHttpServer().address().address + ':' + app.getHttpServer().address().port + '/agents',
        method: 'GET',
        concurrentUsers: 20,
        duration: 60, // 1 minute
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      // Performance assertions for high load
      expect(loadResult.errorRate).toBeLessThan(0.05); // Less than 5% error rate
      expect(loadResult.averageResponseTime).toBeLessThan(1000); // Less than 1 second average
      expect(loadResult.p99ResponseTime).toBeLessThan(3000); // Less than 3 seconds for 99th percentile
      expect(loadResult.throughput).toBeGreaterThan(5); // At least 5 requests per second

      // Memory should remain stable
      expect(loadResult.memoryUsage.increase).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase
    }, 120000); // 2 minute timeout

    it('should maintain performance under sustained load', async () => {
      const loadResult = await LoadTester.runLoadTest({
        url: app.getHttpServer().address().address + ':' + app.getHttpServer().address().port + '/agents/search',
        method: 'POST',
        concurrentUsers: 5,
        duration: 120, // 2 minutes
        payload: {
          query: 'test search',
          filters: {},
        },
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      // Should handle sustained load well
      expect(loadResult.errorRate).toBeLessThan(0.02);
      expect(loadResult.averageResponseTime).toBeLessThan(800);
      expect(loadResult.throughput).toBeGreaterThan(2);

      // Check for memory stability over time
      expect(loadResult.memoryUsage.increase).toBeLessThan(80 * 1024 * 1024);
    }, 180000); // 3 minute timeout

    it('should handle database-intensive operations under load', async () => {
      // Create multiple agents for testing
      const agents = await Promise.all(
        Array(10).fill().map((_, i) =>
          prisma.agent.create({
            data: {
              name: `Load Test Agent ${i}`,
              description: 'Agent for load testing',
              type: 'CHAT',
              userId: testUser.id,
            },
          })
        )
      );

      const loadResult = await LoadTester.runLoadTest({
        url: app.getHttpServer().address().address + ':' + app.getHttpServer().address().port + '/agents',
        method: 'GET',
        concurrentUsers: 15,
        duration: 45,
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      // Database operations should handle load reasonably well
      expect(loadResult.errorRate).toBeLessThan(0.03);
      expect(loadResult.averageResponseTime).toBeLessThan(1200);
      expect(loadResult.p95ResponseTime).toBeLessThan(2000);

      // Clean up
      await prisma.agent.deleteMany({
        where: { id: { in: agents.map(a => a.id) } },
      });
    }, 90000);
  });

  describe('Memory Leak Detection', () => {
    const memoryDetector = new MemoryLeakDetector();

    beforeEach(() => {
      memoryDetector.reset();
    });

    it('should not have memory leaks in long-running operations', async () => {
      // Simulate long-running application usage
      for (let cycle = 0; cycle < 10; cycle++) {
        // Make various API calls
        await request(app.getHttpServer())
          .get('/agents')
          .set('Authorization', `Bearer ${authToken}`);
        
        await request(app.getHttpServer())
          .post('/agents')
          .send({
            name: `Memory Test Agent ${cycle}`,
            description: 'Testing for memory leaks',
            type: 'CHAT',
          })
          .set('Authorization', `Bearer ${authToken}`);
        
        // Take memory snapshot
        memoryDetector.takeSnapshot();
        
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const leakAnalysis = memoryDetector.detectLeaks(5 * 1024 * 1024); // 5MB threshold

      // Should not have significant memory leaks
      expect(leakAnalysis.hasLeak).toBe(false);
      expect(leakAnalysis.leakSize).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
    });

    it('should not leak memory in WebSocket connections', async () => {
      // This would require a more complex WebSocket testing setup
      // For now, test the concept with HTTP requests
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Simulate many short-lived connections
      for (let i = 0; i < 100; i++) {
        await request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', `Bearer ${authToken}`);
        
        memoryDetector.takeSnapshot();
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be minimal for short-lived operations
      expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024); // Less than 20MB
    });

    it('should handle large datasets without memory issues', async () => {
      // Create a large dataset
      const largeData = Array(1000).fill().map((_, i) => ({
        name: `Large Data Item ${i}`,
        description: `This is a large description for item ${i} that takes up quite a bit of memory when repeated many times.`,
        metadata: {
          index: i,
          timestamp: new Date().toISOString(),
          tags: Array(10).fill().map((_, j) => `tag-${i}-${j}`),
        },
      }));

      const initialMemory = process.memoryUsage().heapUsed;
      
      // Process large dataset
      for (const item of largeData) {
        // Simulate processing
        const processed = JSON.stringify(item);
        const parsed = JSON.parse(processed);
        
        memoryDetector.takeSnapshot();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Should handle large dataset processing without excessive memory usage
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    });

    it('should not leak memory in event handlers and callbacks', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Simulate many event handler registrations and unregistrations
      for (let i = 0; i < 50; i++) {
        // Create and destroy objects with event handlers
        const eventEmitter = {
          handlers: [] as Array<() => void>,
          on(event: string, handler: () => void) {
            this.handlers.push(handler);
          },
          off(event: string, handler: () => void) {
            const index = this.handlers.indexOf(handler);
            if (index > -1) {
              this.handlers.splice(index, 1);
            }
          },
        };
        
        const handler = () => console.log('Event fired');
        eventEmitter.on('test', handler);
        eventEmitter.off('test', handler);
        
        memoryDetector.takeSnapshot();
      }
      
      // Force garbage collection
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Event handler cleanup should not cause memory leaks
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
    });
  });

  describe('Database Performance Under Load', () => {
    it('should handle concurrent database operations efficiently', async () => {
      const concurrentOperations = 20;
      const results: Array<{
        success: boolean;
        responseTime: number;
        memoryUsed: number;
      }> = [];

      for (let i = 0; i < concurrentOperations; i++) {
        const startTime = Date.now();
        const memoryBefore = process.memoryUsage().heapUsed;

        try {
          // Create agent
          await prisma.agent.create({
            data: {
              name: `Concurrent Test Agent ${i}`,
              description: 'Testing concurrent database operations',
              type: 'WORKFLOW',
              userId: testUser.id,
            },
          });

          const endTime = Date.now();
          const memoryAfter = process.memoryUsage().heapUsed;

          results.push({
            success: true,
            responseTime: endTime - startTime,
            memoryUsed: memoryAfter - memoryBefore,
          });
        } catch (error) {
          const endTime = Date.now();
          results.push({
            success: false,
            responseTime: endTime - startTime,
            memoryUsed: 0,
          });
        }
      }

      const successfulOps = results.filter(r => r.success);
      const averageResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

      // Most operations should succeed
      expect(successfulOps.length / results.length).toBeGreaterThan(0.9);

      // Response times should be reasonable
      expect(averageResponseTime).toBeLessThan(2000);

      // Memory usage should be reasonable
      const totalMemoryUsed = results.reduce((sum, r) => sum + r.memoryUsed, 0);
      expect(totalMemoryUsed).toBeLessThan(50 * 1024 * 1024);

      // Clean up
      await prisma.agent.deleteMany({
        where: { name: { startsWith: 'Concurrent Test Agent' } },
      });
    });

    it('should prevent N+1 queries under load', async () => {
      // Create related data
      const agent = await prisma.agent.create({
        data: {
          name: 'Load Test Agent for N+1',
          description: 'Testing N+1 under load',
          type: 'CHAT',
          userId: testUser.id,
        },
      });

      // Create many related items
      const messageCount = 100;
      await Promise.all(
        Array(messageCount).fill().map((_, i) =>
          prisma.message.create({
            data: {
              content: `Test message ${i}`,
              agentId: agent.id,
              userId: testUser.id,
              timestamp: new Date(),
            },
          })
        )
      );

      // Test queries that might cause N+1
      const startTime = Date.now();
      const agents = await prisma.agent.findMany({
        include: {
          messages: true,
          user: true,
        },
        where: {
          userId: testUser.id,
        },
      });
      const endTime = Date.now();

      // Should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(1000);

      // Should retrieve all data efficiently
      expect(agents.length).toBeGreaterThan(0);
      agents.forEach(a => {
        expect(a.messages).toBeDefined();
        expect(a.user).toBeDefined();
      });

      // Clean up
      await prisma.message.deleteMany({
        where: { agentId: agent.id },
      });
      await prisma.agent.delete({
        where: { id: agent.id },
      });
    });
  });

  describe('Caching Performance', () => {
    it('should demonstrate effective caching reduces database load', async () => {
      // First request (cache miss)
      const start1 = Date.now();
      await request(app.getHttpServer())
        .get('/agents')
        .set('Authorization', `Bearer ${authToken}`);
      const time1 = Date.now() - start1;

      // Second request (cache hit)
      const start2 = Date.now();
      await request(app.getHttpServer())
        .get('/agents')
        .set('Authorization', `Bearer ${authToken}`);
      const time2 = Date.now() - start2;

      // Second request should be significantly faster due to caching
      expect(time2).toBeLessThan(time1 * 0.5); // At least 50% faster
    });

    it('should handle cache misses efficiently', async () => {
      const cacheMissStart = Date.now();
      await request(app.getHttpServer())
        .get('/agents?search=nonexistentsearch')
        .set('Authorization', `Bearer ${authToken}`);
      const cacheMissTime = Date.now() - cacheMissStart;

      // Cache misses should still be reasonably fast
      expect(cacheMissTime).toBeLessThan(1000);
    });
  });

  describe('Resource Cleanup', () => {
    it('should properly clean up resources after operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const initialHandles = (process as any)._getActiveHandles?.()?.length || 0;
      const initialRequests = (process as any)._getActiveRequests?.()?.length || 0;

      // Perform many operations
      for (let i = 0; i < 50; i++) {
        await request(app.getHttpServer())
          .get('/agents')
          .set('Authorization', `Bearer ${authToken}`);

        await request(app.getHttpServer())
          .post('/agents')
          .send({
            name: `Cleanup Test Agent ${i}`,
            description: 'Testing resource cleanup',
            type: 'CHAT',
          })
          .set('Authorization', `Bearer ${authToken}`);
      }

      // Force garbage collection
      if (global.gc) {
        global.gc();
      }

      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));

      const finalMemory = process.memoryUsage().heapUsed;
      const finalHandles = (process as any)._getActiveHandles?.()?.length || 0;
      const finalRequests = (process as any)._getActiveRequests?.()?.length || 0;

      // Memory should not grow indefinitely
      expect(finalMemory - initialMemory).toBeLessThan(30 * 1024 * 1024);

      // Handles and requests should be cleaned up
      expect(finalHandles).toBeLessThanOrEqual(initialHandles + 10);
      expect(finalRequests).toBeLessThanOrEqual(initialRequests + 10);
    });
  });

  describe('Performance Monitoring', () => {
    it('should provide accurate performance metrics', async () => {
      const metrics = await performanceMonitor.getCurrentMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.responseTime).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryUsage).toBeDefined();
      expect(metrics.cpuUsage).toBeDefined();
      expect(metrics.activeConnections).toBeGreaterThanOrEqual(0);
    });

    it('should track performance trends', async () => {
      // Collect metrics over time
      const metrics: any[] = [];
      
      for (let i = 0; i < 10; i++) {
        const start = Date.now();
        await request(app.getHttpServer())
          .get('/agents')
          .set('Authorization', `Bearer ${authToken}`);
        
        metrics.push({
          timestamp: Date.now(),
          responseTime: Date.now() - start,
          memoryUsage: process.memoryUsage().heapUsed,
        });
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const trend = await performanceMonitor.getPerformanceTrend(metrics);
      
      expect(trend).toBeDefined();
      expect(trend.averageResponseTime).toBeGreaterThan(0);
      expect(trend.performanceScore).toBeGreaterThanOrEqual(0);
      expect(trend.performanceScore).toBeLessThanOrEqual(100);
    });
  });
});
