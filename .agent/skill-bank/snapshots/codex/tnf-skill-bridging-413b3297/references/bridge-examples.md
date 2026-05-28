# Bridge Examples

## Link Audit -> Frontload
name: link-audit-to-frontload
from:
  - skill: tnf-stack-self-improvement-loop
    output: apps/frontend/docs/audits/all-links-audit.json
to:
  - skill: tnf-frontload-protocols
    input: ~/.tnf/handoff-current.json
validate:
  - audit file exists and brokenLinks == 0
fail:
  - escalate to diagnostics, regenerate audit
log:
  - ~/.tnf/bridge-reports/link-audit-to-frontload.md
