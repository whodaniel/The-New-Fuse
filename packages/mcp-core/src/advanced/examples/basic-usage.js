"use strict";
/**
 * Basic Usage Examples for Advanced MCP Capabilities
 *
 * This file demonstrates how to use the advanced MCP capabilities
 * in real-world scenarios.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.basicIntegrationExample = basicIntegrationExample;
exports.orchestrationExample = orchestrationExample;
exports.browserAutomationExample = browserAutomationExample;
exports.securityExample = securityExample;
exports.communicationExample = communicationExample;
exports.monitoringExample = monitoringExample;
exports.pluginExample = pluginExample;
exports.runAllExamples = runAllExamples;
const MCPIntegrationLayer_1 = require("../MCPIntegrationLayer");
const MCPOrchestrator_1 = require("../MCPOrchestrator");
const AdvancedBrowserAutomation_1 = require("../AdvancedBrowserAutomation");
const SecurityFramework_1 = require("../SecurityFramework");
const RealtimeCommunication_1 = require("../RealtimeCommunication");
const MonitoringAnalytics_1 = require("../MonitoringAnalytics");
const PluginEcosystem_1 = require("../PluginEcosystem");
/**
 * Example 1: Basic Integration Setup
 */
async function basicIntegrationExample() {
    console.log('🚀 Starting Basic Integration Example');
    // Initialize the integration layer with basic configuration
    const integration = new MCPIntegrationLayer_1.MCPIntegrationLayer({
        orchestrator: {
            enabled: true,
            maxConcurrentTasks: 5,
            taskTimeout: 30000
        },
        browserAutomation: {
            enabled: true,
            maxSessions: 3,
            headless: true
        },
        security: {
            enabled: true,
            jwtSecret: 'demo-secret-key',
            encryptionKey: 'demo-encryption-key-32-characters',
            sessionTimeout: 3600000
        },
        communication: {
            enabled: true,
            port: 8765,
            maxConnections: 50
        },
        monitoring: {
            enabled: true,
            metricsInterval: 5000,
            alertThresholds: {}
        },
        plugins: {
            enabled: true,
            storageRoot: './plugins',
            sandboxed: true
        }
    });
    try {
        // Initialize all capabilities
        await integration.initialize();
        console.log('✅ Integration layer initialized successfully');
        // Check capability status
        const status = integration.getCapabilityStatus();
        status.forEach(cap => {
            console.log(`📊 ${cap.name}: ${cap.status}`);
        });
        // Perform a health check
        const healthCheck = await integration.executeOperation({
            type: 'healthCheck',
            capabilities: ['orchestrator', 'browserAutomation', 'security'],
            params: {}
        });
        console.log('🏥 Health Check Results:', healthCheck);
    }
    catch (error) {
        console.error('❌ Integration failed:', error);
    }
    finally {
        // Clean shutdown
        await integration.shutdown();
        console.log('🛑 Integration layer shut down');
    }
}
/**
 * Example 2: Multi-Agent Task Orchestration
 */
async function orchestrationExample() {
    console.log('🎭 Starting Orchestration Example');
    const orchestrator = new MCPOrchestrator_1.MCPOrchestrator();
    try {
        // Register multiple agents
        await orchestrator.registerAgent({
            id: 'web-scraper',
            name: 'Web Scraping Agent',
            capabilities: ['web_navigation', 'data_extraction', 'html_parsing'],
            endpoint: 'ws://localhost:8080/web-scraper',
            metadata: {
                version: '1.0.0',
                description: 'Specialized in web scraping tasks'
            }
        });
        await orchestrator.registerAgent({
            id: 'data-processor',
            name: 'Data Processing Agent',
            capabilities: ['data_analysis', 'csv_processing', 'json_manipulation'],
            endpoint: 'ws://localhost:8081/data-processor',
            metadata: {
                version: '1.0.0',
                description: 'Handles data processing and analysis'
            }
        });
        await orchestrator.registerAgent({
            id: 'report-generator',
            name: 'Report Generation Agent',
            capabilities: ['pdf_generation', 'chart_creation', 'template_processing'],
            endpoint: 'ws://localhost:8082/report-generator',
            metadata: {
                version: '1.0.0',
                description: 'Creates reports and visualizations'
            }
        });
        console.log('✅ Agents registered successfully');
        // Create a collaboration session for a complex workflow
        const session = await orchestrator.createCollaborationSession({
            id: 'market-research-workflow',
            name: 'Market Research Analysis',
            participants: ['web-scraper', 'data-processor', 'report-generator'],
            workflow: {
                steps: [
                    { agent: 'web-scraper', task: 'scrape_competitor_data' },
                    { agent: 'data-processor', task: 'analyze_market_trends' },
                    { agent: 'report-generator', task: 'create_executive_summary' }
                ]
            }
        });
        console.log('🤝 Collaboration session created:', session.id);
        // Distribute tasks with dependencies
        const tasks = [
            {
                id: 'scrape-task-1',
                type: 'web_scraping',
                requirements: ['web_navigation', 'data_extraction'],
                priority: 'high',
                data: {
                    urls: ['https://competitor1.com', 'https://competitor2.com'],
                    selectors: ['.price', '.product-name', '.rating']
                }
            },
            {
                id: 'process-task-1',
                type: 'data_processing',
                requirements: ['data_analysis'],
                priority: 'medium',
                dependencies: ['scrape-task-1'],
                data: {
                    format: 'json',
                    operations: ['aggregate', 'normalize', 'trend_analysis']
                }
            },
            {
                id: 'report-task-1',
                type: 'report_generation',
                requirements: ['pdf_generation', 'chart_creation'],
                priority: 'low',
                dependencies: ['process-task-1'],
                data: {
                    template: 'executive_summary',
                    charts: ['price_comparison', 'market_share']
                }
            }
        ];
        // Execute tasks in sequence
        for (const task of tasks) {
            console.log(`🎯 Distributing task: ${task.id}`);
            const result = await orchestrator.distributeTask(task);
            console.log(`✅ Task ${task.id} completed by agent: ${result.assignedAgent}`);
        }
    }
    catch (error) {
        console.error('❌ Orchestration failed:', error);
    }
}
/**
 * Example 3: Advanced Browser Automation
 */
async function browserAutomationExample() {
    console.log('🌐 Starting Browser Automation Example');
    const automation = new AdvancedBrowserAutomation_1.AdvancedBrowserAutomation();
    try {
        // Create a browser session with specific configuration
        const session = await automation.createSession({
            headless: false,
            viewport: { width: 1920, height: 1080 },
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            locale: 'en-US'
        });
        console.log('🖥️ Browser session created:', session.id);
        // Navigate to a website
        await automation.navigate(session.id, 'https://example.com');
        console.log('🧭 Navigation completed');
        // Take a screenshot
        const screenshot = await automation.takeScreenshot(session.id);
        console.log('📸 Screenshot captured:', screenshot.path);
        // Find and interact with elements
        const searchBox = await automation.findElement(session.id, {
            selector: 'input[type="search"]',
            timeout: 5000
        });
        if (searchBox) {
            await automation.type(session.id, searchBox.id, 'advanced automation');
            console.log('⌨️ Text entered in search box');
            const submitButton = await automation.findElement(session.id, {
                selector: 'button[type="submit"]'
            });
            if (submitButton) {
                await automation.click(session.id, submitButton.id);
                console.log('🖱️ Submit button clicked');
            }
        }
        // Execute custom automation script
        const scriptResult = await automation.executeScript(session.id, {
            name: 'extract-product-data',
            steps: [
                { action: 'wait', selector: '.product-list', timeout: 5000 },
                { action: 'extract', selector: '.product-item', attribute: 'data-product-id' },
                { action: 'scroll', direction: 'down', pixels: 500 }
            ]
        });
        console.log('🤖 Automation script executed:', scriptResult);
        // Monitor performance
        const metrics = await automation.getPerformanceMetrics(session.id);
        console.log('📊 Performance metrics:', {
            loadTime: metrics.navigationTiming?.loadEventEnd,
            domContentLoaded: metrics.navigationTiming?.domContentLoadedEventEnd,
            memoryUsage: metrics.memory?.usedJSHeapSize
        });
    }
    catch (error) {
        console.error('❌ Browser automation failed:', error);
    }
}
/**
 * Example 4: Security Framework Usage
 */
async function securityExample() {
    console.log('🔐 Starting Security Example');
    const security = new SecurityFramework_1.SecurityFramework({
        jwtSecret: 'demo-secret-key-for-jwt-signing',
        encryptionKey: 'demo-encryption-key-32-characters',
        sessionTimeout: 3600000
    });
    try {
        // Authenticate an agent
        const authResult = await security.authenticateAgent('demo-agent', 'secure-password');
        if (authResult.success) {
            console.log('✅ Agent authenticated successfully');
            console.log('🎫 JWT Token:', authResult.token?.substring(0, 20) + '...');
            // Encrypt sensitive data
            const sensitiveData = 'This is confidential information';
            const encrypted = await security.encryptData(sensitiveData);
            console.log('🔒 Data encrypted:', encrypted.data.substring(0, 20) + '...');
            // Decrypt the data
            const decrypted = await security.decryptData(encrypted.data, encrypted.iv, encrypted.tag);
            console.log('🔓 Data decrypted:', decrypted);
            // Verify JWT token
            if (authResult.token) {
                const verified = await security.verifyToken(authResult.token);
                console.log('✅ Token verified:', verified.valid);
            }
            // Check access permissions
            const hasAccess = await security.checkAccess('demo-agent', 'browser_automation', 'execute');
            console.log('🚪 Access check result:', hasAccess);
        }
        else {
            console.log('❌ Authentication failed:', authResult.error);
        }
    }
    catch (error) {
        console.error('❌ Security operation failed:', error);
    }
}
/**
 * Example 5: Real-time Communication
 */
async function communicationExample() {
    console.log('💬 Starting Communication Example');
    const hub = new RealtimeCommunication_1.RealtimeCommunicationHub(8765);
    try {
        // Start the communication hub
        await hub.start();
        console.log('🚀 Communication hub started on port 8765');
        // Simulate agent connections
        const agent1 = await hub.connectAgent('agent-1', 'ws://localhost:8765');
        const agent2 = await hub.connectAgent('agent-2', 'ws://localhost:8765');
        console.log('🔗 Agents connected');
        // Create a communication channel
        const channel = await hub.createChannel({
            id: 'task-coordination',
            name: 'Task Coordination Channel',
            participants: ['agent-1', 'agent-2'],
            persistent: true
        });
        console.log('📡 Channel created:', channel.id);
        // Send messages between agents
        await hub.sendMessage({
            from: 'agent-1',
            to: 'agent-2',
            type: 'task_request',
            channel: 'task-coordination',
            data: {
                taskId: 'process-data-123',
                priority: 'high',
                deadline: Date.now() + 3600000
            }
        });
        console.log('📨 Message sent from agent-1 to agent-2');
        // Broadcast to all agents in channel
        await hub.broadcastToChannel('task-coordination', {
            from: 'system',
            type: 'status_update',
            data: {
                message: 'All systems operational',
                timestamp: Date.now()
            }
        });
        console.log('📢 Broadcast message sent to channel');
        // Set up message filtering
        await hub.setMessageFilter('agent-1', {
            types: ['task_request', 'status_update'],
            priority: 'high',
            channels: ['task-coordination']
        });
        console.log('🔍 Message filter configured for agent-1');
    }
    catch (error) {
        console.error('❌ Communication failed:', error);
    }
    finally {
        await hub.stop();
        console.log('🛑 Communication hub stopped');
    }
}
/**
 * Example 6: Monitoring and Analytics
 */
async function monitoringExample() {
    console.log('📊 Starting Monitoring Example');
    const monitoring = new MonitoringAnalytics_1.MonitoringAnalyticsEngine();
    try {
        // Start monitoring with 5-second intervals
        await monitoring.startMonitoring(5000);
        console.log('📈 Monitoring started');
        // Set performance thresholds
        await monitoring.setThreshold({
            metric: 'response_time',
            operator: 'greater_than',
            value: 1000,
            severity: 'warning',
            description: 'Response time exceeds 1 second'
        });
        await monitoring.setThreshold({
            metric: 'error_rate',
            operator: 'greater_than',
            value: 0.05,
            severity: 'critical',
            description: 'Error rate exceeds 5%'
        });
        console.log('⚠️ Performance thresholds configured');
        // Simulate some metrics collection
        await monitoring.collectAgentMetrics('demo-agent', {
            responseTime: 850,
            successRate: 0.95,
            errorRate: 0.05,
            throughput: 100,
            memoryUsage: 256,
            cpuUsage: 45
        });
        console.log('📊 Agent metrics collected');
        // Query analytics data
        const analyticsResult = await monitoring.queryAnalytics({
            metric: 'response_time',
            timeRange: {
                start: Date.now() - 3600000, // Last hour
                end: Date.now()
            },
            aggregation: 'average',
            groupBy: 'agent'
        });
        console.log('📈 Analytics query result:', analyticsResult);
        // Get system health
        const systemHealth = await monitoring.getSystemHealth();
        console.log('🏥 System health:', systemHealth);
        // Wait for potential alerts
        setTimeout(async () => {
            const alerts = await monitoring.getActiveAlerts();
            console.log('🚨 Active alerts:', alerts.length);
        }, 6000);
    }
    catch (error) {
        console.error('❌ Monitoring failed:', error);
    }
    finally {
        await monitoring.stopMonitoring();
        console.log('🛑 Monitoring stopped');
    }
}
/**
 * Example 7: Plugin Ecosystem
 */
async function pluginExample() {
    console.log('🔌 Starting Plugin Example');
    const plugins = new PluginEcosystem_1.PluginEcosystemManager('./examples/plugins');
    try {
        // Load a custom plugin
        await plugins.loadPlugin('data-transformer', {
            path: './examples/plugins/data-transformer.js',
            permissions: ['file_read', 'file_write', 'network_access'],
            config: {
                maxFileSize: 10485760, // 10MB
                allowedFormats: ['json', 'csv', 'xml']
            }
        });
        console.log('🔌 Plugin loaded: data-transformer');
        // Execute plugin capability
        const transformResult = await plugins.executeCapability('data-transformer', 'transform', {
            input: [
                { name: 'John', age: 30, city: 'New York' },
                { name: 'Jane', age: 25, city: 'San Francisco' }
            ],
            format: 'csv',
            options: {
                headers: true,
                delimiter: ','
            }
        });
        console.log('🔄 Data transformation result:', transformResult);
        // Get plugin status
        const pluginStatus = await plugins.getPluginStatus('data-transformer');
        console.log('📊 Plugin status:', pluginStatus);
        // List all available plugins
        const availablePlugins = await plugins.listPlugins();
        console.log('📋 Available plugins:', availablePlugins.map(p => p.id));
    }
    catch (error) {
        console.error('❌ Plugin operation failed:', error);
    }
}
/**
 * Run all examples
 */
async function runAllExamples() {
    console.log('🎬 Running All Advanced MCP Examples\n');
    const examples = [
        { name: 'Basic Integration', fn: basicIntegrationExample },
        { name: 'Orchestration', fn: orchestrationExample },
        { name: 'Browser Automation', fn: browserAutomationExample },
        { name: 'Security Framework', fn: securityExample },
        { name: 'Real-time Communication', fn: communicationExample },
        { name: 'Monitoring & Analytics', fn: monitoringExample },
        { name: 'Plugin Ecosystem', fn: pluginExample }
    ];
    for (const example of examples) {
        try {
            console.log(`\n${'='.repeat(50)}`);
            console.log(`🎯 Running ${example.name} Example`);
            console.log(`${'='.repeat(50)}`);
            await example.fn();
            console.log(`✅ ${example.name} example completed successfully`);
        }
        catch (error) {
            console.error(`❌ ${example.name} example failed:`, error);
        }
        // Wait between examples
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    console.log('\n🎉 All examples completed!');
}
// Export for direct execution
if (require.main === module) {
    runAllExamples().catch(console.error);
}
//# sourceMappingURL=basic-usage.js.map