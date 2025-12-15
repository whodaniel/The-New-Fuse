/**
 * TNF Chrome Extension - State Manager
 * Centralized state management with reactive updates
 */

import { LIMITS } from '../config/constants.js';
import { handleError } from './ErrorHandler.js';

class StateManager {
  constructor() {
    this.state = this.getInitialState();
    this.subscribers = new Map();
    this.middleware = [];
    this.history = [];
    this.maxHistorySize = 50;
  }

  /**
   * Get initial state structure
   */
  getInitialState() {
    return {
      // UI State
      ui: {
        isVisible: false,
        isMinimized: false,
        isDragging: false,
        activeTab: 'chat',
        dragOffset: { x: 0, y: 0 },
        performanceMode: 'balanced'
      },

      // Conversation State
      conversations: {
        history: [],
        activeConversation: null,
        currentAI: this.detectCurrentAI(),
        processedResponses: new Set()
      },

      // TNF Integration State
      tnf: {
        relayConnected: false,
        agentRegistered: false,
        mcpConfigLoaded: false,
        databaseConnected: false,
        agentId: `tnf-chrome-extension-${Date.now()}`,
        config: null
      },

      // Server Status
      server: {
        isRunning: false,
        port: 0,
        connectedClients: 0,
        message: 'Initializing...'
      },

      // Port Monitoring
      ports: {
        statuses: {},
        monitored: [3000, 3001, 3002, 8765]
      },

      // Performance Metrics
      performance: {
        injectionLatency: 0,
        responseLatency: 0,
        successRate: 100,
        totalOperations: 0,
        memoryUsage: null
      },

      // Analytics
      analytics: {
        averageScore: 0,
        totalResponses: 0,
        qualityDistribution: { high: 0, medium: 0, low: 0 },
        responseHistory: []
      },

      // Agent Groups
      agentGroups: {
        'a': { name: 'Group A', color: '#ff6b6b', agents: [] },
        'b': { name: 'Group B', color: '#4ecdc4', agents: [] },
        'c': { name: 'Group C', color: '#45b7d1', agents: [] },
        'd': { name: 'Group D', color: '#f9ca24', agents: [] },
        'e': { name: 'Group E', color: '#6c5ce7', agents: [] }
      },

      // Master Agent
      masterAgent: null,

      // Error State
      errors: {
        lastError: null,
        errorCount: 0,
        suppressedErrors: new Set()
      }
    };
  }

  /**
   * Update state with new data
   * @param {Object} updates - State updates
   * @param {string} actionType - Type of action causing update
   */
  setState(updates, actionType = 'SET_STATE') {
    try {
      const prevState = this.cloneState(this.state);
      
      // Apply middleware
      const processedUpdates = this.applyMiddleware(updates, actionType, prevState);
      
      // Merge updates into current state
      this.state = this.deepMerge(this.state, processedUpdates);
      
      // Validate state constraints
      this.validateState();
      
      // Store in history
      this.storeStateHistory(prevState, this.state, actionType);
      
      // Notify subscribers
      this.notifySubscribers(this.state, prevState, actionType);
      
    } catch (error) {
      handleError(error, { component: 'StateManager', action: actionType });
    }
  }

  /**
   * Get current state or specific state slice
   * @param {string} path - Dot notation path to state slice
   */
  getState(path = null) {
    if (!path) return this.cloneState(this.state);
    
    return this.getNestedValue(this.state, path);
  }

  /**
   * Subscribe to state changes
   * @param {Function} callback - Callback function
   * @param {string|Array} paths - Specific paths to watch
   */
  subscribe(callback, paths = null) {
    const id = Date.now() + Math.random();
    this.subscribers.set(id, { callback, paths });
    
    // Return unsubscribe function
    return () => this.subscribers.delete(id);
  }

  /**
   * Add middleware for state updates
   * @param {Function} middleware - Middleware function
   */
  addMiddleware(middleware) {
    this.middleware.push(middleware);
  }

  /**
   * Apply middleware to state updates
   */
  applyMiddleware(updates, actionType, prevState) {
    return this.middleware.reduce((processedUpdates, middleware) => {
      return middleware(processedUpdates, actionType, prevState, this.state);
    }, updates);
  }

  /**
   * Deep merge objects
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Clone state to prevent mutations
   */
  cloneState(state) {
    return JSON.parse(JSON.stringify(state, (key, value) => {
      // Handle Set objects
      if (value instanceof Set) {
        return Array.from(value);
      }
      return value;
    }));
  }

  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Validate state constraints
   */
  validateState() {
    // Limit conversation history size
    if (this.state.conversations.history.length > LIMITS.MAX_CONVERSATION_HISTORY) {
      this.state.conversations.history = this.state.conversations.history.slice(-LIMITS.MAX_CONVERSATION_HISTORY);
    }

    // Limit analytics history size
    if (this.state.analytics.responseHistory.length > LIMITS.MAX_ANALYTICS_ENTRIES) {
      this.state.analytics.responseHistory = this.state.analytics.responseHistory.slice(-LIMITS.MAX_ANALYTICS_ENTRIES);
    }

    // Ensure performance metrics are within valid ranges
    this.state.performance.successRate = Math.max(0, Math.min(100, this.state.performance.successRate));
  }

  /**
   * Store state history for debugging
   */
  storeStateHistory(prevState, newState, actionType) {
    this.history.push({
      timestamp: new Date().toISOString(),
      actionType,
      prevState: this.cloneState(prevState),
      newState: this.cloneState(newState)
    });

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
  }

  /**
   * Notify subscribers of state changes
   */
  notifySubscribers(newState, prevState, actionType) {
    this.subscribers.forEach(({ callback, paths }) => {
      try {
        // If specific paths are watched, check if they changed
        if (paths) {
          const pathsArray = Array.isArray(paths) ? paths : [paths];
          const hasChanges = pathsArray.some(path => {
            const prevValue = this.getNestedValue(prevState, path);
            const newValue = this.getNestedValue(newState, path);
            return JSON.stringify(prevValue) !== JSON.stringify(newValue);
          });
          
          if (hasChanges) {
            callback(newState, prevState, actionType);
          }
        } else {
          // No specific paths, always notify
          callback(newState, prevState, actionType);
        }
      } catch (error) {
        handleError(error, { component: 'StateManager', method: 'notifySubscribers' });
      }
    });
  }

  /**
   * Detect current AI platform
   */
  detectCurrentAI() {
    const hostname = window.location?.hostname || '';
    if (hostname.includes('chatgpt.com')) return 'chatgpt';
    if (hostname.includes('claude.ai')) return 'claude';
    if (hostname.includes('gemini.google.com')) return 'gemini';
    if (hostname.includes('perplexity.ai')) return 'perplexity';
    if (hostname.includes('poe.com')) return 'poe';
    if (hostname.includes('character.ai')) return 'character';
    return 'unknown';
  }

  /**
   * Add conversation message
   */
  addConversationMessage(message) {
    const conversations = { ...this.state.conversations };
    conversations.history.push({
      id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: message.timestamp || new Date().toISOString(),
      source: message.source || 'unknown',
      content: message.content,
      type: message.type || 'MESSAGE',
      conversationId: message.conversationId
    });

    this.setState({ conversations }, 'ADD_CONVERSATION_MESSAGE');
  }

  /**
   * Update TNF status
   */
  updateTNFStatus(status) {
    this.setState({
      tnf: { ...this.state.tnf, ...status }
    }, 'UPDATE_TNF_STATUS');
  }

  /**
   * Update server status
   */
  updateServerStatus(status) {
    this.setState({
      server: { ...this.state.server, ...status }
    }, 'UPDATE_SERVER_STATUS');
  }

  /**
   * Update port statuses
   */
  updatePortStatuses(statuses) {
    this.setState({
      ports: { ...this.state.ports, statuses }
    }, 'UPDATE_PORT_STATUSES');
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(metrics) {
    this.setState({
      performance: { ...this.state.performance, ...metrics }
    }, 'UPDATE_PERFORMANCE_METRICS');
  }

  /**
   * Update analytics data
   */
  updateAnalytics(analytics) {
    this.setState({
      analytics: { ...this.state.analytics, ...analytics }
    }, 'UPDATE_ANALYTICS');
  }

  /**
   * Set UI state
   */
  setUIState(uiUpdates) {
    this.setState({
      ui: { ...this.state.ui, ...uiUpdates }
    }, 'SET_UI_STATE');
  }

  /**
   * Clear conversation history
   */
  clearConversationHistory() {
    this.setState({
      conversations: {
        ...this.state.conversations,
        history: [],
        processedResponses: new Set()
      }
    }, 'CLEAR_CONVERSATION_HISTORY');
  }

  /**
   * Get state statistics
   */
  getStatistics() {
    return {
      conversationCount: this.state.conversations.history.length,
      totalOperations: this.state.performance.totalOperations,
      successRate: this.state.performance.successRate,
      averageScore: this.state.analytics.averageScore,
      memoryUsage: this.state.performance.memoryUsage,
      subscriberCount: this.subscribers.size,
      historySize: this.history.length
    };
  }

  /**
   * Export state for debugging
   */
  exportState() {
    return {
      state: this.cloneState(this.state),
      history: this.history.slice(-10), // Last 10 state changes
      statistics: this.getStatistics()
    };
  }

  /**
   * Reset state to initial values
   */
  resetState() {
    this.state = this.getInitialState();
    this.history = [];
    this.notifySubscribers(this.state, {}, 'RESET_STATE');
  }

  /**
   * Singleton pattern
   */
  static getInstance() {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }
}

// Create default export and convenience methods
const stateManager = StateManager.getInstance();

export const getState = (path) => stateManager.getState(path);
export const setState = (updates, actionType) => stateManager.setState(updates, actionType);
export const subscribe = (callback, paths) => stateManager.subscribe(callback, paths);
export const addMiddleware = (middleware) => stateManager.addMiddleware(middleware);

// Specific action creators
export const addConversationMessage = (message) => stateManager.addConversationMessage(message);
export const updateTNFStatus = (status) => stateManager.updateTNFStatus(status);
export const updateServerStatus = (status) => stateManager.updateServerStatus(status);
export const updatePortStatuses = (statuses) => stateManager.updatePortStatuses(statuses);
export const updatePerformanceMetrics = (metrics) => stateManager.updatePerformanceMetrics(metrics);
export const updateAnalytics = (analytics) => stateManager.updateAnalytics(analytics);
export const setUIState = (uiUpdates) => stateManager.setUIState(uiUpdates);
export const clearConversationHistory = () => stateManager.clearConversationHistory();

export default StateManager;
