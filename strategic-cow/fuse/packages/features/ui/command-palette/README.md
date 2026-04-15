# TNF Command Palette

**User-friendly UI for accessing all 300+ commands, processes, and workflows in
The New Fuse framework**

A beautiful, keyboard-driven command palette inspired by VSCode and Raycast,
designed specifically for The New Fuse monorepo.

---

## Features

✨ **300+ Commands** - Access all TNF scripts, agents, and workflows 🔍 **Fuzzy
Search** - Find commands by name, description, tags, or command text ⌨️
**Keyboard First** - Full keyboard navigation with shortcuts 🎨 **Category
Filtering** - 12 categories for easy organization 🔒 **Safe Execution** -
Confirmation dialogs for dangerous commands 📊 **Execution History** - Track
recent command executions 🎯 **Smart Ranking** - Frequently used commands appear
first 💻 **Multiple Environments** - Browser, Electron, and API execution

---

## Quick Start

### 1. Installation

The command palette is already part of the TNF monorepo:

```bash
# Located at: packages/features/ui/command-palette/
```

### 2. Basic Usage

```typescript
import { CommandPalette, useCommandPalette } from '@the-new-fuse/ui/command-palette';

function App() {
  const { isOpen, close, executeCommand } = useCommandPalette({
    shortcut: 'Cmd+K', // or 'Ctrl+K'
    onExecute: async (command) => {
      // Your execution logic here
      console.log('Executing:', command.command);
      return { success: true, output: 'Done!' };
    },
  });

  return (
    <>
      <YourApp />
      <CommandPalette
        isOpen={isOpen}
        onClose={close}
        onExecute={executeCommand}
      />
    </>
  );
}
```

### 3. Open with Keyboard

Press **Cmd+K** (Mac) or **Ctrl+K** (Windows/Linux) to open the command palette.

---

## Command Categories

The command palette organizes commands into 12 categories:

| Category            | Icon | Description                     | Example Commands                        |
| ------------------- | ---- | ------------------------------- | --------------------------------------- |
| **Development**     | 💻   | Dev servers, local development  | `pnpm dev`, `pnpm dev:all`              |
| **Build**           | 📦   | Build processes, compilation    | `pnpm build`, `pnpm build:production`   |
| **Testing**         | 🧪   | Test execution, coverage        | `pnpm test`, `pnpm test:e2e`            |
| **Database**        | 🗄️   | Migrations, schema, Drizzle     | `pnpm db:migrate`, `pnpm db:studio`     |
| **Docker**          | 🐳   | Container management            | `pnpm docker:start`, `pnpm docker:logs` |
| **Deployment**      | ☁️   | Railway, production deploy      | `pnpm build:railway`                    |
| **Agents**          | 🤖   | Agent management, registry      | `/agent-register`, `/agent-status`      |
| **Workflows**       | 🔀   | Multi-agent workflows           | `/workflow-create`                      |
| **Code Quality**    | ✨   | Linting, formatting, type-check | `pnpm lint`, `pnpm format`              |
| **Utilities**       | 🔧   | Cleanup, port clearing          | `pnpm clean`, `pnpm clear-ports`        |
| **Claude Commands** | ⚡   | Claude slash commands           | `/skill-load`, `/self-improve`          |
| **Scripts**         | 📝   | Shell scripts, automation       | Various `.sh` and `.js` scripts         |

---

## Keyboard Shortcuts

| Shortcut               | Action                   |
| ---------------------- | ------------------------ |
| **Cmd+K** / **Ctrl+K** | Open command palette     |
| **↑** / **↓**          | Navigate commands        |
| **Enter**              | Execute selected command |
| **Esc**                | Close palette            |
| **Type**               | Filter commands          |

---

## Usage Examples

### Example 1: Basic Integration

```typescript
import React from 'react';
import { CommandPalette, useCommandPalette } from '@the-new-fuse/ui/command-palette';

export function MyApp() {
  const palette = useCommandPalette({
    onExecute: async (command) => {
      alert(`Executing: ${command.command}`);
      return { success: true };
    },
  });

  return (
    <div>
      <button onClick={palette.open}>Open Commands</button>
      <CommandPalette
        isOpen={palette.isOpen}
        onClose={palette.close}
        onExecute={palette.executeCommand}
      />
    </div>
  );
}
```

### Example 2: API Execution

```typescript
import { CommandPalette, useCommandPalette, executeCommandAPI } from '@the-new-fuse/ui/command-palette';

export function MyApp() {
  const palette = useCommandPalette({
    onExecute: async (command) => {
      // Execute via your API endpoint
      return await executeCommandAPI(command, '/api/commands/execute');
    },
  });

  return (
    <CommandPalette
      isOpen={palette.isOpen}
      onClose={palette.close}
      onExecute={palette.executeCommand}
    />
  );
}
```

### Example 3: Electron Integration

```typescript
import { useCommandPalette, executeCommandNode } from '@the-new-fuse/ui/command-palette';

export function ElectronApp() {
  const palette = useCommandPalette({
    onExecute: executeCommandNode, // Uses Electron IPC
  });

  return <CommandPalette {...palette} />;
}
```

### Example 4: With Execution History

```typescript
function MyApp() {
  const { getRecentExecutions, ...palette } = useCommandPalette();

  const recentCommands = getRecentExecutions(5);

  return (
    <div>
      <h2>Recent Commands</h2>
      {recentCommands.map((exec, i) => (
        <div key={i}>
          <code>{exec.command.command}</code>
          <span>{exec.result.success ? '✓' : '✗'}</span>
        </div>
      ))}
      <CommandPalette {...palette} />
    </div>
  );
}
```

---

## API Reference

### `useCommandPalette(options)`

Hook for managing command palette state and execution.

**Options:**

```typescript
interface UseCommandPaletteOptions {
  /**
   * Keyboard shortcut (default: 'Cmd+K')
   */
  shortcut?: string;

  /**
   * Execute command handler
   */
  onExecute?: (
    command: Command
  ) => Promise<CommandExecutionResult> | CommandExecutionResult;

  /**
   * Called when palette is opened
   */
  onOpen?: () => void;

  /**
   * Called when palette is closed
   */
  onClose?: () => void;
}
```

**Returns:**

```typescript
{
  // State
  isOpen: boolean;
  isExecuting: boolean;
  executionResult: CommandExecutionResult | null;
  executionHistory: Array<...>;

  // Actions
  open: () => void;
  close: () => void;
  toggle: () => void;
  executeCommand: (command: Command) => Promise<CommandExecutionResult>;
  clearHistory: () => void;
  getRecentExecutions: (count?: number) => Array<...>;
}
```

### `<CommandPalette />`

Main command palette component.

**Props:**

```typescript
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onExecute?: (command: Command) => void;
}
```

### `Command` Interface

```typescript
interface Command {
  id: string;
  name: string;
  description: string;
  command: string;
  category: CommandCategory;
  tags: string[];
  icon?: React.ComponentType<any>;
  dangerous?: boolean;
  requiresConfirmation?: boolean;
  environment?: 'local' | 'docker' | 'production' | 'all';
}
```

### `CommandExecutionResult` Interface

```typescript
interface CommandExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  exitCode?: number;
}
```

---

## Customization

### Adding Custom Commands

Edit `CommandPalette.tsx` to add your own commands:

```typescript
const CUSTOM_COMMANDS: Command[] = [
  {
    id: 'my-command',
    name: 'My Custom Command',
    description: 'Does something cool',
    command: 'pnpm run my-script',
    category: 'utilities',
    tags: ['custom', 'my'],
  },
];

// Merge with default commands
const COMMANDS = [...DEFAULT_COMMANDS, ...CUSTOM_COMMANDS];
```

### Custom Execution Handler

```typescript
const palette = useCommandPalette({
  onExecute: async (command) => {
    if (command.id === 'special-command') {
      // Custom logic for specific command
      return { success: true, output: 'Special handling!' };
    }

    // Default handling
    return await executeCommandAPI(command);
  },
});
```

### Custom Styling

The component uses Tailwind CSS classes. You can customize by:

1. Editing the component's className props
2. Using CSS modules
3. Adding custom Tailwind theme configuration

---

## Backend Integration

### Option 1: NestJS API Endpoint

Create an API endpoint to execute commands:

```typescript
// apps/api/src/commands/commands.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Controller('api/commands')
export class CommandsController {
  @Post('execute')
  async executeCommand(@Body() body: { command: string; commandId: string }) {
    try {
      const { stdout, stderr } = await execAsync(body.command, {
        cwd: process.cwd(),
        timeout: 300000, // 5 minutes
      });

      return {
        success: true,
        output: stdout,
        error: stderr,
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

### Option 2: Electron IPC

```typescript
// electron/main.ts
import { ipcMain } from 'electron';
import { exec } from 'child_process';

ipcMain.handle('execute-command', async (event, command: string) => {
  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      resolve({
        success: !error,
        output: stdout,
        error: error?.message || stderr,
        exitCode: error?.code || 0,
      });
    });
  });
});

// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  executeCommand: (command: string) =>
    ipcRenderer.invoke('execute-command', command),
});
```

---

## Security Considerations

⚠️ **Important Security Notes:**

1. **Command Execution**: Executing shell commands can be dangerous. Always
   validate and sanitize input.
2. **Authentication**: Require authentication for command execution in
   production.
3. **Authorization**: Check user permissions before executing commands.
4. **Dangerous Commands**: Commands marked as `dangerous` require explicit
   confirmation.
5. **Environment Isolation**: Consider running commands in isolated containers
   or sandboxes.

### Recommended Security Practices:

```typescript
// ✅ Good: Whitelist allowed commands
const ALLOWED_COMMANDS = ['pnpm dev', 'pnpm test', 'pnpm build'];

function isCommandAllowed(command: string): boolean {
  return ALLOWED_COMMANDS.includes(command);
}

// ✅ Good: Check user permissions
async function canExecuteCommand(
  user: User,
  command: Command
): Promise<boolean> {
  if (command.dangerous && !user.isAdmin) {
    return false;
  }
  return true;
}

// ❌ Bad: Executing arbitrary commands without validation
// exec(userInput); // NEVER DO THIS
```

---

## Performance

The command palette is optimized for performance:

- **Lazy Loading**: Commands are only rendered when visible
- **Debounced Search**: Search input is debounced to reduce re-renders
- **Virtual Scrolling**: Large command lists use virtual scrolling (future
  enhancement)
- **Memoization**: Heavy computations are memoized with `useMemo`

---

## Accessibility

The command palette follows accessibility best practices:

- ✅ Keyboard navigation
- ✅ ARIA labels
- ✅ Focus management
- ✅ Screen reader support
- ✅ High contrast mode compatible

---

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## Troubleshooting

### Commands not executing

**Problem**: Commands execute but nothing happens.

**Solution**: Check your `onExecute` handler is properly configured:

```typescript
const palette = useCommandPalette({
  onExecute: async (command) => {
    console.log('Executing:', command);
    // Ensure you're actually executing the command
    return await executeCommandAPI(command);
  },
});
```

### Keyboard shortcut not working

**Problem**: Cmd+K or Ctrl+K doesn't open the palette.

**Solution**: Ensure the component is mounted and there are no conflicting
shortcuts:

```typescript
// Check browser console for shortcut registration
console.log('Shortcut registered:', shortcut);

// Try a different shortcut
const palette = useCommandPalette({ shortcut: 'Cmd+Shift+P' });
```

### Styling issues

**Problem**: Command palette doesn't look right.

**Solution**: Ensure Tailwind CSS is configured:

```javascript
// tailwind.config.js
module.exports = {
  content: ['./packages/features/ui/command-palette/**/*.{ts,tsx}'],
};
```

---

## Future Enhancements

Planned features for future versions:

- [ ] Command aliases (e.g., `dev` → `pnpm dev`)
- [ ] Command parameters and arguments
- [ ] Command chaining (run multiple commands)
- [ ] Custom command templates
- [ ] Command scheduling
- [ ] Virtual scrolling for 1000+ commands
- [ ] Command favorites/pinning
- [ ] Command usage analytics
- [ ] AI-powered command suggestions
- [ ] Voice command execution

---

## Contributing

To add more commands to the palette:

1. Edit `CommandPalette.tsx`
2. Add your command to the `COMMANDS` array
3. Choose appropriate category
4. Add descriptive tags
5. Mark as dangerous if needed

Example:

```typescript
{
  id: 'my-new-command',
  name: 'My New Command',
  description: 'What this command does',
  command: 'pnpm run my-command',
  category: 'utilities',
  tags: ['keyword1', 'keyword2'],
  dangerous: false,
  requiresConfirmation: false,
}
```

---

## License

Part of The New Fuse framework. See project root for license information.

---

## Support

For issues or questions:

- Check the [troubleshooting section](#troubleshooting)
- Review the [examples](#usage-examples)
- See the comprehensive [example component](./CommandPaletteExample.tsx)

---

**TNF Command Palette** **Version**: 1.0.0 **Last Updated**: January 17, 2026
