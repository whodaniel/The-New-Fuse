const { RedisAgentClient } = require('../../packages/tnf-cli/dist/index');

/**
 * Simulated News Scout Agent (Bidder)
 * 
 * Demonstrates an agent autonomously bidding on auctions.
 */

async function startBidder() {
  const agent = new RedisAgentClient();
  await agent.initialize();
  await agent.register('News-Scout-Sim', 'worker', 'gemini', ['web-search', 'research', 'reporting']);

  console.log('🕵️ News Scout (Simulated) listening for task auctions...');

  agent.onAuction(async (auction) => {
    console.log(`
🔔 Auction Received: ${auction.taskId} (${auction.taskType})`);
    
    // Check requirements vs capabilities
    const myCaps = ['web-search', 'research', 'reporting'];
    const matching = auction.requirements.filter(r => myCaps.includes(r));
    
    if (matching.length > 0) {
      const suitability = matching.length / auction.requirements.length;
      console.log(`🤔 Evaluating... Suitability: ${suitability * 100}%`);
      
      // Simulate thinking time
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      
      await agent.submitBid(auction.taskId, suitability, {
        note: "I have direct access to market search tools."
      });
    } else {
      console.log('⏭️ Requirements not met, skipping auction.');
    }
  });

  agent.onMessage('award', (envelope) => {
    console.log(`
🎉 WE WON THE CONTRACT! Task: ${envelope.payload.taskId}`);
    console.log(`📋 Contract ID: ${envelope.payload.contractId}`);
    console.log(`🚀 Starting execution...`);
  });
}

startBidder().catch(err => {
  console.error('❌ Bidder failed:', err);
});
