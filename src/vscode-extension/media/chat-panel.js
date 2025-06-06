// src/vscode-extension/media/chat-panel.js

(function () {
    const vscode = acquireVsCodeApi();

    function renderMessage(msg) {
        const div = document.createElement('div');
        div.className = 'chat-message ' + (msg.role === 'user' ? 'user' : 'assistant');
        // Render Markdown (basic)
        div.innerHTML = `
            <div class="message-header">
                <span class="role">${msg.role === 'user' ? 'You' : 'Assistant'}</span>
                <button class="copy-btn" title="Copy">📋</button>
            </div>
            <div class="message-content">${renderMarkdown(msg.content)}</div>
        `;
        div.querySelector('.copy-btn').onclick = () => {
            navigator.clipboard.writeText(msg.content);
        };
        return div;
    }

    function renderMarkdown(text) {
        // Basic Markdown/code block support (replace with a real parser for production)
        return text
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/```([^`]+)```/gs, '<pre><code>$1</code></pre>')
            .replace(/\n/g, '<br>');
    }

    function appendMessage(msg) {
        const container = document.getElementById('chat-messages');
        container.appendChild(renderMessage(msg));
        container.scrollTop = container.scrollHeight;
    }

    function clearInput() {
        document.getElementById('chat-input').value = '';
    }

    function setThinking(isThinking) {
        document.getElementById('thinking-indicator').style.display = isThinking ? '' : 'none';
    }

    document.getElementById('send-button').onclick = sendMessage;
    document.getElementById('chat-input').addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    function sendMessage() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text) return;
        vscode.postMessage({ command: 'chat:send', text });
        clearInput();
    }

    window.addEventListener('message', event => {
        const { command, payload } = event.data;
        if (command === 'chat:renderMessages') {
            const container = document.getElementById('chat-messages');
            container.innerHTML = '';
            (payload.messages || []).forEach(appendMessage);
        } else if (command === 'chat:appendMessage') {
            appendMessage(payload);
        } else if (command === 'chat:clearInput') {
            clearInput();
        } else if (command === 'chat:setThinking') {
            setThinking(payload);
        }
    });
})();
