#!/bin/bash

# This script adds a web search MCP capability to the Claude desktop config
# It carefully preserves all existing MCP server entries

CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"

echo "Updating Claude desktop config at: $CLAUDE_CONFIG"

# Check if the file exists
if [ ! -f "$CLAUDE_CONFIG" ]; then
  echo "Error: Claude config file not found at: $CLAUDE_CONFIG"
  exit 1
fi

# Check if the web-search entry already exists
if grep -q '"web-search":' "$CLAUDE_CONFIG"; then
  echo "web-search capability already exists in config. No changes needed."
  exit 0
fi

# Backup the existing config
BACKUP_FILE="${CLAUDE_CONFIG}.bak-$(date +%Y%m%d%H%M%S)"
cp "$CLAUDE_CONFIG" "$BACKUP_FILE"
echo "Created backup at: $BACKUP_FILE"

# Create the new web-search capability JSON
WEB_SEARCH_JSON='    "web-search": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-websearch"
      ]
    }'

# Find the last entry in mcpServers to add a comma after it if needed
if grep -q '"mcpServers": {' "$CLAUDE_CONFIG"; then
  # Create a temporary file for processing
  TMP_FILE=$(mktemp)
  
  # Pattern to match the last closing brace within mcpServers (before the main closing brace)
  # This is complex because we need to handle nested braces in the JSON
  awk '
  BEGIN { in_servers = 0; brace_count = 0; last_closing_found = 0 }
  
  # When we enter mcpServers section
  /\"mcpServers\": {/ { in_servers = 1; brace_count = 1; print; next }
  
  # Count nested braces while in mcpServers section
  in_servers && /}/ { 
    brace_count--; 
    if (brace_count == 0) {
      # This is the closing brace of mcpServers
      if (!last_closing_found) {
        # Add web-search entry before this brace
        print "'"$WEB_SEARCH_JSON"',"; 
        print $0;
        last_closing_found = 1;
      } else {
        print;
      }
      in_servers = 0;
    } else {
      print;
    }
    next;
  }
  
  # Count opening braces while in mcpServers
  in_servers && /{/ { brace_count++; print; next }
  
  # Print all other lines unchanged
  { print }
  ' "$CLAUDE_CONFIG" > "$TMP_FILE"
  
  # Replace original file with updated version
  mv "$TMP_FILE" "$CLAUDE_CONFIG"
  
  echo "Added web-search capability to Claude desktop config."
else
  echo "Error: Could not find mcpServers section in config file."
  echo "Manual inspection needed. Original file not changed."
  cat "$CLAUDE_CONFIG"
  exit 1
fi

# Validate JSON file structure
if command -v jq &> /dev/null; then
  if ! jq empty "$CLAUDE_CONFIG" 2>/dev/null; then
    echo "Error: The updated config file contains invalid JSON."
    echo "Restoring from backup..."
    cp "$BACKUP_FILE" "$CLAUDE_CONFIG"
    exit 1
  fi
fi

echo "✅ Successfully updated Claude desktop config with web-search capability"
echo "New config:"
cat "$CLAUDE_CONFIG"

echo "Added web-search capability to Claude desktop config."
echo "New config:"
cat "$CLAUDE_CONFIG"
