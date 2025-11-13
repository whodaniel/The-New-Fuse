import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { CommandBus } from '@the-new-fuse/commands-core';
import { TestCommand, createMockCommandContext } from '../../commands-core/src/__tests__/fixtures.spec';
// Mock DOM APIs
const mockFetch = jest.fn();
const mockWebSocket = jest.fn();
const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
Object.defineProperty(window, 'fetch', { value: mockFetch });
Object.defineProperty(window, 'WebSocket', { value: mockWebSocket });
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
describe('Web Platform Adapter Integration', () => {
    let commandBus;
    let mockContext;
    beforeEach(() => {
        commandBus = new CommandBus();
        mockContext = createMockCommandContext();
        jest.clearAllMocks();
        // Reset mocks
        mockFetch.mockReset();
        mockWebSocket.mockReset();
        Object.values(mockLocalStorage).forEach(mock => mock.mockReset());
    });
    afterEach(() => {
        commandBus.clear();
    });
    describe('HTTP API Command Execution', () => {
        it('should execute commands via REST API endpoints', async () => {
            class WebAPIAdapter {
                commandBus;
                baseUrl;
                constructor(commandBus, baseUrl = '/api/commands') {
                    this.commandBus = commandBus;
                    this.baseUrl = baseUrl;
                }
                async executeViaAPI(commandType, data) {
                    const command = new TestCommand(data.input);
                    command.type = commandType;
                    // Simulate API call
                    mockFetch.mockResolvedValueOnce({
                        ok: true,
                        json: async () => ({
                            success: true,
                            data: { processed: data.input },
                            executionTime: 25
                        })
                    });
                    const response = await fetch(`${this.baseUrl}/execute, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ commandType, data })
          });

          if (!response.ok) {
            throw new Error('API call failed');
          }

          return await response.json();
        }

        async executeLocally(commandType: string, data: any): Promise<any> {
          const command = new TestCommand(data.input);
          (command as any).type = commandType;

          return await this.commandBus.execute(command);
        }
      }

      const adapter = new WebAPIAdapter(commandBus);

      commandBus.register('WebAPICommand', {
        handle: async (command: any) => ({
          success: true,
          data: { webProcessed: true, input: command.data.input },
          metadata: {
            executionTime: 15,
            completedAt: new Date(),
            eventCount: 0
          },
          events: []
        }),
        canHandle: (command: any) => command.type === 'WebAPICommand',
        getMetadata: () => ({
          name: 'WebAPIHandler',
          commandTypes: ['WebAPICommand'],
          version: '1.0.0'
        })
      });

      // Test local execution
      const localResult = await adapter.executeLocally('WebAPICommand', { input: 'local-data' });
      expect(localResult.success).toBe(true);
      expect(localResult.data.webProcessed).toBe(true);

      // Test API execution
      const apiResult = await adapter.executeViaAPI('WebAPICommand', { input: 'api-data' });
      expect(apiResult.success).toBe(true);
      expect(apiResult.data.processed).toBe('api-data');
      expect(mockFetch).toHaveBeenCalledWith('/api/commands/execute', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json'));
    });

    it('should handle API errors gracefully', async () => {
      class ErrorHandlingWebAdapter {
        private commandBus: CommandBus;

        constructor(commandBus: CommandBus) {
          this.commandBus = commandBus;
        }

        async executeWithErrorHandling(commandType: string, data: any): Promise<any> {
          try {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const response = await fetch('/api/commands/execute', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ commandType, data })
            });

            return await response.json();
          } catch (error) {
            // Fallback to local execution
            const command = new TestCommand(data.input);
            (command as any).type = commandType;

            return await this.commandBus.execute(command);
          }
        }
      }

      const adapter = new ErrorHandlingWebAdapter(commandBus);

      commandBus.register('ResilientCommand', {
        handle: async (command: any) => ({
          success: true,
          data: { fallback: true, input: command.data.input },
          metadata: {
            executionTime: 10,
            completedAt: new Date(),
            eventCount: 0
          },
          events: []
        }),
        canHandle: (command: any) => command.type === 'ResilientCommand',
        getMetadata: () => ({
          name: 'ResilientHandler',
          commandTypes: ['ResilientCommand'],
          version: '1.0.0'
        })
      });

      const result = await adapter.executeWithErrorHandling('ResilientCommand', { input: 'test-data' });

      expect(result.success).toBe(true);
      expect(result.data.fallback).toBe(true);
      expect(result.data.input).toBe('test-data');
    });
  });

  describe('WebSocket Real-time Command Execution', () => {
    it('should execute commands via WebSocket connection', async () => {
      class WebSocketAdapter {
        private commandBus: CommandBus;
        private ws: any;

        constructor(commandBus: CommandBus) {
          this.commandBus = commandBus;
          this.ws = null;
        }

        connect(url = 'ws://localhost:8080/commands'): Promise<void> {
          return new Promise((resolve) => {
            this.ws = new WebSocket(url);
            mockWebSocket.mockImplementation(() => this.ws);

            this.ws.onopen = () => resolve();
            this.ws.onmessage = (event: any) => {
              const message = JSON.parse(event.data);
              this.handleWebSocketMessage(message);
            };
          });
        }

        async executeViaWebSocket(commandType: string, data: any): Promise<any> {
          if (!this.ws) {
            throw new Error('WebSocket not connected');
          }

          return new Promise((resolve, reject) => {
            const messageId = Math.random().toString(36);

            const handler = (event: any) => {
              const response = JSON.parse(event.data);
              if (response.id === messageId) {
                this.ws.removeEventListener('message', handler);
                resolve(response.result);
              }
            };

            this.ws.addEventListener('message', handler);

            this.ws.send(JSON.stringify({
              id: messageId,
              type: 'executeCommand',
              commandType,
              data
            }));

            // Timeout after 5 seconds
            setTimeout(() => {
              this.ws.removeEventListener('message', handler);
              reject(new Error('WebSocket command timeout'));
            }, 5000);
          });
        }

        private async handleWebSocketMessage(message: any): Promise<void> {
          if (message.type === 'executeCommand') {
            const command = new TestCommand(message.data.input);
            (command as any).type = message.commandType;

            const result = await this.commandBus.execute(command);

            // Send result back
            if (this.ws) {
              this.ws.send(JSON.stringify({
                id: message.id,
                type: 'commandResult',
                result
              }));
            }
          }
        }
      }

      const adapter = new WebSocketAdapter(commandBus);

      commandBus.register('WebSocketCommand', {
        handle: async (command: any) => ({
          success: true,
          data: { wsProcessed: true, input: command.data.input },
          metadata: {
            executionTime: 20,
            completedAt: new Date(),
            eventCount: 0
          },
          events: []
        }),
        canHandle: (command: any) => command.type === 'WebSocketCommand',
        getMetadata: () => ({
          name: 'WebSocketHandler',
          commandTypes: ['WebSocketCommand'],
          version: '1.0.0'
        })
      });

      // Mock WebSocket connection
      const mockWS = {
        send: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        onopen: null,
        onmessage: null
      };

      mockWebSocket.mockReturnValue(mockWS);

      // Simulate connection
      await adapter.connect();
      expect(mockWS.onopen).toBeDefined();

      // Simulate message handling
      const mockMessage = {
        type: 'executeCommand',
        id: 'test-123',
        commandType: 'WebSocketCommand',
        data: { input: 'ws-data';

      // Trigger message handler
      mockWS.onmessage({ data: JSON.stringify(mockMessage) });

      // Should have sent result back
      expect(mockWS.send).toHaveBeenCalledWith(expect.stringContaining('commandResult'));
    });
  });

  describe('Browser Storage Integration', () => {
    it('should persist command results in localStorage', async () => {
      class StorageAwareAdapter {
        private commandBus: CommandBus;
        private storageKey: string;

        constructor(commandBus: CommandBus, storageKey = 'commandResults') {
          this.commandBus = commandBus;
          this.storageKey = storageKey;
        }

        async executeAndStore(commandType: string, data: any): Promise<any> {
          const command = new TestCommand(data.input);
          (command as any).type = commandType;

          const result = await this.commandBus.execute(command);

          // Store result in localStorage
          const storedResults = this.getStoredResults();
          storedResults.push({
            id: Math.random().toString(36),
            commandType,
            data,
            result,
            timestamp: new Date()
          });

          localStorage.setItem(this.storageKey, JSON.stringify(storedResults));

          return result;
        }

        getStoredResults(): any[] {
          const stored = localStorage.getItem(this.storageKey);
          return stored ? JSON.parse(stored) : [];
        }

        clearStoredResults(): void {
          localStorage.removeItem(this.storageKey);
        }
      }

      const adapter = new StorageAwareAdapter(commandBus, 'testResults');

      commandBus.register('StorageCommand', {
        handle: async (command: any) => ({
          success: true,
          data: { stored: true, input: command.data.input },
          metadata: {
            executionTime: 12,
            completedAt: new Date(),
            eventCount: 0
          },
          events: []
        }),
        canHandle: (command: any) => command.type === 'StorageCommand',
        getMetadata: () => ({
          name: 'StorageHandler',
          commandTypes: ['StorageCommand'],
          version: '1.0.0'
        })
      });

      // Mock localStorage
      let storageData: { [key: string]: string } = {};
      mockLocalStorage.getItem.mockImplementation((key: string) => storageData[key] || null);
      mockLocalStorage.setItem.mockImplementation((key: string, value: string) => {
        storageData[key] = value;
      });
      mockLocalStorage.removeItem.mockImplementation((key: string) => {
        delete storageData[key];
      });

      // Execute and store
      const result = await adapter.executeAndStore('StorageCommand', { input: 'storage-data' });

      expect(result.success).toBe(true);
      expect(result.data.stored).toBe(true);

      // Check storage
      const stored = adapter.getStoredResults();
      expect(stored).toHaveLength(1);
      expect(stored[0].commandType).toBe('StorageCommand');
      expect(stored[0].result.success).toBe(true);

      // Clear storage
      adapter.clearStoredResults();
      expect(adapter.getStoredResults()).toHaveLength(0);
    });

    it('should handle localStorage quota exceeded', async () => {
      class QuotaAwareAdapter {
        private commandBus: CommandBus;

        constructor(commandBus: CommandBus) {
          this.commandBus = commandBus;
        }

        async executeWithQuotaHandling(commandType: string, data: any): Promise<any> {
          const command = new TestCommand(data.input);
          (command as any).type = commandType;

          const result = await this.commandBus.execute(command);

          try {
            // Try to store result`, localStorage.setItem(`result-${Date.now()}`, JSON.stringify(result)));
                }
                catch(error) {
                    // Handle quota exceeded
                    console.warn('localStorage quota exceeded, result not stored');
                    result.metadata.storageQuotaExceeded = true;
                }
            }
            return result;
        });
    });
    const adapter = new QuotaAwareAdapter(commandBus);
    commandBus.register('QuotaCommand', {
        handle: async (command) => ({
            success: true,
            data: { processed: command.data.input },
            metadata: {
                executionTime: 8,
                completedAt: new Date(),
                eventCount: 0
            },
            events: []
        }),
        canHandle: (command) => command.type === 'QuotaCommand',
        getMetadata: () => ({
            name: 'QuotaHandler',
            commandTypes: ['QuotaCommand'],
            version: '1.0.0'
        })
    });
    // Mock quota exceeded error
    mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
    });
    const result = await adapter.executeWithQuotaHandling('QuotaCommand', { input: 'quota-test' });
    expect(result.success).toBe(true);
    expect(result.metadata.storageQuotaExceeded).toBe(true);
});
;
describe('React Component Integration', () => {
    it('should integrate with React components for command execution', async () => {
        // Mock React hooks
        const mockUseState = jest.fn();
        const mockUseEffect = jest.fn();
        const mockUseCallback = jest.fn();
        class ReactCommandAdapter {
            commandBus;
            constructor(commandBus) {
                this.commandBus = commandBus;
            }
            // Simulate React hook for command execution
            useCommandExecution(commandType) {
                const [result, setResult] = mockUseState(null);
                const [loading, setLoading] = mockUseState(false);
                const [error, setError] = mockUseState(null);
                const execute = mockUseCallback(async (data) => {
                    setLoading(true);
                    setError(null);
                    try {
                        const command = new TestCommand(data.input);
                        command.type = commandType;
                        const executionResult = await this.commandBus.execute(command);
                        setResult(executionResult);
                    }
                    catch (err) {
                        setError(err);
                    }
                    finally {
                        setLoading(false);
                    }
                }, [commandType]);
                return { result, loading, error, execute };
            }
            // Simulate command form component
            createCommandForm(commandType) {
                return {
                    submit: async (formData) => {
                        const command = new TestCommand(formData.input);
                        command.type = commandType;
                        return await this.commandBus.execute(command);
                    },
                    validate: (formData) => {
                        return formData.input && formData.input.trim() !== '';
                    }
                };
            }
        }
        const adapter = new ReactCommandAdapter(commandBus);
        commandBus.register('ReactCommand', {
            handle: async (command) => ({
                success: true,
                data: { reactProcessed: true, input: command.data.input },
                metadata: {
                    executionTime: 18,
                    completedAt: new Date(),
                    eventCount: 0
                },
                events: []
            }),
            canHandle: (command) => command.type === 'ReactCommand',
            getMetadata: () => ({
                name: 'ReactHandler',
                commandTypes: ['ReactCommand'],
                version: '1.0.0'
            })
        });
        // Test hook integration
        const hook = adapter.useCommandExecution('ReactCommand');
        // Simulate calling execute
        await hook.execute({ input: 'react-data' });
        expect(mockUseState).toHaveBeenCalled();
        expect(mockUseCallback).toHaveBeenCalled();
        // Test form integration
        const form = adapter.createCommandForm('ReactCommand');
        expect(form.validate({ input: 'valid' })).toBe(true);
        expect(form.validate({ input: '' })).toBe(false);
        const formResult = await form.submit({ input: 'form-data' });
        expect(formResult.success).toBe(true);
        expect(formResult.data.reactProcessed).toBe(true);
    });
});
describe('Service Worker Command Proxy', () => {
    it('should proxy commands through service worker', async () => {
        class ServiceWorkerAdapter {
            commandBus;
            swRegistration;
            constructor(commandBus) {
                this.commandBus = commandBus;
                this.swRegistration = null;
            }
            async registerServiceWorker(scriptUrl) {
                // Mock service worker registration
                this.swRegistration = {
                    active: {
                        postMessage: jest.fn()
                    }
                };
            }
            async executeViaServiceWorker(commandType, data) {
                if (!this.swRegistration) {
                    // Fallback to direct execution
                    const command = new TestCommand(data.input);
                    command.type = commandType;
                    return await this.commandBus.execute(command);
                }
                return new Promise((resolve, reject) => {
                    const messageId = Math.random().toString(36);
                    const handler = (event) => {
                        if (event.data.id === messageId) {
                            navigator.serviceWorker.removeEventListener('message', handler);
                            resolve(event.data.result);
                        }
                    };
                    navigator.serviceWorker.addEventListener('message', handler);
                    this.swRegistration.active.postMessage({
                        id: messageId,
                        type: 'executeCommand',
                        commandType,
                        data
                    });
                    // Timeout
                    setTimeout(() => {
                        navigator.serviceWorker.removeEventListener('message', handler);
                        reject(new Error('Service worker timeout'));
                    }, 3000);
                });
            }
        }
        const adapter = new ServiceWorkerAdapter(commandBus);
        commandBus.register('SWCommand', {
            handle: async (command) => ({
                success: true,
                data: { swProcessed: true, input: command.data.input },
                metadata: {
                    executionTime: 22,
                    completedAt: new Date(),
                    eventCount: 0
                },
                events: []
            }),
            canHandle: (command) => command.type === 'SWCommand',
            getMetadata: () => ({
                name: 'SWHandler',
                commandTypes: ['SWCommand'],
                version: '1.0.0'
            })
        });
        // Test without service worker (fallback)
        const fallbackResult = await adapter.executeViaServiceWorker('SWCommand', { input: 'fallback-data' });
        expect(fallbackResult.success).toBe(true);
        expect(fallbackResult.data.swProcessed).toBe(true);
        // Register service worker
        await adapter.registerServiceWorker('/sw.js');
        expect(adapter['swRegistration']).toBeDefined();
    });
});
describe('Browser Event Integration', () => {
    it('should handle browser events as command triggers', async () => {
        class EventDrivenAdapter {
            commandBus;
            eventListeners = {};
            constructor(commandBus) {
                this.commandBus = commandBus;
            }
            registerEventCommand(eventType, commandType, eventToDataMapper) {
                const handler = async (event) => {
                    const data = eventToDataMapper(event);
                    const command = new TestCommand(data.input);
                    command.type = commandType;
                    try {
                        await this.commandBus.execute(command);
                    }
                    catch (error) {
                        console.error(Command, execution, failed);
                        for (event; $; { eventType })
                            : `, error);
            }
          };

          this.eventListeners[eventType] = handler;
          window.addEventListener(eventType, handler);
        }

        unregisterEventCommand(eventType: string): void {
          if (this.eventListeners[eventType]) {
            window.removeEventListener(eventType, this.eventListeners[eventType]);
            delete this.eventListeners[eventType];
          }
        }

        simulateEvent(eventType: string, eventData: any): void {
          const event = new CustomEvent(eventType, { detail: eventData });
          window.dispatchEvent(event);
        }
      }

      const adapter = new EventDrivenAdapter(commandBus);

      commandBus.register('EventCommand', {
        handle: async (command: any) => ({
          success: true,
          data: { eventProcessed: true, input: command.data.input },
          metadata: {
            executionTime: 5,
            completedAt: new Date(),
            eventCount: 0
          },
          events: []
        }),
        canHandle: (command: any) => command.type === 'EventCommand',
        getMetadata: () => ({
          name: 'EventHandler',
          commandTypes: ['EventCommand'],
          version: '1.0.0'
        })
      });

      // Register event command
      adapter.registerEventCommand('customCommand', 'EventCommand', (event) => ({
        input: event.detail.input
      }));

      // Simulate event
      adapter.simulateEvent('customCommand', { input: 'event-data' });

      // Cleanup
      adapter.unregisterEventCommand('customCommand');
      expect(adapter['eventListeners']['customCommand']).toBeUndefined();
    });
  });
});;
                    }
                };
            }
        }
    });
});
//# sourceMappingURL=web-adapter.spec.js.map