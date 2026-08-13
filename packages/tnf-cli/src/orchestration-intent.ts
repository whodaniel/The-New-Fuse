/** A2 — REPORT_ONLY classifier (audit/synthesis goals must not mutate). */

export const REPORT_ONLY_GOAL_RE =
  /\b(audit|report-only|report only|synthesis|what makes sense|full enchilada)\b/i;
export const REPORT_ONLY_MUTATE_EXPLICIT_RE =
  /\b(implement|fix\s+now|execute-safe-refactors|mutate)\b/i;

export function classifyOrchestrateIntent(goal: string): {
  intent: 'REPORT_ONLY' | 'MUTATE_ALLOWED';
  reason: string;
} {
  const allowMutateOnAudit = ['1', 'true', 'yes', 'on'].includes(
    String(process.env.TNF_ORCHESTRATE_ALLOW_MUTATE_ON_AUDIT || '')
      .trim()
      .toLowerCase()
  );
  if (REPORT_ONLY_GOAL_RE.test(goal) && !allowMutateOnAudit) {
    if (REPORT_ONLY_MUTATE_EXPLICIT_RE.test(goal)) {
      return {
        intent: 'MUTATE_ALLOWED',
        reason: 'audit-like goal but explicit implement/fix-now override',
      };
    }
    return { intent: 'REPORT_ONLY', reason: 'matched REPORT_ONLY goal classifier' };
  }
  return { intent: 'MUTATE_ALLOWED', reason: 'default mutate-capable orchestrate path' };
}

export function extractReportOutputPath(goal: string): string | null {
  const m =
    goal.match(/\b(?:write|create|emit|save)\s+([^\s]+\.(?:md|json|txt))\b/i) ||
    goal.match(/\b((?:docs|~\/\.tnf)\/[^\s]+\.(?:md|json|txt))\b/i);
  return m ? m[1] : null;
}
