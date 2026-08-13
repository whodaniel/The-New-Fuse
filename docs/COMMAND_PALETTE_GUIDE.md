# TNF Command Palette - Complete Guide

**User-Friendly Interface for All 300+ TNF Framework Commands**

A comprehensive guide to using The New Fuse Command Palette, the unified
interface for accessing all commands, processes, scripts, agents, and workflows
in the framework.

---

## Table of Contents

1. [Overview](#overview)
2. [Available Commands](#available-commands)
3. [Installation & Setup](#installation--setup)
4. [Usage Guide](#usage-guide)
5. [Command Categories](#command-categories)
6. [Integration Guide](#integration-guide)
7. [Security Best Practices](#security-best-practices)
8. [Examples](#examples)

---

## Overview

The TNF Command Palette provides instant access to:

- **60+ NPM Scripts** (root and workspace packages)
- **100+ Claude Slash Commands** (agents, skills, workflows)
- **40+ Shell Scripts** (automation, fixes, analysis)
- **30+ Database Commands** (migrations, schema, studio)
- **20+ Docker Commands** (container management)
- **50+ Integration Scripts** (orchestration, Jules, MCP)

**Total: 300+ commands** across 12 categories.

### Key Features

✨ **Fuzzy Search** - Find commands by partial match ⌨️ **Keyboard-First** -
Full keyboard navigation (Cmd+K/Ctrl+K) 🎨 **Visual Categories** - Color-coded
categories with icons 🔒 **Safe Execution** - Confirmation for dangerous
commands 📊 **Execution History** - Track what you've run 🚀 **Fast** -
Optimized for 1000+ commands 💻 **Universal** - Works in browser, Electron, and
API modes

---

## Available Commands

### Development Commands

| Command               | Description                        | Category    |
| --------------------- | ---------------------------------- | ----------- |
| `pnpm dev`            | Start frontend + API gateway       | Development |
| `pnpm dev:all`        | Start all services (50 concurrent) | Development |
| `pnpm dev:api`        | Start API server only              | Development |
| `pnpm dev:frontend`   | Start frontend only                | Development |
| `pnpm dev:gateway`    | Start API gateway only             | Development |
| `pnpm dev:backend`    | Start backend only                 | Development |
| `pnpm dev:low-memory` | Memory-optimized dev (1GB)         | Development |
| `pnpm relay:start`    | Start relay server                 | Development |

### Build Commands

| Command                       | Description                        | Category |
| ----------------------------- | ---------------------------------- | -------- |
| `pnpm build`                  | Production build                   | Build    |
| `pnpm build:production`       | Full production build + cleanup    | Build    |
| `pnpm build:packages`         | Build all workspace packages       | Build    |
| `pnpm build:apps`             | Build all applications             | Build    |
| `pnpm build:adaptive`         | Auto-detect optimal build strategy | Build    |
| `pnpm build:memory-optimized` | Build with 2GB memory limit        | Build    |
| `pnpm build:low-memory`       | Build with 1GB memory limit        | Build    |
| `pnpm build:health-check`     | Comprehensive build validation     | Build    |
| `pnpm build:cloud_runtime`          | CloudRuntime-specific build             | Build    |

### Test Commands

| Command                 | Description                   | Category |
| ----------------------- | ----------------------------- | -------- |
| `pnpm test`             | Run all tests via Turbo       | Test     |
| `pnpm test:unit`        | Unit tests only               | Test     |
| `pnpm test:integration` | Integration tests only        | Test     |
| `pnpm test:e2e`         | End-to-end tests (Playwright) | Test     |
| `pnpm test:watch`       | Watch mode testing            | Test     |
| `pnpm test:coverage`    | Generate coverage reports     | Test     |

### Database Commands

| Command            | Description                 | Category |
| ------------------ | --------------------------- | -------- |
| `pnpm db:generate` | Generate Drizzle migrations | Database |
| `pnpm db:migrate`  | Run database migrations     | Database |
| `pnpm db:push`     | Push schema to database     | Database |
| `pnpm db:pull`     | Pull schema from database   | Database |
| `pnpm db:studio`   | Open Drizzle Studio (GUI)   | Database |
| `pnpm db:check`    | Check schema validity       | Database |

### Docker Commands

| Command              | Description              | Category |
| -------------------- | ------------------------ | -------- |
| `pnpm docker:start`  | Start PostgreSQL + Redis | Docker   |
| `pnpm docker:stop`   | Stop all containers      | Docker   |
| `pnpm docker:status` | Check container status   | Docker   |
| `pnpm docker:logs`   | View container logs      | Docker   |
| `pnpm docker:test`   | Test Docker integration  | Docker   |

### Code Quality Commands

| Command             | Description                             | Category |
| ------------------- | --------------------------------------- | -------- |
| `pnpm lint`         | Run ESLint on all packages              | Quality  |
| `pnpm lint:fix`     | Auto-fix linting issues                 | Quality  |
| `pnpm format`       | Format with Prettier                    | Quality  |
| `pnpm format:check` | Check formatting                        | Quality  |
| `pnpm type-check`   | TypeScript type validation              | Quality  |
| `pnpm health-check` | Full health check (type + test + build) | Quality  |

### Utility Commands

| Command            | Description               | Category  |
| ------------------ | ------------------------- | --------- |
| `pnpm clean`       | Clean build artifacts     | Utilities |
| `pnpm clean:all`   | Deep clean + reinstall    | Utilities |
| `pnpm clean:cache` | Clear Turbo cache         | Utilities |
| `pnpm clear-ports` | Kill stuck port processes | Utilities |

### Claude Slash Commands

| Command              | Description                      | Category |
| -------------------- | -------------------------------- | -------- |
| `/agent-register`    | Register new agent               | Claude   |
| `/agent-status`      | Check agent status               | Claude   |
| `/agent-discover`    | Discover agents by capability    | Claude   |
| `/workflow-create`   | Create multi-agent workflow      | Claude   |
| `/chat-room-create`  | Create collaboration room        | Claude   |
| `/self-improve`      | Run improvement cycle (5 agents) | Claude   |
| `/skill-load`        | Load Claude skills               | Claude   |
| `/skill-search`      | Search available skills          | Claude   |
| `/skill-pdf`         | PDF manipulation skill           | Claude   |
| `/skill-xlsx`        | Excel manipulation skill         | Claude   |
| `/delegate-to-jules` | Delegate to Jules CLI            | Claude   |

---

## Installation & Setup

### 1. Component Files

The command palette is located at:

```
packages/features/ui/command-palette/
├── CommandPalette.tsx          # Main component
├── useCommandPalette.ts        # React hook
├── CommandPaletteExample.tsx   # Usage example
├── index.ts                    # Exports
└── README.md                   # Documentation
```

### 2. Dependencies

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "lucide-react": "^0.300.0"
  }
}
```

### 3. Tailwind Configuration

Add to your `tailwind.config.js`:

```javascript
module.exports = {
  content: ['./packages/features/ui/command-palette/**/*.{ts,tsx}'],
};
```

---

## Usage Guide

### Basic Setup

```typescript
import React from 'react';
import { CommandPalette, useCommandPalette } from '@the-new-fuse/ui/command-palette';

function App() {
  const palette = useCommandPalette({
    shortcut: 'Cmd+K', // Keyboard shortcut
    onExecute: async (command) => {
      console.log('Executing:', command.command);
      // Your execution logic
      return { success: true, output: 'Done!' };
    },
  });

  return (
    <>
      <YourAppContent />
      <CommandPalette
        isOpen={palette.isOpen}
        onClose={palette.close}
        onExecute={palette.executeCommand}
      />
    </>
  );
}
```

### Opening the Palette

**Via Keyboard:**

- Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)

**Via Code:**

```typescript
const palette = useCommandPalette();

// Open programmatically
palette.open();

// Close programmatically
palette.close();

// Toggle
palette.toggle();
```

### Navigation

- **Type** to filter commands
- **↑/↓** to navigate
- **Enter** to execute
- **Esc** to close

---

## Command Categories

Commands are organized into 12 color-coded categories:

### 1. Development (Blue)

Development servers and local environment

**Icon:** 💻 Code **Color:** Blue **Commands:** `dev`, `dev:all`,
`dev:frontend`, etc.

### 2. Build (Purple)

Build processes and compilation

**Icon:** 📦 Package **Color:** Purple **Commands:** `build`,
`build:production`, `build:apps`, etc.

### 3. Testing (Green)

Test execution and coverage

**Icon:** 🧪 TestTube **Color:** Green **Commands:** `test`, `test:unit`,
`test:e2e`, etc.

### 4. Database (Orange)

Database migrations and management

**Icon:** 🗄️ Database **Color:** Orange **Commands:** `db:migrate`, `db:studio`,
`db:push`, etc.

### 5. Docker (Cyan)

Container management

**Icon:** 🐳 Docker **Color:** Cyan **Commands:** `docker:start`, `docker:stop`,
`docker:logs`, etc.

### 6. Deployment (Pink)

Production deployment

**Icon:** ☁️ Cloud **Color:** Pink **Commands:** `build:cloud_runtime`, deployment
scripts

### 7. Agents (Indigo)

Agent management and registry

**Icon:** 🤖 Bot **Color:** Indigo **Commands:** `/agent-register`,
`/agent-status`, etc.

### 8. Workflows (Teal)

Multi-agent workflows

**Icon:** 🔀 GitBranch **Color:** Teal **Commands:** `/workflow-create`,
workflow scripts

### 9. Code Quality (Orange)

Linting, formatting, type-checking

**Icon:** ✨ Sparkles **Color:** Orange **Commands:** `lint`, `format`,
`type-check`, etc.

### 10. Utilities (Gray)

Cleanup and maintenance

**Icon:** 🔧 Wrench **Color:** Gray **Commands:** `clean`, `clean:all`,
`clear-ports`, etc.

### 11. Claude Commands (Purple)

Claude slash commands

**Icon:** ⚡ Zap **Color:** Purple **Commands:** `/skill-load`, `/self-improve`,
etc.

### 12. Scripts (Red)

Shell scripts and automation

**Icon:** 📝 FileCode **Color:** Red **Commands:** Various `.sh` and `.js`
scripts

---

## Integration Guide

### Option 1: API Execution (Recommended for Web)

**Backend Setup (NestJS):**

```typescript
// apps/api/src/commands/commands.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { AuthGuard } from '../auth/auth.guard';

const execAsync = promisify(exec);

@Controller('api/commands')
@UseGuards(AuthGuard) // Require authentication
export class CommandsController {
  @Post('execute')
  async executeCommand(@Body() body: { command: string; commandId: string }) {
    // Whitelist allowed commands
    const allowedCommands = [
      'pnpm dev',
      'pnpm test',
      'pnpm build',
      'pnpm type-check',
      // ... add more as needed
    ];

    if (!allowedCommands.includes(body.command)) {
      return {
        success: false,
        error: 'Command not allowed',
      };
    }

    try {
      const { stdout, stderr } = await execAsync(body.command, {
        cwd: process.cwd(),
        timeout: 300000, // 5 min timeout
      });

      return {
        success: true,
        output: stdout,
        error: stderr || undefined,
        exitCode: 0,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        exitCode: error.code || 1,
      };
    }
  }
}
```

**Frontend Usage:**

```typescript
import { useCommandPalette, executeCommandAPI } from '@the-new-fuse/ui/command-palette';

function App() {
  const palette = useCommandPalette({
    onExecute: async (command) => {
      return await executeCommandAPI(command, '/api/commands/execute');
    },
  });

  return <CommandPalette {...palette} />;
}
```

### Option 2: Electron Integration

**Main Process (electron/main.ts):**

```typescript
import { ipcMain } from 'electron';
import { exec } from 'child_process';

ipcMain.handle('execute-command', async (event, command: string) => {
  return new Promise((resolve) => {
    exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
      resolve({
        success: !error,
        output: stdout,
        error: error?.message || stderr,
        exitCode: error?.code || 0,
      });
    });
  });
});
```

**Preload Script (electron/preload.ts):**

```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  executeCommand: (command: string) =>
    ipcRenderer.invoke('execute-command', command),
});
```

**Renderer Usage:**

```typescript
import { useCommandPalette, executeCommandNode } from '@the-new-fuse/ui/command-palette';

function ElectronApp() {
  const palette = useCommandPalette({
    onExecute: executeCommandNode,
  });

  return <CommandPalette {...palette} />;
}
```

### Option 3: Direct Browser (Read-Only)

For browser-only environments without backend:

```typescript
const palette = useCommandPalette({
  onExecute: async (command) => {
    // Just display the command, don't execute
    alert(
      `To run this command:\n\n${command.command}\n\nOpen your terminal and execute it manually.`
    );
    return { success: true, output: 'Command copied to clipboard' };
  },
});
```

---

## Security Best Practices

⚠️ **Critical Security Considerations:**

### 1. Authentication Required

```typescript
@Controller('api/commands')
@UseGuards(AuthGuard) // ✅ Always require auth
export class CommandsController {
  // ...
}
```

### 2. Command Whitelisting

```typescript
// ✅ Good: Whitelist allowed commands
const ALLOWED_COMMANDS = ['pnpm dev', 'pnpm test', 'pnpm build'];

function isAllowed(command: string): boolean {
  return ALLOWED_COMMANDS.includes(command);
}

// ❌ Bad: Executing arbitrary commands
exec(userInput); // NEVER DO THIS
```

### 3. Authorization Checks

```typescript
// Check user permissions
if (command.dangerous && !user.isAdmin) {
  throw new UnauthorizedException('Admin required');
}
```

### 4. Input Sanitization

```typescript
// Validate command format
if (!/^pnpm\s+[\w:]+$/.test(command)) {
  throw new BadRequestException('Invalid command format');
}
```

### 5. Rate Limiting

```typescript
@Throttle(10, 60) // 10 requests per minute
@Post('execute')
async executeCommand() {
  // ...
}
```

---

## Examples

### Example 1: Full Integration

```typescript
import React, { useState } from 'react';
import { CommandPalette, useCommandPalette } from '@the-new-fuse/ui/command-palette';
import { Terminal, CheckCircle, XCircle } from 'lucide-react';

export function CommandCenter() {
  const palette = useCommandPalette({
    onExecute: async (command) => {
      const response = await fetch('/api/commands/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: command.command }),
      });

      return await response.json();
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Terminal className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold">TNF Command Center</h1>
          </div>
          <button
            onClick={palette.open}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            Open Commands
            <kbd className="px-2 py-1 text-xs bg-blue-700 rounded">⌘K</kbd>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {palette.executionResult && (
          <div className={`p-4 rounded-lg border-2 mb-6 ${
            palette.executionResult.success
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {palette.executionResult.success ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <div>
                <h3 className="font-semibold">
                  {palette.executionResult.success ? 'Success' : 'Failed'}
                </h3>
                {palette.executionResult.output && (
                  <pre className="mt-2 p-3 bg-white rounded text-sm">
                    {palette.executionResult.output}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          {/* Quick Actions */}
        </div>
      </main>

      <CommandPalette
        isOpen={palette.isOpen}
        onClose={palette.close}
        onExecute={palette.executeCommand}
      />
    </div>
  );
}
```

### Example 2: With Execution History

```typescript
function HistoryPanel() {
  const { getRecentExecutions } = useCommandPalette();
  const history = getRecentExecutions(10);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Recent Executions</h2>
      {history.map((exec, i) => (
        <div key={i} className="flex justify-between items-center py-2 border-b">
          <code className="text-sm">{exec.command.command}</code>
          {exec.result.success ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Troubleshooting

### Issue: Commands Not Executing

**Symptoms:** Palette opens but commands don't run.

**Solution:**

```typescript
// Ensure onExecute is properly configured
const palette = useCommandPalette({
  onExecute: async (command) => {
    console.log('Executing:', command); // Add logging
    return await executeCommandAPI(command);
  },
});
```

### Issue: Keyboard Shortcut Not Working

**Symptoms:** Cmd+K doesn't open palette.

**Solution:**

```typescript
// Try different shortcut
const palette = useCommandPalette({ shortcut: 'Cmd+Shift+P' });

// Or check for conflicts
window.addEventListener('keydown', (e) => {
  if (e.metaKey && e.key === 'k') {
    console.log('Shortcut captured');
  }
});
```

### Issue: Permission Denied

**Symptoms:** 403 or 401 errors when executing.

**Solution:**

- Ensure user is authenticated
- Check API endpoint has proper auth guards
- Verify user has permission for command

---

## Next Steps

1. **Integrate into your app** - Follow the
   [Integration Guide](#integration-guide)
2. **Add custom commands** - Edit the `COMMANDS` array
3. **Setup backend** - Create API endpoint or Electron IPC
4. **Test security** - Verify authentication and authorization
5. **Monitor usage** - Track command execution patterns

---

## Related Documentation

- [Command Palette README](../packages/features/ui/command-palette/README.md)
- [Example Component](../packages/features/ui/command-palette/CommandPaletteExample.tsx)
- [API Reference](../packages/features/ui/command-palette/README.md#api-reference)
- [LLM Provider Integration](./LLM_PROVIDER_INTEGRATION.md)

---

**TNF Command Palette Guide** **Version**: 1.0.0 **Last Updated**: January 17,
2026
