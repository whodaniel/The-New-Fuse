#!/usr/bin/env bash
# Wire NeuralWatt Cloud (GLM-5.2) into ~/.tnf and ~/.hermes.
# Usage: NEURALWATT_API_KEY=sk-... ./scripts/llm-intel/add-neuralwatt-provider.sh

set -euo pipefail

if [[ -z "${NEURALWATT_API_KEY:-}" ]]; then
  echo "Set NEURALWATT_API_KEY first (get/rotate at https://portal.neuralwatt.com)." >&2
  exit 1
fi

export NEURALWATT_API_BASE="${NEURALWATT_API_BASE:-https://api.neuralwatt.com/v1}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

python3 <<'PY'
import json, os
from pathlib import Path

entry = {
    "id": "neuralwatt-glm-52",
    "name": "GLM-5.2 via NeuralWatt Cloud",
    "model": "glm-5.2",
    "priority": 2,
    "endpoint": os.environ["NEURALWATT_API_BASE"],
    "envKey": "NEURALWATT_API_KEY",
    "reasoningEffort": "high",
    "reliabilityTarget": 0.9,
    "maxLatencyMs": 30000,
    "costPerMtokens": 0.0045,
    "note": "NeuralWatt GLM-5.2 full with reasoning_effort=high (first non-NVIDIA backup).",
    "active": True,
}
tnf = Path.home() / ".tnf"
mp_path = tnf / "model-providers.json"
mp = json.loads(mp_path.read_text())
providers = [p for p in mp.get("providers", []) if p.get("id") != entry["id"]]
providers.insert(2, entry)
mp["providers"] = providers
mp_path.write_text(json.dumps(mp, indent=2) + "\n")

cp_path = tnf / "custom-providers.json"
custom = json.loads(cp_path.read_text())
nw = {
    "id": "neuralwatt",
    "name": "NeuralWatt Cloud",
    "models": ["glm-5.2", "glm-5.2-fast", "glm-5.2-short", "glm-5.2-short-fast"],
    "endpoint": os.environ["NEURALWATT_API_BASE"],
    "supportsStreaming": True,
    "capabilities": ["chat", "completion", "reasoning"],
}
custom = [p for p in custom if p.get("id") != "neuralwatt"] + [nw]
cp_path.write_text(json.dumps(custom, indent=2) + "\n")
print("Updated ~/.tnf provider catalogs")

# provider-config: NVIDIA primary, NeuralWatt first fallback
pc_path = tnf / "provider-config.json"
if pc_path.exists():
    pc = json.loads(pc_path.read_text())
    pc["primaryModelId"] = "nvidia/mistralai/mistral-small-4-119b-2603"
    fb = pc.get("fallbackModelIds", [])
    fb = [x for x in fb if x != "neuralwatt/glm-5.2"]
    nvidia = [x for x in fb if x.startswith("nvidia/")]
    other = [x for x in fb if not x.startswith("nvidia/") and not x.startswith("opencode/")]
    opencode = [x for x in fb if x.startswith("opencode/")]
    pc["fallbackModelIds"] = ["neuralwatt/glm-5.2"] + nvidia + other + opencode
    pc_path.write_text(json.dumps(pc, indent=2) + "\n")
    print("Updated ~/.tnf/provider-config.json (NVIDIA primary, NeuralWatt 1st fallback)")
PY

for ENV_FILE in "$ROOT/.tnf.local.env" "$HOME/.hermes/.env"; do
  touch "$ENV_FILE"
  grep -v '^NEURALWATT_' "$ENV_FILE" > "${ENV_FILE}.tmp" || true
  mv "${ENV_FILE}.tmp" "$ENV_FILE"
  cat >> "$ENV_FILE" <<EOF

# NeuralWatt Cloud (GLM-5.2)
NEURALWATT_API_KEY=${NEURALWATT_API_KEY}
NEURALWATT_API_BASE=${NEURALWATT_API_BASE}
NEURALWATT_DEFAULT_MODEL=glm-5.2
NEURALWATT_REASONING_EFFORT=high
EOF
done

python3 <<'PY'
import re
from pathlib import Path
cfg_path = Path.home() / ".hermes/config.yaml"
text = cfg_path.read_text()
block = """custom_providers:
- name: NeuralWatt
  base_url: ${NEURALWATT_API_BASE}
  api_key: ${NEURALWATT_API_KEY}
  model: glm-5.2
  extra_body:
    reasoning_effort: high
  models:
  - glm-5.2
  - glm-5.2-fast
  - glm-5.2-short
  - glm-5.2-short-fast
"""
if "custom_providers:" not in text:
    cfg_path.write_text(text.rstrip() + "\n\n" + block)
    print("Added Hermes custom_providers")
else:
    print("Hermes custom_providers already present")

text = cfg_path.read_text()
nw_fb = """- provider: NeuralWatt
  model: glm-5.2
  extra_body:
    reasoning_effort: high
"""
if "provider: NeuralWatt" not in text:
    if "fallback_providers:" in text:
        text = text.replace("fallback_providers:\n", "fallback_providers:\n" + nw_fb, 1)
        cfg_path.write_text(text)
        print("Inserted NeuralWatt as first Hermes fallback")
else:
    text = re.sub(
        r"- provider: NeuralWatt\n  model: glm-5\.2-fast\n",
        nw_fb,
        text,
        count=1,
    )
    if "reasoning_effort: high" not in text:
        text = text.replace(
            "- provider: NeuralWatt\n  model: glm-5.2\n",
            nw_fb,
            1,
        )
    cfg_path.write_text(text)
    print("Updated Hermes NeuralWatt fallback to glm-5.2 + reasoning_effort high")
PY

curl -fsS -m 15 "${NEURALWATT_API_BASE}/models" \
  -H "Authorization: Bearer ${NEURALWATT_API_KEY}" >/dev/null
echo "NeuralWatt API key verified."
