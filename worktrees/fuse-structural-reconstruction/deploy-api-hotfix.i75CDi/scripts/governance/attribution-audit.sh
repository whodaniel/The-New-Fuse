#!/usr/bin/env bash
# ==============================================================================
# TNF ATTRIBUTION AUDIT (v1.0)
# Sponsored by: The Unitary Director
# Discipline: Strict Attribution (Section 9 of the Almanac)
# ==============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ALMANAC_JSON="${ROOT_DIR}/.agent/ALMANAC.json"
LOG_DIR="${ROOT_DIR}/.agent/runtime-logs"
REPORTS_DIR="${ROOT_DIR}/.agent/governance-reports"

mkdir -p "${REPORTS_DIR}"

echo "⚖️ [Unitary Director] Initiating Strict Attribution Audit..."

# 1. Verify Almanac Alignment
if [[ ! -f "${ALMANAC_JSON}" ]]; then
    echo "❌ CRITICAL: Almanac missing. Audit aborted."
    exit 1
fi

# 2. Scan recent agent telemetry for citation markers
# Agents are mandated to use markers like [Source: ...], [Attribution: ...], or [Lineage: ...]
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="${REPORTS_DIR}/attribution_audit_${TIMESTAMP}.md"

echo "# TNF Attribution Audit Report - ${TIMESTAMP}" > "${REPORT_FILE}"
echo "## Status: ACTIVE" >> "${REPORT_FILE}"
echo "" >> "${REPORT_FILE}"

AUDIT_FAILURES=0

# Scan .jsonl logs for agents that didn't provide attribution
# We look for reasoning blocks that lack 'Source:' or 'Attribution:'
for log_file in "${LOG_DIR}"/*.jsonl; do
    if [[ ! -f "$log_file" ]]; then continue; fi
    
    AGENT_NAME=$(basename "$log_file" .jsonl)
    echo "Auditing Agent: ${AGENT_NAME}"
    
    # Heuristic: Find content blocks and check for citation patterns
    # (Simplified for shell; Unitary Director would use regex matching in a real agent turn)
    MISSING_CITATIONS=$(grep -vE "Source:|Attribution:|Lineage:|Provance:" "$log_file" | grep "content" | wc -l || true)
    
    if [[ ${MISSING_CITATIONS} -gt 0 ]]; then
        echo "⚠️  [Overrule] Agent '${AGENT_NAME}' produced ${MISSING_CITATIONS} blocks without strict attribution." >> "${REPORT_FILE}"
        echo "- Location: ${log_file}" >> "${REPORT_FILE}"
        ((AUDIT_FAILURES++))
    fi
done

if [[ ${AUDIT_FAILURES} -eq 0 ]]; then
    echo "✅ PASS: All active agents are maintaining the Strict Attribution discipline." >> "${REPORT_FILE}"
    echo "Audit Result: PASS"
else
    echo "❌ FAIL: ${AUDIT_FAILURES} agents failed the Attribution Cornerstone check." >> "${REPORT_FILE}"
    echo "Audit Result: FAIL (Overrule Triggered)"
fi

echo "" >> "${REPORT_FILE}"
echo "### Directives for Failed Agents:" >> "${REPORT_FILE}"
echo "1. Re-read Section 8 & 9 of the Almanac." >> "${REPORT_FILE}"
echo "2. Re-trace reasoning to human/scientific source." >> "${REPORT_FILE}"
echo "3. Resubmit with [Source: ...] metadata." >> "${REPORT_FILE}"

echo "⚖️ Audit Complete. Report: ${REPORT_FILE}"
