#!/usr/bin/env node
/**
 * Green Channel Broker (DACC-v1) — compatibility wrapper.
 * Uses generic FederationChannelBroker with Green + Gemini compute defaults.
 */

const path = require('path');
const { RedisAgentClient } = require(path.join(__dirname, '..', 'tnf-agent-cli.cjs'));
const {
  FederationChannelBroker,
  CONFIG: BROKER_CONFIG,
} = require(path.join(__dirname, 'federation-channel-broker.cjs'));

const CONFIG = {
  relayUrl:
    process.env.RELAY_URL ||
    process.env.TNF_RELAY_URL ||
    process.env.RELAY_WS_URL ||
    BROKER_CONFIG.relayUrl,
  channelId: process.env.TNF_GREEN_CHANNEL || 'Green',
  geminiName: process.env.GEMINI_AGENT_NAME || 'gemini',
  heartbeatMs: BROKER_CONFIG.heartbeatMs,
  reconnectMs: 5000,
};

class GreenChannelCoordinator extends FederationChannelBroker {
  constructor() {
    super({
      relayUrl: CONFIG.relayUrl,
      channelId: CONFIG.channelId,
      computeAgentName: CONFIG.geminiName,
      channelColor: 'green',
      redis: new RedisAgentClient(),
      inboundLogDir: path.join(process.env.HOME || '/tmp', '.tnf/green-coordinator'),
      inboundLogFile: path.join(
        process.env.HOME || '/tmp',
        '.tnf/green-coordinator/inbound-ai-responses.jsonl'
      ),
    });
  }
}

if (require.main === module) {
  process.on('uncaughtException', (error) => {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        component: 'BROKER-Green',
        message: 'Uncaught exception',
        error: error.message,
      })
    );
  });
  process.on('unhandledRejection', (error) => {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        component: 'BROKER-Green',
        message: 'Unhandled rejection',
        error: error instanceof Error ? error.message : String(error),
      })
    );
  });

  const coordinator = new GreenChannelCoordinator();
  coordinator.start().catch((error) => {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        component: 'BROKER-Green',
        message: 'Failed to start',
        error: error.message,
      })
    );
    process.exit(1);
  });
}

module.exports = { GreenChannelCoordinator, CONFIG };
