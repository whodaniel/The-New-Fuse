'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const enabled=Boolean(process.env.TNF_META_SKILL_IMAGE);
function candidate() {
  const c=JSON.parse(fs.readFileSync(path.join(root,'references/candidate.json')));
  c.artifact.source+='\n# sandbox-suite-revision-'+Date.now()+'-'+process.pid+'\n';
  return c;
}
function admit(c) {
  const r=spawnSync(process.execPath,[path.join(__dirname,'gate.cjs'),'--admit'],{input:JSON.stringify(c),encoding:'utf8',timeout:190000,killSignal:'SIGKILL'});
  assert.ok(!r.error,r.error?.message);const result=JSON.parse(r.stdout);assert.notEqual(result.status,'rejected',JSON.stringify(result));return result;
}
test('real pinned-container admission and failed expected-output quarantine',{skip:!enabled,timeout:390000},()=>{
  const c=candidate();assert.equal(admit(c).status,'active');
  c.evals.cases[0].expected_stdout='wrong expectation\n';
  const rejected=admit(c);assert.equal(rejected.status,'quarantined');assert.match(rejected.reason,/assertion_failed/);
});
test('real pinned-container deadline and output bounds',{skip:!enabled,timeout:390000},()=>{
  for(const body of ['while True: pass','print("x" * 50000)']) {
    const c=candidate();c.artifact.source=c.artifact.source.split('import argparse')[0]+body+'\n';
    assert.equal(admit(c).status,'quarantined');
  }
});
test('real sandbox denies host visibility, root writes and outbound connections',{skip:!enabled,timeout:190000},()=>{
  const c=candidate();
  c.skill_name='verify-sandbox-isolation';
  c.skill_markdown=c.skill_markdown.replaceAll('normalize-text',c.skill_name);
  c.artifact.source=c.artifact.source.replace("print(value['text'].strip().lower())", `import os
import socket
assert os.getuid() == 65534
assert not os.path.exists('/Users')
try:
    with open('/tnf-write-probe', 'w') as f:
        f.write('unexpected')
except OSError:
    pass
else:
    raise RuntimeError('root_write_allowed')
try:
    connection = socket.create_connection(('1.1.1.1', 443), timeout=0.5)
except OSError:
    pass
else:
    connection.close()
    raise RuntimeError('network_allowed')
print('isolated')`);
  for(const vector of c.evals.cases)vector.expected_stdout='isolated\n';
  assert.equal(admit(c).status,'active');
});
