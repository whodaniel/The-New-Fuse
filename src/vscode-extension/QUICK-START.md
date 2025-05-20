# The New Fuse - Quick Start Guide

## Trying the Inter-Extension Communication Now

1. **Open a new VS Code window** with the extension loaded:
   ```
   node launch-extension.js
   ```
   Or press F5 if you have the `.vscode/launch.json` configured.

2. **Open the example code file**:
   ```
   ./test/example-code.ts
   ```

3. **Try AI Collaboration features**:

   a. **Collaborative Code Analysis**:
      - Select the `findDuplicates` function in the example code
      - Right-click and select "Analyze Code Problem" from the context menu
      - Enter a problem description like "This function is inefficient and needs optimization"
      - Watch as multiple AI agents analyze the code from different perspectives

   b. **Collaborative Coding Task**:
      - Click the "$(code) AI Coding Team" button in the status bar
      - Enter a requirement like "Create a binary search tree implementation in TypeScript"
      - Select "TypeScript" as the language
      - Watch as different AI roles (Architect, Implementer, Tester, etc.) work together

   c. **Inter-Extension Communication**:
      - Open Command Palette (Ctrl+Shift+P or Cmd+Shift+P)
      - Type "Send Message via File Protocol"
      - Select a recipient (agent), enter an action and payload
      - The message will be sent through the file-based communication channel

   d. **Collaborative Completion**:
      - Click the "$(team) Collab: Off" button in the status bar to toggle on
      - Start typing code and see how completions are coordinated between agents

4. **View Available Agents**:
   - Open Command Palette
   - Type "Show AI Agents"
   - See which AI extensions have been detected

## Troubleshooting

- If you don't see AI agents in the list, try running "Discover AI Agents" from the command palette
- If the status bar icons aren't visible, try restarting VS Code with the extension loaded
- Check the "AI Coder Collaboration" and "Collaborative Completion" output channels for logs
