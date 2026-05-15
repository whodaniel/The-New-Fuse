#!/usr/bin/env node
/* eslint-disable no-console */
const { execSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = process.cwd();
const handoffJsonPath = path.join(repoRoot, 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json');
const handoffMdPath = path.join(repoRoot, 'docs/protocols/reports/SESSION_HANDOFF_LATEST.md');
const ledgerPath = path.join(repoRoot, 'docs/protocols/AGENT_STATUS_LEDGER.md');

function run(command, options = {}) {
  return execSync(command, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 1024 * 1024 * 128,
    ...options,
  }).trim();
}

function parseArgs(argv) {
  const args = {
    owner: process.env.TNF_HANDOFF_OWNER || 'tnf-orchestrator',
    targets: (process.env.TNF_HANDOFF_TARGETS || 'story-architect,librarian')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    priority: process.env.TNF_HANDOFF_PRIORITY || 'high',
    projectIds: (process.env.TNF_HANDOFF_PROJECT_IDS || 'TNF-SESSION')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    scope: process.env.TNF_HANDOFF_SCOPE || 'internal',
    summary: process.env.TNF_HANDOFF_SUMMARY
      ? process.env.TNF_HANDOFF_SUMMARY.split('||').map((item) => item.trim()).filter(Boolean)
      : [],
    nextActions: process.env.TNF_HANDOFF_NEXT_ACTIONS
      ? process.env.TNF_HANDOFF_NEXT_ACTIONS.split('||').map((item) => item.trim()).filter(Boolean)
      : [],
    resumeChecklist: process.env.TNF_HANDOFF_RESUME_CHECKLIST
      ? process.env.TNF_HANDOFF_RESUME_CHECKLIST.split('||').map((item) => item.trim()).filter(Boolean)
      : [],
    verificationNotes: process.env.TNF_HANDOFF_VERIFICATION_NOTES || '',
    verificationStates: {
      privacy_guard: process.env.TNF_HANDOFF_VERIFICATION_PRIVACY_GUARD || 'na',
      secret_sweep: process.env.TNF_HANDOFF_VERIFICATION_SECRET_SWEEP || 'na',
      docs_pii_guard: process.env.TNF_HANDOFF_VERIFICATION_DOCS_PII_GUARD || 'na',
      supabase_rls_audit: process.env.TNF_HANDOFF_VERIFICATION_SUPABASE_RLS_AUDIT || 'na',
    },
    autoVerify: /^(1|true|yes)$/i.test(process.env.TNF_HANDOFF_AUTO_VERIFY || ''),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--owner') args.owner = argv[++i] || args.owner;
    else if (token === '--targets') {
      args.targets = String(argv[++i] || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    } else if (token === '--priority') args.priority = argv[++i] || args.priority;
    else if (token === '--project-ids') {
      args.projectIds = String(argv[++i] || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    } else if (token === '--scope') args.scope = argv[++i] || args.scope;
    else if (token === '--summary') {
      args.summary = String(argv[++i] || '')
        .split('||')
        .map((item) => item.trim())
        .filter(Boolean);
    } else if (token === '--next-actions') {
      args.nextActions = String(argv[++i] || '')
        .split('||')
        .map((item) => item.trim())
        .filter(Boolean);
    } else if (token === '--resume-checklist') {
      args.resumeChecklist = String(argv[++i] || '')
        .split('||')
        .map((item) => item.trim())
        .filter(Boolean);
    } else if (token === '--auto-verify') args.autoVerify = true;
  }

  return args;
}

function touchesSupabasePaths(changedPaths) {
  return changedPaths.some((entry) => {
    const normalized = String(entry || '').replace(/\\/g, '/').toLowerCase();
    return (
      normalized.startsWith('supabase/') ||
      normalized.startsWith('apps/virtual-library-blueprints/supabase/') ||
      normalized.startsWith('apps/api/supabase/')
    );
  });
}

function runCheck(label, command, envOverrides) {
  try {
    run(command, {
      env: { ...process.env, ...(envOverrides || {}) },
    });
    return { state: 'pass', detail: `${label}=pass` };
  } catch (error) {
    const detail = error?.stderr ? String(error.stderr).trim() : String(error.message || error);
    return { state: 'fail', detail: `${label}=fail (${detail.split('\n').slice(-1)[0]})` };
  }
}

function computeVerification(input, changedPaths) {
  if (!input.autoVerify) {
    return {
      states: { ...input.verificationStates },
      notes: input.verificationNotes || '',
    };
  }

  const tempFile = path.join(
    os.tmpdir(),
    `tnf-handoff-files-${process.pid}-${crypto.randomUUID()}.txt`,
  );
  fs.writeFileSync(tempFile, `${changedPaths.join('\n')}\n`, 'utf8');

  const env = {
    PRIVACY_GUARD_FILE_LIST: tempFile,
    TNF_HANDOFF_FILE_LIST: tempFile,
  };
  const details = [];
  const states = { ...input.verificationStates };

  const privacyResult = runCheck('privacy_guard', 'node scripts/security/privacy-guard.cjs --mode=pre-push', env);
  states.privacy_guard = privacyResult.state;
  details.push(privacyResult.detail);

  const secretResult = runCheck('secret_sweep', 'node scripts/security/secret-sweep.cjs --mode=pre-push', env);
  states.secret_sweep = secretResult.state;
  details.push(secretResult.detail);

  const docsResult = runCheck('docs_pii_guard', 'node scripts/security/docs-pii-guard.cjs --mode=pre-push', env);
  states.docs_pii_guard = docsResult.state;
  details.push(docsResult.detail);

  if (touchesSupabasePaths(changedPaths)) {
    const supabaseResult = runCheck(
      'supabase_rls_audit',
      'node scripts/security/supabase-rls-audit.cjs --strict --baseline=scripts/security/supabase-rls-baseline.json',
      env,
    );
    states.supabase_rls_audit = supabaseResult.state;
    details.push(supabaseResult.detail);
  } else {
    states.supabase_rls_audit = 'na';
    details.push('supabase_rls_audit=na (no Supabase-sensitive path changes detected)');
  }

  fs.unlinkSync(tempFile);

  const failed = Object.entries(states)
    .filter(([, state]) => state === 'fail')
    .map(([name]) => name);
  const generatedNote = `Auto-verify ${new Date().toISOString()}: ${details.join('; ')}`;
  const notes = [generatedNote, input.verificationNotes || ''].filter(Boolean).join(' | ');

  if (failed.length) {
    throw new Error(`Auto verification failed for: ${failed.join(', ')}`);
  }

  return { states, notes };
}

function gatherChangedPaths() {
  const explicit = process.env.TNF_HANDOFF_FILE_LIST || process.env.PRIVACY_GUARD_FILE_LIST;
  if (explicit && fs.existsSync(explicit)) {
    const listed = fs
      .readFileSync(explicit, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/\\/g, '/'));
    return [...new Set(listed)];
  }

  const commands = [
    'git diff --cached --name-only --diff-filter=ACMR',
    'git diff --name-only --diff-filter=ACMR @{u}..HEAD',
    'git diff --name-only --diff-filter=ACMR',
    'git diff --name-only --diff-filter=ACMR HEAD~1..HEAD',
  ];

  for (const command of commands) {
    try {
      const out = run(command);
      if (!out) continue;
      const changed = out
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.replace(/\\/g, '/'));
      if (changed.length) return [...new Set(changed)];
    } catch {
      continue;
    }
  }

  try {
    const porcelain = run('git status --porcelain');
    const changed = porcelain
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^..\s+/, '').trim())
      .map((line) => line.replace(/\\/g, '/'))
      .filter(Boolean);
    return [...new Set(changed)];
  } catch {
    return [];
  }
}

function ensureDirFor(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function updateLedger(handoffId) {
  if (!fs.existsSync(ledgerPath)) {
    console.warn('[emit-session-handoff] AGENT_STATUS_LEDGER.md not found; skipping ledger update.');
    return;
  }

  const content = fs.readFileSync(ledgerPath, 'utf8');
  if (content.includes(handoffId)) return;
  const row = `| ${new Date().toISOString().slice(0, 10)} | Orchestrator | Published SESSION_HANDOFF_LATEST (${handoffId}) | ✅ HANDOFF_READY |`;
  const lines = content.split('\n');

  const headerPattern = /^\|\s*Date\s*\|\s*Agent\s*\|\s*Action\s*\|\s*Outcome\s*\|$/i;
  const alignPattern = /^\|\s*:?-{2,}.*\|$/;
  const headerIndex = lines.findIndex((line) => headerPattern.test(line.trim()));
  const alignIndex = lines.findIndex((line, index) => index > headerIndex && alignPattern.test(line.trim()));

  if (headerIndex !== -1 && alignIndex !== -1) {
    lines.splice(alignIndex + 1, 0, row);
    fs.writeFileSync(ledgerPath, `${lines.join('\n').replace(/\n+$/g, '\n')}`, 'utf8');
    return;
  }

  fs.writeFileSync(ledgerPath, `${content.trimEnd()}\n\n${row}\n`, 'utf8');
}

function main() {
  const input = parseArgs(process.argv.slice(2));
  const branch = run('git rev-parse --abbrev-ref HEAD');
  const headSha = run('git rev-parse HEAD');
  const repository = path.basename(repoRoot);
  const changedPaths = gatherChangedPaths();
  const handoffId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const summary = input.summary.length
    ? input.summary
    : [
        'Protocol enforcement layer implemented for mandatory session handoff continuity.',
        'CI/hook gates now block critical changes without fresh handoff artifacts.',
      ];

  const verification = computeVerification(input, changedPaths);

  const nextActions = input.nextActions.length
    ? input.nextActions
    : [
        'Continue priority queue from SESSION_HANDOFF_LATEST.json continuation.resume_checklist.',
        'Emit a fresh handoff artifact immediately after completing the next critical work unit.',
      ];

  const resumeChecklist = input.resumeChecklist.length
    ? input.resumeChecklist
    : [
        'Read docs/protocols/reports/SESSION_HANDOFF_LATEST.md',
        'Validate SESSION_HANDOFF_LATEST.json against docs/protocols/schemas/tnf-session-handoff.schema.json',
        'Execute listed next actions in order and preserve privacy/security gates',
      ];

  const handoffPayload = {
    spec: 'tnf/session-handoff/0.1',
    handoff_id: handoffId,
    created_at: createdAt,
    repository,
    branch,
    head_sha: headSha,
    protocol_ack: 'TNF_PROTOCOL_ACK',
    sensitive_scope: input.scope,
    project_ids: input.projectIds.length ? input.projectIds : ['TNF-SESSION'],
    work_summary: summary,
    changed_paths: changedPaths.length ? changedPaths : ['(no-diff-detected)'],
    verification: {
      privacy_guard: verification.states.privacy_guard,
      secret_sweep: verification.states.secret_sweep,
      docs_pii_guard: verification.states.docs_pii_guard,
      supabase_rls_audit: verification.states.supabase_rls_audit,
      notes: verification.notes,
    },
    continuation: {
      owner: input.owner,
      targets: input.targets.length ? input.targets : ['story-architect', 'librarian'],
      priority: input.priority,
      resume_checklist: resumeChecklist,
    },
    next_actions: nextActions,
    artifacts: {
      commits: [headSha],
    },
  };

  const markdown = `# SESSION_HANDOFF_LATEST

Protocol ACK: \`TNF_PROTOCOL_ACK\`  
Created At: \`${createdAt}\`  
Handoff ID: \`${handoffId}\`

## Scope
- Repository: \`${repository}\`
- Branch: \`${branch}\`
- Head SHA: \`${headSha}\`
- Sensitive Scope: \`${input.scope}\`

## Work Summary
${summary.map((line) => `- ${line}`).join('\n')}

## Changed Paths
${handoffPayload.changed_paths.map((line) => `- ${line}`).join('\n')}

## Verification
- privacy_guard: \`${handoffPayload.verification.privacy_guard}\`
- secret_sweep: \`${handoffPayload.verification.secret_sweep}\`
- docs_pii_guard: \`${handoffPayload.verification.docs_pii_guard}\`
- supabase_rls_audit: \`${handoffPayload.verification.supabase_rls_audit}\`

## Continuation
- Owner: \`${handoffPayload.continuation.owner}\`
- Targets: ${handoffPayload.continuation.targets.map((value) => `\`${value}\``).join(', ')}
- Priority: \`${handoffPayload.continuation.priority}\`

### Resume Checklist
${handoffPayload.continuation.resume_checklist.map((line) => `- ${line}`).join('\n')}

## Next Actions
${nextActions.map((line) => `- ${line}`).join('\n')}
`;

  ensureDirFor(handoffJsonPath);
  ensureDirFor(handoffMdPath);
  fs.writeFileSync(handoffJsonPath, `${JSON.stringify(handoffPayload, null, 2)}\n`, 'utf8');
  fs.writeFileSync(handoffMdPath, `${markdown.trimEnd()}\n`, 'utf8');
  updateLedger(handoffId);

  console.log(`[emit-session-handoff] wrote ${path.relative(repoRoot, handoffJsonPath)}`);
  console.log(`[emit-session-handoff] wrote ${path.relative(repoRoot, handoffMdPath)}`);
  console.log(`[emit-session-handoff] updated ${path.relative(repoRoot, ledgerPath)}`);
}

main();
