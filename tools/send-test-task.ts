import crypto from 'crypto';
import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const INGRESS_CHANNEL = 'tnf:bus:ingress';

async function main() {
  const publisher = createClient({ url: REDIS_URL });
  await publisher.connect();

  const envelope = {
    id: crypto.randomUUID(),
    version: '1.0',
    type: 'task',
    timestamp: new Date().toISOString(),
    traceId: crypto.randomUUID(),
    from: { agentId: 'user-console', role: 'orchestrator' },
    to: { broadcast: true },
    payload: {
      requiredCapability: 'system:email',
      to: 'user@example.com',
      subject: 'Hello from Big Brother',
    },
    context: {
      // Additional context if needed
    },
  };

  console.log('📦 Sending Envelope:', JSON.stringify(envelope, null, 2));
  await publisher.publish(INGRESS_CHANNEL, JSON.stringify(envelope));
  console.log('✅ Sent to', INGRESS_CHANNEL);

  await publisher.quit();
}

main().catch(console.error);
