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
  }

  function renderMessage(message) {
    const item = document.createElement('article');
    item.className = 'feed-item';
    item.innerHTML = `<strong>${message.from || 'unknown'}</strong><br/>${message.content || ''}`;
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

  client.on('connected', () => {
    log('Connected to relay');
    syncState();
  });
  client.on('registered', () => {
    log('Registration confirmed');
    syncState();
  });
  client.on('registration_error', (payload) => log(`Registration error: ${JSON.stringify(payload)}`));
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
  client.on('error', (error) => log(`Error: ${error?.message || String(error)}`));

  els.connectBtn.addEventListener('click', async () => {
    log(`Connecting ${els.relayUrl.value}`);
    await client.connect(els.relayUrl.value.trim());
    syncState();
  });

  els.refreshBtn.addEventListener('click', () => {
    client.requestChannelList();
    client.requestAgentList();
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
    if (channelId) client.pauseChannel(channelId);
  });

  els.resumeBtn.addEventListener('click', () => {
    const channelId = els.channelSelect.value;
    if (channelId) client.resumeChannel(channelId);
  });

  els.sendBtn.addEventListener('click', () => {
    const channelId = els.channelSelect.value;
    const content = els.messageInput.value.trim();
    if (!channelId || !content) return;
    client.sendChannelMessage(channelId, content);
    els.messageInput.value = '';
    log(`Sent message to ${channelId}`);
  });

  syncState();
})();
