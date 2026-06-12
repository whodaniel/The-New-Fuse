const { randomUUID } = require('crypto');

async function publishProviderFailureSignal(
  client,
  {
    channel = 'tnf:model-watchdog:signals',
    event = 'provider_failure',
    sourceAgent = 'unknown',
    agentRole = 'worker',
    platform = 'unknown',
    provider = 'unknown',
    model = 'unspecified',
    category = 'availability',
    message = '',
    metadata = {},
  } = {}
) {
  const redis = client?.publisher;
  if (!redis || typeof redis.publish !== 'function') {
    throw new Error('watchdog signal publish unavailable: Redis publisher is not initialized');
  }

  const timestamp = new Date().toISOString();
  const agentId = String(process.env.AGENT_ID || '').trim() || `agent_${sourceAgent}`;
  const signal = {
    spec: 'tnf/model-watchdog/0.1',
    sourceAgent,
    provider,
    model,
    category,
    message,
    timestamp,
    ...metadata,
  };
  const watchdogMessage = {
    id: randomUUID(),
    timestamp,
    from: {
      agentId,
      agentName: sourceAgent,
      role: agentRole,
      platform,
    },
    type: 'status',
    content: `provider-failure:${provider}:${category}`,
    metadata: {
      event,
      signal,
    },
  };

  await redis.publish(channel, JSON.stringify(watchdogMessage));
  return watchdogMessage;
}

module.exports = {
  publishProviderFailureSignal,
};
