const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Get port from environment or default to 3000
const PORT = process.env.PORT || 3000;

// Serve static files from the frontend build directory
const frontendBuildPath = path.join(__dirname, 'apps/frontend/dist');
app.use(express.static(frontendBuildPath));

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes (if any backend services are needed)
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// Catch all handler: send back React's index.html file for client-side routing
const indexFilePath = path.join(frontendBuildPath, 'index.html');
app.get('*', (req, res) => {
  if (fs.existsSync(indexFilePath)) {
    res.sendFile(indexFilePath);
  } else {
    res.status(200).send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>The New Fuse</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 2rem; background: #0f172a; color: #e2e8f0; }
    .wrap { max-width: 720px; margin: 0 auto; }
    .card { background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 1.5rem; }
    h1 { font-size: 1.5rem; margin: 0 0 0.5rem; }
    p { margin: 0.5rem 0; color: #94a3b8; }
    a { color: #60a5fa; }
    code { background: #0b1220; padding: 2px 6px; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>Prompt Templating Service</h1>
      <p>No frontend build detected. Serving API and health only.</p>
      <p>Health: <a href="/health">/health</a></p>
      <p>API Status: <a href="/api/status">/api/status</a></p>
      <p>To enable UI, reintroduce frontend build and copy <code>apps/frontend/dist</code> in Dockerfile.</p>
    </div>
  </div>
</body>
</html>`);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 The New Fuse server is running on port ${PORT}`);
  console.log(`📁 Serving frontend from: ${frontendBuildPath}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
  // Proactive health check log to verify deployment
  setTimeout(async () => {
    try {
      const res = await fetch(`http://localhost:${PORT}/health`);
      const ok = res.ok ? 'OK' : `Status ${res.status}`;
      console.log(`✅ Health probe result: ${ok}`);
    } catch (err) {
      console.error('❌ Health probe failed:', err?.message || err);
    }
  }, 500);
});
