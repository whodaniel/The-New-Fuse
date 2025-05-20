# Troubleshooting Missing Commands

If you don't see The New Fuse commands in your Command Palette, follow these steps:

## 1. Verify Extension Activation

The extension must be properly activated before commands appear:

1. Open VS Code's **Output panel** (View > Output)
2. Select "The New Fuse" from the dropdown menu
3. Check for "Extension activated" message
4. If you don't see this, the extension hasn't loaded correctly

## 2. Force Extension Activation

Run these steps to ensure the extension activates:

1. Close VS Code completely
2. Open terminal and navigate to your extension directory:
   ```bash
   cd /Users/<owner>/Desktop/A1-Inter-LLM-Com/The\ New\ Fuse/src/vscode-extension
   ```
3. Run the direct launch script:
   ```bash
   ./quick-launch.sh
   ```
   Or manually launch:
   ```bash
   code --extensionDevelopmentPath="$(pwd)"
   ```

## 3. Manually Register Commands

If commands still don't appear, you can force-register them:

1. Open VS Code's built-in terminal (Terminal > New Terminal)
2. Run this command to activate The New Fuse:
   ```javascript
   vscode.commands.executeCommand('workbench.action.reloadWindow')
   ```
3. After reload, check the Command Palette again

## 4. Check Extension Logs

1. Open VS Code's Developer Tools:
   - macOS: ⌘⇧I (Cmd+Shift+I)
   - Windows/Linux: Ctrl+Shift+I
2. Look for errors related to The New Fuse extension
3. Error messages will help identify what's preventing activation

## 5. Common Issues

- **Missing Dependencies**: Ensure `npm install` completed successfully
- **Compilation Errors**: Check if TypeScript compiled correctly
- **Activation Events**: Ensure your package.json has correct activation events
- **Command Registration**: Commands must be properly registered in extension.ts
