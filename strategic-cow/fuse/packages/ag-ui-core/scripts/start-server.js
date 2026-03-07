const { AGUIOrchestrator } = require('../dist/index');

const PORT = 8765;
const orchestrator = new AGUIOrchestrator(PORT);

orchestrator.on('started', ({ port }) => {
  console.log(`✅ AG-UI Orchestrator running on port ${port}`);
});

orchestrator.on('agent:connected', (session) => {
  console.log(`🔌 Agent connected: ${session.agentId} (${session.id})`);
});

orchestrator.on('agent:disconnected', (session) => {
  console.log(`❌ Agent disconnected: ${session.agentId}`);
});

orchestrator.on('visualization:start', ({ session, params }) => {
  console.log(`🎨 Generating visualization request from ${session.agentId}: ${params.title}`);
});

orchestrator.on('visualization:generated', ({ session, filePath }) => {
  console.log(`✨ Visualization generated for ${session.agentId}:`);
  console.log(`   📂 ${filePath}`);
});

orchestrator.on('error', ({ session, error }) => {
  console.error(`⚠️ Error for ${session ? session.agentId : 'unknown'}:`, error);
});

console.log('Starting AG-UI Orchestrator...');
orchestrator.start();
