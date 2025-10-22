const express = require('express');
const path = require('path');
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
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  // Server startup logging - these are intentional for deployment monitoring
  // eslint-disable-next-line no-console
  console.log(`🚀 The New Fuse server is running on port ${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`📁 Serving frontend from: ${frontendBuildPath}`);
  // eslint-disable-next-line no-console
  console.log(`🌐 Access at: http://localhost:${PORT}`);
});// Force deployment Wed Oct 22 04:01:18 EDT 2025
