/**
 * The New Fuse VSCode Extension - Webview Main Script
 * Version 9.0.0
 */

(function () {
  // @ts-ignore
  const vscode = acquireVsCodeApi();

  // DOM Elements
  const messagesContainer = document.getElementById('messages');
  const inputElement = document.getElementById('input');
  const sendButton = document.getElementById('btn-send');
  const attachButton = document.getElementById('btn-attach');
  const codeButton = document.getElementById('btn-code');
  const agentButton = document.getElementById('btn-agent');
  const contextBar = document.getElementById('context-bar');
  const dropZone = document.getElementById('drop-zone');

  // State
  let currentMode = 'chat';
  let dragCounter = 0;

  // Initialize
  function init() {
    setupEventListeners();
    vscode.postMessage({ type: 'ready' });
  }

  function setupEventListeners() {
    // Send message
    sendButton?.addEventListener('click', sendMessage);
    inputElement?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Auto-resize textarea
    inputElement?.addEventListener('input', () => {
      inputElement.style.height = 'auto';
      inputElement.style.height = Math.min(inputElement.scrollHeight, 200) + 'px';
    });

    // Action buttons
    attachButton?.addEventListener('click', () => {
      vscode.postMessage({ type: 'attachFiles' });
    });

    codeButton?.addEventListener('click', () => {
      setMode('code');
    });

    agentButton?.addEventListener('click', () => {
      setMode('agent');
    });

    // Context bar clear
    document.querySelector('.context-clear')?.addEventListener('click', () => {
      vscode.postMessage({ type: 'clearContext' });
    });

    // Drag and drop
    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', handleDrop);

    // Handle messages from extension
    window.addEventListener('message', handleExtensionMessage);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
  }

  function sendMessage() {
    const content = inputElement?.value?.trim();
    if (!content) return;

    inputElement.value = '';
    inputElement.style.height = 'auto';

    vscode.postMessage({
      type: 'sendMessage',
      payload: content,
    });
  }

  function setMode(mode) {
    currentMode = mode;

    // Update button states
    document.querySelectorAll('.action-btn').forEach((btn) => {
      btn.classList.remove('active');
    });

    if (mode === 'code') {
      codeButton?.classList.add('active');
      inputElement.placeholder = 'Ask about code...';
    } else if (mode === 'agent') {
      agentButton?.classList.add('active');
      inputElement.placeholder = 'Talk to agents...';
    } else {
      inputElement.placeholder = 'Type a message... (/ for commands)';
    }

    vscode.postMessage({ type: 'setMode', payload: mode });
  }

  function handleExtensionMessage(event) {
    const message = event.data;

    switch (message.type) {
      case 'addMessage':
        addMessage(message.payload);
        break;

      case 'clearChat':
        clearMessages();
        break;

      case 'focusInput':
        inputElement?.focus();
        break;

      case 'updateStatus':
        updateStatus(message.payload);
        break;

      case 'error':
        showError(message.payload?.message || 'An error occurred');
        break;
    }
  }

  function addMessage(message) {
    if (!message || !messagesContainer) return;

    const messageEl = document.createElement('div');
    messageEl.className = `message message-${message.role}`;
    messageEl.dataset.messageId = message.id;

    const time = new Date(message.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const roleIcon = message.role === 'user' ? '👤' : '🤖';
    const roleName = message.role === 'user' ? 'You' : 'AI';

    messageEl.innerHTML = `
      <div class="message-header">
        <span class="message-role">${roleIcon} ${roleName}</span>
        <span class="message-time">${time}</span>
      </div>
      <div class="message-content">${formatContent(message.content)}</div>
      ${message.metadata?.model ? `<div class="message-meta">${message.metadata.model}</div>` : ''}
    `;

    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function formatContent(content) {
    if (!content) return '';

    // Escape HTML
    let formatted = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Code blocks
    formatted = formatted.replace(
      /```(\w*)\n([\s\S]*?)```/g,
      '<pre class="code-block"><code class="language-$1">$2</code></pre>'
    );

    // Inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Bold
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic
    formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Headers
    formatted = formatted.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    formatted = formatted.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    formatted = formatted.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Lists
    formatted = formatted.replace(/^- (.+)$/gm, '<li>$1</li>');
    formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
  }

  function clearMessages() {
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
    }
  }

  function updateStatus(status) {
    if (!status) return;

    // Update context bar
    if (status.contextCount !== undefined) {
      if (status.contextCount > 0) {
        contextBar?.classList.remove('hidden');
        const countEl = contextBar?.querySelector('.context-count');
        if (countEl) {
          countEl.textContent = `📎 ${status.contextCount} file${status.contextCount > 1 ? 's' : ''} attached`;
        }
      } else {
        contextBar?.classList.add('hidden');
      }
    }

    // Update attachment count
    if (status.attachmentCount !== undefined && status.attachmentCount > 0) {
      contextBar?.classList.remove('hidden');
      const countEl = contextBar?.querySelector('.context-count');
      if (countEl) {
        countEl.textContent = `📎 ${status.attachmentCount} file${status.attachmentCount > 1 ? 's' : ''} ready`;
      }
    }
  }

  function showError(message) {
    const errorEl = document.createElement('div');
    errorEl.className = 'message message-error';
    errorEl.innerHTML = `
      <div class="message-content">❌ ${message}</div>
    `;
    messagesContainer?.appendChild(errorEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Drag and drop handlers
  function handleDragEnter(e) {
    e.preventDefault();
    dragCounter++;
    if (e.dataTransfer?.types.includes('Files')) {
      dropZone?.classList.remove('hidden');
    }
  }

  function handleDragLeave(e) {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) {
      dropZone?.classList.add('hidden');
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    dragCounter = 0;
    dropZone?.classList.add('hidden');

    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length > 0) {
      const fileInfo = files.map((file) => ({
        name: file.name,
        path: file.path || file.name,
        size: file.size,
        type: file.type,
      }));

      vscode.postMessage({
        type: 'filesDropped',
        payload: fileInfo,
      });
    }
  }

  // Keyboard shortcuts
  function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + K - Clear chat
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      vscode.postMessage({ type: 'clearChat' });
    }

    // Ctrl/Cmd + / - Focus input
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      inputElement?.focus();
    }

    // Escape - Exit mode
    if (e.key === 'Escape' && currentMode !== 'chat') {
      setMode('chat');
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
