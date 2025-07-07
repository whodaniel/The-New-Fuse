#!/bin/bash
# Auto MCP Configuration Script
# This script automatically discovers and adds MCP servers to configuration files

echo "===== MCP Configuration Automator ====="
echo "Starting automated MCP server discovery and configuration"

# Define configuration paths
CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
FUSE_CONFIG="$HOME/Desktop/A1-Inter-LLM-Com/The New Fuse/mcp_config.json"

echo "Claude config path: $CLAUDE_CONFIG"
echo "Fuse config path: $FUSE_CONFIG"

# Check if configs exist
if [ -f "$CLAUDE_CONFIG" ]; then
    echo "Claude config exists"
else
    echo "Claude config not found. Creating empty config."
    mkdir -p "$(dirname "$CLAUDE_CONFIG")"
    echo '{
  "mcpServers": {}
}' > "$CLAUDE_CONFIG"
fi

if [ -f "$FUSE_CONFIG" ]; then
    echo "Fuse config exists"
else
    echo "Fuse config not found."
fi

# Create a temporary directory for our work
TMP_DIR=$(mktemp -d)
echo "Using temporary directory: $TMP_DIR"

# Function to add server to Claude config
add_server_to_claude_config() {
    local name="$1"
    local command="$2"
    local args="$3"
    
    echo "Adding server '$name' to Claude config with command '$command' and args '$args'"
    
    # Create temporary file with new server
    local TMP_FILE="$TMP_DIR/claude_config_temp.json"
    
    # Check if server already exists
    if grep -q "\"$name\":" "$CLAUDE_CONFIG"; then
        echo "Server '$name' already exists in Claude config"
        return 1
    fi
    
    # Convert args string to JSON array
    args_json=$(echo "$args" | jq -s '.')
    
    # Create server JSON template
    server_json=$(cat <<EOF
{
  "mcpServers": {
    "$name": {
      "command": "$command",
      "args": $args_json
    }
  }
}
EOF
)
    
    # Merge with existing config using jq
    jq -s '.[0] * .[1]' "$CLAUDE_CONFIG" <(echo "$server_json") > "$TMP_FILE"
    
    if [ $? -eq 0 ]; then
        cp "$TMP_FILE" "$CLAUDE_CONFIG"
        echo "Successfully added server '$name' to Claude config"
        return 0
    else
        echo "Error adding server '$name' to Claude config"
        return 1
    fi
}

# Search npm for MCP servers
echo "Searching npm for MCP-related packages..."
npm_search=$(npm search modelcontextprotocol server --parseable 2>/dev/null || echo "")
echo "Found $(echo "$npm_search" | grep -c ^) npm packages related to MCP"

# Define common known MCP servers to add
declare -a servers=(
    "filesystem|npx|-y @modelcontextprotocol/server-filesystem --allow-dir ."
    "http|npx|-y @modelcontextprotocol/server-http"
    "web-search|npx|@modelcontextprotocol/server-websearch"
    "shell|npx|-y @modelcontextprotocol/server-shell --allow-commands ls,cat,grep,find,echo,pwd"
    "code-analysis|npx|-y @modelcontextprotocol/server-code-analysis --allow-dir ./"
    "postgres|docker|run --rm -i -e POSTGRES_CONNECTION_STRING modelcontextprotocol/postgres"
    "vector-db|npx|-y @modelcontextprotocol/server-vector-db --db-path ./data/vector-db"
    "brave-search|docker|run --rm -i -e BRAVE_API_KEY modelcontextprotocol/brave-search"
)

# Count how many servers were added
added_count=0

# Process servers to add
for server_info in "${servers[@]}"; do
    IFS="|" read -r name command args <<< "$server_info"
    
    # Convert comma-separated args to array
    IFS=' ' read -ra args_array <<< "$args"
    
    # Add server to Claude config
    if add_server_to_claude_config "$name" "$command" "${args_array[*]}"; then
        added_count=$((added_count + 1))
    fi
done

# Check for npm packages that look like MCP servers and add them
while IFS="|" read -r package description date version keywords; do
    if [[ "$package" == @modelcontextprotocol/server-* ]]; then
        # Extract server name from package
        server_name=$(echo "$package" | sed 's/@modelcontextprotocol\/server-//')
        
        if [ -n "$server_name" ]; then
            echo "Found MCP server package: $package (name: $server_name)"
            
            # Add to Claude config if not already added
            if add_server_to_claude_config "$server_name" "npx" "$package"; then
                added_count=$((added_count + 1))
            fi
        fi
    fi
done <<< "$npm_search"

# Clean up
rm -rf "$TMP_DIR"

echo "===== MCP Configuration Results ====="
echo "Added $added_count new servers to Claude configuration"

if [ "$added_count" -gt 0 ]; then
    echo "Configuration updated successfully."
else
    echo "No new servers were added. All servers were already configured."
fi

echo "Configuration complete."
