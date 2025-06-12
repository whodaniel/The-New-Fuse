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
    
    // Enhanced WebSocket connection management (adapted from old working version)
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.initialReconnectDelay = 1000; // Start with 1 second like the old version
    this.maxReconnectDelay = 30000; // Max 30 seconds like the old version
    this.reconnectTimeout = null;
    this.connectionTimeout = null;
    this.isConnecting = false;
    this.manualDisconnect = false;
    this.retriesExhausted = false;
    
    // Connection health monitoring (simplified from old version)
    this.heartbeatInterval = null;
    this.heartbeatTimer = 30000; // 30 seconds like the old version
    this.missedHeartbeats = 0;
    this.maxMissedHeartbeats = 3;
    this.lastHeartbeatTime = 0;
    
    // Connection state tracking (from old version)
    this.connectionState = {
      connected: false,
      reconnecting: false,
      authenticating: false,
      lastError: null,
      connectionAttempts: 0,
      lastConnectTime: 0
    };
    
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
      #tnf-selection-overlay {
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

  showPanel() {
    this.floatingPanel.style.display = 'block';
    this.isVisible = true;
    this.panelExplicitlyClosed = false; // Reset explicit close flag when showing panel
    this.savePanelState();
    // Update chat box height after panel is shown and check server status
    setTimeout(() => {
      this.updateChatBoxHeight();
      this.checkServerStatus();
      this.updateServerStatus('Stopped', 'stopped'); // Initialize server status
    }, 100);
  }

  checkServerStatus() {
    const urlInput = document.getElementById('tnf-ws-url');
    const url = urlInput ? urlInput.value.trim() : 'ws://localhost:3710';
    
    // Quick check to see if server is running
    const tempWs = new WebSocket(url);
    
    tempWs.onopen = () => {
      if (this.serverState === 'stopped') {
        this.updateServerStatus('Running (External)', 'running');
        this.addChatMessage('✅ WebSocket server detected and ready', 'system');
      }
      tempWs.close();
    };
    
    tempWs.onerror = () => {
      if (this.serverState !== 'starting') {
        this.updateServerStatus('Stopped', 'stopped');
        this.addChatMessage('⚠️ WebSocket server not detected. Click "Start Server" to begin.', 'system');
      }
    };
    
    tempWs.onclose = () => {
      // Clean up - this will fire for both success and error cases
    };
    
    // Clean up after 2 seconds regardless
    setTimeout(() => {
      if (tempWs.readyState === WebSocket.CONNECTING) {
        tempWs.close();
      }
    }, 2000);
  }

  hidePanel() {
    console.log('TNF: hidePanel() called, current visibility:', this.isVisible);
    
    if (!this.floatingPanel) {
      console.error('TNF: floatingPanel not found when trying to hide');
      return;
    }
    
    this.floatingPanel.style.display = 'none';
    this.isVisible = false;
    
    // Mark panel as explicitly closed by user
    this.panelExplicitlyClosed = true;
    this.savePanelState();
    
    console.log('TNF: Panel hidden successfully and marked as explicitly closed');
  }

  togglePanel() { 
    if (this.isVisible) {
      this.hidePanel();
    } else {
      this.showPanel();
    }
  }

  setupPanelEventListeners() {
    // Wait a bit longer to ensure DOM is fully ready
    const setupWithRetry = (attempt = 0) => {
      const closeBtn = document.getElementById('tnf-close');
      const minimizeBtn = document.getElementById('tnf-minimize');
      
      if (!closeBtn || !minimizeBtn) {
        if (attempt < 5) {
          console.warn(`TNF: Buttons not found, retrying in ${50 * (attempt + 1)}ms (attempt ${attempt + 1})`);
          setTimeout(() => setupWithRetry(attempt + 1), 50 * (attempt + 1));
          return;
        } else {
          console.error('TNF: Panel buttons not found after multiple attempts');
          return;
        }
      }
      
      console.log('TNF: Setting up event listeners for panel buttons');
      
      // Remove any existing event listeners by cloning nodes
      const newCloseBtn = closeBtn.cloneNode(true);
      closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
      
      const newMinimizeBtn = minimizeBtn.cloneNode(true);
      minimizeBtn.parentNode.replaceChild(newMinimizeBtn, minimizeBtn);
      
      // Add event listeners with comprehensive error handling
      document.getElementById('tnf-close').addEventListener('click', (e) => {
        console.log('TNF: Close button clicked');
        e.preventDefault();
        e.stopPropagation();
        try {
          this.hidePanel();
        } catch (error) {
          console.error('TNF: Error hiding panel:', error);
        }
      });
      
      document.getElementById('tnf-minimize').addEventListener('click', (e) => {
        console.log('TNF: Minimize button clicked');
        e.preventDefault();
        e.stopPropagation();
        try {
          this.hidePanel();
        } catch (error) {
          console.error('TNF: Error minimizing panel:', error);
        }
      });
      
      // Setup other event listeners with error checking and retry logic
      const setupEventListener = (id, handler, description) => {
        const element = document.getElementById(id);
        if (element) {
          try {
            element.addEventListener('click', (e) => {
              try {
                handler();
              } catch (error) {
                console.error(`TNF: Error in ${description} handler:`, error);
                this.addChatMessage(`❌ Error: ${error.message}`, 'system');
              }
            });
            console.log(`TNF: ${description} event listener attached`);
          } catch (error) {
            console.error(`TNF: Failed to attach ${description} event listener:`, error);
          }
        } else {
          console.warn(`TNF: Element ${id} not found for ${description}`);
        }
      };
      
      setupEventListener('tnf-connect', () => this.toggleWebSocketConnection(), 'Connect button');
      setupEventListener('tnf-reconnect', () => this.manualReconnect(), 'Reconnect button');
      setupEventListener('tnf-start-server', () => this.toggleWebSocketServer(), 'Start server button');
      setupEventListener('tnf-auto-detect', () => this.autoDetectElements(), 'Auto detect button');
      setupEventListener('tnf-manual-select', () => this.showElementTypeSelector(), 'Manual select button');
      setupEventListener('tnf-test-input', () => this.testElement('input'), 'Test input button');
      setupEventListener('tnf-test-button', () => this.testElement('button'), 'Test button button');
      setupEventListener('tnf-test-output', () => this.testElement('output'), 'Test output button');
      setupEventListener('tnf-send-chat', () => this.sendChatMessage(), 'Send chat button');
      
      // Chat input enter key handler
      const chatInput = document.getElementById('tnf-chat-input');
      if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            try {
              this.sendChatMessage();
            } catch (error) {
              console.error('TNF: Error sending chat message:', error);
              this.addChatMessage(`❌ Error sending message: ${error.message}`, 'system');
            }
          }
        });
        console.log('TNF: Chat input enter key listener attached');
      } else {
        console.warn('TNF: Chat input not found');
      }
      
      console.log('TNF: All event listeners attached successfully');
    };
    
    setupWithRetry();
  }

  makePanelDraggable() {
    const header = this.floatingPanel.querySelector('.tnf-panel-header');
    let isDragging = false, dragOffset = { x: 0, y: 0 };

    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      
      // Get current position
      const rect = this.floatingPanel.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;
      
      // Ensure we use left/top positioning for dragging
      this.floatingPanel.style.right = 'auto';
      this.floatingPanel.style.bottom = 'auto';
      this.floatingPanel.style.left = rect.left + 'px';
      this.floatingPanel.style.top = rect.top + 'px';
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      e.preventDefault();
    });

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const newX = Math.max(0, Math.min(window.innerWidth - this.floatingPanel.offsetWidth, e.clientX - dragOffset.x));
      const newY = Math.max(0, Math.min(window.innerHeight - this.floatingPanel.offsetHeight, e.clientY - dragOffset.y));
      
      this.floatingPanel.style.left = newX + 'px';
      this.floatingPanel.style.top = newY + 'px';
    };

    const handleMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      this.savePanelState();
    };
  }

  makePanelResizable() {
    const resizeHandles = this.floatingPanel.querySelectorAll('.tnf-resize-handle');
    let isResizing = false;
    let resizeDirection = '';
    let startX = 0, startY = 0;
    let startWidth = 0, startHeight = 0;
    let startLeft = 0, startTop = 0;

    resizeHandles.forEach(handle => {
      handle.addEventListener('mousedown', (e) => {
        e.stopPropagation(); // Prevent dragging
        e.preventDefault();
        
        isResizing = true;
        resizeDirection = handle.dataset.direction;
        startX = e.clientX;
        startY = e.clientY;
        
        const rect = this.floatingPanel.getBoundingClientRect();
        startWidth = rect.width;
        startHeight = rect.height;
        startLeft = rect.left;
        startTop = rect.top;
        
        // Switch to left/top positioning if needed
        this.floatingPanel.style.right = 'auto';
        this.floatingPanel.style.bottom = 'auto';
        this.floatingPanel.style.left = startLeft + 'px';
        this.floatingPanel.style.top = startTop + 'px';

        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', handleResizeEnd);
      });
    });

    const handleResizeMove = (e) => {
      if (!isResizing) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      let newWidth = startWidth;
      let newHeight = startHeight;
      let newLeft = startLeft;
      let newTop = startTop;

      // Handle horizontal resizing
      if (resizeDirection.includes('e')) {
        newWidth = Math.max(300, Math.min(600, startWidth + deltaX));
      } else if (resizeDirection.includes('w')) {
        newWidth = Math.max(300, Math.min(600, startWidth - deltaX));
        newLeft = startLeft + (startWidth - newWidth);
      }

      // Handle vertical resizing
      if (resizeDirection.includes('s')) {
        newHeight = Math.max(400, Math.min(window.innerHeight * 0.9, startHeight + deltaY));
      } else if (resizeDirection.includes('n')) {
        newHeight = Math.max(400, Math.min(window.innerHeight * 0.9, startHeight - deltaY));
        newTop = startTop + (startHeight - newHeight);
      }

      // Apply constraints to keep panel on screen
      newLeft = Math.max(0, Math.min(window.innerWidth - newWidth, newLeft));
      newTop = Math.max(0, Math.min(window.innerHeight - newHeight, newTop));

      // Apply new dimensions and position
      this.floatingPanel.style.width = newWidth + 'px';
      this.floatingPanel.style.height = newHeight + 'px';
      this.floatingPanel.style.left = newLeft + 'px';
      this.floatingPanel.style.top = newTop + 'px';

      // Update chat box height to be responsive
      this.updateChatBoxHeight();
    };

    const handleResizeEnd = () => {
      isResizing = false;
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      this.savePanelState();
    };
  }

  updateChatBoxHeight() {
    const chatBox = document.querySelector('.tnf-chat-box');
    const chatSection = chatBox ? chatBox.closest('.tnf-section') : null;
    if (!chatBox || !chatSection) return;
    
    const panelContent = this.floatingPanel.querySelector('.tnf-panel-content');
    if (!panelContent) return;
    
    try {
      // Get actual panel content dimensions
      const panelRect = panelContent.getBoundingClientRect();
      
      // Calculate space taken by other sections
      const otherSections = Array.from(panelContent.children).filter(el => el !== chatSection);
      let otherSectionsHeight = 0;
      
      otherSections.forEach(section => {
        const sectionRect = section.getBoundingClientRect();
        otherSectionsHeight += sectionRect.height;
      });
      
      // Account for gaps, padding, and margins (more generous calculation)
      const gapPadding = 60; // section gaps + content padding
      const sectionPadding = 40; // chat section internal padding
      
      // Calculate available height for chat box
      const availableHeight = panelRect.height - otherSectionsHeight - gapPadding - sectionPadding;
      
      // Set reasonable constraints
      const minHeight = 120;
      const maxHeight = Math.max(300, availableHeight);
      const finalHeight = Math.max(minHeight, Math.min(maxHeight, availableHeight));
      
      // Apply the new height
      chatBox.style.height = finalHeight + 'px';
      chatBox.style.minHeight = minHeight + 'px';
      
      // Ensure chat messages container is also properly sized
      const chatMessages = chatBox.querySelector('.tnf-chat-messages');
      if (chatMessages) {
        const inputArea = chatBox.querySelector('.tnf-chat-input-area');
        const inputHeight = inputArea ? inputArea.offsetHeight : 40;
        chatMessages.style.height = (finalHeight - inputHeight - 16) + 'px'; // 16px for gaps
      }
    } catch (error) {
      console.warn('Error updating chat box height:', error);
      // Fallback to reasonable default
      chatBox.style.height = '200px';
    }
  }

  toggleWebSocketConnection() { 
    if (this.isConnected) {
      this.disconnectWebSocket();
    } else {
      this.connectWebSocket();
    }
  }

  connectWebSocket() {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting || this.connectionState.reconnecting) {
      console.log('Connection attempt already in progress');
      return;
    }

    const urlInput = document.getElementById('tnf-ws-url');
    let url = urlInput ? urlInput.value.trim() : '';
    
    // Use default URL if empty or invalid
    if (!url || (!url.startsWith('ws://') && !url.startsWith('wss://'))) {
      url = 'ws://localhost:3710';
      if (urlInput) urlInput.value = url;
    }

    // Clear any existing connection timeout
    this.clearConnectionTimeout();

    // Update connection state
    this.isConnecting = true;
    this.manualDisconnect = false;
    this.connectionState.reconnecting = true;
    this.connectionState.connectionAttempts++;
    this.connectionState.lastConnectTime = Date.now();
    
    this.updateConnectionStatus('Connecting...', false);
    this.addChatMessage('🔄 Connecting to WebSocket...', 'system');
    
    try {
      this.websocket = new WebSocket(url);
      
      // Enable binary message handling
      this.websocket.binaryType = "arraybuffer";
      
      // Set connection timeout that increases with each attempt
      const timeoutDuration = Math.min(5000 + (this.connectionState.connectionAttempts * 2000), 15000);
      this.connectionTimeout = setTimeout(() => {
        if (this.websocket && this.websocket.readyState === WebSocket.CONNECTING) {
          this.websocket.close();
          this.connectionState.lastError = 'Connection timeout';
          this.addChatMessage('❌ Connection timeout. Make sure the server is running.', 'system');
          this.updateConnectionStatus('Connection Timeout', false);
          this.isConnecting = false;
          this.connectionState.reconnecting = false;
          
          // Try to reconnect if not manually disconnected
          if (!this.manualDisconnect && !this.retriesExhausted) {
            this.attemptReconnection();
          }
        }
      }, timeoutDuration);
      
      this.websocket.onopen = () => {
        this.clearConnectionTimeout();
        
        // Update connection state
        this.isConnected = true;
        this.isConnecting = false;
        this.connectionState.connected = true;
        this.connectionState.reconnecting = false;
        this.connectionState.lastError = null;
        this.retriesExhausted = false;
        
        // Reset reconnection attempts on successful connection
        this.reconnectAttempts = 0;
        this.currentReconnectDelay = this.initialReconnectDelay;
        
        this.updateConnectionStatus('Connected', true);
        this.addChatMessage('🟢 Connected to WebSocket successfully', 'system');
        this.savePanelState(); // Save successful URL
        
        // Start heartbeat mechanism
        this.startHeartbeat();
      };
      
      this.websocket.onmessage = (event) => {
        this.handleWebSocketMessage(event);
      };
      
      this.websocket.onclose = (event) => {
        this.clearConnectionTimeout();
        this.stopHeartbeat();
        
        // Update connection state
        this.isConnected = false;
        this.isConnecting = false;
        this.connectionState.connected = false;
        this.connectionState.reconnecting = false;
        
        this.updateConnectionStatus('Disconnected', false);
        
        if (event.wasClean || this.manualDisconnect) {
          this.addChatMessage('🔴 Disconnected from WebSocket', 'system');
          this.reconnectAttempts = 0; // Reset on clean disconnect
          this.connectionState.lastError = null;
        } else {
          this.connectionState.lastError = `Connection closed unexpectedly (Code: ${event.code})`;
          this.addChatMessage('🔴 WebSocket connection lost unexpectedly', 'system');
          
          // Try to reconnect if not manually disconnected and retries not exhausted
          if (!this.manualDisconnect && !this.retriesExhausted) {
            this.attemptReconnection();
          }
        }
      };
      
      this.websocket.onerror = (error) => {
        this.clearConnectionTimeout();
        this.isConnecting = false;
        this.connectionState.reconnecting = false;
        
        // Extract meaningful error information
        let errorMessage = 'Unknown WebSocket error';
        if (error.type) {
          errorMessage = `WebSocket ${error.type} event`;
        }
        if (error.target && error.target.readyState !== undefined) {
          const readyStates = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
          errorMessage += ` (ReadyState: ${readyStates[error.target.readyState] || error.target.readyState})`;
        }
        if (error.target && error.target.url) {
          errorMessage += ` for URL: ${error.target.url}`;
        }
        
        this.connectionState.lastError = errorMessage;
        
        console.error('WebSocket error details:', {
          type: error.type,
          target: error.target,
          readyState: error.target?.readyState,
          url: error.target?.url,
          originalError: error
        });
        
        this.addChatMessage(`❌ WebSocket connection failed: ${errorMessage}. Make sure the server is running on the specified port.`, 'system');
        this.isConnected = false;
        this.updateConnectionStatus('Connection Error', false);
        
        // Try to reconnect if not manually disconnected and retries not exhausted
        if (!this.manualDisconnect && !this.retriesExhausted) {
          this.attemptReconnection();
        }
      };
      
    } catch (error) {
      this.clearConnectionTimeout();
      this.isConnecting = false;
      this.connectionState.reconnecting = false;
      this.connectionState.lastError = error.message;
      
      console.error('Error creating WebSocket connection:', error);
      this.addChatMessage(`❌ Failed to create WebSocket connection: ${error.message}`, 'system');
      this.updateConnectionStatus('Connection Error', false);
      
      // Try to reconnect if not manually disconnected and retries not exhausted
      if (!this.manualDisconnect && !this.retriesExhausted) {
        this.attemptReconnection();
      }
    }
  }

  disconnectWebSocket() {
    // Clear any pending reconnection attempts
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Clear connection timeout and stop heartbeat
    this.clearConnectionTimeout();
    this.stopHeartbeat();
    
    this.manualDisconnect = true;
    this.reconnectAttempts = 0;
    
    if (this.websocket) {
      this.websocket.close(1000, 'Manual disconnect');
      this.websocket = null;
    }
    
    this.isConnected = false;
    this.isConnecting = false;
    this.connectionState.connected = false;
    this.connectionState.reconnecting = false;
    this.updateConnectionStatus('Disconnected', false);
    this.addChatMessage('🔴 Disconnected from WebSocket', 'system');
  }

  clearConnectionTimeout() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  startHeartbeat() {
    // Clear any existing heartbeat
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        try {
          // Send ping message
          this.websocket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
          this.missedHeartbeats++;
          
          // Check if we've missed too many heartbeats
          if (this.missedHeartbeats >= this.maxMissedHeartbeats) {
            this.addChatMessage('💔 Connection health check failed - too many missed heartbeats', 'system');
            this.stopHeartbeat();
            
            // Close connection to trigger reconnection
            if (this.websocket) {
              this.websocket.close(1000, 'Heartbeat timeout');
            }
          }
        } catch (error) {
          console.error('Error sending heartbeat:', error);
          this.stopHeartbeat();
        }
      } else {
        // Connection is not open, stop heartbeat
        this.stopHeartbeat();
      }
    }, this.heartbeatTimer);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.missedHeartbeats = 0;
  }

  attemptReconnection() {
    // Check if we've reached the maximum number of attempts
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.retriesExhausted = true;
      this.connectionState.reconnecting = false;
      this.addChatMessage(`❌ Maximum reconnection attempts (${this.maxReconnectAttempts}) reached. Please reconnect manually.`, 'system');
      this.updateConnectionStatus('Max Retries Reached', false);
      return;
    }

    // Clear any existing timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    this.connectionState.reconnecting = true;
    
    // Calculate exponential backoff delay using new variables: 1s, 2s, 4s, 8s, 16s, 30s (capped)
    this.currentReconnectDelay = Math.min(
      this.currentReconnectDelay * 2,
      this.maxReconnectDelay
    );
    
    this.addChatMessage(`🔄 Attempting to reconnect in ${this.currentReconnectDelay/1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`, 'system');
    this.updateConnectionStatus(`Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})`, false);
    
    this.reconnectTimeout = setTimeout(() => {
      this.addChatMessage(`🔄 Reconnection attempt ${this.reconnectAttempts}...`, 'system');
      this.connectWebSocket();
    }, this.currentReconnectDelay);
  }

  resetReconnectionState() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.clearConnectionTimeout();
    this.stopHeartbeat();
    
    this.reconnectAttempts = 0;
    this.currentReconnectDelay = this.initialReconnectDelay;
    this.isConnecting = false;
    this.manualDisconnect = false;
    this.retriesExhausted = false;
    
    // Reset connection state
    this.connectionState.reconnecting = false;
    this.connectionState.lastError = null;
    this.connectionState.connectionAttempts = 0;
  }

  manualReconnect() {
    // Reset the reconnection state and attempt to connect
    this.resetReconnectionState();
    this.addChatMessage('🔄 Manual reconnection initiated...', 'system');
    this.connectWebSocket();
  }

  updateConnectionStatus(status, connected) {
    const statusEl = document.getElementById('tnf-connection-status');
    const connectBtn = document.getElementById('tnf-connect');
    const reconnectBtn = document.getElementById('tnf-reconnect');
    
    if (statusEl) {
      statusEl.textContent = status;
      statusEl.className = connected ? 'tnf-status connected' : 'tnf-status';
    }
    
    if (connectBtn) {
      connectBtn.textContent = connected ? 'Disconnect' : 'Connect';
      connectBtn.className = connected ? 'tnf-btn-connect connected' : 'tnf-btn-connect';
      
      // Hide/show connect button based on reconnection state
      if (this.retriesExhausted && !connected) {
        connectBtn.style.display = 'none';
      } else {
        connectBtn.style.display = 'inline-block';
      }
    }
    
    // Show/hide reconnect button when max retries reached
    if (reconnectBtn) {
      if (this.retriesExhausted && !connected) {
        reconnectBtn.style.display = 'inline-block';
        reconnectBtn.disabled = false;
      } else {
        reconnectBtn.style.display = 'none';
      }
    }
  }

  updateServerStatus(status, state) {
    const serverStatusEl = document.getElementById('tnf-server-status');
    const startServerBtn = document.getElementById('tnf-start-server');
    
    if (serverStatusEl) {
      serverStatusEl.textContent = `Server: ${status}`;
      serverStatusEl.className = `tnf-server-status ${state}`;
    }
    
    if (startServerBtn) {
      startServerBtn.className = `tnf-btn-start ${state}`;
      startServerBtn.disabled = (state === 'starting' || state === 'stopping');
      
      switch (state) {
        case 'stopped':
          startServerBtn.textContent = 'Start Server';
          break;
        case 'starting':
          startServerBtn.textContent = 'Starting...';
          startServerBtn.classList.add('loading');
          break;
        case 'running':
          startServerBtn.textContent = 'Stop Server';
          startServerBtn.classList.remove('loading');
          break;
        case 'stopping':
          startServerBtn.textContent = 'Stopping...';
          startServerBtn.classList.add('loading');
          break;
      }
    }
    
    this.serverState = state;
  }

  toggleWebSocketServer() {
    if (this.serverState === 'stopped') {
      this.startWebSocketServer();
    } else if (this.serverState === 'running') {
      this.stopWebSocketServer();
    }
    // Do nothing if starting or stopping
  }

  startWebSocketServer() {
    console.log('TNF: Starting WebSocket server...');
    this.updateServerStatus('Starting...', 'starting');
    
    // Check if Chrome APIs are available
    if (typeof chrome === 'undefined' || !chrome.runtime) {
      this.addChatMessage('❌ Chrome extension APIs not available', 'system');
      this.updateServerStatus('Failed', 'stopped');
      return;
    }
    
    try {
      chrome.runtime.sendMessage({
        type: 'START_WS_SERVER',
        port: this.getPortFromUrl()
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('TNF: Error starting server:', chrome.runtime.lastError);
          this.addChatMessage(`❌ Failed to start server: ${chrome.runtime.lastError.message}`, 'system');
          this.updateServerStatus('Failed', 'stopped');
        } else if (response && response.success) {
          this.updateServerStatus('Running', 'running');
          this.addChatMessage('✅ WebSocket server started successfully', 'system');
        } else {
          this.updateServerStatus('Failed', 'stopped');
          this.addChatMessage('❌ Failed to start WebSocket server', 'system');
        }
      });
    } catch (error) {
      console.error('TNF: Error starting WebSocket server:', error);
      this.addChatMessage(`❌ Error starting server: ${error.message}`, 'system');
      this.updateServerStatus('Failed', 'stopped');
    }
  }

  stopWebSocketServer() {
    console.log('TNF: Stopping WebSocket server...');
    this.updateServerStatus('Stopping...', 'stopping');
    
    // Check if Chrome APIs are available
    if (typeof chrome === 'undefined' || !chrome.runtime) {
      this.addChatMessage('❌ Chrome extension APIs not available', 'system');
      this.updateServerStatus('Stopped', 'stopped');
      return;
    }
    
    try {
      chrome.runtime.sendMessage({
        type: 'STOP_WS_SERVER',
        port: this.getPortFromUrl()
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('TNF: Error stopping server:', chrome.runtime.lastError);
          this.addChatMessage(`❌ Failed to stop server: ${chrome.runtime.lastError.message}`, 'system');
        } else {
          this.updateServerStatus('Stopped', 'stopped');
          this.addChatMessage('🔴 WebSocket server stopped successfully', 'system');
        }
      });
    } catch (error) {
      console.error('TNF: Error stopping WebSocket server:', error);
      this.addChatMessage(`❌ Error stopping server: ${error.message}`, 'system');
      this.updateServerStatus('Stopped', 'stopped');
    }
  }

  sendChatMessage() {
    const input = document.getElementById('tnf-chat-input');
    const message = input.value.trim();
    if (!message) return;
    
    // Send to WebSocket if connected
    if (this.isConnected && this.websocket) {
      this.websocket.send(JSON.stringify({
        type: 'chat', message: message, source: 'chrome-extension',
        url: window.location.href, timestamp: Date.now()
      }));
    }
    
    // Also send to page's chat input if available
    this.sendToPageChatInput(message);
    
    // Add to extension chat
    this.addChatMessage(message, 'outgoing');
    input.value = '';
  }

  sendToPageChatInput(message) {
    let messageSent = false;
    
    // Try to find and fill the page's actual chat input
    if (this.selectedElements.input) {
      const pageInput = this.selectedElements.input;
      messageSent = this.fillInputElement(pageInput, message);
      if (messageSent) {
        this.addChatMessage('💬 Message sent to selected page input', 'system');
        // If there's a selected button, try to click it
        if (this.selectedElements.button) {
          setTimeout(() => {
            this.selectedElements.button.click();
            this.addChatMessage('🔘 Submit button clicked', 'system');
          }, 500);
        }
        return;
      }
    }
    
    // Enhanced auto-detection with common chat app patterns
    const inputSelectors = [
      // Specific chat app patterns
      '[data-testid*="message"]input',
      '[data-testid*="chat"]input',
      '[aria-label*="message" i]',
      '[aria-label*="chat" i]',
      '[placeholder*="message" i]',
      '[placeholder*="chat" i]',
      '[placeholder*="type" i]',
      
      // General selectors
      'input[type="text"]',
      'textarea',
      '[contenteditable="true"]',
      '[role="textbox"]',
      
      // Common class patterns
      '.message-input',
      '.chat-input',
      '.text-input',
      '.compose-input',
      
      // Fallback to any visible text input
      'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="hidden"])'
    ];
    
    for (const selector of inputSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const input of elements) {
        if (this.isElementVisible(input) && !input.disabled && !input.readOnly) {
          if (this.fillInputElement(input, message)) {
            this.addChatMessage('💬 Message sent to auto-detected page input', 'system');
            // Try to find and click submit button
            this.autoClickSubmitButton(input);
            messageSent = true;
            break;
          }
        }
      }
      if (messageSent) break;
    }
    
    if (!messageSent) {
      this.addChatMessage('⚠️ No suitable input field found on this page', 'system');
    }
  }

  fillInputElement(element, message) {
    try {
      if (element.tagName.toLowerCase() === 'textarea' || element.tagName.toLowerCase() === 'input') {
        element.value = message;
        element.focus();
        
        // Trigger multiple events to ensure the page recognizes the change
        element.dispatchEvent(new Event('focus', { bubbles: true }));
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
        
        return true;
      } else if (element.isContentEditable) {
        element.textContent = message;
        element.focus();
        
        // Trigger events for contenteditable
        element.dispatchEvent(new Event('focus', { bubbles: true }));
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        
        return true;
      }
    } catch (error) {
      console.warn('Error filling input element:', error);
    }
    return false;
  }

  autoClickSubmitButton(inputElement) {
    // Try to find submit button near the input
    const buttonSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      '[role="button"]',
      'button'
    ];
    
    // Look for buttons with submit-like text
    const submitTexts = ['send', 'submit', 'post', 'reply', 'enter', '→', '▶'];
    
    // First, try to find buttons in the same form or container
    let container = inputElement.closest('form') || 
                   inputElement.closest('div') || 
                   inputElement.parentElement;
    
    for (let level = 0; level < 3 && container; level++) {
      for (const selector of buttonSelectors) {
        const buttons = container.querySelectorAll(selector);
        for (const button of buttons) {
          if (this.isElementVisible(button) && !button.disabled) {
            const buttonText = button.textContent.toLowerCase().trim();
            const hasSubmitText = submitTexts.some(text => buttonText.includes(text));
            const isSubmitType = button.type === 'submit';
            
            if (isSubmitType || hasSubmitText) {
              setTimeout(() => {
                button.click();
                this.addChatMessage('🔘 Auto-clicked submit button', 'system');
              }, 500);
              return;
            }
          }
        }
      }
      container = container.parentElement;
    }
  }

  addChatMessage(message, type) {
    const container = document.getElementById('tnf-chat-messages');
    const messageEl = document.createElement('div');
    messageEl.className = 'tnf-chat-message ' + type;
    messageEl.textContent = message;
    container.appendChild(messageEl);
    container.scrollTop = container.scrollHeight;
    while (container.children.length > 50) container.removeChild(container.firstChild);
  }

  handleWebSocketMessage(event) {
    let data;
    
    try {
      // Handle binary messages (ArrayBuffer)
      if (event.data instanceof ArrayBuffer) {
        // Convert ArrayBuffer to string for processing
        const decoder = new TextDecoder();
        const messageString = decoder.decode(event.data);
        
        try {
          data = JSON.parse(messageString);
          this.addChatMessage('📨 Binary message received and processed', 'system');
        } catch (parseError) {
          this.addChatMessage('📨 Raw binary message: ' + messageString, 'incoming');
          return;
        }
      } 
      // Handle text messages
      else if (typeof event.data === 'string') {
        try {
          data = JSON.parse(event.data);
        } catch (parseError) {
          this.addChatMessage('📨 Raw message: ' + event.data, 'incoming');
          return;
        }
      }
      // Handle Blob messages (convert to text first)
      else if (event.data instanceof Blob) {
        event.data.text().then(text => {
          try {
            data = JSON.parse(text);
            this.processMessage(data);
          } catch (parseError) {
            this.addChatMessage('📨 Raw blob message: ' + text, 'incoming');
          }
        });
        return;
      }
      // Unknown message type
      else {
        this.addChatMessage('❓ Unknown message type received', 'system');
        return;
      }
      
      this.processMessage(data);
      
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      this.addChatMessage('❌ Error processing message: ' + error.message, 'system');
    }
  }

  processMessage(data) {
    // Handle heartbeat response (pong)
    if (data.type === 'pong') {
      this.missedHeartbeats = 0; // Reset missed heartbeats counter
      return;
    }
    
    // Handle ping (send pong back)
    if (data.type === 'ping') {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        try {
          this.websocket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        } catch (error) {
          console.error('Error sending pong response:', error);
        }
      }
      return;
    }
    
    // Handle regular messages
    if (data.type === 'chat') {
      this.addChatMessage(data.message, 'incoming');
    } else if (data.type === 'command') {
      this.handleCommand(data);
    } else if (data.type === 'welcome') {
      this.addChatMessage(data.message, 'system');
    } else {
      // Handle unknown message types
      this.addChatMessage(`📨 Unknown message type '${data.type}': ${JSON.stringify(data)}`, 'incoming');
    }
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
        if (this.isElementVisible(el) && !el.disabled && !el.readOnly) {
          input = el;
          break;
        }
      }
      if (input) break;
    }
    
    // Enhanced button detection - look for submit buttons and send buttons
    const buttonSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:contains("Send")',
      'button:contains("Submit")',
      '[role="button"]',
      '.send-button',
      '.submit-button',
      'button'
    ];
    
    let button = null;
    for (const selector of buttonSelectors) {
      let elements;
      if (selector.includes(':contains')) {
        // Custom contains logic for send/submit buttons
        const tag = selector.split(':')[0];
        elements = document.querySelectorAll(tag);
        elements = Array.from(elements).filter(el => 
          el.textContent.toLowerCase().includes('send') || 
          el.textContent.toLowerCase().includes('submit')
        );
      } else {
        elements = document.querySelectorAll(selector);
      }
      
      for (const el of elements) {
        if (this.isElementVisible(el) && !el.disabled) {
          button = el;
          break;
        }
      }
      if (button) break;
    }
    
    // Enhanced output detection - look for message containers
    const outputSelectors = [
      '.messages',
      '.chat-messages', 
      '.conversation',
      '.message-container',
      '.chat-container',
      '[role="log"]',
      '.message-list',
      '.chat-log',
      '.output',
      '.responses',
      '.chat-history',
      '.message-area',
      '.conversation-area',
      '[data-testid*="message"]',
      '[data-testid*="chat"]',
      '[class*="message"]',
      '[class*="chat"]',
      '[id*="message"]',
      '[id*="chat"]',
      // Common chat app patterns
      'div[role="main"]', // Many chat apps use this
      '.thread-messages',
      '.conversation-thread',
      'main', // Sometimes the main content area
      '[data-cy*="message"]',
      '[data-qa*="message"]'
    ];
    
    let output = null;
    for (const selector of outputSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        if (this.isElementVisible(el) && this.isLikelyOutputContainer(el)) {
          output = el;
          break;
        }
      }
      if (output) break;
    }
    
    // Fallback: look for elements that contain multiple child elements (likely message containers)
    if (!output) {
      const allDivs = document.querySelectorAll('div');
      for (const div of allDivs) {
        if (this.isElementVisible(div) && this.isLikelyOutputContainer(div)) {
          output = div;
          break;
        }
      }
    }

    // Update selected elements and display
    if (input) { 
      this.selectedElements.input = input; 
      this.updateElementDisplay('input', this.getElementSelector(input)); 
      this.addChatMessage('✅ Input element detected', 'system');
    } else {
      this.addChatMessage('❌ No input element found', 'system');
    }
    
    if (button) { 
      this.selectedElements.button = button; 
      this.updateElementDisplay('button', this.getElementSelector(button)); 
      this.addChatMessage('✅ Button element detected', 'system');
    } else {
      this.addChatMessage('❌ No button element found', 'system');
    }
    
    if (output) { 
      this.selectedElements.output = output; 
      this.updateElementDisplay('output', this.getElementSelector(output)); 
      this.addChatMessage('✅ Output element detected', 'system');
    } else {
      this.addChatMessage('❌ No output element found', 'system');
    }
    
    this.addChatMessage('🔍 Auto-detection completed', 'system');
  }

  showElementTypeSelector() {
    // This method shows the element type selector UI for manual selection
    console.log('TNF: Starting manual element selection mode');
    
    // Create element type selection UI
    const existingSelector = document.getElementById('tnf-element-selector');
    if (existingSelector) {
      existingSelector.remove();
    }
    
    const selectorDiv = document.createElement('div');
    selectorDiv.id = 'tnf-element-selector';
    selectorDiv.innerHTML = `
      <div style="position: fixed; top: 20px; left: 20px; background: white; border: 2px solid #333; padding: 15px; z-index: 999999999; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
        <h4 style="margin: 0 0 10px 0; color: #333;">Select Element Type</h4>
        <button id="tnf-select-input" style="display: block; width: 100%; margin: 5px 0; padding: 8px; background: #007cba; color: white; border: none; border-radius: 4px; cursor: pointer;">Select Input Field</button>
        <button id="tnf-select-button" style="display: block; width: 100%; margin: 5px 0; padding: 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Select Submit Button</button>
        <button id="tnf-select-output" style="display: block; width: 100%; margin: 5px 0; padding: 8px; background: #ffc107; color: black; border: none; border-radius: 4px; cursor: pointer;">Select Output Area</button>
        <button id="tnf-cancel-selection" style="display: block; width: 100%; margin: 10px 0 0 0; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
      </div>
    `;
    
    document.body.appendChild(selectorDiv);
    
    // Add event listeners for selection
    document.getElementById('tnf-select-input').addEventListener('click', () => {
      this.startElementSelection('input');
      selectorDiv.remove();
    });
    
    document.getElementById('tnf-select-button').addEventListener('click', () => {
      this.startElementSelection('button');
      selectorDiv.remove();
    });
    
    document.getElementById('tnf-select-output').addEventListener('click', () => {
      this.startElementSelection('output');
      selectorDiv.remove();
    });
    
    document.getElementById('tnf-cancel-selection').addEventListener('click', () => {
      selectorDiv.remove();
      this.addChatMessage('❌ Element selection cancelled', 'system');
    });
  }

  startElementSelection(type) {
    this.currentSelectionType = type;
    this.elementDetectionMode = true;
    
    // Create overlay for highlighting elements
    const overlay = document.createElement('div');
    overlay.id = 'tnf-selection-overlay';
    overlay.style.cssText = `
      position: fixed; 
      top: 0; 
      left: 0; 
      width: 100%; 
      height: 100%; 
      z-index: 999999998; 
      pointer-events: none;
      background: rgba(0,0,0,0.1);
    `;
    document.body.appendChild(overlay);
    
    // Set up element highlighting and selection
    this.setupElementSelection();
    
    this.addChatMessage(`🎯 Click on the ${type} element you want to select. Press Escape to cancel.`, 'system');
  }

  setupElementSelection() {
    // Remove existing handlers
    if (this.elementClickHandler) {
      document.removeEventListener('click', this.elementClickHandler, true);
    }
    if (this.elementHoverHandler) {
      document.removeEventListener('mouseover', this.elementHoverHandler, true);
    }
    
    let highlightedElement = null;
    
    this.elementHoverHandler = (e) => {
      if (!this.elementDetectionMode) return;
      
      // Skip extension elements
      if (e.target.closest('#tnf-floating-panel') || e.target.closest('#tnf-selection-overlay')) {
        return;
      }
      
      // Remove previous highlight
      if (highlightedElement) {
        highlightedElement.style.outline = '';
      }
      
      // Highlight current element
      highlightedElement = e.target;
      e.target.style.outline = '3px solid #ff6b6b';
    };
    
    this.elementClickHandler = (e) => {
      if (!this.elementDetectionMode) return;
      
      // Allow clicks on extension elements
      if (e.target.closest('#tnf-floating-panel')) {
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      
      // Clean up
      this.elementDetectionMode = false;
      const overlay = document.getElementById('tnf-selection-overlay');
      if (overlay) overlay.remove();
      
      if (highlightedElement) {
        highlightedElement.style.outline = '';
      }
      
      // Store the selected element
      this.selectedElements[this.currentSelectionType] = e.target;
      this.updateElementDisplay(this.currentSelectionType, this.getElementSelector(e.target));
      
      this.addChatMessage(`✅ ${this.currentSelectionType} element selected: ${this.getElementSelector(e.target)}`, 'system');
      
      // Remove event listeners
      document.removeEventListener('click', this.elementClickHandler, true);
      document.removeEventListener('mouseover', this.elementHoverHandler, true);
    };
    
    // Add event listeners
    document.addEventListener('mouseover', this.elementHoverHandler, true);
    document.addEventListener('click', this.elementClickHandler, true);
    
    // Add escape key listener
    const escapeHandler = (e) => {
      if (e.key === 'Escape' && this.elementDetectionMode) {
        this.elementDetectionMode = false;
        const overlay = document.getElementById('tnf-selection-overlay');
        if (overlay) overlay.remove();
        
        if (highlightedElement) {
          highlightedElement.style.outline = '';
        }
        
        document.removeEventListener('click', this.elementClickHandler, true);
        document.removeEventListener('mouseover', this.elementHoverHandler, true);
        document.removeEventListener('keydown', escapeHandler);
        
        this.addChatMessage('❌ Element selection cancelled', 'system');
      }
    };
    
    document.addEventListener('keydown', escapeHandler);
  }

  testElement(type) {
    // This method tests the selected elements
    const element = this.selectedElements[type];
    
    if (!element) {
      this.addChatMessage(`❌ No ${type} element selected. Please select one first.`, 'system');
      return;
    }
    
    try {
      switch (type) {
        case 'input':
          if (element.tagName.toLowerCase() === 'input' || element.tagName.toLowerCase() === 'textarea') {
            element.value = 'Test input from The New Fuse';
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            this.addChatMessage('✅ Input element tested successfully', 'system');
          } else {
            this.addChatMessage('❌ Selected element is not a valid input field', 'system');
          }
          break;
          
        case 'button':
          if (element.tagName.toLowerCase() === 'button' || element.tagName.toLowerCase() === 'input' && element.type === 'submit') {
            element.click();
            this.addChatMessage('✅ Button element clicked successfully', 'system');
          } else {
            this.addChatMessage('❌ Selected element is not a valid button', 'system');
          }
          break;
          
        case 'output':
          if (element) {
            const textContent = element.textContent.trim();
            const childCount = element.children.length;
            this.addChatMessage(`✅ Output element found: ${childCount} child elements, ${textContent.length} characters of text`, 'system');
          } else {
            this.addChatMessage('❌ Selected output element is not valid', 'system');
          }
          break;
          
        default:
          this.addChatMessage(`❌ Unknown element type: ${type}`, 'system');
      }
    } catch (error) {
      this.addChatMessage(`❌ Error testing ${type} element: ${error.message}`, 'system');
      console.error('TNF: Error testing element:', error);
    }
  }

  isElementVisible(element) {
    if (!element || !element.offsetParent) return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetWidth > 0 && 
           element.offsetHeight > 0;
  }

  isLikelyOutputContainer(element) {
    // Skip our own extension elements
    if (element.closest('#tnf-floating-panel')) return false;
    
    const rect = element.getBoundingClientRect();
    const childCount = element.children.length;
    const textContent = element.textContent.trim();
    const className = element.className.toLowerCase();
    const id = element.id.toLowerCase();
    
    // Must have reasonable size
    if (rect.width < 100 || rect.height < 50) return false;
    
    // Strong indicators it's a message/chat container
    if (className.includes('message') || className.includes('chat') || 
        id.includes('message') || id.includes('chat') ||
        element.getAttribute('role') === 'log' ||
        element.getAttribute('data-testid')?.includes('message') ||
        element.getAttribute('data-testid')?.includes('chat')) {
      return true;
    }
    
    // Has multiple child elements (likely individual messages)
    if (childCount >= 3) {
      // Check if children look like messages
      const childrenArray = Array.from(element.children);
      const messageChildren = childrenArray.filter(child => {
        const childClass = child.className.toLowerCase();
        const childText = child.textContent.trim();
        return childClass.includes('message') || 
               childClass.includes('chat') || 
               childText.length > 10; // Has substantial text content
      });
      
      if (messageChildren.length >= 2) return true;
    }
    
    // Has scrollable content (common for chat areas)
    const style = window.getComputedStyle(element);
    if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && 
        textContent.length > 50) {
      return true;
    }
    
    return false;
  }

  getElementSelector(element) {
    if (element.id) return '#' + element.id;
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c && !c.startsWith('tnf-'));
      if (classes.length > 0) return element.tagName.toLowerCase() + '.' + classes[0];
    }
    return element.tagName.toLowerCase();
  }

  updateElementDisplay(type, selector) {
    const displayEl = document.getElementById('tnf-' + type + '-display');
    const testBtn = document.getElementById('tnf-test-' + type);
    
    displayEl.textContent = selector.length > 30 ? selector.substring(0, 30) + '...' : selector;
    displayEl.title = selector;
    
    // Make test button green when element is selected
    if (testBtn) {
      testBtn.classList.add('selected');
    }
  }

  setupMessageListeners() {
    // Check if Chrome APIs are available
    if (typeof chrome === 'undefined' || !chrome.runtime) {
      console.warn('Chrome APIs not available');
      return;
    }
    
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      const action = request.action || request.type;
      switch (action) {
        case 'PING':
          sendResponse({ status: "PONG" });
          break;
        case 'TOGGLE_FLOATING_PANEL':
          this.togglePanel();
          sendResponse({ success: true, visible: this.isVisible });
          break;
        case 'SHOW_FLOATING_PANEL':
          this.showPanel();
          sendResponse({ success: true, visible: true });
          break;
        case 'GET_PANEL_STATE':
          sendResponse({ success: true, visible: this.isVisible, connected: this.isConnected });
          break;
        case 'AUTO_DETECT_ELEMENTS':
          this.autoDetectElements();
          sendResponse({ success: true, elements: this.getSelectedElementsStatus() });
          break;
        case 'START_ELEMENT_SELECTION':
          this.startElementSelection(request.elementType);
          sendResponse({ success: true });
          break;
        case 'VALIDATE_ELEMENTS':
          const validationResults = this.validateElements();
          sendResponse({ success: true, elements: validationResults });
          break;
        case 'WEBSOCKET_CONNECT':
          this.connectWebSocket();
          sendResponse({ success: true });
          break;
        case 'WEBSOCKET_DISCONNECT':
          this.disconnectWebSocket();
          sendResponse({ success: true });
          break;
        case 'START_AI_SESSION':
          this.startAISession();
          sendResponse({ success: true });
          break;
        case 'END_AI_SESSION':
          this.endAISession();
          sendResponse({ success: true });
          break;
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
      return true;
    });
  }

  savePanelState() {
    // Create page-specific storage key to prevent cross-page persistence
    const pageKey = `tnf-panel-state-${window.location.hostname}`;
    
    const state = {
      visible: this.isVisible,
      explicitlyClosed: this.panelExplicitlyClosed || false, // Track explicit user close
      position: { left: this.floatingPanel.style.left, top: this.floatingPanel.style.top },
      size: { width: this.floatingPanel.style.width, height: this.floatingPanel.style.height },
      websocketUrl: document.getElementById('tnf-ws-url') ? document.getElementById('tnf-ws-url').value : 'ws://localhost:3710'
    };
    
    console.log('TNF: Saving panel state for page:', window.location.hostname, 'State:', state);
    
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ [pageKey]: state });
      } else {
        localStorage.setItem(pageKey, JSON.stringify(state));
      }
    } catch (error) {
      console.warn('Failed to save panel state:', error);
    }
  }

  async loadPanelState() {
    try {
      // Create page-specific storage key to prevent cross-page persistence
      const pageKey = `tnf-panel-state-${window.location.hostname}`;
      let state = null;
      
      console.log('TNF: Loading panel state for page:', window.location.hostname);
      
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(pageKey);
        state = result[pageKey];
      } else {
        const stored = localStorage.getItem(pageKey);
        state = stored ? JSON.parse(stored) : null;
      }
      
      console.log('TNF: Loaded state:', state);
      
      if (state) {
        if (state.position.left) this.floatingPanel.style.left = state.position.left;
        if (state.position.top) this.floatingPanel.style.top = state.position.top;
        if (state.size && state.size.width) this.floatingPanel.style.width = state.size.width;
        if (state.size && state.size.height) this.floatingPanel.style.height = state.size.height;
        if (state.websocketUrl && document.getElementById('tnf-ws-url')) {
          document.getElementById('tnf-ws-url').value = state.websocketUrl;
        }
        
        // Set the explicit close flag from saved state
        this.panelExplicitlyClosed = state.explicitlyClosed || false;
        
        // Only show panel if it was visible AND not explicitly closed by user
        if (state.visible && !this.panelExplicitlyClosed) {
          console.log('TNF: Restoring panel visibility for this page');
          this.showPanel();
        } else if (this.panelExplicitlyClosed) {
          console.log('TNF: Panel was explicitly closed by user, keeping it hidden');
        } else {
          console.log('TNF: Panel was hidden on this page, keeping it hidden');
        }
      } else {
        console.log('TNF: No saved state found for this page');
      }
    } catch (error) {
      console.warn('Failed to load panel state:', error);
    }
  }

  getSelectedElementsStatus() {
    return {
      input: !!this.selectedElements.input,
      button: !!this.selectedElements.button,
      output: !!this.selectedElements.output
    };
  }

  validateElements() {
    const results = {
      input: { selected: false, visible: false, valid: false },
      button: { selected: false, visible: false, valid: false },
      output: { selected: false, visible: false, valid: false }
    };
    
    // Validate input element
    if (this.selectedElements.input) {
      results.input.selected = true;
      results.input.visible = this.isElementVisible(this.selectedElements.input);
      results.input.valid = results.input.visible && 
        (this.selectedElements.input.tagName.toLowerCase() === 'input' || 
         this.selectedElements.input.tagName.toLowerCase() === 'textarea' ||
         this.selectedElements.input.isContentEditable);
    }
    
    // Validate button element
    if (this.selectedElements.button) {
      results.button.selected = true;
      results.button.visible = this.isElementVisible(this.selectedElements.button);
      results.button.valid = results.button.visible && 
        (this.selectedElements.button.tagName.toLowerCase() === 'button' ||
         this.selectedElements.button.type === 'submit' ||
         this.selectedElements.button.getAttribute('role') === 'button');
    }
    
    // Validate output element
    if (this.selectedElements.output) {
      results.output.selected = true;
      results.output.visible = this.isElementVisible(this.selectedElements.output);
      results.output.valid = results.output.visible; // Any visible element can be output
    }
    
    return results;
  }

  startAISession() {
    this.aiSessionActive = true;
    this.addChatMessage('🚀 AI session started', 'system');
  }

  endAISession() {
    this.aiSessionActive = false;
    this.addChatMessage('🛑 AI session ended', 'system');
  }

  startElementSelection(elementType) {
    // Clear any previous selection handlers
    if (this.elementClickHandler) {
      document.removeEventListener('click', this.elementClickHandler, true);
    }
    if (this.elementHoverHandler) {
      document.removeEventListener('mouseover', this.elementHoverHandler);
    }
    
    this.elementDetectionMode = true;
    this.currentSelectionType = elementType;
    this.addChatMessage(`🎯 Click on the ${elementType} element to select it. Press ESC to cancel.`, 'system');
    
    // Create overlay and show instructions
    this.createSelectionOverlay();
    this.showInstructions(`Click on the ${elementType} element`);
    document.body.style.cursor = 'crosshair';
    
    // Set up targeted selection for specific element type
    this.setupTargetedSelectionListeners(elementType);
  }

  setupTargetedSelectionListeners(elementType) {
    // Mouse hover handler for highlighting
    this.elementHoverHandler = (e) => {
      if (!this.elementDetectionMode) return;
      
      // Skip our own extension elements
      if (e.target.closest('#tnf-floating-panel') || 
          e.target.closest('#tnf-selection-overlay') || 
          e.target.closest('#tnf-selection-instructions') ||
          e.target.closest('#tnf-element-highlight')) {
        return;
      }
      
      this.highlightElement(e.target);
    };

    // Click handler for selecting specific element type
    this.elementClickHandler = (e) => {
      if (!this.elementDetectionMode) return;
      
      // Skip our own extension elements - let them handle their own clicks
      if (e.target.closest('#tnf-floating-panel') || 
          e.target.closest('#tnf-selection-overlay') || 
          e.target.closest('#tnf-selection-instructions') ||
          e.target.closest('#tnf-element-highlight')) {
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      
      // Select the element for the specified type
      this.selectedElements[elementType] = e.target;
      this.updateElementDisplay(elementType, this.getElementSelector(e.target));
      this.addChatMessage(`✅ Selected ${elementType}: ${this.getElementSelector(e.target)}`, 'system');
      
      // Exit selection mode after successful selection
      this.exitElementDetectionMode();
    };

    // Escape key handler
    this.escapeHandler = (e) => {
      if (e.key === 'Escape' && this.elementDetectionMode) {
        this.exitElementDetectionMode();
        this.addChatMessage('❌ Element selection cancelled', 'system');
      }
    };
    
    document.addEventListener('mouseover', this.elementHoverHandler);
    document.addEventListener('click', this.elementClickHandler, true);
    document.addEventListener('keydown', this.escapeHandler);
  }

  toggleElementDetectionMode() {
    if (this.elementDetectionMode) {
      this.exitElementDetectionMode();
    } else {
      this.enterElementDetectionMode();
    }
  }

  enterElementDetectionMode() {
    this.elementDetectionMode = true;
    this.addChatMessage('🎯 Element selection mode active. Hover and click on elements to select them.', 'system');
    
    // Create overlay for visual feedback
    this.createSelectionOverlay();
    this.showInstructions('Click on elements to select them');
    document.body.style.cursor = 'crosshair';
    
    // Set up event listeners for direct hover/click selection
    this.setupDirectSelectionListeners();
  }

  exitElementDetectionMode() {
    this.elementDetectionMode = false;
    this.currentSelectionType = null;
    
    // Remove event listeners
    if (this.elementClickHandler) {
      document.removeEventListener('click', this.elementClickHandler, true);
      this.elementClickHandler = null;
    }
    if (this.elementHoverHandler) {
      document.removeEventListener('mouseover', this.elementHoverHandler);
      this.elementHoverHandler = null;
    }
    
    // Remove hover effects and overlay
    document.querySelectorAll('.tnf-element-hover').forEach(el => {
      el.classList.remove('tnf-element-hover');
    });
    
    this.removeSelectionOverlay();
    this.removeHighlight();
    this.hideInstructions();
    document.body.style.cursor = '';
    this.addChatMessage('🛑 Element selection mode deactivated', 'system');
  }

  createSelectionOverlay() {
    this.removeSelectionOverlay(); // Remove any existing overlay
    
    const overlay = document.createElement('div');
    overlay.id = 'tnf-selection-overlay';
    document.body.appendChild(overlay);
  }

  removeSelectionOverlay() {
    const overlay = document.getElementById('tnf-selection-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  highlightElement(element) {
    this.removeHighlight();
    
    const highlight = document.createElement('div');
    highlight.id = 'tnf-element-highlight';
    highlight.className = 'tnf-element-highlight';
    
    const rect = element.getBoundingClientRect();
    highlight.style.top = rect.top + 'px';
    highlight.style.left = rect.left + 'px';
    highlight.style.width = rect.width + 'px';
    highlight.style.height = rect.height + 'px';
    
    document.body.appendChild(highlight);
  }

  removeHighlight() {
    const highlight = document.getElementById('tnf-element-highlight');
    if (highlight) {
      highlight.remove();
    }
  }

  showInstructions(message) {
    this.hideInstructions(); // Remove any existing instructions
    
    const instructions = document.createElement('div');
    instructions.id = 'tnf-selection-instructions';
    instructions.innerHTML = `
      <div style="text-align: center;">
        <strong>Element Selection Mode</strong><br>
        <small>${message} • Press ESC to cancel</small>
      </div>
    `;
    
    document.body.appendChild(instructions);
  }

  hideInstructions() {
    const instructions = document.getElementById('tnf-selection-instructions');
    if (instructions) {
      instructions.remove();
    }
  }

  setupDirectSelectionListeners() {
    // Mouse hover handler for highlighting
    this.elementHoverHandler = (e) => {
      if (!this.elementDetectionMode) return;
      
      // Skip our own extension elements
      if (e.target.closest('#tnf-floating-panel') || 
          e.target.closest('#tnf-selection-overlay') || 
          e.target.closest('#tnf-selection-instructions') ||
          e.target.closest('#tnf-element-highlight')) {
        return;
      }
      
      this.highlightElement(e.target);
    };

    // Click handler for selecting elements
    this.elementClickHandler = (e) => {
      if (!this.elementDetectionMode) return;
      
      // Skip our own extension elements - let them handle their own clicks
      if (e.target.closest('#tnf-floating-panel') || 
          e.target.closest('#tnf-selection-overlay') || 
          e.target.closest('#tnf-selection-instructions') ||
          e.target.closest('#tnf-element-highlight')) {
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      
      this.selectElementByType(e.target);
    };

    // Escape key handler
    this.escapeHandler = (e) => {
      if (e.key === 'Escape' && this.elementDetectionMode) {
        this.exitElementDetectionMode();
      }
    };
    
    document.addEventListener('mouseover', this.elementHoverHandler);
    document.addEventListener('click', this.elementClickHandler, true);
    document.addEventListener('keydown', this.escapeHandler);
  }

  selectElementByType(element) {
    // Auto-determine element type based on characteristics
    const elementType = this.determineElementType(element);
    
    if (elementType) {
      this.selectedElements[elementType] = element;
      this.updateElementDisplay(elementType, this.getElementSelector(element));
      this.addChatMessage(`✅ Selected ${elementType}: ${this.getElementSelector(element)}`, 'system');
    } else {
      // If we can't determine the type, ask user to specify
      this.promptForElementType(element);
    }
  }

  determineElementType(element) {
    const tagName = element.tagName.toLowerCase();
    const type = element.type?.toLowerCase();
    const role = element.getAttribute('role')?.toLowerCase();
    const className = element.className?.toLowerCase() || '';
    
    // Determine if it's an input field
    if (tagName === 'input' || tagName === 'textarea' || 
        role === 'textbox' || element.isContentEditable ||
        className.includes('input') || className.includes('textbox')) {
      return 'input';
    }
    
    // Determine if it's a button
    if (tagName === 'button' || type === 'submit' || role === 'button' ||
        className.includes('button') || className.includes('btn')) {
      return 'button';
    }
    
    // Determine if it's output/message area
    if (className.includes('message') || className.includes('chat') || 
        className.includes('output') || className.includes('response') ||
        role === 'log' || role === 'region') {
      return 'output';
    }
    
    return null; // Type could not be determined
  }

  promptForElementType(element) {
    const selector = this.getElementSelector(element);
    const message = `What type is this element: ${selector}?\n\nReply: input, button, or output`;
    
    this.addChatMessage(`❓ ${message}`, 'system');
    
    // Store the element temporarily for user decision
    this.pendingElement = element;
  }

  showElementTypeSelector() {
    // Exit any current selection mode first
    if (this.elementDetectionMode) {
      this.exitElementDetectionMode();
    }
    
    this.addChatMessage('🎯 Which element type do you want to select?', 'system');
    
    // Create temporary selector UI
    const selectorDiv = document.createElement('div');
    selectorDiv.id = 'tnf-element-type-selector';
    selectorDiv.innerHTML = `
      <div style="
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: #333; color: white; padding: 20px; border-radius: 10px;
        z-index: 1000002; font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5); text-align: center;
      ">
        <h3 style="margin: 0 0 15px 0; font-size: 16px;">Select Element Type</h3>
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button id="tnf-select-input" style="
            background: #007AFF; color: white; border: none; padding: 10px 15px;
            border-radius: 5px; cursor: pointer; font-size: 14px;
          ">📝 Input Field</button>
          <button id="tnf-select-button" style="
            background: #34C759; color: white; border: none; padding: 10px 15px;
            border-radius: 5px; cursor: pointer; font-size: 14px;
          ">🔘 Button</button>
          <button id="tnf-select-output" style="
            background: #FF9500; color: white; border: none; padding: 10px 15px;
            border-radius: 5px; cursor: pointer; font-size: 14px;
          ">💬 Output Area</button>
        </div>
        <div style="margin-top: 15px;">
          <button id="tnf-cancel-selection" style="
            background: #FF3B30; color: white; border: none; padding: 8px 12px;
            border-radius: 5px; cursor: pointer; font-size: 12px;
          ">Cancel</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(selectorDiv);
    
    // Add event listeners
    document.getElementById('tnf-select-input').addEventListener('click', () => {
      this.startElementSelection('input');
      this.removeElementTypeSelector();
    });
    
    document.getElementById('tnf-select-button').addEventListener('click', () => {
      this.startElementSelection('button');
      this.removeElementTypeSelector();
    });
    
    document.getElementById('tnf-select-output').addEventListener('click', () => {
      this.startElementSelection('output');
      this.removeElementTypeSelector();
    });
    
    document.getElementById('tnf-cancel-selection').addEventListener('click', () => {
      this.removeElementTypeSelector();
      this.addChatMessage('❌ Element selection cancelled', 'system');
    });
  }

  removeElementTypeSelector() {
    const selector = document.getElementById('tnf-element-type-selector');
    if (selector) {
      selector.remove();
    }
  }

  testElement(type) {
    const element = this.selectedElements[type];
    
    if (!element) {
      this.addChatMessage(`❌ No ${type} element selected`, 'system');
      return;
    }
    
    try {
      switch (type) {
        case 'input':
          this.testInputElement(element);
          break;
        case 'button':
          this.testButtonElement(element);
          break;
        case 'output':
          this.testOutputElement(element);
          break;
      }
    } catch (error) {
      this.addChatMessage(`❌ Error testing ${type}: ${error.message}`, 'system');
    }
  }

  testInputElement(element) {
    const testMessage = 'Test message from The New Fuse';
    
    if (element.tagName.toLowerCase() === 'textarea' || element.tagName.toLowerCase() === 'input') {
      const originalValue = element.value;
      element.value = testMessage;
      element.focus();
      
      // Trigger events
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      
      this.addChatMessage('✅ Input element test: message inserted', 'system');
      
      // Restore original value after 2 seconds
      setTimeout(() => {
        element.value = originalValue;
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }, 2000);
      
    } else if (element.isContentEditable) {
      const originalContent = element.textContent;
      element.textContent = testMessage;
      element.focus();
      
      // Trigger events
      element.dispatchEvent(new Event('input', { bubbles: true }));
      
      this.addChatMessage('✅ Input element test: message inserted (contenteditable)', 'system');
      
      // Restore original content after 2 seconds
      setTimeout(() => {
        element.textContent = originalContent;
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }, 2000);
    }
  }

  testButtonElement(element) {
    // Highlight the button briefly
    const originalStyle = element.style.border;
    element.style.border = '3px solid #00FF00';
    element.style.boxShadow = '0 0 10px #00FF00';
    
    this.addChatMessage('✅ Button element test: button highlighted (not clicked for safety)', 'system');
    
    // Remove highlight after 2 seconds
    setTimeout(() => {
      element.style.border = originalStyle;
      element.style.boxShadow = '';
    }, 2000);
  }

  testOutputElement(element) {
    // Highlight the output area briefly
    const originalStyle = element.style.border;
    element.style.border = '3px solid #FF9500';
    element.style.boxShadow = '0 0 10px #FF9500';
    
    this.addChatMessage('✅ Output element test: area highlighted', 'system');
    
    // Scroll to the element
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Remove highlight after 3 seconds
    setTimeout(() => {
      element.style.border = originalStyle;
      element.style.boxShadow = '';
    }, 3000);
  }

  startWebSocketServer() {
    this.updateServerStatus('Starting', 'starting');
    this.addChatMessage('🚀 Starting WebSocket server...', 'system');
    
    // Try to communicate with background script to start server
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'START_WS_SERVER',
        port: this.getPortFromUrl()
      }, (response) => {
        if (response && response.success) {
          this.updateServerStatus('Running', 'running');
          this.addChatMessage('✅ WebSocket server started successfully', 'system');
          this.startServerPingCheck();
          // Wait a moment then try to connect
          setTimeout(() => this.connectWebSocket(), 1000);
        } else {
          this.fallbackServerStart();
        }
      });
    } else {
      this.fallbackServerStart();
    }
  }

  stopWebSocketServer() {
    this.updateServerStatus('Stopping', 'stopping');
    this.addChatMessage('🛑 Stopping WebSocket server...', 'system');
    
    // Disconnect first if connected
    if (this.isConnected) {
      this.disconnectWebSocket();
    }
    
    // Clear ping interval
    if (this.serverPingInterval) {
      clearInterval(this.serverPingInterval);
      this.serverPingInterval = null;
    }
    
    // Try to communicate with background script to stop server
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'STOP_WS_SERVER',
        port: this.getPortFromUrl()
      }, (response) => {
        if (response && response.success) {
          this.updateServerStatus('Stopped', 'stopped');
          this.addChatMessage('🔴 WebSocket server stopped successfully', 'system');
        } else {
          this.fallbackServerStop();
        }
      });
    } else {
      this.fallbackServerStop();
    }
  }

  startServerPingCheck() {
    // Clear any existing interval
    if (this.serverPingInterval) {
      clearInterval(this.serverPingInterval);
    }
    
    // Check server status every 10 seconds
    this.serverPingInterval = setInterval(() => {
      this.checkServerHealth();
    }, 10000);
  }

  checkServerHealth() {
    if (this.serverState !== 'running') return;
    
    const urlInput = document.getElementById('tnf-ws-url');
    const url = urlInput ? urlInput.value.trim() : 'ws://localhost:3710';
    
    // Quick health check
    const tempWs = new WebSocket(url);
    
    tempWs.onopen = () => {
      // Server is healthy
      tempWs.close();
    };
    
    tempWs.onerror = () => {
      // Server might be down
      this.updateServerStatus('Connection Lost', 'stopped');
      this.addChatMessage('⚠️ Server connection lost. Server may have stopped.', 'system');
      if (this.serverPingInterval) {
        clearInterval(this.serverPingInterval);
        this.serverPingInterval = null;
      }
    };
    
    // Clean up after 2 seconds
    setTimeout(() => {
      if (tempWs.readyState === WebSocket.CONNECTING) {
        tempWs.close();
      }
    }, 2000);
  }

  getPortFromUrl() {
    const urlInput = document.getElementById('tnf-ws-url');
    const url = urlInput ? urlInput.value.trim() : 'ws://localhost:3710';
    const match = url.match(/:(\d+)/);
    return match ? parseInt(match[1]) : 3710;
  }

  fallbackServerStart() {
    this.updateServerStatus('Manual Start Required', 'stopped');
    this.addChatMessage('⚠️ Could not start server automatically. Please start the WebSocket server manually.', 'system');
    this.addChatMessage('💡 Run this command in terminal: node websocket-server.js', 'system');
    
    // Show helpful instructions
    const instructions = `
To start the WebSocket server manually:
1. Open terminal in the extension directory
2. Run: node websocket-server.js
3. Or run: npm run start-ws-server
4. Then click Connect button above
    `;
    this.addChatMessage(instructions, 'system');
  }

  fallbackServerStop() {
    this.updateServerStatus('Stopped', 'stopped');
    this.addChatMessage('🔴 Server stop signal sent. If server is still running, please stop it manually.', 'system');
  }



  // ...existing code...
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Prevent multiple initializations
    if (window.theNewFuse) {
      console.log('🔄 The New Fuse already initialized, skipping');
      return;
    }
    window.theNewFuse = new TheNewFuseContent();
  });
} else {
  // Prevent multiple initializations
  if (window.theNewFuse) {
    console.log('🔄 The New Fuse already initialized, skipping');
  } else {
    window.theNewFuse = new TheNewFuseContent();
  }
}
