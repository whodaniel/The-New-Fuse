'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {spawnSync} = require('node:child_process');
const Ajv = require('ajv');
const YAML = require('yaml');
const SKILL = path.resolve(__dirname, '..');
const SKILLS = path.resolve(SKILL, '..');
const STATE = path.join(SKILL, '.state');
const registry = new Map(); // Transient; never restore activation from unverified disk data.
const ajv = new Ajv({strict:true, allErrors:true, coerceTypes:false, removeAdditional:false});
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const validateEnvelope = ajv.compile(read(path.join(SKILL, 'references/dispatch.schema.json')));
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const canonical = value => JSON.stringify(value, (_, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])) : v);
const policyDigest = () => digest(['gate.cjs','lint.py'].map(f=>fs.readFileSync(path.join(__dirname,f))).concat(['dispatch','evals','assertions'].map(f=>fs.readFileSync(path.join(SKILL,'references',f+'.schema.json')))).join('\n'));
const fail = message => { throw new Error(message); };
const transitions = Object.freeze({received:['validated','quarantined'], validated:['linted','quarantined'], linted:['evaluated','quarantined'], evaluated:['active','quarantined'], active:[], quarantined:[]});
function advance(current, next) {
  if (!transitions[current]?.includes(next)) fail(`invalid_transition:${current}:${next}`);
  return next;
}
function route(triggers, text) {
  const normalized = text.normalize('NFKC').toLowerCase();
  const terms=[...triggers.positive,...triggers.negative];
  if(terms.some(term=>!term.normalize('NFKC').trim()))fail('blank_trigger');
  const contains = term => normalized.includes(term.normalize('NFKC').trim().toLowerCase());
  return !triggers.negative.some(contains) && triggers.positive.some(contains);
}
function inspect(candidate) {
  if (!validateEnvelope(candidate)) fail('schema:' + ajv.errorsText(validateEnvelope.errors));
  if (['meta-skill','skill-builder'].includes(candidate.skill_name)) fail('protected_compiler');
  if (new Set(candidate.lineage).size !== candidate.lineage.length || candidate.lineage.includes(candidate.skill_name)) fail('lineage_cycle');
  const markdown = candidate.skill_markdown;
  if (markdown.split('\n').length >= 500) fail('disclosure_line_limit');
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) fail('frontmatter_missing');
  const doc = YAML.parseDocument(match[1], {uniqueKeys:true, maxAliasCount:0});
  if (doc.errors.length) fail('frontmatter_invalid');
  const front = doc.toJS({maxAliasCount:0});
  if (!front || typeof front !== 'object' || Array.isArray(front)) fail('frontmatter_object');
  if (Object.keys(front).some(k => !['name','description','license','compatibility','metadata','allowed-tools'].includes(k))) fail('frontmatter_unknown_field');
  if (front.name !== candidate.skill_name) fail('frontmatter_name');
  if (typeof front.description !== 'string' || !front.description.trim() || front.description.length > 1024) fail('frontmatter_description');
  if (front.compatibility !== undefined && (typeof front.compatibility !== 'string' || !front.compatibility.length || front.compatibility.length > 500)) fail('frontmatter_compatibility');
  if (front.license !== undefined && typeof front.license !== 'string') fail('frontmatter_license');
  if (front.metadata !== undefined && (!front.metadata || typeof front.metadata !== 'object' || Array.isArray(front.metadata) || Object.values(front.metadata).some(v=>typeof v !== 'string'))) fail('frontmatter_metadata');
  if (front['allowed-tools'] !== undefined && front['allowed-tools'] !== '') fail('tools_not_allowed_v1');
  if (!front.description.includes('Use when') || !front.description.includes('Do not use')) fail('activation_boundaries_missing');
  if(!candidate.evals.cases.some(c=>c.expected_exit===0))fail('success_eval_required');
  const ids = candidate.evals.cases.map(c=>c.id);
  if (new Set(ids).size !== ids.length) fail('duplicate_eval_ids');
  const validateArguments = ajv.compile(candidate.artifact.arguments_schema);
  for (const c of candidate.evals.cases) if (!validateArguments(c.arguments)) fail('eval_arguments:' + c.id);
  const triggerCases = candidate.evals.triggers;
  if (!triggerCases.some(t=>t.activate) || !triggerCases.some(t=>!t.activate)) fail('trigger_coverage');
  for (const c of triggerCases) if (route(candidate.triggers,c.text) !== c.activate) fail('trigger_assertion');
  return {name:front.name, description:front.description};
}
function lint(candidate) {
  const result = spawnSync('python3', ['-I',path.join(__dirname,'lint.py')], {input:JSON.stringify({source:candidate.artifact.source}), encoding:'utf8',timeout:5000,killSignal:'SIGKILL',maxBuffer:32768});
  if (result.error || result.status !== 0) fail('static_lint_failed');
  return JSON.parse(result.stdout);
}
function evaluate(candidate) {
  const image = process.env.TNF_META_SKILL_IMAGE || '';
  if (!/^[a-z0-9][a-z0-9./:_-]*@sha256:[a-f0-9]{64}$/.test(image)) fail('sandbox_image_digest_required');
  const info = spawnSync('docker',['info','--format','{{.ServerVersion}}'],{encoding:'utf8',timeout:5000,killSignal:'SIGKILL',maxBuffer:8192});
  if (info.error || info.status !== 0 || !/^\d+\.\d+/.test(info.stdout.trim()) || info.stderr.trim()) fail('sandbox_unavailable');
  const deadline = Date.now()+150000;
  function run(cliArguments) {
    if(Date.now()>=deadline) fail('evaluation_deadline');
    const name = 'tnf-meta-' + crypto.randomUUID();
    // The untrusted process never receives expected answers, host files or evaluator code.
    const args = ['run','--pull=never','--name',name,'--network=none','--read-only','--cap-drop=ALL','--security-opt=no-new-privileges','--pids-limit=32','--memory=128m','--cpus=0.5','--user=65534:65534','--tmpfs=/tmp:rw,noexec,nosuid,size=16m','--workdir=/tmp','--log-driver=none','--entrypoint=/usr/bin/timeout',image,'--signal=KILL',String(candidate.assertions.case_timeout_seconds)+'s','python3','-I','-c',candidate.artifact.source,...cliArguments];
    try {
      const result = spawnSync('docker',args,{input:'',encoding:'utf8',timeout:Math.min(deadline-Date.now(),candidate.assertions.case_timeout_seconds*1000+10000),killSignal:'SIGKILL',maxBuffer:candidate.assertions.max_stdout_bytes});
      if(result.error || result.signal || result.status===null || result.status>=125) fail('sandbox_execution_failed:'+(result.error?.code || result.signal || result.status));
      if(Buffer.byteLength(result.stdout)+Buffer.byteLength(result.stderr)>candidate.assertions.max_stdout_bytes) fail('sandbox_output_limit');
      return {exit:result.status,stdout:result.stdout,stderr:result.stderr};
    } finally {
      const cleanup=spawnSync('docker',['rm','-f',name],{encoding:'utf8',timeout:10000,killSignal:'SIGKILL',maxBuffer:8192});
      if(cleanup.error || (cleanup.status!==0 && !cleanup.stderr.includes('No such container'))) fail('sandbox_cleanup_unconfirmed');
    }
  }
  const help=run(['--help']);
  if(help.exit!==0 || !help.stdout.includes('--input-json')) fail('help_contract_failed');
  for(const invalid of ['{',JSON.stringify({__tnf_unknown__:true})]) {
    if(run(['--input-json',invalid]).exit===0)fail('invalid_arguments_accepted');
  }
  const cases=[];
  for(const c of candidate.evals.cases) {
    const args=['--input-json',JSON.stringify(c.arguments)];
    const first=run(args), second=run(args);
    if(JSON.stringify(first)!==JSON.stringify(second)) fail('nonrepeatable:'+c.id);
    if(first.exit!==c.expected_exit || first.stdout!==c.expected_stdout) fail('assertion_failed:'+c.id);
    cases.push({id:c.id,passed:true,stdout_sha256:digest(first.stdout)});
  }
  return {image,evidence:{ok:true,help:true,repeatability:true,cases}};
}
function directory(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, {mode:0o700});
  if (fs.lstatSync(dir).isSymbolicLink() || !fs.statSync(dir).isDirectory()) fail('state_path_unsafe');
}
function writeOnce(file, data) {
  const fd = fs.openSync(file,'wx',0o400);
  try {fs.writeFileSync(fd,data);fs.fsyncSync(fd);} finally {fs.closeSync(fd);}
  const parent=fs.openSync(path.dirname(file),'r');try{fs.fsyncSync(parent);}finally{fs.closeSync(parent);}
}
function sealReceipt(record) {
  const payload={...record,policy_sha256:policyDigest()};
  return {...payload,receipt_sha256:digest(canonical(payload))};
}
function verifyReceipt(receipt) {
  const {receipt_sha256,...payload}=receipt;
  return receipt_sha256===digest(canonical(payload)) && payload.policy_sha256===policyDigest();
}
function admit(candidate) {
  // The caller cannot choose filesystem roots, commands, grants, image or policy implementation.
  if (fs.realpathSync(SKILL) !== SKILL || fs.realpathSync(SKILLS) !== SKILLS) fail('compiler_root_symlink');
  directory(STATE);
  for (const sub of ['receipts','quarantine']) directory(path.join(STATE,sub));
  let entries=0,totalBytes=0;
  for(const sub of ['receipts','quarantine'])for(const name of fs.readdirSync(path.join(STATE,sub))){
    const stat=fs.lstatSync(path.join(STATE,sub,name));
    if(!stat.isFile() || stat.isSymbolicLink())fail('ledger_entry_unsafe');
    entries++;totalBytes+=stat.size;
  }
  if(entries>=1024 || totalBytes>63*1024*1024)fail('ledger_quota_exceeded');
  const lock = path.join(STATE,'admission.lock');
  try {fs.mkdirSync(lock);} catch {fail('admission_busy_or_interrupted: reconcile lock without automatic retry');}
  const bytes = JSON.stringify(candidate);
  let candidateDigest = digest(bytes);
  const receiptId = crypto.randomUUID();
  let state = 'received';
  const steps = [state];
  const move = next => {state=advance(state,next);steps.push(state);};
  let result;
  try {
    const metadata=inspect(candidate); move('validated');
    const {request_id,...revision}=candidate;candidateDigest=digest(canonical(revision));
    const blocked=path.join(STATE,'quarantine',candidateDigest+'.json');
    if (fs.existsSync(blocked)) fail('candidate_cordoned');
    const staticEvidence=lint(candidate); move('linted');
    const sandboxEvidence=evaluate(candidate); move('evaluated');
    // Store source only as JSON. Legacy Markdown scanners cannot activate unverified candidates.
    // Activation is process-local; returning a receipt is not persistent runtime registration.
    const receipt=sealReceipt({version:1,receipt_id:receiptId,candidate_sha256:candidateDigest,status:'active',skill_name:metadata.name,candidate,steps:[...steps,'active'],staticEvidence,sandboxEvidence});
    writeOnce(path.join(STATE,'receipts',receiptId+'.json'),JSON.stringify(receipt,null,2)+'\n');
    move('active');
    registry.set(metadata.name,Object.freeze({candidate_sha256:candidateDigest,receipt_id:receiptId}));
    result={status:'active',receipt_id:receiptId,skill_name:metadata.name,reason:'validated_transient_registration',path:path.join(STATE,'receipts',receiptId+'.json')};
  } catch(error) {
    if (state !== 'active') move('quarantined');
    const receipt=sealReceipt({version:1,receipt_id:receiptId,candidate_sha256:candidateDigest,status:'quarantined',skill_name:typeof candidate?.skill_name==='string'?candidate.skill_name:null,reason:error.message,steps});
    const blocked=path.join(STATE,'quarantine',candidateDigest+'.json');
    if (!fs.existsSync(blocked)) writeOnce(blocked,JSON.stringify({receipt,candidate},null,2)+'\n');
    writeOnce(path.join(STATE,'receipts',receiptId+'.json'),JSON.stringify(receipt,null,2)+'\n');
    result={status:'quarantined',receipt_id:receiptId,skill_name:receipt.skill_name,reason:receipt.reason};
  } finally {fs.rmdirSync(lock);}
  return result;
}
function main() {
  const args=process.argv.slice(2);
  if (args.length===1 && args[0]==='--help') {console.log('Usage: node gate.cjs --check | --admit < dispatch.json\n--check validates contracts and Python AST without executing synthesized code.\n--admit requires trusted TNF_META_SKILL_IMAGE pinned digest; sandbox failure quarantines.');return;}
  if(args.length!==1 || !['--check','--admit'].includes(args[0])) fail('invalid_cli_arguments');
  // Bound stdin before JSON parsing rather than reading an unlimited stream.
  const chunks=[];let size=0;
  const buffer=Buffer.alloc(8192);
  for (;;) {const n=fs.readSync(0,buffer,0,buffer.length,null);if(!n)break;size+=n;if(size>262144)fail('dispatch_too_large');chunks.push(Buffer.from(buffer.subarray(0,n)));}
  const candidate=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if(args[0]==='--check') {inspect(candidate);const evidence=lint(candidate);console.log(JSON.stringify({status:'checked',active:false,evidence}));}
  else {const result=admit(candidate);console.log(JSON.stringify(result));if(result.status!=='active')process.exitCode=1;}
}
if(require.main===module)try{main();}catch(e){console.log(JSON.stringify({status:'rejected',reason:e.message}));process.exitCode=1;}
module.exports={inspect,route,advance,lint,admit,transitions,verifyReceipt};
