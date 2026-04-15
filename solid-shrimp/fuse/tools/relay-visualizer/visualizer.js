/**
 * TNF Relay Visualizer
 * Real-time visualization of message flow through the relay
 */

class RelayVisualizer {
  constructor() {
    // WebSocket connection
    this.ws = null;
    this.agentId = `visualizer-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    // State
    this.connected = false;
    this.agents = new Map();
    this.channels = new Map();
    this.messageCount = 0;
    this.logEntries = [];
    this.maxLogEntries = 100;

    // Canvas
    this.canvas = document.getElementById('visualizer-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Traces
    this.traces = [];
    this.particles = [];

    // Node positions (will be calculated dynamically)
    this.nodePositions = new Map();
    this.relayNode = { x: 0, y: 0, radius: 40 };

    // Animation
    this.animationId = null;
    this.lastFrameTime = 0;

    // DOM elements
    this.elements = {
      connectionStatus: document.getElementById('connection-status'),
      relayUrl: document.getElementById('relay-url'),
      connectBtn: document.getElementById('connect-btn'),
      clearTracesBtn: document.getElementById('clear-traces-btn'),
      canvasOverlay: document.getElementById('canvas-overlay'),
      statAgents: document.getElementById('stat-agents'),
      statChannels: document.getElementById('stat-channels'),
      statMessages: document.getElementById('stat-messages'),
      statTraces: document.getElementById('stat-traces'),
      agentsList: document.getElementById('agents-list'),
      channelsList: document.getElementById('channels-list'),
      messageLog: document.getElementById('message-log'),
      logCount: document.getElementById('log-count'),
    };

    this.init();
  }

  init() {
    // Setup canvas
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Event listeners
    this.elements.connectBtn.addEventListener('click', () => this.toggleConnection());
    this.elements.clearTracesBtn.addEventListener('click', () => this.clearTraces());

    // Pause animation when tab is hidden to save CPU
    this.isPaused = false;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.isPaused = true;
        console.log('[Visualizer] Paused (tab hidden)');
      } else {
        this.isPaused = false;
        this.lastFrameTime = performance.now(); // Reset to avoid huge deltaTime
        console.log('[Visualizer] Resumed');
      }
    });

    // Start animation loop
    this.animate();

    console.log('[Visualizer] Initialized');
  }

  resizeCanvas() {
    const container = this.canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = container.clientWidth * dpr;
    this.canvas.height = container.clientHeight * dpr;
    this.canvas.style.width = container.clientWidth + 'px';
    this.canvas.style.height = container.clientHeight + 'px';

    this.ctx.scale(dpr, dpr);

    // Update relay node position
    this.relayNode.x = container.clientWidth / 2;
    this.relayNode.y = container.clientHeight / 2;

    // Recalculate agent positions
    this.updateNodePositions();
  }

  toggleConnection() {
    if (this.connected) {
      this.disconnect();
    } else {
      this.connect();
    }
  }

  connect() {
    const url = this.elements.relayUrl.value;
    this.updateConnectionStatus('connecting');

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[Visualizer] Connected to relay');
        this.connected = true;
        this.updateConnectionStatus('connected');
        this.elements.canvasOverlay.classList.add('hidden');
        this.elements.connectBtn.textContent = 'Disconnect';

        // Register as viewer agent
        this.send({
          type: 'AGENT_REGISTER',
          payload: {
            agent: {
              id: this.agentId,
              name: 'Relay Visualizer',
              platform: 'web',
              status: 'active',
              capabilities: ['visualization', 'monitoring'],
            },
          },
        });

        // Request initial state
        this.send({ type: 'AGENT_LIST' });
        this.send({ type: 'CHANNEL_LIST' });

        this.addLogEntry('system', 'System', null, 'Connected to relay');
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (e) {
          console.error('[Visualizer] Failed to parse message:', e);
        }
      };

      this.ws.onclose = () => {
        console.log('[Visualizer] Disconnected from relay');
        this.connected = false;
        this.updateConnectionStatus('disconnected');
        this.elements.canvasOverlay.classList.remove('hidden');
        this.elements.connectBtn.textContent = 'Connect';
        this.addLogEntry('system', 'System', null, 'Disconnected from relay');
      };

      this.ws.onerror = (error) => {
        console.error('[Visualizer] WebSocket error:', error);
        this.updateConnectionStatus('disconnected');
      };
    } catch (error) {
      console.error('[Visualizer] Failed to connect:', error);
      this.updateConnectionStatus('disconnected');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = {
        id: crypto.randomUUID(),
        type: data.type,
        timestamp: Date.now(),
        source: this.agentId,
        ...data,
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  handleMessage(message) {
    console.log('[Visualizer] Received:', message.type);

    switch (message.type) {
      case 'WELCOME':
        // Initial welcome from relay
        break;

      case 'AGENT_LIST':
        this.handleAgentList(message.payload?.agents || []);
        break;

      case 'AGENT_STATUS':
        this.handleAgentStatus(message.payload?.agent);
        break;

      case 'CHANNEL_LIST':
        this.handleChannelList(message.payload?.channels || []);
        break;

      case 'CHANNEL_MESSAGE':
      case 'MESSAGE_RECEIVE':
        this.handleChannelMessage(message);
        break;

      case 'MESSAGE_SEND':
        // Echo of our own message - ignore
        break;

      default:
        console.log('[Visualizer] Unknown message type:', message.type);
    }

    this.updateStats();
  }

  handleAgentList(agents) {
    this.agents.clear();
    agents.forEach((agent) => {
      if (agent.id !== this.agentId) {
        this.agents.set(agent.id, agent);
        console.log('[Visualizer] Added agent:', agent.name, agent.id);
      }
    });
    // Force update positions even if no changes
    this.nodePositions.clear();
    this.updateNodePositions();
    this.renderAgentsList();
    console.log(
      '[Visualizer] Agent count:',
      this.agents.size,
      'Node positions:',
      this.nodePositions.size
    );
  }

  handleAgentStatus(agent) {
    if (!agent || agent.id === this.agentId) {
      return;
    }

    if (agent.status === 'active') {
      this.agents.set(agent.id, agent);
      this.addLogEntry('system', agent.name, null, 'Agent connected');
    } else if (agent.status === 'inactive' || agent.status === 'disconnected') {
      this.agents.delete(agent.id);
      this.addLogEntry('system', agent.name, null, 'Agent disconnected');
    }

    this.updateNodePositions();
    this.renderAgentsList();
  }

  handleChannelList(channels) {
    this.channels.clear();
    channels.forEach((channel) => {
      this.channels.set(channel.id, channel);
    });
    this.renderChannelsList();
  }

  handleChannelMessage(message) {
    this.messageCount++;

    const payload = message.payload || {};
    const from = message.source || payload.from || 'Unknown';
    const to = payload.to || 'broadcast';
    const content = payload.content || '';
    const channel = message.channel;

    // Determine message type for styling
    let type = 'broadcast';
    if (content.includes('[User →') || content.includes('[User ->')) {
      type = 'user';
    } else if (
      content.includes('[AI →') ||
      content.includes('[AI ->') ||
      content.includes('[AI Response]')
    ) {
      type = 'ai';
    } else if (content.startsWith('/')) {
      type = 'command';
    }

    // Add log entry
    const fromAgent = this.agents.get(from);
    const fromName = fromAgent?.name || from;
    const toName = to === 'broadcast' ? 'All' : this.agents.get(to)?.name || to;
    this.addLogEntry(type, fromName, toName, content.substring(0, 200));

    // Create visual trace
    this.createTrace(from, to, type, channel);
  }

  updateConnectionStatus(status) {
    const statusEl = this.elements.connectionStatus;
    const dot = statusEl.querySelector('.status-dot');
    const text = statusEl.querySelector('.status-text');

    dot.className = 'status-dot ' + status;
    text.textContent = status.charAt(0).toUpperCase() + status.slice(1);
  }

  updateNodePositions() {
    const agentCount = this.agents.size;
    if (agentCount === 0) {
      return;
    }

    const centerX = this.relayNode.x;
    const centerY = this.relayNode.y;
    const radius = Math.min(centerX, centerY) * 0.6;

    let index = 0;
    for (const [agentId, agent] of this.agents) {
      const angle = (index / agentCount) * Math.PI * 2 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      this.nodePositions.set(agentId, { x, y, agent });
      index++;
    }
  }

  createTrace(fromId, toId, type, channel) {
    const colors = {
      user: '#22c55e',
      ai: '#6366f1',
      command: '#f59e0b',
      broadcast: '#ec4899',
    };

    const color = colors[type] || colors.broadcast;
    const fromPos = this.nodePositions.get(fromId) || this.relayNode;
    const toPos = toId === 'broadcast' ? null : this.nodePositions.get(toId) || this.relayNode;

    if (toPos) {
      // Direct trace: from -> relay -> to
      this.traces.push({
        startX: fromPos.x,
        startY: fromPos.y,
        endX: this.relayNode.x,
        endY: this.relayNode.y,
        color,
        progress: 0,
        phase: 1,
        finalX: toPos.x,
        finalY: toPos.y,
        createdAt: Date.now(),
      });
    } else {
      // Broadcast: from -> relay -> all agents
      this.traces.push({
        startX: fromPos.x,
        startY: fromPos.y,
        endX: this.relayNode.x,
        endY: this.relayNode.y,
        color,
        progress: 0,
        phase: 1,
        broadcast: true,
        createdAt: Date.now(),
      });
    }

    // Add particles at source
    this.addParticles(fromPos.x, fromPos.y, color, 5);
  }

  addParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        color,
        life: 1,
        size: Math.random() * 4 + 2,
      });
    }
  }

  clearTraces() {
    this.traces = [];
    this.particles = [];
  }

  updateStats() {
    this.elements.statAgents.textContent = this.agents.size;
    this.elements.statChannels.textContent = this.channels.size;
    this.elements.statMessages.textContent = this.messageCount;
    this.elements.statTraces.textContent = this.traces.length;
  }

  renderAgentsList() {
    const container = this.elements.agentsList;

    if (this.agents.size === 0) {
      container.innerHTML = '<div class="empty-state">No agents connected</div>';
      return;
    }

    container.innerHTML = Array.from(this.agents.values())
      .map((agent) => {
        const colorHash = Array.from(agent.id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const hue = colorHash % 360;

        return `
        <div class="agent-item">
          <div class="agent-avatar" style="background: hsl(${hue}, 60%, 50%);">
            ${agent.name.charAt(0).toUpperCase()}
          </div>
          <div class="agent-info">
            <div class="agent-name">${agent.name}</div>
            <div class="agent-platform">${agent.platform || 'unknown'}</div>
          </div>
          <div class="agent-status"></div>
        </div>
      `;
      })
      .join('');
  }

  renderChannelsList() {
    const container = this.elements.channelsList;

    if (this.channels.size === 0) {
      container.innerHTML = '<div class="empty-state">No channels</div>';
      return;
    }

    container.innerHTML = Array.from(this.channels.values())
      .map(
        (channel) => `
      <div class="channel-item">
        <span class="channel-icon">#</span>
        <span class="channel-name">${channel.name}</span>
        <span class="channel-count">${channel.members?.length || 0} members</span>
      </div>
    `
      )
      .join('');
  }

  addLogEntry(type, from, to, content) {
    const entry = {
      type,
      from,
      to,
      content,
      time: new Date().toLocaleTimeString(),
    };

    this.logEntries.unshift(entry);
    if (this.logEntries.length > this.maxLogEntries) {
      this.logEntries.pop();
    }

    this.renderMessageLog();
  }

  renderMessageLog() {
    const container = this.elements.messageLog;
    this.elements.logCount.textContent = this.logEntries.length;

    if (this.logEntries.length === 0) {
      container.innerHTML = '<div class="empty-state">No messages yet</div>';
      return;
    }

    container.innerHTML = this.logEntries
      .slice(0, 50)
      .map(
        (entry) => `
      <div class="log-entry ${entry.type}">
        <span class="log-time">${entry.time}</span>
        <span class="log-from">${entry.from}</span>
        ${entry.to ? `<span class="log-arrow">→</span><span class="log-to">${entry.to}</span>` : ''}
        <div class="log-content">${this.escapeHtml(entry.content)}</div>
      </div>
    `
      )
      .join('');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================
  // Animation & Rendering
  // ============================================

  animate(currentTime = 0) {
    // Schedule next frame first (for consistent timing)
    this.animationId = requestAnimationFrame((t) => this.animate(t));

    // Skip updates if paused (tab hidden)
    if (this.isPaused) {
      return;
    }

    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    this.update(deltaTime);
    this.render();
  }

  update(deltaTime) {
    const dt = Math.min(deltaTime / 16, 2); // Normalize to ~60fps

    // Update traces
    for (let i = this.traces.length - 1; i >= 0; i--) {
      const trace = this.traces[i];
      trace.progress += 0.03 * dt;

      if (trace.progress >= 1) {
        if (trace.phase === 1) {
          // Phase 1 complete (to relay)
          trace.phase = 2;
          trace.progress = 0;

          // Add particles at relay
          this.addParticles(this.relayNode.x, this.relayNode.y, trace.color, 8);

          if (trace.broadcast) {
            // Create traces to all agents
            for (const [agentId, pos] of this.nodePositions) {
              this.traces.push({
                startX: this.relayNode.x,
                startY: this.relayNode.y,
                endX: pos.x,
                endY: pos.y,
                color: trace.color,
                progress: 0,
                phase: 3, // Final phase
                createdAt: Date.now(),
              });
            }
            this.traces.splice(i, 1);
          } else if (trace.finalX !== undefined) {
            // Continue to destination
            trace.startX = this.relayNode.x;
            trace.startY = this.relayNode.y;
            trace.endX = trace.finalX;
            trace.endY = trace.finalY;
          } else {
            this.traces.splice(i, 1);
          }
        } else if (trace.phase === 2 || trace.phase === 3) {
          // Add particles at destination
          this.addParticles(trace.endX, trace.endY, trace.color, 5);
          this.traces.splice(i, 1);
        }
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= 0.02 * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    this.updateStats();
  }

  render() {
    const ctx = this.ctx;
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);

    // Clear canvas
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    this.drawGrid(ctx, width, height);

    // Draw connection lines (static)
    this.drawConnections(ctx);

    // Draw traces
    this.drawTraces(ctx);

    // Draw particles
    this.drawParticles(ctx);

    // Draw relay node
    this.drawRelayNode(ctx);

    // Draw agent nodes
    this.drawAgentNodes(ctx);
  }

  drawGrid(ctx, width, height) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;

    const gridSize = 40;

    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  drawConnections(ctx) {
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.1)';
    ctx.lineWidth = 1;

    for (const [agentId, pos] of this.nodePositions) {
      ctx.beginPath();
      ctx.moveTo(this.relayNode.x, this.relayNode.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  }

  drawTraces(ctx) {
    for (const trace of this.traces) {
      const progress = trace.progress;
      const startX = trace.startX;
      const startY = trace.startY;
      const endX = trace.endX;
      const endY = trace.endY;

      // Calculate current position
      const currentX = startX + (endX - startX) * Math.min(progress, 1);
      const currentY = startY + (endY - startY) * Math.min(progress, 1);

      // Draw trail
      const gradient = ctx.createLinearGradient(startX, startY, currentX, currentY);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.5, trace.color + '80');
      gradient.addColorStop(1, trace.color);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();

      // Draw head
      ctx.beginPath();
      ctx.arc(currentX, currentY, 6, 0, Math.PI * 2);
      ctx.fillStyle = trace.color;
      ctx.fill();

      // Glow effect
      ctx.beginPath();
      ctx.arc(currentX, currentY, 12, 0, Math.PI * 2);
      const glowGradient = ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, 12);
      glowGradient.addColorStop(0, trace.color + '60');
      glowGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGradient;
      ctx.fill();
    }
  }

  drawParticles(ctx) {
    for (const p of this.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle =
        p.color +
        Math.floor(p.life * 255)
          .toString(16)
          .padStart(2, '0');
      ctx.fill();
    }
  }

  drawRelayNode(ctx) {
    const { x, y, radius } = this.relayNode;

    // Outer glow
    const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
    glowGradient.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
    glowGradient.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
    ctx.fillStyle = glowGradient;
    ctx.fill();

    // Main circle
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, '#7c3aed');
    gradient.addColorStop(1, '#4f46e5');

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Pulse animation
    const pulseRadius = radius + Math.sin(Date.now() / 500) * 5;
    ctx.beginPath();
    ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RELAY', x, y);
  }

  drawAgentNodes(ctx) {
    for (const [agentId, pos] of this.nodePositions) {
      const agent = pos.agent;
      const nodeRadius = 25;

      // Color based on agent ID
      const colorHash = Array.from(agentId).reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const hue = colorHash % 360;
      const color = `hsl(${hue}, 60%, 50%)`;

      // Glow
      const glowGradient = ctx.createRadialGradient(
        pos.x,
        pos.y,
        0,
        pos.x,
        pos.y,
        nodeRadius * 1.5
      );
      glowGradient.addColorStop(0, color + '40');
      glowGradient.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();

      // Main circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Initial
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(agent?.name?.charAt(0).toUpperCase() || '?', pos.x, pos.y);

      // Name label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '12px Inter';
      ctx.fillText(agent?.name || 'Unknown', pos.x, pos.y + nodeRadius + 16);
    }
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  window.visualizer = new RelayVisualizer();
});
