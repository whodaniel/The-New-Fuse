const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const Ajv2020 = require('ajv/dist/2020').default;
const addFormats = require('ajv-formats');
const { upgrade } = require('../turn-end-v2.cjs');

const root = path.resolve(__dirname, '../..');
const schema = JSON.parse(
  fs.readFileSync(path.join(root, 'docs/protocols/schemas/tnf-session-handoff.schema.json'), 'utf8'),
);

function legacyHandoff() {
  return {
    spec: 'tnf/session-handoff/0.1',
    handoff_id: '4cb84db8-daa8-4327-9bad-2f26f3e13ce1',
    created_at: '2026-08-21T00:00:00.000Z',
    repository: 'The-New-Fuse',
    branch: 'test',
    head_sha: 'a'.repeat(40),
    protocol_ack: 'TNF_PROTOCOL_ACK',
    sensitive_scope: 'internal',
    project_ids: ['TNF-SESSION'],
    work_summary: ['Verify V2 handoff upgrade.'],
    changed_paths: ['scripts/turn-end-v2.cjs'],
    verification: {
      privacy_guard: 'na',
      secret_sweep: 'na',
      docs_pii_guard: 'na',
      supabase_rls_audit: 'na',
      notes: '',
    },
    continuation: {
      owner: 'test',
      targets: ['orchestrator'],
      priority: 'medium',
      resume_checklist: ['Validate the handoff.'],
    },
    next_actions: ['Continue.'],
    artifacts: { commits: ['a'.repeat(40)] },
  };
}

test('upgrade produces a schema-valid V2 handoff', () => {
  const handoff = upgrade(legacyHandoff());
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  assert.equal(handoff.spec, 'tnf/session-handoff/0.2');
  assert.equal(handoff.repository, 'whodaniel/tnf-monorepo');
  assert.equal(validate(handoff), true, JSON.stringify(validate.errors));
});

test('all active handoff producers have retired the V1 spec', () => {
  const producers = [
    'scripts/protocols/emit-session-handoff.cjs',
    'scripts/turn-end.cjs',
    'scripts/autonomy/phase7_directive_conversion_loop.py',
  ];

  for (const producer of producers) {
    const source = fs.readFileSync(path.join(root, producer), 'utf8');
    assert.equal(source.includes('tnf/session-handoff/0.1'), false, producer);
  }
});
