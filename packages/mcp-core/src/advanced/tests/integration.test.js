"use strict";
/**
 * Comprehensive Integration Test Suite for Advanced MCP Capabilities
 *
 * This file contains integration tests that verify all advanced MCP components
 * work together correctly in realistic scenarios.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const MCPIntegrationLayer_1 = require("../MCPIntegrationLayer");
const index_1 = require("../index");
// Mock WebSocket for testing
class MockWebSocket {
    url;
    readyState = 1; // OPEN
    onopen = null;
    onclose = null;
    onmessage = null;
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
        // Echo back for testing
        setTimeout(() => {
            if (this.onmessage) {
                this.onmessage(new MessageEvent('message', { data }));
            }
        }, 10);
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
// Mock file system for plugin loading
jest.mock('fs/promises', () => ({
    readdir: jest.fn(),
    readFile: jest.fn(),
    stat: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    access: jest.fn()
}));
// Mock Chrome DevTools Protocol
const mockCDP = {
    connect: jest.fn(() => Promise.resolve({
        Runtime: {
            enable: jest.fn(),
            evaluate: jest.fn(() => Promise.resolve({ result: { value: 'test' } }))
        },
        Page: {
            enable: jest.fn(),
            navigate: jest.fn(),
            loadEventFired: jest.fn()
        },
        close: jest.fn()
    }))
};
jest.mock('chrome-remote-interface', () => mockCDP);
describe('Advanced MCP Integration Tests', () => {
    let integrationLayer;
    let advancedSuite;
    beforeEach(async () => {
        // Initialize integration layer
        integrationLayer = new MCPIntegrationLayer_1.MCPIntegrationLayer({
            orchestrator: {
                maxAgents: 10,
                taskTimeout: 30000,
                collaborationEnabled: true
            },
            browserAutomation: {
                headless: true,
                defaultTimeout: 10000,
                maxConcurrentBrowsers: 3
            },
            security: {
                encryptionKey: 'test-key-32-characters-long-123',
                jwtSecret: 'test-jwt-secret',
                sessionTimeout: 3600000
            },
            realtimeCommunication: {
                port: 8080,
                maxConnections: 100,
                messageTimeout: 5000
            },
            monitoring: {
                metricsRetention: 86400000, // 24 hours
                alertThresholds: {
                    responseTime: 1000,
                    errorRate: 0.05,
                    memoryUsage: 0.8
                }
            },
            pluginEcosystem: {
                pluginDirectory: '/test/plugins',
                sandboxing: { enabled: true, timeout: 5000 },
                security: { requireSignature: false }
            }
        });
        // Initialize advanced suite
        advancedSuite = new index_1.AdvancedMCPSuite();
    });
    afterEach(async () => {
        await integrationLayer.cleanup();
        await advancedSuite.cleanup();
    });
    describe('End-to-End Workflow Integration', () => {
        it('should orchestrate a complete multi-agent workflow', async () => {
            // Initialize all components
            const initResult = await integrationLayer.initialize();
            expect(initResult.success).toBe(true);
            // Register multiple agents with different capabilities
            const agents = [
                {
                    id: 'data-collector',
                    name: 'Data Collector Agent',
                    capabilities: ['web-scraping', 'data-extraction'],
                    endpoint: 'ws://localhost:8081'
                },
                {
                    id: 'data-processor',
                    name: 'Data Processor Agent',
                    capabilities: ['data-analysis', 'transformation'],
                    endpoint: 'ws://localhost:8082'
                },
                {
                    id: 'report-generator',
                    name: 'Report Generator Agent',
                    capabilities: ['document-generation', 'visualization'],
                    endpoint: 'ws://localhost:8083'
                }
            ];
            // Register agents
            for (const agent of agents) {
                const registerResult = await integrationLayer.registerAgent(agent);
                expect(registerResult.success).toBe(true);
            }
            // Create a complex workflow task
            const workflowTask = {
                id: 'market-research-workflow',
                name: 'Market Research Analysis',
                description: 'Collect market data, analyze trends, and generate report',
                steps: [
                    {
                        id: 'data-collection',
                        agentId: 'data-collector',
                        action: 'scrape-market-data',
                        parameters: {
                            sources: ['example.com/market', 'data.example.com'],
                            dataTypes: ['prices', 'volumes', 'trends']
                        }
                    },
                    {
                        id: 'data-processing',
                        agentId: 'data-processor',
                        action: 'analyze-market-trends',
                        parameters: {
                            analysisType: 'trend-analysis',
                            timeframe: '30d'
                        },
                        dependencies: ['data-collection']
                    },
                    {
                        id: 'report-generation',
                        agentId: 'report-generator',
                        action: 'generate-market-report',
                        parameters: {
                            format: 'pdf',
                            includeCharts: true
                        },
                        dependencies: ['data-processing']
                    }
                ]
            };
            // Execute workflow
            const executionResult = await integrationLayer.executeWorkflow(workflowTask);
            expect(executionResult.success).toBe(true);
            expect(executionResult.workflowId).toBeDefined();
            // Monitor workflow progress
            let workflowStatus;
            let attempts = 0;
            const maxAttempts = 10;
            do {
                await new Promise(resolve => setTimeout(resolve, 500));
                workflowStatus = await integrationLayer.getWorkflowStatus(executionResult.workflowId);
                attempts++;
            } while (workflowStatus.status === 'running' && attempts < maxAttempts);
            expect(workflowStatus.status).toBe('completed');
            expect(workflowStatus.completedSteps).toBe(3);
            expect(workflowStatus.results).toBeDefined();
            // Verify each step completed successfully
            const stepResults = workflowStatus.stepResults;
            expect(stepResults['data-collection'].success).toBe(true);
            expect(stepResults['data-processing'].success).toBe(true);
            expect(stepResults['report-generation'].success).toBe(true);
        });
        it('should handle workflow failures and recovery', async () => {
            await integrationLayer.initialize();
            // Register agents with one that will fail
            const agents = [
                {
                    id: 'reliable-agent',
                    name: 'Reliable Agent',
                    capabilities: ['data-processing'],
                    endpoint: 'ws://localhost:8081'
                },
                {
                    id: 'failing-agent',
                    name: 'Failing Agent',
                    capabilities: ['unreliable-service'],
                    endpoint: 'ws://localhost:8082'
                }
            ];
            for (const agent of agents) {
                await integrationLayer.registerAgent(agent);
            }
            // Create workflow with failure scenario
            const workflowTask = {
                id: 'failure-test-workflow',
                name: 'Failure Test Workflow',
                steps: [
                    {
                        id: 'reliable-step',
                        agentId: 'reliable-agent',
                        action: 'process-data',
                        parameters: { data: 'test' }
                    },
                    {
                        id: 'failing-step',
                        agentId: 'failing-agent',
                        action: 'unreliable-operation',
                        parameters: { shouldFail: true },
                        retryPolicy: {
                            maxRetries: 3,
                            backoffMultiplier: 2,
                            initialDelay: 1000
                        }
                    }
                ]
            };
            const executionResult = await integrationLayer.executeWorkflow(workflowTask);
            expect(executionResult.success).toBe(true);
            // Wait for workflow completion/failure
            let workflowStatus;
            let attempts = 0;
            const maxAttempts = 15;
            do {
                await new Promise(resolve => setTimeout(resolve, 500));
                workflowStatus = await integrationLayer.getWorkflowStatus(executionResult.workflowId);
                attempts++;
            } while (workflowStatus.status === 'running' && attempts < maxAttempts);
            expect(workflowStatus.status).toBe('failed');
            expect(workflowStatus.failedSteps).toBe(1);
            expect(workflowStatus.stepResults['reliable-step'].success).toBe(true);
            expect(workflowStatus.stepResults['failing-step'].success).toBe(false);
            expect(workflowStatus.stepResults['failing-step'].retryCount).toBe(3);
        });
        it('should integrate browser automation with orchestration', async () => {
            await integrationLayer.initialize();
            // Register browser automation agent
            const browserAgent = {
                id: 'browser-agent',
                name: 'Browser Automation Agent',
                capabilities: ['web-automation', 'data-extraction'],
                endpoint: 'ws://localhost:8081'
            };
            await integrationLayer.registerAgent(browserAgent);
            // Create browser automation workflow
            const automationWorkflow = {
                id: 'web-automation-workflow',
                name: 'Web Data Extraction',
                steps: [
                    {
                        id: 'launch-browser',
                        agentId: 'browser-agent',
                        action: 'launch-browser',
                        parameters: { headless: true }
                    },
                    {
                        id: 'navigate-page',
                        agentId: 'browser-agent',
                        action: 'navigate',
                        parameters: { url: 'https://example.com' },
                        dependencies: ['launch-browser']
                    },
                    {
                        id: 'extract-data',
                        agentId: 'browser-agent',
                        action: 'extract-content',
                        parameters: {
                            selectors: ['.title', '.price', '.description'],
                            format: 'json'
                        },
                        dependencies: ['navigate-page']
                    },
                    {
                        id: 'close-browser',
                        agentId: 'browser-agent',
                        action: 'close-browser',
                        parameters: {},
                        dependencies: ['extract-data']
                    }
                ]
            };
            const executionResult = await integrationLayer.executeWorkflow(automationWorkflow);
            expect(executionResult.success).toBe(true);
            // Monitor execution
            let workflowStatus;
            let attempts = 0;
            do {
                await new Promise(resolve => setTimeout(resolve, 500));
                workflowStatus = await integrationLayer.getWorkflowStatus(executionResult.workflowId);
                attempts++;
            } while (workflowStatus.status === 'running' && attempts < 20);
            expect(workflowStatus.status).toBe('completed');
            expect(workflowStatus.stepResults['extract-data'].result.data).toBeDefined();
            // Verify browser automation metrics
            const metrics = await integrationLayer.getComponentMetrics('browserAutomation');
            expect(metrics.browsersLaunched).toBeGreaterThan(0);
            expect(metrics.pagesNavigated).toBeGreaterThan(0);
            expect(metrics.elementsInteracted).toBeGreaterThan(0);
        });
        it('should integrate security framework across all components', async () => {
            await integrationLayer.initialize();
            // Test authentication across components
            const authToken = await integrationLayer.authenticate({
                username: 'test-user',
                password: 'test-password'
            });
            expect(authToken.success).toBe(true);
            expect(authToken.token).toBeDefined();
            // Test encrypted communication
            const sensitiveData = {
                apiKey: 'secret-api-key',
                credentials: 'sensitive-credentials'
            };
            const encryptResult = await integrationLayer.encryptData(sensitiveData);
            expect(encryptResult.success).toBe(true);
            expect(encryptResult.encryptedData).toBeDefined();
            const decryptResult = await integrationLayer.decryptData(encryptResult.encryptedData);
            expect(decryptResult.success).toBe(true);
            expect(decryptResult.data).toEqual(sensitiveData);
            // Test access control
            const accessResult = await integrationLayer.checkAccess({
                userId: 'test-user',
                resource: 'workflow-execution',
                action: 'create'
            });
            expect(accessResult.allowed).toBe(true);
            // Test security audit
            const auditResult = await integrationLayer.getSecurityAudit({
                timeRange: { start: new Date(Date.now() - 3600000), end: new Date() }
            });
            expect(auditResult.events.length).toBeGreaterThan(0);
            expect(auditResult.events.some(e => e.type === 'authentication')).toBe(true);
            expect(auditResult.events.some(e => e.type === 'encryption')).toBe(true);
        });
        it('should provide real-time monitoring across all components', async () => {
            await integrationLayer.initialize();
            // Generate activity across components
            const agent = {
                id: 'monitoring-test-agent',
                name: 'Monitoring Test Agent',
                capabilities: ['test-operations'],
                endpoint: 'ws://localhost:8081'
            };
            await integrationLayer.registerAgent(agent);
            // Execute multiple operations to generate metrics
            for (let i = 0; i < 10; i++) {
                await integrationLayer.executeAgentTask(agent.id, {
                    action: 'test-operation',
                    parameters: { iteration: i }
                });
            }
            // Check system-wide metrics
            const systemMetrics = await integrationLayer.getSystemMetrics();
            expect(systemMetrics.totalAgents).toBe(1);
            expect(systemMetrics.totalTasks).toBe(10);
            expect(systemMetrics.averageResponseTime).toBeGreaterThan(0);
            // Check component-specific metrics
            const orchestratorMetrics = await integrationLayer.getComponentMetrics('orchestrator');
            expect(orchestratorMetrics.registeredAgents).toBe(1);
            expect(orchestratorMetrics.completedTasks).toBe(10);
            const communicationMetrics = await integrationLayer.getComponentMetrics('realtimeCommunication');
            expect(communicationMetrics.activeConnections).toBeGreaterThanOrEqual(0);
            expect(communicationMetrics.messagesSent).toBeGreaterThan(0);
            // Test real-time alerts
            const alertThreshold = {
                metric: 'response_time',
                condition: 'greater_than',
                value: 100,
                severity: 'warning'
            };
            const thresholdResult = await integrationLayer.createAlertThreshold(alertThreshold);
            expect(thresholdResult.success).toBe(true);
            // Generate high response time to trigger alert
            await integrationLayer.executeAgentTask(agent.id, {
                action: 'slow-operation',
                parameters: { delay: 200 }
            });
            // Check for alerts
            const alerts = await integrationLayer.getActiveAlerts();
            expect(alerts.some(a => a.metric === 'response_time')).toBe(true);
        });
        it('should support plugin ecosystem integration', async () => {
            await integrationLayer.initialize();
            // Mock plugin code
            const testPluginCode = `
        class IntegrationTestPlugin {
          constructor() {
            this.name = 'IntegrationTestPlugin';
            this.version = '1.0.0';
            this.capabilities = ['data-transformation', 'custom-analysis'];
          }
          
          async initialize() {
            return { success: true };
          }
          
          async execute(params) {
            const { operation, data } = params;
            
            switch (operation) {
              case 'transform':
                return {
                  result: 'transformed',
                  data: data.map(item => ({ ...item, transformed: true }))
                };
              case 'analyze':
                return {
                  result: 'analyzed',
                  analysis: {
                    count: data.length,
                    summary: 'Integration test analysis'
                  }
                };
              default:
                return { result: 'unknown-operation', operation };
            }
          }
          
          async cleanup() {
            return { success: true };
          }
        }
        
        module.exports = { IntegrationTestPlugin };
      `;
            // Mock file system for plugin loading
            const fs = require('fs/promises');
            fs.readFile.mockResolvedValue(testPluginCode);
            fs.stat.mockResolvedValue({
                isFile: () => true,
                size: testPluginCode.length
            });
            // Load and register plugin
            const pluginResult = await integrationLayer.loadPlugin('integration-test-plugin.js');
            expect(pluginResult.success).toBe(true);
            // Create agent that uses the plugin
            const pluginAgent = {
                id: 'plugin-agent',
                name: 'Plugin-Enhanced Agent',
                capabilities: ['plugin-execution'],
                plugins: ['IntegrationTestPlugin'],
                endpoint: 'ws://localhost:8081'
            };
            await integrationLayer.registerAgent(pluginAgent);
            // Execute workflow using plugin
            const pluginWorkflow = {
                id: 'plugin-workflow',
                name: 'Plugin Integration Workflow',
                steps: [
                    {
                        id: 'plugin-transform',
                        agentId: 'plugin-agent',
                        action: 'execute-plugin',
                        parameters: {
                            plugin: 'IntegrationTestPlugin',
                            operation: 'transform',
                            data: [{ id: 1, value: 'test' }, { id: 2, value: 'data' }]
                        }
                    },
                    {
                        id: 'plugin-analyze',
                        agentId: 'plugin-agent',
                        action: 'execute-plugin',
                        parameters: {
                            plugin: 'IntegrationTestPlugin',
                            operation: 'analyze',
                            data: '${plugin-transform.result.data}' // Reference previous step
                        },
                        dependencies: ['plugin-transform']
                    }
                ]
            };
            const executionResult = await integrationLayer.executeWorkflow(pluginWorkflow);
            expect(executionResult.success).toBe(true);
            // Monitor workflow completion
            let workflowStatus;
            let attempts = 0;
            do {
                await new Promise(resolve => setTimeout(resolve, 500));
                workflowStatus = await integrationLayer.getWorkflowStatus(executionResult.workflowId);
                attempts++;
            } while (workflowStatus.status === 'running' && attempts < 10);
            expect(workflowStatus.status).toBe('completed');
            expect(workflowStatus.stepResults['plugin-transform'].result.result).toBe('transformed');
            expect(workflowStatus.stepResults['plugin-analyze'].result.result).toBe('analyzed');
            // Verify plugin metrics
            const pluginMetrics = await integrationLayer.getPluginMetrics('IntegrationTestPlugin');
            expect(pluginMetrics.executionCount).toBe(2);
            expect(pluginMetrics.successRate).toBe(1.0);
        });
    });
    describe('Performance and Scalability Integration', () => {
        it('should handle high-load scenarios across all components', async () => {
            await integrationLayer.initialize();
            // Register multiple agents
            const agentCount = 20;
            const agents = [];
            for (let i = 0; i < agentCount; i++) {
                const agent = {
                    id: `load-test-agent-${i}`,
                    name: `Load Test Agent ${i}`,
                    capabilities: ['load-testing'],
                    endpoint: `ws://localhost:${8081 + i}`
                };
                agents.push(agent);
                await integrationLayer.registerAgent(agent);
            }
            // Create high-load workflow
            const loadTestWorkflow = {
                id: 'high-load-workflow',
                name: 'High Load Test Workflow',
                steps: agents.map((agent, index) => ({
                    id: `load-step-${index}`,
                    agentId: agent.id,
                    action: 'load-test-operation',
                    parameters: {
                        iterations: 100,
                        concurrency: 5,
                        delay: Math.random() * 100
                    }
                }))
            };
            const startTime = Date.now();
            const executionResult = await integrationLayer.executeWorkflow(loadTestWorkflow);
            expect(executionResult.success).toBe(true);
            // Monitor execution
            let workflowStatus;
            let attempts = 0;
            const maxAttempts = 60; // 30 seconds max
            do {
                await new Promise(resolve => setTimeout(resolve, 500));
                workflowStatus = await integrationLayer.getWorkflowStatus(executionResult.workflowId);
                attempts++;
            } while (workflowStatus.status === 'running' && attempts < maxAttempts);
            const endTime = Date.now();
            const totalTime = endTime - startTime;
            expect(workflowStatus.status).toBe('completed');
            expect(workflowStatus.completedSteps).toBe(agentCount);
            // Verify performance metrics
            const performanceMetrics = await integrationLayer.getPerformanceMetrics();
            expect(performanceMetrics.throughput).toBeGreaterThan(0);
            expect(performanceMetrics.averageLatency).toBeLessThan(5000); // Under 5 seconds
            expect(performanceMetrics.errorRate).toBeLessThan(0.05); // Under 5% error rate
            console.log(`High-load test: ${agentCount} agents, ${totalTime}ms total time`);
            console.log(`Throughput: ${performanceMetrics.throughput.toFixed(2)} ops/sec`);
            console.log(`Average latency: ${performanceMetrics.averageLatency.toFixed(2)}ms`);
        });
        it('should maintain system stability under stress', async () => {
            await integrationLayer.initialize();
            const stressAgent = {
                id: 'stress-test-agent',
                name: 'Stress Test Agent',
                capabilities: ['stress-testing'],
                endpoint: 'ws://localhost:8081'
            };
            await integrationLayer.registerAgent(stressAgent);
            // Run stress test for extended period
            const stressDuration = 10000; // 10 seconds
            const requestInterval = 50; // 50ms between requests
            const totalRequests = stressDuration / requestInterval;
            const stressPromises = [];
            const startTime = Date.now();
            for (let i = 0; i < totalRequests; i++) {
                const promise = integrationLayer.executeAgentTask(stressAgent.id, {
                    action: 'stress-operation',
                    parameters: {
                        requestId: i,
                        timestamp: Date.now()
                    }
                });
                stressPromises.push(promise);
                // Stagger requests
                if (i % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, requestInterval));
                }
            }
            const results = await Promise.allSettled(stressPromises);
            const endTime = Date.now();
            const successfulRequests = results.filter(r => r.status === 'fulfilled').length;
            const failedRequests = results.filter(r => r.status === 'rejected').length;
            const successRate = successfulRequests / totalRequests;
            const actualDuration = endTime - startTime;
            const actualThroughput = successfulRequests / (actualDuration / 1000);
            console.log(`Stress test results:`);
            console.log(`- Total requests: ${totalRequests}`);
            console.log(`- Successful: ${successfulRequests}`);
            console.log(`- Failed: ${failedRequests}`);
            console.log(`- Success rate: ${(successRate * 100).toFixed(2)}%`);
            console.log(`- Throughput: ${actualThroughput.toFixed(2)} req/sec`);
            expect(successRate).toBeGreaterThan(0.9); // 90% success rate minimum
            expect(actualThroughput).toBeGreaterThan(10); // At least 10 req/sec
            // Verify system health after stress test
            const healthCheck = await integrationLayer.getSystemHealth();
            expect(healthCheck.status).toBe('healthy');
            expect(healthCheck.components.every(c => c.status === 'operational')).toBe(true);
        });
        it('should handle resource exhaustion gracefully', async () => {
            await integrationLayer.initialize();
            const resourceAgent = {
                id: 'resource-test-agent',
                name: 'Resource Test Agent',
                capabilities: ['resource-intensive'],
                endpoint: 'ws://localhost:8081'
            };
            await integrationLayer.registerAgent(resourceAgent);
            // Create resource-intensive workflow
            const resourceWorkflow = {
                id: 'resource-exhaustion-workflow',
                name: 'Resource Exhaustion Test',
                steps: [
                    {
                        id: 'memory-intensive',
                        agentId: 'resource-test-agent',
                        action: 'allocate-memory',
                        parameters: { size: '100MB' }
                    },
                    {
                        id: 'cpu-intensive',
                        agentId: 'resource-test-agent',
                        action: 'cpu-intensive-task',
                        parameters: { duration: 5000 }
                    },
                    {
                        id: 'io-intensive',
                        agentId: 'resource-test-agent',
                        action: 'io-intensive-task',
                        parameters: { operations: 1000 }
                    }
                ]
            };
            const executionResult = await integrationLayer.executeWorkflow(resourceWorkflow);
            expect(executionResult.success).toBe(true);
            // Monitor resource usage during execution
            const resourceMonitoring = setInterval(async () => {
                const resourceMetrics = await integrationLayer.getResourceMetrics();
                if (resourceMetrics.memoryUsage > 0.9) {
                    console.warn('High memory usage detected:', resourceMetrics.memoryUsage);
                }
                if (resourceMetrics.cpuUsage > 0.9) {
                    console.warn('High CPU usage detected:', resourceMetrics.cpuUsage);
                }
            }, 1000);
            // Wait for workflow completion
            let workflowStatus;
            let attempts = 0;
            do {
                await new Promise(resolve => setTimeout(resolve, 1000));
                workflowStatus = await integrationLayer.getWorkflowStatus(executionResult.workflowId);
                attempts++;
            } while (workflowStatus.status === 'running' && attempts < 30);
            clearInterval(resourceMonitoring);
            // Verify system handled resource pressure
            expect(['completed', 'failed']).toContain(workflowStatus.status);
            // Check if system implemented resource protection
            const finalResourceMetrics = await integrationLayer.getResourceMetrics();
            expect(finalResourceMetrics.memoryUsage).toBeLessThan(0.95); // System should prevent complete exhaustion
            // Verify system recovery
            const recoveryHealthCheck = await integrationLayer.getSystemHealth();
            expect(recoveryHealthCheck.status).toMatch(/healthy|degraded/); // Should not be completely failed
        });
    });
    describe('Error Handling and Recovery Integration', () => {
        it('should handle cascading failures gracefully', async () => {
            await integrationLayer.initialize();
            // Register agents with different failure modes
            const agents = [
                {
                    id: 'stable-agent',
                    name: 'Stable Agent',
                    capabilities: ['reliable-operations'],
                    endpoint: 'ws://localhost:8081'
                },
                {
                    id: 'intermittent-agent',
                    name: 'Intermittent Agent',
                    capabilities: ['unreliable-operations'],
                    endpoint: 'ws://localhost:8082'
                },
                {
                    id: 'dependent-agent',
                    name: 'Dependent Agent',
                    capabilities: ['dependent-operations'],
                    endpoint: 'ws://localhost:8083'
                }
            ];
            for (const agent of agents) {
                await integrationLayer.registerAgent(agent);
            }
            // Create workflow with potential cascade failure
            const cascadeWorkflow = {
                id: 'cascade-failure-workflow',
                name: 'Cascade Failure Test',
                steps: [
                    {
                        id: 'stable-operation',
                        agentId: 'stable-agent',
                        action: 'reliable-task',
                        parameters: { data: 'initial' }
                    },
                    {
                        id: 'intermittent-operation',
                        agentId: 'intermittent-agent',
                        action: 'unreliable-task',
                        parameters: {
                            failureRate: 0.7, // 70% failure rate
                            data: '${stable-operation.result}'
                        },
                        dependencies: ['stable-operation'],
                        retryPolicy: {
                            maxRetries: 2,
                            backoffMultiplier: 1.5
                        }
                    },
                    {
                        id: 'dependent-operation',
                        agentId: 'dependent-agent',
                        action: 'dependent-task',
                        parameters: {
                            data: '${intermittent-operation.result}'
                        },
                        dependencies: ['intermittent-operation'],
                        fallbackStrategy: {
                            enabled: true,
                            fallbackAgent: 'stable-agent',
                            fallbackAction: 'fallback-task'
                        }
                    }
                ]
            };
            const executionResult = await integrationLayer.executeWorkflow(cascadeWorkflow);
            expect(executionResult.success).toBe(true);
            // Monitor workflow execution
            let workflowStatus;
            let attempts = 0;
            do {
                await new Promise(resolve => setTimeout(resolve, 1000));
                workflowStatus = await integrationLayer.getWorkflowStatus(executionResult.workflowId);
                attempts++;
            } while (workflowStatus.status === 'running' && attempts < 20);
            // Verify failure handling
            expect(['completed', 'partial', 'failed']).toContain(workflowStatus.status);
            expect(workflowStatus.stepResults['stable-operation'].success).toBe(true);
            // Check if fallback mechanisms were triggered
            if (workflowStatus.stepResults['intermittent-operation'].success === false) {
                expect(workflowStatus.stepResults['dependent-operation'].fallbackUsed).toBe(true);
            }
            // Verify system resilience metrics
            const resilienceMetrics = await integrationLayer.getResilienceMetrics();
            expect(resilienceMetrics.failureRecoveryRate).toBeGreaterThan(0);
            expect(resilienceMetrics.fallbackActivations).toBeGreaterThanOrEqual(0);
        });
        it('should implement circuit breaker patterns', async () => {
            await integrationLayer.initialize();
            const unreliableAgent = {
                id: 'circuit-breaker-agent',
                name: 'Circuit Breaker Test Agent',
                capabilities: ['failing-operations'],
                endpoint: 'ws://localhost:8081'
            };
            await integrationLayer.registerAgent(unreliableAgent);
            // Configure circuit breaker
            const circuitBreakerConfig = {
                failureThreshold: 5,
                recoveryTimeout: 2000,
                halfOpenMaxCalls: 3
            };
            await integrationLayer.configureCircuitBreaker(unreliableAgent.id, circuitBreakerConfig);
            // Generate failures to trigger circuit breaker
            const failurePromises = [];
            for (let i = 0; i < 10; i++) {
                failurePromises.push(integrationLayer.executeAgentTask(unreliableAgent.id, {
                    action: 'failing-task',
                    parameters: { shouldFail: true, attempt: i }
                }));
            }
            const failureResults = await Promise.allSettled(failurePromises);
            const failures = failureResults.filter(r => r.status === 'rejected').length;
            expect(failures).toBeGreaterThan(0);
            // Check circuit breaker status
            const circuitStatus = await integrationLayer.getCircuitBreakerStatus(unreliableAgent.id);
            expect(circuitStatus.state).toBe('open');
            expect(circuitStatus.failureCount).toBeGreaterThanOrEqual(circuitBreakerConfig.failureThreshold);
            // Wait for recovery timeout
            await new Promise(resolve => setTimeout(resolve, circuitBreakerConfig.recoveryTimeout + 500));
            // Test half-open state
            const recoveryResult = await integrationLayer.executeAgentTask(unreliableAgent.id, {
                action: 'recovery-test',
                parameters: { shouldSucceed: true }
            });
            const updatedCircuitStatus = await integrationLayer.getCircuitBreakerStatus(unreliableAgent.id);
            expect(updatedCircuitStatus.state).toMatch(/half-open|closed/);
            if (recoveryResult.success) {
                expect(updatedCircuitStatus.state).toBe('closed');
            }
        });
        it('should maintain data consistency during failures', async () => {
            await integrationLayer.initialize();
            const dataAgent = {
                id: 'data-consistency-agent',
                name: 'Data Consistency Agent',
                capabilities: ['data-operations'],
                endpoint: 'ws://localhost:8081'
            };
            await integrationLayer.registerAgent(dataAgent);
            // Create workflow with transactional operations
            const transactionalWorkflow = {
                id: 'data-consistency-workflow',
                name: 'Data Consistency Test',
                transactionMode: true,
                steps: [
                    {
                        id: 'create-data',
                        agentId: 'data-consistency-agent',
                        action: 'create-record',
                        parameters: {
                            id: 'test-record-1',
                            data: { value: 'initial' }
                        }
                    },
                    {
                        id: 'update-data',
                        agentId: 'data-consistency-agent',
                        action: 'update-record',
                        parameters: {
                            id: 'test-record-1',
                            data: { value: 'updated' }
                        },
                        dependencies: ['create-data']
                    },
                    {
                        id: 'failing-operation',
                        agentId: 'data-consistency-agent',
                        action: 'failing-update',
                        parameters: {
                            id: 'test-record-1',
                            data: { value: 'should-not-persist' },
                            shouldFail: true
                        },
                        dependencies: ['update-data']
                    }
                ]
            };
            const executionResult = await integrationLayer.executeWorkflow(transactionalWorkflow);
            expect(executionResult.success).toBe(true);
            // Wait for workflow completion/failure
            let workflowStatus;
            let attempts = 0;
            do {
                await new Promise(resolve => setTimeout(resolve, 500));
                workflowStatus = await integrationLayer.getWorkflowStatus(executionResult.workflowId);
                attempts++;
            } while (workflowStatus.status === 'running' && attempts < 10);
            expect(workflowStatus.status).toBe('failed');
            // Verify transaction rollback
            const dataState = await integrationLayer.getDataState('test-record-1');
            expect(dataState.exists).toBe(false); // Should be rolled back due to transaction failure
            // Verify consistency metrics
            const consistencyMetrics = await integrationLayer.getConsistencyMetrics();
            expect(consistencyMetrics.transactionRollbacks).toBeGreaterThan(0);
            expect(consistencyMetrics.dataIntegrityViolations).toBe(0);
        });
    });
});
//# sourceMappingURL=integration.test.js.map