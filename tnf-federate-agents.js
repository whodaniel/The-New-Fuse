const WebSocket = require('ws');
const fs = require('fs');
const RELAY_URL = 'ws://localhost:3000/ws';
const HEARTBEAT_MS = 15000;
const TIMEOUT_MS = 15000;

const agents = [
  {
    id: 'kilo-code-s007',
    name: 'Kilo Code Agent',
    platform: 'kilo',
    tty: 's007',
    role: 'orchestrator',
    capabilities: [
      'code-editing',
      'bash-execution',
      'mcp-bridge',
      'task-management',
      'file-ops',
      'web-fetch',
    ],
    channels: ['General', 'Green', 'Blue', 'fuse-activity-log'],
  },
  {
    id: 'opencode-sudo-s087',
    name: 'OpenCode Sudo Agent',
    platform: 'opencode',
    tty: 's087',
    role: 'orchestrator',
    capabilities: ['sudo', 'orchestration', 'planning', 'analysis', 'mcp-bridge', 'bash-execution'],
    channels: ['General', 'Red', 'Yellow', 'fuse-activity-log'],
  },
  {
    id: 'opencode-twin-s140',
    name: 'OpenCode Twin Agent',
    platform: 'opencode',
    tty: 's140',
    role: 'participant',
    capabilities: ['code-review', 'testing', 'parallel-execution', 'bash-execution'],
    channels: ['General', 'Green', 'fuse-activity-log'],
  },
  {
    id: 'gemini-cli-t1-s003',
    name: 'Gemini CLI Agent (T1)',
    platform: 'gemini',
    tty: 's003',
    role: 'worker',
    capabilities: ['analysis', 'code-generation', 'multi-modal', 'web-search', 'mcp-bridge'],
    channels: ['General', 'Blue', 'fuse-activity-log'],
  },
  {
    id: 'gemini-cli-t2-s000',
    name: 'Gemini CLI Agent (T2)',
    platform: 'gemini',
    tty: 's000',
    role: 'worker',
    capabilities: ['analysis', 'code-generation', 'multi-modal', 'web-search', 'tnf-relay-mcp'],
    channels: ['General', 'Purple', 'fuse-activity-log'],
  },
  {
    id: 'hermes-agent-s001',
    name: 'Hermes Agent',
    platform: 'hermes',
    tty: 's001',
    role: 'broker',
    capabilities: ['gateway-routing', 'model-bridging', 'hermes-cli', 'task-coordination'],
    channels: ['General', 'Red', 'Yellow', 'fuse-activity-log'],
  },
  {
    id: 'openclaw-tui-s153',
    name: 'OpenClaw TUI Agent',
    platform: 'openclaw',
    tty: 's153',
    role: 'participant',
    capabilities: ['openclaw-orchestration', 'agent-dispatch', 'watchdog', 'bash-execution'],
    channels: ['General', 'Green', 'Red', 'fuse-activity-log'],
  },
];

const connections = [];

function connectAgent(agentDef) {
  return new Promise((resolve, reject) => {
    console.log(
      '\nConnecting ' + agentDef.name + ' (' + agentDef.platform + ') tty=' + agentDef.tty + '...'
    );

    const ws = new WebSocket(RELAY_URL);
    let registered = false;
    let sentRegister = false;

    const timer = setTimeout(() => {
      if (!registered) {
        console.log('  TIMEOUT waiting for registration of ' + agentDef.name);
        ws.close();
        reject(new Error('timeout'));
      }
    }, TIMEOUT_MS);

    ws.on('open', () => {
      console.log('  WS opened for ' + agentDef.name + ', waiting for WELCOME...');
    });

    ws.on('message', (data) => {
      try {
        var msg = JSON.parse(data.toString());

        if (msg.type === 'WELCOME') {
          console.log('  ' + agentDef.name + ' got WELCOME, sending AGENT_REGISTER...');
          if (!sentRegister) {
            sentRegister = true;
            ws.send(
              JSON.stringify({
                id: 'reg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                type: 'AGENT_REGISTER',
                timestamp: Date.now(),
                source: agentDef.id,
                payload: {
                  agent: {
                    id: agentDef.id,
                    canonicalEntityId:
                      'TNF:AGENT:' + agentDef.platform.toUpperCase() + ':' + agentDef.tty,
                    operationalHandle: agentDef.platform.toUpperCase() + '-' + agentDef.tty,
                    runtimeSessionId: agentDef.id,
                    aliases: [
                      agentDef.id,
                      agentDef.platform + '-' + agentDef.tty,
                      agentDef.name.toLowerCase().replace(/\s+/g, '-'),
                    ],
                    name: agentDef.name,
                    platform: agentDef.platform,
                    status: 'active',
                    capabilities: agentDef.capabilities,
                    channels: agentDef.channels,
                    metadata: {
                      tty: agentDef.tty,
                      role: agentDef.role,
                      federated: true,
                      joinedAt: new Date().toISOString(),
                    },
                  },
                },
              })
            );
          }
        } else if (msg.type === 'REGISTRATION_CONFIRMED') {
          console.log('  ' + agentDef.name + ' REGISTRATION_CONFIRMED');
          registered = true;
          clearTimeout(timer);
          connections.push({ agent: agentDef, ws: ws });
          resolve(agentDef);
        } else if (msg.type === 'BRIDGE_PENDING') {
          console.log(
            '  ' + agentDef.name + ' BRIDGE_PENDING (gate is on, agent waiting for approval)'
          );
        } else if (msg.type === 'BRIDGE_CONNECTED') {
          console.log('  ' + agentDef.name + ' BRIDGE_CONNECTED');
          if (!registered) {
            registered = true;
            clearTimeout(timer);
            connections.push({ agent: agentDef, ws: ws });
            resolve(agentDef);
          }
        } else if (msg.type === 'AGENT_LIST') {
          var count = msg.payload && msg.payload.agents ? msg.payload.agents.length : 0;
          console.log('  ' + agentDef.name + ' got AGENT_LIST (' + count + ' agents)');
        } else if (msg.type === 'CHANNEL_LIST') {
          var count = msg.payload && msg.payload.channels ? msg.payload.channels.length : 0;
          console.log('  ' + agentDef.name + ' got CHANNEL_LIST (' + count + ' channels)');
        } else if (msg.type === 'ERROR') {
          console.log('  ' + agentDef.name + ' got ERROR: ' + JSON.stringify(msg.payload));
        } else {
          console.log(
            '  ' +
              agentDef.name +
              ' got ' +
              msg.type +
              ': ' +
              JSON.stringify(msg.payload).substring(0, 200)
          );
        }
      } catch (e) {
        console.log('  ' + agentDef.name + ' parse error: ' + e.message);
      }
    });

    ws.on('error', (err) => {
      console.log('  ' + agentDef.name + ' WS error: ' + err.message);
      clearTimeout(timer);
      reject(err);
    });

    ws.on('close', () => {
      console.log('  ' + agentDef.name + ' WS closed');
      clearTimeout(timer);
      if (!registered) reject(new Error('closed before registration'));
    });
  });
}

async function main() {
  console.log('============================================================');
  console.log('TNF FEDERATED AGENT REGISTRATION');
  console.log('Relay: ' + RELAY_URL);
  console.log('Agents to register: ' + agents.length);
  console.log('============================================================');

  var results = await Promise.allSettled(
    agents.map(function (a) {
      return connectAgent(a);
    })
  );

  var succeeded = results.filter(function (r) {
    return r.status === 'fulfilled';
  }).length;
  var failed = results.filter(function (r) {
    return r.status === 'rejected';
  }).length;

  console.log('\n============================================================');
  console.log('REGISTRATION RESULTS: ' + succeeded + ' succeeded, ' + failed + ' failed');
  console.log('============================================================');

  results.forEach(function (r, i) {
    if (r.status === 'fulfilled') {
      console.log('  OK: ' + r.value.name + ' (' + r.value.platform + ') tty=' + r.value.tty);
    } else {
      console.log('  FAIL: ' + agents[i].name + ' - ' + r.reason.message);
    }
  });

  console.log('\nStarting heartbeat loop (every ' + HEARTBEAT_MS + 'ms)...');
  setInterval(function () {
    connections.forEach(function (c) {
      if (c.ws.readyState === WebSocket.OPEN) {
        c.ws.send(
          JSON.stringify({
            type: 'HEARTBEAT',
            timestamp: Date.now(),
            source: c.agent.id,
            payload: { status: 'active', uptime: process.uptime() },
          })
        );
      }
    });
  }, HEARTBEAT_MS);

  console.log('\nRegistering agents in TNF federation files...');
  for (var i = 0; i < connections.length; i++) {
    var c = connections[i];
    try {
      var tnfRegisterPayload = {
        name: c.agent.name,
        description: 'Federated ' + c.agent.platform + ' agent on tty ' + c.agent.tty,
        model: c.agent.platform + '/default',
        mode: 'primary',
        platform: c.agent.platform,
        role: c.agent.role,
        capabilities: c.agent.capabilities,
        tools: ['bash', 'read', 'write', 'edit', 'glob', 'grep', 'task', 'todowrite'],
        mcpServers: ['tnf-relay'],
        relayEndpoint: RELAY_URL,
        tty: c.agent.tty,
        federated: true,
      };
      var agentFile =
        process.env.HOME + '/.tnf/agents/' + c.agent.platform + '-' + c.agent.tty + '.json';
      fs.writeFileSync(agentFile, JSON.stringify(tnfRegisterPayload, null, 2));
      console.log('  Wrote TNF agent file: ' + agentFile);
    } catch (e) {
      console.log('  Failed to write TNF agent file for ' + c.agent.name + ': ' + e.message);
    }
  }

  console.log(
    '\nAll ' +
      connections.length +
      ' agents registered. Heartbeats active. Press Ctrl+C to disconnect.'
  );

  process.on('SIGINT', function () {
    console.log('\nDisconnecting all agents...');
    connections.forEach(function (c) {
      if (c.ws.readyState === WebSocket.OPEN) {
        c.ws.send(
          JSON.stringify({ type: 'AGENT_UNREGISTER', source: c.agent.id, timestamp: Date.now() })
        );
        c.ws.close();
      }
    });
    setTimeout(function () {
      process.exit(0);
    }, 2000);
  });
}

main().catch(function (e) {
  console.error('Fatal: ' + e.message);
  process.exit(1);
});
