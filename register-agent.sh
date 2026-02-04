#!/bin/bash

# Register OpenClaw as an agent in TNF

echo "Attempting registration..."

# Try v1 endpoint (from Guide)
curl -v -X POST http://localhost:3000/api/v1/agents/register \
  -H "Content-Type: application/json" \
  -d '{
    "id": "openclaw-bootstrapper",
    "name": "OpenClaw Bootstrapper",
    "description": "Bootstrapping agent running from OpenClaw to assist with TNF launch.",
    "version": "1.0.0",
    "capabilities": [
      {
        "id": "code-execution",
        "name": "Code Execution",
        "description": "Can execute code and shell commands",
        "actions": []
      },
      {
        "id": "file-manipulation",
        "name": "File Manipulation",
        "description": "Can read and write files",
        "actions": []
      }
    ],
    "endpoints": {
      "health": "http://localhost:18789/health",
      "capabilities": "http://localhost:18789/capabilities",
      "execute": "http://localhost:18789/execute"
    },
    "security": {
      "authMethod": "bearer",
      "encryptionSupported": false
    }
  }' || echo "v1 registration failed"

echo ""
echo "Attempting alternative registration (Bridge Skill style)..."

# Try simple endpoint (from Skill) - Assuming port 3001
curl -v -X POST http://localhost:3001/api/agents/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "OpenClaw Bootstrapper",
    "capabilities": ["code_execution", "browser_automation", "messaging"],
    "provider": "openclaw"
  }'
