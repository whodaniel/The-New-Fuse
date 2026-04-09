#!/usr/bin/env node
/**
 * Orchestrator Client - Claude Code acting as the master coordinator
 *
 * This client connects to the relay and delegates tasks to federated Gemini agents.
 */

const WebSocket = require('ws');

class OrchestratorClient {
  constructor() {
    this.ws = null;
    this.agentId = `orchestrator-${Date.now()}`;
    this.responses = [];
    this.taskId = null;
  }

  connect(url = 'ws://localhost:3001/ws') {
    return new Promise((resolve, reject) => {
      console.log(`[Orchestrator] Connecting to relay at ${url}...`);

      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        console.log('[Orchestrator] Connected to relay');

        // Register as orchestrator agent
        this.send({
          type: 'REGISTER',
          agent: {
            id: this.agentId,
            name: 'Claude Code Orchestrator',
            platform: 'claude-code',
            capabilities: [
              'task-delegation',
              'code-modification',
              'system-analysis',
              'orchestration',
              'file-system-access',
            ],
            metadata: {
              role: 'orchestrator',
              version: '1.0.0',
            },
          },
        });

        resolve();
      });

      this.ws.on('message', (data) => {
        this.handleMessage(JSON.parse(data.toString()));
      });

      this.ws.on('error', (error) => {
        console.error('[Orchestrator] WebSocket error:', error);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log('[Orchestrator] Connection closed');
      });
    });
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  handleMessage(message) {
    console.log('[Orchestrator] Received:', message.type);

    switch (message.type) {
      case 'REGISTER_ACK':
        console.log('[Orchestrator] ✅ Registered with relay');
        console.log('[Orchestrator] Agent ID:', message.agentId);
        break;

      case 'CHANNEL_JOINED':
        console.log(`[Orchestrator] ✅ Joined channel: ${message.channelId}`);
        break;

      case 'AGENTS_UPDATE':
        console.log(`[Orchestrator] 📊 Agents online: ${message.agents.length}`);
        message.agents.forEach((agent) => {
          console.log(`  - ${agent.name} (${agent.platform})`);
        });
        break;

      case 'NEW_MESSAGE':
        if (message.message && message.message.metadata?.taskId === this.taskId) {
          console.log(`[Orchestrator] 📥 Response from ${message.message.from}:`);
          console.log(`  ${message.message.content.substring(0, 200)}...`);

          this.responses.push({
            agentId: message.message.from,
            content: message.message.content,
            timestamp: Date.now(),
          });
        }
        break;

      case 'BROADCAST_ACK':
        console.log('[Orchestrator] ✅ Task broadcast complete');
        break;

      default:
        // Ignore other message types
        break;
    }
  }

  joinChannel(channelId) {
    console.log(`[Orchestrator] Joining channel: ${channelId}`);
    this.send({
      type: 'CHANNEL_JOIN',
      channelId,
    });
  }

  async delegateTask(channelId, task) {
    this.taskId = `task-${Date.now()}`;

    console.log('[Orchestrator] 🎯 Delegating task to federated agents...');
    console.log(`[Orchestrator] Task ID: ${this.taskId}`);
    console.log(`[Orchestrator] Channel: ${channelId}`);
    console.log(`[Orchestrator] Task: ${task.substring(0, 100)}...`);

    this.send({
      type: 'BROADCAST_MESSAGE',
      content: task,
      channel: channelId,
      metadata: {
        taskId: this.taskId,
        from: 'orchestrator',
        priority: 'high',
        requiresResponse: true,
      },
    });

    // Wait for responses
    console.log('[Orchestrator] ⏳ Waiting 30 seconds for responses...');
    await new Promise((resolve) => setTimeout(resolve, 30000));

    console.log(`[Orchestrator] 📊 Collected ${this.responses.length} responses`);
    return this.responses;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Main orchestration flow
async function main() {
  const orchestrator = new OrchestratorClient();

  try {
    // Connect to relay
    await orchestrator.connect();

    // Join the "Blue" channel where Gemini agents are
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for registration
    orchestrator.joinChannel('channel-1768429731585');

    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for join

    // Define the improvement task
    const task = `
🎯 ORCHESTRATOR TASK: System Analysis & Improvement Suggestions

As a federated AI agent in The New Fuse system, please analyze the following and provide specific, actionable improvement suggestions:

**Context:**
- You are part of a multi-agent AI system built on NestJS, React, and WebSocket federation
- The system enables AI agents across different platforms (Chrome extensions, VS Code, Electron, etc.) to collaborate
- We just fixed SimpleChatBridge element detection for Gemini chat interfaces

**Your Task:**
1. **Architecture Review**: Suggest 2-3 improvements to the agent federation architecture
2. **Performance**: Identify potential bottlenecks in the WebSocket relay system
3. **Security**: Point out any security concerns in the Chrome extension ↔ Relay communication
4. **Developer Experience**: Suggest improvements to make agent development easier

**Output Format:**
Provide a structured response with:
- Category (Architecture/Performance/Security/DX)
- Specific Issue/Opportunity
- Suggested Solution
- Priority (High/Medium/Low)

Keep each suggestion concise (1-2 sentences).

🔹 Your unique perspective as an AI agent in this system is valuable!
    `.trim();

    // Delegate task to federated Gemini agents
    const responses = await orchestrator.delegateTask('channel-1768429731585', task);

    // Display synthesis
    console.log('\n' + '='.repeat(80));
    console.log('📋 FEDERATED INTELLIGENCE SYNTHESIS');
    console.log('='.repeat(80) + '\n');

    if (responses.length === 0) {
      console.log('⚠️  No responses received from agents.');
      console.log('💡 Possible reasons:');
      console.log('   - Gemini tabs may not have the floating panel open');
      console.log('   - Agents may not be monitoring the channel');
      console.log('   - Message injection may have failed');
    } else {
      responses.forEach((response, index) => {
        console.log(`\n📨 Response ${index + 1} from ${response.agentId}:`);
        console.log('-'.repeat(80));
        console.log(response.content);
        console.log('-'.repeat(80));
      });

      // Save responses to file
      const fs = require('fs');
      const outputPath = '/tmp/orchestrator-responses.json';
      fs.writeFileSync(outputPath, JSON.stringify(responses, null, 2));
      console.log(`\n💾 Responses saved to: ${outputPath}`);
    }

    orchestrator.disconnect();
  } catch (error) {
    console.error('[Orchestrator] Error:', error);
    orchestrator.disconnect();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { OrchestratorClient };
