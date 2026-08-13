/**
 * Action receipts + failure escalation for TNF CLI.
 *
 * Inspect → Act → Verify: every consequential child process should leave an
 * empirical receipt. Two identical consecutive failures escalate to a halt
 * file that blocks further mutating work until cleared.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export type ActionReceipt = {
  schema: 'tnf/action-receipt/0.1';
  id: string;
  ts: string;
  intent: string;
  cmd: string;
  args: string[];
  cwd: string;
  ok: boolean;
  durationMs: number;
  error?: string;
  inputsHash: string;
};

export type EscalationState = {
  schema: 'tnf/escalation/0.1';
  updatedAt: string;
  lastFailureKey?: string;
  consecutiveIdenticalFailures: number;
  halted: boolean;
  haltReason?: string;
  lastReceiptId?: string;
};

const RECEIPT_LOG = 'docs/operations/tnf-action-receipts.jsonl';
const ESCALATION_STATE = 'docs/operations/tnf-escalation-state.json';
const HALT_STREAK = 2;

function isTruthy(value: string | undefined): boolean {
  if (value == null) return false;
  const v = String(value).trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

function abs(repoRoot: string, rel: string): string {
  return path.join(repoRoot, rel);
}

function ensureOpsDir(repoRoot: string): void {
  fs.mkdirSync(abs(repoRoot, 'docs/operations'), { recursive: true });
}

export function hashInputs(cmd: string, args: string[]): string {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify({ cmd, args }))
    .digest('hex')
    .slice(0, 16);
}

export function failureKey(cmd: string, args: string[], error: string): string {
  const normalized = error.replace(/\d{4,}/g, '#').slice(0, 160);
  return crypto
    .createHash('sha256')
    .update(`${cmd}|${args.join(' ')}|${normalized}`)
    .digest('hex')
    .slice(0, 24);
}

export function readEscalationState(repoRoot: string): EscalationState {
  const p = abs(repoRoot, ESCALATION_STATE);
  if (!fs.existsSync(p)) {
    return {
      schema: 'tnf/escalation/0.1',
      updatedAt: new Date().toISOString(),
      consecutiveIdenticalFailures: 0,
      halted: false,
    };
  }
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')) as EscalationState;
  } catch {
    return {
      schema: 'tnf/escalation/0.1',
      updatedAt: new Date().toISOString(),
      consecutiveIdenticalFailures: 0,
      halted: false,
    };
  }
}

export function writeEscalationState(repoRoot: string, state: EscalationState): void {
  ensureOpsDir(repoRoot);
  fs.writeFileSync(abs(repoRoot, ESCALATION_STATE), `${JSON.stringify(state, null, 2)}\n`);
}

export function clearEscalationHalt(
  repoRoot: string,
  reason = 'operator cleared'
): EscalationState {
  const next: EscalationState = {
    schema: 'tnf/escalation/0.1',
    updatedAt: new Date().toISOString(),
    consecutiveIdenticalFailures: 0,
    halted: false,
    haltReason: undefined,
    lastFailureKey: undefined,
    lastReceiptId: reason,
  };
  writeEscalationState(repoRoot, next);
  return next;
}

export function assertNotEscalationHalted(repoRoot: string): void {
  if (isTruthy(process.env.TNF_SKIP_ESCALATION_HALT)) return;
  const state = readEscalationState(repoRoot);
  if (state.halted) {
    throw new Error(
      `TNF escalation halt active: ${state.haltReason || 'repeated identical failures'}. ` +
        `Remediate, then: node scripts/protocols/validate-substrate-attestation.cjs --clear-escalation ` +
        `(or set TNF_SKIP_ESCALATION_HALT=1 for explicit HITL override).`
    );
  }
}

export function appendActionReceipt(repoRoot: string, receipt: ActionReceipt): void {
  if (isTruthy(process.env.TNF_SKIP_ACTION_RECEIPTS)) return;
  ensureOpsDir(repoRoot);
  fs.appendFileSync(abs(repoRoot, RECEIPT_LOG), `${JSON.stringify(receipt)}\n`);
}

export function recordCommandOutcome(
  repoRoot: string,
  input: {
    intent: string;
    cmd: string;
    args: string[];
    cwd: string;
    ok: boolean;
    durationMs: number;
    error?: string;
  }
): ActionReceipt {
  const receipt: ActionReceipt = {
    schema: 'tnf/action-receipt/0.1',
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    intent: input.intent,
    cmd: input.cmd,
    args: input.args,
    cwd: input.cwd,
    ok: input.ok,
    durationMs: input.durationMs,
    error: input.error,
    inputsHash: hashInputs(input.cmd, input.args),
  };
  appendActionReceipt(repoRoot, receipt);

  const prev = readEscalationState(repoRoot);
  if (input.ok) {
    writeEscalationState(repoRoot, {
      schema: 'tnf/escalation/0.1',
      updatedAt: receipt.ts,
      consecutiveIdenticalFailures: 0,
      halted: false,
      lastReceiptId: receipt.id,
      lastFailureKey: undefined,
    });
    return receipt;
  }

  const key = failureKey(input.cmd, input.args, input.error || 'unknown');
  const streak = prev.lastFailureKey === key ? prev.consecutiveIdenticalFailures + 1 : 1;
  const halted = streak >= HALT_STREAK;
  writeEscalationState(repoRoot, {
    schema: 'tnf/escalation/0.1',
    updatedAt: receipt.ts,
    lastFailureKey: key,
    consecutiveIdenticalFailures: streak,
    halted,
    haltReason: halted ? `${streak} identical failures for ${input.cmd} (${key})` : undefined,
    lastReceiptId: receipt.id,
  });
  return receipt;
}
