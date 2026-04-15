# Roo Code VSCode Extension Mode Implementation

## 1. Introduction  
This document details how each Roo Code user‑selectable mode (“Orchestrator”, “Debug”, “Ask”, “Architect”, “Code”) is implemented, and provides instructions for achieving full parity in The New Fuse VSCode extension.

## 2. Contributes & Commands  
In `packages/vscode-extension/package.json` under `contributes.commands`:
```json
"contributes": {
  "commands": [
    { "command": "thefuse.selectMode", "title": "Select Roo Mode" },
    { "command": "thefuse.mode.orchestrator", "title": "Orchestrator Mode" },
    { "command": "thefuse.mode.debug",        "title": "Debug Mode" },
    { "command": "thefuse.mode.ask",          "title": "Ask Mode" },
    { "command": "thefuse.mode.architect",    "title": "Architect Mode" },
    { "command": "thefuse.mode.code",         "title": "Code Mode" }
  ]
}
```

## 3. Context Keys & Menus  
Define context key `thefuse.currentMode` via `commands.executeCommand('setContext', 'thefuse.currentMode', mode)`.  
In `menus.commandPalette`:
```json
{ "command":"thefuse.mode.orchestrator","when":"thefuse.currentMode != orchestrator" },
// repeat for debug, ask, architect, code
```

## 4. Activation & Initialization  
In `packages/vscode-extension/src/extension.ts` `activate(context)`:
- Create OutputChannel (`window.createOutputChannel('The New Fuse')`)  
- Instantiate `LLMProviderManager`, `MonitoredLLMProviderManager`, `FuseMonitoringClient`  
- Initialize `VscodeToolIntegration`, MCP integration, `AnthropicXmlProvider`  
- Call `registerCommands(context, ...)`  
- Create LLM status bar item (`createLLMStatusBarItem`)

## 5. registerCommands Implementation  
In `src/extension.ts`:
```ts
context.subscriptions.push(
  commands.registerCommand('thefuse.mode.orchestrator', () => setMode('orchestrator')),
  // debug, ask, architect, code
);
```
Function `setMode(mode: string)` updates `globalState` and executes `setContext`.

## 6. Internal Routing  
In `packages/vscode-extension/src/command-monitor.ts`:
- Subscribe to `commands.onDidExecuteCommand`  
- Read `thefuse.currentMode`  
- Delegate to handlers:
  ```ts
  switch (currentMode) {
    case 'orchestrator': OrchestratorHandler.handle(cmd); break;
    case 'debug':        DebugHandler.handle(cmd);        break;
    case 'ask':          AskHandler.handle(cmd);          break;
    case 'architect':    ArchitectHandler.handle(cmd);    break;
    case 'code':         CodeHandler.handle(cmd);         break;
  }
  ```
Handlers located in `src/modes/<mode>Handler.ts`.

## 7. UI Contributions  
In `package.json`:
```json
"viewsContainers": {
  "activitybar":[
    { "id":"thefuse-sidebar","title":"Roo","icon":"resources/fusion-icon.svg" }
  ]
},
"views": {
  "thefuse-sidebar":[
    { "id":"thefuse.orchestratorView","name":"Orchestrator" },
    { "id":"thefuse.debugView","name":"Debug" },
    { "id":"thefuse.askView","name":"Ask" },
    { "id":"thefuse.architectView","name":"Architect" },
    { "id":"thefuse.codeView","name":"Code" }
  ]
}
```
Register each view via `window.registerWebviewViewProvider(viewType, provider)` in `activate()`.

## 8. Implementing Parity in “The New Fuse”  
1. Copy the above `commands`, `menus`, and `views` sections into `packages/vscode-extension/package.json`.  
2. Create `src/command-monitor.ts` with `setMode` logic and `onDidExecuteCommand` routing.  
3. Add mode handlers under `src/modes/*Handler.ts`.  
4. Register the mode commands and status bar in `src/extension.ts`.  
5. Define view providers under `src/views/*ViewProvider.ts` and register in `activate`.  
6. Use `commands.executeCommand('setContext','thefuse.currentMode',mode)` for context switching.  
7. Add `when` clauses on UI contributions to bind visibility to `thefuse.currentMode`.  

> This document ensures complete parity for Roo Code modes in The New Fuse VSCode extension.

*End of Report*