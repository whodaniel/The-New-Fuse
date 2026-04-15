#!/bin/bash

echo "Creating sample files for MCP tools to work with..."

# Ensure data directory exists
mkdir -p src/vscode-extension/data

# Create a text file with some content
cat > src/vscode-extension/data/example.txt << 'EOF'
Hello from MCP!

This is a sample text file that you can access using the MCP filesystem tool.
Try running the 'read_file' tool with {"path": "./data/example.txt"} as the parameter.

You can also create more files in this directory and list them all using the 'list_files' tool.
EOF

# Create a JSON file with some structured data
cat > src/vscode-extension/data/config.json << 'EOF'
{
  "name": "MCP Sample Project",
  "version": "1.0.0",
  "description": "A sample configuration file for testing MCP tools",
  "tools": [
    {
      "name": "list_files",
      "description": "Lists files in a directory"
    },
    {
      "name": "read_file",
      "description": "Reads the content of a file"
    },
    {
      "name": "brave_search",
      "description": "Searches the web using Brave Search"
    }
  ],
  "settings": {
    "defaultDirectory": "./data",
    "maxResults": 10,
    "debug": false
  }
}
EOF

# Create a Markdown file with documentation
cat > src/vscode-extension/data/README.md << 'EOF'
# MCP Sample Files

This directory contains sample files for testing MCP tools.

## Available Files

- `example.txt`: A simple text file
- `config.json`: A sample JSON configuration file
- `README.md`: This file

## Usage with MCP Tools

1. Use `list_files` to list all files in this directory
2. Use `read_file` to read the content of any file
3. Use `write_file` to create new files or modify existing ones

## Example MCP Commands

```json
// List files
{ "path": "./data" }

// Read a file
{ "path": "./data/example.txt" }

// Write to a file
{ "path": "./data/new-file.txt", "content": "This is a new file created with MCP" }
```
EOF

echo "Sample files created in src/vscode-extension/data/"
echo "You can now test the MCP tools with these files!"
