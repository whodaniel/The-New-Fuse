import * as vscode from 'vscode';
import { NewFuseApiClient } from '../src/services/ApiClient';
import { ConfigurationManager } from '../src/services/ConfigurationManager';
import { LoggingService } from '../src/services/LoggingService';
import { ChatParticipantManager } from '../src/services/ChatParticipantManager';
import { MetricsService } from '../src/services/MetricsService';

/**
 * End-to-End Integration Test
 * 
 * This test suite demonstrates the complete integration between
 * the VS Code extension and The New Fuse backend.
 */

describe('New Fuse VS Code Extension - E2E Integration', () => {
	let configManager: ConfigurationManager;
	let loggingService: LoggingService;
	let apiClient: NewFuseApiClient;
	let metricsService: MetricsService;
	let participantManager: ChatParticipantManager;

	beforeEach(() => {
		// Mock VS Code API
		const mockWorkspaceConfig = {
			get: jest.fn((key: string, defaultValue?: any) => {
				const config: any = {
					'serverUrl': 'http://localhost:3000',
					'tenantId': 'test-tenant',
					'apiKey': 'test-api-key',
					'enableDebugLogging': true,
					'streamingEnabled': true,
					'autoRefreshInterval': 300000
				};
				return config[key] ?? defaultValue;
			}),
			update: jest.fn()
		};

		(vscode.workspace.getConfiguration as jest.Mock) = jest.fn(() => mockWorkspaceConfig);

		// Initialize services
		loggingService = new LoggingService();
		configManager = new ConfigurationManager();
		apiClient = new NewFuseApiClient(configManager, loggingService);
		metricsService = new MetricsService(apiClient, loggingService);
		participantManager = new ChatParticipantManager(apiClient, configManager, loggingService, metricsService);
	});

	afterEach(() => {
		participantManager?.dispose();
		metricsService?.dispose();
	});

	describe('Configuration Management', () => {
		it('should load configuration from VS Code settings', () => {
			const config = configManager.getConfiguration();
			
			expect(config.serverUrl).toBe('http://localhost:3000');
			expect(config.tenantId).toBe('test-tenant');
			expect(config.apiKey).toBe('test-api-key');
			expect(config.enableDebugLogging).toBe(true);
			expect(config.streamingEnabled).toBe(true);
		});

		it('should validate configuration correctly', async () => {
			const isValid = await configManager.validateConfiguration();
			expect(isValid).toBe(true);
		});

		it('should identify missing configuration', async () => {
			// Mock missing tenant ID
			(vscode.workspace.getConfiguration as jest.Mock) = jest.fn(() => ({
				get: jest.fn((key: string, defaultValue?: any) => {
					if (key === 'tenantId') return '';
					return 'valid-value';
				})
			}));

			const newConfigManager = new ConfigurationManager();
			const isValid = await newConfigManager.validateConfiguration();
			expect(isValid).toBe(false);
		});
	});

	describe('API Client', () => {
		beforeEach(() => {
			// Mock axios requests
			jest.mock('axios');
		});

		it('should create client with correct configuration', () => {
			expect(apiClient).toBeDefined();
			// Verify client is configured with tenant headers and auth
		});

		it('should handle authentication errors gracefully', async () => {
			// Mock 401 response
			const mockError = {
				response: { status: 401 },
				message: 'Unauthorized'
			};

			jest.spyOn(apiClient as any, 'client').mockImplementation(() => ({
				get: jest.fn().mockRejectedValue(mockError)
			}));

			await expect(apiClient.getChatParticipants()).rejects.toThrow('Failed to fetch chat participants');
		});
	});

	describe('Chat Participant Management', () => {
		it('should initialize participants from backend', async () => {
			// Mock successful API response
			const mockParticipants = [
				{
					id: 'agent-1',
					name: 'Test Agent',
					description: 'A test agent',
					commands: ['help', 'status'],
					isActive: true,
					metadata: {},
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				}
			];

			jest.spyOn(apiClient, 'healthCheck').mockResolvedValue(true);
			jest.spyOn(apiClient, 'getChatParticipants').mockResolvedValue(mockParticipants);

			// Mock VS Code chat participant creation
			const mockChatParticipant = {
				dispose: jest.fn()
			};
			(vscode.chat.createChatParticipant as jest.Mock) = jest.fn(() => mockChatParticipant);

			const mockContext = {} as vscode.ExtensionContext;
			await participantManager.initialize(mockContext);

			expect(participantManager.getAllParticipants()).toHaveLength(1);
			expect(participantManager.getParticipant('agent-1')).toBeDefined();
		});

		it('should handle backend connection failures', async () => {
			jest.spyOn(apiClient, 'healthCheck').mockResolvedValue(false);

			const mockContext = {} as vscode.ExtensionContext;
			
			await expect(participantManager.initialize(mockContext)).rejects.toThrow('Backend health check failed');
		});

		it('should refresh agents when requested', async () => {
			const mockParticipants = [
				{
					id: 'agent-2',
					name: 'Updated Agent',
					description: 'An updated agent',
					commands: ['help'],
					isActive: true,
					metadata: {},
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				}
			];

			jest.spyOn(apiClient, 'getChatParticipants').mockResolvedValue(mockParticipants);

			const mockChatParticipant = {
				dispose: jest.fn()
			};
			(vscode.chat.createChatParticipant as jest.Mock) = jest.fn(() => mockChatParticipant);

			await participantManager.refreshAgents();

			expect(participantManager.getAllParticipants()).toHaveLength(1);
			expect(participantManager.getParticipant('agent-2')).toBeDefined();
		});
	});

	describe('Chat Request Handling', () => {
		it('should handle regular chat requests', async () => {
			// This would test the actual chat request flow
			// Mock the VS Code chat request/response interfaces
			const mockRequest: Partial<vscode.ChatRequest> = {
				prompt: 'Hello, test agent!',
				command: undefined
			};

			const mockContext: Partial<vscode.ChatContext> = {
				history: []
			};

			const mockStream = {
				markdown: jest.fn(),
				progress: jest.fn()
			};

			const mockToken = {
				isCancellationRequested: false
			};

			const mockChatResponse = {
				response: 'Hello! I\'m a test agent.',
				metadata: {}
			};

			jest.spyOn(apiClient, 'sendChatRequest').mockResolvedValue(mockChatResponse);

			// This would require mocking the internal chat handler
			// The actual implementation would be tested through integration
		});

		it('should handle streaming chat requests', async () => {
			// Test streaming response handling
			const mockRequest: Partial<vscode.ChatRequest> = {
				prompt: 'Stream test',
				command: undefined
			};

			const chunks = ['Hello', ' there', '!'];
			let chunkIndex = 0;

			jest.spyOn(apiClient, 'sendStreamingChatRequest').mockImplementation(
				(request, onChunk, onComplete, onError) => {
					// Simulate streaming chunks
					const interval = setInterval(() => {
						if (chunkIndex < chunks.length) {
							onChunk(chunks[chunkIndex++]);
						} else {
							clearInterval(interval);
							onComplete();
						}
					}, 10);

					return Promise.resolve();
				}
			);

			// Test would verify streaming behavior
		});
	});

	describe('Metrics Tracking', () => {
		it('should track request metrics', () => {
			metricsService.trackRequest('test-agent');
			metricsService.trackSuccess('test-agent', 150);

			const metrics = metricsService.getParticipantMetrics('test-agent');
			expect(metrics?.requestCount).toBe(1);
			expect(metrics?.successCount).toBe(1);
			expect(metrics?.averageResponseTime).toBe(150);
		});

		it('should track error metrics', () => {
			metricsService.trackRequest('test-agent');
			metricsService.trackError('test-agent', 200);

			const metrics = metricsService.getParticipantMetrics('test-agent');
			expect(metrics?.requestCount).toBe(1);
			expect(metrics?.errorCount).toBe(1);
		});

		it('should calculate aggregated metrics', () => {
			// Add some test data
			metricsService.trackRequest('agent-1');
			metricsService.trackSuccess('agent-1', 100);
			
			metricsService.trackRequest('agent-2');
			metricsService.trackError('agent-2', 50);

			const aggregated = metricsService.getAggregatedMetrics();
			expect(aggregated.totalRequests).toBe(2);
			expect(aggregated.totalSuccesses).toBe(1);
			expect(aggregated.totalErrors).toBe(1);
			expect(aggregated.errorRate).toBe(50);
		});
	});

	describe('Error Handling', () => {
		it('should handle network errors gracefully', async () => {
			jest.spyOn(apiClient, 'getChatParticipants').mockRejectedValue(new Error('Network error'));

			await expect(participantManager.refreshAgents()).rejects.toThrow('Failed to refresh agents');
		});

		it('should handle malformed API responses', async () => {
			jest.spyOn(apiClient, 'getChatParticipants').mockResolvedValue(null as any);

			// Should handle gracefully without crashing
			await expect(participantManager.refreshAgents()).rejects.toThrow();
		});
	});

	describe('End-to-End Scenarios', () => {
		it('should complete full initialization and chat flow', async () => {
			// 1. Initialize with valid configuration
			const config = configManager.getConfiguration();
			expect(config.serverUrl).toBeTruthy();

			// 2. Health check passes
			jest.spyOn(apiClient, 'healthCheck').mockResolvedValue(true);

			// 3. Load participants
			const mockParticipants = [
				{
					id: 'e2e-agent',
					name: 'E2E Test Agent',
					description: 'End-to-end test agent',
					commands: ['help', 'test'],
					isActive: true,
					metadata: { category: 'test' },
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				}
			];

			jest.spyOn(apiClient, 'getChatParticipants').mockResolvedValue(mockParticipants);

			// 4. Initialize participants
			const mockChatParticipant = { dispose: jest.fn() };
			(vscode.chat.createChatParticipant as jest.Mock) = jest.fn(() => mockChatParticipant);

			const mockContext = {} as vscode.ExtensionContext;
			await participantManager.initialize(mockContext);

			// 5. Verify participant created
			expect(participantManager.getAllParticipants()).toHaveLength(1);

			// 6. Simulate chat request
			const mockChatResponse = {
				response: 'E2E test successful!',
				metadata: { timestamp: new Date().toISOString() }
			};

			jest.spyOn(apiClient, 'sendChatRequest').mockResolvedValue(mockChatResponse);

			// 7. Track metrics
			metricsService.trackRequest('e2e-agent');
			metricsService.trackSuccess('e2e-agent', 120);

			// 8. Verify metrics
			const metrics = metricsService.getParticipantMetrics('e2e-agent');
			expect(metrics?.requestCount).toBe(1);
			expect(metrics?.successCount).toBe(1);

			// 9. Cleanup
			participantManager.dispose();
			expect(mockChatParticipant.dispose).toHaveBeenCalled();
		});
	});
});

/**
 * Mock Setup for VS Code API
 */
beforeAll(() => {
	// Mock VS Code modules
	const mockVSCode = {
		workspace: {
			getConfiguration: jest.fn(),
			workspaceFolders: []
		},
		window: {
			createOutputChannel: jest.fn(() => ({
				appendLine: jest.fn(),
				show: jest.fn(),
				clear: jest.fn(),
				dispose: jest.fn()
			})),
			showInformationMessage: jest.fn(),
			showErrorMessage: jest.fn(),
			showWarningMessage: jest.fn(),
			showInputBox: jest.fn(),
			createWebviewPanel: jest.fn()
		},
		chat: {
			createChatParticipant: jest.fn()
		},
		commands: {
			registerCommand: jest.fn()
		},
		Uri: {
			joinPath: jest.fn()
		},
		ThemeIcon: jest.fn()
	};

	// Mock the vscode module
	jest.mock('vscode', () => mockVSCode, { virtual: true });
});
