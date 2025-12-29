#!/usr/bin/env node
/**
 * Skills MCP Server Entry Point
 * Exposes The New Fuse skills library via Model Context Protocol
 */

export { SkillsMCPServer } from './SkillsMCPServer.js';

// CLI execution
import { SkillsMCPServer } from './SkillsMCPServer.js';

async function main() {
  const server = new SkillsMCPServer();
  await server.start();
}

if (require.main === module) {
  main().catch((error) => {
    console.error('[Skills MCP] Fatal error:', error);
    process.exit(1);
  });
}
