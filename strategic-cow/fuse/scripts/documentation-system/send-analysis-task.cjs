#!/usr/bin/env node
/**
 * Send Stage 3 Analysis Task to Green Channel Agents
 *
 * Simple one-shot script to delegate concept extraction tasks
 * to the waiting Gemini agents in the Green channel.
 */

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const RELAY_URL = 'ws://localhost:3001/ws';
const ORCHESTRATOR_ID = 'claude-stage3-orchestrator';
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const CLASSIFIED_MANIFEST = path.join(PROJECT_ROOT, '.documentation-system/classified-manifest.json');

let ws = null;
let targetChannelId = null;

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  STAGE 3 ANALYSIS - Task Delegation                       ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Load workload
console.log('[1/4] Loading classified manifest...');
const manifest = JSON.parse(fs.readFileSync(CLASSIFIED_MANIFEST, 'utf-8'));
const highPriorityFiles = manifest.files.filter(f => f.priority === 'P1');
console.log(`      Found ${highPriorityFiles.length} P1 files\n`);

// Split into batches for agents
const batch1 = highPriorityFiles.slice(0, Math.ceil(highPriorityFiles.length / 2));
const batch2 = highPriorityFiles.slice(Math.ceil(highPriorityFiles.length / 2));

function sendMessage(type, payload, channel = null) {
  const msg = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    type,
    timestamp: Date.now(),
    source: ORCHESTRATOR_ID,
    channel: channel || targetChannelId,
    payload
  };
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function broadcastToChannel(content) {
  return sendMessage('MESSAGE_SEND', {
    to: 'broadcast',
    content,
    messageType: 'task_assignment',
    metadata: {
      protocol: 'DACC-v1',
      orchestrator: ORCHESTRATOR_ID,
      stage: 'stage-3-analysis'
    }
  });
}

ws = new WebSocket(RELAY_URL);

ws.on('open', () => {
  console.log('[2/4] Connected to TNF Relay\n');

  // Register
  sendMessage('AGENT_REGISTER', {
    agent: {
      id: ORCHESTRATOR_ID,
      name: 'Claude Stage 3 Orchestrator',
      platform: 'claude-code-cli',
      status: 'active',
      capabilities: ['analysis-orchestration'],
      metadata: { stage: 'stage-3' }
    }
  });

  // Discover channels
  setTimeout(() => {
    sendMessage('CHANNEL_LIST_REQUEST', {});
  }, 500);
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    const { type, payload } = msg;

    if (type === 'CHANNEL_LIST') {
      const channels = payload?.channels || [];
      const greenChannel = channels.find(ch => ch.name === 'Green');

      if (greenChannel) {
        targetChannelId = greenChannel.id;
        console.log(`[3/4] Found Green channel: ${greenChannel.id}`);
        console.log(`      Members: ${greenChannel.members.length}\n`);

        // Join channel
        setTimeout(() => {
          sendMessage('CHANNEL_JOIN', { channelId: targetChannelId });
        }, 500);

        // Send task
        setTimeout(() => {
          console.log('[4/4] Broadcasting Stage 3 analysis task...\n');

          const taskMessage = `
╔═══════════════════════════════════════════════════════════════╗
║  🧠 STAGE 3: CONCEPT EXTRACTION - TASK ASSIGNMENT            ║
╚═══════════════════════════════════════════════════════════════╝

**FROM**: Claude Code - Living Documentation System Orchestrator
**TO**: All Gemini Agents in Green Channel
**MISSION**: Extract concepts from high-priority TNF documentation

## Overview

I have completed Stage 1 (Discovery) and Stage 2 (Classification) of the
Living Documentation System. We discovered 2,192 documentation files and
classified them by category, priority, and quality.

Now I need your help with **Stage 3: Concept Extraction**.

## Task Details

**Total Files**: ${highPriorityFiles.length} high-priority (P1) documents
**Your Assignment**: Split evenly between available agents

For **EACH FILE** assigned to you, extract:

1. **Key Concepts** (5-15 per file)
   - Technical terms, patterns, protocols
   - Core ideas and principles
   - Important entities (agents, services, packages)

2. **Relationships** (between concepts)
   - "uses", "implements", "extends"
   - "depends_on", "references"
   - "coordinates_with", "orchestrates"

3. **Dependencies** (between files)
   - Which files does this document reference?
   - What other docs should be read together?

## Sample Files (First 20 of ${highPriorityFiles.length}):

${highPriorityFiles.slice(0, 20).map((f, i) =>
  `${(i+1).toString().padStart(2, ' ')}. ${f.path}\n    Category: ${f.category?.primary}/${f.category?.subcategory}\n    Tags: ${f.tags?.slice(0, 3).join(', ')}`
).join('\n\n')}

...and ${highPriorityFiles.length - 20} more files

## Output Format

Please respond with your analysis in this JSON format:

\`\`\`json
{
  "agent": "[AGENT-XX]",
  "stage": "stage-3-analysis",
  "filesAnalyzed": 100,
  "results": [
    {
      "file": "docs/PROTOCOL_ALIGNMENT_FRAMEWORK.md",
      "concepts": [
        "protocol hierarchy",
        "priority system",
        "meta-protocol",
        "user journey",
        "task-type mapping"
      ],
      "relationships": [
        {
          "from": "meta-protocol",
          "to": "protocol hierarchy",
          "type": "organizes"
        },
        {
          "from": "priority system",
          "to": "user journey",
          "type": "guides"
        }
      ],
      "dependencies": [
        "docs/INFORMATION_SEQUENCING_PROTOCOL.md",
        "docs/MASTER_ORCHESTRATOR_COORDINATION_PROTOCOLS.md"
      ]
    }
  ]
}
\`\`\`

## Instructions

[AGENT-01]: Please analyze files 1-${batch1.length}
[AGENT-03]: Please analyze files ${batch1.length + 1}-${highPriorityFiles.length}
[AGENT-04]: Please analyze files ${batch1.length + 1}-${highPriorityFiles.length}

(Split work between AGENT-03 and AGENT-04)

## Timeline

Please begin immediately and report progress every 100 files.
Full results expected within 30-60 minutes.

## Questions?

Reply with [AGENT-XX] and your question.

**Ready? BEGIN ANALYSIS!**

═══════════════════════════════════════════════════════════════
Claude Code - Living Documentation System
Stage 3: Concept Extraction
═══════════════════════════════════════════════════════════════
`;

          broadcastToChannel(taskMessage);

          console.log('✅ Task broadcast complete!\n');
          console.log('📊 Expected Results:');
          console.log(`   - AGENT-01: ~${batch1.length} files`);
          console.log(`   - AGENT-03/04: ~${batch2.length} files (split)\n`);
          console.log('⏳ Waiting for agent responses...\n');
          console.log('   Monitor the Green channel for results.');
          console.log('   Agents will reply with JSON formatted analysis.\n');

          // Keep connection open for responses
          setTimeout(() => {
            console.log('✓ Task delegation complete. Closing connection.\n');
            ws.close();
          }, 5000);
        }, 2000);
      }
    }
  } catch (e) {
    // ignore
  }
});

ws.on('error', (err) => {
  console.error('Error:', err.message);
});

ws.on('close', () => {
  console.log('Connection closed.\n');
  process.exit(0);
});
