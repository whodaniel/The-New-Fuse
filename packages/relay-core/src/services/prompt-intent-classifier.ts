/**
 * Prompt-Intent Classifier — Loop 1 of the prompt-ingestion methodology.
 *
 * Authority:
 *   - docs/agent_prompts/methodology/methodology.md
 *   - .agent/ROLE_DEFINITIONS.md (DACC-v1 vocabulary)
 *   - docs/protocols/reports/FEDERATION_ID_HEARTBEAT_STALL_AUDIT_2026-06-20.md
 *
 * Class shape (single source of truth — TS enum kept narrow):
 *
 *   DIRECTIVE   — Director / chair-substitute tactical authority
 *   GOVERNANCE  — Cron governance + self-edit owner-keyed approval surface
 *   USER        — Open human prompts (terminal / IDE / browser / MCP)
 *   AGENT       — Worker agent (must carry signing + canonical id + idNumber)
 *   RELAY       — Relay itself (heartbeat / recovery / queue control)
 *   ECHO        — AI domain echo (model reply in a federated channel)
 *   UNKNOWN     — Pre-classification; downstream must quarantine
 *
 * The classifier is deterministic. No chain-of-thought. No LLM call.
 * Per engineering principle "Don't Let Models Reason When Classification
 * Suffices" — classification must be a lookup, not a justification.
 */

export type IntentClass =
  | 'DIRECTIVE'
  | 'GOVERNANCE'
  | 'USER'
  | 'AGENT'
  | 'RELAY'
  | 'ECHO'
  | 'UNKNOWN';

/**
 * Normalise a free-form `role` (or `from`/`requestFrom`) string into the
 * canonical class table. The function never throws; `UNKNOWN` is a signal,
 * not an error.
 */
export function classifyIntent(input: {
  role?: string | null;
  from?: string | null;
  to?: string | null;
  content?: string | null;
  metadata?: Record<string, unknown> | null;
}): IntentClass {
  const role = (input.role || '').toLowerCase();
  const from = (input.from || '').toLowerCase();
  const to = (input.to || '').toLowerCase();
  const meta = input.metadata || {};
  const mcid =
    meta.mcid && typeof meta.mcid === 'object' ? (meta.mcid as Record<string, unknown>) : null;
  const fromSelfEcho = Boolean(mcid?.causation_id);

  // DIRECTIVE — director + chair-substitute. The relay knows the director
  // by operational handle (DIRECTOR-001) or substitute name.
  if (role === 'director' || from.startsWith('director-')) return 'DIRECTIVE';

  // GOVERNANCE — cron governance, self-edit governance, bridge operator.
  // Authority: docs/protocols/reports/cron-governance-review-2026-03-18.md
  if (
    role === 'governance' ||
    role === 'cron_governance' ||
    role === 'self_edit_governance' ||
    from === 'relay-admin-http' ||
    from === 'cron-governance-gate'
  ) {
    return 'GOVERNANCE';
  }

  // RELAY — the relay itself emits heartbeats, recovery, registry events.
  // Authority: methodology §5.1 / 5.5 — relay never speaks as USER.
  if (
    role === 'relay' ||
    role === 'system' ||
    from === 'stall-detector' ||
    from === 'master-clock' ||
    from === 'relay-admin-http' ||
    (meta.isSystemMessage === true && meta.isRecoveryAttempt === true)
  ) {
    return 'RELAY';
  }

  // ECHO — model reply in a federated channel. Detection comes from a
  // non-empty causation_id mcid pointer (an echo always traces another
  // frame). authority: §5.5.
  if (
    role === 'echo' ||
    (fromSelfEcho && Boolean(input.content)) ||
    (from.startsWith('ai-') && fromSelfEcho)
  ) {
    return 'ECHO';
  }

  // AGENT — worker agent. Must carry signing + role + ID lineage.
  if (
    role === 'agent' ||
    role === 'worker' ||
    from.startsWith('agent-') ||
    from.startsWith('[agent-') ||
    /^brok/i.test(from) // broker is a DACC role too; treat as AGENT class
  ) {
    return 'AGENT';
  }

  // USER — anything else with content is treated as a user-issued prompt.
  // We do not infer on `to: 'broadcast'` (that classification lives downstream
  // of the committee quorum decision).
  if (input.content && input.content.length > 0) return 'USER';

  return 'UNKNOWN';
}

/**
 * Convenience helper. Same surface as classifyIntent but returns an explicit
 * quarantine-tagged record. Useful where the caller wants the audit hint
 * alongside the class.
 */
export interface ClassifiedIntent {
  class: IntentClass;
  reason: string;
  committeeReviewRequired: boolean;
}

export function classifyWithReason(input: {
  role?: string | null;
  from?: string | null;
  to?: string | null;
  content?: string | null;
  metadata?: Record<string, unknown> | null;
}): ClassifiedIntent {
  const klass = classifyIntent(input);
  const committeeReviewRequired =
    klass === 'USER' || klass === 'GOVERNANCE' || klass === 'DIRECTIVE';
  const reason =
    klass === 'UNKNOWN' ? 'no_class_signal_role_unset' : `class=${klass.toLowerCase()}`;
  return { class: klass, reason, committeeReviewRequired };
}
