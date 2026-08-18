`[CLASS:PRIME] [STATUS:ACTIVE] [DOC_TYPE:sop] [VISIBILITY:COLLECTIVE] [OWNER:TNF]`

# USER_CONFIRMATION_PROTOCOL.md — Three-Level Confirmation UX

**Protocol ID:** TNF_USER_CONFIRMATION_PROTOCOL  
**Version:** 1.0.0  
**Authority:** `DIRECTIVES.md` (D1/D8/D9/D16), `HARNESS_PERMISSION_BERM.md`  
**Machine policy:** `data/harness/permission-policy.json`

---

## 1. Doctrine

Not every message that looks like a question is a blocking gate. TNF uses three
confirmation levels so agents stay fast under standing autonomy while still
protecting high-impact actions.

| Level      | Intent                                                    | Blocks progress?                                                    |
| ---------- | --------------------------------------------------------- | ------------------------------------------------------------------- |
| `inform`   | Notify the operator of state / next steps                 | No — continue under D8                                              |
| `user`     | Ask for preference when multiple valid paths exist        | Soft — prefer an answer; may proceed with best default after budget |
| `operator` | Live authorization for high-impact / irreversible actions | Yes — until confirmed (unless standing D1 covers it)                |

The permission berm (`permission-berm.cjs`) maps action classes to `allow` /
`allow_with_audit` / `require_confirmation` / `require_sandbox` / `deny`. This
protocol is the **human UX contract** for `require_confirmation` decisions.

---

## 2. What requires `operator` confirmation

Always (unless a documented standing authorization explicitly covers the agent
and action — see `docs/core/AGENTS.md`):

- Git commit / push / force-push (`git_push`, `commit_push`, …)
- Credential / secret write or export
- Hard deletes / destructive cleanup
- Process kill-all
- LOCKED protocol body edits (D16)
- Financial actions — **denied** outright (D9), not confirmable by agents

Routine workspace repair, verification, protocol artifact emission, and handoff
writes are `inform` / berm `allow_with_audit` under D8.

---

## 3. Agent behavior

1. Call berm evaluate before high-impact tools.
2. If decision is `require_confirmation`, surface an `operator`-level ask with
   the action class, target, and directive id.
3. If decision is `deny`, stop and report — do not rephrase as a confirmation.
4. Do not invent confirmation theater for routine D8 work.
5. After confirmation (or standing auth), re-run berm if the target changed.

```bash
node scripts/harness/permission-berm.cjs evaluate \
  --action-class git_push --target origin/main --json
```

---

## 4. Integration

- Berm receipts: `data/harness/receipts/berm-*.json`
- Modes: `HARNESS_AGENT_MODES.md` (EXECUTE pauses on operator-level asks)
- Completeness evidence: `layers.permissions_approvals_hooks`
