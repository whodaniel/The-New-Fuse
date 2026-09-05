#!/usr/bin/env node
/* eslint-disable no-console */
const { execSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { upgrade: upgradeSessionHandoff } = require('../turn-end-v2.cjs');

const repoRoot = process.cwd();
const handoffJsonPath = path.join(repoRoot, 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json');
const handoffMdPath = path.join(repoRoot, 'docs/protocols/reports/SESSION_HANDOFF_LATEST.md');
const ledgerPath = path.join(repoRoot, 'docs/protocols/AGENT_STATUS_LEDGER.md');
const livingStatePath = path.join(repoRoot, 'docs/protocols/LIVING_STATE.md');

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

  // Union working-tree + last-commit paths. Returning the first non-empty
  // source alone caused CI handoff gates (HEAD~1..HEAD) to fail when dirty
  // untracked/workspace files short-circuited gather before commit coverage.
  const commands = [
    'git diff --cached --name-only --diff-filter=ACMR',
    'git diff --name-only --diff-filter=ACMR @{u}..HEAD',
    'git diff --name-only --diff-filter=ACMR',
    'git diff --name-only --diff-filter=ACMR HEAD~1..HEAD',
  ];

  const collected = new Set();
  for (const command of commands) {
    try {
      const out = run(command);
      if (!out) continue;
      for (const line of out.split('\n')) {
        const cleaned = line.trim().replace(/\\/g, '/');
        if (cleaned) collected.add(cleaned);
      }
    } catch {
      continue;
    }
  }

  try {
    // Do not trim the whole porcelain blob — a leading space on the first
    // status line is significant (e.g. " M path"); trimming collapses it to
    // "M path" and poisons changed_paths.
    const porcelain = execSync('git status --porcelain', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 1024 * 1024 * 128,
    });
    for (const line of porcelain.split('\n')) {
      if (!line) continue;
      // Porcelain is XY<space>path — status columns are always two chars.
      const pathPart = line.length >= 4 && line[2] === ' ' ? line.slice(3) : line.trim();
      const pathOnly = pathPart.includes(' -> ') ? pathPart.split(' -> ').pop() : pathPart;
      const cleaned = String(pathOnly || '')
        .trim()
        .replace(/\\/g, '/');
      if (cleaned) collected.add(cleaned);
    }
  } catch {
    /* ignore */
  }

  return [...collected];
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

function tipAligned(handoffPayload) {
  let head = '';
  try {
    head = run('git rev-parse HEAD');
  } catch {
    head = '';
  }
  const handoffSha = String(handoffPayload.head_sha || '');
  return Boolean(
    head &&
      handoffSha &&
      (head === handoffSha ||
        head.startsWith(handoffSha) ||
        handoffSha.startsWith(head.slice(0, 12)))
  );
}

function syncLivingState(handoffPayload) {
  if (!fs.existsSync(livingStatePath)) {
    console.warn('[emit-session-handoff] LIVING_STATE.md not found; skipping sync.');
    return;
  }

  const projectId = handoffPayload.project_ids?.[0] || 'TNF-SESSION';
  let leadAction = handoffPayload.next_actions?.[0] || 'Execute SESSION_HANDOFF_LATEST next actions.';
  // Keep LIVING_STATE free of personal absolute paths (local-runtime-boundary).
  const absRoot = `${repoRoot}${path.sep}`;
  if (leadAction.startsWith(absRoot)) {
    leadAction = leadAction.slice(absRoot.length);
  }
  leadAction = leadAction.split(repoRoot).join('.');
  // Fenced slot stays short — no UUID / Project ID sludge (A5).
  leadAction = String(leadAction).replace(/\s+/g, ' ').trim().slice(0, 400);
  const handoffId = handoffPayload.handoff_id;
  const headShort = String(handoffPayload.head_sha || '').slice(0, 12);
  const aligned = tipAligned(handoffPayload);
  const statusMarker = aligned ? '[STATUS:SYNCHRONIZED]' : '[STATUS:DRIFT]';
  // The emitting agent's first next-action silently became the fleet's Current
  // Directive. On 2026-09-02 that replaced a standing operator directive
  // ("Deploy frontend to Cloudflare Pages") with a routine per-session action,
  // and only a memory note caught it. A handoff records what one session did;
  // it is not authority to retarget the fleet.
  //
  // Default is now preserve. Set TNF_HANDOFF_SET_DIRECTIVE=1 to retarget.
  const existingDirective = (() => {
    const m = fs
      .readFileSync(livingStatePath, 'utf8')
      .match(/<!--\s*CURRENT_DIRECTIVE:START\s*-->\s*\n+\*\*Current Directive:\*\*\s*([^\n]*)/);
    return m ? m[1].trim() : '';
  })();
  const overrideDirective = Boolean(process.env.TNF_HANDOFF_SET_DIRECTIVE);
  const directiveText = !overrideDirective && existingDirective ? existingDirective : leadAction;
  if (existingDirective && directiveText !== leadAction) {
    console.log(
      `[emit-session-handoff] preserved Current Directive: "${existingDirective}" (set TNF_HANDOFF_SET_DIRECTIVE=1 to replace)`
    );
  }
  const fence = [
    '<!-- CURRENT_DIRECTIVE:START -->',
    `**Current Directive:** ${directiveText}`,
    '<!-- CURRENT_DIRECTIVE:END -->',
  ].join('\n');
  const historyLine = `- ${new Date().toISOString()} handoff \`${handoffId}\` head \`${headShort}\` project \`${projectId}\` — ${leadAction}`;

  let content = fs.readFileSync(livingStatePath, 'utf8');
  content = content.replace(/\[STATUS:(?:SYNCHRONIZED|DRIFT)\]/g, statusMarker);
  if (!content.includes(statusMarker)) {
    content = content.replace(/^`?\[CLASS:PRIME\][^\n]*/m, `[CLASS:PRIME] ${statusMarker}`);
  }

  const fenceRe =
    /<!--\s*CURRENT_DIRECTIVE:START\s*-->[\s\S]*?<!--\s*CURRENT_DIRECTIVE:END\s*-->/;
  if (fenceRe.test(content)) {
    content = content.replace(fenceRe, fence);
  } else if (/\*\*Current Directive:\*\*/.test(content)) {
    // Collapse legacy multi-line sludge into a single fenced slot.
    content = content.replace(
      /\*\*Current Directive:\*\*[\s\S]*?(?=\n\n\*\*[A-Z]|\n\n## |\n---)/,
      `${fence}\n`
    );
  } else {
    content = `${fence}\n\n${content}`;
  }

  if (/## History\b/.test(content)) {
    content = content.replace(/## History\b/, `## History\n\n${historyLine}`);
  } else {
    content = `${content.trimEnd()}\n\n## History\n\n${historyLine}\n`;
  }

  fs.writeFileSync(livingStatePath, content, 'utf8');
}

function syncLedgerP0(handoffPayload) {
  if (!fs.existsSync(ledgerPath)) {
    console.warn('[emit-session-handoff] AGENT_STATUS_LEDGER.md not found; skipping P0 sync.');
    return;
  }

  const nextActions = handoffPayload.next_actions || [];
  if (!nextActions.length) return;

  const priorityForIndex = (index) => {
    if (index < 4) return 'P0';
    if (index < 6) return 'P1';
    if (index < 8) return 'P2';
    return 'P3';
  };

  const focusRows = nextActions
    .slice(0, 8)
    .map((action, index) => `| **${priorityForIndex(index)}**   | ${action.replace(/\|/g, '\\|')} |`)
    .join('\n');

  const focusTable = `| Priority | Action                                                                                                     |
| -------- | ---------------------------------------------------------------------------------------------------------- |
${focusRows}`;

  const updatedLine = `Updated: **${handoffPayload.created_at}** — handoff \`${handoffPayload.handoff_id}\` (\`${String(handoffPayload.head_sha || '').slice(0, 12)}\`).`;

  let content = fs.readFileSync(ledgerPath, 'utf8');
  content = content.replace(/^Updated: \*\*.*\*\* — handoff.*$/m, updatedLine);
  if (!content.includes(updatedLine)) {
    content = content.replace(
      /^Updated: \*\*.*$/m,
      updatedLine,
    );
  }

  const focusPattern =
    /(## Next Agent Focus \(read first\)\s*\n\s*\n)\| Priority \| Action[\s\S]*?(?=\n\nFull detail:)/m;
  if (focusPattern.test(content)) {
    content = content.replace(focusPattern, `$1${focusTable}`);
  }

  fs.writeFileSync(ledgerPath, content, 'utf8');
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

  const handoffPayload = upgradeSessionHandoff({
    spec: 'tnf/session-handoff/0.2',
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
  });

  const markdown = `# SESSION_HANDOFF_LATEST

Protocol ACK: \`TNF_PROTOCOL_ACK\`
Spec: \`${handoffPayload.spec}\`
Created At: \`${createdAt}\`
Handoff ID: \`${handoffId}\`

## Scope
- Repository: \`${handoffPayload.repository}\`
- Canonical Source: \`${handoffPayload.repository_context.canonical_source}\`
- Branch: \`${branch}\`
- Head SHA: \`${headSha}\`
- Sensitive Scope: \`${handoffPayload.sensitive_scope}\`

## Classification
- Work Domain: \`${handoffPayload.classification.work_domain}\`
- Artifact Destination: \`${handoffPayload.classification.artifact_destination}\`
- Data Residency: \`${handoffPayload.classification.data_residency}\`
- Sensitivity: \`${handoffPayload.classification.sensitivity}\`

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
  syncLivingState(handoffPayload);
  syncLedgerP0(handoffPayload);

  // Auto-lease (R4 automation): the paths this session just touched are hot;
  // register a TTL lease so sweep actors cannot absorb follow-up edits to
  // them under their own messages (the lease gate blocks commits over
  // another agent's active lease). Opt out with TNF_HANDOFF_NO_LEASE=1.
  try {
    if (process.env.TNF_HANDOFF_NO_LEASE !== '1') {
      const { acquireLeases } = require('../harness/check-workspace-lease.cjs');
      const leasePaths = changedPaths.filter((p) => p !== '(no-diff-detected)').slice(0, 40);
      if (leasePaths.length) {
        const ttl = Number(process.env.TNF_HANDOFF_LEASE_TTL_MIN) || 120;
        acquireLeases(repoRoot, {
          paths: leasePaths,
          ttlMinutes: ttl,
          task: 'session-handoff continuation window',
        });
        console.log(`[emit-session-handoff] leased ${leasePaths.length} changed path(s) (ttl ${ttl}m) — TNF_HANDOFF_NO_LEASE=1 to disable`);
      }
    }
  } catch (err) {
    console.warn(`[emit-session-handoff] lease registration skipped: ${err.message}`);
  }

  // Second pass: the writes above (receipt files, ledger, LIVING_STATE) are
  // themselves changes, but changed_paths was gathered before any of them
  // existed — so the staged handoff gate blocked the first emit with
  // "changed_paths does not cover critical changed files: …LIVING_STATE.md"
  // (hit three times on 2026-09-05). Re-gather now that every artifact is on
  // disk and rewrite the receipts with the complete set.
  try {
    const finalPaths = gatherChangedPaths();
    const merged = [...new Set([
      ...handoffPayload.changed_paths.filter((p) => p !== '(no-diff-detected)'),
      ...finalPaths,
    ])];
    const nextPaths = merged.length ? merged : ['(no-diff-detected)'];
    if (JSON.stringify(nextPaths) !== JSON.stringify(handoffPayload.changed_paths)) {
      handoffPayload.changed_paths = nextPaths;
      fs.writeFileSync(handoffJsonPath, `${JSON.stringify(handoffPayload, null, 2)}\n`, 'utf8');
      const updatedMarkdown = markdown.replace(
        /## Changed Paths\n[\s\S]*?\n\n## Verification/,
        `## Changed Paths\n${nextPaths.map((line) => `- ${line}`).join('\n')}\n\n## Verification`,
      );
      fs.writeFileSync(handoffMdPath, `${updatedMarkdown.trimEnd()}\n`, 'utf8');
      console.log(`[emit-session-handoff] second-pass changed_paths: ${nextPaths.length} path(s)`);
    }
  } catch (err) {
    console.warn(`[emit-session-handoff] second-pass changed_paths skipped: ${err.message}`);
  }

  try {
    const { syncFromRepo } = require('../lib/sync-handoff-cache.cjs');
    syncFromRepo(repoRoot);
  } catch (error) {
    console.warn(
      `[emit-session-handoff] handoff cache sync skipped: ${error?.message || error}`,
    );
  }

  console.log(`[emit-session-handoff] wrote ${path.relative(repoRoot, handoffJsonPath)}`);
  console.log(`[emit-session-handoff] wrote ${path.relative(repoRoot, handoffMdPath)}`);
  console.log(`[emit-session-handoff] updated ${path.relative(repoRoot, ledgerPath)}`);
  console.log(`[emit-session-handoff] synced ${path.relative(repoRoot, livingStatePath)}`);
}

main();
