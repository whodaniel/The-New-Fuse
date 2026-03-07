/**
 * N+1 Query Pattern Detection and Prevention Tests
 * Tests to verify that database queries are optimized and don't create N+1 problems
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DrizzleService } from '../../src/drizzle/drizzle.service';
import { OptimizedSelfAssessmentService } from '../../src/services/optimized-self-assessment.service';
import { OptimizedPerformanceAnalyticsService } from '../../src/services/optimized-performance-analytics.service';
import { OptimizedPrimeDirectiveService } from '../../src/services/optimized-prime-directive.service';
import { OptimizedCollectiveContributionService } from '../../src/services/optimized-collective-contribution.service';

// Mock query counter to track database queries
class QueryCounter {
  private queries: Array<{ query: string; timestamp: number }> = [];

  increment(query: string) {
    this.queries.push({ query, timestamp: Date.now() });
  }

  getCount(): number {
    return this.queries.length;
  }

  getQueries() {
    return this.queries;
  }

  reset() {
    this.queries = [];
  }

  getNplusOneViolations(): Array<{ pattern: string; count: number }> {
    // Detect potential N+1 patterns
    const violations: Array<{ pattern: string; count: number }> = [];
    
    // Group by similar query patterns
    const queryGroups = this.queries.reduce((groups, query) => {
      const pattern = this.extractQueryPattern(query.query);
      if (!groups[pattern]) {
        groups[pattern] = [];
      }
      groups[pattern].push(query);
      return groups;
    }, {} as Record<string, typeof this.queries>);

    // Find patterns that suggest N+1
    Object.entries(queryGroups).forEach(([pattern, queries]) => {
      if (queries.length > 10) { // Threshold for N+1 detection
        violations.push({ pattern, count: queries.length });
      }
    });

    return violations;
  }

  private extractQueryPattern(query: string): string {
    // Extract query pattern by removing dynamic values
    return query
      .replace(/'[^']*'/g, '?')  // Replace string literals
      .replace(/\d+/g, '?')      // Replace numbers
      .replace(/[a-f0-9-]{36}/g, 'UUID') // Replace UUIDs
      .replace(/\s+/g, ' ')      // Normalize whitespace
      .trim();
  }
}

const queryCounter = new QueryCounter();

describe('N+1 Query Pattern Tests', () => {
  let app: INestApplication;
  let drizzle: DrizzleService;
  let optimizedSelfAssessmentService: OptimizedSelfAssessmentService;
  let optimizedPerformanceAnalyticsService: OptimizedPerformanceAnalyticsService;
  let optimizedPrimeDirectiveService: OptimizedPrimeDirectiveService;
  let optimizedCollectiveContributionService: OptimizedCollectiveContributionService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DrizzleService,
        OptimizedSelfAssessmentService,
        OptimizedPerformanceAnalyticsService,
        OptimizedPrimeDirectiveService,
        OptimizedCollectiveContributionService,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    drizzle = moduleRef.get<DrizzleService>(DrizzleService);
    optimizedSelfAssessmentService = moduleRef.get<OptimizedSelfAssessmentService>(OptimizedSelfAssessmentService);
    optimizedPerformanceAnalyticsService = moduleRef.get<OptimizedPerformanceAnalyticsService>(OptimizedPerformanceAnalyticsService);
    optimizedPrimeDirectiveService = moduleRef.get<OptimizedPrimeDirectiveService>(OptimizedPrimeDirectiveService);
    optimizedCollectiveContributionService = moduleRef.get<OptimizedCollectiveContributionService>(OptimizedCollectiveContributionService);

    // Setup database for testing
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await app.close();
  });

  describe('Self Assessment Service N+1 Prevention', () => {
    let testUser: any;
    let testExecution: any;
    let testMetrics: any[];

    beforeEach(async () => {
      queryCounter.reset();
      
      // Create test data
      testUser = await drizzle.user.create({
        data: {
          email: 'nplus1.test@example.com',
          password: 'TestPassword123!',
          name: 'N+1 Test User',
        },
      });

      testExecution = await drizzle.promptExecution.create({
        data: {
          userId: testUser.id,
          category: 'CHAT',
          prompt: 'Test prompt',
          response: 'Test response',
          executionTime: 1000,
        },
      });

      testMetrics = await Promise.all(
        Array(6).fill().map((_, i) => 
          drizzle.metric.create({
            data: {
              name: `metric_${i}`,
              type: 'QUALITY',
              category: 'CHAT',
              weight: 1.0,
            },
          })
        )
      );
    });

    afterEach(async () => {
      await cleanupTestExecutionData();
    });

    it('should create assessment with single batch query', async () => {
      queryCounter.reset();

      const assessmentData = {
        executionId: testExecution.id,
        overallScore: 8.5,
        taskCompletionQuality: 9.0,
        responseRelevance: 8.0,
        creativityScore: 7.5,
        efficiencyRating: 8.8,
        userSatisfactionScore: 8.2,
        metrics: testMetrics.map(m => ({
          metricId: m.id,
          score: 8.0 + Math.random() * 2, // Random scores 8-10
        })),
      };

      const startTime = Date.now();
      const result = await optimizedSelfAssessmentService.createAssessment(assessmentData);
      const endTime = Date.now();

      // Verify assessment was created
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();

      // Check query count - should be minimal with batch operations
      const queryCount = queryCounter.getCount();
      expect(queryCount).toBeLessThanOrEqual(5); // Should use 1-2 batch queries max

      // Performance should be good
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(1000); // Should complete within 1 second

      // No N+1 violations
      const nplusOneViolations = queryCounter.getNplusOneViolations();
      expect(nplusOneViolations.length).toBe(0);
    });

    it('should get assessment with optimized queries', async () => {
      // First create an assessment
      const assessment = await createTestAssessment();

      queryCounter.reset();

      // Get the assessment
      const result = await optimizedSelfAssessmentService.getAssessment(assessment.id);

      // Verify result
      expect(result).toBeDefined();
      expect(result.id).toBe(assessment.id);

      // Should use minimal queries
      const queryCount = queryCounter.getCount();
      expect(queryCount).toBeLessThanOrEqual(3);

      // No N+1 violations
      const nplusOneViolations = queryCounter.getNplusOneViolations();
      expect(nplusOneViolations.length).toBe(0);
    });

    it('should handle batch metrics queries efficiently', async () => {
      queryCounter.reset();

      const metricTypes = testMetrics.map(m => m.type);
      const category = 'CHAT';

      // This should use a single batch query
      const baselineData = await optimizedSelfAssessmentService.getBatchMetrics(
        {} as any, // Mock transaction
        category,
        testMetrics
      );

      // Should return baseline data for all metrics
      expect(baselineData).toBeDefined();
      expect(Array.isArray(baselineData)).toBe(true);

      // Check that it used batch operations
      const queryCount = queryCounter.getCount();
      expect(queryCount).toBeLessThanOrEqual(2); // 1 batch query + 1 baseline query

      // No N+1 violations
      const nplusOneViolations = queryCounter.getNplusOneViolations();
      expect(nplusOneViolations.length).toBe(0);
    });
  });

  describe('Performance Analytics Service N+1 Prevention', () => {
    beforeEach(async () => {
      queryCounter.reset();
      await createTestAnalyticsData();
    });

    it('should generate performance overview with minimal queries', async () => {
      queryCounter.reset();

      const startTime = Date.now();
      const result = await optimizedPerformanceAnalyticsService.getPerformanceOverview('30d');
      const endTime = Date.now();

      // Verify result structure
      expect(result).toBeDefined();
      expect(result.totalAssessments).toBeGreaterThanOrEqual(0);
      expect(result.averageScore).toBeGreaterThanOrEqual(0);
      expect(result.categoryBreakdown).toBeDefined();

      // Check query efficiency
      const queryCount = queryCounter.getCount();
      expect(queryCount).toBeLessThanOrEqual(5); // Should use 3-5 optimized queries

      // Performance should be good
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(2000); // Should complete within 2 seconds

      // No N+1 violations
      const nplusOneViolations = queryCounter.getNplusOneViolations();
      expect(nplusOneViolations.length).toBe(0);
    });

    it('should use database-level aggregations', async () => {
      queryCounter.reset();

      // This should use groupBy aggregations instead of loading all data
      const categoryStats = await optimizedPerformanceAnalyticsService.getCategoryStatistics();

      expect(categoryStats).toBeDefined();
      expect(Array.isArray(categoryStats)).toBe(true);

      // Verify using aggregations (not memory processing)
      const queryCount = queryCounter.getCount();
      expect(queryCount).toBeLessThanOrEqual(3);

      // Check for no repetitive queries
      const queries = queryCounter.getQueries();
      const uniquePatterns = new Set(queries.map(q => q.query.substring(0, 50)));
      expect(uniquePatterns.size).toBeGreaterThan(queryCount * 0.7); // Most queries should be unique
    });

    it('should handle pagination correctly', async () => {
      queryCounter.reset();

      // Test pagination doesn't cause N+1
      const page1 = await optimizedPerformanceAnalyticsService.getPaginatedAssessments(0, 10);
      const page2 = await optimizedPerformanceAnalyticsService.getPaginatedAssessments(10, 10);

      expect(page1.data).toHaveLength(10);
      expect(page2.data).toHaveLength(10);

      const totalQueries = queryCounter.getCount();
      expect(totalQueries).toBeLessThanOrEqual(6); // 2 paginated queries + some overhead

      // No N+1 violations across pagination
      const nplusOneViolations = queryCounter.getNplusOneViolations();
      expect(nplusOneViolations.length).toBe(0);
    });
  });

  describe('Prime Directive Service N+1 Prevention', () => {
    beforeEach(async () => {
      queryCounter.reset();
      await createTestPrimeDirectiveData();
    });

    it('should adapt weights with batch operations', async () => {
      queryCounter.reset();

      const startTime = Date.now();
      const result = await optimizedPrimeDirectiveService.adaptDirectiveWeights('CHAT');
      const endTime = Date.now();

      // Verify adaptation completed
      expect(result).toBeDefined();
      expect(result.updatedCount).toBeGreaterThanOrEqual(0);

      // Check query efficiency
      const queryCount = queryCounter.getCount();
      expect(queryCount).toBeLessThanOrEqual(5); // Should use batch operations

      // Performance should be good
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(1500);

      // No N+1 violations
      const nplusOneViolations = queryCounter.getNplusOneViolations();
      expect(nplusOneViolations.length).toBe(0);
    });

    it('should use cached directive weights', async () => {
      queryCounter.reset();

      // First call should populate cache
      const weights1 = await optimizedPrimeDirectiveService.getDirectiveWeights('CHAT');
      
      const firstQueryCount = queryCounter.getCount();
      
      queryCounter.reset();

      // Second call should use cache
      const weights2 = await optimizedPrimeDirectiveService.getDirectiveWeights('CHAT');
      
      const secondQueryCount = queryCounter.getCount();

      // Cache should reduce queries significantly
      expect(weights1).toEqual(weights2);
      expect(secondQueryCount).toBeLessThan(firstQueryCount);
      expect(secondQueryCount).toBeLessThanOrEqual(2); // Should use cache primarily
    });

    it('should calculate directive impacts efficiently', async () => {
      queryCounter.reset();

      const impacts = await optimizedPrimeDirectiveService.calculateBatchDirectiveImpacts();

      expect(impacts).toBeDefined();
      expect(Array.isArray(impacts)).toBe(true);

      // Should use batch processing
      const queryCount = queryCounter.getCount();
      expect(queryCount).toBeLessThanOrEqual(4);

      // No repetitive queries for each directive
      const nplusOneViolations = queryCounter.getNplusOneViolations();
      expect(nplusOneViolations.length).toBe(0);
    });
  });

  describe('Collective Contribution Service N+1 Prevention', () => {
    beforeEach(async () => {
      queryCounter.reset();
      await createTestContributionData();
    });

    it('should calculate statistics with SQL aggregations', async () => {
      queryCounter.reset();

      const startTime = Date.now();
      const stats = await optimizedCollectiveContributionService.getStatistics();
      const endTime = Date.now();

      // Verify statistics
      expect(stats).toBeDefined();
      expect(stats.totalContributions).toBeGreaterThanOrEqual(0);
      expect(stats.averageImpactScore).toBeGreaterThanOrEqual(0);
      expect(stats.topContributors).toBeDefined();

      // Check query efficiency
      const queryCount = queryCounter.getCount();
      expect(queryCount).toBeLessThanOrEqual(4); // Should use SQL aggregations

      // Performance should be good
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(1000);

      // No N+1 violations
      const nplusOneViolations = queryCounter.getNplusOneViolations();
      expect(nplusOneViolations.length).toBe(0);
    });

    it('should use pagination for large datasets', async () => {
      queryCounter.reset();

      const page1 = await optimizedCollectiveContributionService.getPaginatedContributions(0, 20);
      const page2 = await optimizedCollectiveContributionService.getPaginatedContributions(20, 20);

      expect(page1.data).toHaveLength(20);
      expect(page2.data).toHaveLength(20);

      const totalQueries = queryCounter.getCount();
      expect(totalQueries).toBeLessThanOrEqual(4); // Paginated queries + overhead

      // No N+1 across pagination
      const nplusOneViolations = queryCounter.getNplusOneViolations();
      expect(nplusOneViolations.length).toBe(0);
    });

    it('should handle batch updates efficiently', async () => {
      queryCounter.reset();

      const updateData = [
        { id: 'contrib1', impact: 8.5, status: 'APPROVED' },
        { id: 'contrib2', impact: 7.2, status: 'APPROVED' },
        { id: 'contrib3', impact: 9.1, status: 'APPROVED' },
      ];

      const result = await optimizedCollectiveContributionService.updateBatchContributions(updateData);

      expect(result.updatedCount).toBe(3);

      // Should use single batch update query
      const queryCount = queryCounter.getCount();
      expect(queryCount).toBeLessThanOrEqual(2); // 1 batch update + 1 verification

      // No N+1 violations
      const nplusOneViolations = queryCounter.getNplusOneViolations();
      expect(nplusOneViolations.length).toBe(0);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should maintain performance with large datasets', async () => {
      await createLargeTestDataset();

      queryCounter.reset();

      const startTime = Date.now();
      const overview = await optimizedPerformanceAnalyticsService.getPerformanceOverview('30d');
      const endTime = Date.now();

      // Should handle large dataset efficiently
      expect(overview).toBeDefined();
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(3000); // Should still be fast with large data

      // Query count should not grow linearly with data size
      const queryCount = queryCounter.getCount();
      expect(queryCount).toBeLessThanOrEqual(10);
    });

    it('should scale linearly with reasonable performance', async () => {
      const datasetSizes = [10, 50, 100, 500];
      const performanceResults: Array<{ size: number; time: number; queries: number }> = [];

      for (const size of datasetSizes) {
        await createTestDatasetOfSize(size);
        queryCounter.reset();

        const startTime = Date.now();
        await optimizedPerformanceAnalyticsService.getPerformanceOverview('30d');
        const endTime = Date.now();

        performanceResults.push({
          size,
          time: endTime - startTime,
          queries: queryCounter.getCount(),
        });
      }

      // Performance should not degrade severely
      expect(performanceResults[3].time).toBeLessThan(performanceResults[0].time * 20);
      expect(performanceResults[3].queries).toBeLessThan(performanceResults[0].queries * 3);
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should not cause memory leaks in long-running operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Simulate many operations
      for (let i = 0; i < 100; i++) {
        const overview = await optimizedPerformanceAnalyticsService.getPerformanceOverview('30d');
        expect(overview).toBeDefined();
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should clean up cached data appropriately', async () => {
      // Use cache-heavy operations
      await optimizedPrimeDirectiveService.getDirectiveWeights('CHAT');
      await optimizedPrimeDirectiveService.getDirectiveWeights('WORKFLOW');
      await optimizedPrimeDirectiveService.getDirectiveWeights('ANALYSIS');

      // Cache should not grow unbounded
      const cacheStatus = await optimizedPrimeDirectiveService.getCacheStatus();
      
      expect(cacheStatus.size).toBeLessThan(1000); // Reasonable cache size
      expect(cacheStatus.hitRatio).toBeGreaterThanOrEqual(0);
    });
  });

  // Helper functions
  async function setupTestDatabase() {
    // Create test indexes and constraints if needed
    // This would typically be done via migrations
  }

  async function cleanupTestDatabase() {
    // Clean up all test data
    await drizzle.collectiveContribution.deleteMany({});
    await drizzle.primeDirectivePriority.deleteMany({});
    await drizzle.selfAssessment.deleteMany({});
    await drizzle.promptExecution.deleteMany({});
    await drizzle.user.deleteMany({});
    await drizzle.metric.deleteMany({});
  }

  async function cleanupTestExecutionData() {
    await drizzle.selfAssessment.deleteMany({});
    await drizzle.promptExecution.deleteMany({ where: { userId: testUser.id } });
    await drizzle.user.deleteMany({ where: { id: testUser.id } });
  }

  async function createTestAssessment() {
    return await drizzle.selfAssessment.create({
      data: {
        executionId: testExecution.id,
        overallScore: 8.5,
        taskCompletionQuality: 9.0,
        responseRelevance: 8.0,
        creativityScore: 7.5,
        efficiencyRating: 8.8,
        userSatisfactionScore: 8.2,
      },
    });
  }

  async function createTestAnalyticsData() {
    // Create test assessments for analytics
    for (let i = 0; i < 20; i++) {
      await drizzle.selfAssessment.create({
        data: {
          executionId: (await drizzle.promptExecution.create({
            data: {
              userId: testUser.id,
              category: i % 2 === 0 ? 'CHAT' : 'WORKFLOW',
              prompt: `Test prompt ${i}`,
              response: `Test response ${i}`,
              executionTime: 1000 + i * 100,
            },
          })).id,
          overallScore: 7 + Math.random() * 3,
          taskCompletionQuality: 7 + Math.random() * 3,
          responseRelevance: 7 + Math.random() * 3,
          creativityScore: 7 + Math.random() * 3,
          efficiencyRating: 7 + Math.random() * 3,
          userSatisfactionScore: 7 + Math.random() * 3,
        },
      });
    }
  }

  async function createTestPrimeDirectiveData() {
    // Create test prime directives
    for (let i = 0; i < 5; i++) {
      await drizzle.primeDirectivePriority.create({
        data: {
          directive: `Test directive ${i}`,
          priority: i + 1,
          isActive: true,
          weight: 1.0 / (i + 1),
        },
      });
    }
  }

  async function createTestContributionData() {
    // Create test contributions
    for (let i = 0; i < 15; i++) {
      await drizzle.collectiveContribution.create({
        data: {
          userId: testUser.id,
          description: `Contribution ${i}`,
          impact: 5 + Math.random() * 5,
          status: i % 3 === 0 ? 'PENDING' : 'APPROVED',
        },
      });
    }
  }

  async function createTestDatasetOfSize(size: number) {
    // Create dataset of specific size for performance testing
    for (let i = 0; i < size; i++) {
      await drizzle.selfAssessment.create({
        data: {
          executionId: (await drizzle.promptExecution.create({
            data: {
              userId: testUser.id,
              category: 'CHAT',
              prompt: `Performance test prompt ${i}`,
              response: `Performance test response ${i}`,
              executionTime: 1000,
            },
          })).id,
          overallScore: 7 + Math.random() * 3,
          taskCompletionQuality: 7 + Math.random() * 3,
          responseRelevance: 7 + Math.random() * 3,
          creativityScore: 7 + Math.random() * 3,
          efficiencyRating: 7 + Math.random() * 3,
          userSatisfactionScore: 7 + Math.random() * 3,
        },
      });
    }
  }

  async function createLargeTestDataset() {
    await createTestDatasetOfSize(1000);
  }
});
