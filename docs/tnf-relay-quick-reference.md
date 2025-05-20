# TNF Agent Communication Relay - Quick Reference

This quick reference guide provides essential information for creating, using, and troubleshooting the TNF Agent Communication Relay.

## Creating the Relay Application

### Option 1: Direct Shell Script (Fastest Method)

```bash
# Make the script executable
chmod +x create-tnf-relay-direct.sh

# Run the script
./create-tnf-relay-direct.sh

# When prompted, type 'y' to open the application
```

### Option 2: AppleScript Creator

```bash
# Open Script Editor
open -a "/Applications/Utilities/Script Editor.app" TNF-Agent-Relay-Creator.applescript

# Click the Run button in Script Editor
# Follow the prompts
```

### Option 3: Manual Export

```bash
# Open Script Editor
open -a "/Applications/Utilities/Script Editor.app" TNF-Agent-Relay.applescript

# In Script Editor:
# 1. Go to File > Export...
# 2. Set File Format to "Application"
# 3. Name it "TNF Agent Relay.app"
# 4. Choose a save location
# 5. Click Save
```

## Common AppleScript Fixes

### Fix 1: Conditional in String Concatenation

**Problem:**
```applescript
set mainText to return & "Status: " & (if isRunning then "Running" else "Stopped") & return
```

**Solution:**
```applescript
set statusText to "Running"
if not isRunning then
    set statusText to "Stopped"
end if
set mainText to return & "Status: " & statusText & return
```

### Fix 2: Path Handling

**Problem:**
```applescript
set appPath to saveLocation & "TNF Agent Relay.app"
```

**Solution:**
```applescript
set saveLocationPOSIX to POSIX path of saveLocation
set appName to "TNF Agent Relay.app"
set appPathPOSIX to saveLocationPOSIX & appName
```

### Fix 3: Application Verification

**Problem:**
```applescript
tell application "System Events"
    if exists appPath then
        return true
    else
        return false
    end if
end tell
```

**Solution:**
```applescript
try
    do shell script "test -d " & quoted form of appPathPOSIX
    return true
on error
    return false
end try
```

## Verification Commands

```bash
# Check if the application was created
ls -la ~/Desktop/TNF\ Agent\ Relay.app

# Verify the required directories exist
ls -la /tmp/thefuse

# Check directory permissions
ls -la /tmp/thefuse/vscode
ls -la /tmp/thefuse/chrome
ls -la /tmp/thefuse/terminal

# Fix permissions if needed
chmod -R 755 /tmp/thefuse
```

## Using the Relay

### Essential Steps

1. **Start the Relay**
   - Click "Start/Stop" button
   - Verify status changes to "Running"

2. **Discover Agents**
   - Click "Discover" button
   - Verify "Discovered Agents" shows 3

3. **Send a Message**
   - Click "Send Message"
   - Select an agent
   - Choose a message type
   - Edit content if needed
   - Click "Send"

4. **View Message Log**
   - Click "Logs" button

### Checking Messages

```bash
# List all messages for VS Code agents
ls -la /tmp/thefuse/vscode

# View a specific message
cat /tmp/thefuse/vscode/message_*.json

# Monitor for new messages
watch -n 1 "ls -la /tmp/thefuse/vscode"
```

## Quick Terminal Integration

### Send a Test Message from Terminal

```bash
# Send a message to a VS Code agent
echo '{
  "type": "COLLABORATION_REQUEST",
  "source": "terminal_test",
  "target": "vscode_agent_1",
  "content": {
    "action": "code_review",
    "task_type": "code_review",
    "priority": "medium"
  },
  "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
}' > /tmp/thefuse/vscode/message_$(date +%s).json
```

### Monitor for Messages in Terminal

```bash
# Using inotifywait (if available)
inotifywait -m -e create /tmp/thefuse/terminal |
  while read -r directory events filename; do
    if [[ "$filename" == message_* && "$filename" == *.json ]]; then
      echo "New message received: $filename"
      cat "/tmp/thefuse/terminal/$filename"
    fi
  done

# Using polling (fallback)
while true; do
  for file in /tmp/thefuse/terminal/message_*.json; do
    if [ -f "$file" ]; then
      echo "Processing message: $file"
      cat "$file"
      rm "$file"
    fi
  done
  sleep 1
done
```

## Quick VS Code Integration

### Add to package.json

```json
"commands": [
  {
    "command": "tnf.sendMessage",
    "title": "TNF: Send Message to Agent"
  },
  {
    "command": "tnf.viewMessageLog",
    "title": "TNF: View Message Log"
  }
]
```

### Minimal File Watcher

```javascript
const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

const VSCODE_MESSAGE_DIR = '/tmp/thefuse/vscode';

// Ensure directory exists
if (!fs.existsSync(VSCODE_MESSAGE_DIR)) {
  fs.mkdirSync(VSCODE_MESSAGE_DIR, { recursive: true });
}

// Set up file watcher
const watcher = fs.watch(VSCODE_MESSAGE_DIR, (eventType, filename) => {
  if (eventType === 'rename' && filename.startsWith('message_') && filename.endsWith('.json')) {
    const filePath = path.join(VSCODE_MESSAGE_DIR, filename);
    
    // Read the message file
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error(`Error reading message file: ${err}`);
        return;
      }
      
      try {
        // Parse the message
        const message = JSON.parse(data);
        
        // Show notification
        vscode.window.showInformationMessage(
          `Received ${message.content.action} request from ${message.source}`
        );
        
        // Remove the file after processing
        fs.unlink(filePath, (err) => {
          if (err) console.error(`Error removing message file: ${err}`);
        });
      } catch (error) {
        console.error(`Error processing message: ${error}`);
      }
    });
  }
});
```

## Troubleshooting

### Application Creation Issues

1. **Syntax Errors**
   - Open in Script Editor to see detailed errors
   - Check for conditional expressions in string concatenation
   - Verify quotes and escaping in string literals

2. **Permission Issues**
   ```bash
   chmod +x TNF-Agent-Relay.applescript
   chmod +x create-tnf-relay-direct.sh
   ```

3. **Path Issues**
   - Use POSIX paths for shell commands
   - Use quoted form for paths with spaces

### Message Delivery Issues

1. **Directory Issues**
   ```bash
   mkdir -p /tmp/thefuse/vscode
   mkdir -p /tmp/thefuse/chrome
   mkdir -p /tmp/thefuse/terminal
   chmod -R 755 /tmp/thefuse
   ```

2. **Relay Not Running**
   - Ensure the relay is in "Running" state
   - Click "Start/Stop" to toggle if needed

3. **Message Format Issues**
   - Verify JSON syntax is valid
   - Check that required fields are present
   - Ensure timestamp is in ISO format
