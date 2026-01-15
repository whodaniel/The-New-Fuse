#!/usr/bin/env node
/**
 * Orchestrator Client - Red Channel Federation Improvement Task
 *
 * Connects to Red channel and delegates system improvement task to Gemini agents
 */

const WebSocket = require('ws');
const fs = require('fs');

const RED_CHANNEL_ID = 'channel-1768449642903';

class OrchestratorRedChannel {
  constructor() {
    this.ws = null;
    this.agentId = `orchestrator-claude-${Date.now()}`;
    this.responses = [];
    this.taskId = null;
    this.startTime = null;
  }

  connect(url = 'ws://localhost:3001/ws') {
    return new Promise((resolve, reject) => {
      console.log('[Orchestrator] 🎯 Connecting to relay...');

      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        console.log('[Orchestrator] ✅ Connected to relay');

        // Register as orchestrator (FIXED: use AGENT_REGISTER)
        this.send({
          type: 'AGENT_REGISTER',
          id: this.agentId,
          name: 'Claude Code Orchestrator',
          platform: 'claude-code',
          capabilities: [
            'orchestration',
            'task-delegation',
            'code-modification',
            'system-analysis',
            'file-system-access',
            'federated-intelligence',
          ],
          metadata: {
            role: 'master-orchestrator',
            version: '2.0.0',
            location: 'VSCode/Terminal',
          },
        });

        resolve();
      });

      this.ws.on('message', (data) => {
        this.handleMessage(JSON.parse(data.toString()));
      });

      this.ws.on('error', (error) => {
        console.error('[Orchestrator] ❌ WebSocket error:', error.message);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log('[Orchestrator] 🔌 Connection closed');
      });
    });
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  handleMessage(message) {
    switch (message.type) {
      case 'WELCOME':
        console.log('[Orchestrator] 👋 Welcome message received');
        break;

      case 'REGISTER_ACK':
        console.log(`[Orchestrator] ✅ Registered as: ${this.agentId}`);
        break;

      case 'CHANNEL_JOINED':
        console.log(`[Orchestrator] 📢 Joined channel: ${message.channelId}`);
        console.log(`[Orchestrator] 👥 Channel members: ${message.members?.length || 0}`);
        break;

      case 'AGENTS_UPDATE':
        const geminiAgents = message.agents.filter(
          (a) => a.platform === 'chrome-extension' && a.name.includes('Agent')
        );
        console.log(`[Orchestrator] 📊 Total agents: ${message.agents.length}`);
        console.log(`[Orchestrator] 🤖 Gemini agents: ${geminiAgents.length}`);
        break;

      case 'NEW_MESSAGE':
        if (message.message?.metadata?.taskId === this.taskId) {
          const msg = message.message;
          const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);

          console.log(`\n[Orchestrator] 📥 Response #${this.responses.length + 1} (${elapsed}s)`);
          console.log(`[Orchestrator]    From: ${msg.from}`);
          console.log(`[Orchestrator]    Preview: ${msg.content.substring(0, 80)}...`);

          this.responses.push({
            agentId: msg.from,
            content: msg.content,
            timestamp: Date.now(),
            elapsed: parseFloat(elapsed),
          });
        }
        break;

      case 'BROADCAST_ACK':
        console.log('[Orchestrator] ✅ Task broadcast acknowledged');
        break;

      default:
        // Silently ignore other message types
        break;
    }
  }

  joinRedChannel() {
    console.log('[Orchestrator] 🔴 Joining Red channel...');
    this.send({
      type: 'CHANNEL_JOIN',
      channelId: RED_CHANNEL_ID,
    });
  }

  async delegateFederationImprovementTask() {
    this.taskId = `federation-improvement-${Date.now()}`;
    this.startTime = Date.now();

    const task = `
🎯 ORCHESTRATOR DIRECTIVE: Federation System Self-Improvement

You are a federated AI agent in The New Fuse multi-agent system. Your task is to analyze the federation architecture and provide SPECIFIC, ACTIONABLE improvements.

**Context:**
- WebSocket-based relay server connects agents across platforms
- Chrome extension agents inject messages into Gemini/ChatGPT/Claude
- SimpleChatBridge handles element detection and message injection
- OrchestratorIntegrationService monitors agent health

**Your Mission:**
Analyze the following aspects and provide concrete improvements:

1. **Architecture** - Suggest ONE improvement to the relay/agent communication protocol
2. **Performance** - Identify ONE optimization for message routing or element detection
3. **Security** - Propose ONE enhancement for agent authentication or message validation
4. **Developer Experience** - Suggest ONE tool/feature to make agent development easier

**Output Format:**
For each improvement, provide:
- Category (Architecture/Performance/Security/DX)
- Specific Issue/Gap
- Proposed Solution (2-3 sentences)
- Priority (Critical/High/Medium/Low)
- Estimated Implementation Effort (hours)

**Critical Requirements:**
✅ Be SPECIFIC - reference actual file paths or function names if possible
✅ Be ACTIONABLE - provide implementable solutions, not vague suggestions
✅ Be CONCISE - keep each suggestion to 100 words max
✅ Tag your response with: TASK_ID: ${this.taskId}

⚡ The system will auto-apply Critical priority improvements!
    `.trim();

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║  🎯 DELEGATING FEDERATION IMPROVEMENT TASK                ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    console.log(`Task ID: ${this.taskId}`);
    console.log(`Channel: Red (${RED_CHANNEL_ID})`);
    console.log(`Waiting: 45 seconds for responses`);
    console.log('\n' + '─'.repeat(60) + '\n');

    // FIXED: Use MESSAGE_SEND with proper payload structure
    this.send({
      type: 'MESSAGE_SEND',
      channel: RED_CHANNEL_ID,
      payload: {
        to: 'broadcast',
        content: task,
        messageType: 'orchestrator-task',
        metadata: {
          taskId: this.taskId,
          source: 'orchestrator',
          requiresResponse: true,
          priority: 'critical',
          category: 'system-improvement',
          auto_apply: true,
        },
      },
    });

    // Wait for responses
    await new Promise((resolve) => setTimeout(resolve, 45000));

    return this.responses;
  }

  synthesizeResponses() {
    console.log('\n' + '═'.repeat(70));
    console.log('  📋 FEDERATED INTELLIGENCE SYNTHESIS');
    console.log('═'.repeat(70) + '\n');

    if (this.responses.length === 0) {
      console.log('⚠️  No responses received from federated agents.');
      console.log('\n💡 Troubleshooting:');
      console.log('   • Verify Gemini tabs have Fuse Connect panel open');
      console.log('   • Check that agents joined Red channel');
      console.log('   • Enable debug: window.__FUSE_DEBUG_SELECTORS = true in Gemini console');
      console.log('   • Check relay logs for message delivery');
      return null;
    }

    console.log(`✅ Collected ${this.responses.length} response(s)\n`);

    // Group by category
    const categorized = {
      architecture: [],
      performance: [],
      security: [],
      dx: [],
    };

    this.responses.forEach((response, index) => {
      console.log(`\n${'─'.repeat(70)}`);
      console.log(`📨 Response #${index + 1} from ${response.agentId}`);
      console.log(`   Received: ${response.elapsed}s after task delegation`);
      console.log(`${'─'.repeat(70)}`);
      console.log(response.content);

      // Categorize (simple keyword matching)
      const content = response.content.toLowerCase();
      if (content.includes('architecture')) categorized.architecture.push(response);
      if (content.includes('performance') || content.includes('optimization'))
        categorized.performance.push(response);
      if (content.includes('security') || content.includes('authentication'))
        categorized.security.push(response);
      if (content.includes('developer') || content.includes('dx')) categorized.dx.push(response);
    });

    // Save to file
    const output = {
      taskId: this.taskId,
      timestamp: new Date().toISOString(),
      responseCount: this.responses.length,
      responses: this.responses,
      categorized,
    };

    const outputPath = '/tmp/federation-improvement-responses.json';
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log(`\n${'═'.repeat(70)}`);
    console.log(`💾 Responses saved to: ${outputPath}`);
    console.log(`📊 Summary:`);
    console.log(`   • Architecture suggestions: ${categorized.architecture.length}`);
    console.log(`   • Performance optimizations: ${categorized.performance.length}`);
    console.log(`   • Security enhancements: ${categorized.security.length}`);
    console.log(`   • Developer Experience: ${categorized.dx.length}`);
    console.log(`${'═'.repeat(70)}\n`);

    return output;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Main execution
async function main() {
  const orchestrator = new OrchestratorRedChannel();

  try {
    // Connect to relay
    await orchestrator.connect();
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Join Red channel
    orchestrator.joinRedChannel();
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Delegate improvement task
    await orchestrator.delegateFederationImprovementTask();

    // Synthesize and display results
    const synthesis = orchestrator.synthesizeResponses();

    if (synthesis && synthesis.responses.length > 0) {
      console.log('\n✨ Federation self-improvement task completed successfully!');
      console.log('🔄 Orchestrator will now analyze and apply critical improvements...\n');
    }

    orchestrator.disconnect();
  } catch (error) {
    console.error('\n❌ Orchestrator error:', error.message);
    orchestrator.disconnect();
    process.exit(1);
  }
}

// Run
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { OrchestratorRedChannel };
