/**
 * AI models manager for The New Fuse - AI Bridge
 */
import { Logger } from './logger.js';
import { WebSocketManager } from './websocket-manager.js';
import { MessageType, MessageSource } from '../shared-protocol'; // Using shared protocol types

// Create an AI models-specific logger
const aiModelsLogger = new Logger({
  name: 'AIModels',
  level: 'info',
  saveToStorage: true
});

/**
 * AI model
 */
interface AIModel {
  id: string;
  name: string;
  provider: string;
  capabilities: string[];
  description?: string;
  contextLength?: number;
  available: boolean;
}

/**
 * AI query options
 */
interface AIQueryOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  systemPrompt?: string;
  onPartialResponse?: (response: string) => void;
}

/**
 * AI models manager
 */
export class AIModelsManager {
  private models: AIModel[];
  private wsManager: WebSocketManager;
  private logger: Logger;
  private defaultModel: string;
  private pendingQueries = new Map<string, any>();

  /**
   * Create a new AIModelsManager
   * @param wsManager - WebSocket manager
   */
  constructor(wsManager: WebSocketManager) {
    this.models = [];
    this.wsManager = wsManager;
    this.logger = aiModelsLogger;
    this.defaultModel = 'gpt-4';
    
    // Listen for WebSocket messages
    this.wsManager.addListener('message', this.handleMessage.bind(this));
    
    // Load models
    this.loadModels();
    
    // Request available models
    this.requestAvailableModels();
  }

  /**
   * Handle WebSocket message
   * @param data - Message data
   */
  private handleMessage(data: any): void {
    if (!data || typeof data !== 'object' || !data.type) {
      return;
    }

    switch (data.type) {
      case 'AI_MODELS':
        this.handleModelsResponse(data);
        break;
      case 'AI_RESPONSE':
        this.handleAIResponse(data);
        break;
      case 'AI_ERROR':
        this.handleAIError(data);
        break;
    }
  }

  /**
   * Handle models response
   * @param data - Message data
   */
  private handleModelsResponse(data: any): void {
    if (!data.models || !Array.isArray(data.models)) {
      this.logger.warn('Received invalid models response');
      return;
    }
    
    this.models = data.models;
    this.logger.info(`Received ${this.models.length} AI models`);
    
    // Save models to storage
    this.saveModels();
  }

  /**
   * Handle AI response
   * @param data - Message data
   */
  private handleAIResponse(data: any): void {
    const { queryId, result, isPartial } = data;
    
    if (!queryId) {
      this.logger.warn('Received AI response without query ID');
      return;
    }
    
    // Find the query in the pending queries
    const query = this.pendingQueries.get(queryId);
    
    if (!query) {
      this.logger.warn(`Received AI response for unknown query: ${queryId}`);
      return;
    }
    
    if (isPartial) {
      // Handle partial response
      if (query.onPartialResponse) {
        query.onPartialResponse(result);
      }
    } else {
      // Handle final response
      this.pendingQueries.delete(queryId);
      query.resolve(result);
    }
  }

  /**
   * Handle AI error
   * @param data - Message data
   */
  private handleAIError(data: any): void {
    const { queryId, error } = data;
    
    if (!queryId) {
      this.logger.warn('Received AI error without query ID');
      return;
    }
    
    // Find the query in the pending queries
    const query = this.pendingQueries.get(queryId);
    
    if (!query) {
      this.logger.warn(`Received AI error for unknown query: ${queryId}`);
      return;
    }
    
    // Handle error
    this.pendingQueries.delete(queryId);
    query.reject(new Error(error));
  }

  /**
   * Load models from storage
   */
  private async loadModels(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['aiModels', 'defaultAIModel']);
      if (result.aiModels) {
        this.models = result.aiModels;
        this.logger.info(`Loaded ${this.models.length} AI models`);
      }
      if (result.defaultAIModel) {
        this.defaultModel = result.defaultAIModel;
      }
    } catch (error) {
      this.logger.error('Error loading AI models', error);
    }
  }

  /**
   * Save models to storage
   */
  private async saveModels(): Promise<void> {
    try {
      await chrome.storage.local.set({ aiModels: this.models });
      this.logger.info(`Saved ${this.models.length} AI models`);
    } catch (error) {
      this.logger.error('Error saving AI models', error);
    }
  }

  /**
   * Request available models
   */
  private requestAvailableModels(): void {
    if (!this.wsManager.isConnected()) {
      this.logger.warn('Cannot request models: WebSocket not connected');
      return;
    }
    
    this.wsManager.send({
      type: 'AI_MODELS_REQUEST',
      timestamp: Date.now()
    });
  }

  /**
   * Get all models
   * @returns All models
   */
  getAllModels(): AIModel[] {
    return [...this.models];
  }

  /**
   * Get available models
   * @returns Available models
   */
  getAvailableModels(): AIModel[] {
    return this.models.filter(model => model.available);
  }

  /**
   * Get a model by ID
   * @param id - Model ID
   * @returns The model or null if not found
   */
  getModel(id: string): AIModel | null {
    return this.models.find(model => model.id === id) || null;
  }

  /**
   * Set the default model
   * @param modelId - Model ID
   * @returns True if successful, false if model not found
   */
  setDefaultModel(modelId: string): boolean {
    // Check if model exists
    const model = this.models.find(m => m.id === modelId);
    if (!model) return false;
    
    this.defaultModel = modelId;
    return true;
  }
  
  /**
   * Get the default model ID
   * @returns Default model ID
   */
  getDefaultModel(): string {
    return this.defaultModel;
  }
  
  /**
   * Query the AI model
   * @param prompt - Query prompt
   * @param options - Query options
   * @returns Query result
   */
  async query(prompt: string, options: AIQueryOptions = {}): Promise<any> { // Return type changed to any for simplicity, should be specific
    const queryId = `query-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    return new Promise((resolve, reject) => {
      if (!this.wsManager.isConnected()) {
        this.logger.warn('Cannot send AI query: WebSocket not connected');
        reject(new Error('WebSocket not connected'));
        return;
      }

      // Create query object and store in pending queries
      const queryContext = { // Renamed from queryObj to avoid confusion
        id: queryId,
        prompt,
        options,
        resolve,
        reject,
        onPartialResponse: options.onPartialResponse, // Store this if needed
        cancelled: false,
      };
      this.pendingQueries.set(queryId, queryContext);

      // Send the query request to the backend/VS Code
      const requestMessage: { id: string, source: any, timestamp: number, type: MessageType, payload: any } = { // Using inline type instead of BaseMessage
        id: queryId,
        source: MessageSource.CHROME_EXTENSION_POPUP, // Or appropriate source
        timestamp: Date.now(),
        type: MessageType.REQUEST, // Using available MessageType from shared-protocol
        payload: {
          prompt,
          model: options.model || this.defaultModel,
          temperature: options.temperature,
          maxTokens: options.maxTokens,
          stopSequences: options.stopSequences,
          systemPrompt: options.systemPrompt,
          stream: !!options.onPartialResponse, // Indicate if streaming is expected
        },
      };

      this.wsManager.send(requestMessage);
      this.logger.info(`Sent AI query: ${queryId}`);
    });
  }
  
  /**
   * Cancel a pending query
   * @param queryId - Query ID
   * @returns True if successful, false if query not found
   */
  cancelQuery(queryId: string): boolean {
    const query = this.pendingQueries.get(queryId);
    if (!query) return false;
    
    query.cancelled = true;
    this.pendingQueries.delete(queryId);
    return true;
  }
}
