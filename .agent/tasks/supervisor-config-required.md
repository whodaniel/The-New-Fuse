# TNF Supervisor Configuration Required

## Current Status

### Jules Supervisor

- **Status**: Stale (last ran 2026-03-20)
- **PID**: 51785 (stale)
- **Issue**: API auth not configured

### Skill Bank Supervisor

- **Status**: Stopped
- **Issue**: Requires TNF_SUPER_ADMIN_TOKEN

---

## Required Actions

### 1. Configure Jules API Auth

```bash
# Get Jules API token from https://console.anthropic.com
export JULES_API_KEY="sk-ant-..."

# Or add to .env.local
JULES_API_KEY=your_token_here
```

### 2. Set Super Admin Token

```bash
# For skill bank supervisor
export TNF_SUPER_ADMIN_TOKEN="your_token"
tnf skills bank supervisor-start
```

### 3. Restart Jules Supervisor

```bash
tnf jules supervisor-stop
tnf jules supervisor-start
```

---

## Verification Commands

```bash
tnf jules supervisor-status
tnf skills bank supervisor-status
```

---

_Created: 2026-03-23_
