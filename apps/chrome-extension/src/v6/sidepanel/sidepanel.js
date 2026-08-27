/**
 * Fuse Connect v7 - Side panel chat.
 * Registers as a federated participant (same ID# / role contract as page chat)
 * and routes A2A traffic over the existing relay WebSocket.
 */

class FuseSidePanelChat {
  constructor() {
    this.tabId = null;
    this.agent = null;
    this.pageAgent = null;
    this.pair = null;
    this.messages = [];
    this.init();
  }

  async init() {
    this.bind();
    chrome.runtime.onMessage.addListener((message) => this.onRuntimeMessage(message));
    await this.hydrate();
  }

  bind() {
    document.getElementById('sp-send-message')?.addEventListener('click', () => this.send());
    document.getElementById('sp-chat-input')?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') this.send();
    });
    document.getElementById('sp-a2a-enabled')?.addEventListener('change', (event) => {
      this.setPairing(event.target.checked);
    });
  }

  async hydrate() {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    this.tabId = tab?.id || null;
    chrome.runtime.sendMessage(
      {
        type: 'SIDE_PANEL_READY',
        tabId: this.tabId,
      },
      (response) => {
        void chrome.runtime.lastError;
        if (!response?.success) return;
        this.applyReady(response);
      }
    );
  }

  applyReady(response) {
    this.tabId = response.tabId || this.tabId;
    this.agent = response.agent || null;
    this.pageAgent = response.pageAgent || null;
    this.pair = response.pair || null;
    this.renderIdentity();
    this.renderConnection(response.connectionStatus);
  }

  renderConnection(status) {
    const text = document.getElementById('connection-status-text');
    if (text) text.textContent = status === 'connected' ? 'Relay connected' : 'Relay offline';
    const dot = document.querySelector('.status-dot');
    if (dot) dot.className = `status-dot ${status === 'connected' ? 'connected' : 'disconnected'}`;
  }

  renderIdentity() {
    const handle = document.getElementById('sp-handle');
    const idNumber = document.getElementById('sp-id-number');
    const canonical = document.getElementById('sp-canonical');
    const peer = document.getElementById('sp-peer');
    const toggle = document.getElementById('sp-a2a-enabled');
    const hint = document.getElementById('sp-pair-hint');

    if (handle) handle.textContent = this.agent?.operationalHandle || this.agent?.id || '—';
    if (idNumber) idNumber.textContent = this.agent?.idNumber || '—';
    if (canonical) canonical.textContent = this.agent?.canonicalEntityId || '—';
    if (peer) {
      peer.textContent = this.pageAgent
        ? `${this.pageAgent.operationalHandle || this.pageAgent.id}  ${this.pageAgent.idNumber || ''}`
        : 'No page agent yet — open an AI chat tab';
    }
    if (toggle) toggle.checked = this.pair?.a2aEnabled !== false;
    if (hint) {
      hint.textContent = this.pair?.a2aEnabled
        ? `Direct WS A2A on ${this.pair.channelId}. Unaddressed messages route to the page peer.`
        : 'A2A pairing off. Use @ID#: or /to HANDLE to address the page chat.';
    }
  }

  setPairing(enabled) {
    if (!this.tabId) return;
    chrome.runtime.sendMessage(
      {
        type: 'SET_SIDE_PANEL_PAIRING',
        tabId: this.tabId,
        a2aEnabled: !!enabled,
      },
      (response) => {
        void chrome.runtime.lastError;
        if (response?.pair) this.pair = response.pair;
        this.renderIdentity();
      }
    );
  }

  onRuntimeMessage(message) {
    if (!message || typeof message !== 'object') return;
    if (message.type === 'CONNECTION_STATUS') {
      this.renderConnection(message.status);
    }
    if (message.type === 'AGENTS_UPDATE') {
      const agents = Array.isArray(message.agents) ? message.agents : [];
      if (this.agent?.id) {
        this.agent = agents.find((agent) => agent.id === this.agent.id) || this.agent;
      }
      if (this.tabId) {
        this.pageAgent =
          agents.find(
            (agent) =>
              Number(agent.metadata?.tabId) === this.tabId &&
              String(agent.id).startsWith('page-agent-')
          ) || this.pageAgent;
      }
      this.renderIdentity();
    }
    if (message.type === 'SIDE_PANEL_PAIR_UPDATE') {
      this.pair = message.pair || this.pair;
      this.pageAgent = message.pageAgent || this.pageAgent;
      this.agent = message.sidePanelAgent || this.agent;
      this.renderIdentity();
    }
    if (message.type === 'NEW_MESSAGE') {
      this.appendMessage(message.message || message);
    }
  }

  appendMessage(msg) {
    if (!msg) return;
    const to = msg.to || msg.payload?.to;
    const from = msg.from || msg.metadata?.senderId || msg.payload?.from;
    const mine = this.agent?.id;
    const peer = this.pageAgent?.id;
    const relevant =
      !to ||
      to === 'broadcast' ||
      to === mine ||
      to === peer ||
      from === mine ||
      from === peer ||
      (this.pair?.channelId && (msg.channel === this.pair.channelId));
    if (!relevant) return;

    this.messages.push(msg);
    if (this.messages.length > 80) this.messages = this.messages.slice(-80);
    this.renderMessages();
  }

  renderMessages() {
    const stream = document.getElementById('sp-chat-stream');
    if (!stream) return;
    if (this.messages.length === 0) {
      stream.innerHTML = '<div class="empty-state small"><p>No A2A messages yet</p></div>';
      return;
    }
    stream.innerHTML = this.messages
      .map((msg) => {
        const from = msg.metadata?.operationalHandle || msg.from || 'unknown';
        const idNumber = msg.metadata?.idNumber || '';
        const content = String(msg.content || msg.payload?.content || '').replace(/</g, '&lt;');
        return `<div class="sp-msg"><div class="sp-msg-meta">${from} ${idNumber}</div>${content}</div>`;
      })
      .join('');
    stream.scrollTop = stream.scrollHeight;
  }

  send() {
    const input = document.getElementById('sp-chat-input');
    const content = String(input?.value || '').trim();
    if (!content || !this.agent?.id) return;
    chrome.runtime.sendMessage(
      {
        type: 'BROADCAST_MESSAGE',
        content,
        senderId: this.agent.id,
        channel: this.pair?.a2aEnabled ? this.pair.channelId : undefined,
        metadata: {
          senderId: this.agent.id,
          surface: 'side-panel',
          tabId: this.tabId,
        },
      },
      () => {
        void chrome.runtime.lastError;
      }
    );
    this.appendMessage({
      from: this.agent.id,
      to: this.pair?.a2aEnabled ? this.pageAgent?.id : 'broadcast',
      content,
      metadata: {
        operationalHandle: this.agent.operationalHandle,
        idNumber: this.agent.idNumber,
        senderId: this.agent.id,
      },
    });
    if (input) input.value = '';
  }
}

void new FuseSidePanelChat();
