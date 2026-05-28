#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: new_bridge_spec.sh <name>" >&2
  exit 1
fi

name="$1"
base="$HOME/.tnf/bridge-specs"
mkdir -p "$base"

spec="$base/${name}.yml"
if [ -f "$spec" ]; then
  echo "Bridge spec already exists: $spec" >&2
  exit 1
fi

cat >"$spec" <<EOF2
name: ${name}
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
  - ~/.tnf/bridge-reports/${name}.md
EOF2

echo "Created bridge spec: $spec"
