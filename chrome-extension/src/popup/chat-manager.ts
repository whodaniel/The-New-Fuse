/**
 * Chat manager for The New Fuse - AI Bridge
 */
import { Logger } from '../utils/logger.js';
import { ConnectionStatusManager } from './connection-status.js';

// Create a chat-specific logger
const chatLogger = new Logger({
  name: 'ChatManager',
  level: 'info',
  saveToStorage: true
});

/**
 * Chat message
 */
interface ChatMessage {
  type: 'user' | 'system' | 'error' | 'ai';
  content: string;
  timestamp: string;
  sender?: string;
}

/**
 * Chat manager
 */
export class ChatManager {
  private messages: ChatMessage[] = [];
  private connectionManager: ConnectionStatusManager;
  private messageInput: HTMLTextAreaElement | null = null;
  private messageLog: HTMLElement | null = null;
  private sendButton: HTMLElement | null = null;
  private codeMode: boolean = false;

  // Track last connection state to detect changes
  private lastConnectionState: {vscode: boolean, relay: boolean} | null = null;

  /**
   * Create a new ChatManager
   * @param connectionManager - Connection status manager
   */
  constructor(connectionManager: ConnectionStatusManager) {
    this.connectionManager = connectionManager;

    // Load messages from storage
    this.loadMessages();

    chatLogger.info('Chat manager initialized');
  }

  /**
   * Initialize chat manager
   */
  initialize(): void {
    try {
      // Get UI elements
      this.messageInput = document.getElementById('message-input') as HTMLTextAreaElement;
      this.messageLog = document.getElementById('message-log');
      this.sendButton = document.getElementById('send-button');
      
      // Make sure UI elements exist
      if (!this.messageInput || !this.messageLog || !this.sendButton) {
        chatLogger.error('Failed to find chat UI elements');
        this.showError('UI elements not found. Please try reloading the extension.');
        return;
      }
      
      // Connection banner elements
      const connectionBanner = document.getElementById('connection-banner');
      const connectFromChat = document.getElementById('connect-from-chat');
      
      // Update connection banner based on connection status
      this.updateConnectionBanner();
      
      // Add event listener to connect button in chat banner
      if (connectFromChat) {
        connectFromChat.addEventListener('click', () => {
          this.connectionManager.connect();
          // Show connecting message
          this.addMessage({
            type: 'system',
            content: 'Connecting to server...',
            timestamp: new Date().toISOString()
          });
        });
      }
      
      // Setup connection status change listener
      this.connectionManager.addStatusChangeListener((status: {vscode: boolean, relay: boolean}) => {
        this.updateConnectionBanner();
        
        if (status.vscode || status.relay) {
          // Show system message when connection is established
          if (!this.lastConnectionState?.vscode && !this.lastConnectionState?.relay) {
            this.addMessage({
              type: 'system',
              content: 'Connected to server.',
              timestamp: new Date().toISOString()
            });
          }
        } else {
          // Show system message when connection is lost
          if (this.lastConnectionState?.vscode || this.lastConnectionState?.relay) {
            this.addMessage({
              type: 'system',
              content: 'Disconnected from server.',
              timestamp: new Date().toISOString()
            });
          }
        }
        
        // Save last state
        this.lastConnectionState = {...status};
      });
      
      // Add event listeners for sending messages
      if (this.sendButton) {
        this.sendButton.addEventListener('click', (e) => {
          e.preventDefault();
          this.sendMessage();
        });
      }
    
      if (this.messageInput) {
        this.messageInput.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
          }
        });
      }

      // Initialize code mode toggle
      const codeModeToggle = document.getElementById('code-mode-toggle');
      if (codeModeToggle) {
        codeModeToggle.addEventListener('click', () => this.toggleCodeMode());
      }

      // Initialize upload button
      const uploadButton = document.getElementById('upload-button');
      if (uploadButton) {
        uploadButton.addEventListener('click', () => this.uploadFile());
      }

      // Initialize voice input button
      const voiceInputButton = document.getElementById('voice-input-button');
      if (voiceInputButton) {
        voiceInputButton.addEventListener('click', () => this.startVoiceInput());
      }
      
      // Update UI
      this.updateUI();

      chatLogger.info('Chat manager event listeners initialized');
    } catch (error) {
      chatLogger.error('Error initializing chat manager', error);
      console.error('Error initializing chat manager:', error);
    }
  }

  /**
   * Load messages from storage
   */
  private async loadMessages(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['messageHistory']);
      if (result.messageHistory && Array.isArray(result.messageHistory)) {
        this.messages = result.messageHistory;
        chatLogger.info(`Loaded ${this.messages.length} messages from storage`);
      } else {
        // Initialize with empty array if messageHistory is not an array
        this.messages = [];
        chatLogger.info('No valid message history found, initialized with empty array');
      }
    } catch (error) {
      chatLogger.error('Error loading messages', error);
      // Initialize with empty array on error
      this.messages = [];
    }
  }

  /**
   * Save messages to storage
   */
  private async saveMessages(): Promise<void> {
    try {
      await chrome.storage.local.set({ messageHistory: this.messages });
      chatLogger.debug(`Saved ${this.messages.length} messages to storage`);
    } catch (error) {
      chatLogger.error('Error saving messages', error);
    }
  }

  /**
   * Send a message
   */
  sendMessage(): void {
    if (!this.messageInput) return;

    const content = this.messageInput.value.trim();
    if (!content) return;

    // Check if connected
    if (!this.connectionManager.isConnectedToVSCode()) {
      this.addMessage({
        type: 'error',
        content: 'Cannot send message: Not connected to VS Code',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Create message
    const message: ChatMessage = {
      type: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    // Add to message list
    this.addMessage(message);

    // Clear input
    this.messageInput.value = '';

    // Send to VS Code
    chrome.runtime.sendMessage({
      type: 'SEND_MESSAGE',
      data: {
        type: this.codeMode ? 'CODE' : 'CHAT',
        content,
        timestamp: Date.now()
      }
    }, (response) => {
      if (!response || !response.success) {
        this.addMessage({
          type: 'error',
          content: `Failed to send message: ${response?.error || 'Unknown error'}`,
          timestamp: new Date().toISOString()
        });
      }
    });

    chatLogger.info('Message sent');
  }

  /**
   * Add a message to the chat
   * @param message - Message to add
   */
  addMessage(message: ChatMessage): void {
    // Add to message list
    this.messages.push(message);

    // Save to storage
    this.saveMessages();

    // Update UI
    this.updateUI();
    
    // Always scroll to bottom when new message is added
    this.scrollToBottom();

    chatLogger.debug(`Message added: ${message.type}`);
  }

  /**
   * Update the UI
   */
  private updateUI(): void {
    if (!this.messageLog) return;

    // Clear message log
    this.messageLog.innerHTML = '';

    // Add messages
    for (const message of this.messages) {
      const messageElement = document.createElement('div');
      messageElement.className = `message ${message.type}-message`;

      const timestamp = document.createElement('div');
      timestamp.className = 'message-timestamp';
      timestamp.textContent = new Date(message.timestamp).toLocaleTimeString();

      const content = document.createElement('div');
      content.className = 'message-content';

      // Check if content contains code
      if (message.type === 'user' && this.containsCode(message.content)) {
        const pre = document.createElement('pre');
        const code = document.createElement('code');
        code.textContent = message.content;
        pre.appendChild(code);
        content.appendChild(pre);
      } else {
        content.textContent = message.content;
      }

      messageElement.appendChild(timestamp);
      messageElement.appendChild(content);
      this.messageLog.appendChild(messageElement);
    }

    // Scroll to bottom
    this.messageLog.scrollTop = this.messageLog.scrollHeight;

    // Update code mode
    if (this.messageInput) {
      this.messageInput.classList.toggle('code-mode', this.codeMode);
    }

    const codeModeToggle = document.getElementById('code-mode-toggle');
    if (codeModeToggle) {
      codeModeToggle.classList.toggle('active', this.codeMode);
    }
  }

  /**
   * Update connection banner based on connection status
   */
  private updateConnectionBanner(): void {
    const connectionBanner = document.getElementById('connection-banner');
    const isConnected = this.connectionManager.isConnectedToVSCode() || this.connectionManager.isConnectedToRelay();
    
    if (connectionBanner) {
      connectionBanner.classList.toggle('hidden', isConnected);
    }
    
    // Enable or disable the send button based on connection
    if (this.sendButton) {
      this.sendButton.classList.toggle('disabled', !isConnected);
      (this.sendButton as HTMLButtonElement).disabled = !isConnected;
    }
    
    // Set a placeholder message based on connection status
    if (this.messageInput) {
      this.messageInput.placeholder = isConnected ? 
        "Type your message..." : 
        "Connect to server to send messages...";
    }
  }
  
  /**
   * Show error message in UI
   */
  private showError(message: string): void {
    // Create error message element
    const errorMessage = document.createElement('div');
    errorMessage.className = 'system-message error-message';
    errorMessage.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i>
      <span>${message}</span>
    `;
    
    // Add to message log if available
    if (this.messageLog) {
      this.messageLog.appendChild(errorMessage);
      this.scrollToBottom();
    }
    
    // Also add to messages array
    this.messages.push({
      type: 'error',
      content: message,
      timestamp: new Date().toISOString(),
    });
    
    // Save messages
    this.saveMessages();
  }
  
  /**
   * Scroll message log to bottom
   */
  private scrollToBottom(): void {
    if (this.messageLog) {
      this.messageLog.scrollTop = this.messageLog.scrollHeight;
    }
  }

  /**
   * Toggle code mode
   */
  toggleCodeMode(): void {
    this.codeMode = !this.codeMode;
    this.updateUI();
    chatLogger.debug(`Code mode ${this.codeMode ? 'enabled' : 'disabled'}`);
  }

  /**
   * Upload a file
   */
  uploadFile(): void {
    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt,.js,.ts,.html,.css,.json,.md';

    // Handle file selection
    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = () => {
          if (this.messageInput) {
            this.messageInput.value = reader.result as string;
            this.codeMode = true;
            this.updateUI();
          }
        };

        reader.readAsText(file);
        chatLogger.info(`File uploaded: ${file.name}`);
      }
    });

    // Trigger file selection
    fileInput.click();
  }

  /**
   * Start voice input
   */
  startVoiceInput(): void {
    // Check if speech recognition is available
    if (!('webkitSpeechRecognition' in window)) {
      this.addMessage({
        type: 'error',
        content: 'Speech recognition is not supported in this browser',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Create speech recognition instance
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        this.addMessage({
            type: 'error',
            content: 'Speech recognition is not supported in this browser',
            timestamp: new Date().toISOString()
        });
        return;
    }
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    // Handle results
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      if (this.messageInput) {
        this.messageInput.value = transcript;
      }
    };

    // Handle errors
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      chatLogger.error('Speech recognition error', event.error);
      this.addMessage({
        type: 'error',
        content: `Speech recognition error: ${event.error}`,
        timestamp: new Date().toISOString()
      });
    };

    // Start recognition
    recognition.start();
    chatLogger.info('Voice input started');

    // Add system message
    this.addMessage({
      type: 'system',
      content: 'Listening for voice input...',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Check if content contains code
   * @param content - Content to check
   * @returns Whether content contains code
   */
  private containsCode(content: string): boolean {
    // Simple heuristic: check for common code patterns
    const codePatterns = [
      /function\s+\w+\s*\(/,
      /class\s+\w+/,
      /const\s+\w+\s*=/,
      /let\s+\w+\s*=/,
      /var\s+\w+\s*=/,
      /if\s*\(.+\)\s*{/,
      /for\s*\(.+\)\s*{/,
      /while\s*\(.+\)\s*{/,
      /<\w+>.*<\/\w+>/,
      /<\w+.*\/>/,
      /import\s+.*from/,
      /export\s+/
    ];

    return codePatterns.some(pattern => pattern.test(content));
  }

  /**
   * Clear chat history
   */
  clearChat(): void {
    this.messages = [];
    this.saveMessages();
    this.updateUI();
    chatLogger.info('Chat history cleared');
  }
}
