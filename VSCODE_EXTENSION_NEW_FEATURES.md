# The New Fuse VSCode Extension - New Features (v9.2.0)

**Release Date:** 2026-01-26 **Version:** 9.2.0 - Enhanced VSCode API
Integration

---

## Overview

This release brings The New Fuse VSCode extension closer to feature parity with
Claude Code by implementing advanced VSCode API features including CodeLens,
Hover providers, Completion providers, Workspace Indexing, and Git integration.

---

## New Features

### 1. **Inline Diff View** ⭐

Show AI-proposed code changes in a diff view before applying them.

**Features:**

- Side-by-side diff comparison
- Accept/Reject/Modify workflow
- Support for full-file and range-based edits
- Visual highlighting of proposed changes

**Usage:**

```typescript
import { getDiffViewProvider } from './providers/DiffViewProvider';

const diffProvider = getDiffViewProvider();
const decision = await diffProvider.showDiff({
  uri: fileUri,
  originalContent: oldCode,
  modifiedContent: newCode,
  description: 'AI-suggested refactoring',
});
```

**Commands:**

- None (used programmatically by AI features)

---

### 2. **AI CodeLens Provider** ⭐

Inline code suggestions and actions displayed above functions, classes, and
methods.

**Features:**

- **Explain**: Get AI explanation of code element
- **Optimize**: Receive optimization suggestions
- **Generate Tests**: Auto-generate unit tests
- **Document**: Generate documentation comments

**Commands:**

- `theNewFuse.codeLens.explain` - Explain code element
- `theNewFuse.codeLens.optimize` - Optimize code
- `theNewFuse.codeLens.generateTests` - Generate tests
- `theNewFuse.codeLens.document` - Generate documentation

**Configuration:**

```json
{
  "theNewFuse.features.codeLens.enabled": true
}
```

**Supported Languages:**

- TypeScript/JavaScript (TSX/JSX)
- Python
- Java
- C#
- Go
- Rust
- C/C++
- PHP
- Ruby

---

### 3. **AI Hover Provider** ⭐

Smart hover hints with AI-powered insights.

**Features:**

- Definition and type information
- AI-generated insights (optional)
- Quick actions (Explain, Find References, Go to Definition)
- Markdown rendering

**Commands:**

- `theNewFuse.hover.explain` - Explain hovered element
- `theNewFuse.hover.toggleAIHints` - Toggle AI insights in hover

**Configuration:**

```json
{
  "theNewFuse.features.hover.enabled": true,
  "theNewFuse.features.hover.aiHints": false // Enable for AI insights
}
```

**Note:** AI hints are disabled by default to avoid too many API calls. Enable
manually for richer experience.

---

### 4. **AI Completion Provider** ⭐

Intelligent code completions powered by your configured LLM.

**Features:**

- Context-aware completions
- Single-line and multi-line suggestions
- Snippet-based insertions
- Trigger on `.`, `(`, `{`, and space
- Smart caching (2-minute cache duration)
- Rate limiting to avoid excessive API calls

**Commands:**

- `theNewFuse.completion.toggle` - Enable/disable AI completions
- `theNewFuse.completion.clearCache` - Clear completion cache
- `theNewFuse.completion.triggerManual` - Manually trigger completion

**Configuration:**

```json
{
  "theNewFuse.features.completion.enabled": true,
  "theNewFuse.features.completion.triggerDelay": 1000 // ms
}
```

**Keybindings:**

- Works with standard VSCode completion triggers
- Ctrl+Space (Cmd+Space on Mac) to invoke

---

### 5. **Workspace Indexing Service** ⭐

Indexes your workspace for intelligent code navigation and semantic search.

**Features:**

- **Symbol Indexing**: All functions, classes, interfaces indexed
- **Import/Export Tracking**: Understand module relationships
- **File Watchers**: Auto-update index on file changes
- **Language Support**: TypeScript, JavaScript, Python, Java, C#, Go, Rust,
  C/C++, PHP, Ruby
- **Statistics**: Track indexed files, symbols, and languages
- **Background Processing**: Non-blocking indexing with progress indicator

**Commands:**

- `theNewFuse.workspace.index` - Manually trigger workspace indexing
- `theNewFuse.workspace.searchSymbols` - Search indexed symbols

**Configuration:**

```json
{
  "theNewFuse.features.workspaceIndexing.enabled": true,
  "theNewFuse.features.workspaceIndexing.autoIndex": true
}
```

**API:**

```typescript
import { getWorkspaceIndexingService } from './services/WorkspaceIndexingService';

const indexService = getWorkspaceIndexingService();

// Search for symbols
const results = indexService.searchSymbols('myFunction');

// Get file index
const fileIndex = indexService.getFileIndex(uri);

// Get files that import a module
const importers = indexService.getFilesThatImport('react');

// Get statistics
const stats = indexService.getStats();
```

---

### 6. **Git Integration Service** ⭐

Deep integration with VSCode's Git extension for enhanced context awareness.

**Features:**

- **Repository Info**: Current branch, commit, upstream status
- **Change Tracking**: Working tree and index changes
- **File Status**: Modified, added, deleted, untracked files
- **Diff Generation**: Get file diffs for AI analysis
- **Repository Summary**: Comprehensive status for AI context

**Commands:**

- `theNewFuse.git.summary` - Show Git repository summary

**Configuration:**

```json
{
  "theNewFuse.features.git.enabled": true
}
```

**API:**

```typescript
import { getGitIntegrationService } from './services/GitIntegrationService';

const gitService = getGitIntegrationService();

// Get current branch
const branch = gitService.getCurrentBranch(uri);

// Get all changes
const changes = gitService.getAllChanges(uri);

// Get file diff
const diff = await gitService.getFileDiff(uri);

// Get repository summary (for AI context)
const summary = gitService.getRepositorySummary(uri);
```

---

## Installation & Setup

### 1. Build the Extension

```bash
cd apps/vscode-extension
pnpm install
pnpm run compile
```

### 2. Package the Extension

```bash
pnpm run package
```

### 3. Install in VSCode

1. Open VSCode
2. Press `Ctrl+Shift+P` (Cmd+Shift+P on Mac)
3. Run "Extensions: Install from VSIX..."
4. Select the generated `.vsix` file

### 4. Configure API Keys

1. Open Command Palette
2. Run "The New Fuse: Configure API Keys"
3. Enter your API keys for desired providers

---

## Testing the New Features

### Test CodeLens

1. Open a TypeScript/JavaScript file
2. Look for inline actions above functions: "AI: Explain", "AI: Optimize", etc.
3. Click any CodeLens action to test

### Test Hover

1. Hover over a variable or function name
2. See definition + type information
3. Click quick actions at the bottom
4. Enable AI hints: `theNewFuse.hover.toggleAIHints`

### Test Completions

1. Start typing in a supported language
2. Trigger completion with Ctrl+Space
3. Look for "AI suggestion" items
4. Accept a suggestion to insert code

### Test Workspace Indexing

1. Open a workspace/folder
2. Wait for "Indexing workspace..." notification
3. Run command: `theNewFuse.workspace.searchSymbols`
4. Search for a symbol name

### Test Git Integration

1. Open a Git repository
2. Run command: `theNewFuse.git.summary`
3. See comprehensive repository status

---

## Configuration Reference

### Complete Configuration

```json
{
  // Core Settings
  "theNewFuse.defaultProvider": "anthropic",
  "theNewFuse.defaultModel": "claude-opus-4.5-20251124",
  "theNewFuse.maxTokens": 8192,
  "theNewFuse.temperature": 0.7,

  // CodeLens
  "theNewFuse.features.codeLens.enabled": true,

  // Hover
  "theNewFuse.features.hover.enabled": true,
  "theNewFuse.features.hover.aiHints": false,

  // Completions
  "theNewFuse.features.completion.enabled": true,
  "theNewFuse.features.completion.triggerDelay": 1000,

  // Workspace Indexing
  "theNewFuse.features.workspaceIndexing.enabled": true,
  "theNewFuse.features.workspaceIndexing.autoIndex": true,

  // Git Integration
  "theNewFuse.features.git.enabled": true
}
```

---

## Troubleshooting

### CodeLens Not Showing

- Check: `theNewFuse.features.codeLens.enabled` is `true`
- Verify language is supported (see list above)
- Try reloading window: `Developer: Reload Window`

### Hover Not Working

- Check: `theNewFuse.features.hover.enabled` is `true`
- Verify hover works with built-in providers first
- Check Output panel: "The New Fuse" for errors

### Completions Too Slow

- Increase `theNewFuse.features.completion.triggerDelay`
- Disable if not needed: `theNewFuse.features.completion.enabled: false`
- Use faster models (e.g., GPT-5.1, Claude Sonnet 4.5)

### Workspace Indexing Stuck

- Check Output panel for errors
- Manually trigger: `theNewFuse.workspace.index`
- Disable if causing issues:
  `theNewFuse.features.workspaceIndexing.enabled: false`

### Git Integration Not Working

- Ensure Git extension is installed and enabled
- Open a folder that contains a Git repository
- Check: `theNewFuse.features.git.enabled` is `true`

---

## Architecture Notes

### Provider Registration

All providers are registered in `extension.ts`:

```typescript
function registerLanguageProviders(context: vscode.ExtensionContext): void {
  // CodeLens
  vscode.languages.registerCodeLensProvider({ language }, codeLensProvider);

  // Hover
  vscode.languages.registerHoverProvider({ language }, hoverProvider);

  // Completion
  vscode.languages.registerCompletionItemProvider(
    { language },
    completionProvider,
    '.',
    '(',
    '{',
    ' '
  );
}
```

### Service Initialization

Services are initialized on extension activation:

```typescript
async function initializeServices(): Promise<void> {
  // Workspace Indexing (background, non-blocking)
  const indexingService = getWorkspaceIndexingService();
  indexingService.initialize();

  // Git Integration
  const gitService = getGitIntegrationService();
  await gitService.initialize();
}
```

### Singleton Pattern

All services and providers use singleton pattern for efficiency:

```typescript
export class AICodeLensProvider {
  private static instance: AICodeLensProvider;

  public static getInstance(): AICodeLensProvider {
    if (!AICodeLensProvider.instance) {
      AICodeLensProvider.instance = new AICodeLensProvider();
    }
    return AICodeLensProvider.instance;
  }
}
```

---

## Performance Considerations

### Caching Strategy

- **Hover**: 5-minute cache per position
- **Completion**: 2-minute cache per line
- **Workspace Index**: Persistent until file changes

### Rate Limiting

- **Completion**: 1-second delay between triggers (configurable)
- **Hover AI Hints**: Disabled by default
- **CodeLens**: Only computed when visible

### Background Processing

- Workspace indexing runs in background
- Progress indicator shows status
- Cancellable by user

---

## Future Enhancements

### Planned Features

1. **Semantic Code Search**: Use embeddings for intelligent search
2. **Multi-file Refactoring**: Apply changes across multiple files
3. **Test Runner Integration**: Run tests directly from CodeLens
4. **Debug Integration**: Start debug sessions from AI suggestions
5. **Custom CodeLens**: User-defined CodeLens actions
6. **Smarter Completions**: Use workspace context for better suggestions

### Performance Improvements

1. **Incremental Indexing**: Only re-index changed symbols
2. **Lazy Loading**: Load providers on-demand
3. **Web Worker**: Move heavy processing off main thread
4. **Response Streaming**: Stream completions as they're generated

---

## Contributing

To add new features:

1. Create provider in `src/providers/`
2. Create service in `src/services/` (if needed)
3. Register in `src/extension.ts`
4. Add commands to `package.json`
5. Add configuration to `package.json`
6. Update this documentation

---

## Support

- **Issues**:
  [GitHub Issues](https://github.com/The-New-Fuse/vscode-extension/issues)
- **Documentation**:
  [Full Docs](https://github.com/The-New-Fuse/vscode-extension/tree/main/docs)
- **Community**: [Discord Server](https://discord.gg/thenewfuse)

---

**Last Updated:** 2026-01-26 **Version:** 9.2.0
