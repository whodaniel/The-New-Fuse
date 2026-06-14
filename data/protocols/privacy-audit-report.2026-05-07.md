# Privacy Controls and Exposure Audit

Generated: 2026-05-07T20:54:59.041Z

## Supabase State
- RLS enabled on `story_sessions`, `timeline_events`, and `story_session_agent_access`: yes
- Session visibility row: daniel|private|sealed|active|3
- Email event scope row: daniel|private|sealed|2253

## Checkpoint 1 (Pre-Remediation Snapshot)
- trackedLedgerCount: 1
- trackedOriginalMasterDataCount: 1
- trackedAbsolutePathMatches: 3072
- trackedEmailMatches: 4037

## Checkpoint 2 (Post-Untracking Verification)
- trackedAgentCount: 0
- trackedSensitiveCount: 0
- trackedLedgerCount: 0
- trackedOriginalMasterDataCount: 0
- trackedAbsolutePathMatches: 1715
- trackedEmailMatches: 775

## Checkpoint 3 (Post-Targeted Remediation)
- trackedAgentCount: 0
- trackedSensitiveCount: 0
- ownerAbsolutePathMatches: 391
- personalEmailLiteralCount `bizsynth@gmail.com`: 92
- personalEmailLiteralCount `whodaniel@yahoo.com`: 5
- privacy-guard repo mode: pass
- secret-sweep repo mode: pass

## Status
- tracked-private-ledger: resolved_in_index
- tracked-master-data: resolved_in_index
- post-untracking-residual-risk: open
- post-targeted-remediation: open (residual literals remain outside guard scope)

## Applied Hardening
- Revoked `DELETE`, `TRUNCATE`, `TRIGGER`, `REFERENCES`, `MAINTAIN` from `anon` and `authenticated` on story tables.
- Post-hardening ACL state: `anon=arw`, `authenticated=arw` with RLS enabled.
- Removed high-risk ignored runtime/private directories from git tracking index and verified privacy guard enforcement.
