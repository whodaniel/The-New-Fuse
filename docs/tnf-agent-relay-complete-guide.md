# TNF Agent Communication Relay - Complete Guide

## Overview

The TNF Agent Communication Relay is a macOS application that enables AI agents to communicate across different environments in The New Fuse ecosystem. This application serves as a central hub for message routing between VS Code extensions, Chrome extensions, terminal applications, and Redis-connected agents.

## Installation Options

### Option 1: Using the Direct Shell Script (Recommended)

This is the simplest method that requires no user interaction with Script Editor:

1. Open Terminal
2. Navigate to the directory containing the files:
   ```bash
   cd /path/to/TNF-Agent-Relay
   ```
3. Run the direct creation script:
   ```bash
   ./create-tnf-relay-direct.sh
   ```
4. The application will be created on your Desktop automatically
5. When prompted, choose whether to open the application

### Option 2: Using the AppleScript Creator

1. Open Script Editor on macOS (found in /Applications/Utilities)
2. Open the `TNF-Agent-Relay-Creator.applescript` file
3. Click the Run button (the play icon) in the toolbar
4. Follow the prompts to create the application
5. Choose a location to save the application (e.g., Desktop or Applications folder)

### Option 3: Manual Installation

1. Open Script Editor on macOS (found in /Applications/Utilities)
2. Open the `TNF-Agent-Relay.applescript` file
3. Go to File > Export...
4. Set File Format to "Application"
5. Name it "TNF Agent Relay.app"
6. Choose a save location (e.g., Desktop or Applications folder)
7. Click Save

### Option 4: Using the Helper Shell Script

1. Open Terminal
2. Navigate to the directory containing the files
3. Run the helper script:
   ```bash
   ./create-tnf-relay-app.sh
   ```
4. This will open Script Editor with the creator script loaded
5. Click the Run button in Script Editor
6. Follow the prompts to create the application

## Usage Instructions

1. **Launch the Application**:
   - Double-click "TNF Agent Relay.app" to start the application

2. **Start the Relay**:
   - Click "Start/Stop" to start the relay service
   - The status will change from "Stopped" to "Running"

3. **Discover Agents**:
   - Click "Discover" to find available agents
   - The application will populate the agent registry with sample agents

4. **Send Messages**:
   - Click "Send Message"
   - Select an agent from the dropdown list
   - Choose a message type (code_review, refactoring, etc.)
   - Edit the message content if needed
   - Click "Send" to deliver the message

5. **View Message Logs**:
   - Click "Logs" to see a history of sent messages
   - The log shows the most recent messages with details about target, environment, and content

## Integration with The New Fuse Components

### VS Code Extension Integration

To make the relay accessible to agents within VS Code:

1. **File Watcher Implementation**:
   Add the following code to your VS Code extension:

   ```javascript
   const fs = require('fs');
   const path = require('path');
   const vscode = require('vscode');

   // Directory to watch for messages
   const VSCODE_MESSAGE_DIR = '/tmp/thefuse/vscode';

   // Ensure the directory exists
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

           // Process the message
           processMessage(message);

           // Optionally remove the file after processing
           fs.unlink(filePath, (err) => {
             if (err) console.error(`Error removing message file: ${err}`);
           });
         } catch (error) {
           console.error(`Error processing message: ${error}`);
         }
       });
     }
   });

   // Process incoming messages
   function processMessage(message) {
     // Handle different message types
     if (message.type === 'COLLABORATION_REQUEST') {
       const content = message.content;

       // Handle different action types
       switch (content.action) {
         case 'code_review':
           performCodeReview(content.context);
           break;
         case 'refactoring':
           performRefactoring(content.context);
           break;
         // Add more action handlers as needed
         default:
           console.log(`Unknown action type: ${content.action}`);
       }
     }
   }

   // Clean up watcher when extension is deactivated
   function deactivate() {
     if (watcher) {
       watcher.close();
     }
   }
   ```

2. **Sending Messages from VS Code**:
   Add a function to send messages to other agents:

   ```javascript
   function sendMessageToRelay(targetId, actionType, messageContent) {
     const timestamp = new Date().toISOString();
     const message = {
       type: 'COLLABORATION_REQUEST',
       source: 'vscode_extension',
       target: targetId,
       content: {
         action: actionType,
         ...messageContent
       },
       timestamp: timestamp
     };

     // Write message to the appropriate directory based on target environment
     const targetEnv = getTargetEnvironment(targetId);
     const messageFilename = `message_${Date.now()}.json`;
     const filePath = path.join(`/tmp/thefuse/${targetEnv}`, messageFilename);

     fs.writeFileSync(filePath, JSON.stringify(message, null, 2));
     return `Message sent to ${targetId} via ${targetEnv}`;
   }

   function getTargetEnvironment(targetId) {
     // This is a simple example - in a real implementation,
     // you would look up the environment from a registry
     if (targetId.startsWith('chrome_')) return 'chrome';
     if (targetId.startsWith('terminal_')) return 'terminal';
     return 'vscode'; // Default
   }
   ```

3. **VS Code Commands**:
   Register commands to interact with the relay:

   ```javascript
   context.subscriptions.push(
     vscode.commands.registerCommand('tnf.sendMessage', async () => {
       // Get target agent
       const targetId = await vscode.window.showQuickPick(
         ['chrome_agent_1', 'terminal_agent_1'],
         { placeHolder: 'Select target agent' }
       );
       if (!targetId) return;

       // Get message type
       const actionType = await vscode.window.showQuickPick(
         ['code_review', 'refactoring', 'documentation', 'custom'],
         { placeHolder: 'Select message type' }
       );
       if (!actionType) return;

       // Get message content
       const messageContent = await vscode.window.showInputBox({
         prompt: 'Enter message content (JSON format)',
         value: '{"task_type": "code_review", "priority": "medium"}'
       });
       if (!messageContent) return;

       try {
         const content = JSON.parse(messageContent);
         const result = sendMessageToRelay(targetId, actionType, content);
         vscode.window.showInformationMessage(result);
       } catch (error) {
         vscode.window.showErrorMessage(`Error sending message: ${error.message}`);
       }
     })
   );
   ```

### Terminal Agent Integration

To make the relay accessible to agents within the terminal:

1. **Bash Script for Monitoring**:
   Create a script to monitor for messages:

   ```bash
   #!/bin/bash
   # tnf-terminal-monitor.sh

   MESSAGE_DIR="/tmp/thefuse/terminal"

   # Ensure directory exists
   mkdir -p "$MESSAGE_DIR"

   echo "Starting TNF Terminal Agent monitor..."
   echo "Watching for messages in $MESSAGE_DIR"

   # Function to process messages
   process_message() {
     local file="$1"
     echo "Processing message: $file"

     # Read the message
     message=$(cat "$file")

     # Parse JSON (using jq if available, otherwise basic grep)
     if command -v jq &> /dev/null; then
       action=$(echo "$message" | jq -r '.content.action')
       task_type=$(echo "$message" | jq -r '.content.task_type')
       source=$(echo "$message" | jq -r '.source')
     else
       action=$(echo "$message" | grep -o '"action":[^,}]*' | cut -d':' -f2 | tr -d '"')
       task_type=$(echo "$message" | grep -o '"task_type":[^,}]*' | cut -d':' -f2 | tr -d '"')
       source=$(echo "$message" | grep -o '"source":[^,}]*' | cut -d':' -f2 | tr -d '"')
     fi

     echo "Received $action request ($task_type) from $source"

     # Handle different action types
     case "$action" in
       "command_execution")
         echo "Executing command..."
         # Extract and execute command (with proper security checks)
         ;;
       "system_analysis")
         echo "Performing system analysis..."
         # Run system analysis tools
         ;;
       *)
         echo "Unknown action type: $action"
         ;;
     esac

     # Remove the processed file
     rm "$file"
   }

   # Monitor directory for new files
   inotifywait_available=false
   if command -v inotifywait &> /dev/null; then
     inotifywait_available=true
     echo "Using inotifywait for file monitoring"

     inotifywait -m -e create "$MESSAGE_DIR" |
       while read -r directory events filename; do
         if [[ "$filename" == message_* && "$filename" == *.json ]]; then
           process_message "$MESSAGE_DIR/$filename"
         fi
       done
   else
     echo "inotifywait not available, falling back to polling"

     # Fallback to polling
     while true; do
       for file in "$MESSAGE_DIR"/message_*.json; do
         if [ -f "$file" ]; then
           process_message "$file"
         fi
       done
       sleep 1
     done
   fi
   ```

2. **Bash Function for Sending Messages**:
   Add this to your `.bashrc` or create a separate script:

   ```bash
   # Function to send messages via TNF Relay
   tnf_send_message() {
     local target_id="$1"
     local action_type="$2"
     local message_content="$3"

     # Determine target environment
     local target_env=""
     if [[ "$target_id" == chrome_* ]]; then
       target_env="chrome"
     elif [[ "$target_id" == vscode_* ]]; then
       target_env="vscode"
     else
       target_env="terminal"
     fi

     # Create message JSON
     local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
     local message="{
       \"type\": \"COLLABORATION_REQUEST\",
       \"source\": \"terminal_agent_1\",
       \"target\": \"$target_id\",
       \"content\": {
         \"action\": \"$action_type\",
         $message_content
       },
       \"timestamp\": \"$timestamp\"
     }"

     # Write to file
     local message_file="/tmp/thefuse/${target_env}/message_$(date +%s).json"
     echo "$message" > "$message_file"

     echo "Message sent to $target_id via $target_env (saved to $message_file)"
   }

   # Example usage:
   # tnf_send_message "vscode_agent_1" "code_review" '"task_type": "code_review", "context": {"file": "example.js"}, "priority": "medium"'
   ```

## Troubleshooting

### Common Issues and Solutions

1. **Permission Denied When Running Scripts**:
   ```bash
   chmod +x create-tnf-relay-direct.sh
   chmod +x create-tnf-relay-app.sh
   chmod +x tnf-terminal-monitor.sh
   ```

2. **Error Creating Application**:
   If you encounter path-related errors when creating the application, try using the direct shell script method which handles paths more reliably.

3. **Messages Not Being Detected**:
   - Ensure the relay application is running and in "Running" state
   - Check that the `/tmp/thefuse/` directories exist and have proper permissions
   - Verify that your file watchers are correctly configured

4. **AppleScript Errors**:
   If you encounter AppleScript errors, try running the script in Script Editor with the Event Log visible (View > Show Event Log) to see detailed error messages.

### Common AppleScript Fixes

1. **Conditional Expressions in String Concatenation**:

   If you encounter syntax errors with conditional expressions in string concatenation:

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

2. **Path Handling Issues**:

   If you encounter issues with path concatenation:

   **Problem:**
   ```applescript
   set appPath to saveLocation & "TNF Agent Relay.app"
   do shell script "osacompile -o " & quoted form of POSIX path of appPath & " " & quoted form of POSIX path of tempScriptFile
   ```

   **Solution:**
   ```applescript
   set saveLocationPOSIX to POSIX path of saveLocation
   set appName to "TNF Agent Relay.app"
   set appPathPOSIX to saveLocationPOSIX & appName
   do shell script "osacompile -o " & quoted form of appPathPOSIX & " " & quoted form of POSIX path of tempScriptFile
   ```

3. **Application Verification Issues**:

   If you encounter issues verifying the application exists:

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

## Advanced Integration

### Redis Integration

For more reliable message delivery, you can extend the relay to use Redis:

1. **Install Redis**:
   ```bash
   brew install redis
   ```

2. **Start Redis Server**:
   ```bash
   redis-server
   ```

3. **Modify Your Agent Code**:
   Add Redis client libraries to your agents and subscribe to appropriate channels.

### MCP Server Integration

To integrate with the Model Context Protocol server:

1. **Register with MCP Server**:
   ```javascript
   const axios = require('axios');

   async function registerWithMCPServer() {
     const mcpServerURL = 'http://localhost:3000/mcp';
     const registrationPayload = {
       type: 'MCP_SERVER_REGISTRATION',
       source: 'vscode_agent_1',
       target: 'mcp_server',
       content: {
         agent_id: 'vscode_agent_1',
         server_details: {
           endpoint: 'http://localhost:8000/vscode',
           protocol_version: '1.0',
           transport: 'http_json_rpc'
         },
         provided_tools: [
           {
             name: 'code_review',
             description: 'Reviews code for issues and improvements',
             parameters: {
               file: 'string',
               focus_areas: 'array'
             }
           }
         ]
       }
     };

     try {
       const response = await axios.post(mcpServerURL + '/register', registrationPayload);
       return response.data;
     } catch (error) {
       console.error('Error registering with MCP server:', error);
       throw error;
     }
   }
   ```

## Security Considerations

1. **Message Validation**:
   Always validate incoming messages before processing them to prevent injection attacks.

2. **Restricted Command Execution**:
   When executing commands from messages, use a whitelist approach and run in a restricted environment.

3. **Authentication**:
   For production use, implement authentication between agents and the relay.

## License

This project is part of The New Fuse and is subject to the same licensing terms.
