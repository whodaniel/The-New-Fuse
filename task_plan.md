# Task Plan – TNF CLI Slash‑Command Autocomplete

## Goal
Make the TNF CLI present a drop-down menu of available slash-commands when the user types `/` in an interactive terminal session.

## Phase Overview

| Phase          | Objective                                      | Success Criteria                                      |
|----------------|------------------------------------------------|-------------------------------------------------------|
| **ANALYSIS**   | Discover why the menu is not appearing.        | Identify missing config, code path, or environment limitation. |
| **PLANNING**   | Draft a concrete fix plan (code change, config update, dependency). | Plan approved, all steps enumerated. |
| **SOLUTIONING**| Design the implementation (CLI UI library, command registry). | Design reviewed, no open questions. |
| **IMPLEMENTATION** | Apply code changes, update docs, run tests.  | CLI shows menu; all tests pass. |
| **VERIFICATION**   | Confirm fix works, document pitfalls, update handoff log. | Menu appears reliably; persistent artifacts updated. |

---

## **ANALYSIS Phase**

### **Step 1: Locate the Command Registry**
- **Action:** Find the file(s) defining the slash-commands.
- **Command:** `find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "slash\|commands\|CommandPalette"`
- **Expected:** Paths like `src/cli.ts`, `src/commands.ts`, or `src/components/CommandPalette.tsx`.

### **Step 2: Verify Keybinding (`/`)**
- **Action:** Confirm `/` is bound to open the dropdown.
- **Command:** `grep -r "onKeyPress\|onInput\|keymap\|/" --include="*.ts" --include="*.tsx" .`
- **Expected:** Handler like `handleSlashKey` or `toggleCommandPalette`.

### **Step 3: Confirm CommandPalette Mounting**
- **Action:** Ensure the React/Ink component is rendered.
- **Command:** `find . -name "App.tsx" -o -name "App.ts" | xargs grep -l "CommandPalette"`
- **Expected:** `<CommandPalette>` appears in the component tree.

### **Step 4: Review Terminal Session State**
- **Action:** Check if session state contains slash-command metadata.
- **Command:** `cat ~/.tnf/session.json | jq '.slashCommands'`
- **Expected:** Non-empty array (e.g., `[{name: "help", description: "Show help"}]`).

### **Step 5: Check for Build Compilation Issues**
- **Action:** Rebuild the CLI and test for stale JS.
- **Command:** `cd ~/Desktop/A1-Inter-LLM-Com/The-New-Fuse && pnpm build:cli`
- **Expected:** Fresh `dist/cli.js` with no errors.

--- 

## **PLANNING Phase**
- **Outcome:** Prioritized list of fixes (e.g., `bindKey('/')`, `loadCommands()`, `mount <CommandPalette>`).

---

## **SOLUTIONING Phase**
- **Design:** Patch the CLI to ensure:
  1. **Slash‑commands** are registered at startup.
  2. **Keybinding `/`** triggers the dropdown.
  3. **`CommandPalette`** is always mounted.

---

## **IMPLEMENTATION Phase**
- **PR**: One commit, message: `fix(cli): restore slash-command autocomplete dropdown`.

---

## **VERIFICATION Phase**
1. Open a new TNF CLI session.
2. Type `/` → verify dropdown appears.
3. Navigate menu with arrow keys → verify commands execute.

---