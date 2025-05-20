/**
 * Tests for AIModelsManager
 */
import { AIModelsManager } from '../../utils/ai-models.js';
import { WebSocketManager } from '../../utils/websocket-manager.js';

// Mock WebSocketManager
jest.mock('../../utils/websocket-manager');

describe('AIModelsManager', () => {
  let aiModelsManager: AIModelsManager;
  let mockWsManager: jest.Mocked<WebSocketManager>;
  
  beforeEach(() => {
    // Create a mock WebSocketManager
    mockWsManager = new WebSocketManager('ws://localhost:3712') as jest.Mocked<WebSocketManager>;
    mockWsManager.isConnected = jest.fn().mockReturnValue(true);
    mockWsManager.send = jest.fn().mockReturnValue(true);
    mockWsManager.addListener = jest.fn();
    
    // Mock chrome.storage.local.get
    chrome.storage.local.get = jest.fn().mockImplementation((key, callback) => {
      callback({
        aiModels: [
          {
            id: 'gpt-4',
            name: 'GPT-4',
            provider: 'OpenAI',
            capabilities: ['text', 'code'],
            available: true
          },
          {
            id: 'claude-3',
            name: 'Claude 3',
            provider: 'Anthropic',
            capabilities: ['text', 'code', 'vision'],
            available: true
          }
        ],
        defaultAIModel: 'gpt-4'
      });
    });
    
    // Mock chrome.storage.local.set
    chrome.storage.local.set = jest.fn().mockImplementation((data, callback) => {
      if (callback) callback();
    });
    
    // Create AIModelsManager
    aiModelsManager = new AIModelsManager(mockWsManager);
  });
  
  test('should create an AIModelsManager instance', () => {
    expect(aiModelsManager).toBeInstanceOf(AIModelsManager);
  });
  
  test('should get all models', () => {
    const models = aiModelsManager.getAllModels();
    
    // Verify models
    expect(models).toHaveLength(2);
    expect(models[0].id).toBe('gpt-4');
    expect(models[1].id).toBe('claude-3');
  });
  
  test('should get available models', () => {
    const models = aiModelsManager.getAvailableModels();
    
    // Verify models
    expect(models).toHaveLength(2);
    expect(models[0].id).toBe('gpt-4');
    expect(models[1].id).toBe('claude-3');
  });
  
  test('should get model by ID', () => {
    const model = aiModelsManager.getModel('gpt-4');
    
    // Verify model
    expect(model).not.toBeNull();
    expect(model?.id).toBe('gpt-4');
    expect(model?.name).toBe('GPT-4');
    expect(model?.provider).toBe('OpenAI');
    
    // Test non-existent model
    const nonExistentModel = aiModelsManager.getModel('non-existent');
    expect(nonExistentModel).toBeNull();
  });
  
  test('should set default model', () => {
    const result = aiModelsManager.setDefaultModel('claude-3');
    
    // Verify result
    expect(result).toBe(true);
    
    // Verify storage was updated
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      { defaultAIModel: 'claude-3' },
      expect.any(Function)
    );
    
    // Verify default model was updated
    expect(aiModelsManager.getDefaultModel()).toBe('claude-3');
  });
  
  test('should handle AI query', async () => {
    // Mock message handler
    const messageHandler = mockWsManager.addListener.mock.calls.find(
      call => call[0] === 'message'
    )?.[1];
    
    expect(messageHandler).toBeDefined();
    
    // Create a mock query promise
    let resolveQuery: (value: string) => void;
    let rejectQuery: (reason: Error) => void;
    
    const queryPromise = new Promise<string>((resolve, reject) => {
      resolveQuery = resolve;
      rejectQuery = reject;
    });
    
    // Mock pendingQueries
    // @ts-ignore - Access private property for testing
    aiModelsManager.pendingQueries.set('test-query-id', {
      resolve: resolveQuery!,
      reject: rejectQuery!,
      onPartialResponse: jest.fn()
    });
    
    // Send query
    const queryPromise2 = aiModelsManager.query('What is the meaning of life?', {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 100
    });
    
    // Verify query was sent
    expect(mockWsManager.send).toHaveBeenCalledWith({
      type: 'AI_QUERY',
      queryId: expect.any(String),
      query: 'What is the meaning of life?',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 100,
      timestamp: expect.any(Number)
    });
    
    // Simulate AI response
    if (messageHandler) {
      messageHandler({
        type: 'AI_RESPONSE',
        queryId: 'test-query-id',
        result: 'The meaning of life is 42.',
        isPartial: false
      });
    }
    
    // Wait for query to resolve
    const result = await queryPromise;
    
    // Verify result
    expect(result).toBe('The meaning of life is 42.');
    
    // Test query cancellation
    const cancelled = aiModelsManager.cancelQuery('test-query-id');
    
    // Verify cancellation
    expect(cancelled).toBe(false); // Already resolved
    
    // Get a new query ID from the second query
    const queryId = mockWsManager.send.mock.calls[0][0].queryId;
    
    // Cancel the second query
    const cancelled2 = aiModelsManager.cancelQuery(queryId);
    
    // Verify cancellation
    expect(cancelled2).toBe(true);
    expect(mockWsManager.send).toHaveBeenCalledWith({
      type: 'AI_QUERY_CANCEL',
      queryId,
      timestamp: expect.any(Number)
    });
  });
  
  test('should handle AI error', async () => {
    // Mock message handler
    const messageHandler = mockWsManager.addListener.mock.calls.find(
      call => call[0] === 'message'
    )?.[1];
    
    expect(messageHandler).toBeDefined();
    
    // Create a mock query promise
    let resolveQuery: (value: string) => void;
    let rejectQuery: (reason: Error) => void;
    
    const queryPromise = new Promise<string>((resolve, reject) => {
      resolveQuery = resolve;
      rejectQuery = reject;
    });
    
    // Mock pendingQueries
    // @ts-ignore - Access private property for testing
    aiModelsManager.pendingQueries.set('test-query-id', {
      resolve: resolveQuery!,
      reject: rejectQuery!
    });
    
    // Simulate AI error
    if (messageHandler) {
      messageHandler({
        type: 'AI_ERROR',
        queryId: 'test-query-id',
        error: 'Model overloaded'
      });
    }
    
    // Wait for query to reject
    try {
      await queryPromise;
      fail('Query should have been rejected');
    } catch (error) {
      // Verify error
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Model overloaded');
    }
  });
  
  test('should handle partial responses', () => {
    // Mock message handler
    const messageHandler = mockWsManager.addListener.mock.calls.find(
      call => call[0] === 'message'
    )?.[1];
    
    expect(messageHandler).toBeDefined();
    
    // Create a mock partial response handler
    const onPartialResponse = jest.fn();
    
    // Mock pendingQueries
    // @ts-ignore - Access private property for testing
    aiModelsManager.pendingQueries.set('test-query-id', {
      resolve: jest.fn(),
      reject: jest.fn(),
      onPartialResponse
    });
    
    // Simulate partial AI response
    if (messageHandler) {
      messageHandler({
        type: 'AI_RESPONSE',
        queryId: 'test-query-id',
        result: 'The meaning',
        isPartial: true
      });
    }
    
    // Verify partial response handler was called
    expect(onPartialResponse).toHaveBeenCalledWith('The meaning');
  });
});
