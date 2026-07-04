# TNF Agent Roster Cleanup Protocol

Status: ACTIVE Protocol ID: TNF_AGENT_ROSTER_CLEANUP_v1.0 Created: 2026-07-04

## Authority

- Canonical source: `docs/protocols/TNF_AGENT_ROSTER_CLEANUP.md`
- This protocol defines the procedure for identifying and archiving stale TNF
  agents

## Critical Observation (2026-07-04)

**Problem Identified:** Agent registry contains significant bloat:

- 50+ BROKER-Green agents registered across multiple dates (2026-06-20 through
  2026-06-29)
- Multiple DIRECTOR and BROKER instances with same role but different IDs
- Offline agents never pruned, accumulating over time
- Last cleanup before this session: unknown

**Impact:** Registry confusion, potential routing issues, degraded fleet health
visibility

## Cleanup Thresholds

| Agent Type        | Max Active | Action if Exceeded                |
| ----------------- | ---------- | --------------------------------- |
| BROKER-Green      | 3          | Archive oldest until at threshold |
| DIRECTOR          | 2          | Archive oldest if >2              |
| antigravity       | 3          | Archive oldest if >3              |
| Project-Planner   | 2          | Archive oldest if >2              |
| Any offline agent | 0          | Archive if >7 days since lastSeen |

## Archive Criteria

An agent should be **archived** (status → archived) if:

1. **Staleness**: `lastSeen` > 7 days ago
2. **Duplicate**: Same `name` + `role` + `platform` combination exists with more
   recent `lastSeen`
3. **Redundancy**: >N instances of same type (per thresholds above)

## Cleanup Procedure

### Phase 1: Identify Stale Agents

```bash
#!/bin/bash
# Find agents to archive
redis-cli HGETALL tnf:agent-registry | while read key value; do
    if [[ "$key" == agent_* ]]; then
        lastSeen=$(echo "$value" | jq -r '.lastSeen // empty')
        name=$(echo "$value" | jq -r '.name // empty')
        status=$(echo "$value" | jq -r '.status // empty')

        lastSeenSec=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${lastSeen%.*}" +%s 2>/dev/null || echo 0)
        nowSec=$(date +%s)
        ageDays=$(( (nowSec - lastSeenSec) / 86400 ))

        if [ "$status" = "offline" ] && [ "$ageDays" -gt 7 ]; then
            echo "STALE: $key ($name, offline $ageDays days)"
        fi
    fi
done
```

### Phase 2: Identify Duplicate Agent Types

```bash
# Count agents by type
redis-cli HGETALL tnf:agent-registry | grep -A20 '"name":"BROKER-Green"' | grep -c '"status":"active"'
# If > 3, identify oldest for archival
```

### Phase 3: Archive Execution

```bash
# Archive an agent (move to archived status, remove from active registry)
archive_agent() {
    local agent_key="$1"
    local reason="$2"
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)

    echo "Archiving $agent_key: $reason"

    # Get current data
    local agent_data=$(redis-cli HGET tnf:agent-registry "$agent_key")

    # Store in archive hash with reason
    echo "$agent_data" | jq --arg reason "$reason" --arg archived "$timestamp" \
        '. + {archivedAt: $archived, archiveReason: $reason}' | \
        redis-cli -x HSET tnf:agent-registry:archived "$agent_key"

    # Remove from main registry
    redis-cli HDEL tnf:agent-registry "$agent_key"

    echo "✅ $agent_key archived"
}
```

### Phase 4: Consolidate BROKER-Green Fleet

Current state shows 10+ BROKER-Green instances. Consolidation required:

1. Keep 3 most recent by `registeredAt`
2. Archive older duplicates

```bash
# List BROKER-Green by age, keep top 3
redis-cli HGETALL tnf:agent-registry | grep -B1 '"name":"BROKER-Green"' | \
    grep '"registeredAt"' | sort | tail -3 | head -1
```

## Cleanup Schedule

| Frequency | Scope               | Trigger       |
| --------- | ------------------- | ------------- |
| Daily     | Offline >7 days     | Auto via cron |
| Weekly    | All duplicates      | Manual review |
| Monthly   | Full registry audit | Scheduled     |

## Integration with Other Protocols

- **TNF_FLEET_HEALTH_PROBE**: Flags when >20% agents offline → triggers cleanup
  review
- **TURN_END_MANDATE**: If cleanup performed, document in handoff
- **TNF_SELF_HEALING**: Automated daily cleanup job

## Enforcement

This protocol is ENFORCED by:

1. Daily cron job `tnf-agent-roster-cleanup.cjs`
2. Fleet health probe alert threshold (20% offline)
3. Agent registration validation (rejects if same agent ID exists)

## Immediate Actions Required

1. Archive all BROKER-Green agents with `lastSeen` before 2026-06-25
2. Keep only 3 most recent BROKER-Green
3. Archive all agents with `status: offline` and `lastSeen` > 7 days ago
4. Document cleanup in LIVING_STATE
