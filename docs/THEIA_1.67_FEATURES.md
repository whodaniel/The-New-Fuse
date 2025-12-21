# SkIDEancer Theia IDE - Version 2.1.0

## Updated to Eclipse Theia 1.67 (December 2025)

This document outlines all the new features available in SkIDEancer after the upgrade to Theia 1.67.

---

## 🆕 New Features in Theia 1.67

### 1. Terminal Manager for Multiple Terminals

**What's New:** A new terminal-manager extension that enables managing multiple terminals within a single view.

**Features:**

- Split terminals vertically or horizontally
- Group terminals into pages
- Tree-based navigation panel
- Drag terminals between groups
- Rename terminals

**How to Enable:**

```json
{
  "terminal.grouping.mode": "tree"
}
```

Set to `"separate"` for traditional behavior.

---

### 2. Improved AI Onboarding Experience

**What's New:** First-time users now get helpful welcome screens guiding setup.

**States Covered:**

- When AI features are disabled
- When language models aren't configured
- When no default agent is selected

**Benefits:**

- Clear guidance on missing API keys
- Quick recommendations for agents like "Theia Coder"
- No more confusing automatic Orchestrator delegation

---

### 3. Claude Code Session Forking

**What's New:** Automatic session forking when editing previous requests in conversations.

**How It Works:**

1. You're in a chat with Claude
2. You edit a previous message
3. Theia automatically creates a fork (new branch)
4. Original conversation is preserved

**Use Case:** Try multiple approaches without losing context of initial attempts.

---

### 4. New Slash Commands

#### GitHub Integration Commands

| Command                          | Description                                             |
| -------------------------------- | ------------------------------------------------------- |
| `/analyze-gh-ticket <number>`    | Retrieves issue details and creates implementation plan |
| `/fix-gh-ticket <number>`        | Analyzes and implements the solution                    |
| `/address-gh-review <pr-number>` | Retrieves PR comments and implements changes            |

#### Remember Command

| Command             | Description                                  |
| ------------------- | -------------------------------------------- |
| `/remember`         | Extracts important context from chat history |
| `/remember <topic>` | Focus extraction on specific topic           |

The Remember command saves corrections, clarifications, and project-specific details for future AI interactions.

---

### 5. Debugging Improvements

#### Lazy Debug Variables

- Variables with "lazy" values (like getters) now show a resolve button (👁️)
- Click to fetch actual value
- Works in Variables view, Watch, Debug Console, and Hover

**Preference:**

```json
{
  "debug.autoExpandLazyVariables": true
}
```

#### Debug Toolbar Keybindings

- Keyboard shortcuts now visible in toolbar tooltips
- Step Over (F10), Step Into (F11), Continue (F5)

#### Breakpoint Management

- Inline edit/remove actions in Breakpoints view
- Works for all breakpoint types: data, function, instruction, source

#### Variables View State Preservation

- Expanded variables stay expanded when stepping through code
- Matches VS Code behavior

---

### 6. Updated LLM Support

#### New Default Models

| Provider  | Model           | Notes       |
| --------- | --------------- | ----------- |
| Anthropic | Claude Opus 4.5 | Now default |
| Google    | Gemini 3        | Newly added |
| OpenAI    | GPT 5.1         | Newly added |

#### Gemini Improvements

- Updated to `@google/genai` SDK v1.30.0
- Proper support for Gemini "thinking" feature
- Enable via `thinkingConfig.includeThoughts`

---

### 7. AI Configuration View Overhaul

- Improved UI consistency across all AI config screens
- Better handling of different window sizes
- More polished appearance for:
  - Agents view
  - Variables view
  - MCP Servers view
  - Token Usage view
  - Model Aliases view

---

### 8. Improved Code Editing Accuracy

The enhanced file replacer (experimental in 1.66) is now **default**.

**Benefits:**

- More accurate code changes from AI suggestions
- Reduced likelihood of misapplied edits
- Better handling of complex diff operations

---

## Additional Improvements

### VS Code Extension Compatibility

- Updated to VS Code API version **1.106.1**

### Timeline API

- Improved tooltips
- Icon support

### Icon Picker

- Better filtering
- Fixed infinite scrolling
- Updated codicons to v0.0.42

### Terminal Rendering

- WebGL support added
- Fixed cursor position with Chinese input methods

### Electron

- Fixed startup crashes on Ubuntu 25 (Wayland)

---

## SkIDEancer-Specific Features

In addition to Theia 1.67 features, SkIDEancer includes:

### AI Agent Extension (`@fuse/theia-ai-agent`)

| Feature              | Description                         |
| -------------------- | ----------------------------------- |
| Agent Service        | Memory system, conversation history |
| AI Flow Service      | Cascade-like graph workflows        |
| Code Analysis        | Security scanning, metrics          |
| Suggestion Processor | Multi-language suggestions          |
| Semantic Navigation  | Natural language code navigation    |
| Embedding Service    | Vector search                       |
| Related Info Service | Docs/commands lookup                |

### Integration with TNF

- Redis agent network connectivity
- Multi-agent workflow participation
- Shared context with other TNF components

---

## Configuration

### Default Preferences

All new 1.67 features are enabled by default in:

```
/defaults/preferences.json
```

### Key Settings

```json
{
  "terminal.grouping.mode": "tree",
  "ai.defaultAgent": "Theia Coder",
  "ai.enhancedFileReplacer": true,
  "ai.chat.enableSessionForking": true,
  "debug.autoExpandLazyVariables": true
}
```

---

## Upgrading

The IDE has been upgraded from Theia 1.59.0 to 1.67.0, which includes:

**New Packages Added:**

- `@theia/terminal-manager` - Multiple terminal management
- `@theia/ai-terminal` - AI-powered terminal assistance
- `@theia/ai-mcp` - Model Context Protocol support
- `@theia/ai-workspace-agent` - Workspace-aware AI
- `@theia/ai-code-completion` - Enhanced code completion
- `@theia/timeline` - File history timeline
- `@theia/keymaps` - Keybinding management
- `@theia/file-search` - Fast file search
- `@theia/mini-browser` - Embedded browser
- `@theia/task` - Task runner support
- `@theia/process` - Process management
- `@theia/property-view` - Property viewer
- `@theia/variable-resolver` - Variable support

---

## Resources

- [Theia 1.67 Release Notes](https://eclipsesource.com/blogs/2025/12/18/eclipse-theia-1-67-release-news-and-noteworthy/)
- [Theia AI Documentation](https://theia-ide.org/docs/user_ai/)
- [Slash Commands Guide](https://theia-ide.org/docs/user_ai/#slash-commands)
- [GitHub Milestone](https://github.com/eclipse-theia/theia/milestone/76?closed=1)

---

_Last Updated: December 21, 2025_
