'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const Ajv = require('ajv');
const root = __dirname;
const lock = JSON.parse(fs.readFileSync(path.join(root, 'integrity.json')));
const ajv = new Ajv({strict: true, allErrors: true, coerceTypes: false, removeAdditional: false});
for (const [file, digest] of Object.entries(lock.files)) {
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex'), digest, file);
}
const roles = fs.readdirSync(root).filter(f => fs.statSync(path.join(root, f)).isDirectory());
assert.equal(roles.length, 6);
for (const role of roles) {
  const dir = path.join(root, role);
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'agent_manifest.json')));
  assert.equal(manifest.id, role);
  assert.ok(roles.includes(manifest.failure_policy.fallback) || manifest.failure_policy.fallback === 'principal-orchestrator');
  assert.ok(fs.readFileSync(path.join(dir, manifest.system_prompt), 'utf8').length > 1000);
  for (const kind of ['input', 'output']) {
    const validate = ajv.compile(JSON.parse(fs.readFileSync(path.join(dir, manifest[kind + '_schema']))));
    const value = kind === 'input'
      ? {task_id:'validation', role, objective:'Validate contract', allowed_paths:['data/harness/specialist-agency/v1'], evidence:[], acceptance_criteria:['Schema validation'], deadline_at:'2026-09-06T00:00:00Z'}
      : {task_id:'validation', role, status:'designed', summary:'Contract validation only', artifacts:[], verification:[], next_action:'Runtime acceptance'};
    assert.ok(validate(value), JSON.stringify(validate.errors));
    assert.equal(validate({...value, unauthorized:true}), false);
    assert.equal(validate({...value, role:'wrong-role'}), false);
    assert.equal(validate({}), false);
  }
}
console.log('PASS: 6 manifests, 12 schemas, integrity checks and invalid-message rejection. Runtime activation not tested.');
