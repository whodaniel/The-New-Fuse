// ==UserScript==
// @name         TNF ChatGPT Debugger
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Debugger for ChatGPT interactions
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    class TNFDebugger {
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
              const otherSections = Array.from(panelContent.children).filter(el => el !== chatSection && !el.classList.contains('tnf-terminal-section')); // Exclude terminal
              let otherSectionsHeight = 0;
              
              otherSections.forEach(section => {
                const sectionRect = section.getBoundingClientRect();
                otherSectionsHeight += sectionRect.height;
              });

              // Also account for the terminal section height if it exists
              const terminalSection = panelContent.querySelector('.tnf-terminal-section');
              if (terminalSection) {
                otherSectionsHeight += terminalSection.offsetHeight;
              }
              
              // Account for gaps, padding, and margins (more generous calculation)
              const gapPadding = 60; // section gaps + content padding
              const sectionPadding = 40; // chat section internal padding
              
              // Calculate available height for chat box
              const availableHeight = panelRect.height - otherSectionsHeight - gapPadding - sectionPadding;
              
              // Set reasonable constraints
              const minHeight = 100; // Adjusted min height
              const maxHeight = Math.max(200, availableHeight); // Adjusted max height
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
              chatBox.style.height = '150px'; // Adjusted fallback
            }
          }

        initializeTerminalView() {
            const existingTerminal = document.getElementById('tnf-terminal-output');
            if (existingTerminal) {
              // Terminal already initialized or panel was re-created
              return;
            }
      
            const panelContent = this.floatingPanel.querySelector('.tnf-panel-content');
            if (!panelContent) {
              console.error("TNF: Panel content not found for terminal initialization.");
              return;
            }
      
            const terminalSection = document.createElement('div');
            terminalSection.className = 'tnf-section tnf-terminal-section';
            terminalSection.innerHTML = `
              <div class="tnf-section-header">WebSocket Server Logs</div>
              <div id="tnf-terminal-output" class="tnf-terminal-output"></div>
            `;
            // Insert terminal before the chat section or at the end if chat section not found
            const chatSectionElement = panelContent.querySelector('.tnf-section:has(.tnf-chat-box)');
            if (chatSectionElement) {
              panelContent.insertBefore(terminalSection, chatSectionElement);
            } else {
              panelContent.appendChild(terminalSection);
            }
      
            // Style for the terminal (ensure it's only added once)
            if (!document.getElementById('tnf-terminal-styles')) {
              const terminalStyle = `
                .tnf-terminal-section { margin-top: 10px; }
                .tnf-terminal-output {
                  background-color: #1e1e1e; /* Darker background */
                  color: #d4d4d4; /* Light grey text */
                  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
                  font-size: 11px; /* Slightly smaller font */
                  height: 120px; /* Adjusted height */
                  overflow-y: auto;
                  padding: 8px; /* Adjusted padding */
                  border-radius: 4px;
                  border: 1px solid #333; /* Darker border */
                  white-space: pre-wrap;
                  word-break: break-all;
                }
                .tnf-terminal-output .log-entry {
                  margin-bottom: 3px; /* Reduced margin */
                  line-height: 1.4;
                }
                .tnf-terminal-output .log-error { color: #f48771; } /* Softer red */
                .tnf-terminal-output .log-warn { color: #ffd700; } /* Gold */
                .tnf-terminal-output .log-info { color: #4ec9b0; } /* Softer teal */
                .tnf-terminal-output .log-system { color: #c586c0; } /* Purple */
                .tnf-terminal-output .log-debug { color: #808080; } /* Grey */
              `;
              const styleSheet = document.createElement("style");
              styleSheet.id = "tnf-terminal-styles";
              styleSheet.type = "text/css";
              styleSheet.innerText = terminalStyle;
              document.head.appendChild(styleSheet);
            }
            this.updateChatBoxHeight(); // Adjust chatbox height after adding terminal
          }

        addLogToTerminal(logEntry, type = 'info') {
            const terminalOutput = document.getElementById('tnf-terminal-output');
            if (terminalOutput) {
              const entryElement = document.createElement('div');
              // Sanitize logEntry to prevent HTML injection if it's ever from an untrusted source
              const sanitizedLogEntry = String(logEntry).replace(/[&<>"']/g, (match) => {
                return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": "&#39;" }[match];
              });
              entryElement.className = `log-entry log-${type}`;
              entryElement.innerHTML = `[<span style="color: #666;">${new Date().toLocaleTimeString()}</span>] ${sanitizedLogEntry}`;
              terminalOutput.appendChild(entryElement);
              terminalOutput.scrollTop = terminalOutput.scrollHeight; // Auto-scroll
              while (terminalOutput.children.length > 200) { // Limit log entries
                terminalOutput.removeChild(terminalOutput.firstChild);
              }
            }
          }

        setupChromeRuntimeListeners() {
            // Ensure this runs only once
            if (this.runtimeListenerAttached) return;
      
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
              chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                let handled = false;
                if (message.type === 'SERVER_LOG') {
                  this.addLogToTerminal(message.log, message.logType || 'info');
                  sendResponse({ received: true });
                  handled = true;
                } else if (message.type === 'SERVER_CLIENTS_UPDATED') {
                  this.addLogToTerminal(`Connected clients: ${message.count}`, 'system');
                  sendResponse({ received: true });
                  handled = true;
                } else if (message.type === 'WEBSOCKET_SERVER_STATUS') {
                  this.updateServerStatus(message.status, message.state);
                  this.addLogToTerminal(`Server status updated: ${message.status} (${message.state})`, 'system');
                  if (message.state === 'running' && this.serverState !== 'running') {
                     // If server just started, try to connect the panel's WebSocket
                    if (!this.isConnected && this.panelExplicitlyClosed === false) { // Check if panel is not explicitly closed
                         this.connectWebSocket();
                    }
                  }
                  sendResponse({ received: true });
                  handled = true;
                }
      
                // If the message isn't handled by this listener,
                // it's important to return false or undefined to allow other listeners to process it.
                // However, for async sendResponse, we must return true.
                // So, only return true if we are sure we will call sendResponse.
                return handled;
              });
              this.runtimeListenerAttached = true;
              console.log('TNF: Content script message listeners set up.');
            } else {
              console.warn('TNF: Chrome runtime or onMessage listener not available for content script. Server logs will not be displayed in panel.');
              // Fallback for environments where chrome API is not available (e.g. testing)
              // This allows the panel to still function for UI testing without full chrome env.
              if (!this.floatingPanel.querySelector('#tnf-terminal-output')) {
                this.initializeTerminalView(); // Still init the view
                this.addLogToTerminal('Chrome API not available. Server logs disabled.', 'warn');
              }
            }
          }

        constructor() {
            this.selectedElements = { input: null, button: null, output: null };
            this.isConnected = false;
            this.websocket = null;
            this.isVisible = false;
            this.floatingPanel = null;
            this.panelExplicitlyClosed = false;
            this.serverState = 'stopped'; 
            this.runtimeListenerAttached = false; // Flag to ensure listener is attached only once
      
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
              this.init();
            } else {
              window.addEventListener('load', () => this.init());
            }
          }
      
          init() {
            if (this.floatingPanel) return; // Already initialized
      
            this.createFloatingPanel();
            this.injectStyles();
            this.initializeTerminalView(); // Initialize terminal before event listeners that might use it
            this.setupPanelEventListeners();
            this.makePanelDraggable();
            this.makePanelResizable();
            this.setupChromeRuntimeListeners(); // Setup listeners for messages from background
            this.loadPanelState(); 
      
            // Initial check for server status from background script
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
              chrome.runtime.sendMessage({ type: 'GET_SERVER_STATUS_FROM_CONTENT_SCRIPT' }, (response) => {
                if (chrome.runtime.lastError) {
                  console.warn('TNF: Error getting initial server status:', chrome.runtime.lastError.message);
                  this.addLogToTerminal(`Error getting initial server status: ${chrome.runtime.lastError.message}`, 'error');
                   this.updateServerStatus('Unknown', 'stopped');
                } else if (response) {
                  this.updateServerStatus(response.status, response.state);
                  this.addLogToTerminal(`Initial server status: ${response.status} (${response.state})`, 'system');
                } else {
                  this.addLogToTerminal('No initial server status received from background.', 'warn');
                  this.updateServerStatus('Unknown', 'stopped');
                }
              });
            } else {
               this.updateServerStatus('Unavailable', 'stopped'); // Fallback if chrome API not present
               this.addLogToTerminal('Chrome API unavailable for initial server status check.', 'warn');
            }
             // Set initial chat box height
            setTimeout(() => this.updateChatBoxHeight(), 100);
          }

        // ...existing methods...
    }

    // Instantiate the debugger class
    new TNFDebugger();
})();