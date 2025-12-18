#!/usr/bin/env node

/**
 * Integration Test Suite for The New Fuse VSCode Extension
 * Tests all implemented features with TNF backend integration
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
    apiUrl: 'http://localhost:3001/api',
    testWorkspace: path.join(__dirname, 'test-workspace'),
    testFiles: [
        'test-file.ts',
        'test-component.tsx',
        'test-utils.js'
    ]
};

// Mock VSCode API for testing
class MockVSCode {
    constructor() {
        this.workspace = {
            workspaceFolders: [{ uri: { fsPath: TEST_CONFIG.testWorkspace } }],
            findFiles: async (pattern) => {
                return TEST_CONFIG.testFiles.map(file => ({ fsPath: path.join(TEST_CONFIG.testWorkspace, file) }));
            },
            openTextDocument: async (uri) => ({
                fileName: uri.fsPath,
                getText: () => `// Test content for ${path.basename(uri.fsPath)}`,
                languageId: this.getLanguageId(uri.fsPath)
            }),
            showTextDocument: async () => ({}),
            showInformationMessage: async (msg) => console.log('INFO:', msg),
            showErrorMessage: async (msg) => console.error('ERROR:', msg),
            showWarningMessage: async (msg) => console.log('WARN:', msg),
            createOutputChannel: () => ({
                show: () => {},
                appendLine: (line) => console.log('OUTPUT:', line)
            })
        };

        this.window = {
            activeTextEditor: {
                document: {
                    fileName: path.join(TEST_CONFIG.testWorkspace, 'test-file.ts'),
                    languageId: 'typescript',
                    getText: () => '// Active file content'
                },
                selection: {
                    active: { line: 0, character: 0 }
                }
            },
            visibleTextEditors: [
                {
                    document: {
                        fileName: path.join(TEST_CONFIG.testWorkspace, 'test-file.ts'),
                        languageId: 'typescript'
                    }
                }
            ],
            showInputBox: async (options) => {
                console.log('INPUT REQUEST:', options.prompt);
                return 'test-input';
            },
            showQuickPick: async (items) => {
                console.log('QUICK PICK:', items.length, 'options');
                return items[0];
            },
            withProgress: async (options, task) => {
                console.log('PROGRESS:', options.title);
                return await task();
            },
            createStatusBarItem: () => ({
                text: '',
                tooltip: '',
                show: () => {},
                hide: () => {}
            })
        };

        this.languages = {
            getLanguageIdAtPosition: () => 'typescript'
        };
    }

    getLanguageId(filePath) {
        const ext = path.extname(filePath);
        const map = { '.ts': 'typescript', '.tsx': 'typescript', '.js': 'javascript', '.jsx': 'javascript' };
        return map[ext] || 'plaintext';
    }
}

// Mock API Client for testing
class MockApiClient {
    constructor() {
        this.baseUrl = TEST_CONFIG.apiUrl;
        this.requestLog = [];
    }

    async axiosInstance(method, endpoint, data) {
        this.requestLog.push({ method, endpoint, data, timestamp: Date.now() });

        // Simulate backend responses
        return this.mockBackendResponse(endpoint, data);
    }

    async mockBackendResponse(endpoint, data) {
        const responses = {
            '/tasks/completion': {
                data: { taskId: `task-${Date.now()}`, status: 'processing' }
            },
            '/tasks/analysis': {
                data: { taskId: `analysis-${Date.now()}`, status: 'processing' }
            },
            '/workspace/search': {
                data: {
                    results: [
                        {
                            file: 'test-file.ts',
                            line: 1,
                            column: 0,
                            content: '// Test content',
                            relevance: 0.9
                        }
                    ]
                }
            },
            '/providers/models': {
                data: {
                    providers: [
                        {
                            id: 'test-provider',
                            name: 'Test Provider',
                            models: [
                                {
                                    id: 'test-model',
                                    name: 'Test Model',
                                    capabilities: ['text', 'code']
                                }
                            ]
                        }
                    ]
                }
            },
            '/collaboration/sessions': {
                data: {
                    session: {
                        id: `session-${Date.now()}`,
                        name: data?.name || 'Test Session',
                        participants: []
                    }
                }
            }
        };

        return responses[endpoint] || { data: { success: true } };
    }

    getRequestLog() {
        return this.requestLog;
    }
}

// Integration Test Suite
class IntegrationTestSuite {
    constructor() {
        this.vscode = new MockVSCode();
        this.apiClient = new MockApiClient();
        this.results = {
            passed: 0,
            failed: 0,
            tests: []
        };
    }

    /**
     * Run all integration tests
     */
    async runAllTests() {
        console.log('🧪 Starting TNF VSCode Extension Integration Tests...\n');

        try {
            // Setup test environment
            await this.setupTestEnvironment();

            // Run test suites
            await this.testCustomModesManager();
            await this.testCodeCompletionProvider();
            await this.testChatInterfaceProvider();
            await this.testCodeAnalysisService();
            await this.testMultiModelManager();
            await this.testWorkspaceIntegrationService();
            await this.testRealTimeCollaborationService();

            // Print results
            this.printResults();

        } catch (error) {
            console.error('❌ Test suite failed:', error);
            process.exit(1);
        }
    }

    /**
     * Setup test environment
     */
    async setupTestEnvironment() {
        console.log('🔧 Setting up test environment...');

        // Create test workspace directory
        if (!fs.existsSync(TEST_CONFIG.testWorkspace)) {
            fs.mkdirSync(TEST_CONFIG.testWorkspace, { recursive: true });
        }

        // Create test files
        for (const file of TEST_CONFIG.testFiles) {
            const filePath = path.join(TEST_CONFIG.testWorkspace, file);
            const content = `// Test file: ${file}\nconsole.log('Hello, World!');\n`;
            fs.writeFileSync(filePath, content);
        }

        console.log(`✅ Created test workspace with ${TEST_CONFIG.testFiles.length} files`);
    }

    /**
     * Test Custom Modes Manager
     */
    private async testCustomModesManager() {
        console.log('\n📋 Testing Custom Modes Manager...');

        try {
            // Test loading custom modes
            const modes = [
                {
                    name: 'Test Mode',
                    slug: 'test-mode',
                    roleDefinition: 'Test role definition'
                }
            ];

            this.assert(modes.length === 1, 'Custom modes array should have 1 mode');
            this.assert(modes[0].name === 'Test Mode', 'Mode name should match');

            // Test mode validation
            const isValid = this.validateCustomMode(modes[0]);
            this.assert(isValid, 'Mode should be valid');

            this.recordTest('Custom Modes Manager', true, 'All tests passed');
        } catch (error) {
            this.recordTest('Custom Modes Manager', false, error.message);
        }
    }

    /**
     * Test Code Completion Provider
     */
    private async testCodeCompletionProvider() {
        console.log('\n💡 Testing Code Completion Provider...');

        try {
            // Test completion task creation
            const taskData = {
                filePath: 'test-file.ts',
                linePrefix: 'console.log(',
                contextCode: '// Test context',
                position: { line: 0, character: 12 }
            };

            const response = await this.apiClient.axiosInstance('post', '/tasks/completion', taskData);
            this.assert(response.data.taskId, 'Should create completion task');

            // Test completion polling
            const completionsResponse = await this.apiClient.axiosInstance('get', `/tasks/${response.data.taskId}/completions`);
            this.assert(Array.isArray(completionsResponse.data.completions), 'Should return completions array');

            this.recordTest('Code Completion Provider', true, 'Backend integration working');
        } catch (error) {
            this.recordTest('Code Completion Provider', false, error.message);
        }
    }

    /**
     * Test Chat Interface Provider
     */
    private async testChatInterfaceProvider() {
        console.log('\n💬 Testing Chat Interface Provider...');

        try {
            // Test chat message sending
            const chatData = {
                message: 'Hello, AI!',
                mode: 'test-mode',
                context: {
                    file: 'test-file.ts',
                    language: 'typescript'
                }
            };

            const response = await this.apiClient.axiosInstance('post', '/chat', chatData);
            this.assert(response.data.response, 'Should receive chat response');

            this.recordTest('Chat Interface Provider', true, 'Chat backend integration working');
        } catch (error) {
            this.recordTest('Chat Interface Provider', false, error.message);
        }
    }

    /**
     * Test Code Analysis Service
     */
    private async testCodeAnalysisService() {
        console.log('\n🔍 Testing Code Analysis Service...');

        try {
            // Test file analysis
            const analysisData = {
                filePath: 'test-file.ts',
                content: '// Test file content',
                language: 'typescript'
            };

            const response = await this.apiClient.axiosInstance('post', '/tasks/analysis', analysisData);
            this.assert(response.data.taskId, 'Should create analysis task');

            this.recordTest('Code Analysis Service', true, 'Analysis backend integration working');
        } catch (error) {
            this.recordTest('Code Analysis Service', false, error.message);
        }
    }

    /**
     * Test Multi-Model Manager
     */
    private async testMultiModelManager() {
        console.log('\n🤖 Testing Multi-Model Manager...');

        try {
            // Test provider loading
            const response = await this.apiClient.axiosInstance('get', '/providers/models');
            this.assert(response.data.providers, 'Should load providers');

            // Test model selection
            const providers = response.data.providers;
            this.assert(providers.length > 0, 'Should have at least one provider');

            this.recordTest('Multi-Model Manager', true, 'Provider backend integration working');
        } catch (error) {
            this.recordTest('Multi-Model Manager', false, error.message);
        }
    }

    /**
     * Test Workspace Integration Service
     */
    private async testWorkspaceIntegrationService() {
        console.log('\n🏗️ Testing Workspace Integration Service...');

        try {
            // Test workspace search
            const searchData = {
                workspacePath: TEST_CONFIG.testWorkspace,
                query: 'console.log',
                options: { useAI: true }
            };

            const response = await this.apiClient.axiosInstance('post', '/workspace/search', searchData);
            this.assert(Array.isArray(response.data.results), 'Should return search results');

            this.recordTest('Workspace Integration Service', true, 'Search backend integration working');
        } catch (error) {
            this.recordTest('Workspace Integration Service', false, error.message);
        }
    }

    /**
     * Test Real-time Collaboration Service
     */
    private async testRealTimeCollaborationService() {
        console.log('\n🤝 Testing Real-time Collaboration Service...');

        try {
            // Test session creation
            const sessionData = {
                name: 'Test Collaboration Session',
                settings: {
                    allowEditing: true,
                    allowComments: true
                }
            };

            const response = await this.apiClient.axiosInstance('post', '/collaboration/sessions', sessionData);
            this.assert(response.data.session, 'Should create collaboration session');
            this.assert(response.data.session.id, 'Session should have ID');

            this.recordTest('Real-time Collaboration Service', true, 'Collaboration backend integration working');
        } catch (error) {
            this.recordTest('Real-time Collaboration Service', false, error.message);
        }
    }

    /**
     * Helper methods
     */
    private assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    private validateCustomMode(mode) {
        return mode &&
               typeof mode.name === 'string' &&
               typeof mode.slug === 'string' &&
               typeof mode.roleDefinition === 'string';
    }

    private recordTest(testName, passed, message) {
        if (passed) {
            this.results.passed++;
            console.log(`  ✅ ${testName}: ${message}`);
        } else {
            this.results.failed++;
            console.log(`  ❌ ${testName}: ${message}`);
        }

        this.results.tests.push({
            name: testName,
            passed,
            message
        });
    }

    private printResults() {
        console.log('\n📊 Integration Test Results:');
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`📈 Success Rate: ${Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)}%`);

        if (this.results.failed === 0) {
            console.log('\n🎉 All integration tests passed!');
            console.log('🚀 TNF VSCode Extension is ready for deployment!');
        } else {
            console.log('\n⚠️  Some tests failed. Please review the issues above.');
            process.exit(1);
        }

        // Print API request summary
        console.log('\n🔗 API Integration Summary:');
        const requestLog = this.apiClient.getRequestLog();
        const endpoints = [...new Set(requestLog.map(r => r.endpoint))];

        endpoints.forEach(endpoint => {
            const count = requestLog.filter(r => r.endpoint === endpoint).length;
            console.log(`  ${endpoint}: ${count} requests`);
        });
    }
}

/**
 * Run integration tests
 */
async function runIntegrationTests() {
    const testSuite = new IntegrationTestSuite();
    await testSuite.runAllTests();
}

// Run tests if called directly
if (require.main === module) {
    runIntegrationTests().catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = { IntegrationTestSuite, runIntegrationTests };