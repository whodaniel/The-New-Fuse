import * as assert from 'assert';
import * as vscode from 'vscode';
import { MCPManager } from '../../../vscode-extension/mcp-integration/mcp-manager.js';
import { ToolRegistry } from '../../../vscode-extension/mcp-integration/tools/tool-registry.js';
import { AICoderIntegrationManager } from '../../../vscode-extension/ai-coder/integration-manager.js';
import { RooCoderMonitor } from '../../../vscode-extension/monitoring/roo-coder-monitor.js';
import { ConfigurationValidator } from '../../../vscode-extension/core/config-validator.js';
import { AICoderRole } from '../../../vscode-extension/ai-coder-integration.js';

suite('MCP System Integration Tests', () => {
    let mcpManager: MCPManager;
    let toolRegistry: ToolRegistry;
    let aiCoderManager: AICoderIntegrationManager;
    let monitor: RooCoderMonitor;
    let configValidator: ConfigurationValidator;

    setup(async () => {
        mcpManager = new MCPManager(vscode.extensions.getExtension('the-new-fuse-vscode')!.exports.getExtensionContext());
        toolRegistry = new ToolRegistry();
        aiCoderManager = new AICoderIntegrationManager(mcpManager, vscode.extensions.getExtension('the-new-fuse-vscode')!.exports.getExtensionContext());
        monitor = RooCoderMonitor.getInstance();
        configValidator = ConfigurationValidator.getInstance();
    });

    test('Complete System Integration', async () => {
        // Test system initialization
        await mcpManager.initialize();
        assert.strictEqual(mcpManager.isInitialized(), true);

        // Test enhanced tool registration and execution
        const tools = [
            {
                id: 'file-analyzer',
                name: 'File Analyzer',
                description: 'Analyzes code files and provides metrics',
                version: '1.0.0',
                capabilities: ['code-analysis'],
                execute: async (args: any) => ({ 
                    lines: 100,
                    complexity: 5,
                    dependencies: ['react', 'typescript']
                })
            },
            {
                id: 'code-formatter',
                name: 'Code Formatter',
                description: 'Formats code according to specified rules',
                version: '1.0.0',
                capabilities: ['code-formatting'],
                execute: async (args: any) => ({
                    formatted: true,
                    changes: 10
                })
            },
            {
                id: 'dependency-checker',
                name: 'Dependency Checker',
                description: 'Checks for dependency vulnerabilities',
                version: '1.0.0',
                capabilities: ['security'],
                execute: async (args: any) => ({
                    vulnerabilities: [],
                    outdatedDeps: ['lodash']
                })
            }
        ];

        // Register and test all tools
        for (const tool of tools) {
            await toolRegistry.registerTool(tool);
            const result = await toolRegistry.executeTool(tool.id, {});
            assert.ok(result, `Tool ${tool.id} execution failed`);
        }

        // Test enhanced monitoring capabilities
        const startTime = Date.now();
        
        // Track tool usage
        await toolRegistry.executeTool('file-analyzer', {});
        monitor.trackToolUsage('file-analyzer', Date.now() - startTime);
        
        // Test monitoring metrics
        const metrics = await monitor.getMetricsReport();
        assert.ok(metrics.includes('file-analyzer'), 'Tool usage not tracked');
        
        // Test error tracking
        try {
            throw new Error('Test error');
        } catch (error) {
            monitor.trackError(error as Error);
            const errorMetrics = await monitor.getMetricsReport();
            assert.ok(errorMetrics.includes('errorCount'), 'Error not tracked');
        }

        // Test enhanced AI Coder integration
        const coderRoles = [
            AICoderRole.Architect,
            AICoderRole.Implementer,
            AICoderRole.Tester
        ];

        // Activate and test multiple coders
        for (const role of coderRoles) {
            await aiCoderManager.activateCoder(role);
            const activeCoders = await monitor.getMetricsReport();
            assert.ok(activeCoders.includes(role), `Coder ${role} not activated`);
        }

        // Test coder deactivation
        await aiCoderManager.deactivateCoder(AICoderRole.Tester);
        const updatedCoders = await monitor.getMetricsReport();
        assert.ok(!updatedCoders.includes(AICoderRole.Tester), 'Coder not deactivated');

        // Test configuration validation with enhanced schema
        const testConfig = {
            required: 'value',
            number: 42,
            pattern: 'valid-pattern',
            tools: {
                enabled: true,
                maxConcurrent: 3,
                timeout: 5000
            },
            monitoring: {
                enabled: true,
                interval: 1000,
                metrics: ['cpu', 'memory']
            }
        };

        const schema = {
            required: ['required', 'tools', 'monitoring'],
            types: {
                required: 'string',
                number: 'number',
                'tools.enabled': 'boolean',
                'tools.maxConcurrent': 'number',
                'tools.timeout': 'number',
                'monitoring.enabled': 'boolean',
                'monitoring.interval': 'number',
                'monitoring.metrics': 'array'
            },
            patterns: {
                pattern: /^valid-/
            },
            ranges: {
                number: { min: 0, max: 100 },
                'tools.maxConcurrent': { min: 1, max: 10 },
                'tools.timeout': { min: 1000, max: 10000 },
                'monitoring.interval': { min: 100, max: 5000 }
            }
        };

        await configValidator.validateConfiguration(testConfig, schema);
    });

    test('AI Coder Collaboration', async () => {
        // Test collaboration between multiple AI coders
        await aiCoderManager.activateCoder(AICoderRole.Architect);
        await aiCoderManager.activateCoder(AICoderRole.Implementer);

        // Simulate architect's design
        const designResult = await toolRegistry.executeTool('file-analyzer', {
            file: 'test.ts',
            type: 'design'
        });
        assert.ok(designResult, 'Architect design failed');

        // Simulate implementer's code
        const implementResult = await toolRegistry.executeTool('code-formatter', {
            code: 'function test(): any { }',
            style: 'typescript'
        });
        assert.ok(implementResult, 'Implementation failed');

        // Verify collaboration metrics
        const collabMetrics = await monitor.getMetricsReport();
        assert.ok(collabMetrics.includes('collaboration'), 'Collaboration not tracked');
    });
});
