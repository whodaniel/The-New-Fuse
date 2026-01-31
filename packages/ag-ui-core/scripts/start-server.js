const { AGUIOrchestrator } = require('../dist/index');
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const PORT = 8765;
const HTTP_PORT = 8766;
const orchestrator = new AGUIOrchestrator(PORT);

// Set up Express for Visualization Hub
const app = express();
app.use(cors());
app.use(express.json());

// Serve generated HTML files from /tmp
app.use('/artifacts', express.static('/tmp'));

// API to list generated visualizations
app.get('/api/visualizations', (req, res) => {
  fs.readdir('/tmp', (err, files) => {
    if (err) return res.status(500).json({ error: err.message });

    const visualizations = files
      .filter(
        (f) =>
          f.endsWith('.html') &&
          (f.includes('agent-flow') || f.includes('service-map') || f.includes('workflow-deps'))
      )
      .map((f) => {
        const stats = fs.statSync(path.join('/tmp', f));
        return {
          id: f,
          name: f.split('-').slice(0, 2).join(' '),
          type: f.split('-')[0],
          timestamp: stats.mtime,
          url: `http://localhost:${HTTP_PORT}/artifacts/${f}`,
        };
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    res.json(visualizations);
  });
});

app.listen(HTTP_PORT, () => {
  console.log(`🚀 AG-UI HTTP Server running on http://localhost:${HTTP_PORT}`);
});

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
