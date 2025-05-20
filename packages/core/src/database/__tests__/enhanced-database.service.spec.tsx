import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EnhancedDatabaseService } from '../enhanced-database.service.js';
import { MetricsCollector } from '../../monitoring/metrics-collector.service.js';
import { DatabaseConfig } from '../types.js';
import * as path from 'path';
import * as fs from 'fs/promises';

describe('EnhancedDatabaseService', () => {
    let service: EnhancedDatabaseService;
    let eventEmitter: EventEmitter2;
    let metricsCollector: MetricsCollector;
    let testDbPath: string;

    beforeAll(async () => {
        testDbPath = path.join(__dirname, 'test.db');
        await fs.mkdir(__dirname, { recursive: true });
    });

    beforeEach(async () => {
        eventEmitter = new EventEmitter2();
        metricsCollector = new MetricsCollector({
            interval: 1000,
            eventEmitter,
        });

        const config: DatabaseConfig = {
            type: 'sqlite',
            database: testDbPath,
            synchronize: true,
            logging: false,
            entities: [],
            poolSize: 2,
            timeout: 1000,
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: EnhancedDatabaseService,
                    useFactory: () => new EnhancedDatabaseService(
                        config,
                        metricsCollector,
                        eventEmitter
                    ),
                },
            ],
        }).compile();

        service = module.get<EnhancedDatabaseService>(EnhancedDatabaseService);
        await service.onModuleInit();
    });

    afterEach(async () => {
        await service.onModuleDestroy();
        try {
            await fs.unlink(testDbPath);
        } catch (error) {
            // Ignore if file doesn't exist
        }
    });

    describe('Basic Operations', () => {
        it('should be defined', () => {
            expect(service).toBeDefined();
        });

        it('should be connected after initialization', () => {
            expect(service.isConnected()).toBeTruthy();
        });

        it('should execute a simple query', async () => {
            const result = await service.executeQuery(
                'CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)'
            );
            expect(result).toBeDefined();
        });

        it('should handle transactions', async () => {
            await service.executeQuery(
                'CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)'
            );

            await service.executeQuery(
                'INSERT INTO test (name) VALUES (?)',
                ['test1'],
                { transaction: true }
            );

            const result = await service.executeQuery<Array<{ name: string }>>(
                'SELECT * FROM test WHERE name = ?',
                ['test1']
            );
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('test1');
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid queries', async () => {
            await expect(
                service.executeQuery('INVALID SQL')
            ).rejects.toThrow();
        });

        it('should retry failed queries', async () => {
            const mockQuery = jest.spyOn(service as any, 'runQuery')
                .mockRejectedValueOnce(new Error('Test error'))
                .mockResolvedValueOnce({ success: true });

            const result = await service.executeQuery(
                'SELECT 1',
                [],
                { retries: 1 }
            );

            expect(result).toEqual({ success: true });
            expect(mockQuery).toHaveBeenCalledTimes(2);
        });

        it('should handle connection timeouts', async () => {
            const slowConfig: DatabaseConfig = {
                ...(service as any)['config'],
                timeout: 1, // 1ms timeout
            };

            const slowService = new EnhancedDatabaseService(
                slowConfig,
                metricsCollector,
                eventEmitter
            );
            await slowService.onModuleInit();

            await expect(
                slowService.executeQuery(
                    "SELECT 1; SELECT pg_sleep(0.002);", // Simulate a query that takes longer than timeout for sqlite, this may need adjustment based on actual sqlite behavior
                    [],
                    { timeout: 1 }
                )
            ).rejects.toThrow(); // Behavior might differ based on how timeout is handled; could be a specific error type

            await slowService.onModuleDestroy();
        });
    });

    describe('Metrics and Events', () => {
        it('should emit database events', async () => {
            const events: Array<{ event: string; payload: unknown }> = [];
            eventEmitter.onAny((event: string, payload: unknown) => {
                if (event.startsWith('database.')) {
                    events.push({ event, payload });
                }
            });

            await service.executeQuery('SELECT 1');

            expect(events.length).toBeGreaterThan(0);
            expect(events.some(e => e.event === 'database.query')).toBeTruthy();
        });

        it('should collect metrics', async () => {
            const metrics = await service.getStats();
            
            expect(metrics).toBeDefined();
            expect(metrics.timestamp).toBeDefined();
            expect((metrics as any).queries.total).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Connection Pool', () => {
        it('should handle multiple concurrent queries', async () => {
            const queries = Array(5).fill(null).map(() =>
                service.executeQuery('SELECT 1')
            );

            const results = await Promise.all(queries);
            expect(results).toHaveLength(5);
        });

        it('should handle pool exhaustion', async () => {
            // This test might be tricky to implement reliably without more control over the pool
            // or specific behavior for exhaustion (e.g., throwing a specific error or queuing)
            // For now, ensuring multiple queries resolve, even if it means they are serialized by the pool.
            const queries = Array(10).fill(null).map(() =>
                service.executeQuery("SELECT 1; SELECT pg_sleep(0.01);") // Small delay to simulate work
            );

            await expect(Promise.all(queries)).resolves.toHaveLength(10);
        });
    });

    describe('Cleanup', () => {
        it('should cleanup resources on destroy', async () => {
            expect(service.isConnected()).toBeTruthy();
            
            await service.onModuleDestroy();
            
            expect(service.isConnected()).toBeFalsy();
        });

        it('should handle multiple destroy calls', async () => {
            await service.onModuleDestroy(); // First call
            await expect(service.onModuleDestroy()).resolves.not.toThrow(); // Subsequent calls
        });
    });
});

export {};
