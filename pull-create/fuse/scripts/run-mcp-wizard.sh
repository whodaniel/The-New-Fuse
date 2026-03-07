#!/bin/bash

# MCP Wizard - Shell wrapper
# This script provides an easy way to run the MCP configuration manager

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MCP_MANAGER="${SCRIPT_DIR}/mcp-config-manager.cjs"

# Make sure the script is executable
chmod +x "${MCP_MANAGER}"

# Basic help message
function show_help {
  echo "MCP Wizard - A tool to configure MCP capability providers"
  echo
  echo "Usage:"
  echo "  ./mcp-wizard.sh                    Run interactive mode"
  echo "  ./mcp-wizard.sh add <options>      Add or update an MCP server"
  echo "  ./mcp-wizard.sh list [options]     List MCP servers"
  echo "  ./mcp-wizard.sh remove <options>   Remove an MCP server"
  echo
  echo "Examples:"
  echo "  ./mcp-wizard.sh add --name=web-search --command=npx --args='@modelcontextprotocol/server-websearch'"
  echo "  ./mcp-wizard.sh list --file='~/Library/Application Support/Claude/claude_desktop_config.json'"
  echo
  echo "For more details, run the script with no arguments for interactive mode."
}

# Check if help was requested
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
  show_help
  exit 0
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is required but not installed."
  echo "Please install Node.js from https://nodejs.org/"
  exit 1
fi

# Pass all arguments to the Node.js script
node "${MCP_MANAGER}" "$@"
