const assert = require('node:assert/strict');
const test = require('node:test');
const Redis = require('ioredis');

const { keyFromUri } = require('../lib/context-reference.cjs');
const { FederationChannelBroker } = require('./federation-channel-broker.cjs');

test('broker stores large replies and hydrates them only on the compute execution path', async () => {
  const redis = new Redis({ host: '127.0.0.1', port: 6379, maxRetriesPerRequest: 1 });
  let broadcast;
  let sent;

  const broker = Object.create(FederationChannelBroker.prototype);
  broker.channelId = 'Green';
  broker.computeAgentName = 'compute-agent';
  broker.computeAgent = { id: 'compute-1' };
  broker.identity = {
    operationalHandle: 'BROKER-Green',
    canonicalEntityId: 'tnf:broker:green',
  };
  broker.redis = {
    publisher: redis,
    send: async (content, options) => {
      sent = { content, options };
    },
  };
  broker.broadcastOnChannel = (content, metadata) => {
    broadcast = { content, metadata };
  };
  broker.refreshComputeTarget = async () => {};
  broker.log = () => {};

  const fullContext = 'execution-context-'.repeat(240);
  try {
    await broker.mirrorComputeContent(
      { content: fullContext },
      { originalFrom: 'page-agent', correlationId: 'correlation-1' }
    );

    const reference = broadcast.metadata.contextRef;
    assert.equal(reference.version, 'dacc-context-ref/1.0');
    assert.match(broadcast.content, /\[context_ref: redis:\/\/tnf:context:/);
    assert.equal(broadcast.metadata.contextEfficiency.outcome, 'referenced');
    assert.ok((await redis.ttl(keyFromUri(reference.uri))) > 0);

    await broker.forwardToCompute({
      id: 'message-1',
      from: 'page-agent',
      content: broadcast.content,
      metadata: {
        contextRef: reference,
        correlationId: 'correlation-1',
      },
    });

    assert.ok(sent);
    assert.match(sent.content, new RegExp(fullContext.slice(0, 200)));
    assert.equal(sent.options.metadata.contextEfficiency.outcome, 'hydrated');
    assert.equal(sent.options.metadata.contextEfficiency.hydratedBytes, reference.byteCount);
  } finally {
    if (broadcast?.metadata?.contextRef?.uri) {
      await redis.del(keyFromUri(broadcast.metadata.contextRef.uri));
    }
    await redis.quit();
  }
});
