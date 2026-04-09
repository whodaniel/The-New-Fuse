#!/bin/bash

# MCP Wizard Shell version
# This is a simplified, terminal-based version of the MCP wizard

echo "==================================================="
echo "   MCP Configuration Wizard (Terminal Version)     "
echo "==================================================="
echo

function main_menu() {
  echo "What would you like to do?"
  echo
  echo "1. Scan System for MCP Capabilities"
  echo "2. Create/Update MCP Configuration"
  echo "3. Register Agent with MCP Tools"
  echo "4. Help/Documentation"
  echo "5. Exit"
  echo
  read -p "Enter your choice (1-5): " choice
  
  case $choice in
    1) scan_for_capabilities ;;
    2) create_update_config ;;
    3) register_agent ;;
    4) show_help ;;
    5) exit 0 ;;
    *) echo "Invalid option. Please try again."; main_menu ;;
  esac
}

function scan_for_capabilities() {
  echo
  echo "Scanning for MCP capability providers..."
  echo
  
  # Create a temp file for results
  RESULTS_FILE=$(mktemp)
  
  # Check for Node.js MCP packages
  echo "Checking for Node.js packages..."
  npm list -g | grep -i mcp > $RESULTS_FILE 2>/dev/null
  
  # Check for Python MCP packages
  echo "Checking for Python packages..."
  pip list | grep -i mcp >> $RESULTS_FILE 2>/dev/null
  
  # Check for Docker images related to MCP
  echo "Checking for Docker images..."
  docker images | grep -i mcp >> $RESULTS_FILE 2>/dev/null
  
  # Check for local MCP implementations in common directories
  echo "Checking for local MCP implementations..."
  find ~/Documents ~/Projects -name "*mcp*" -type d -maxdepth 3 2>/dev/null >> $RESULTS_FILE
  
  # Display results
  echo
  if [ -s $RESULTS_FILE ]; then
    echo "Found potential MCP capability providers:"
    echo
    cat $RESULTS_FILE
    echo
  else
    echo "No MCP capability providers found in the standard locations."
    echo "You may need to install some MCP packages or implement custom capability providers."
    echo
  fi
  
  rm $RESULTS_FILE
  
  read -p "Would you like to configure an MCP capability? (y/n): " configure
  if [[ $configure == "y" || $configure == "Y" ]]; then
    create_update_config
  else
    main_menu
  fi
}

function create_update_config() {
  echo
  echo "Select a configuration file to update:"
  echo
  echo "1. claude_desktop_config.json"
  echo "2. mcp_config.json"
  echo "3. New config file..."
  echo "4. Return to main menu"
  echo
  
  read -p "Enter your choice (1-4): " choice
  
  case $choice in
    1) config_file="$HOME/Library/Application Support/Claude/claude_desktop_config.json" ;;
    2) 
      # Find or create mcp_config.json
      found_config=$(find ~/Desktop ~/Documents -name 'mcp_config.json' -type f 2>/dev/null | head -n 1)
      if [ -n "$found_config" ]; then
        config_file="$found_config"
      else
        config_file="$HOME/mcp_config.json"
      fi
      ;;
    3) 
      read -p "Enter the path for the new config file: " config_file
      # Expand ~ if used
      config_file="${config_file/#\~/$HOME}"
      ;;
    4) main_menu; return ;;
    *) echo "Invalid option. Please try again."; create_update_config; return ;;
  esac
  
  # Check if file exists
  if [ -f "$config_file" ]; then
    echo
    echo "Current configuration:"
    echo
    cat "$config_file"
    echo
  else
    echo
    echo "Creating new configuration file at: $config_file"
    mkdir -p "$(dirname "$config_file")"
    echo '{
  "mcpServers": {
  }
}' > "$config_file"
    echo
  fi
  
  add_edit_provider "$config_file"
}

function add_edit_provider() {
  config_file="$1"
  
  echo
  read -p "Enter a name for this MCP capability provider: " provider_name
  
  echo
  echo "Select the command to execute this capability provider:"
  echo
  echo "1. node"
  echo "2. python"
  echo "3. npx"
  echo "4. docker"
  echo "5. Other..."
  echo
  
  read -p "Enter your choice (1-5): " choice
  
  case $choice in
    1) command="node" ;;
    2) command="python" ;;
    3) command="npx" ;;
    4) command="docker" ;;
    5) 
      read -p "Enter the command: " command
      ;;
    *) echo "Invalid option. Using 'npx' as default."; command="npx" ;;
  esac
  
  echo
  read -p "Enter command arguments (separate with spaces): " args_string
  
  # Convert argument string to array format for JSON
  args_json=$(echo "$args_string" | awk '{printf "["
    for(i=1; i<=NF; i++) {
      printf "\"%s\"", $i
      if (i < NF) printf ", "
    }
    printf "]"}')
  
  provider_json="\"$provider_name\": {
      \"command\": \"$command\",
      \"args\": $args_json
    }"
  
  # Update config file
  if grep -q "\"$provider_name\":" "$config_file"; then
    # Replace existing provider
    temp_file=$(mktemp)
    sed -e "/\"$provider_name\":/,/}/c\\
    $provider_json," "$config_file" > "$temp_file"
    mv "$temp_file" "$config_file"
  else
    # Add new provider
    temp_file=$(mktemp)
    awk '
    /\"mcpServers\": {/ {
      print $0;
      print "    '"$provider_json"',";
      next;
    }
    1' "$config_file" > "$temp_file"
    mv "$temp_file" "$config_file"
    
    # Fix the last comma if needed
    temp_file=$(mktemp)
    sed '$ s/,$//' "$config_file" > "$temp_file"
    mv "$temp_file" "$config_file"
  fi
  
  echo
  echo "MCP capability provider '$provider_name' has been configured."
  echo "Updated configuration:"
  echo
  cat "$config_file"
  echo
  
  read -p "Configure another capability provider? (y/n): " another
  if [[ $another == "y" || $another == "Y" ]]; then
    add_edit_provider "$config_file"
  else
    main_menu
  fi
}

function register_agent() {
  echo
  echo "This will register an agent with access to MCP tools."
  echo "Note: In a real implementation, this would update agent configurations in The New Fuse database."
  echo
  
  read -p "Enter the agent name: " agent_name
  
  echo
  echo "Agent '$agent_name' has been registered with access to MCP tools."
  echo "The agent can now use MCP capabilities as defined in your configuration."
  echo
  
  read -p "Press Enter to return to the main menu..."
  main_menu
}

function show_help() {
  echo
  cat << EOF
MCP Configuration Wizard Help

What is MCP?
MCP (Model Context Protocol) is a standardized communication protocol for AI models and agents to share context and execute capabilities.

About MCP Capability Providers:
- MCP capability providers expose functionality to LLMs through the MCP protocol
- They are NOT traditional servers that need to be started or run continuously
- They are accessed on-demand when an LLM needs to use their capabilities
- Configuration defines what capabilities are available and how they can be accessed

Configuration Format:
{
  "mcpServers": {
    "provider-name": {
      "command": "executable-name",
      "args": ["arg1", "arg2", ...]
    }
  }
}

Best Practices:
- Use meaningful names for capability providers
- Use absolute paths for command executables when needed
- Keep configuration files in version control
- Document the capabilities provided by each MCP provider
EOF
  echo
  
  read -p "Press Enter to return to the main menu..."
  main_menu
}

# Start the wizard
main_menu
