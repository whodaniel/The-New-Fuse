#!/usr/bin/env node

/**
 * Complete MCP Server Implementation for The New Fuse
 * This file integrates all platform capabilities into a single MCP server
 */

import { TheNewFuseMCPServer } from './TheNewFuseMCPServer.js';

async function main() {
  const isRemote = process.argv.includes('--remote');
  const port = parseInt(process.argv.find(arg => arg.startsWith('--port='))?.split('=')[1] || '3001');
  
  console.log(`Starting The New Fuse MCP Server...`);
  console.log(`Mode: ${isRemote ? 'Remote (HTTP/SSE)' : 'Local (stdio)'}`);
  
  if (isRemote) {
    console.log(`Port: ${port}`);
  }

  try {
    const server = new TheNewFuseMCPServer(isRemote);
    
    if (isRemote) {
      await server.start('http', port);
    } else {
      await server.start('stdio');
    }
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
