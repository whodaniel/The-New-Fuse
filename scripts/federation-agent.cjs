#!/usr/bin/env node
/**
 * Extension-free federation agent CLI.
 *
 * Usage:
 *   node scripts/federation-agent.cjs join Green --name cursor --platform cursor
 *   node scripts/federation-agent.cjs send Green "hello @gemini"
 *   node scripts/federation-agent.cjs listen Green
 *   node scripts/federation-agent.cjs status
 */

const path = require('path');
const readline = require('readline');
const { FederationRelayClient } = require(path.join(__dirname, 'lib', 'federation-relay-client.cjs'));
const { buildWorkerAgentIdentity, discoverRelayUrl, readSessionHandoffLineage } = require(path.join(
  __dirname,
  'lib',
  'federation-protocol.cjs'
));

function parseArgs(argv) {
  const args = [...argv];
  const command = args.shift() || 'help';
  const positional = [];
  const flags = {};

  while (args.length) {
    const token = args[0];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const value = args[1] && !args[1].startsWith('--') ? args[1] : true;
      flags[key] = value;
      if (value !== true) args.shift();
      args.shift();
      continue;
    }
    positional.push(token);
    args.shift();
  }

  return { command, positional, flags };
}

function buildClient(flags, channelId) {
  const agentId =
    flags.id ||
    process.env.TNF_FEDERATION_AGENT_ID ||
    `${flags.platform || 'cli'}-${flags.name || 'agent'}-${Date.now()}`;

  const identity = buildWorkerAgentIdentity({
    id: agentId,
    operationalHandle: flags.handle || flags.name || agentId,
    platform: flags.platform || 'tnf-cli',
    provider: flags.provider || flags.platform || 'TNF_CLI',
    channelId: channelId || null,
    daccRole: flags.role || 'participant',
    aliases: [agentId, flags.name, flags.handle].filter(Boolean),
  });

  return new FederationRelayClient({
    relayUrl: flags.relay || process.env.RELAY_URL,
    identity,
    platform: flags.platform || 'tnf-cli',
    agentName: flags.name || identity.operationalHandle,
    capabilities: ['federation-channels', 'standalone-node', 'cli-agent'],
    channels: channelId ? [channelId] : [],
    registerMetadata: {
      cliAgent: true,
      federationAgent: true,
    },
  });
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

async function cmdJoin(positional, flags) {
  const channelId = positional[0];
  if (!channelId) throw new Error('Channel name required: join <channel>');

  const client = buildClient(flags, channelId);
  client.on('registered', () => {
    client.joinChannel(channelId);
    printJson({
      status: 'joined',
      channel: channelId,
      agentId: client.identity.id,
      idNumber: client.identity.idNumber,
      canonicalEntityId: client.identity.canonicalEntityId,
      relayUrl: client.relayUrl,
    });
  });
  client.on('registration_error', (payload) => {
    printJson({ status: 'registration_error', payload });
    process.exit(1);
  });

  await client.connect(flags.relay);
  if (!client.registered) {
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }
  if (!client.connected) process.exit(1);
}

async function cmdSend(positional, flags) {
  const channelId = positional[0];
  const content = positional.slice(1).join(' ').trim();
  if (!channelId || !content) throw new Error('Usage: send <channel> <message>');

  const client = buildClient(flags, channelId);
  await client.connect(flags.relay);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  client.joinChannel(channelId);
  const sent = client.sendChannelMessage(channelId, content, {
    messageType: flags.type || 'text',
  });
  printJson({
    status: 'sent',
    channel: channelId,
    agentId: client.identity.id,
    idNumber: client.identity.idNumber,
    messageId: sent.id,
  });
  setTimeout(() => client.close(), 500);
}

async function cmdListen(positional, flags) {
  const channelId = positional[0];
  if (!channelId) throw new Error('Channel name required: listen <channel>');

  const client = buildClient(flags, channelId);
  client.on('channel_message', (message) => {
    printJson({
      event: 'channel_message',
      channel: channelId,
      from: message.from,
      content: message.content,
      metadata: message.metadata || {},
    });
  });
  client.on('registered', () => client.joinChannel(channelId));

  await client.connect(flags.relay);
  printJson({
    status: 'listening',
    channel: channelId,
    agentId: client.identity.id,
    idNumber: client.identity.idNumber,
    relayUrl: client.relayUrl,
  });

  if (flags.interactive) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.on('line', (line) => {
      const text = line.trim();
      if (!text) return;
      if (text === '/quit') {
        rl.close();
        void client.close();
        process.exit(0);
      }
      client.sendChannelMessage(channelId, text);
    });
  }
}

async function cmdStatus(flags) {
  const relayUrl = await discoverRelayUrl(flags.relay || process.env.RELAY_URL);
  printJson({
    relayUrl,
    relayHealthy: Boolean(relayUrl),
    agentId: flags.id || null,
    platform: flags.platform || 'tnf-cli',
  });
}

async function main() {
  const { command, positional, flags } = parseArgs(process.argv.slice(2));

  switch (command) {
    case 'join':
      await cmdJoin(positional, flags);
      break;
    case 'send':
      await cmdSend(positional, flags);
      break;
    case 'listen':
      await cmdListen(positional, flags);
      break;
    case 'status':
      await cmdStatus(flags);
      break;
    case 'help':
    default:
      console.log(`Usage:
  node scripts/federation-agent.cjs join <channel> [--name NAME] [--platform PLATFORM] [--relay URL]
  node scripts/federation-agent.cjs send <channel> <message> [--name NAME] [--platform PLATFORM]
  node scripts/federation-agent.cjs listen <channel> [--interactive] [--name NAME]
  node scripts/federation-agent.cjs status [--relay URL]`);
      break;
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ status: 'error', message: error.message }));
  process.exit(1);
});
