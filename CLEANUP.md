# System Cleanup Guide

## Overview
Unified documentation for automated and manual cleanup procedures across development environments.

## Automated Scripts
```bash
# cleanup.sh core functionality
./cleanup.sh --target=temp --exclude=logs
./cleanup-dev-env.sh --preserve=docker-volumes
```

## Manual Cleanup Checklist
- Temporary files: `data/*.tmp`
- Test artifacts: `test-results/`
- Development containers:
  ```bash
  docker system prune --all --volumes
  ```

## Verification Procedures
```javascript
// cleanup-summary.js
verifyCleanup({
  requiredFreeSpace: '10GB',
  allowedTempFiles: ['.env', '*.log']
});
```

## Deprecated Documents
- FINAL-CLEANUP-PLAN.md
- restructure-plan.md
- project-restructure.md

## Audit Configuration
```json
// monitoring_config.json
"cleanup_audit": {
  "schedule": "0 3 * * *",
  "retention_days": 7,
  "alert_threshold": 85
}
```

## Implementation Notes
- Preserves essential debugging logs
- Maintains database snapshots in `db/backups`
- Automatically tracks cleanup history in `logs/cleanup-audit.log`

> **Important**: Replaces all previous cleanup-related documentation