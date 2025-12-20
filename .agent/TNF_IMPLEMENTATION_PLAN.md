# TNF Comprehensive Implementation Plan

## Created: December 20, 2025

## Status: ACTIVE - Tasks In Progress

---

## 🎯 Critical Priority: UI Accessibility for Non-Technical Users

### Philosophy

> Every CLI command should have a corresponding UI button. Non-technical users
> should be able to use 100% of TNF features through the GUI.

---

## 📋 Task List

### ✅ COMPLETED TODAY

1. [x] Redis Agent Communication System (`scripts/tnf-agent-cli.cjs`)
2. [x] Agent conversation demo working over Redis
3. [x] Federation architecture documentation
4. [x] OAGI/Lux service for Tauri
       (`apps/tauri-desktop/src/services/OAGIService.ts`)

### 🔄 IN PROGRESS

5. [ ] Gemini/Claude CLI wrappers for Redis network
6. [ ] Rust backend commands for OAGI in Tauri
7. [ ] Orchestrator + Broker + Worker workflow demo
8. [ ] Theia IDE reintegration check
9. [ ] Terminal component for Tauri app
10. [ ] UI buttons for all CLI features

---

## 📦 Deliverable 1: CLI-to-Redis Wrappers

### Purpose

Allow Gemini CLI, Claude CLI, and Jules CLI to connect to the Redis agent
network.

### Files to Create

- `scripts/gemini-redis-wrapper.cjs` - Wraps Gemini CLI
- `scripts/claude-redis-wrapper.cjs` - Wraps Claude CLI
- `scripts/jules-redis-wrapper.cjs` - Wraps Jules async sessions

---

## 📦 Deliverable 2: OAGI Rust Backend

### Purpose

Add Rust commands for computer-use automation in Tauri.

### File to Create

- `apps/tauri-desktop/src-tauri/src/oagi.rs`

### Commands Needed

```rust
#[tauri::command]
fn capture_screen(format: String, quality: u8, region: Option<Region>) -> Result<String, String>

#[tauri::command]
fn execute_click(x: i32, y: i32, button: String) -> Result<(), String>

#[tauri::command]
fn execute_type(text: String, delay: u32) -> Result<(), String>

#[tauri::command]
fn execute_scroll(amount: i32, x: i32, y: i32) -> Result<(), String>

#[tauri::command]
fn execute_hotkey(keys: Vec<String>, interval: f32) -> Result<(), String>

#[tauri::command]
fn execute_drag(start_x: i32, start_y: i32, end_x: i32, end_y: i32, duration: f32) -> Result<(), String>
```

---

## 📦 Deliverable 3: Orchestration Demo

### Purpose

Demonstrate Orchestrator → Broker → Workers pattern.

### Script

`scripts/orchestration-demo.cjs`

### Flow

```
1. Antigravity (Orchestrator) assigns task to Gemini
2. Claude (Broker) manages timing
3. Gemini (Worker) analyzes code
4. Jules (Worker) implements changes
5. Results aggregated and reported
```

---

## 📦 Deliverable 4: Theia Integration

### Status Check

- Repository: `whodaniel/fuse-theia-ide`
- Railway Service: `tnf-theia-ide`
- URL: `https://tnf-theia-ide-production.up.railway.app`

### Tasks

1. [ ] Verify Railway deployment status
2. [ ] Add Theia button to Tauri dashboard
3. [ ] Add Theia button to Website
4. [ ] Check for latest Theia AI features (v1.59.0+)
5. [ ] Ensure TNF MCP servers connect to Theia

### Theia AI Packages (Already Configured)

- `@theia/ai-anthropic` - Claude integration
- `@theia/ai-chat` - Chat UI
- `@theia/ai-core` - Core AI features
- `@theia/ai-huggingface` - HuggingFace models
- `@theia/ai-ollama` - Local Ollama
- `@theia/ai-openai` - OpenAI/GPT

---

## 📦 Deliverable 5: Terminal in Tauri

### Purpose

Allow users to run commands within the Tauri app.

### File to Create

- `apps/tauri-desktop/src/components/Terminal.tsx`

### Features

- xterm.js integration
- Connect to system shell
- Run TNF CLI commands
- Output capture and display

---

## 📦 Deliverable 6: UI Button Dashboard

### Purpose

Every CLI command gets a button in the Tauri app.

### Commands to Add Buttons For

| CLI Command            | Button Label         | Location   |
| ---------------------- | -------------------- | ---------- |
| `tnf agent register`   | "Join Agent Network" | Dashboard  |
| `tnf agent list`       | "View Active Agents" | Dashboard  |
| `tnf convo start`      | "Start Conversation" | Chat Panel |
| `tnf orchestrate`      | "Run Workflow"       | Workflows  |
| `tnf modes list`       | "View AI Modes"      | Settings   |
| `tnf analysis run`     | "Analyze Code"       | Tools      |
| `tnf workspace search` | "AI Search"          | Search     |
| `tnf models manage`    | "Manage AI Models"   | Settings   |

### Quick Actions Panel

Create a "Quick Actions" panel with one-click buttons:

- 🤖 "Start AI Chat"
- 🔍 "Analyze Codebase"
- 🔄 "Sync with Agents"
- 📊 "View Dashboard"
- 🛠️ "Open Theia IDE"
- 🌐 "Open Website"
- 📱 "Connect Browser"

---

## 🔗 Integration Points

### Website → Tauri

- "Launch Desktop App" button
- Deep links: `tnf://action/...`

### Website → Theia

- "Open IDE" button
- URL: https://tnf-theia-ide-production.up.railway.app

### Tauri → Theia

- Embedded iframe option
- External link button
- Shared authentication

### Tauri → Redis Network

- Agent status widget
- Real-time updates
- Message feed

### All → Chrome Extension

- Federation channel sync
- Browser tab management
- AI chat integration

---

## 📊 Non-Technical User Experience Goals

### Principle 1: Zero CLI Required

Users should never need to open a terminal for basic features.

### Principle 2: Visual Everything

- Agent status: Color-coded cards
- Workflows: Drag-and-drop builder
- Settings: Form-based configuration

### Principle 3: One-Click Actions

- "Connect All Agents" - joins all available AIs
- "Run Full Analysis" - complete codebase review
- "Start Multi-AI Chat" - opens coordinated conversation

### Principle 4: Helpful Defaults

- Auto-connect to Redis on startup
- Auto-discover available agents
- Smart suggestions based on context

### Principle 5: Progressive Disclosure

- Basic features visible immediately
- Advanced features in expandable sections
- Expert mode toggle for power users

---

## 🚀 Implementation Order

### Today (Before Restart)

1. Create CLI wrappers for Gemini/Claude
2. Create orchestration demo script
3. Check Theia Railway status
4. Document next steps

### Next Session

5. Add OAGI Rust backend
6. Build Terminal component
7. Create Quick Actions UI
8. Add Theia integration buttons

### Future

9. Comprehensive UI overhaul
10. Full non-technical user testing
11. Documentation for all features
12. Video tutorials

---

## 📝 Notes

- Theia is in separate repo: `whodaniel/fuse-theia-ide`
- Railway service name: `tnf-theia-ide`
- Terminal in Tauri needs xterm.js and pty support
- OAGI features need native Rust bindings for mouse/keyboard

---

_This plan will be updated as tasks are completed._
