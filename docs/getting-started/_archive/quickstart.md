# The New Fuse - Quick Start Guide

## Getting Started with The New Fuse in VS Code

### Running the Extension

1. Open your terminal and navigate to the project root directory:

   ```bash
   cd .
   ```

2. Run the start script to launch VS Code with the extension:

   ```bash
   ./start.sh
   ```

   If the script isn't executable, make it so first:

   ```bash
   chmod +x start.sh
   ```

### Accessing Commands in VS Code

#### Command Palette

1. Open the Command Palette with:
   - macOS: `Cmd+Shift+P` (⌘⇧P)
   - Windows/Linux: `Ctrl+Shift+P`

2. Type "The New Fuse" to see all available commands from the extension.

#### Status Bar

Look for these icons in the status bar at the bottom of VS Code:

- 🚀 (rocket) - Click to open The New Fuse
- 🤖 (robot) - Click to start AI Collaboration
- 📊 (list-tree) - Click to open the Command Center

### Troubleshooting Command Palette Issues

If commands don't appear in the Command Palette:

1. Try reloading the VS Code window:
   - Open Command Palette (`Cmd+Shift+P`)
   - Type "Developer: Reload Window" and press Enter

2. Alternatively, run the direct launch script:
   ```bash
   cd src/vscode-extension
   ./dev-mode-fix.sh
   ```

### Testing the Extension

1. Try the "Hello World" command:
   - Open Command Palette (`Cmd+Shift+P`)
   - Type "Hello from The New Fuse" and press Enter
   - You should see a notification message appear

2. Try AI Collaboration:
   - Click the 🤖 (robot) icon in the status bar
   - Select a task from the dropdown that appears

### Next Steps

Explore the Master Command Center which provides a visual interface to all the
extension's capabilities:

- Open Command Palette
- Type "Open Master Command Center" and press Enter
