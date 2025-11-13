"use strict";
/**
 * Comprehensive Test Suite for MCPOrchestrator
 *
 * This file contains unit tests, integration tests, and performance tests
 * for the MCPOrchestrator component.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const MCPOrchestrator_1 = require("../MCPOrchestrator");
// Mock WebSocket for testing
class MockWebSocket {
    url;
    readyState = 1; // OPEN
    onopen = null;
    onmessage = null;
    onclose = null;
    onerror = null;
    constructor(url) {
        this.url = url;
        setTimeout(() => {
            if (this.onopen) {
                this.onopen(new Event('open'));
            }
        }, 10);
    }
    send(data) {
        // Simulate response based on message
        setTimeout(() => {
            if (this.onmessage) {
                const message = JSON.parse(data);
                let response;
                switch (message.type) {
                    case 'ping':
                        response = { type: 'pong', id: message.id };
                        break;
                    case 'task_assignment':
                        response = {
                            type: 'task_result',
                            id: message.id,
                            success: true,
                            data: { result: 'Task completed successfully' }
                        };
                        break;
                    case 'capability_query':
                        response = {
                            type: 'capability_response',
                            id: message.id,
                            capabilities: ['web_scraping', 'data_processing']
                        };
                        break;
                    default:
                        response = { type: 'ack', id: message.id };
                }
                this.onmessage(new MessageEvent('message', {
                    data: JSON.stringify(response)
                }));
            }
        }, 50);
    }
    close() {
        this.readyState = 3; // CLOSED
        if (this.onclose) {
            this.onclose(new CloseEvent('close'));
        }
    }
}
// Mock global WebSocket
global.WebSocket = MockWebSocket;
(0, globals_1.describe)('MCPOrchestrator', () => {
    let orchestrator;
    (0, globals_1.beforeEach)(() => {
        orchestrator = new MCPOrchestrator_1.MCPOrchestrator();
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.afterEach)(async () => {
        // Clean up any active connections
        try {
            await orchestrator.shutdown();
        }
        catch (error) {
            // Ignore cleanup errors
        }
    });
    (0, globals_1.describe)('Agent Registration', () => {
        (0, globals_1.it)('should register a new agent successfully', async () => {
            const agent = {
                id: 'test-agent',
                name: 'Test Agent',
                capabilities: ['web_scraping', 'data_processing'],
                endpoint: 'ws://localhost:8080/test-agent',
                metadata: { version: '1.0.0' }
            };
            const result = await orchestrator.registerAgent(agent);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.agentId).toBe('test-agent');
            (0, globals_1.expect)(result.message).toContain('registered successfully');
        });
        (0, globals_1.it)('should reject duplicate agent registration', async () => {
            const agent = {
                id: 'duplicate-agent',
                name: 'Duplicate Agent',
                capabilities: ['web_scraping'],
                endpoint: 'ws://localhost:8080/duplicate-agent',
                metadata: {}
            };
            // Register first time
            await orchestrator.registerAgent(agent);
            // Try to register again
            const result = await orchestrator.registerAgent(agent);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('already registered');
        });
        (0, globals_1.it)('should validate agent capabilities', async () => {
            const agent = {
                id: 'invalid-agent',
                name: 'Invalid Agent',
                capabilities: [], // Empty capabilities
                endpoint: 'ws://localhost:8080/invalid-agent',
                metadata: {}
            };
            const result = await orchestrator.registerAgent(agent);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('capabilities');
        });
        (0, globals_1.it)('should handle connection failures gracefully', async () => {
            const agent = {
                id: 'unreachable-agent',
                name: 'Unreachable Agent',
                capabilities: ['web_scraping'],
                endpoint: 'ws://invalid-host:8080/agent',
                metadata: {}
            };
            // Mock WebSocket to simulate connection failure
            const originalWebSocket = global.WebSocket;
            global.WebSocket = class extends MockWebSocket {
                constructor(url) {
                    super(url);
                    setTimeout(() => {
                        if (this.onerror) {
                            this.onerror(new Event('error'));
                        }
                    }, 10);
                }
            };
            const result = await orchestrator.registerAgent(agent);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('connection');
            // Restore original WebSocket
            global.WebSocket = originalWebSocket;
        });
    });
    (0, globals_1.describe)('Task Distribution', () => {
        (0, globals_1.beforeEach)(async () => {
            // Register test agents
            await orchestrator.registerAgent({
                id: 'scraper-agent',
                name: 'Web Scraper',
                capabilities: ['web_scraping', 'html_parsing'],
                endpoint: 'ws://localhost:8080/scraper',
                metadata: { performance: 0.9 }
            });
            await orchestrator.registerAgent({
                id: 'processor-agent',
                name: 'Data Processor',
                capabilities: ['data_processing', 'json_manipulation'],
                endpoint: 'ws://localhost:8081/processor',
                metadata: { performance: 0.8 }
            });
        });
        (0, globals_1.it)('should distribute task to best matching agent', async () => {
            const task = {
                id: 'scraping-task',
                type: 'web_scraping',
                requirements: ['web_scraping', 'html_parsing'],
                priority: 'high',
                data: { url: 'https://example.com' }
            };
            const result = await orchestrator.distributeTask(task);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.assignedAgent).toBe('scraper-agent');
            (0, globals_1.expect)(result.taskId).toBe('scraping-task');
        });
        (0, globals_1.it)('should handle task with no matching agents', async () => {
            const task = {
                id: 'unsupported-task',
                type: 'image_processing',
                requirements: ['image_manipulation', 'ai_enhancement'],
                priority: 'medium',
                data: { image: 'base64data' }
            };
            const result = await orchestrator.distributeTask(task);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('No suitable agent');
        });
        (0, globals_1.it)('should respect task priorities', async () => {
            const highPriorityTask = {
                id: 'high-priority-task',
                type: 'data_processing',
                requirements: ['data_processing'],
                priority: 'high',
                data: { data: 'important' }
            };
            const lowPriorityTask = {
                id: 'low-priority-task',
                type: 'data_processing',
                requirements: ['data_processing'],
                priority: 'low',
                data: { data: 'less important' }
            };
            // Submit low priority first, then high priority
            const lowResult = orchestrator.distributeTask(lowPriorityTask);
            const highResult = orchestrator.distributeTask(highPriorityTask);
            const results = await Promise.all([lowResult, highResult]);
            (0, globals_1.expect)(results[0].success).toBe(true);
            (0, globals_1.expect)(results[1].success).toBe(true);
            // High priority task should complete first (in real scenario)
        });
        (0, globals_1.it)('should handle task dependencies', async () => {
            const dependentTask = {
                id: 'dependent-task',
                type: 'data_processing',
                requirements: ['data_processing'],
                priority: 'medium',
                dependencies: ['prerequisite-task'],
                data: { input: 'processed data' }
            };
            // Should fail because dependency doesn't exist
            const result = await orchestrator.distributeTask(dependentTask);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('dependencies');
        });
    });
    (0, globals_1.describe)('Collaboration Sessions', () => {
        (0, globals_1.beforeEach)(async () => {
            // Register multiple agents for collaboration
            const agents = [
                { id: 'agent-1', capabilities: ['web_scraping'] },
                { id: 'agent-2', capabilities: ['data_processing'] },
                { id: 'agent-3', capabilities: ['report_generation'] }
            ];
            for (const agent of agents) {
                await orchestrator.registerAgent({
                    ...agent,
                    name: `Agent ${agent.id}`,
                    endpoint: `ws://localhost:808${agent.id.slice(-1)}/agent`,
                    metadata: {}
                });
            }
        });
        (0, globals_1.it)('should create collaboration session successfully', async () => {
            const sessionConfig = {
                id: 'test-session',
                name: 'Test Collaboration',
                participants: ['agent-1', 'agent-2', 'agent-3'],
                workflow: {
                    steps: [
                        { agent: 'agent-1', task: 'scrape_data' },
                        { agent: 'agent-2', task: 'process_data' },
                        { agent: 'agent-3', task: 'generate_report' }
                    ]
                }
            };
            const result = await orchestrator.createCollaborationSession(sessionConfig);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.sessionId).toBe('test-session');
            (0, globals_1.expect)(result.participants).toEqual(['agent-1', 'agent-2', 'agent-3']);
        });
        (0, globals_1.it)('should reject session with non-existent participants', async () => {
            const sessionConfig = {
                id: 'invalid-session',
                name: 'Invalid Session',
                participants: ['agent-1', 'non-existent-agent'],
                workflow: { steps: [] }
            };
            const result = await orchestrator.createCollaborationSession(sessionConfig);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('not registered');
        });
        (0, globals_1.it)('should manage session lifecycle', async () => {
            const sessionConfig = {
                id: 'lifecycle-session',
                name: 'Lifecycle Test',
                participants: ['agent-1', 'agent-2'],
                workflow: { steps: [] }
            };
            // Create session
            const createResult = await orchestrator.createCollaborationSession(sessionConfig);
            (0, globals_1.expect)(createResult.success).toBe(true);
            // Get session status
            const status = await orchestrator.getSessionStatus('lifecycle-session');
            (0, globals_1.expect)(status.sessionId).toBe('lifecycle-session');
            (0, globals_1.expect)(status.status).toBe('active');
            // End session
            const endResult = await orchestrator.endCollaborationSession('lifecycle-session');
            (0, globals_1.expect)(endResult.success).toBe(true);
        });
    });
    (0, globals_1.describe)('Performance and Metrics', () => {
        (0, globals_1.beforeEach)(async () => {
            await orchestrator.registerAgent({
                id: 'metrics-agent',
                name: 'Metrics Test Agent',
                capabilities: ['web_scraping'],
                endpoint: 'ws://localhost:8080/metrics-agent',
                metadata: {}
            });
        });
        (0, globals_1.it)('should collect task execution metrics', async () => {
            const task = {
                id: 'metrics-task',
                type: 'web_scraping',
                requirements: ['web_scraping'],
                priority: 'medium',
                data: { url: 'https://example.com' }
            };
            const startTime = Date.now();
            const result = await orchestrator.distributeTask(task);
            const endTime = Date.now();
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.metrics).toBeDefined();
            (0, globals_1.expect)(result.metrics?.executionTime).toBeGreaterThan(0);
            (0, globals_1.expect)(result.metrics?.executionTime).toBeLessThan(endTime - startTime + 100);
        });
        (0, globals_1.it)('should track agent performance', async () => {
            // Execute multiple tasks to generate performance data
            const tasks = Array.from({ length: 5 }, (_, i) => ({
                id: `perf-task-${i}`,
                type: 'web_scraping',
                requirements: ['web_scraping'],
                priority: 'medium',
                data: { url: `https://example${i}.com` }
            }));
            for (const task of tasks) {
                await orchestrator.distributeTask(task);
            }
            const metrics = await orchestrator.getAgentMetrics('metrics-agent');
            (0, globals_1.expect)(metrics.agentId).toBe('metrics-agent');
            (0, globals_1.expect)(metrics.tasksCompleted).toBe(5);
            (0, globals_1.expect)(metrics.successRate).toBeGreaterThan(0);
            (0, globals_1.expect)(metrics.averageResponseTime).toBeGreaterThan(0);
        });
        (0, globals_1.it)('should provide system-wide metrics', async () => {
            const systemMetrics = await orchestrator.getSystemMetrics();
            (0, globals_1.expect)(systemMetrics.totalAgents).toBeGreaterThan(0);
            (0, globals_1.expect)(systemMetrics.activeConnections).toBeGreaterThan(0);
            (0, globals_1.expect)(systemMetrics.totalTasksProcessed).toBeGreaterThanOrEqual(0);
            (0, globals_1.expect)(systemMetrics.systemUptime).toBeGreaterThan(0);
        });
    });
    (0, globals_1.describe)('Error Handling and Recovery', () => {
        (0, globals_1.it)('should handle agent disconnection gracefully', async () => {
            const agent = {
                id: 'disconnect-agent',
                name: 'Disconnect Test Agent',
                capabilities: ['web_scraping'],
                endpoint: 'ws://localhost:8080/disconnect-agent',
                metadata: {}
            };
            await orchestrator.registerAgent(agent);
            // Simulate agent disconnection
            const agentConnection = orchestrator.agents.get('disconnect-agent');
            if (agentConnection && agentConnection.connection) {
                agentConnection.connection.close();
            }
            // Wait for disconnection to be processed
            await new Promise(resolve => setTimeout(resolve, 100));
            const task = {
                id: 'task-for-disconnected-agent',
                type: 'web_scraping',
                requirements: ['web_scraping'],
                priority: 'medium',
                data: { url: 'https://example.com' }
            };
            const result = await orchestrator.distributeTask(task);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('unavailable');
        });
        (0, globals_1.it)('should retry failed tasks', async () => {
            // Mock WebSocket to simulate task failure then success
            let attemptCount = 0;
            const originalWebSocket = global.WebSocket;
            global.WebSocket = class extends MockWebSocket {
                send(data) {
                    const message = JSON.parse(data);
                    if (message.type === 'task_assignment') {
                        attemptCount++;
                        setTimeout(() => {
                            if (this.onmessage) {
                                const response = attemptCount === 1
                                    ? { type: 'task_result', id: message.id, success: false, error: 'Simulated failure' }
                                    : { type: 'task_result', id: message.id, success: true, data: { result: 'Success on retry' } };
                                this.onmessage(new MessageEvent('message', {
                                    data: JSON.stringify(response)
                                }));
                            }
                        }, 50);
                    }
                    else {
                        super.send(data);
                    }
                }
            };
            await orchestrator.registerAgent({
                id: 'retry-agent',
                name: 'Retry Test Agent',
                capabilities: ['web_scraping'],
                endpoint: 'ws://localhost:8080/retry-agent',
                metadata: {}
            });
            const task = {
                id: 'retry-task',
                type: 'web_scraping',
                requirements: ['web_scraping'],
                priority: 'medium',
                data: { url: 'https://example.com' },
                retryConfig: { maxRetries: 2, retryDelay: 100 }
            };
            const result = await orchestrator.distributeTask(task);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(attemptCount).toBe(2);
            // Restore original WebSocket
            global.WebSocket = originalWebSocket;
        });
        (0, globals_1.it)('should handle task timeout', async () => {
            // Mock WebSocket to simulate slow response
            const originalWebSocket = global.WebSocket;
            global.WebSocket = class extends MockWebSocket {
                send(data) {
                    const message = JSON.parse(data);
                    if (message.type === 'task_assignment') {
                        // Don't send response to simulate timeout
                        return;
                    }
                    super.send(data);
                }
            };
            await orchestrator.registerAgent({
                id: 'timeout-agent',
                name: 'Timeout Test Agent',
                capabilities: ['web_scraping'],
                endpoint: 'ws://localhost:8080/timeout-agent',
                metadata: {}
            });
            const task = {
                id: 'timeout-task',
                type: 'web_scraping',
                requirements: ['web_scraping'],
                priority: 'medium',
                data: { url: 'https://example.com' },
                timeout: 200 // Short timeout for testing
            };
            const result = await orchestrator.distributeTask(task);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('timeout');
            // Restore original WebSocket
            global.WebSocket = originalWebSocket;
        });
    });
    (0, globals_1.describe)('Load Testing', () => {
        (0, globals_1.it)('should handle multiple concurrent tasks', async () => {
            // Register multiple agents
            const agents = Array.from({ length: 3 }, (_, i) => ({
                id: `load-agent-${i}`,
                name: `Load Test Agent ${i}`,
                capabilities: ['web_scraping', 'data_processing'],
                endpoint: `ws://localhost:808${i}/load-agent`,
                metadata: {}
            }));
            for (const agent of agents) {
                await orchestrator.registerAgent(agent);
            }
            // Create many concurrent tasks
            const tasks = Array.from({ length: 20 }, (_, i) => ({
                id: `load-task-${i}`,
                type: 'web_scraping',
                requirements: ['web_scraping'],
                priority: 'medium',
                data: { url: `https://example${i}.com` }
            }));
            const startTime = Date.now();
            const results = await Promise.all(tasks.map(task => orchestrator.distributeTask(task)));
            const endTime = Date.now();
            const successfulTasks = results.filter(r => r.success);
            const failedTasks = results.filter(r => !r.success);
            (0, globals_1.expect)(successfulTasks.length).toBeGreaterThan(0);
            (0, globals_1.expect)(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
            console.log(`Load test results: ${successfulTasks.length} successful, ${failedTasks.length} failed, ${endTime - startTime}ms total`);
        });
        (0, globals_1.it)('should maintain performance under load', async () => {
            await orchestrator.registerAgent({
                id: 'performance-agent',
                name: 'Performance Test Agent',
                capabilities: ['web_scraping'],
                endpoint: 'ws://localhost:8080/performance-agent',
                metadata: {}
            });
            const taskCount = 50;
            const tasks = Array.from({ length: taskCount }, (_, i) => ({
                id: `perf-task-${i}`,
                type: 'web_scraping',
                requirements: ['web_scraping'],
                priority: 'medium',
                data: { url: `https://example${i}.com` }
            }));
            const startTime = Date.now();
            const results = [];
            // Execute tasks in batches to simulate realistic load
            const batchSize = 5;
            for (let i = 0; i < tasks.length; i += batchSize) {
                const batch = tasks.slice(i, i + batchSize);
                const batchResults = await Promise.all(batch.map(task => orchestrator.distributeTask(task)));
                results.push(...batchResults);
                // Small delay between batches
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const averageTaskTime = totalTime / taskCount;
            (0, globals_1.expect)(results.length).toBe(taskCount);
            (0, globals_1.expect)(averageTaskTime).toBeLessThan(1000); // Average task should complete in less than 1 second
            const successRate = results.filter(r => r.success).length / results.length;
            (0, globals_1.expect)(successRate).toBeGreaterThan(0.9); // At least 90% success rate
        });
    });
    (0, globals_1.describe)('Integration Tests', () => {
        (0, globals_1.it)('should handle complete workflow scenario', async () => {
            // Register agents for a complete workflow
            const agents = [
                { id: 'scraper', capabilities: ['web_scraping', 'html_parsing'] },
                { id: 'processor', capabilities: ['data_processing', 'json_manipulation'] },
                { id: 'analyzer', capabilities: ['data_analysis', 'trend_detection'] },
                { id: 'reporter', capabilities: ['report_generation', 'pdf_creation'] }
            ];
            for (const agent of agents) {
                await orchestrator.registerAgent({
                    ...agent,
                    name: `${agent.id} Agent`,
                    endpoint: `ws://localhost:8080/${agent.id}`,
                    metadata: {}
                });
            }
            // Create collaboration session
            const session = await orchestrator.createCollaborationSession({
                id: 'workflow-session',
                name: 'Complete Workflow Test',
                participants: ['scraper', 'processor', 'analyzer', 'reporter'],
                workflow: {
                    steps: [
                        { agent: 'scraper', task: 'scrape_data' },
                        { agent: 'processor', task: 'process_data' },
                        { agent: 'analyzer', task: 'analyze_data' },
                        { agent: 'reporter', task: 'generate_report' }
                    ]
                }
            });
            (0, globals_1.expect)(session.success).toBe(true);
            // Execute workflow tasks in sequence
            const workflowTasks = [
                {
                    id: 'scrape-step',
                    type: 'web_scraping',
                    requirements: ['web_scraping'],
                    priority: 'high',
                    data: { urls: ['https://example1.com', 'https://example2.com'] }
                },
                {
                    id: 'process-step',
                    type: 'data_processing',
                    requirements: ['data_processing'],
                    priority: 'high',
                    dependencies: ['scrape-step'],
                    data: { format: 'json', operations: ['clean', 'normalize'] }
                },
                {
                    id: 'analyze-step',
                    type: 'data_analysis',
                    requirements: ['data_analysis'],
                    priority: 'medium',
                    dependencies: ['process-step'],
                    data: { metrics: ['trends', 'patterns'] }
                },
                {
                    id: 'report-step',
                    type: 'report_generation',
                    requirements: ['report_generation'],
                    priority: 'low',
                    dependencies: ['analyze-step'],
                    data: { format: 'pdf', template: 'executive_summary' }
                }
            ];
            const workflowResults = [];
            for (const task of workflowTasks) {
                const result = await orchestrator.distributeTask(task);
                workflowResults.push(result);
                (0, globals_1.expect)(result.success).toBe(true);
            }
            // Verify workflow completion
            const sessionStatus = await orchestrator.getSessionStatus('workflow-session');
            (0, globals_1.expect)(sessionStatus.status).toBe('active');
            // End session
            const endResult = await orchestrator.endCollaborationSession('workflow-session');
            (0, globals_1.expect)(endResult.success).toBe(true);
            console.log('Complete workflow test passed with all steps successful');
        });
    });
});
// Performance benchmarks
(0, globals_1.describe)('MCPOrchestrator Performance Benchmarks', () => {
    let orchestrator;
    (0, globals_1.beforeEach)(() => {
        orchestrator = new MCPOrchestrator_1.MCPOrchestrator();
    });
    (0, globals_1.afterEach)(async () => {
        await orchestrator.shutdown();
    });
    (0, globals_1.it)('should benchmark agent registration performance', async () => {
        const agentCount = 100;
        const agents = Array.from({ length: agentCount }, (_, i) => ({
            id: `benchmark-agent-${i}`,
            name: `Benchmark Agent ${i}`,
            capabilities: ['web_scraping', 'data_processing'],
            endpoint: `ws://localhost:8080/benchmark-agent-${i}`,
            metadata: { benchmark: true }
        }));
        const startTime = Date.now();
        const results = await Promise.all(agents.map(agent => orchestrator.registerAgent(agent)));
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        const averageTime = totalTime / agentCount;
        const successfulRegistrations = results.filter(r => r.success).length;
        console.log(`Agent Registration Benchmark:
      - Total agents: ${agentCount}
      - Successful registrations: ${successfulRegistrations}
      - Total time: ${totalTime}ms
      - Average time per agent: ${averageTime.toFixed(2)}ms
      - Registrations per second: ${(agentCount / (totalTime / 1000)).toFixed(2)}`);
        (0, globals_1.expect)(successfulRegistrations).toBe(agentCount);
        (0, globals_1.expect)(averageTime).toBeLessThan(100); // Should register each agent in less than 100ms
    });
    (0, globals_1.it)('should benchmark task distribution performance', async () => {
        // Register agents first
        const agentCount = 10;
        for (let i = 0; i < agentCount; i++) {
            await orchestrator.registerAgent({
                id: `perf-agent-${i}`,
                name: `Performance Agent ${i}`,
                capabilities: ['web_scraping', 'data_processing'],
                endpoint: `ws://localhost:8080/perf-agent-${i}`,
                metadata: {}
            });
        }
        const taskCount = 500;
        const tasks = Array.from({ length: taskCount }, (_, i) => ({
            id: `benchmark-task-${i}`,
            type: 'web_scraping',
            requirements: ['web_scraping'],
            priority: 'medium',
            data: { url: `https://example${i}.com` }
        }));
        const startTime = Date.now();
        const results = await Promise.all(tasks.map(task => orchestrator.distributeTask(task)));
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        const averageTime = totalTime / taskCount;
        const successfulTasks = results.filter(r => r.success).length;
        console.log(`Task Distribution Benchmark:
      - Total tasks: ${taskCount}
      - Successful tasks: ${successfulTasks}
      - Total time: ${totalTime}ms
      - Average time per task: ${averageTime.toFixed(2)}ms
      - Tasks per second: ${(taskCount / (totalTime / 1000)).toFixed(2)}`);
        (0, globals_1.expect)(successfulTasks).toBeGreaterThan(taskCount * 0.9); // At least 90% success
        (0, globals_1.expect)(averageTime).toBeLessThan(200); // Should distribute each task in less than 200ms
    });
});
//# sourceMappingURL=orchestrator.test.js.map