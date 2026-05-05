---
name: TNF Feedback Integration Pipeline
slug: tnf-feedback-pipeline
description: Integrated feedback pathway for beta developers to report issues and suggestions into TNF development workflow
version: 1.0.0
author: TNF Agentic Network
created: 2026-05-03
updated: 2026-05-03
tags: [feedback, devlog, cicd, beta, integration]
priority: P0
---

# TNF Feedback Integration Pipeline

## Purpose

Create a closed-loop development system where:
- Beta developers can report issues/suggestions
- Feedback routes to tasks
- Tasks link to commits
- Commits generate logs
- Logs inform releases

---

## Existing Infrastructure to Leverage

### Task System
- **Location**: `packages/database/src/drizzle/schema/tasks.ts`
- **Statuses**: backlog | in_progress | review | done

### Kanban (Feature Suggestions)
- **Location**: `docs/migration/kanban-board.md`
- **Columns**: Suggestions | In Development | Completed

### Agent Poll Jobs
- **Location**: `.tnf/poll-jobs/`
- **Self-improvement loop** exists

### DevLog Location
- **Location**: `packages/agent/src/skill-bank/compiled/`

---

## Feedback Object Schema

```typescript
interface Feedback {
  id: string;                    // UUID
  type: 'bug' | 'feature' | 'ux' | 'other';
  source: 'user' | 'internal' | 'beta';
  message: string;
  context: {
    url?: string;
    user_agent?: string;
    screen_resolution?: string;
    screenshot_url?: string;
    steps_to_reproduce?: string;
  };
  metadata: {
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'new' | 'triaged' | 'in_progress' | 'done';
    tags: string[];
    linked_commits?: string[];
    linked_task_id?: string;
  };
  created_at: string;           // ISO datetime
  updated_at: string;
}
```

---

## Integration Points

### 1. Feedback Entry Points

| Method | Implementation |
|--------|----------------|
| **Internal (Devs)** | `.tnf/bin/feedback-submit.cjs` script |
| **Web Widget** | FAB button calling `POST /api/feedback` |
| **Slack** | `/tnf feedback` command |
| **GitHub Issues** | Issue templates auto-linking |

### 2. API Endpoint

```
POST /api/feedback
Content-Type: application/json

{
  "type": "bug",
  "message": "Login fails on Safari",
  "context": {
    "url": "https://the.newfuse.com/login"
  },
  "metadata": {
    "priority": "high"
  }
}
```

### 3. Feedback → Task Routing Logic

```
IF type == bug AND priority == critical
  → Create GitHub Issue + Alert Channel
  → Link to release notes

IF type == feature
  → Add to Kanban (Suggestions column)

IF priority == high
  → Create task in backlog with linked feedback ID
  → Route to sprint planning

IF linked to release
  → Attach to devlog
```

### 4. Task Schema Update (for feedback linking)

```typescript
// Add to existing task schema
interface Task {
  // ... existing fields
  source_feedback_id?: string;
  source_feedback_type?: 'bug' | 'feature' | 'ux' | 'other';
  beta_reporter?: string;
}
```

### 5. DevLog Generation (with feedback integration)

Each devlog should include:

```yaml
devlog:
  version: "1.2.0"
  date: "2026-05-03"
  release_feedback:
    bugs_fixed: [ids...]
    features_added: [ids...]
    user_reports: [ids...]
  beta_testers:
    - name: string
      feedback_count: number
  known_issues:
    - id: string
      workaround: string
```

### 6. CI/CD Integration

```yaml
# .github/workflows/feedback-pipeline.yml
name: Feedback Integration

on:
  issue_comment:
    types: [created]

jobs:
  feedback-sync:
    runs-on: ubuntu-latest
    steps:
      - name: Sync to Tasks
        run: |
          curl -X POST $TNF_API/feedback/sync \
            -H "Authorization: Bearer $TOKEN"

  devlog-include:
    needs: feedback-sync
    runs-on: ubuntu-latest
    steps:
      - name: Include in DevLog
        run: |
          echo "feedback_ids=${{ needs.feedback-sync.outputs.feedback_ids }}" >> $GITHUB_ENV
```

---

## Beta Developer Feedback Flow

### Option 1: Web Widget (Recommended)

```tsx
// FeedbackWidget.tsx
const FeedbackWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  const submitFeedback = async (feedback) => {
    await fetch('/api/feedback', {
      method: 'POST',
      body: JSON.stringify({ ...feedback, source: 'beta' })
    });
  };

  return (
    <FAB onClick={() => setIsOpen(true)}>Feedback</FAB>
  );
};
```

### Option 2: Internal Command

```bash
# Quick feedback from any terminal
tnf feedback submit --type bug --message "..."
tnf feedback list --status new
```

### Option 3: Slack Integration

```
/tnf feedback submit [type] [message]
/tnf feedback list
/tnf feedback status [id]
```

---

## Implementation Priority

| Step | Priority | Effort |
|------|----------|--------|
| 1. Feedback API endpoint | P0 | Low |
| 2. Database schema update | P0 | Medium |
| 3. Feedback → task routing | P0 | Medium |
| 4. DevLog with feedback section | P1 | Low |
| 5. tnf CLI feedback commands | P1 | Low |
| 6. Web widget (FAB) | P2 | Medium |
| Slack integration | P2 | Medium |

---

## Files to Create/Update

| File | Action |
|------|--------|
| `.tnf/bin/feedback-submit.cjs` | Create - CLI feedback entry |
| `.tnf/api/feedback.ts` | Create - API handler |
| `packages/database/src/schema/feedback.ts` | Create - DB schema |
| `packages/agent/src/skills/devlog-agent.skill.md` | Update - Include feedback |
| `.github/workflows/feedback.yml` | Create - CI integration |

---

## Quick Start

### Submit Feedback (Internal)

```bash
# Via tnf command
tnf feedback submit --type bug --priority high --message "Login fails on Safari 17"

# Via direct API
curl -X POST http://localhost:3000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "type": "bug",
    "message": "Description here",
    "source": "beta",
    "metadata": {"priority": "high"}
  }'
```

### Check Feedback Status

```bash
tnf feedback list
tnf feedback status <id>
```

---

## Related Skills

- `tnf-agent-orchestration` - How feedback integrates with agent system
- `tnf-cli-agent-workflow` - CLI operations
- `feature-parity-cli-extension` - CLI parity