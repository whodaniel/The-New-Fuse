// Get VS Code API
const vscode = acquireVsCodeApi();

// DOM elements
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const inputContainer = document.getElementById('inputContainer');
const dropZone = document.getElementById('dropZone');
const contextInfo = document.getElementById('contextInfo');
const attachBtn = document.getElementById('attachBtn');
const codeBtn = document.getElementById('codeBtn');
const dbBtn = document.getElementById('dbBtn');
const clearContext = document.getElementById('clearContext');

// State
let isReady = false;
let attachedFiles = [];
let currentMode = 'chat';
let dragCounter = 0;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  signalReady();
});

function setupEventListeners() {
  // Send button click
  sendButton.addEventListener('click', sendMessage);

  // Enter key to send (Shift+Enter for new line)
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize textarea
  messageInput.addEventListener('input', () => {
    messageInput.style.height = 'auto';
    messageInput.style.height = messageInput.scrollHeight + 'px';
  });

  // Action buttons
  attachBtn.addEventListener('click', () => {
    vscode.postMessage({ type: 'attachFiles' });
  });

  codeBtn.addEventListener('click', () => {
    setMode('code');
    vscode.postMessage({ type: 'setCodeMode' });
  });

  dbBtn.addEventListener('click', () => {
    setMode('database');
    vscode.postMessage({ type: 'setDatabaseMode' });
  });

  clearContext.addEventListener('click', () => {
    clearAttachedFiles();
  });

  // Drag and drop functionality
  document.addEventListener('dragenter', handleDragEnter);
  document.addEventListener('dragleave', handleDragLeave);
  document.addEventListener('dragover', handleDragOver);
  document.addEventListener('drop', handleDrop);
}

function sendMessage() {
  const content = messageInput.value.trim();
  if (!content) return;

  // Clear input
  messageInput.value = '';
  messageInput.style.height = 'auto';

  // Send to extension
  vscode.postMessage({
    type: 'sendMessage',
    content: content,
  });
}

function clearChat() {
  messagesContainer.innerHTML = '';
}

function focusInput() {
  messageInput.focus();
}

function signalReady() {
  isReady = true;
  vscode.postMessage({ type: 'ready' });
}

// Handle messages from extension
window.addEventListener('message', (event) => {
  const message = event.data;

  switch (message.type) {
    case 'addMessage':
      addMessage(message.message);
      break;
    case 'clearChat':
      clearChat();
      break;
    case 'focusInput':
      focusInput();
      break;
    case 'updateHeader':
      updateHeader(message.header);
      break;
    case 'updateStatus':
      updateStatus(message.status);
      break;
  }
});

function updateHeader(header) {
  const headerElement = document.querySelector('.chat-header h3');
  if (headerElement) {
    headerElement.textContent = header;
  }
}

function updateStatus(status) {
  const statusElement = document.querySelector('.status');
  if (statusElement) {
    statusElement.textContent = status;
    // Add status indicator
    statusElement.className =
      status === 'Ready' ? 'status status-ready' : 'status status-processing';
  }
}

function processMarkdown(text) {
  // Simple markdown processing for basic formatting
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^• (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    .replace(/\n/g, '<br>');
}

// Enhanced addMessage function with markdown support
function addMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.className = `message message-${message.role}`;

  const time = new Date(message.timestamp).toLocaleTimeString();
  const processedContent = processMarkdown(escapeHtml(message.content));

  messageElement.innerHTML = `
        <div class="message-header">
            <span class="message-role">${message.role === 'user' ? '👤 You' : '🤖 AI'}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-content">${processedContent}</div>
    `;

  messagesContainer.appendChild(messageElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Utility function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Mode management
function setMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.input-action-btn').forEach((btn) => btn.classList.remove('active'));

  if (mode === 'code') {
    codeBtn.classList.add('active');
    messageInput.placeholder = 'Ask about code, request functions, debug issues...';
  } else if (mode === 'database') {
    dbBtn.classList.add('active');
    messageInput.placeholder = 'Ask about databases, SQL queries, schema design...';
  } else {
    messageInput.placeholder =
      '@ to add context, / for commands, hold shift to drag in files/images';
  }
}

// File management
function updateContextInfo() {
  const count = attachedFiles.length;
  if (count > 0) {
    contextInfo.style.display = 'flex';
    contextInfo.querySelector('.context-count').textContent =
      `📎 ${count} file${count > 1 ? 's' : ''} attached`;
  } else {
    contextInfo.style.display = 'none';
  }
}

function clearAttachedFiles() {
  attachedFiles = [];
  updateContextInfo();
  vscode.postMessage({ type: 'clearAttachedFiles' });
}

// Drag and drop handlers
function handleDragEnter(e) {
  e.preventDefault();
  dragCounter++;
  if (e.dataTransfer.types.includes('Files')) {
    dropZone.style.display = 'flex';
    dropZone.classList.add('drag-over');
  }
}

function handleDragLeave(e) {
  e.preventDefault();
  dragCounter--;
  if (dragCounter === 0) {
    dropZone.style.display = 'none';
    dropZone.classList.remove('drag-over');
  }
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
}

function handleDrop(e) {
  e.preventDefault();
  dragCounter = 0;
  dropZone.style.display = 'none';
  dropZone.classList.remove('drag-over');

  const files = Array.from(e.dataTransfer.files);
  if (files.length > 0) {
    // Send file information to extension
    const fileInfo = files.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      path: file.path || file.name,
    }));

    attachedFiles.push(...fileInfo);
    updateContextInfo();

    vscode.postMessage({
      type: 'filesDropped',
      files: fileInfo,
    });
  }
}

// Enhanced keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + K to clear chat
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    vscode.postMessage({ type: 'clearChat' });
  }

  // Ctrl/Cmd + / to focus input
  if ((e.ctrlKey || e.metaKey) && e.key === '/') {
    e.preventDefault();
    messageInput.focus();
  }

  // Ctrl/Cmd + U to toggle code mode
  if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
    e.preventDefault();
    setMode(currentMode === 'code' ? 'chat' : 'code');
  }

  // Ctrl/Cmd + D to toggle database mode
  if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
    e.preventDefault();
    setMode(currentMode === 'database' ? 'chat' : 'database');
  }
});

// Initial setup
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', signalReady);
} else {
  signalReady();
}
