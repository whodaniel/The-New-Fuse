import assert from 'assert';
import { createHmac } from 'crypto';
import { FederatedIdentityService } from './src/federated-identity.service.js';
import { PointerResolverService } from './src/pointer-resolver.service.js';
import { A2ASignatureWrapper } from './src/signature-wrapper.js';

async function test() {
  console.log('Running TNF Secure Messaging & Identity Tests...');

  // 1. Test Federated Identity (ID# Encoding)
  const mockRedis = {
    incr: async (key: string) => 1337,
  } as any;
  const identityService = new FederatedIdentityService(mockRedis);
  const idNumber = await identityService.generateIdNumber('AGENT-01');

  console.log(`✅ ID# Encoded: ${idNumber}`);
  assert.strictEqual(idNumber, 'ID#:Q4'); // 1337 in Base58 (23*58 + 3)

  // 2. Test Signature Wrapper
  const agentId = 'AGENT-01';
  const secret = 'super-secret-key';
  const wrapper = new A2ASignatureWrapper(agentId, secret);

  const payload = { task: 'Analyze the Borg' };
  const resourcePointers = {
    'karpathy-wiki': {
      uri: 'pgvector://wiki/karpathy-log-001',
      mimeType: 'text/markdown',
    },
  };

  const packet = wrapper.wrap('TASK_ASSIGNMENT', payload, { resourcePointers });

  console.log('✅ Packet Wrapped Successfully');
  assert.strictEqual(packet.header.agent_id, agentId);
  assert.strictEqual(
    packet.header.resource_pointers?.['karpathy-wiki'].uri,
    'pgvector://wiki/karpathy-log-001'
  );
  assert.ok(packet.signature);

  // 3. Test Attribution Verification
  const content = 'Software 3.0 Research';
  // Manually compute signature matching the service logic
  const hash = createHmac('sha256', secret).update(content).digest('hex');
  const message = `${agentId}|${idNumber}|${hash}`;
  const sig = createHmac('sha256', secret).update(message).digest('hex');

  const isVerified = identityService.verifyAttribution(agentId, idNumber, content, sig, secret);
  console.log('✅ Attribution Verified Successfully');
  assert.ok(isVerified);

  // 4. Test Pointer Resolver (Mocked Vector DB)
  const mockVectorDb = {
    getDocument: async (coll: string, id: string) => {
      if (coll === 'wiki' && id === 'karpathy-log-001') {
        return { content: '# Karpathy Log\n\nSoftware 3.0 is here.' };
      }
      return null;
    },
  } as any;

  const resolver = new PointerResolverService(mockVectorDb);
  const resolvedContent = await resolver.resolve(packet.header.resource_pointers!['karpathy-wiki']);

  console.log('✅ Pointer Resolved Successfully');
  assert.ok(resolvedContent.includes('Software 3.0'));

  console.log('ALL TESTS PASSED: TNF Sovereign State & Federated Identity verified.');
}

test().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
