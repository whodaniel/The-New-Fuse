const { RedisAgentClient } = require('../../packages/tnf-cli/dist/index');
const crypto = require('crypto');

/**
 * TNF Swarm Roll-Call & Auction Simulation
 * 
 * Demonstrates the Dynamic Roll-Call (Bidding) protocol.
 */

async function runRollCall() {
  console.log('🚀 Initiating Swarm Roll-Call (Task Auction Mode)...');

  const broker = new RedisAgentClient();
  await broker.initialize();
  await broker.register('Master-Orchestrator', 'orchestrator', 'antigravity', ['roll-call']);

  const taskId = `task_${Date.now()}`;
  const auctionDuration = 5000; // 5 seconds for bidding

  const auctionEnvelope = {
    id: crypto.randomUUID(),
    type: 'auction',
    from: { agentId: 'Master-Orchestrator', role: 'orchestrator' },
    to: { broadcast: true },
    payload: {
      taskId,
      taskType: 'market-analysis',
      requirements: ['web-search', 'research'],
      priority: 'high',
      expiresAt: Date.now() + auctionDuration,
      description: 'Analyze competitive landscape for WarpOS native sandboxing.'
    },
    timestamp: new Date().toISOString()
  };

  const bids = [];

  // Listen for bids
  broker.onMessage('bid', (message) => {
    if (message.payload.taskId === taskId) {
      console.log(`📥 Received BID from ${message.from.agentName} (ID: ${message.from.agentId})`);
      console.log(`   Suitability: ${message.payload.suitability * 100}% | Capabilities: ${message.payload.capabilities.join(', ')}`);
      bids.push(message);
    }
  });

  console.log(`\n📢 Broadcasting Auction for Task: ${taskId}`);
  console.log(`   Type: ${auctionEnvelope.payload.taskType}`);
  console.log(`   Requirements: ${auctionEnvelope.payload.requirements.join(', ')}`);
  console.log(`   Window: ${auctionDuration / 1000}s\n`);

  // Use raw publish to ingress since client.broadcast wraps it differently
  await broker.publisher.publish('tnf:bus:ingress', JSON.stringify(auctionEnvelope));

  // Wait for window to close
  await new Promise(resolve => setTimeout(resolve, auctionDuration));

  console.log('\n🛑 Auction Window Closed.');
  console.log(`📊 Total Bids Received: ${bids.length}`);

  if (bids.length > 0) {
    // Selection logic (Best suitability)
    const winner = bids.sort((a, b) => b.payload.suitability - a.payload.suitability)[0];
    
    console.log(`\n🏆 AWARDED TO: ${winner.from.agentName}`);
    console.log(`   Winning Score: ${winner.payload.suitability * 100}%`);

    const awardEnvelope = {
      id: crypto.randomUUID(),
      type: 'award',
      from: { agentId: 'Master-Orchestrator', role: 'orchestrator' },
      to: { agentId: winner.from.agentId },
      payload: {
        taskId,
        contractId: `contract_${crypto.randomBytes(4).toString('hex')}`,
        parameters: { target: 'WarpOS' }
      },
      timestamp: new Date().toISOString()
    };

    await broker.publisher.publish(`tnf:bus:egress:${winner.from.agentId}`, JSON.stringify(awardEnvelope));
    console.log(`✅ Award notification sent to agent egress channel.`);
  } else {
    console.log('\n⚠️ No agents capable of performing this task were found.');
  }

  await broker.cleanup();
  process.exit(0);
}

runRollCall().catch(err => {
  console.error('❌ Roll-Call failed:', err);
  process.exit(1);
});
