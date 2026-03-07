#!/usr/bin/env node
/**
 * JWT Token Generator for Agent Federation
 *
 * ORCHESTRATOR IMPROVEMENT: Developer experience tool
 * - Generates signed JWT tokens for agents
 * - Supports capability-based access control
 * - Provides audit trail
 *
 * Usage:
 *   node generate-agent-token.js <agentId> <platform> <capability1> <capability2> ...
 *
 * Examples:
 *   node generate-agent-token.js orchestrator-claude claude-code orchestration task-delegation
 *   node generate-agent-token.js gemini-agent-1 chrome-extension chat-injection response-monitoring
 */

const jwt = require('jsonwebtoken');

function main() {
  const [, , agentId, platform, ...capabilities] = process.argv;

  if (!agentId || !platform) {
    console.error(`
❌ Usage Error

Usage:
  node generate-agent-token.js <agentId> <platform> <capability1> <capability2> ...

Arguments:
  agentId      Unique identifier for the agent (e.g., "orchestrator-claude")
  platform     Platform the agent runs on (e.g., "claude-code", "chrome-extension")
  capabilities Space-separated list of capabilities (e.g., "orchestration task-delegation")

Examples:
  # Generate token for orchestrator
  node generate-agent-token.js orchestrator-claude claude-code orchestration task-delegation

  # Generate token for Gemini agent
  node generate-agent-token.js gemini-agent-1 chrome-extension chat-injection response-monitoring

  # Generate token for file listener
  node generate-agent-token.js file-listener nodejs file-monitoring event-publishing

Environment Variables:
  JWT_SECRET   Secret key for signing tokens (default: dev-secret-change-in-production)
    `);
    process.exit(1);
  }

  const secret = process.env.JWT_SECRET || 'dev-secret-change-in-production';

  if (secret === 'dev-secret-change-in-production') {
    console.warn(
      '⚠️  WARNING: Using default JWT secret. Set JWT_SECRET environment variable in production!\n'
    );
  }

  const agentCapabilities = capabilities.length > 0 ? capabilities : ['basic-chat']; // Default capability

  const payload = {
    agentId,
    platform,
    capabilities: agentCapabilities,
    name: `${platform} agent`,
    metadata: {
      generatedAt: new Date().toISOString(),
      generatedBy: 'generate-agent-token CLI',
    },
  };

  const token = jwt.sign(payload, secret, {
    expiresIn: '24h',
    algorithm: 'HS256',
  });

  const decoded = jwt.decode(token);

  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║           🔑 AGENT JWT TOKEN GENERATED                    ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log('📋 Token Claims:');
  console.log(JSON.stringify(decoded, null, 2));

  console.log('\n🔑 JWT Token (copy this):');
  console.log('─'.repeat(60));
  console.log(token);
  console.log('─'.repeat(60));

  console.log('\n📝 Usage in Agent Registration:');
  console.log(`
{
  type: 'AGENT_REGISTER',
  token: '${token.substring(0, 30)}...',
  id: '${agentId}',
  name: '${platform} agent',
  platform: '${platform}',
  capabilities: ${JSON.stringify(agentCapabilities)}
}
  `);

  console.log('⏰ Token Expiry: 24 hours from now');
  console.log(`   Expires at: ${new Date(decoded.exp * 1000).toISOString()}\n`);

  console.log('✅ Token ready to use!\n');
}

main();
