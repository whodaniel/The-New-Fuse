# TNF Infrastructure Hardening Plan

**Document Type:** Technical Specification  
**Created:** 2026-03-18  
**Status:** In Progress  
**Priority:** Critical

---

## Executive Summary

QA diagnostics revealed critical infrastructure weaknesses in the TNF handoff
system:

- **Data integrity failures**: Matrix entries stale despite current index
- **Sync degradation**: 558.6 hours drift, silent failures
- **Stale caching**: handoff-current.json 7 days out of date

This plan establishes hardened infrastructure to prevent recurrence.

---

## Root Cause Analysis

| Symptom                                                                      | Root Cause                                             | Impact                     |
| ---------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------- |
| Matrix entries stale (2026-03-10) while latestBySession current (2026-03-18) | Update logic writes index but fails to persist entries | Inconsistent handoff state |
| handoff-current.json 7 days old                                              | No auto-regeneration trigger on session start          | Stale context propagation  |
| 558.6 hour cloud drift                                                       | Fire-and-forget sync, no retry or failure handling     | Multi-instance desync      |
| Silent sync failures                                                         | No error propagation or alerting                       | Undetected degradation     |

---

## Strategic Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    HARDENED INFRASTRUCTURE                   │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: Data Integrity                                      │
│  ├─ Atomic persistence with rollback                        │
│  ├─ Schema validation on read/write                           │
│  ├─ Automatic consistency repair                              │
│  └─ Checksum verification                                       │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: Sync Resilience                                       │
│  ├─ Circuit breaker pattern                                    │
│  ├─ Exponential backoff retry                                  │
│  ├─ Persistent failure queue                                   │
│  └─ Automatic drift detection & repair                          │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: Routine Automation                                    │
│  ├─ Health check daemon (5min intervals)                       │
│  ├─ Checkpoint/rollback system                                │
│  ├─ Self-healing triggers                                      │
│  └─ Maintenance cron with validation                          │
├─────────────────────────────────────────────────────────────┤
│  Layer 4: Observability                                         │
│  ├─ Structured metrics export                                   │
│  ├─ Health endpoint (/health/*)                              │
│  ├─ Alert thresholds & notifications                        │
│  └─ Pre-flight validation                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Tasks

### Phase 1: Data Integrity (Critical - Week 1)

#### Task 1.1: Atomic Matrix Persistence Gate

**Status:** 🔴 Not Started  
**Owner:** Infrastructure  
**Effort:** 2 days

```typescript
// matrix-persistence-gate.ts
interface MatrixTransaction {
  id: string;
  timestamp: ISOString;
  operations: MatrixOperation[];
  rollbackData?: MatrixSnapshot;
}

class MatrixPersistenceGate {
  async update(transaction: MatrixTransaction): Promise<void> {
    // 1. Validate current state
    // 2. Create rollback snapshot
    // 3. Write to temp file
    // 4. Atomic rename
    // 5. Verify checksum
    // 6. Clean up temp/backup
  }

  async load(): Promise<Matrix> {
    // 1. Read with checksum verify
    // 2. Schema validation
    // 3. Consistency check
    // 4. Auto-repair if needed
  }
}
```

**Requirements:**

- [ ] Temp file + atomic rename pattern
- [ ] JSON schema validation (zod or ajv)
- [ ] SHA256 checksum verification
- [ ] Automatic backup (matrix.json.bak)
- [ ] Rollback capability on failure
- [ ] Consistency validation (entries ↔ latestBySession)

**Acceptance Criteria:**

- Power failure during write cannot corrupt matrix
- Invalid JSON auto-repairs from backup
- Mismatched entries/latestBySession detected and fixed

---

#### Task 1.2: Matrix Entry Gap Repair

**Status:** 🔴 Not Started  
**Owner:** Infrastructure  
**Effort:** 1 day

**Problem:** Current matrix.json has current `latestBySession` (2026-03-18) but
stale `entries` (2026-03-10).

**Solution:**

```javascript
// matrix-repair-tool.js
async function repairMatrixGaps() {
  const matrix = await loadMatrix();
  const missingEntries = [];

  // Find entries referenced in latestBySession but missing from entries
  for (const [sessionKey, latestId] of Object.entries(matrix.latestBySession)) {
    if (!matrix.entries[latestId]) {
      // Reconstruct from handoff file
      const handoffPath = await findHandoffFile(latestId);
      const entry = await parseHandoffToEntry(handoffPath);
      missingEntries.push({ id: latestId, entry });
    }
  }

  // Atomic batch insert
  await matrixGate.update({
    operations: missingEntries.map((e) => ({
      type: 'INSERT_ENTRY',
      data: e,
    })),
  });
}
```

**Acceptance Criteria:**

- All latestBySession entries exist in entries map
- No data loss during repair
- Repair idempotent (safe to run multiple times)

---

### Phase 2: Sync Resilience (Critical - Week 1-2)

#### Task 2.1: Sync Resilience Controller

**Status:** 🔴 Not Started  
**Owner:** Infrastructure  
**Effort:** 3 days

```javascript
// sync-resilience-controller.js
class SyncResilienceController {
  constructor() {
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeoutMs: 60000,
      halfOpenMaxCalls: 3,
    });

    this.retryQueue = new PersistentQueue('sync-failures.sqlite');
    this.metrics = new SyncMetrics();
  }

  async sync(handoffPacket) {
    if (this.circuitBreaker.isOpen()) {
      await this.queueForRetry(handoffPacket);
      throw new CircuitOpenError('Sync circuit open, queued for retry');
    }

    try {
      const result = await this.executeWithRetry(handoffPacket);
      this.circuitBreaker.recordSuccess();
      return result;
    } catch (error) {
      this.circuitBreaker.recordFailure();
      await this.queueForRetry(handoffPacket);
      throw error;
    }
  }

  async executeWithRetry(packet, attempt = 1) {
    const maxAttempts = 3;
    const backoffMs = Math.pow(2, attempt) * 1000;

    try {
      return await this.cloudflareSync(packet);
    } catch (error) {
      if (attempt >= maxAttempts) throw error;
      await sleep(backoffMs);
      return this.executeWithRetry(packet, attempt + 1);
    }
  }
}
```

**Requirements:**

- [ ] Circuit breaker (5 failures → open, 60s timeout)
- [ ] Exponential backoff (2^attempt seconds)
- [ ] SQLite persistent queue for failed syncs
- [ ] Background retry processor (every 5 min)
- [ ] Health endpoint: GET /health/sync-status

**Acceptance Criteria:**

- Sync failures queued, not lost
- Circuit opens after 5 consecutive failures
- Automatic retry with backoff
- Manual circuit reset capability

---

#### Task 2.2: Drift Detection & Auto-Repair

**Status:** 🔴 Not Started  
**Owner:** Infrastructure  
**Effort:** 2 days

```javascript
// drift-controller.js
class DriftController {
  async detectDrift() {
    const localMatrix = await loadMatrix();
    const cloudMatrix = await this.cloudflare.getMatrix();

    const drifts = [];
    for (const sessionKey of Object.keys(localMatrix.latestBySession)) {
      const localTs = new Date(
        localMatrix.entries[localMatrix.latestBySession[sessionKey]].ts
      );
      const cloudEntry =
        cloudMatrix.entries[cloudMatrix.latestBySession[sessionKey]];
      const cloudTs = cloudEntry ? new Date(cloudEntry.ts) : null;

      if (!cloudTs || localTs - cloudTs > 3600000) {
        // 1 hour
        drifts.push({
          sessionKey,
          localTs,
          cloudTs,
          driftHours: (localTs - cloudTs) / 3600000,
        });
      }
    }

    return drifts;
  }

  async repairDrift(sessionKey) {
    const localEntry = await this.getLocalLatest(sessionKey);
    await this.cloudflare.forceSync(sessionKey, localEntry);
  }
}
```

**Requirements:**

- [ ] Hourly drift detection
- [ ] Automatic repair for drift < 24 hours
- [ ] Alert for drift > 24 hours
- [ ] Force sync capability for manual repair

---

### Phase 3: Routine Automation (Medium - Week 2-3)

#### Task 3.1: Health Check Daemon

**Status:** 🔴 Not Started  
**Owner:** Infrastructure  
**Effort:** 2 days

```bash
#!/bin/bash
# health-check-daemon.sh

HEALTH_INTERVAL=300  # 5 minutes

while true; do
  # Check 1: handoff-current.json freshness
  CURRENT_AGE=$(($(date +%s) - $(stat -f %m ~/.tnf/handoff-current.json)))
  if [ $CURRENT_AGE -gt 3600 ]; then
    echo "ALERT: handoff-current.json stale (${CURRENT_AGE}s)"
    trigger-regeneration
  fi

  # Check 2: Matrix integrity
  if ! validate-matrix-integrity; then
    echo "ALERT: Matrix integrity failed"
    trigger-matrix-repair
  fi

  # Check 3: Sync queue depth
  QUEUE_DEPTH=$(sqlite3 ~/.tnf/sync-queue.sqlite "SELECT COUNT(*) FROM pending")
  if [ $QUEUE_DEPTH -gt 100 ]; then
    echo "ALERT: Sync queue backpressure (${QUEUE_DEPTH} items)"
    trigger-sync-pause
  fi

  # Check 4: Circuit breaker states
  for CB in ~/.tnf/circuit-breakers/*.json; do
    STATE=$(jq -r '.state' $CB)
    if [ "$STATE" = "OPEN" ]; then
      echo "WARN: Circuit breaker open for $(basename $CB)"
    fi
  done

  sleep $HEALTH_INTERVAL
done
```

**Requirements:**

- [ ] 5-minute interval checks
- [ ] Staleness detection (handoff-current.json > 1h)
- [ ] Matrix integrity validation
- [ ] Sync queue depth monitoring
- [ ] Circuit breaker state checks
- [ ] Self-healing triggers (auto-regeneration, auto-repair)

---

#### Task 3.2: Checkpoint System

**Status:** 🔴 Not Started  
**Owner:** Infrastructure  
**Effort:** 2 days

```javascript
// checkpoint-system.js
class CheckpointSystem {
  async createCheckpoint(operation) {
    const checkpoint = {
      id: uuid(),
      timestamp: new Date().toISOString(),
      operation: operation.type,
      preState: await this.captureState(),
      metadata: operation.metadata,
    };

    await this.saveCheckpoint(checkpoint);
    return checkpoint.id;
  }

  async rollback(checkpointId) {
    const checkpoint = await this.loadCheckpoint(checkpointId);
    await this.restoreState(checkpoint.preState);
    await this.logRollback(checkpoint);
  }

  async captureState() {
    return {
      matrix: await fs.readFile('matrix.json'),
      handoffCurrent: await fs.readFile('handoff-current.json'),
      timestamp: Date.now(),
    };
  }
}
```

**Requirements:**

- [ ] Pre-operation checkpoint creation
- [ ] State snapshot (matrix + handoff-current)
- [ ] Rollback capability
- [ ] Checkpoint cleanup (keep last 24 hours)

---

### Phase 4: Observability (Medium - Week 3)

#### Task 4.1: Structured Metrics

**Status:** 🔴 Not Started  
**Owner:** Infrastructure  
**Effort:** 2 days

```json
{
  "timestamp": "2026-03-18T17:45:00Z",
  "routines": {
    "handoff_generation": {
      "count_1h": 12,
      "count_24h": 142,
      "errors": 2,
      "avg_ms": 45,
      "p95_ms": 120
    },
    "matrix_updates": {
      "count_1h": 8,
      "count_24h": 89,
      "failures": 0,
      "repair_count": 3
    },
    "cloud_sync": {
      "success_rate": 0.94,
      "latency_p95_ms": 946,
      "queue_depth": 23,
      "circuit_breakers_open": 1
    }
  },
  "health": {
    "stale_sessions": 3,
    "max_drift_hours": 558.6,
    "matrix_integrity": "ok",
    "handoff_current_age_minutes": 45
  },
  "alerts": [
    {
      "severity": "critical",
      "type": "sync_drift",
      "message": "agent:main:cron:16410756-8c51-4199-9fe1-cf96cd726e1c drift 525600s",
      "since": "2026-03-09T14:40:31Z"
    }
  ]
}
```

**Requirements:**

- [ ] Metrics export to ~/.tnf/metrics/
- [ ] Prometheus-compatible endpoint
- [ ] JSON export for handoff packets

---

#### Task 4.2: Alert System

**Status:** 🔴 Not Started  
**Owner:** Infrastructure  
**Effort:** 1 day

| Threshold                 | Severity | Action                 |
| ------------------------- | -------- | ---------------------- |
| Drift > 1 hour            | Warning  | Log, queue repair      |
| Drift > 6 hours           | Critical | Alert, auto-repair     |
| Sync failure rate > 10%   | Warning  | Circuit open           |
| Matrix integrity fail     | Critical | Emergency halt, repair |
| handoff-current.json > 1h | Warning  | Auto-regenerate        |
| Queue depth > 100         | Warning  | Backpressure           |

---

#### Task 4.3: Pre-Flight Validation

**Status:** 🔴 Not Started  
**Owner:** Infrastructure  
**Effort:** 1 day

```bash
#!/bin/bash
# tnf-preflight-check

echo "TNF Pre-Flight Validation"
echo "========================="

# Check 1: Matrix schema
if ! jq empty ~/.openclaw/workspace/handoff/matrix.json 2>/dev/null; then
  echo "❌ Matrix JSON invalid"
  exit 1
fi
echo "✅ Matrix JSON valid"

# Check 2: Entry consistency
python3 << 'EOF'
import json
with open('~/.openclaw/workspace/handoff/matrix.json') as f:
    m = json.load(f)
missing = [k for k in m['latestBySession'].values() if k not in m['entries']]
if missing:
    print(f"❌ Missing entries: {missing}")
    exit(1)
print("✅ Entry consistency OK")
EOF

# Check 3: Disk space
AVAILABLE=$(df -k ~/.tnf | tail -1 | awk '{print $4}')
if [ $AVAILABLE -lt 1048576 ]; then  # 1GB
  echo "❌ Low disk space (${AVAILABLE}KB)"
  exit 1
fi
echo "✅ Disk space OK"

# Check 4: Cloud token
if [ -z "$CLOUDFLARE_TOKEN" ]; then
  echo "⚠️  Cloudflare token not set (sync will fail)"
fi

echo ""
echo "All critical checks passed ✅"
```

---

## Resource Management

### Pruning Strategy

```javascript
// retention-policy.js
const RETENTION_POLICY = {
  // Per session: keep last 50
  perSessionMax: 50,
  // Global: keep last 30 days
  globalMaxAgeDays: 30,
  // Archive to cold storage after 7 days
  archiveAfterDays: 7,
  // Compress archived files
  compression: 'gzip',
};
```

### Limits

- Max 1000 handoff files per session (auto-archive oldest)
- Matrix.json > 10MB → Compression/split
- Sync queue > 100 items → Backpressure (pause new handoffs)

---

## Success Metrics

| Metric                    | Current | Target (4 weeks) |
| ------------------------- | ------- | ---------------- |
| Matrix integrity failures | 1       | 0                |
| Sync drift max hours      | 558.6   | < 1              |
| handoff-current staleness | 7 days  | < 1 hour         |
| Silent failures           | Unknown | 0                |
| Recovery time (MTTR)      | Manual  | < 5 minutes      |
| Data loss events          | 0       | 0                |

---

## Appendix: File Locations

| Component        | Path                                        |
| ---------------- | ------------------------------------------- |
| Matrix           | `~/.openclaw/workspace/handoff/matrix.json` |
| Handoff files    | `~/.openclaw/workspace/handoff/*.md`        |
| Current handoff  | `~/.tnf/handoff-current.json`               |
| Sync queue       | `~/.tnf/sync-queue.sqlite`                  |
| Circuit breakers | `~/.tnf/circuit-breakers/*.json`            |
| Checkpoints      | `~/.tnf/checkpoints/*.json`                 |
| Metrics          | `~/.tnf/metrics/*.json`                     |

---

## Task Checklist

### Phase 1: Data Integrity

- [ ] Task 1.1: Implement Atomic Matrix Persistence Gate
- [ ] Task 1.2: Repair Current Matrix Entry Gaps

### Phase 2: Sync Resilience

- [ ] Task 2.1: Build Sync Resilience Controller
- [ ] Task 2.2: Implement Drift Detection & Auto-Repair

### Phase 3: Routine Automation

- [ ] Task 3.1: Create Health Check Daemon
- [ ] Task 3.2: Implement Checkpoint System

### Phase 4: Observability

- [ ] Task 4.1: Add Structured Metrics Export
- [ ] Task 4.2: Configure Alert Thresholds
- [ ] Task 4.3: Create Pre-Flight Validation Script

---

_Document Version: 1.0_  
_Next Review: 2026-03-25_
