/**
 * Worker envelope builder — pins shape expected by run_one_envelope.py
 */
import { buildWorkerTaskEnvelope, isSubDirectorWorker, workerQueueKey } from './WorkerEnvelope.js';

let pass = 0;
let fail = 0;

function check(name: string, cond: boolean, detail = ''): void {
  if (cond) {
    console.log(`  PASS  ${name}`);
    pass += 1;
  } else {
    console.log(`  FAIL  ${name} ${detail}`);
    fail += 1;
  }
}

console.log('\nworker envelope');

const envelope = buildWorkerTaskEnvelope({
  recipientAgentId: 'agent_hermes-codegen-worker_1782364000001',
  content: 'fix the relay port default',
  senderAgentId: 'cli-sender',
});

check('envelope type is task', envelope.type === 'task');
check(
  'recipient on payload.to',
  envelope.payload.to.agentId === 'agent_hermes-codegen-worker_1782364000001'
);
check(
  'task description carries content',
  envelope.payload.payload.task.description.includes('relay port')
);
check(
  'queue key matches sub-director pattern',
  workerQueueKey('agent_hermes-codegen-worker_1782364000001') ===
    'tnf:direct:sub-director:agent_hermes-codegen-worker_1782364000001'
);
check(
  'worker role detected',
  isSubDirectorWorker({ role: 'worker', agentId: 'agent_hermes-infra-worker_1' })
);
check(
  'worker id heuristic',
  isSubDirectorWorker({ role: 'participant', agentId: 'agent_hermes-codegen-worker_1' })
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
