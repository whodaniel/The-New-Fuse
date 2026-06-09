# Findings – TNF CLI Slash‑Command Autocomplete

## **1. Command Registry & Slash-Command Implementation**

### **Key Files Identified**
- **`/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/tnf-cli/src/cli.ts`**
  - **`cli.ts:124`**: `Total OpenClaw top-level commands: ${chalk.cyan(String(report.totalOpenClawTopLevelCommands))}`
  - Suggests **TNF CLI inherits from OpenClaw**, which has its own slash-command system.

- **`/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/external/gemini-cli-source/packages/cli/src/utils/commands.ts`**
  - **`commands.ts`**: Defines `slashCommands` array (e.g., `/help`, `/exit`, `/clear`).
  - **`commands.ts:34`**: `export const slashCommands: Command[] = [...]`

- **`/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/external/gemini-cli-source/packages/cli/src/ui/hooks/useSlashCompletion.ts`**
  - **`useSlashCompletion.ts`**: React hook that **triggers dropdown on `/` keypress**.
  - **`useSlashCompletion.ts:14`**: `const handleInputChange = (input: string) => { if (input.startsWith("/")) setShowSuggestions(true); };`

- **`/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/external/gemini-cli-source/packages/cli/src/ui/components/SuggestionsDisplay.tsx`**
  - **`SuggestionsDisplay.tsx`**: Renders the dropdown menu (Ink/React).

---

## **2. Root Cause Analysis**

### **Why the Dropdown is Missing**
1. **TNF CLI Does Not Import `useSlashCompletion`**
   - The **Gemini CLI** (`gemini-cli-source`) has the slash-command logic, but **TNF CLI does not load it**.
   - TNF CLI likely uses a minimal subset of Gemini CLI features.

2. **`SuggestionsDisplay` Component Not Mounted**
   - The dropdown is a React component (`<SuggestionsDisplay>`).
   - If the parent component (`<App>`) does not render it, the dropdown is invisible.

3. **Keybinding `/` Not Bound in TNF**
   - The `onInput` handler in GemIni CLI triggers `setShowSuggestions(true)` on `/`.
   - TNF CLI may not bind `/` to any handler.

---

## **3. Immediate Fix Strategy**

### **Option A: Import Gemini CLI Slash-Command Logic**
| Pros | Cons |
|------|------|
| Quick to implement | Adds dependency on Gemini CLI codebase |
| Reuses tested code | May introduce unwanted Gemini CLI behaviors |
| Dropdown works instantly | |

### **Option B: Reimplement Dropdown in TNF CLI**
| Pros | Cons |
| Clean TNF-specific design | More work |
| No external dependencies | |

### **Decision: Option A (Import Logic)**
- **Fastest path to restore functionality.**
- **TNF already inherits from OpenClaw/Gemini**, so this minimizes new dependencies.

---

## **4. Fix Plan (Implementation)**

### **Step 1: Load Slash Commands**
- Import `slashCommands` from `gemini-cli-source`.
- Add to TNF CLI’s `commands` registry.

### **Step 2: Mount `<SuggestionsDisplay>`**
- Add `<SuggestionsDisplay>` to TNF CLI’s `<App>` component.
- Ensure it receives `slashCommands` as props.

### **Step 3: Bind `/` Key**
- Add `onKeyPress`/`onInput` handler in TNF CLI to trigger `useSlashCompletion`.
- Mirror Gemini CLI’s `handleInputChange` logic.

### **Step 4: Rebuild & Test**
- Rebuild TNF CLI (`pnpm build:cli`).
- Test `/` key → dropdown appears.

---

## **5. Verification**
- **Test:** `
  tnf cli
  Type `/` → verify dropdown appears.
  Navigate menu → verify commands execute.
`

---

## **6. Files to Modify**
| File | Change |
|------|--------|
| `packages/tnf-cli/src/cli.ts` | Import `slashCommands`; bind `/` key |
| `packages/tnf-cli/src/ui/App.tsx` | Mount `<SuggestionsDisplay>` |
| `packages/tnf-cli/package.json` | Ensure `@gemini-cli` dependencies |

---