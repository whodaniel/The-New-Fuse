# Jules CLI Programmatic Interaction Guide

## Overview

Jules CLI (v0.1.42) is Google's command-line interface for interacting with the
Jules autonomous coding agent. This guide documents how to programmatically
interact with Jules for automation and integration purposes.

## Installation

Jules is installed as a Node.js binary and uses OAuth for authentication.

```bash
# Check installation
which jules  # /path/to/.nvm/versions/node/v24.12.0/bin/jules

# Check version
jules version
# Version: v0.1.42
# OAuth Client ID: 716860248198-t1s5lv1n1msgfoe3dt7vekro8b1fpd9g.apps.googleusercontent.com
```

## Authentication

Jules uses OAuth 2.0 with Google accounts:

```bash
# Login (interactive - opens browser)
jules login

# Logout
jules logout
```

**Note:** Authentication tokens are stored locally. For automation, ensure the
account is already authenticated before running scripts.

## Core Commands

### 1. Create a New Session

```bash
# Basic usage (uses current git repo)
jules new "your task description"

# Specify repository explicitly
jules new --repo username/repo "your task description"

# Parallel execution (1-5 sessions)
jules new --repo username/repo --parallel 3 "your task description"

# Pipe task description
echo "add error handling" | jules new --repo username/repo

# From file
cat task.md | jules new --repo username/repo
```

### 2. Remote Session Management

```bash
# Create remote session
jules remote new --repo username/repo --session "task description"

# List all sessions
jules remote list --session

# List connected repositories
jules remote list --repo

# Pull session results
jules remote pull --session <SESSION_ID>

# Pull and apply patch
jules remote pull --session <SESSION_ID> --apply
```

### 3. Teleport (Clone + Apply)

```bash
# Clone repo and apply session changes
jules teleport <SESSION_ID>
```

## Programmatic Patterns

### Pattern 1: Batch Task Submission

```javascript
const { execSync } = require('child_process');

async function submitTask(repo, description) {
  try {
    const result = execSync(
      `jules new --repo ${repo} "${description.replace(/"/g, '\\"')}"`,
      { encoding: 'utf8', timeout: 120000 }
    );
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Submit multiple tasks
const tasks = [
  'Add unit tests for auth module',
  'Fix memory leak in connection pool',
  'Update dependencies',
];

for (const task of tasks) {
  await submitTask('whodaniel/fuse', task);
  await new Promise((r) => setTimeout(r, 2000)); // Rate limiting
}
```

### Pattern 2: Session Status Monitoring

```javascript
const { execSync } = require('child_process');

function listSessions() {
  const output = execSync('jules remote list --session', { encoding: 'utf8' });

  // Parse the tabular output
  const lines = output.trim().split('\n').slice(1); // Skip header
  return lines.map((line) => {
    const parts = line.trim().split(/\s{2,}/);
    return {
      id: parts[0],
      description: parts[1],
      repo: parts[2],
      lastActive: parts[3],
      status: parts[4],
    };
  });
}

// Filter by status
const sessions = listSessions();
const pending = sessions.filter((s) => s.status === 'In Progress');
const completed = sessions.filter((s) => s.status === 'Completed');
const awaitingFeedback = sessions.filter((s) => s.status === 'Awaiting User F');
```

### Pattern 3: Auto-Apply Completed Sessions

```javascript
const { execSync } = require('child_process');

async function applyCompletedSessions() {
  const sessions = listSessions();
  const completed = sessions.filter((s) => s.status === 'Completed');

  for (const session of completed) {
    try {
      console.log(`Applying session ${session.id}...`);
      execSync(`jules remote pull --session ${session.id} --apply`, {
        encoding: 'utf8',
        cwd: '/path/to/repo',
      });
      console.log(`✅ Applied ${session.id}`);
    } catch (error) {
      console.log(`❌ Failed to apply ${session.id}: ${error.message}`);
    }
  }
}
```

### Pattern 4: GitHub Integration

```bash
# Create session from GitHub issue
gh issue list --assignee @me --limit 1 --json title | \
  jq -r '.[0].title' | \
  jules new --repo username/repo

# Create sessions for all assigned issues
gh issue list --assignee @me --json title,number | \
  jq -r '.[] | "Issue #\(.number): \(.title)"' | \
  while IFS= read -r line; do
    jules new --repo username/repo "$line"
    sleep 2
  done
```

### Pattern 5: CI/CD Integration

```yaml
# GitHub Actions example
jobs:
  jules-task:
    runs-on: ubuntu-latest
    steps:
      - name: Install Jules CLI
        run: npm install -g @google/jules-cli

      - name: Authenticate Jules
        run: echo "$JULES_TOKEN" | jules login --token

      - name: Submit Task
        run: jules new --repo ${{ github.repository }} "Fix issue #${{ github.event.issue.number }}"
```

## Output Parsing

Jules CLI outputs tabular data. Here's how to parse it:

```javascript
function parseJulesOutput(output) {
  const lines = output.trim().split('\n');
  const header = lines[0];
  const data = lines.slice(1);

  // Parse fixed-width columns
  const columnPositions = [
    { name: 'id', start: 0, end: 24 },
    { name: 'description', start: 24, end: 84 },
    { name: 'repo', start: 84, end: 104 },
    { name: 'lastActive', start: 104, end: 128 },
    { name: 'status', start: 128 },
  ];

  return data.map((line) => {
    const row = {};
    for (const col of columnPositions) {
      row[col.name] = line.substring(col.start, col.end || line.length).trim();
    }
    return row;
  });
}
```

## Session Statuses

| Status            | Description                                |
| ----------------- | ------------------------------------------ |
| `In Progress`     | Jules is actively working on the task      |
| `Completed`       | Task completed, ready for pull             |
| `Awaiting User F` | Awaiting user feedback (truncated display) |
| `Failed`          | Task failed                                |

## Rate Limits & Quotas

Based on plan tier:

| Plan | Tasks/Day | Concurrent | Model                   |
| ---- | --------- | ---------- | ----------------------- |
| Free | 15        | 3          | Gemini 2.5 Pro          |
| Pro  | 100       | 15         | Gemini 3 Pro            |
| Team | 300       | 60         | Gemini 3 Pro (priority) |

## Error Handling

```javascript
const { execSync } = require('child_process');

function safeJulesCommand(command) {
  try {
    return {
      success: true,
      output: execSync(command, {
        encoding: 'utf8',
        timeout: 120000,
        maxBuffer: 50 * 1024 * 1024, // 50MB
      }),
    };
  } catch (error) {
    // Common errors
    if (error.message.includes('No --repo flag')) {
      return {
        success: false,
        error: 'REPO_NOT_CONNECTED',
        message: 'Specify --repo flag',
      };
    }
    if (error.message.includes('rate limit')) {
      return {
        success: false,
        error: 'RATE_LIMITED',
        message: 'Wait before retrying',
      };
    }
    if (error.message.includes('not logged in')) {
      return {
        success: false,
        error: 'AUTH_REQUIRED',
        message: 'Run: jules login',
      };
    }
    return { success: false, error: 'UNKNOWN', message: error.message };
  }
}
```

## Integration with TNF Framework

### Jules-as-a-Skill Integration

```javascript
// packages/agent/src/skills/JulesSkill.ts
export class JulesSkill {
  private repo: string;

  constructor(repo: string) {
    this.repo = repo;
  }

  async submitTask(description: string, options?: { parallel?: number }): Promise<string> {
    const parallel = options?.parallel || 1;
    const cmd = `jules new --repo ${this.repo} --parallel ${parallel} "${description}"`;
    const result = execSync(cmd, { encoding: 'utf8' });
    return this.extractSessionId(result);
  }

  async checkStatus(sessionId: string): Promise<SessionStatus> {
    const sessions = await this.listSessions();
    return sessions.find(s => s.id === sessionId);
  }

  async pullResult(sessionId: string, apply: boolean = false): Promise<string> {
    const cmd = `jules remote pull --session ${sessionId}${apply ? ' --apply' : ''}`;
    return execSync(cmd, { encoding: 'utf8' });
  }
}
```

### DACC-v1 Protocol Integration

```javascript
// Delegating coding tasks to Jules via A2A protocol
const message = {
  header: {
    agent_id: 'ORCHESTRATOR-01',
    alg: 'HS256',
    nonce: crypto.randomBytes(16).toString('hex'),
    timestamp: Date.now(),
  },
  payload: {
    type: 'JULES_SKILL_DELEGATION',
    action: 'new_session',
    data: {
      repo: 'whodaniel/fuse',
      task: 'Add comprehensive error handling to SecurityService',
      priority: 'high',
    },
    conatus_weight: 0.95,
  },
  signature: '...',
};
```

## Best Practices

1. **Rate Limiting**: Add delays between task submissions (2-5 seconds)
2. **Error Handling**: Always wrap commands in try-catch
3. **Timeouts**: Set appropriate timeouts (120s for submissions)
4. **Buffer Size**: Increase maxBuffer for large outputs
5. **Authentication**: Check auth status before batch operations
6. **Repo Flag**: Always specify `--repo` for clarity
7. **Task Descriptions**: Be specific and include file paths when relevant

## Future Enhancements (Jules API Alpha)

Google has announced a Jules API (in alpha) that will provide:

- REST API for programmatic access
- Webhooks for status updates
- Integration with Slack, Linear, Jira, GitHub
- Structured JSON responses

Monitor: https://jules.google for API availability announcements.

---

_Document Version: 1.0.0_  
_Last Updated: 2026-01-17_  
_Jules CLI Version: v0.1.42_
