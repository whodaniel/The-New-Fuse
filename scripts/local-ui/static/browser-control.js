(function () {
  const client = new window.TNFFederationNodeClient({
    platform: 'cli-html',
    agentName: 'TNF CLI HTML Federation Node',
  });

  const els = {
    relayUrl: document.getElementById('relay-url'),
    relayStatus: document.getElementById('relay-status'),
    registerStatus: document.getElementById('register-status'),
    nodeId: document.getElementById('node-id'),
    connectBtn: document.getElementById('connect-btn'),
    refreshBtn: document.getElementById('refresh-btn'),
    newChannel: document.getElementById('new-channel'),
    createChannelBtn: document.getElementById('create-channel-btn'),
    channelSelect: document.getElementById('channel-select'),
    joinBtn: document.getElementById('join-btn'),
    leaveBtn: document.getElementById('leave-btn'),
    pauseBtn: document.getElementById('pause-btn'),
    resumeBtn: document.getElementById('resume-btn'),
    messageInput: document.getElementById('message-input'),
    sendBtn: document.getElementById('send-btn'),
    feed: document.getElementById('feed'),
    agentList: document.getElementById('agent-list'),
    activity: document.getElementById('activity'),
    dmAgentSelect: document.getElementById('dm-agent-select'),
    dmInput: document.getElementById('dm-input'),
    dmSendBtn: document.getElementById('dm-send-btn'),
    taskTitle: document.getElementById('task-title'),
    taskDescription: document.getElementById('task-description'),
    taskCapabilities: document.getElementById('task-capabilities'),
    taskDispatchBtn: document.getElementById('task-dispatch-btn'),
    gateStatus: document.getElementById('gate-status'),
    gateToggleBtn: document.getElementById('gate-toggle-btn'),
    gatePending: document.getElementById('gate-pending'),
  };

  function log(line) {
    const div = document.createElement('div');
    div.className = 'activity-line';
    div.textContent = `[${new Date().toLocaleTimeString()}] ${line}`;
    els.activity.prepend(div);
  }

  function setPill(el, ok, onLabel, offLabel) {
    el.className = `pill ${ok ? 'ok' : 'off'}`;
    el.textContent = ok ? onLabel : offLabel;
  }

  function renderChannels(channels) {
    const selected = els.channelSelect.value;
    els.channelSelect.innerHTML = '<option value="">Select channel…</option>';
    for (const channel of channels) {
      const option = document.createElement('option');
      option.value = channel.id;
      option.textContent = `${channel.name} (${channel.members?.length || 0})`;
      els.channelSelect.appendChild(option);
    }
    if (selected) els.channelSelect.value = selected;
  }

  function renderAgents(agents) {
    els.agentList.innerHTML = '';
    for (const agent of agents.slice(0, 20)) {
      const li = document.createElement('li');
      li.textContent = `${agent.name} · ${agent.platform} · ${agent.status}`;
      els.agentList.appendChild(li);
    }
    if (els.dmAgentSelect) {
      const selected = els.dmAgentSelect.value;
      els.dmAgentSelect.innerHTML = '<option value="">Select agent…</option>';
      for (const agent of agents) {
        if (agent.id === client.agentId) continue;
        const option = document.createElement('option');
        option.value = agent.id;
        option.textContent = `${agent.name} (${agent.platform})`;
        els.dmAgentSelect.appendChild(option);
      }
      if (selected) els.dmAgentSelect.value = selected;
    }
  }

  function renderMessage(message) {
    const item = document.createElement('article');
    item.className = 'feed-item';
    const from = document.createElement('strong');
    from.textContent = message.from || 'unknown';
    const body = document.createElement('div');
    body.textContent =
      typeof message.content === 'string' ? message.content : JSON.stringify(message.content ?? '');
    item.appendChild(from);
    item.appendChild(body);
    els.feed.prepend(item);
  }

  function syncState() {
    const state = client.getState();
    setPill(els.relayStatus, state.connected, 'Relay ON', 'Relay OFF');
    setPill(els.registerStatus, state.registered, 'Registered ON', 'Registered OFF');
    els.nodeId.textContent = state.agentId;
    renderChannels(state.channels);
    renderAgents(state.agents);
  }

  async function prefillFeedHistory() {
    try {
      const res = await fetch('/relay-api/activity/recent?count=50', {
        headers: { accept: 'application/json' },
      });
      if (!res.ok) return;
      const data = await res.json();
      const events = data.events || data.activity || data.entries || [];
      if (!Array.isArray(events) || !events.length) return;
      els.feed.innerHTML = '';
      for (const event of events.slice(0, 50)) {
        renderMessage({
          from: event.from || event.source || event.agentId || 'history',
          content: event.content || event.summary || event.message || JSON.stringify(event),
        });
      }
      log(`Loaded ${events.length} history events`);
    } catch {}
  }

  // --- Bridge gate ---
  let gateEnabled = null;

  async function refreshGate() {
    try {
      const [statusRes, pendingRes] = await Promise.all([
        fetch('/relay-api/status', { headers: { accept: 'application/json' } }),
        fetch('/relay-api/bridge/pending', { headers: { accept: 'application/json' } }),
      ]);
      if (statusRes.ok) {
        const status = await statusRes.json();
        const gate = status.bridgeGate ?? status.bridge ?? {};
        gateEnabled = typeof gate.enabled === 'boolean' ? gate.enabled : gateEnabled;
        if (gateEnabled !== null) {
          setPill(els.gateStatus, gateEnabled, 'Gate OPEN', 'Gate CLOSED');
        }
      }
      if (pendingRes.ok) {
        const data = await pendingRes.json();
        const pending = data.pending || data.agents || [];
        els.gatePending.innerHTML = '';
        if (!pending.length) {
          const li = document.createElement('li');
          li.textContent = 'No pending agents';
          li.className = 'meta';
          els.gatePending.appendChild(li);
        }
        for (const entry of pending) {
          const agentId = entry.agentId || entry.id;
          const li = document.createElement('li');
          li.className = 'gate-row';
          const label = document.createElement('span');
          label.textContent = entry.name ? `${entry.name} (${agentId})` : String(agentId);
          const actions = document.createElement('div');
          actions.className = 'actions';
          const approve = document.createElement('button');
          approve.className = 'small';
          approve.textContent = 'Approve';
          approve.addEventListener('click', () => gateAction('approve', agentId));
          const deny = document.createElement('button');
          deny.className = 'ghost small';
          deny.textContent = 'Deny';
          deny.addEventListener('click', () => gateAction('deny', agentId));
          actions.appendChild(approve);
          actions.appendChild(deny);
          li.appendChild(label);
          li.appendChild(actions);
          els.gatePending.appendChild(li);
        }
      }
    } catch {
      setPill(els.gateStatus, false, 'Gate OPEN', 'Gate —');
    }
  }

  async function gateAction(action, agentId) {
    try {
      const body = action === 'deny' ? { agentId, reason: 'denied from panel' } : { agentId };
      const res = await fetch(`/relay-api/bridge/${action}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(body),
      });
      log(`Bridge ${action} ${agentId}: ${res.status}`);
      refreshGate();
    } catch (error) {
      log(`Bridge ${action} failed: ${error.message}`);
    }
  }

  els.gateToggleBtn?.addEventListener('click', async () => {
    try {
      const res = await fetch('/relay-api/bridge/toggle', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ enabled: !(gateEnabled ?? false) }),
      });
      log(`Bridge gate toggle: ${res.status}`);
      refreshGate();
    } catch (error) {
      log(`Gate toggle failed: ${error.message}`);
    }
  });

  // --- Client events ---
  client.on('connected', () => {
    log('Connected to relay');
    syncState();
    prefillFeedHistory();
  });
  client.on('disconnected', () => {
    log('Disconnected from relay');
    syncState();
  });
  client.on('reconnect_scheduled', (delay) => log(`Reconnecting in ${Math.round(delay / 1000)}s…`));
  client.on('registered', () => {
    log('Registration confirmed');
    syncState();
  });
  client.on('registration_error', (payload) =>
    log(`Registration error: ${JSON.stringify(payload)}`)
  );
  client.on('channels_updated', (channels) => {
    renderChannels(channels);
    log(`Channels updated (${channels.length})`);
  });
  client.on('agents_updated', (agents) => {
    renderAgents(agents);
    log(`Agents updated (${agents.length})`);
  });
  client.on('channel_message', (message) => {
    renderMessage(message);
    log(`Message from ${message.from}`);
  });
  client.on('task_assign', (payload) => {
    log(`Task assigned: ${JSON.stringify(payload?.task?.title || payload?.taskId || payload)}`);
  });
  client.on('relay_error', (payload) => log(`Relay error: ${JSON.stringify(payload)}`));
  client.on('error', (error) => log(`Error: ${error?.message || String(error)}`));

  // --- Buttons ---
  els.connectBtn.addEventListener('click', async () => {
    log(`Connecting ${els.relayUrl.value}`);
    await client.connect(els.relayUrl.value.trim());
    syncState();
  });

  els.refreshBtn.addEventListener('click', () => {
    client.requestChannelList();
    client.requestAgentList();
    refreshGate();
    syncState();
  });

  els.createChannelBtn.addEventListener('click', () => {
    const name = els.newChannel.value.trim();
    if (!name) return;
    client.createChannel(name);
    els.newChannel.value = '';
    log(`Create channel ${name}`);
  });

  els.joinBtn.addEventListener('click', () => {
    const channelId = els.channelSelect.value;
    if (!channelId) return;
    client.joinChannel(channelId);
    log(`Join ${channelId}`);
  });

  els.leaveBtn.addEventListener('click', () => {
    const channelId = els.channelSelect.value;
    if (!channelId) return;
    client.leaveChannel(channelId);
    log(`Leave ${channelId}`);
  });

  els.pauseBtn.addEventListener('click', () => {
    const channelId = els.channelSelect.value;
    if (!channelId) return;
    client.pauseChannel(channelId);
    log(`Pause requested for ${channelId}`);
  });

  els.resumeBtn.addEventListener('click', () => {
    const channelId = els.channelSelect.value;
    if (!channelId) return;
    client.resumeChannel(channelId);
    log(`Resume requested for ${channelId}`);
  });

  els.sendBtn.addEventListener('click', () => {
    const channelId = els.channelSelect.value;
    const content = els.messageInput.value.trim();
    if (!channelId || !content) return;
    client.sendChannelMessage(channelId, content);
    els.messageInput.value = '';
    log(`Sent message to ${channelId}`);
  });

  els.dmSendBtn?.addEventListener('click', () => {
    const agentId = els.dmAgentSelect.value;
    const content = els.dmInput.value.trim();
    if (!agentId || !content) return;
    client.sendDirectMessage(agentId, content);
    els.dmInput.value = '';
    log(`Direct message sent to ${agentId}`);
  });

  els.taskDispatchBtn?.addEventListener('click', () => {
    const title = els.taskTitle.value.trim();
    if (!title) return;
    const requiredCapabilities = els.taskCapabilities.value
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const task = {
      id: `panel-task-${Date.now()}`,
      title,
      description: els.taskDescription.value.trim(),
      requiredCapabilities,
      priority: 'normal',
      createdAt: new Date().toISOString(),
      source: 'browser-control-panel',
    };
    client.dispatchTask(task);
    els.taskTitle.value = '';
    els.taskDescription.value = '';
    els.taskCapabilities.value = '';
    log(`Dispatched task "${title}" (caps: ${requiredCapabilities.join(', ') || 'any'})`);
  });

  syncState();
  refreshGate();
  setInterval(refreshGate, 15000);
})();
