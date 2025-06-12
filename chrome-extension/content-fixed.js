// Simplified Content Script for The New Fuse Chrome Extension
console.log('🚀 The New Fuse Content Script Loaded');

class TheNewFuseContent {
  constructor() {
    this.floatingPanel = null;
    this.isVisible = false;
    this.panelExplicitlyClosed = false; // Track if user explicitly closed panel
    this.websocket = null;
    this.isConnected = false;
    this.selectedElements = { input: null, button: null, output: null };
    this.elementDetectionMode = false;
    this.currentSelectionType = null;
    this.aiSessionActive = false;
    this.elementClickHandler = null;
    this.elementHoverHandler = null;
    this.serverState = 'stopped'; // 'stopped', 'starting', 'running', 'stopping'
    this.serverPingInterval = null;
    
    // WebSocket reconnection management
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000; // Initial delay in milliseconds
    this.reconnectTimeout = null;
    this.isConnecting = false;
    this.manualDisconnect = false;
    
    this.init();
  }

  init() {
    this.createFloatingPanel();
    this.setupMessageListeners();
    setTimeout(() => this.loadPanelState(), 1000);
    console.log('✅ The New Fuse initialized');
  }

  createFloatingPanel() {
    const existing = document.getElementById('tnf-floating-panel');
    if (existing) existing.remove();

    this.floatingPanel = document.createElement('div');
    this.floatingPanel.id = 'tnf-floating-panel';
    this.floatingPanel.innerHTML = this.getPanelHTML();
    this.applyPanelStyles();
    this.floatingPanel.style.display = 'none';
    document.body.appendChild(this.floatingPanel);
    
    // Use setTimeout to ensure DOM elements are fully created before attaching event listeners
    setTimeout(() => {
      this.setupPanelEventListeners();
      this.makePanelDraggable();
      this.makePanelResizable();
      console.log('TNF: Panel created and event listeners attached');
    }, 10);
  }

  getPanelHTML() {
    return `
      <div class="tnf-panel-header">
        <h3>The New Fuse</h3>
        <div class="tnf-panel-controls">
          <button id="tnf-minimize">−</button>
          <button id="tnf-close">×</button>
        </div>
      </div>
      <div class="tnf-panel-content">
        <div class="tnf-section">
          <h4>WebSocket Connection</h4>
          <div class="tnf-connection-controls">
            <input type="text" id="tnf-ws-url" name="tnf-ws-url" placeholder="ws://localhost:3710" value="ws://localhost:3710">
            <div class="tnf-button-row">
              <button id="tnf-start-server" class="tnf-btn-start">Start Server</button>
              <button id="tnf-connect" class="tnf-btn-connect">Connect</button>
              <button id="tnf-reconnect" class="tnf-btn-reconnect" style="display: none;">Reconnect</button>
            </div>
            <div class="tnf-status" id="tnf-connection-status">Disconnected</div>
            <div class="tnf-server-status" id="tnf-server-status">Server: Stopped</div>
          </div>
        </div>
        <div class="tnf-section">
          <h4>Element Detection</h4>
          <div class="tnf-element-controls">
            <button id="tnf-auto-detect" class="tnf-btn">🔍 Auto-Detect</button>
            <button id="tnf-manual-select" class="tnf-btn">👆 Manual Select</button>
          </div>
          <div class="tnf-detected-elements">
            <div class="tnf-element-item">
              <span>Input:</span>
              <span id="tnf-input-display">None</span>
              <button id="tnf-test-input" class="tnf-btn-small">Test</button>
            </div>
            <div class="tnf-element-item">
              <span>Button:</span>
              <span id="tnf-button-display">None</span>
              <button id="tnf-test-button" class="tnf-btn-small">Test</button>
            </div>
            <div class="tnf-element-item">
              <span>Output:</span>
              <span id="tnf-output-display">None</span>
              <button id="tnf-test-output" class="tnf-btn-small">Test</button>
            </div>
          </div>
        </div>
        <div class="tnf-section">
          <h4>Chat Relay</h4>
          <div class="tnf-chat-box">
            <div id="tnf-chat-messages" class="tnf-chat-messages"></div>
            <div class="tnf-chat-input-area">
              <input type="text" id="tnf-chat-input" name="tnf-chat-input" placeholder="Type message...">
              <button id="tnf-send-chat" class="tnf-btn">Send</button>
            </div>
          </div>
        </div>
      </div>
      <!-- Resize handles -->
      <div class="tnf-resize-handle tnf-resize-n" data-direction="n"></div>
      <div class="tnf-resize-handle tnf-resize-s" data-direction="s"></div>
      <div class="tnf-resize-handle tnf-resize-e" data-direction="e"></div>
      <div class="tnf-resize-handle tnf-resize-w" data-direction="w"></div>
      <div class="tnf-resize-handle tnf-resize-ne" data-direction="ne"></div>
      <div class="tnf-resize-handle tnf-resize-nw" data-direction="nw"></div>
      <div class="tnf-resize-handle tnf-resize-se" data-direction="se"></div>
      <div class="tnf-resize-handle tnf-resize-sw" data-direction="sw"></div>
    `;
  }

  applyPanelStyles() {
    let styleSheet = document.getElementById('tnf-styles');
    if (styleSheet) styleSheet.remove();
    
    styleSheet = document.createElement('style');
    styleSheet.id = 'tnf-styles';
    styleSheet.textContent = `
      #tnf-floating-panel {
        position: fixed !important; top: 20px !important; right: 20px !important;
        width: 350px !important; min-width: 300px !important; max-width: min(600px, 90vw) !important;
        height: 500px !important; min-height: 400px !important; max-height: min(85vh, 900px) !important;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        border-radius: 12px !important; box-shadow: 0 10px 40px rgba(0,0,0,0.3) !important;
        z-index: 999999999 !important; color: white !important;
        font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif !important;
        backdrop-filter: blur(10px) !important; border: 1px solid rgba(255,255,255,0.2) !important;
        overflow: hidden !important; pointer-events: auto !important; resize: none !important;
        box-sizing: border-box !important; display: flex !important; flex-direction: column !important;
      }
      .tnf-panel-header {
        background: rgba(255,255,255,0.1) !important; padding: 12px 16px !important;
        display: flex !important; justify-content: space-between !important;
        align-items: center !important; cursor: move !important;
        border-bottom: 1px solid rgba(255,255,255,0.1) !important;
      }
      .tnf-panel-header h3 { margin: 0 !important; font-size: 14px !important; font-weight: 600 !important; }
      .tnf-panel-controls button {
        background: rgba(255,255,255,0.2) !important; border: none !important; color: white !important;
        width: 24px !important; height: 24px !important; border-radius: 4px !important;
        margin-left: 8px !important; cursor: pointer !important; font-size: 14px !important;
      }
      .tnf-panel-controls button:hover { background: rgba(255,255,255,0.3) !important; }
      .tnf-panel-content {
        padding: 16px !important; flex: 1 !important; overflow-y: auto !important;
        display: flex !important; flex-direction: column !important; gap: 12px !important;
        min-height: 0 !important;
      }
      .tnf-section {
        background: rgba(255,255,255,0.1) !important;
        border-radius: 8px !important; padding: 12px !important; flex-shrink: 0 !important;
      }
      .tnf-section h4 {
        margin: 0 0 12px 0 !important; font-size: 12px !important; font-weight: 600 !important;
        text-transform: uppercase !important; opacity: 0.9 !important;
      }
      .tnf-connection-controls { display: flex !important; flex-direction: column !important; gap: 8px !important; }
      .tnf-button-row { display: flex !important; gap: 8px !important; }
      .tnf-button-row button { flex: 1 !important; }
      .tnf-connection-controls input {
        background: rgba(255,255,255,0.2) !important; border: 1px solid rgba(255,255,255,0.3) !important;
        border-radius: 6px !important; padding: 8px 12px !important; color: white !important; font-size: 12px !important;
      }
      .tnf-btn, .tnf-btn-connect, .tnf-btn-start, .tnf-btn-reconnect {
        background: rgba(255,255,255,0.2) !important; border: 1px solid rgba(255,255,255,0.3) !important;
        border-radius: 6px !important; padding: 8px 12px !important; color: white !important;
        cursor: pointer !important; font-size: 12px !important; transition: all 0.2s !important;
        position: relative !important; overflow: hidden !important;
      }
      .tnf-btn:hover, .tnf-btn-connect:hover, .tnf-btn-start:hover, .tnf-btn-reconnect:hover { background: rgba(255,255,255,0.3) !important; }
      .tnf-btn-connect.connected { background: rgba(46,160,67,0.8) !important; border-color: rgba(46,160,67,1) !important; }
      .tnf-btn-reconnect { background: rgba(255,152,0,0.8) !important; border-color: rgba(255,152,0,1) !important; color: white !important; }
      .tnf-btn-start { background: rgba(52,199,89,0.6) !important; border-color: rgba(52,199,89,0.8) !important; }
      .tnf-btn-start:hover { background: rgba(52,199,89,0.8) !important; }
      .tnf-btn-start.starting { 
        background: rgba(255,193,7,0.8) !important; border-color: rgba(255,193,7,1) !important; 
        cursor: not-allowed !important;
      }
      .tnf-btn-start.running { 
        background: rgba(255,69,58,0.8) !important; border-color: rgba(255,69,58,1) !important; 
      }
      .tnf-btn-start.stopping { 
        background: rgba(255,149,0,0.8) !important; border-color: rgba(255,149,0,1) !important; 
        cursor: not-allowed !important;
      }
      .tnf-btn-start.loading::after {
        content: '' !important; position: absolute !important; top: 50% !important; left: 50% !important;
        width: 12px !important; height: 12px !important; margin: -6px 0 0 -6px !important;
        border: 2px solid transparent !important; border-top: 2px solid white !important;
        border-radius: 50% !important; animation: tnf-spin 1s linear infinite !important;
      }
      @keyframes tnf-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .tnf-status {
        font-size: 11px !important; text-align: center !important; padding: 4px !important;
        border-radius: 4px !important; background: rgba(0,0,0,0.2) !important;
        display: flex !important; align-items: center !important; justify-content: center !important;
        gap: 4px !important;
      }
      .tnf-status.connected { background: rgba(46,160,67,0.8) !important; }
      .tnf-status.server-running { background: rgba(52,199,89,0.8) !important; }
      .tnf-status.server-starting { background: rgba(255,193,7,0.8) !important; }
      .tnf-status::before {
        content: '●' !important; font-size: 8px !important; margin-right: 2px !important;
      }
      .tnf-status.connected::before { color: #00ff00 !important; }
      .tnf-status.server-running::before { color: #00ff00 !important; }
      .tnf-status.server-starting::before { color: #ffff00 !important; }
      .tnf-connection-controls { 
        display: flex !important; flex-direction: column !important; gap: 8px !important; 
      }
      .tnf-server-status {
        font-size: 10px !important; padding: 2px 6px !important; border-radius: 3px !important;
        background: rgba(0,0,0,0.3) !important; text-align: center !important;
        margin-top: 4px !important;
      }
      .tnf-element-controls { display: flex !important; gap: 8px !important; margin-bottom: 12px !important; }
      .tnf-element-controls button { flex: 1 !important; }
      .tnf-detected-elements { display: flex !important; flex-direction: column !important; gap: 6px !important; }
      .tnf-element-item {
        display: flex !important; align-items: center !important; justify-content: space-between !important;
        background: rgba(0,0,0,0.2) !important; padding: 6px 8px !important;
        border-radius: 4px !important; font-size: 11px !important;
      }
      .tnf-btn-small {
        background: rgba(255,255,255,0.2) !important; border: 1px solid rgba(255,255,255,0.3) !important;
        border-radius: 4px !important; padding: 4px 8px !important; color: white !important;
        cursor: pointer !important; font-size: 10px !important; transition: all 0.2s !important;
      }
      .tnf-btn-small.selected {
        background: rgba(46,160,67,0.8) !important; border-color: rgba(46,160,67,1) !important;
      }
      .tnf-btn-small:hover { background: rgba(255,255,255,0.3) !important; }
      .tnf-chat-box { 
        min-height: 150px !important; display: flex !important; 
        flex-direction: column !important; flex: 1 !important; max-height: 300px !important;
      }
      .tnf-chat-messages {
        flex: 1 !important; background: rgba(0,0,0,0.2) !important; border-radius: 6px !important;
        padding: 8px !important; overflow-y: auto !important; margin-bottom: 8px !important; font-size: 11px !important;
      }
      .tnf-chat-input-area { display: flex !important; gap: 8px !important; }
      .tnf-chat-input-area input {
        flex: 1 !important; background: rgba(255,255,255,0.2) !important;
        border: 1px solid rgba(255,255,255,0.3) !important; border-radius: 6px !important;
        padding: 6px 8px !important; color: white !important; font-size: 11px !important;
      }
      .tnf-chat-message {
        margin-bottom: 8px !important; padding: 4px 8px !important;
        background: rgba(255,255,255,0.1) !important; border-radius: 4px !important; font-size: 11px !important;
      }
      .tnf-chat-message.outgoing { background: rgba(102,126,234,0.3) !important; margin-left: 20px !important; }
      .tnf-element-highlight {
        outline: 3px solid #ff6b6b !important; outline-offset: 2px !important;
        background: rgba(255,107,107,0.1) !important;
      }
      .tnf-element-hover {
        outline: 2px solid #4ecdc4 !important; outline-offset: 1px !important; cursor: crosshair !important;
      }
      /* Element selection overlay and effects */
      .tnf-selection-overlay {
        position: fixed !important; top: 0 !important; left: 0 !important;
        width: 100% !important; height: 100% !important;
        background: rgba(0, 122, 255, 0.1) !important; z-index: 999999998 !important;
        cursor: crosshair !important; pointer-events: none !important;
      }
      /* Ensure floating panel stays above overlay and clickable */
      #tnf-floating-panel {
        z-index: 999999999 !important; pointer-events: auto !important;
      }
      .tnf-element-highlight {
        position: fixed !important; background: rgba(255, 165, 0, 0.3) !important;
        border: 2px solid #ff6600 !important; z-index: 1000000 !important;
        pointer-events: none !important; box-shadow: 0 0 10px rgba(255, 165, 0, 0.5) !important;
      }
      #tnf-selection-instructions {
        position: fixed !important; top: 20px !important; left: 50% !important;
        transform: translateX(-50%) !important; background: #333 !important; color: white !important;
        padding: 15px 25px !important; border-radius: 8px !important; z-index: 1000001 !important;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif !important; font-size: 14px !important;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important; text-align: center !important;
      }
      /* Resize handles */
      .tnf-resize-handle {
        position: absolute !important; background: rgba(255,255,255,0.4) !important;
        z-index: 1000001 !important; transition: background 0.2s !important; opacity: 0.7 !important;
      }
      .tnf-resize-handle:hover { background: rgba(255,255,255,0.8) !important; opacity: 1 !important; }
      .tnf-resize-n, .tnf-resize-s {
        left: 12px !important; right: 12px !important; height: 8px !important; cursor: ns-resize !important;
      }
      .tnf-resize-e, .tnf-resize-w {
        top: 12px !important; bottom: 12px !important; width: 8px !important; cursor: ew-resize !important;
      }
      .tnf-resize-n { top: -4px !important; }
      .tnf-resize-s { bottom: -4px !important; }
      .tnf-resize-e { right: -4px !important; }
      .tnf-resize-w { left: -4px !important; }
      .tnf-resize-ne, .tnf-resize-nw, .tnf-resize-se, .tnf-resize-sw {
        width: 16px !important; height: 16px !important; border-radius: 50% !important;
      }
      .tnf-resize-ne { top: -4px !important; right: -4px !important; cursor: ne-resize !important; }
      .tnf-resize-nw { top: -4px !important; left: -4px !important; cursor: nw-resize !important; }
      .tnf-resize-se { bottom: -4px !important; right: -4px !important; cursor: se-resize !important; }
      .tnf-resize-sw { bottom: -4px !important; left: -4px !important; cursor: sw-resize !important; }
    `;
    document.head.appendChild(styleSheet);
  }

  autoDetectElements() {
    this.addChatMessage('🔍 Starting auto-detection...', 'system');
    
    // Enhanced input detection - look for various input types
    const inputSelectors = [
      'input[type="text"]',
      'textarea',
      '[contenteditable="true"]',
      '[role="textbox"]',
      'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"])'
    ];
    
    let input = null;
    for (const selector of inputSelectors) {
      const elements = document.querySelectorAll(selector);
      // Find the most likely input (visible and interactable)
      for (const el of elements) {
        if (this.isElementVisible(el)) {
          input = el;
          break;
        }
      }
      if (input) break;
    }
    
    // Common button selectors
    const buttonSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:not([disabled])',
      '[role="button"]'
    ];
    
    let button = null;
    for (const selector of buttonSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        if (this.isElementVisible(el)) {
          const text = el.textContent.toLowerCase();
          if (text.includes('send') || text.includes('submit') || text.includes('post')) {
            button = el;
            break;
          }
        }
      }
      if (button) break;
    }
    
    // Common output selectors
    const outputSelectors = [
      '.messages',
      '.chat-messages',
      '.conversation',
      '.message-container',
      '[role="log"]',
      '.message-list',
      '.chat-history'
    ];
    
    let output = null;
    for (const selector of outputSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        if (this.isElementVisible(el) && el.children.length > 0) {
          output = el;
          break;
        }
      }
      if (output) break;
    }
    
    // Update selected elements
    if (input) {
      this.selectedElements.input = input;
      this.updateElementDisplay('input', this.getElementSelector(input));
    }
    if (button) {
      this.selectedElements.button = button;
      this.updateElementDisplay('button', this.getElementSelector(button));
    }
    if (output) {
      this.selectedElements.output = output;
      this.updateElementDisplay('output', this.getElementSelector(output));
    }
    
    const found = [input ? 'input' : null, button ? 'button' : null, output ? 'output' : null]
      .filter(Boolean).join(', ');
    
    if (found) {
      this.addChatMessage(`✅ Found: ${found}`, 'system');
    } else {
      this.addChatMessage('❌ No elements found. Try manual selection.', 'system');
    }
  }
  
  startManualSelection() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'tnf-selection-overlay';
    document.body.appendChild(overlay);
    
    this.addChatMessage('🎯 Click on an element to select it. Press ESC to cancel.', 'system');
    
    let highlightedElement = null;
    
    const highlightElement = (element) => {
      if (highlightedElement) {
        highlightedElement.classList.remove('tnf-element-highlight');
      }
      element.classList.add('tnf-element-highlight');
      highlightedElement = element;
    };
    
    const removeHighlight = () => {
      if (highlightedElement) {
        highlightedElement.classList.remove('tnf-element-highlight');
        highlightedElement = null;
      }
    };
    
    const handleMouseOver = (e) => {
      if (e.target.closest('#tnf-floating-panel')) return;
      highlightElement(e.target);
    };
    
    const handleClick = (e) => {
      if (e.target.closest('#tnf-floating-panel')) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const element = e.target;
      
      // Determine element type
      let type = null;
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || 
          element.isContentEditable || element.getAttribute('role') === 'textbox') {
        type = 'input';
      } else if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button' ||
                 (element.tagName === 'INPUT' && element.type === 'submit')) {
        type = 'button';
      } else {
        type = 'output';
      }
      
      this.selectedElements[type] = element;
      this.updateElementDisplay(type, this.getElementSelector(element));
      this.addChatMessage(`✅ Selected ${type}: ${this.getElementSelector(element)}`, 'system');
      
      cleanup();
    };
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        this.addChatMessage('❌ Selection cancelled', 'system');
        cleanup();
      }
    };
    
    const cleanup = () => {
      removeHighlight();
      overlay.remove();
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
    
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown);
  }
  
  testElement(type) {
    const element = this.selectedElements[type];
    if (!element) {
      this.addChatMessage(`❌ No ${type} element selected`, 'system');
      return;
    }
    
    switch (type) {
      case 'input':
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          const testText = 'Test message from The New Fuse';
          element.value = testText;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          this.addChatMessage('✅ Test text inserted', 'system');
          setTimeout(() => {
            element.value = '';
            element.dispatchEvent(new Event('input', { bubbles: true }));
          }, 2000);
        }
        break;
        
      case 'button':
        // Highlight button instead of clicking
        element.style.outline = '3px solid #00ff00';
        this.addChatMessage('✅ Button highlighted (not clicked for safety)', 'system');
        setTimeout(() => {
          element.style.outline = '';
        }, 2000);
        break;
        
      case 'output':
        element.style.outline = '3px solid #ff9500';
        this.addChatMessage('✅ Output area highlighted', 'system');
        setTimeout(() => {
          element.style.outline = '';
        }, 2000);
        break;
    }
  }
  
  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && 
           style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
  }
  
  getElementSelector(element) {
    if (element.id) return '#' + element.id;
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').filter(c => c && !c.startsWith('tnf-'));
      if (classes.length > 0) return '.' + classes[0];
    }
    return element.tagName.toLowerCase();
  }
  
  updateElementDisplay(type, selector) {
    const display = document.getElementById(`tnf-${type}-display`);
    if (display) {
      display.textContent = selector.length > 20 ? selector.substring(0, 20) + '...' : selector;
      display.title = selector;
    }
  }
  
  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action || request.type) {
        case 'PING':
          sendResponse({ status: 'PONG' });
          break;
        case 'TOGGLE_FLOATING_PANEL':
          this.togglePanel();
          sendResponse({ success: true, visible: this.isVisible });
          break;
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
      return true;
    });
  }
  
  savePanelState() {
    const state = {
      visible: this.isVisible,
      position: {
        left: this.floatingPanel.style.left,
        top: this.floatingPanel.style.top
      },
      size: {
        width: this.floatingPanel.style.width,
        height: this.floatingPanel.style.height
      },
      wsUrl: document.getElementById('tnf-ws-url')?.value || 'ws://localhost:3710'
    };
    
    // Save per-page state
    const key = `tnf-state-${window.location.hostname}-${window.location.pathname}`;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save state:', e);
    }
  }
  
  loadPanelState() {
    // Load per-page state
    const key = `tnf-state-${window.location.hostname}-${window.location.pathname}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const state = JSON.parse(saved);
        
        if (state.position) {
          if (state.position.left) this.floatingPanel.style.left = state.position.left;
          if (state.position.top) this.floatingPanel.style.top = state.position.top;
        }
        
        if (state.size) {
          if (state.size.width) this.floatingPanel.style.width = state.size.width;
          if (state.size.height) this.floatingPanel.style.height = state.size.height;
        }
        
        if (state.wsUrl) {
          const urlInput = document.getElementById('tnf-ws-url');
          if (urlInput) urlInput.value = state.wsUrl;
        }
        
        // Only restore visibility if it was visible on this specific page
        if (state.visible) {
          this.showPanel();
        }
      }
    } catch (e) {
      console.warn('Failed to load state:', e);
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.theNewFuseContent) {
      window.theNewFuseContent = new TheNewFuseContent();
    }
  });
} else {
  if (!window.theNewFuseContent) {
    window.theNewFuseContent = new TheNewFuseContent();
  }
}
