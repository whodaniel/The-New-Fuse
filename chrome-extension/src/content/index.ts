/**
 * Enhanced Content Script for The New Fuse Chrome Extension
 * Includes element selection, AI automation, and relay integration
 */

import { ElementSelector, ElementInfo, PageElementMapping } from './element-selector';
import { AIElementDetector } from './ai-element-detector';
import { ChatIntegrationManager } from './chat-integration-manager';
import { Logger } from '../utils/logger';
import { settingsManager } from '../utils/settings-manager';
import { performanceOptimizer } from '../utils/performance-optimizer';
import { webSocketManager } from '../utils/websocket-manager';

console.log("The New Fuse enhanced content script loaded with advanced features.");

// Initialize components
const logger = new Logger({
  name: 'ContentScript',
  level: 'info',
  saveToStorage: true
});

const elementSelector = new ElementSelector();
const aiDetector = new AIElementDetector();
const chatManager = new ChatIntegrationManager();

// Auto-detect chat elements on page load
let currentPageMapping: PageElementMapping | null = null;
let selectionMode = {
  isActive: false,
  targetElement: null as 'input' | 'button' | 'output' | null,
  onSelectionComplete: null as ((element: ElementInfo) => void) | null
};

// CSS injection for selection mode
let selectionModeStylesInjected = false;
let isInitialized = false;

/**
 * Setup global error handling
 */
function setupGlobalErrorHandling() {
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.reportError(
      new Error(`Unhandled promise rejection: ${event.reason}`),
      'UnhandledRejection',
      { reason: event.reason }
    );
  });

  // Catch uncaught errors
  window.addEventListener('error', (event) => {
    logger.reportError(
      event.error || new Error(event.message),
      'UncaughtError',
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    );
  });
}

// Setup periodic health checks
function setupHealthChecks() {
  // Perform health checks every 5 minutes
  setInterval(async () => {
    try {
      const healthResults = await performanceOptimizer.performHealthCheck();
      const unhealthyComponents = healthResults.filter(result => result.status !== 'healthy');
      
      if (unhealthyComponents.length > 0) {
        logger.warn('Health check detected issues', unhealthyComponents);
        
        // Send health status to background script
        chrome.runtime.sendMessage({
          action: 'HEALTH_CHECK_RESULT',
          data: {
            timestamp: Date.now(),
            results: healthResults,
            url: window.location.href
          }
        });
      }
    } catch (error) {
      logger.error('Health check failed', error);
    }
  }, 5 * 60 * 1000); // 5 minutes
}

// Enhanced initialization with feature management
async function initializeEnhancedFeatures(): Promise<void> {
  try {
    logger.info('Initializing enhanced features');
    
    // Setup error handling first
    setupGlobalErrorHandling();
    
    // Wait for settings to load
    await settingsManager.loadSettings();
    logger.info('Settings loaded');
    
    // Start performance monitoring if enabled
    if (settingsManager.isFeatureEnabled('performance-monitoring')) {
      logger.info('Performance monitoring enabled');
    }
    
    // Start AI element detection if enabled
    if (settingsManager.isFeatureEnabled('ai-detection') && aiDetector) {
      await logger.trackPerformance('AI Detection Startup', async () => {
        await aiDetector.startDetection();
      });
      logger.info('AI element detector started');
    }
    
    // Initialize chat integration if enabled
    if (settingsManager.isFeatureEnabled('chat-integration') && chatManager) {
      await logger.trackPerformance('Chat Integration Startup', async () => {
        await chatManager.initialize();
      });
      logger.info('Chat integration manager initialized');
    }
    
    // Connect WebSocket if enabled
    if (settingsManager.isFeatureEnabled('websocket-enhancement') && webSocketManager && !webSocketManager.isConnected()) {
      await logger.trackPerformance('WebSocket Connection', async () => {
        await webSocketManager.connect();
      });
      logger.info('WebSocket manager connected');
    }
    
    // Setup periodic health checks
    setupHealthChecks();
    
    logger.info('Enhanced features initialization complete');
    
    // Send initialization complete message to background
    chrome.runtime.sendMessage({
      action: 'CONTENT_SCRIPT_READY',
      data: {
        url: window.location.href,
        timestamp: Date.now(),
        features: {
          aiDetection: settingsManager.isFeatureEnabled('ai-detection'),
          chatIntegration: settingsManager.isFeatureEnabled('chat-integration'),
          websocketEnhancement: settingsManager.isFeatureEnabled('websocket-enhancement'),
          performanceMonitoring: settingsManager.isFeatureEnabled('performance-monitoring')
        }
      }
    });
    
  } catch (error) {
    logger.error('Failed to initialize enhanced features', error);
  }
}

/**
 * Initialize element detection on page load
 */
async function initializeElementDetection(): Promise<void> {
  if (isInitialized) {
    logger.info('Element detection already initialized');
    return;
  }
  
  logger.info('Initializing element detection and chat integration');
  
  // Wait for page to be fully loaded
  if (document.readyState !== 'complete') {
    window.addEventListener('load', () => initializeElementDetection());
    return;
  }

  isInitialized = true;

  try {
    // Initialize chat integration
    const chatInitialized = await chatManager.initializeForCurrentPage();
    if (chatInitialized) {
      logger.info('Chat integration initialized successfully');
    }

    // Run AI-powered element detection
    const detectedElements = await aiDetector.detectChatElements();
    logger.info('AI element detection completed:', detectedElements);

    // Auto-detect and store best elements
    const bestInput = await aiDetector.getBestChatInput();
    const bestButton = await aiDetector.getBestSendButton();
    const bestOutput = await aiDetector.getBestChatOutput();

    if (bestInput || bestButton || bestOutput) {
      currentPageMapping = {
        chatInput: bestInput || undefined,
        sendButton: bestButton || undefined,
        chatOutput: bestOutput || undefined,
        timestamp: Date.now(),
        url: window.location.href,
        domain: window.location.hostname
      };

      // Store the mapping for later use
      chrome.storage.local.set({
        [`pageMapping_${window.location.hostname}`]: currentPageMapping
      });

      logger.info('Page mapping created and stored:', currentPageMapping);
    }
    // Load existing element mapping
    currentPageMapping = await elementSelector.loadElementMapping();
    
    if (currentPageMapping) {
      // Validate existing mapping
      const validation = elementSelector.validateElementMapping(currentPageMapping);
      
      if (!validation.valid) {
        logger.warn("Existing element mapping is invalid:", validation.issues);
        // Try auto-detection
        currentPageMapping = await elementSelector.autoDetectChatElements();
        elementSelector.saveElementMapping(currentPageMapping);
      } else {
        logger.info("Using existing valid element mapping");
      }
    } else {
      // No existing mapping, try auto-detection
      // Wait for page to stabilize before detecting elements
      setTimeout(async () => {
        currentPageMapping = await elementSelector.autoDetectChatElements();
        
        if (currentPageMapping && (currentPageMapping.chatInput || currentPageMapping.sendButton || currentPageMapping.chatOutput)) {
          elementSelector.saveElementMapping(currentPageMapping);
          logger.info("Auto-detected and saved element mapping");
          
          // Notify background script about element mapping
          chrome.runtime.sendMessage({
            type: 'ELEMENT_MAPPING_DETECTED',
            mapping: currentPageMapping
          });
        } else {
          logger.info("No chat elements auto-detected on this page");
          
          // Still notify background script with null mapping
          chrome.runtime.sendMessage({
            type: 'ELEMENT_MAPPING_DETECTED',
            mapping: null
          });
        }
      }, 2000);
    }

    // Set up DOM mutation observer for dynamic content changes
    const observer = new MutationObserver((mutations) => {
      let shouldRedetect = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldRedetect = true;
        }
      });
      
      if (shouldRedetect) {
        // Debounce redetection
        setTimeout(async () => {
          logger.info('DOM changes detected, re-running element detection');
          const newMapping = await elementSelector.autoDetectChatElements();
          if (newMapping && (newMapping.chatInput || newMapping.sendButton || newMapping.chatOutput)) {
            currentPageMapping = newMapping;
            elementSelector.saveElementMapping(currentPageMapping);
            chrome.runtime.sendMessage({
              type: 'ELEMENT_MAPPING_DETECTED',
              mapping: currentPageMapping
            });
          }
        }, 1000);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

  } catch (error) {
    logger.error('Error during element detection initialization:', error);
    // Notify background script of error
    chrome.runtime.sendMessage({
      type: 'ELEMENT_DETECTION_ERROR',
      error: error.message
    });
  }
}

// Initialize element detection and inject CSS
initializeElementDetection();
injectSelectionModeStyles();

// Auto-detect elements when page loads or changes - implementation moved to async function below

async function performAutoDetection(): Promise<PageElementMapping | null> {
  try {
    logger.info('Performing automatic element detection');
    
    const mapping = await elementSelector.autoDetectChatElements();
    
    if (mapping) {
      currentPageMapping = mapping;
      logger.info('Element mapping detected:', mapping);
      
      // Notify background script
      chrome.runtime.sendMessage({
        type: 'ELEMENT_MAPPING_DETECTED',
        mapping: mapping
      });
      
      // Notify popup if open
      chrome.runtime.sendMessage({
        type: 'ELEMENT_MAPPING_UPDATE',
        mapping: mapping
      }).catch(() => {
        // Popup might not be open - that's OK
      });
      
      return mapping;
    }
    
    logger.warn('No chat elements detected automatically');
    return null;
  } catch (error) {
    logger.error('Error during auto-detection:', error);
    return null;
  }
}

function injectSelectionModeStyles() {
  if (selectionModeStylesInjected) return;
  
  const cssUrl = chrome.runtime.getURL('content/selection-mode.css');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = cssUrl;
  document.head.appendChild(link);
  
  selectionModeStylesInjected = true;
  logger.info('Selection mode styles injected');
}

function enterElementSelectionMode(targetType: 'input' | 'button' | 'output'): Promise<ElementInfo> {
  return new Promise((resolve, reject) => {
    if (selectionMode.isActive) {
      reject(new Error('Selection mode already active'));
      return;
    }
    
    logger.info(`Entering selection mode for: ${targetType}`);
    
    selectionMode.isActive = true;
    selectionMode.targetElement = targetType;
    selectionMode.onSelectionComplete = resolve;
    
    // Add visual overlay
    const overlay = document.createElement('div');
    overlay.id = 'tnf-selection-overlay';
    overlay.className = 'tnf-selection-overlay';
    
    // Add instructions banner
    const banner = document.createElement('div');
    banner.className = 'tnf-selection-banner';
    banner.innerHTML = `
      <div class="tnf-banner-content">
        <span class="tnf-banner-text">Click on the ${getElementTypeDisplayName(targetType)} element you want to select</span>
        <button class="tnf-banner-cancel" id="tnf-cancel-selection">Cancel</button>
      </div>
    `;
    
    overlay.appendChild(banner);
    document.body.appendChild(overlay);
    
    // Add cancel button handler
    const cancelBtn = document.getElementById('tnf-cancel-selection');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        exitSelectionMode();
        reject(new Error('Selection cancelled by user'));
      });
    }
    
    // Add element highlighting and click handlers
    addElementEventListeners();
    
    // Auto-exit after 30 seconds
    setTimeout(() => {
      if (selectionMode.isActive) {
        exitSelectionMode();
        reject(new Error('Selection timed out'));
      }
    }, 30000);
  });
}

function getElementTypeDisplayName(type: 'input' | 'button' | 'output'): string {
  switch (type) {
    case 'input': return 'chat input field';
    case 'button': return 'send button';
    case 'output': return 'chat output area';
    default: return 'element';
  }
}

function addElementEventListeners() {
  const allElements = document.querySelectorAll('*');
  
  allElements.forEach((element) => {
    if (isSelectableElement(element as HTMLElement, selectionMode.targetElement!)) {
      element.addEventListener('mouseenter', handleElementHover);
      element.addEventListener('mouseleave', handleElementLeave);
      element.addEventListener('click', handleElementClick, true);
    }
  });
}

function removeElementEventListeners() {
  const allElements = document.querySelectorAll('*');
  
  allElements.forEach((element) => {
    element.removeEventListener('mouseenter', handleElementHover);
    element.removeEventListener('mouseleave', handleElementLeave);
    element.removeEventListener('click', handleElementClick, true);
    element.classList.remove('tnf-selectable', 'tnf-highlighted');
  });
}

function isSelectableElement(element: HTMLElement, targetType: 'input' | 'button' | 'output'): boolean {
  const tagName = element.tagName.toLowerCase();
  const type = element.getAttribute('type')?.toLowerCase();
  const role = element.getAttribute('role')?.toLowerCase();
  
  switch (targetType) {
    case 'input':
      return (
        tagName === 'input' && (!type || ['text', 'search', 'email'].includes(type)) ||
        tagName === 'textarea' ||
        element.contentEditable === 'true' ||
        role === 'textbox'
      );
    
    case 'button':
      return (
        tagName === 'button' ||
        (tagName === 'input' && type === 'submit') ||
        role === 'button' ||
        element.classList.contains('send') ||
        element.classList.contains('submit')
      );
    
    case 'output':
      return (
        tagName === 'div' || tagName === 'section' || tagName === 'main' ||
        element.classList.contains('messages') ||
        element.classList.contains('chat') ||
        element.classList.contains('conversation') ||
        element.classList.contains('output') ||
        role === 'log' || role === 'main'
      );
    
    default:
      return false;
  }
}

function handleElementHover(event: Event) {
  const element = event.target as HTMLElement;
  element.classList.add('tnf-highlighted');
  
  // Show tooltip with element info
  showElementTooltip(element);
}

function handleElementLeave(event: Event) {
  const element = event.target as HTMLElement;
  element.classList.remove('tnf-highlighted');
  
  // Hide tooltip
  hideElementTooltip();
}

function handleElementClick(event: Event) {
  event.preventDefault();
  event.stopPropagation();
  
  const element = event.target as HTMLElement;
  
  if (selectionMode.isActive && selectionMode.onSelectionComplete) {
    const elementInfo = elementSelector.createElementInfo(element);
    
    logger.info('Element selected:', elementInfo);
    
    // Update current mapping
    if (!currentPageMapping) {
      currentPageMapping = {
        input: null,
        button: null,
        output: null,
        timestamp: Date.now(),
        url: window.location.href
      };
    }
    
    if (selectionMode.targetElement) {
      currentPageMapping[selectionMode.targetElement] = elementInfo;
      currentPageMapping.timestamp = Date.now();
    }
    
    // Notify background and popup
    chrome.runtime.sendMessage({
      type: 'ELEMENT_SELECTED',
      elementType: selectionMode.targetElement,
      elementInfo: elementInfo,
      pageMapping: currentPageMapping
    });
    
    exitSelectionMode();
    selectionMode.onSelectionComplete(elementInfo);
  }
}

function showElementTooltip(element: HTMLElement) {
  hideElementTooltip(); // Remove any existing tooltip
  
  const tooltip = document.createElement('div');
  tooltip.id = 'tnf-element-tooltip';
  tooltip.className = 'tnf-element-tooltip';
  
  const tagName = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : '';
  const className = element.className ? `.${element.className.split(' ').join('.')}` : '';
  const textContent = element.textContent?.slice(0, 50) + (element.textContent && element.textContent.length > 50 ? '...' : '');
  
  tooltip.innerHTML = `
    <div class="tnf-tooltip-tag">${tagName}${id}${className}</div>
    <div class="tnf-tooltip-text">${textContent || 'No text content'}</div>
  `;
  
  // Position tooltip near cursor
  const rect = element.getBoundingClientRect();
  tooltip.style.left = `${rect.left}px`;
  tooltip.style.top = `${rect.top - 60}px`;
  
  document.body.appendChild(tooltip);
}

function hideElementTooltip() {
  const tooltip = document.getElementById('tnf-element-tooltip');
  if (tooltip) {
    tooltip.remove();
  }
}

function exitSelectionMode() {
  logger.info('Exiting selection mode');
  
  selectionMode.isActive = false;
  selectionMode.targetElement = null;
  selectionMode.onSelectionComplete = null;
  
  // Remove overlay
  const overlay = document.getElementById('tnf-selection-overlay');
  if (overlay) {
    overlay.remove();
  }
  
  // Remove element event listeners and classes
  removeElementEventListeners();
  
  // Hide tooltip
  hideElementTooltip();
}

// Message handlers
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  logger.info("Content script received message:", request);

  try {
    switch (request.type) {
      case "INJECT_SCRIPT_REQUEST":
        logger.info("Content script processing INJECT_SCRIPT_REQUEST:", request.payload);
        sendResponse({ success: true, message: "Content script acknowledged injection." });
        break;

      case 'CAPTURE_PAGE_OUTPUT':
        handleCapturePageOutput(request, sendResponse);
        break;

      case 'SEND_TO_PAGE_INPUT':
        handleSendToPageInput(request, sendResponse);
        break;

      case 'ENTER_ELEMENT_SELECTION_MODE':
        handleEnterSelectionMode(request, sendResponse);
        break;

      case 'ENTER_SELECTION_MODE':
        handleEnterSelectionMode(request, sendResponse);
        break;

      case 'AUTO_DETECT_ELEMENTS':
        handleAutoDetectElements(request, sendResponse);
        break;

      case 'SAVE_ELEMENT_MAPPING':
        handleSaveElementMapping(request, sendResponse);
        break;

      case 'LOAD_ELEMENT_MAPPING':
        handleLoadElementMapping(request, sendResponse);
        break;

      case 'VALIDATE_ELEMENT_MAPPING':
        handleValidateElementMapping(request, sendResponse);
        break;

      case 'GET_PAGE_INFO':
        handleGetPageInfo(request, sendResponse);
        break;

      case 'EXECUTE_AI_ACTION':
        handleExecuteAIAction(request, sendResponse);
        break;

      case 'SIMULATE_USER_INTERACTION':
        handleSimulateUserInteraction(request, sendResponse);
        break;

      case 'GET_CURRENT_MAPPING':
        sendResponse({
          success: true,
          mapping: currentPageMapping
        });
        break;

      case 'RESET_ELEMENT_MAPPING':
        currentPageMapping = null;
        sendResponse({ success: true });
        break;

      case 'SAVE_ELEMENT_MAPPING':
        handleSaveElementMapping(request, sendResponse);
        break;

      case 'LOAD_ELEMENT_MAPPING':
        handleLoadElementMapping(request, sendResponse);
        break;

      case 'VALIDATE_ELEMENT_MAPPING':
        handleValidateElementMapping(request, sendResponse);
        break;

      case 'GET_PAGE_INFO':
        handleGetPageInfo(request, sendResponse);
        break;

      case 'EXECUTE_AI_ACTION':
        handleExecuteAIAction(request, sendResponse);
        break;

      case 'SIMULATE_USER_INTERACTION':
        handleSimulateUserInteraction(request, sendResponse);
        break;

      case 'CONTROL_IFRAME_VISIBILITY':
        handleControlIframeVisibility(request, sendResponse);
        break;

      default:
        logger.warn("Content script received unhandled message type:", request.type);
        return false;
    }
  } catch (error) {
    logger.error("Error handling message:", error);
    sendResponse({ success: false, error: (error as Error).message });
  }

  return true; // Keep message channel open for async responses
});

/**
 * Handle capture page output request
 */
function handleCapturePageOutput(request: any, sendResponse: (response: any) => void): void {
  const { chatOutputSelector } = request.payload;
  
  // Use current mapping if no selector provided
  let selector = chatOutputSelector;
  if (!selector && currentPageMapping?.chatOutput) {
    const element = elementSelector.findElement(currentPageMapping.chatOutput);
    if (element) {
      selector = currentPageMapping.chatOutput.selector;
    }
  }
  
  if (!selector) {
    logger.error("CAPTURE_PAGE_OUTPUT: No selector available");
    sendResponse({ success: false, error: 'No chat output selector available. Please configure element mapping first.' });
    return;
  }

  try {
    const element = document.querySelector(selector);
    if (!element) {
      logger.warn(`CAPTURE_PAGE_OUTPUT: Element not found with selector: ${selector}`);
      sendResponse({ success: false, error: `Element not found with selector: ${selector}` });
      return;
    }

    const text = (element as HTMLElement).innerText || (element as HTMLElement).textContent;
    logger.info(`CAPTURE_PAGE_OUTPUT: Captured text: "${text}" from selector: ${selector}`);
    sendResponse({ success: true, type: 'PAGE_OUTPUT_CAPTURED', text, selector });
  } catch (e: any) {
    logger.error(`CAPTURE_PAGE_OUTPUT: Error capturing text from selector ${selector}:`, e);
    sendResponse({ success: false, error: e.message });
  }
}

/**
 * Handle send to page input request
 */
function handleSendToPageInput(request: any, sendResponse: (response: any) => void): void {
  let { chatInputSelector, sendButtonSelector, text } = request.payload;
  
  // Use current mapping if selectors not provided
  if (!chatInputSelector && currentPageMapping?.chatInput) {
    const element = elementSelector.findElement(currentPageMapping.chatInput);
    if (element) {
      chatInputSelector = currentPageMapping.chatInput.selector;
    }
  }
  
  if (!sendButtonSelector && currentPageMapping?.sendButton) {
    const element = elementSelector.findElement(currentPageMapping.sendButton);
    if (element) {
      sendButtonSelector = currentPageMapping.sendButton.selector;
    }
  }
  
  if (!chatInputSelector || !sendButtonSelector || typeof text === 'undefined') {
    logger.error("SEND_TO_PAGE_INPUT: Missing required payload fields");
    sendResponse({ 
      success: false, 
      error: 'Required selectors or text missing. Please configure element mapping first.' 
    });
    return;
  }

  try {
    const inputElement = document.querySelector(chatInputSelector) as HTMLInputElement | HTMLTextAreaElement;
    const buttonElement = document.querySelector(sendButtonSelector) as HTMLElement;

    if (!inputElement) {
      logger.warn(`SEND_TO_PAGE_INPUT: Input element not found with selector: ${chatInputSelector}`);
      sendResponse({ success: false, error: `Input element not found with selector: ${chatInputSelector}` });
      return;
    }
    if (!buttonElement) {
      logger.warn(`SEND_TO_PAGE_INPUT: Button element not found with selector: ${sendButtonSelector}`);
      sendResponse({ success: false, error: `Button element not found with selector: ${sendButtonSelector}` });
      return;
    }

    // Simulate realistic user input
    inputElement.focus();
    inputElement.value = text;
    
    // Trigger input events for React/Vue compatibility
    const inputEvent = new Event('input', { bubbles: true });
    const changeEvent = new Event('change', { bubbles: true });
    inputElement.dispatchEvent(inputEvent);
    inputElement.dispatchEvent(changeEvent);
    
    logger.info(`SEND_TO_PAGE_INPUT: Set value of input (${chatInputSelector}) to: "${text}"`);

    // Simulate button click with delay
    setTimeout(() => {
      buttonElement.click();
      logger.info(`SEND_TO_PAGE_INPUT: Clicked button (${sendButtonSelector})`);
    }, 100);

    sendResponse({ success: true, type: 'SENT_TO_PAGE_CONFIRMED' });
  } catch (e: any) {
    logger.error(`SEND_TO_PAGE_INPUT: Error sending text to page:`, e);
    sendResponse({ success: false, error: e.message });
  }
}

/**
 * Handle element selection mode entry
 */
async function handleEnterSelectionMode(request: any, sendResponse: (response: any) => void): Promise<void> {
  try {
    const { elementType } = request;
    
    if (!['input', 'button', 'output'].includes(elementType)) {
      throw new Error(`Invalid element type: ${elementType}`);
    }
    
    logger.info(`Entering selection mode for: ${elementType}`);
    
    const elementInfo = await enterElementSelectionMode(elementType);
    
    logger.info(`Element selected successfully:`, elementInfo);
    
    sendResponse({
      success: true,
      elementInfo: elementInfo,
      mapping: currentPageMapping
    });
  } catch (error) {
    logger.error('Error in selection mode:', error);
    sendResponse({
      success: false,
      error: (error as Error).message
    });
  }
}

/**
 * Handle automatic element detection
 */
async function handleAutoDetectElements(request: any, sendResponse: (response: any) => void): Promise<void> {
  try {
    logger.info('Performing auto-detection');
    
    const mapping = await performAutoDetection();
    
    if (mapping) {
      sendResponse({
        success: true,
        mapping: mapping,
        message: 'Elements detected successfully'
      });
    } else {
      sendResponse({
        success: false,
        error: 'No chat elements could be detected on this page'
      });
    }
  } catch (error) {
    logger.error('Error during auto-detection:', error);
    sendResponse({
      success: false,
      error: (error as Error).message
    });
  }
}

/**
 * Handle save element mapping
 */
function handleSaveElementMapping(request: any, sendResponse: (response: any) => void): void {
  const { mapping } = request.payload;
  
  try {
    elementSelector.saveElementMapping(mapping);
    currentPageMapping = mapping;
    sendResponse({ success: true });
  } catch (error) {
    logger.error("Error saving element mapping:", error);
    sendResponse({ success: false, error: (error as Error).message });
  }
}

/**
 * Handle load element mapping
 */
async function handleLoadElementMapping(request: any, sendResponse: (response: any) => void): Promise<void> {
  try {
    const mapping = await elementSelector.loadElementMapping();
    currentPageMapping = mapping;
    sendResponse({ success: true, mapping: mapping });
  } catch (error) {
    logger.error("Error loading element mapping:", error);
    sendResponse({ success: false, error: (error as Error).message });
  }
}

/**
 * Handle validate element mapping
 */
function handleValidateElementMapping(request: any, sendResponse: (response: any) => void): void {
  if (!currentPageMapping) {
    sendResponse({ success: false, error: 'No element mapping available to validate' });
    return;
  }
  
  try {
    const validation = elementSelector.validateElementMapping(currentPageMapping);
    sendResponse({ success: true, validation: validation });
  } catch (error) {
    logger.error("Error validating element mapping:", error);
    sendResponse({ success: false, error: (error as Error).message });
  }
}

/**
 * Handle get page info
 */
function handleGetPageInfo(request: any, sendResponse: (response: any) => void): void {
  const pageInfo = {
    url: window.location.href,
    domain: window.location.hostname,
    title: document.title,
    hasMapping: !!currentPageMapping,
    mapping: currentPageMapping,
    readyState: document.readyState
  };
  
  sendResponse({ success: true, pageInfo: pageInfo });
}

/**
 * Handle AI-powered actions
 */
async function handleExecuteAIAction(request: any, sendResponse: (response: any) => void): Promise<void> {
  const { action, parameters } = request.payload;
  
  try {
    switch (action) {
      case 'sendMessage':
        await executeAISendMessage(parameters);
        break;
      case 'extractResponse':
        await executeAIExtractResponse(parameters);
        break;
      case 'waitForResponse':
        await executeAIWaitForResponse(parameters);
        break;
      case 'analyzeInterface':
        await executeAIAnalyzeInterface(parameters);
        break;
      default:
        throw new Error(`Unknown AI action: ${action}`);
    }
    
    sendResponse({ success: true });
  } catch (error) {
    logger.error("Error executing AI action:", error);
    sendResponse({ success: false, error: (error as Error).message });
  }
}

/**
 * AI-powered message sending
 */
async function executeAISendMessage(parameters: any): Promise<void> {
  const { message, waitForResponse = true } = parameters;
  
  if (!currentPageMapping?.chatInput || !currentPageMapping?.sendButton) {
    throw new Error('Chat input or send button not configured');
  }
  
  const inputElement = elementSelector.findElement(currentPageMapping.chatInput);
  const buttonElement = elementSelector.findElement(currentPageMapping.sendButton);
  
  if (!inputElement || !buttonElement) {
    throw new Error('Could not find chat elements on page');
  }
  
  // Simulate human-like typing
  await simulateTyping(inputElement as HTMLInputElement, message);
  
  // Click send button
  buttonElement.click();
  
  if (waitForResponse) {
    await waitForNewResponse();
  }
}

/**
 * AI-powered response extraction
 */
async function executeAIExtractResponse(parameters: any): Promise<string> {
  const { lastMessageOnly = true } = parameters;
  
  if (!currentPageMapping?.chatOutput) {
    throw new Error('Chat output not configured');
  }
  
  const outputElement = elementSelector.findElement(currentPageMapping.chatOutput);
  if (!outputElement) {
    throw new Error('Could not find chat output element');
  }
  
  // Extract latest response
  if (lastMessageOnly) {
    const messages = outputElement.querySelectorAll('[data-message], .message, .response');
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1] as HTMLElement;
      return lastMessage.textContent || lastMessage.innerText || '';
    }
  }
  
  return outputElement.textContent || outputElement.innerText || '';
}

/**
 * Wait for new response
 */
async function waitForNewResponse(timeout: number = 30000): Promise<void> {
  if (!currentPageMapping?.chatOutput) {
    throw new Error('Chat output not configured');
  }
  
  const outputElement = elementSelector.findElement(currentPageMapping.chatOutput);
  if (!outputElement) {
    throw new Error('Could not find chat output element');
  }
  
  const initialContent = outputElement.textContent || '';
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const checkForNewContent = () => {
      const currentContent = outputElement.textContent || '';
      
      if (currentContent !== initialContent && currentContent.length > initialContent.length) {
        resolve();
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for response'));
        return;
      }
      
      setTimeout(checkForNewContent, 500);
    };
    
    checkForNewContent();
  });
}

/**
 * AI-powered interface analysis
 */
async function executeAIAnalyzeInterface(parameters: any): Promise<any> {
  const analysis = {
    chatElements: await elementSelector.autoDetectChatElements(),
    interactiveElements: getInteractiveElements(),
    pageStructure: getPageStructure(),
    accessibility: getAccessibilityInfo()
  };
  
  return analysis;
}

/**
 * Simulate human-like typing
 */
async function simulateTyping(element: HTMLInputElement | HTMLTextAreaElement, text: string): Promise<void> {
  element.focus();
  element.value = '';
  
  for (let i = 0; i < text.length; i++) {
    element.value += text[i];
    
    // Trigger events for each character
    const inputEvent = new Event('input', { bubbles: true });
    element.dispatchEvent(inputEvent);
    
    // Random delay between 50-150ms for human-like typing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
  }
  
  // Final change event
  const changeEvent = new Event('change', { bubbles: true });
  element.dispatchEvent(changeEvent);
}

/**
 * Handle simulate user interaction
 */
async function handleSimulateUserInteraction(request: any, sendResponse: (response: any) => void): Promise<void> {
  const { interactionType, target, parameters } = request.payload;
  
  try {
    let element: HTMLElement | null = null;
    
    if (typeof target === 'string') {
      element = document.querySelector(target);
    } else if (target.selector) {
      element = elementSelector.findElement(target);
    }
    
    if (!element) {
      throw new Error('Target element not found');
    }
    
    switch (interactionType) {
      case 'click':
        await simulateClick(element);
        break;
      case 'type':
        await simulateTyping(element as HTMLInputElement, parameters.text);
        break;
      case 'hover':
        await simulateHover(element);
        break;
      case 'scroll':
        await simulateScroll(element, parameters);
        break;
      default:
        throw new Error(`Unknown interaction type: ${interactionType}`);
    }
    
    sendResponse({ success: true });
  } catch (error) {
    logger.error("Error simulating user interaction:", error);
    sendResponse({ success: false, error: (error as Error).message });
  }
}

/**
 * Simulate click with human-like behavior
 */
async function simulateClick(element: HTMLElement): Promise<void> {
  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  
  // Dispatch mouse events in sequence
  const events = ['mousedown', 'mouseup', 'click'];
  
  for (const eventType of events) {
    const event = new MouseEvent(eventType, {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y
    });
    
    element.dispatchEvent(event);
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

/**
 * Simulate hover
 */
async function simulateHover(element: HTMLElement): Promise<void> {
  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  
  const hoverEvent = new MouseEvent('mouseover', {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y
  });
  
  element.dispatchEvent(hoverEvent);
}

/**
 * Simulate scroll
 */
async function simulateScroll(element: HTMLElement, parameters: any): Promise<void> {
  const { direction = 'down', amount = 100 } = parameters;
  
  let deltaY = 0;
  switch (direction) {
    case 'up':
      deltaY = -amount;
      break;
    case 'down':
      deltaY = amount;
      break;
  }
  
  const wheelEvent = new WheelEvent('wheel', {
    bubbles: true,
    cancelable: true,
    deltaY: deltaY
  });
  
  element.dispatchEvent(wheelEvent);
}

/**
 * Handle iframe visibility control
 */
function handleControlIframeVisibility(request: any, sendResponse: (response: any) => void): void {
  const { visible } = request;
  
  // This would handle floating panel visibility
  // Implementation depends on your floating panel structure
  sendResponse({ success: true, visible: visible });
}

/**
 * Get interactive elements on page
 */
function getInteractiveElements(): any[] {
  const interactiveSelectors = [
    'input', 'button', 'textarea', 'select', 'a[href]',
    '[role="button"]', '[tabindex]', '[onclick]'
  ];
  
  const elements: any[] = [];
  
  interactiveSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      const element = el as HTMLElement;
      const rect = element.getBoundingClientRect();
      
      if (rect.width > 0 && rect.height > 0) {
        elements.push({
          tag: element.tagName.toLowerCase(),
          selector: generateSimpleSelector(element),
          text: element.textContent?.slice(0, 50) || '',
          position: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
          isVisible: true
        });
      }
    });
  });
  
  return elements;
}

/**
 * Get page structure information
 */
function getPageStructure(): any {
  return {
    title: document.title,
    url: window.location.href,
    domain: window.location.hostname,
    headings: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
      level: h.tagName.toLowerCase(),
      text: h.textContent?.slice(0, 100) || ''
    })),
    forms: Array.from(document.querySelectorAll('form')).length,
    inputs: Array.from(document.querySelectorAll('input, textarea, select')).length,
    buttons: Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]')).length
  };
}

/**
 * Get accessibility information
 */
function getAccessibilityInfo(): any {
  return {
    hasSkipLink: !!document.querySelector('a[href="#main"], a[href="#content"]'),
    landmarkRoles: Array.from(document.querySelectorAll('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]')).length,
    altTextImages: Array.from(document.querySelectorAll('img[alt]')).length,
    totalImages: Array.from(document.querySelectorAll('img')).length,
    ariaLabels: Array.from(document.querySelectorAll('[aria-label]')).length,
    headingStructure: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => h.tagName.toLowerCase())
  };
}

/**
 * Generate simple selector for element
 */
function generateSimpleSelector(element: HTMLElement): string {
  if (element.id) {
    return `#${element.id}`;
  }
  
  if (element.classList.length > 0) {
    return `.${Array.from(element.classList).join('.')}`;
  }
  
  return element.tagName.toLowerCase();
}

// Start enhanced initialization
initializeEnhancedFeatures();

// Initialize on script load
logger.info("Enhanced content script initialized with element selection capabilities");
