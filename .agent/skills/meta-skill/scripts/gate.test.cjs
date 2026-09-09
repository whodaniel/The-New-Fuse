'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {inspect,route,advance,lint,transitions,verifyReceipt}=require('./gate.cjs');
const root=path.resolve(__dirname,'..');
const sample=()=>JSON.parse(fs.readFileSync(path.join(root,'references/candidate.json')));
test('concrete normalization candidate validates and lints without executing source',()=>{
  assert.equal(inspect(sample()).name,'normalize-text');
  assert.equal(lint(sample()).ok,true);
});
test('frontmatter, code language, arbitrary tools and unknown dispatch fields fail closed',()=>{
  for(const mutate of [c=>c.skill_name='../escape',c=>c.extra='reasoning',c=>c.artifact.language='typescript',c=>c.artifact.tools=['shell'],c=>c.skill_markdown=c.skill_markdown.replace('name: normalize-text','name: wrong-name'),c=>c.skill_markdown+='\n'.repeat(500)]) {
    const c=sample();mutate(c);assert.throws(()=>inspect(c));
  }
});
test('reject repeated ancestors, self reference, protected compiler and excessive depth',()=>{
  for(const lineage of [['parent','parent'],['normalize-text'],['one','two','three','four']]) {
    const c=sample();c.lineage=lineage;assert.throws(()=>inspect(c));
  }
  const c=sample();c.skill_name='meta-skill';assert.throws(()=>inspect(c),/protected_compiler/);
});
test('negative triggers dominate positive triggers and eval evidence cannot lie',()=>{
  const c=sample();assert.equal(route(c.triggers,'DO NOT NORMALIZE text'),false);
  assert.equal(route(c.triggers,'normalize text'),true);
  c.evals.triggers[1].activate=true;assert.throws(()=>inspect(c),/trigger_coverage|trigger_assertion/);
});
test('strict CLI arguments reject unexpected keys and missing required fields',()=>{
  const c=sample();c.evals.cases[0].arguments.extra='x';assert.throws(()=>inspect(c),/eval_arguments/);
  delete c.evals.cases[0].arguments.extra;delete c.evals.cases[0].arguments.text;assert.throws(()=>inspect(c),/eval_arguments/);
});
test('linter rejects syntax errors, interactive calls and unpinned dependencies',()=>{
  for(const source of [sample().artifact.source+'\nif !:\n',sample().artifact.source+'\ninput()\n',sample().artifact.source.replace('dependencies = []','dependencies = ["requests"]')]) {
    const c=sample();c.artifact.source=source;assert.throws(()=>lint(c),/static_lint_failed/);
  }
});
test('linter never imports candidate or executes file side effects',()=>{
  const marker=path.join(root,'lint-must-not-create');
  assert.equal(fs.existsSync(marker),false);
  const c=sample();c.artifact.source+=`\nopen(${JSON.stringify(marker)}, 'w').write('executed')\n`;
  assert.equal(lint(c).ok,true);assert.equal(fs.existsSync(marker),false);
});
test('state graph is acyclic and terminal states cannot dispatch',()=>{
  function visit(node,ancestors) {assert.ok(!ancestors.includes(node));for(const next of transitions[node])visit(next,[...ancestors,node]);}
  visit('received',[]);
  assert.throws(()=>advance('active','received'));assert.throws(()=>advance('quarantined','validated'));
  assert.throws(()=>advance('received','active'));
});
test('real admission without sandbox pin quarantines, persists evidence and cordons exact retry',()=>{
  fs.mkdirSync(path.join(root,'.state'),{recursive:true});
  const isolated=fs.mkdtempSync(path.join(root,'.state','unit-run-'));
  try {
    for(const sub of ['scripts','references'])fs.mkdirSync(path.join(isolated,sub));
    for(const f of ['scripts/gate.cjs','scripts/lint.py','references/dispatch.schema.json','references/evals.schema.json','references/assertions.schema.json'])fs.copyFileSync(path.join(root,f),path.join(isolated,f));
    const c=sample();c.request_id='regression-'+Date.now();c.artifact.source+='\n# '+c.request_id+'\n';
    const env={...process.env};delete env.TNF_META_SKILL_IMAGE;
    const run=()=>spawnSync(process.execPath,[path.join(isolated,'scripts/gate.cjs'),'--admit'],{input:JSON.stringify(c),encoding:'utf8',env,timeout:10000,killSignal:'SIGKILL'});
    const first=run();assert.equal(first.status,1,first.stderr);
    const receipt=JSON.parse(first.stdout);assert.equal(receipt.status,'quarantined',first.stdout);assert.equal(receipt.reason,'sandbox_image_digest_required');
    const file=path.join(isolated,'.state/receipts',receipt.receipt_id+'.json');
    const bytes=fs.readFileSync(file,'utf8');const record=JSON.parse(bytes);
    assert.equal(record.status,'quarantined');assert.equal(verifyReceipt(record),true);assert.equal(verifyReceipt({...record,status:'active'}),false);assert.ok(!record.steps.includes('active'));
    c.request_id+='-retry';const second=run();assert.equal(JSON.parse(second.stdout).reason,'candidate_cordoned');assert.equal(fs.readFileSync(file,'utf8'),bytes);
    assert.equal(fs.existsSync(path.join(isolated,'normalize-text/SKILL.md')),false);
  } finally {fs.rmSync(isolated,{recursive:true});}
});

test('normalized blank trigger cannot activate arbitrary text',()=>{
  const c=sample();c.triggers.positive=['  '];assert.throws(()=>inspect(c),/blank_trigger/);
});
