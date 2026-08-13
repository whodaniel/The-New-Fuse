import { performance } from 'node:perf_hooks';
import { TNFEnvelopeSchema } from '../src/envelope.ts';
import crypto from 'node:crypto';

async function runStressTest() {
  console.log('[🚀] Starting High-Throughput Protocol Contract Stress Test...');

  const ITERATIONS = 100000;
  let successCount = 0;
  let failCount = 0;

  const sampleEnvelope = {
    id: crypto.randomUUID(),
    version: '1.0',
    traceId: 'trace-123',
    timestamp: new Date().toISOString(),
    type: 'command',
    from: {
      agentId: 'agent-1'
    },
    to: {
      broadcast: true
    },
    payload: {
      action: 'stress_test',
      data: Array.from({ length: 50 }, (_, i) => i)
    }
  };

  const start = performance.now();

  for (let i = 0; i < ITERATIONS; i++) {
    const env = { ...sampleEnvelope, id: crypto.randomUUID() };
    const result = TNFEnvelopeSchema.safeParse(env);
    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  const end = performance.now();
  const durationMs = end - start;
  const throughput = (ITERATIONS / (durationMs / 1000)).toFixed(2);

  console.log(`[📊] Stress Test Results:`);
  console.log(`  - Total Processed: ${ITERATIONS}`);
  console.log(`  - Success: ${successCount}`);
  console.log(`  - Failed: ${failCount}`);
  console.log(`  - Duration: ${durationMs.toFixed(2)} ms`);
  console.log(`  - Throughput: ${throughput} envelopes/sec`);
}

runStressTest().catch(console.error);
