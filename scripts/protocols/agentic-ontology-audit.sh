#!/usr/bin/env bash
# TNF Ontology Auditor - Active Follow-Through Mandate implementation
# This script is meant to be run periodically (e.g., via cron or CI/CD) 
# to trigger an agentic review of the Ontology Master Map against the current codebase state.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TNF_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
MASTER_MAP="${TNF_ROOT}/docs/protocols/TNF_ONTOLOGY_MASTER_MAP.md"

echo "[Ontology Auditor] Initiating scan for classification drift..."

# 1. Extract all unique raw classifiers from protocol headers
echo "Extracting current markers..."
RAW_CLASSES=$(grep -orE "\[CLASS:[^]]+\]" "${TNF_ROOT}/docs/protocols" | cut -d':' -f2- | sort -u)
RAW_STATUSES=$(grep -orE "\[STATUS:[^]]+\]" "${TNF_ROOT}/docs/protocols" | cut -d':' -f2- | sort -u)
RAW_DOC_TYPES=$(grep -orE "\[DOC_TYPE:[^]]+\]" "${TNF_ROOT}/docs/protocols" | cut -d':' -f2- | sort -u)

# 2. Check if they exist in the master map
DRIFT_DETECTED=0
MISSING_TERMS=""

check_drift() {
    local term="$1"
    if ! grep -qF "$term" "$MASTER_MAP"; then
        echo "  ⚠️ Drift detected: Unmapped terminology '$term'"
        MISSING_TERMS="${MISSING_TERMS}\n- $term"
        DRIFT_DETECTED=1
    fi
}

echo "Checking Classifiers..."
for c in $RAW_CLASSES; do check_drift "$c"; done

echo "Checking Statuses..."
for s in $RAW_STATUSES; do check_drift "$s"; done

echo "Checking Doc Types..."
for d in $RAW_DOC_TYPES; do check_drift "$d"; done

# 3. Report or Trigger Agentic Loop
if [ $DRIFT_DETECTED -eq 1 ]; then
    echo -e "\n[!] ONTOLOGY DRIFT DETECTED."
    echo -e "The following active tags are not documented in TNF_ONTOLOGY_MASTER_MAP.md:"
    echo -e "$MISSING_TERMS"
    echo ""
    echo "Action Required: The swarm must execute a Follow-Through routine to integrate these new concepts or prune them if unauthorized."
    
    # In a full deployment, this would trigger an OpenClaw or OpenCode agent task.
    # e.g., tnf dispatch "Update TNF_ONTOLOGY_MASTER_MAP.md to include the following unmapped terms: $MISSING_TERMS"
    
    exit 1
else
    echo -e "\n[✓] Ontology Master Map is fully synced with active codebase classifiers."
    exit 0
fi
