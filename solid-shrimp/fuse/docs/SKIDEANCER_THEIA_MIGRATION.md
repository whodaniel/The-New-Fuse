# SkIDEancer → SkIDEancer Migration Plan

**Date**: December 21, 2025  
**Source**: `/apps/SkIDEancer/SkIDEancer` (VS Code fork)  
**Target**: SkIDEancer IDE at `ide.thenewfuse.com`

---

## 1. Extracted Components from SkIDEancer

### Branding

| Item         | Source Path                                     | Migration Strategy            |
| ------------ | ----------------------------------------------- | ----------------------------- |
| Main Icon    | `resources/darwin/code.icns`                    | Convert to PNG/SVG for SkIDEancer  |
| Favicon      | `resources/server/favicon.ico`                  | Copy to SkIDEancer `lib/frontend/` |
| Server Icons | `resources/server/code-192.png`, `code-512.png` | Use for PWA manifest          |
| Linux Icon   | `resources/linux/code.png`                      | Convert for SkIDEancer             |

### Built-in Extensions (from product.json)

```json
[
  {
    "name": "ms-vscode.js-debug-companion",
    "version": "1.1.3",
    "purpose": "JavaScript debugging helper"
  },
  {
    "name": "ms-vscode.js-debug",
    "version": "1.95.3",
    "purpose": "Main JavaScript debugger"
  },
  {
    "name": "ms-vscode.vscode-js-profile-table",
    "version": "1.0.10",
    "purpose": "JS performance profiling"
  }
]
```

### Language Extensions (92 bundled)

**Programming Languages:**

- TypeScript/JavaScript (with LSP)
- Python
- Java
- C/C++
- C#
- Go
- Rust
- Ruby
- PHP
- Swift
- Dart
- Clojure
- CoffeeScript
- F#
- Groovy
- Julia
- Lua
- Perl
- PowerShell
- R
- Visual Basic

**Web Languages:**

- HTML (with LSP)
- CSS/SCSS/LESS (with LSP)
- JSON (with LSP)
- Markdown
- XML/YAML
- Docker
- Handlebars
- Pug

**Build Tools:**

- Git/Git Base
- GitHub Integration
- NPM
- Grunt/Gulp/Jake
- Emmet

**Themes (11 bundled):**

- Abyss
- Default Light/Dark
- Kimbie Dark
- Monokai / Monokai Dimmed
- QuietLight
- Red
- Seti (file icons)
- Solarized Light/Dark
- Tomorrow Night Blue

---

## 2. SkIDEancer Equivalent Extensions

### Already in SkIDEancer IDE

The current SkIDEancer deployment has built-in:

- ✅ Monaco Editor (same as VS Code)
- ✅ Git integration
- ✅ Terminal
- ✅ Debug support
- ✅ AI integrations (Anthropic, OpenAI, Ollama, HuggingFace)

### Extensions to Add via Open VSX

Add to `skideancer-ide/package.json`:

```json
{
  "idePlugins": {
    "vscode-builtin-typescript": "https://open-vsx.org/api/vscode/typescript-language-features/1.87.0/file/vscode.typescript-language-features-1.87.0.vsix",
    "vscode-builtin-javascript": "https://open-vsx.org/api/vscode/javascript/1.87.0/file/vscode.javascript-1.87.0.vsix",
    "vscode-builtin-python": "https://open-vsx.org/api/ms-python/python/2024.2.1/file/ms-python.python-2024.2.1.vsix",
    "vscode-builtin-html-language-features": "https://open-vsx.org/api/vscode/html-language-features/1.87.0/file/vscode.html-language-features-1.87.0.vsix",
    "vscode-builtin-css-language-features": "https://open-vsx.org/api/vscode/css-language-features/1.87.0/file/vscode.css-language-features-1.87.0.vsix",
    "vscode-builtin-json-language-features": "https://open-vsx.org/api/vscode/json-language-features/1.87.0/file/vscode.json-language-features-1.87.0.vsix",
    "vscode-builtin-markdown-language-features": "https://open-vsx.org/api/vscode/markdown-language-features/1.87.0/file/vscode.markdown-language-features-1.87.0.vsix",
    "vscode-eslint": "https://open-vsx.org/api/dbaeumer/vscode-eslint/2.4.4/file/dbaeumer.vscode-eslint-2.4.4.vsix",
    "vscode-prettier": "https://open-vsx.org/api/esbenp/prettier-vscode/10.1.0/file/esbenp.prettier-vscode-10.1.0.vsix",
    "vscode-docker": "https://open-vsx.org/api/ms-azuretools/vscode-docker/1.28.0/file/ms-azuretools.vscode-docker-1.28.0.vsix"
  }
}
```

---

## 3. Branding Migration

### Step 1: Copy Favicon

```bash
cp apps/SkIDEancer/SkIDEancer/resources/server/favicon.ico \
   skideancer-ide/lib/frontend/favicon.ico
```

### Step 2: Update SkIDEancer index.html

Add favicon and PWA metadata:

```html
<head>
  <link rel="icon" href="./favicon.ico" type="image/x-icon" />
  <link rel="apple-touch-icon" href="./code-192.png" />
  <meta name="theme-color" content="#1e1e1e" />
  <title>SkIDEancer - The New Fuse IDE</title>
</head>
```

### Step 3: Custom Branding Module

Create `skideancer-ide/custom-branding/`:

```typescript
// branding.ts
export const applicationName = 'SkIDEancer';
export const applicationTitle = 'SkIDEancer - The New Fuse';
export const welcomeMessage = 'Welcome to SkIDEancer AI-Powered IDE';
```

---

## 4. Default Settings Migration

Map VS Code settings to SkIDEancer preferences:

```json
{
  "editor.insertSpaces": false,
  "files.trimTrailingWhitespace": true,
  "editor.tabSize": 4,
  "editor.formatOnSave": true,
  "editor.minimap.enabled": true,
  "terminal.integrated.fontSize": 14,
  "workbench.colorTheme": "Default Dark+",
  "editor.fontFamily": "'Fira Code', Menlo, Monaco, 'Courier New', monospace",
  "editor.fontLigatures": true
}
```

---

## 5. Implementation Steps

### Phase 1: Quick Wins (Today)

1. ✅ SkIDEancer IDE is live at ide.thenewfuse.com
2. [ ] Add favicon from SkIDEancer resources
3. [ ] Update page title to "SkIDEancer"
4. [ ] Add PWA icons

### Phase 2: Core Extensions (This Week)

1. [ ] Add idePlugins to package.json
2. [ ] Bundle essential language features
3. [ ] Test TypeScript/JavaScript LSP
4. [ ] Test Python language support

### Phase 3: Theming & Branding (Next Week)

1. [ ] Port SkIDEancer themes
2. [ ] Create custom splash screen
3. [ ] Add custom welcome page
4. [ ] Implement branding module

### Phase 4: Advanced Features (Future)

1. [ ] Port custom UI modifications
2. [ ] Add remote development support
3. [ ] Integrate with TNF agent network
4. [ ] Add collaborative editing

---

## 6. Files to Copy

| From SkIDEancer                 | To SkIDEancer               | Purpose          |
| ------------------------------- | ---------------------- | ---------------- |
| `resources/server/favicon.ico`  | `lib/frontend/`        | Browser favicon  |
| `resources/server/code-192.png` | `lib/frontend/`        | PWA icon         |
| `resources/server/code-512.png` | `lib/frontend/`        | PWA splash       |
| `extensions/theme-monokai/`     | Custom SkIDEancer extension | Theme            |
| `.vscode/settings.json`         | SkIDEancer preferences      | Default settings |

---

## 7. Key Differences to Note

### What Works Automatically

- ✅ Monaco Editor (identical)
- ✅ LSP support (identical protocol)
- ✅ DAP debug support (identical protocol)
- ✅ Most VS Code extensions (via Open VSX)

### What Needs Custom Work

- ⚠️ Some Microsoft-specific extensions won't work (licensing)
- ⚠️ UI layout changes require SkIDEancer modules
- ⚠️ Custom keybindings may need adjustment

### SkIDEancer Advantages

- ✨ Native browser support (no Electron overhead for web)
- ✨ Built-in AI integrations
- ✨ Full customization without forking
- ✨ Easier long-term maintenance

---

## 8. Next Action

**Immediate**: Copy the favicon and branding assets to the SkIDEancer repo:

```bash
# Copy favicon to SkIDEancer
cp /path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/SkIDEancer/SkIDEancer/resources/server/favicon.ico /tmp/skideancer-ide/lib/frontend/

# Copy PWA icons
cp /path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/SkIDEancer/SkIDEancer/resources/server/code-*.png /tmp/skideancer-ide/lib/frontend/
```

Would you like me to execute this migration now?
