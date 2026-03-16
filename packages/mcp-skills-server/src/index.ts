#!/usr/bin/env node
/**
 * Skills MCP Server Entry Point
 * Exposes The New Fuse skills library via Model Context Protocol
 */

export { SkillsMCPServer } from './SkillsMCPServer.js';

// CLI execution
import { fileURLToPath } from 'url';
import { SkillsMCPServer } from './SkillsMCPServer.js';

async function main() {
  const server = new SkillsMCPServer(process.env.SKILLS_BASE_PATH);
  await server.start();
}

// ES module equivalent of require.main === module
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  main().catch((error) => {
    console.error('[Skills MCP] Fatal error:', error);
    process.exit(1);
  });
}
