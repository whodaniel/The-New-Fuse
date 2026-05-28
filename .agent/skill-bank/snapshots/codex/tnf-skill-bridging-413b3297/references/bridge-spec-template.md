# Bridge Spec Template

name: <bridge-name>
from:
  - skill: <source-skill>
    output: <artifact-or-field>
to:
  - skill: <target-skill>
    input: <artifact-or-field>
validate:
  - <validation rule>
fail:
  - <fallback or escalation>
log:
  - <report path>
