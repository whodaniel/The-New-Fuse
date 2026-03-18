#!/usr/bin/env node

/**
 * Compatibility launcher for the ESM MCP server module.
 * Keeps existing `node src/mcp-server.js` entrypoints working.
 */
(async () => {
  try {
    const mod = await import('./mcp-server.mjs');
    if (typeof mod.startMcpServer === 'function') {
      await mod.startMcpServer();
      return;
    }
    throw new Error('startMcpServer export not found in mcp-server.mjs');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
