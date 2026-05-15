#!/bin/bash
# Direct MCP Configuration Editor
# This script directly edits the Claude configuration file to add MCP servers

echo "===== Direct MCP Configuration Editor ====="

# Define configuration path
CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
CONTEXT7_SERVER_PATH="${CONTEXT7_SERVER_PATH:-$HOME/.local/share/context7-server/build/index.js}"
echo "Claude config path: $CLAUDE_CONFIG"
echo "Context7 server path: $CONTEXT7_SERVER_PATH"

# Check if config exists
if [ -f "$CLAUDE_CONFIG" ]; then
    echo "Claude config exists"
else
    echo "Claude config not found. Creating empty config."
    mkdir -p "$(dirname "$CLAUDE_CONFIG")"
    echo '{
  "mcpServers": {}
}' > "$CLAUDE_CONFIG"
fi

# Create a backup of the original file
cp "$CLAUDE_CONFIG" "${CLAUDE_CONFIG}.bak"
echo "Created backup at ${CLAUDE_CONFIG}.bak"

# Read current config
if [ -s "$CLAUDE_CONFIG" ]; then
    current_config=$(cat "$CLAUDE_CONFIG")
    
    # Check if there are comments in the file that would break JSON parsing
    if grep -q "//" "$CLAUDE_CONFIG"; then
        echo "Removing comments from JSON file before parsing"
        current_config=$(grep -v "//" "$CLAUDE_CONFIG")
    fi
else
    current_config='{}'
fi

# Create new config with all MCP servers
cat > "$CLAUDE_CONFIG" <<EOF
{
  "mcpServers": {
    "context7-server": {
      "command": "node",
      "args": [
        "$CONTEXT7_SERVER_PATH"
      ]
    },
    "applescript_execute": {
      "command": "npx",
      "args": [
        "@peakmojo/applescript-mcp"
      ]
    },
    "web-search": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-websearch"
      ]
    },
    "mcp-config-manager": {
      "command": "node",
      "args": [
        "./scripts/mcp-config-manager-server.js"
      ]
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "--allow-dir",
        "."
      ]
    },
    "http": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-http"
      ]
    },
    "shell": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-shell",
        "--allow-commands",
        "ls,cat,grep,find,echo,pwd"
      ]
    },
    "code-analysis": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-code-analysis",
        "--allow-dir",
        "./"
      ]
    },
    "postgres": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-e",
        "POSTGRES_CONNECTION_STRING",
        "modelcontextprotocol/postgres"
      ]
    },
    "vector-db": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-vector-db",
        "--db-path",
        "./data/vector-db"
      ]
    },
    "brave-search": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-e",
        "BRAVE_API_KEY",
        "modelcontextprotocol/brave-search"
      ]
    },
    "sqlite": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-v",
        "./db:/data/mcp/sqlite",
        "--db-path",
        "/data/mcp/sqlite/ai_data.db",
        "modelcontextprotocol/sqlite"
      ]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sequential-thinking"
      ]
    }
  }
}
EOF

echo "===== MCP Configuration Results ====="
echo "Successfully updated Claude configuration with 13 MCP servers"
echo "Configuration complete."
