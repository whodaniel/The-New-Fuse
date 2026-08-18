[CLASS:PROTOCOL] [STATUS:ACTIVE] [DOC_TYPE:sop] [DOMAIN:security]

# HARNESS_PERMISSION_BERM.md — Permissions Outside the Model

**Protocol ID:** TNF_HARNESS_PERMISSION_BERM  
**Version:** 1.0.0  
**Authority:** DIRECTIVES D1/D8/D9/D11/D16 + USER_CONFIRMATION_PROTOCOL + UNU
least-privilege tool governance

---

## 1. Doctrine

The model **proposes**; the berm **decides**. Approval / deny / sandbox
requirements must be enforced **outside** the model process via deterministic
policy (`data/harness/permission-policy.json`), not by asking the LLM to
remember the rules.

---

## 2. Decisions

| Decision               | Meaning                                        |
| ---------------------- | ---------------------------------------------- |
| `allow`                | Proceed; no special audit                      |
| `allow_with_audit`     | Proceed; write berm receipt                    |
| `require_confirmation` | Block until operator confirms (D1/D16 cases)   |
| `require_sandbox`      | Only proceed inside materialized sandbox (D11) |
| `deny`                 | Hard stop (e.g. D9 financial)                  |

---

## 3. Commands

```bash
node scripts/harness/permission-berm.cjs evaluate \
  --action-class git_push --target origin/main --json

node scripts/harness/permission-berm.cjs evaluate \
  --action-class untrusted_code_exec --json

# Materialize macOS seatbelt profile for sandboxed runs
node scripts/harness/materialize-sandbox-profile.cjs --out /tmp/tnf-sandbox.sb
```

Receipts: `data/harness/receipts/berm-*.json`

---

## 4. Integration points

- Agents/scripts SHOULD call `evaluate` before high-impact tools.
- `USER_CONFIRMATION_PROTOCOL` remains the human confirmation UX contract.
- `agent-self-edit-gate.cjs` remains the doc-ownership gate; berm covers
  action-class policy across tools.

Standing autonomy (D8) does **not** erase D9 or confirmation-class D1 actions.
