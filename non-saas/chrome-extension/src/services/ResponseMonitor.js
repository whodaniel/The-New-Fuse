/**
 * TNF Chrome Extension - Response Monitor Service
 * Dedicated service for monitoring and extracting AI responses
 */

import { 
  AI_PLATFORMS, 
  SELECTORS, 
  TIMEOUTS, 
  POLLING_INTERVALS, 
  QUALITY_THRESHOLDS,
  PERFORMANCE_CONFIG,
  ERROR_TYPES 
} from '../config/constants.js';
import { handleError, withErrorBoundary } from '../utils/ErrorHandler.js';
import { getState, setState } from '../utils/StateManager.js';

class ResponseMonitor {
  constructor(aiType, options = {}) {
    this.aiType = aiType;
    this.options = {
      pollInterval: POLLING_INTERVALS.RESPONSE_SCAN,
      maxPolls: 20,
      confidenceThreshold: QUALITY_THRESHOLDS.MEDIUM,
      enableAdvancedMonitoring: true,
      ...options
    };
    
    this.isActive = false;
    this.conversationId = null;
    this.startTime = null;
    this.pollCount = 0;
    this.processedResponses = new Set();
    this.responseScores = new Map();
    
    // Monitoring resources
    this.mutationObserver = null;
    this.pollInterval = null;
    this.timeoutHandle = null;
    this.performanceObserver = null;
    
    // Bind methods
    this.handleMutation = this.handleMutation.bind(this);
    this.scanForResponses = this.scanForResponses.bind(this);
    this.cleanup = this.cleanup.bind(this);
  }

  /**
   * Start monitoring for responses
   * @param {string} conversationId - Unique conversation identifier
   */
  async startMonitoring(conversationId) {
    if (this.isActive) {
      console.warn(`⚠️ Monitor already active for ${this.aiType}`);
      return;
    }

    this.conversationId = conversationId;
    this.isActive = true;
    this.startTime = Date.now();
    this.pollCount = 0;
    this.processedResponses.clear();
    this.responseScores.clear();

    console.log(`👁️ Starting ${this.aiType} response monitoring for conversation: ${conversationId}`);

    try {
      // Apply performance mode settings
      this.applyPerformanceMode();
      
      // Set up monitoring systems
      await this.setupMutationObserver();
      this.setupPolling();
      this.setupPerformanceObserver();
      this.setupTimeout();
      
      // Initial scan
      this.scanForResponses();
      
    } catch (error) {
      handleError(error, { 
        component: 'ResponseMonitor', 
        method: 'startMonitoring',
        aiType: this.aiType,
        conversationId 
      });
      this.stopMonitoring();
    }
  }

  /**
   * Stop monitoring and cleanup resources
   */
  stopMonitoring() {
    if (!this.isActive) return;

    console.log(`🛑 Stopping ${this.aiType} response monitoring`);
    
    this.isActive = false;
    this.cleanup();
    
    // Report monitoring session statistics
    this.reportSessionStatistics();
  }

  /**
   * Apply performance mode configuration
   */
  applyPerformanceMode() {
    const performanceMode = getState('ui.performanceMode') || 'balanced';
    const config = PERFORMANCE_CONFIG[performanceMode];
    
    if (config) {
      this.options = { ...this.options, ...config };
      console.log(`🚀 Applied ${performanceMode} performance mode to ${this.aiType} monitor`);
    }
  }

  /**
   * Set up mutation observer for real-time monitoring
   */
  async setupMutationObserver() {
    if (!this.options.enableAdvancedMonitoring) return;

    this.mutationObserver = new MutationObserver(this.handleMutation);
    
    // Observe with optimized settings
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: false, // Optimize: don't watch text changes
      attributes: false     // Optimize: don't watch attribute changes
    });
  }

  /**
   * Handle mutation observer events
   */
  handleMutation(mutations) {
    if (!this.isActive) return;

    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.analyzeElement(node);
          }
        }
      }
    }
  }

  /**
   * Set up polling backup system
   */
  setupPolling() {
    this.pollInterval = setInterval(() => {
      if (!this.isActive) return;
      
      this.pollCount++;
      
      if (this.pollCount > this.options.maxPolls) {
        console.log(`⏰ Max polls (${this.options.maxPolls}) reached for ${this.aiType}`);
        this.stopMonitoring();
        return;
      }
      
      this.scanForResponses();
    }, this.options.pollInterval);
  }

  /**
   * Set up performance observer for streaming detection
   */
  setupPerformanceObserver() {
    if (!window.PerformanceObserver) return;

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource' && this.isStreamingRequest(entry)) {
            console.log(`🌊 Detected streaming response for ${this.aiType}`);
            setTimeout(() => this.scanForResponses(), 1000);
          }
        }
      });
      
      this.performanceObserver.observe({ entryTypes: ['resource'] });
    } catch (error) {
      // Performance Observer might not be available
      console.warn('Performance Observer not available');
    }
  }

  /**
   * Set up monitoring timeout
   */
  setupTimeout() {
    this.timeoutHandle = setTimeout(() => {
      console.log(`⏰ Response monitoring timeout for ${this.aiType}`);
      this.stopMonitoring();
    }, TIMEOUTS.RESPONSE_MONITORING_TIMEOUT);
  }

  /**
   * Check if network request indicates streaming response
   */
  isStreamingRequest(entry) {
    const url = entry.name;
    const streamingPatterns = [
      '/stream',
      '/chat',
      '/generate',
      'stream=true',
      'text/stream'
    ];
    
    return streamingPatterns.some(pattern => url.includes(pattern));
  }

  /**
   * Scan for AI responses using platform-specific selectors
   */
  scanForResponses = withErrorBoundary(async () => {
    const selectors = SELECTORS[this.aiType.toUpperCase()]?.RESPONSE || [];
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      
      for (const element of elements) {
        if (!element.dataset.tnfProcessed) {
          this.analyzeElement(element);
        }
      }
    }
  }, { component: 'ResponseMonitor', method: 'scanForResponses' });

  /**
   * Analyze element for response content
   */
  analyzeElement(element) {
    if (!this.isActive || !element) return;

    // Skip if already processed
    if (element.dataset.tnfProcessed) return;
    
    // Skip our own UI elements
    if (element.closest('#tnf-injectable-ui')) return;

    // Calculate response confidence score
    const score = this.calculateResponseScore(element);
    
    if (score >= this.options.confidenceThreshold) {
      element.dataset.tnfProcessed = 'true';
      console.log(`🎯 High-confidence response detected (score: ${score.toFixed(2)})`);
      
      // Wait for content stabilization
      setTimeout(() => {
        this.extractResponse(element, score);
      }, TIMEOUTS.TEXT_STABILIZATION);
    }
  }

  /**
   * Calculate confidence score for response element
   */
  calculateResponseScore(element) {
    let score = 0;
    const text = element.textContent || element.innerText || '';
    
    // Content-based scoring
    if (text.length > 50) score += 0.3;
    if (text.length > 200) score += 0.2;
    if (text.length > 500) score += 0.1;
    
    // Structure-based scoring (AI-specific)
    const structureSelectors = SELECTORS[this.aiType.toUpperCase()]?.RESPONSE || [];
    for (const selector of structureSelectors) {
      if (element.matches(selector)) {
        score += 0.6;
        break;
      }
    }
    
    // Location-based scoring
    const rect = element.getBoundingClientRect();
    if (rect.top > window.innerHeight * 0.3) score += 0.1;
    
    // Temporal scoring (newer elements more likely)
    const age = Date.now() - (this.startTime || Date.now());
    if (age < 10000) score += 0.2;
    
    // Negative scoring for unwanted elements
    if (text.includes('Show thinking')) score -= 0.5;
    if (text.includes('Copy')) score -= 0.3;
    if (text.includes('Share')) score -= 0.3;
    if (element.tagName === 'BUTTON') score -= 0.4;
    if (element.closest('[data-message-author-role="user"]')) score -= 0.8;
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Extract response from high-confidence element
   */
  extractResponse = withErrorBoundary(async (element, score) => {
    const text = this.cleanResponseText(element);
    
    if (!this.validateResponseText(text)) {
      console.log('⚠️ Response validation failed');
      return;
    }
    
    // Check for duplicates
    const contentHash = this.hashContent(text.substring(0, 100));
    if (this.processedResponses.has(contentHash)) {
      console.log('⚠️ Duplicate response detected, skipping');
      return;
    }
    
    this.processedResponses.add(contentHash);
    
    console.log(`✅ Response extracted from ${this.aiType} (score: ${score.toFixed(2)}):`, 
                text.substring(0, 100) + '...');
    
    // Create response data
    const responseData = {
      source: this.aiType,
      response: text,
      conversationId: this.conversationId,
      timestamp: new Date().toISOString(),
      metadata: {
        score,
        extractionMethod: 'advanced_monitoring',
        elementType: element.tagName,
        confidence: score,
        monitoringDuration: Date.now() - this.startTime,
        elementSelector: this.getElementSelector(element),
        textLength: text.length
      }
    };
    
    // Send to background script
    this.sendResponseToBackground(responseData);
    
    // Update analytics
    this.updateAnalytics(responseData);
    
    // Stop monitoring after successful extraction
    this.stopMonitoring();
    
  }, { component: 'ResponseMonitor', method: 'extractResponse' });

  /**
   * Clean response text by removing UI elements
   */
  cleanResponseText(element) {
    let text = element.textContent || element.innerText || '';
    
    // Remove common UI elements and unwanted content
    const cleaningPatterns = [
      /Show thinking/g,
      /Copy/g,
      /Share/g,
      /Good response/g,
      /Bad response/g,
      /Listen/g,
      /Redo/g,
      /Sources?$/g,
      /Gemini can make mistakes/g,
      /\s+/g // Normalize whitespace
    ];
    
    cleaningPatterns.forEach(pattern => {
      if (pattern === /\s+/g) {
        text = text.replace(pattern, ' ');
      } else {
        text = text.replace(pattern, '');
      }
    });
    
    return text.trim();
  }

  /**
   * Validate response text quality
   */
  validateResponseText(text) {
    if (!text || text.length < 10) return false;
    if (text.includes('Show thinking')) return false;
    if (text.includes('Just a sec')) return false;
    if (text.includes('Loading...')) return false;
    
    // Check for meaningful content
    const wordCount = text.split(/\s+/).filter(word => word.length > 2).length;
    return wordCount >= 3;
  }

  /**
   * Generate content hash for deduplication
   */
  hashContent(text) {
    let hash = 0;
    if (text.length === 0) return hash.toString();
    
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return hash.toString();
  }

  /**
   * Get CSS selector for element
   */
  getElementSelector(element) {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  /**
   * Send response to background script
   */
  sendResponseToBackground(responseData) {
    try {
      if (chrome?.runtime?.id) {
        chrome.runtime.sendMessage({
          type: 'AI_RESPONSE_ENHANCED',
          ...responseData
        }).catch(error => {
          handleError(error, { component: 'ResponseMonitor', method: 'sendResponseToBackground' });
        });
      }
    } catch (error) {
      handleError(error, { component: 'ResponseMonitor', method: 'sendResponseToBackground' });
    }
  }

  /**
   * Update analytics with response data
   */
  updateAnalytics(responseData) {
    const currentAnalytics = getState('analytics');
    const quality = responseData.metadata.score >= QUALITY_THRESHOLDS.HIGH ? 'high' :
                   responseData.metadata.score >= QUALITY_THRESHOLDS.MEDIUM ? 'medium' : 'low';
    
    const updatedAnalytics = {
      totalResponses: currentAnalytics.totalResponses + 1,
      qualityDistribution: {
        ...currentAnalytics.qualityDistribution,
        [quality]: currentAnalytics.qualityDistribution[quality] + 1
      },
      responseHistory: [
        ...currentAnalytics.responseHistory,
        {
          timestamp: responseData.timestamp,
          score: responseData.metadata.score,
          quality,
          aiType: this.aiType,
          textLength: responseData.metadata.textLength
        }
      ].slice(-100) // Keep last 100 responses
    };
    
    // Calculate new average score
    const scores = updatedAnalytics.responseHistory.map(r => r.score);
    updatedAnalytics.averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    setState({ analytics: updatedAnalytics }, 'UPDATE_ANALYTICS');
  }

  /**
   * Report session statistics
   */
  reportSessionStatistics() {
    const duration = Date.now() - (this.startTime || Date.now());
    const statistics = {
      aiType: this.aiType,
      conversationId: this.conversationId,
      duration,
      pollCount: this.pollCount,
      responsesFound: this.processedResponses.size,
      averageScore: this.calculateAverageScore(),
      performanceMode: getState('ui.performanceMode')
    };
    
    console.log(`📊 ${this.aiType} monitoring session completed:`, statistics);
    
    // Send statistics to background for telemetry
    try {
      if (chrome?.runtime?.id) {
        chrome.runtime.sendMessage({
          type: 'MONITORING_SESSION_COMPLETE',
          statistics
        }).catch(() => {
          // Background might not be available
        });
      }
    } catch (error) {
      // Extension context might be invalid
    }
  }

  /**
   * Calculate average response score for session
   */
  calculateAverageScore() {
    if (this.responseScores.size === 0) return 0;
    
    const scores = Array.from(this.responseScores.values());
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  /**
   * Cleanup monitoring resources
   */
  cleanup() {
    // Clear timers
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }
    
    // Disconnect observers
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
    
    // Clear data structures
    this.processedResponses.clear();
    this.responseScores.clear();
    
    console.log(`🧹 Cleaned up ${this.aiType} response monitor resources`);
  }

  /**
   * Get monitoring statistics
   */
  getStatistics() {
    return {
      isActive: this.isActive,
      aiType: this.aiType,
      conversationId: this.conversationId,
      startTime: this.startTime,
      pollCount: this.pollCount,
      responsesFound: this.processedResponses.size,
      averageScore: this.calculateAverageScore(),
      options: this.options
    };
  }
}

/**
 * Response Monitor Factory
 * Creates and manages response monitors for different AI platforms
 */
class ResponseMonitorFactory {
  constructor() {
    this.monitors = new Map();
    this.activeMonitors = new Map();
  }

  /**
   * Create or get monitor for AI platform
   * @param {string} aiType - AI platform type
   * @param {Object} options - Monitor options
   */
  getMonitor(aiType, options = {}) {
    const key = `${aiType}_${JSON.stringify(options)}`;
    
    if (!this.monitors.has(key)) {
      this.monitors.set(key, new ResponseMonitor(aiType, options));
    }
    
    return this.monitors.get(key);
  }

  /**
   * Start monitoring for specific conversation
   * @param {string} aiType - AI platform type
   * @param {string} conversationId - Conversation ID
   * @param {Object} options - Monitor options
   */
  async startMonitoring(aiType, conversationId, options = {}) {
    // Stop any existing monitor for this AI type
    this.stopMonitoring(aiType);
    
    const monitor = this.getMonitor(aiType, options);
    this.activeMonitors.set(aiType, monitor);
    
    await monitor.startMonitoring(conversationId);
    return monitor;
  }

  /**
   * Stop monitoring for AI platform
   * @param {string} aiType - AI platform type
   */
  stopMonitoring(aiType) {
    const monitor = this.activeMonitors.get(aiType);
    if (monitor) {
      monitor.stopMonitoring();
      this.activeMonitors.delete(aiType);
    }
  }

  /**
   * Stop all active monitors
   */
  stopAllMonitoring() {
    for (const [aiType, monitor] of this.activeMonitors) {
      monitor.stopMonitoring();
    }
    this.activeMonitors.clear();
  }

  /**
   * Get active monitor for AI platform
   * @param {string} aiType - AI platform type
   */
  getActiveMonitor(aiType) {
    return this.activeMonitors.get(aiType);
  }

  /**
   * Get all active monitors
   */
  getActiveMonitors() {
    return Array.from(this.activeMonitors.values());
  }

  /**
   * Get factory statistics
   */
  getStatistics() {
    return {
      totalMonitors: this.monitors.size,
      activeMonitors: this.activeMonitors.size,
      monitorsByAI: Array.from(this.activeMonitors.entries()).map(([aiType, monitor]) => ({
        aiType,
        ...monitor.getStatistics()
      }))
    };
  }

  /**
   * Cleanup all monitors
   */
  cleanup() {
    this.stopAllMonitoring();
    this.monitors.clear();
  }
}

// Create singleton factory instance
const responseMonitorFactory = new ResponseMonitorFactory();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  responseMonitorFactory.cleanup();
});

// Cleanup on extension context invalidation
window.addEventListener('tnf:context-invalidated', () => {
  responseMonitorFactory.cleanup();
});

export { ResponseMonitor, ResponseMonitorFactory };
export default responseMonitorFactory;
