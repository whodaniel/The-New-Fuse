# TNF Agent Communication Relay - Practical Guide

This document provides practical, hands-on information about creating and using the TNF Agent Communication Relay, based on actual implementation experience.

## Creating the Relay Application

### Common AppleScript Issues and Solutions

When creating the TNF Agent Communication Relay application, you might encounter some AppleScript syntax issues. Here are common problems and their solutions:

1. **Conditional Expressions in String Concatenation**

   **Problem:**
   ```applescript
   -- This will cause a syntax error
   set mainText to return & "Status: " & (if isRunning then "Running" else "Stopped") & return
   ```

   **Solution:**
   ```applescript
   -- Use a separate variable for the conditional part
   set statusText to "Running"
   if not isRunning then
       set statusText to "Stopped"
   end if
   set mainText to return & "Status: " & statusText & return
   ```

2. **Path Handling Issues**

   **Problem:**
   ```applescript
   -- This can cause issues with path concatenation
   set appPath to saveLocation & "TNF Agent Relay.app"
   do shell script "osacompile -o " & quoted form of POSIX path of appPath & " " & quoted form of POSIX path of tempScriptFile
   ```

   **Solution:**
   ```applescript
   -- Convert to POSIX path first, then concatenate
   set saveLocationPOSIX to POSIX path of saveLocation
   set appName to "TNF Agent Relay.app"
   set appPathPOSIX to saveLocationPOSIX & appName
   do shell script "osacompile -o " & quoted form of appPathPOSIX & " " & quoted form of POSIX path of tempScriptFile
   ```

3. **Application Verification Issues**

   **Problem:**
   ```applescript
   -- This can fail due to path handling issues
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
   -- Use shell command to verify existence
   try
       do shell script "test -d " & quoted form of appPathPOSIX
       return true
   on error
       return false
   end try
   ```

### Verification Steps After Creation

After creating the TNF Agent Communication Relay application, it's important to verify that everything is set up correctly:

1. **Check Application Creation**
   ```bash
   # Verify the application exists
   ls -la ~/Desktop/TNF\ Agent\ Relay.app
   ```

2. **Verify Directory Structure**
   ```bash
   # Check that the required directories were created
   ls -la /tmp/thefuse
   ```

3. **Check Directory Permissions**
   ```bash
   # Ensure directories have proper permissions
   ls -la /tmp/thefuse/vscode
   ls -la /tmp/thefuse/chrome
   ls -la /tmp/thefuse/terminal
   ```

4. **Fix Permissions if Needed**
   ```bash
   # If you encounter permission issues
   chmod -R 755 /tmp/thefuse
   ```

## Using the Relay Application

### Starting the Application

When you first open the TNF Agent Communication Relay application, you'll see a dialog with the following information:
- Status: Stopped
- Relay ID: (a unique identifier)
- Discovered Agents: 0

### Important First Steps

1. **Start the Relay**
   - Click the "Start/Stop" button first
   - Verify that the status changes to "Running"
   - This step is crucial - messages cannot be sent when the relay is stopped

2. **Discover Agents**
   - Click the "Discover" button
   - You should see a confirmation that 3 agents were discovered
   - This populates the agent registry with sample agents

3. **Check Agent Registry**
   - After discovering agents, the "Discovered Agents" count should be 3
   - These include a VS Code agent, Chrome agent, and Terminal agent

### Sending Your First Message

1. Click "Send Message"
2. Select an agent from the dropdown (e.g., "VS Code Agent (vscode_agent_1)")
3. Choose a message type (e.g., "code_review")
4. Review and edit the message content if needed
5. Click "Send"
6. You should see a confirmation dialog showing where the message was saved

### Verifying Message Delivery

After sending a message, you can verify it was delivered by:

1. **Checking the Message Log**
   - Click the "Logs" button in the relay application
   - You should see your recently sent message

2. **Examining the Message File**
   ```bash
   # For a message sent to the VS Code agent
   ls -la /tmp/thefuse/vscode
   cat /tmp/thefuse/vscode/message_*.json
   ```

## Troubleshooting

### Application Won't Start

If the application won't start or crashes immediately:

1. **Check AppleScript Syntax**
   - Open the TNF-Agent-Relay.applescript file in Script Editor
   - Look for any syntax errors highlighted by the editor
   - Pay special attention to conditional expressions and string concatenation

2. **Verify Script Permissions**
   ```bash
   chmod +x TNF-Agent-Relay.applescript
   chmod +x create-tnf-relay-direct.sh
   ```

3. **Check for Console Errors**
   - Open Console.app on macOS
   - Look for errors related to "TNF Agent Relay" or "osacompile"

### Messages Not Being Delivered

If messages aren't being delivered properly:

1. **Check Directory Existence**
   ```bash
   # Ensure directories exist
   mkdir -p /tmp/thefuse/vscode
   mkdir -p /tmp/thefuse/chrome
   mkdir -p /tmp/thefuse/terminal
   ```

2. **Verify File Permissions**
   ```bash
   # Set permissions to allow reading and writing
   chmod -R 755 /tmp/thefuse
   ```

3. **Check Message Format**
   - Examine a saved message file to ensure it has the correct format
   - Verify that the JSON is valid and follows the A2A protocol

4. **Ensure Relay is Running**
   - The relay must be in "Running" state (not "Stopped")
   - If in doubt, click "Start/Stop" to toggle the state

## Integration Tips

### For Terminal Agents

When integrating with terminal agents, remember:

1. **File Naming Convention**
   - Message files must start with "message_" and end with ".json"
   - Example: `message_1621234567.json`

2. **Monitoring Best Practices**
   - Use `inotifywait` for efficient file monitoring when available
   - Fall back to polling only if necessary
   - Process and remove message files after handling them

3. **Sending Messages from Bash**
   ```bash
   # Quick one-liner to send a test message
   echo '{"type":"COLLABORATION_REQUEST","source":"terminal_test","target":"vscode_agent_1","content":{"action":"code_review","task_type":"code_review","priority":"medium"},"timestamp":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}' > /tmp/thefuse/vscode/message_$(date +%s).json
   ```

### For VS Code Agents

When integrating with VS Code:

1. **Extension Activation**
   - Set up the file watcher during extension activation
   - Create the directories if they don't exist

2. **Status Bar Integration**
   - Add a status bar item to show the relay connection status
   - Use icons to indicate active/inactive state

3. **Command Registration**
   - Register commands with descriptive names (e.g., "TNF: Send Message")
   - Add keyboard shortcuts for frequently used commands

## Performance Considerations

1. **File Cleanup**
   - Regularly clean up processed message files
   - Consider implementing an automatic cleanup mechanism

2. **Monitoring Overhead**
   - File system watchers have minimal overhead
   - Polling can be resource-intensive; use appropriate intervals

3. **Message Size**
   - Keep messages reasonably sized (under 100KB)
   - For larger data, consider using references or splitting into multiple messages

## Security Considerations

1. **Directory Permissions**
   - Use the minimum necessary permissions for the /tmp/thefuse directories
   - Consider using a more secure location for production use

2. **Message Validation**
   - Always validate incoming messages before processing
   - Implement schema validation for message content

3. **Command Execution**
   - Never execute commands directly from received messages
   - Use a whitelist approach for any command execution

4. **Sensitive Data**
   - Avoid including sensitive data in messages
   - Consider implementing message encryption for sensitive content
