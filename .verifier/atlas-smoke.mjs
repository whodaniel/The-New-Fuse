import { loadAtlasIntoContext } from './turn-zero-atlas.mjs';

const initial = [
  { role: 'user', content: 'What is currently running?' }
];

console.log('### test 1: fresh digest injection (system message prepended)');
const out1 = await loadAtlasIntoContext(initial, { maxAgeMinutes: 240 });
console.log('result_messages:', out1.length, 'first_role:', out1[0].role, 'first_chars:', out1[0].content.length);
console.log('first_180:', out1[0].content.slice(0, 180).replaceAll('\n', ' | '));
console.log('---');

console.log('### test 2: idempotency (system already injected, must be no-op)');
const out2 = await loadAtlasIntoContext(out1);
console.log('result_messages:', out2.length, 'matches initial ids?', out2 === out1);
console.log('---');

console.log('### test 3: forced stale digest (failsafe returns original array)');
const out3 = await loadAtlasIntoContext(initial, { maxAgeMinutes: 0.0000001, failsafeVerbose: true });
console.log('result_messages:', out3.length, 'matches initial length?', out3.length === initial.length);
