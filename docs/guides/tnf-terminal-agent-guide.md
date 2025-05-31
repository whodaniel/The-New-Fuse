# TNF Terminal Agent Integration Guide

This guide provides detailed instructions for integrating terminal-based AI agents with the TNF Agent Communication Relay.

## Overview

Terminal-based agents can communicate with other agents in The New Fuse ecosystem by:
1. Monitoring the `/tmp/thefuse/terminal/` directory for incoming messages
2. Writing messages to the appropriate environment directories for outgoing messages

## Setup

### Prerequisites

- macOS 10.14 or newer
- Bash or Zsh shell
- TNF Agent Communication Relay installed and running

### Directory Structure

The relay uses these directories for message exchange:
```
/tmp/thefuse/
├── vscode/     # Messages for VS Code agents
├── chrome/     # Messages for Chrome extension agents
└── terminal/   # Messages for terminal-based agents
```

## Monitoring for Messages

### Option 1: Using inotifywait (Recommended)

First, install `inotify-tools` if not already available:
```bash
brew install inotify-tools
```

Create a monitoring script (`tnf-terminal-monitor.sh`):
```bash
#!/bin/bash

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
  
  # Parse JSON (using jq if available)
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
inotifywait -m -e create "$MESSAGE_DIR" |
  while read -r directory events filename; do
    if [[ "$filename" == message_* && "$filename" == *.json ]]; then
      process_message "$MESSAGE_DIR/$filename"
    fi
  done
```

Make the script executable and run it:
```bash
chmod +x tnf-terminal-monitor.sh
./tnf-terminal-monitor.sh
```

### Option 2: Using Polling

If `inotifywait` is not available, use polling:
```bash
#!/bin/bash

MESSAGE_DIR="/tmp/thefuse/terminal"

# Ensure directory exists
mkdir -p "$MESSAGE_DIR"

echo "Starting TNF Terminal Agent monitor (polling mode)..."
echo "Watching for messages in $MESSAGE_DIR"

# Function to process messages
process_message() {
  # Same as in Option 1
  # ...
}

# Poll for new files
while true; do
  for file in "$MESSAGE_DIR"/message_*.json; do
    if [ -f "$file" ]; then
      process_message "$file"
    fi
  done
  sleep 1
done
```

## Sending Messages

### Bash Function for Sending Messages

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
```

### Example Usage

```bash
# Send a code review request to a VS Code agent
tnf_send_message "vscode_agent_1" "code_review" '"task_type": "code_review", "context": {"file": "example.js"}, "priority": "medium"'

# Send a web interaction request to a Chrome agent
tnf_send_message "chrome_agent_1" "web_interaction" '"task_type": "content_extraction", "context": {"url": "https://example.com"}, "priority": "high"'
```

## Python Integration

For Python-based terminal agents:

```python
#!/usr/bin/env python3
import json
import os
import time
from datetime import datetime
import shutil
from pathlib import Path
import uuid

class TNFRelayAgent:
    def __init__(self, agent_id="terminal_python_agent", agent_name="Python Terminal Agent"):
        self.agent_id = agent_id
        self.agent_name = agent_name
        self.base_dir = "/tmp/thefuse"
        self.terminal_dir = os.path.join(self.base_dir, "terminal")
        
        # Ensure directories exist
        os.makedirs(self.terminal_dir, exist_ok=True)
        os.makedirs(os.path.join(self.base_dir, "vscode"), exist_ok=True)
        os.makedirs(os.path.join(self.base_dir, "chrome"), exist_ok=True)
    
    def send_message(self, target_id, action_type, message_content):
        """Send a message to another agent via the relay"""
        # Determine target environment
        if target_id.startswith("vscode_"):
            target_env = "vscode"
        elif target_id.startswith("chrome_"):
            target_env = "chrome"
        else:
            target_env = "terminal"
        
        # Create message
        message = {
            "type": "COLLABORATION_REQUEST",
            "source": self.agent_id,
            "target": target_id,
            "content": {
                "action": action_type,
                **message_content
            },
            "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        }
        
        # Write to file
        target_dir = os.path.join(self.base_dir, target_env)
        message_file = os.path.join(target_dir, f"message_{int(time.time())}.json")
        
        with open(message_file, 'w') as f:
            json.dump(message, f, indent=2)
        
        return f"Message sent to {target_id} via {target_env} (saved to {message_file})"
    
    def monitor_messages(self, callback=None):
        """Monitor for incoming messages"""
        print(f"Monitoring for messages in {self.terminal_dir}")
        processed_files = set()
        
        while True:
            for file in Path(self.terminal_dir).glob("message_*.json"):
                if str(file) not in processed_files:
                    try:
                        with open(file, 'r') as f:
                            message = json.load(f)
                        
                        print(f"Received message from {message.get('source')}")
                        
                        # Process message with callback if provided
                        if callback:
                            callback(message)
                        else:
                            # Default processing
                            self._default_process(message)
                        
                        # Mark as processed
                        processed_files.add(str(file))
                        
                        # Remove file
                        os.remove(file)
                    except Exception as e:
                        print(f"Error processing message {file}: {e}")
            
            # Clean up processed_files set to prevent memory growth
            if len(processed_files) > 100:
                current_files = set(str(f) for f in Path(self.terminal_dir).glob("message_*.json"))
                processed_files = processed_files.intersection(current_files)
            
            time.sleep(1)
    
    def _default_process(self, message):
        """Default message processing"""
        content = message.get("content", {})
        action = content.get("action", "unknown")
        
        print(f"Processing {action} request")
        print(json.dumps(message, indent=2))

# Example usage
if __name__ == "__main__":
    agent = TNFRelayAgent()
    
    # Example: Send a message
    result = agent.send_message(
        "vscode_agent_1", 
        "code_review",
        {
            "task_type": "code_review",
            "context": {
                "file": "example.py",
                "focus_areas": ["performance", "security"]
            },
            "priority": "medium"
        }
    )
    print(result)
    
    # Start monitoring for messages
    agent.monitor_messages()
```

## Node.js Integration

For Node.js-based terminal agents:

```javascript
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar'); // npm install chokidar

class TNFRelayAgent {
  constructor(agentId = 'terminal_node_agent', agentName = 'Node.js Terminal Agent') {
    this.agentId = agentId;
    this.agentName = agentName;
    this.baseDir = '/tmp/thefuse';
    this.terminalDir = path.join(this.baseDir, 'terminal');
    
    // Ensure directories exist
    this._ensureDirectories();
  }
  
  _ensureDirectories() {
    [
      this.terminalDir,
      path.join(this.baseDir, 'vscode'),
      path.join(this.baseDir, 'chrome')
    ].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  sendMessage(targetId, actionType, messageContent) {
    // Determine target environment
    let targetEnv = 'terminal';
    if (targetId.startsWith('vscode_')) targetEnv = 'vscode';
    else if (targetId.startsWith('chrome_')) targetEnv = 'chrome';
    
    // Create message
    const message = {
      type: 'COLLABORATION_REQUEST',
      source: this.agentId,
      target: targetId,
      content: {
        action: actionType,
        ...messageContent
      },
      timestamp: new Date().toISOString()
    };
    
    // Write to file
    const targetDir = path.join(this.baseDir, targetEnv);
    const messageFile = path.join(targetDir, `message_${Date.now()}.json`);
    
    fs.writeFileSync(messageFile, JSON.stringify(message, null, 2));
    
    return `Message sent to ${targetId} via ${targetEnv} (saved to ${messageFile})`;
  }
  
  monitorMessages(callback = null) {
    console.log(`Monitoring for messages in ${this.terminalDir}`);
    
    // Set up file watcher
    const watcher = chokidar.watch(path.join(this.terminalDir, 'message_*.json'), {
      persistent: true,
      awaitWriteFinish: true
    });
    
    watcher.on('add', filePath => {
      try {
        // Read and parse message
        const message = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        console.log(`Received message from ${message.source}`);
        
        // Process message
        if (callback) {
          callback(message);
        } else {
          this._defaultProcess(message);
        }
        
        // Remove file
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error(`Error processing message ${filePath}:`, error);
      }
    });
    
    return watcher;
  }
  
  _defaultProcess(message) {
    const content = message.content || {};
    const action = content.action || 'unknown';
    
    console.log(`Processing ${action} request`);
    console.log(JSON.stringify(message, null, 2));
  }
}

// Example usage
const agent = new TNFRelayAgent();

// Example: Send a message
const result = agent.sendMessage(
  'vscode_agent_1',
  'code_review',
  {
    task_type: 'code_review',
    context: {
      file: 'example.js',
      focus_areas: ['performance', 'security']
    },
    priority: 'medium'
  }
);
console.log(result);

// Start monitoring for messages
const watcher = agent.monitorMessages();

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stopping message monitor...');
  watcher.close();
  process.exit(0);
});
```

## Troubleshooting

### Common Issues

1. **Permission Denied**:
   ```bash
   chmod -R 777 /tmp/thefuse
   ```

2. **Messages Not Being Detected**:
   - Ensure the relay application is running
   - Check that the directories exist
   - Verify file naming conventions (should start with "message_" and end with ".json")

3. **JSON Parsing Errors**:
   - Validate your JSON format before sending
   - Use a tool like `jq` to format and validate: `echo "$message" | jq .`

## Best Practices

1. **Message Validation**: Always validate incoming messages before processing
2. **Error Handling**: Implement robust error handling for file operations
3. **Cleanup**: Remove processed message files to prevent disk space issues
4. **Logging**: Maintain logs of sent and received messages for debugging
5. **Security**: Validate and sanitize any commands or code before execution
