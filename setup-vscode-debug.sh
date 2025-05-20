#!/bin/bash
# Script to set up VS Code debugging configuration for The New Fuse project

# Exit on error
set -e

# Print with colors for better readability
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
BOLD="\033[1m"
NC="\033[0m" # No Color

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}===============================================================${NC}"
echo -e "${BOLD}${GREEN}🚀 THE NEW FUSE - VSCODE DEBUG LAUNCHER${NC}"
echo -e "${BLUE}===============================================================${NC}"

# Ensure .vscode directory exists
mkdir -p .vscode

# Update the launch.json file with debugger configurations for our services
echo -e "\n${CYAN}${BOLD}STEP 1: UPDATING VSCODE LAUNCH CONFIGURATION${NC}"
echo -e "${YELLOW}Updating .vscode/launch.json...${NC}"

cat > .vscode/launch.json << EOL
{
    "configurations": [
        {
            "name": "Attach to Chrome (Port 9222)",
            "port": 9222,
            "request": "attach",
            "type": "chrome",
            "webRoot": "\${workspaceFolder}"
        },       
        

        {
            "name": "Attach to Kubernetes Pod (NodeJS)",
            "type": "cloudcode.kubernetes",
            "request": "attach",
            "language": "Node",
            "debugPort": 9229,
            "podSelector": {
                "app": "deployment-name"
            },
            "localRoot": "\${workspaceFolder}",
            "remoteRoot": "Path to the Remote Directory Containing the Program"
        },
        {
            "name": "Launch Chrome",
            "request": "launch",
            "type": "chrome",
            "url": "http://localhost:3000",
            "webRoot": "\${workspaceFolder}/apps/frontend"
        },
        {
            "name": "Attach to Edge",
            "port": 9222,
            "request": "attach",
            "type": "msedge",
            "webRoot": "\${workspaceFolder}"
        },
        {
            "name": "Debug Frontend",
            "type": "chrome",
            "request": "launch",
            "url": "http://localhost:3000",
            "webRoot": "\${workspaceFolder}/apps/frontend",
            "sourceMapPathOverrides": {
                "webpack:///src/*": "\${webRoot}/src/*"
            }
        },
        {
            "name": "Debug Backend",
            "type": "node",
            "request": "attach",
            "port": 9229,
            "restart": true,
            "cwd": "\${workspaceFolder}/apps/backend"
        },
        {
            "name": "Debug API",
            "type": "node",
            "request": "attach",
            "port": 9230,
            "restart": true,
            "cwd": "\${workspaceFolder}/apps/api"
        },
        {
            "name": "Debug VS Code Extension",
            "type": "extensionHost",
            "request": "launch",
            "args": [
                "--extensionDevelopmentPath=\${workspaceFolder}/src/vscode-extension"
            ],
            "outFiles": [
                "\${workspaceFolder}/src/vscode-extension/dist/**/*.js"
            ]
        },
        {
            "name": "Debug WebSocket Server",
            "type": "node",
            "request": "launch",
            "program": "\${workspaceFolder}/test-websocket-server-3711.cjs",
            "cwd": "\${workspaceFolder}"
        },
        {
            "name": "Run All Services (Debug)",
            "type": "node",
            "request": "launch",
            "program": "\${workspaceFolder}/launch-all.sh",
            "cwd": "\${workspaceFolder}"
        },
        {
            "name": "Cloud Run: Run/Debug Locally",
            "type": "cloudcode.cloudrun",
            "request": "launch",
            "build": {
                "docker": {
                    "path": "Dockerfile",
                    "dockerfile": "Dockerfile",
                    "context": "\${workspaceFolder}"
                }
            },
            "image": "the-new-fuse",
            "service": {
                "name": "the-new-fuse",
                "containerPort": 8080,
                "resources": {
                    "limits": {
                        "memory": "256Mi"
                    }
                }
            },
            "target": {
                "minikube": {}
            },
            "watch": true,
            "externalPortForward": 3000
        },
        {
            "name": "Docker Node.js Launch",
            "type": "docker",
            "request": "launch",
            "preLaunchTask": "docker-run: debug",
            "platform": "node",
            "node": {
                "package": "\${workspaceFolder}/packages/shared/package.json",
                "localRoot": "\${workspaceFolder}/packages/shared"
            }
        }
    ]
}
EOL

# Create a tasks.json file to help with common tasks
echo -e "\n${CYAN}${BOLD}STEP 2: SETTING UP VSCODE TASKS${NC}"
echo -e "${YELLOW}Creating .vscode/tasks.json...${NC}"

cat > .vscode/tasks.json << EOL
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Launch All Services",
            "type": "shell",
            "command": "./launch-all.sh",
            "group": {
                "kind": "build",
                "isDefault": true
            },
            "presentation": {
                "reveal": "always",
                "panel": "new"
            }
        },
        {
            "label": "Launch UI Showcase",
            "type": "shell",
            "command": "./launch-ui-showcase.sh",
            "presentation": {
                "reveal": "always",
                "panel": "new"
            }
        },
        {
            "label": "Build Chrome Extension",
            "type": "shell",
            "command": "cd ./chrome-extension && ./build.sh",
            "group": "build",
            "presentation": {
                "reveal": "always"
            }
        },
        {
            "label": "Build VS Code Extension",
            "type": "shell",
            "command": "cd ./src/vscode-extension && ./build-vsix.sh",
            "group": "build",
            "presentation": {
                "reveal": "always"
            }
        },
        {
            "label": "Kill Port Processes",
            "type": "shell",
            "command": "node ./scripts/kill-port-processes.js"
        },
        {
            "label": "Check Docker Ports",
            "type": "shell",
            "command": "node ./scripts/check-docker-ports.js"
        },
        {
            "label": "Build Production Pipeline",
            "type": "shell",
            "command": "bash ./scripts/production-build.sh",
            "group": {
                "kind": "build",
                "isDefault": false
            }
        },
        {
            "label": "Start WebSocket Server",
            "type": "shell",
            "command": "node test-websocket-server-3711.cjs",
            "isBackground": true
        }
    ]
}
EOL

echo -e "\n${GREEN}${BOLD}==============================================================${NC}"
echo -e "${GREEN}${BOLD}🎉 VS CODE DEBUG CONFIGURATION COMPLETE!${NC}"
echo -e "${GREEN}${BOLD}==============================================================${NC}"
echo -e "${BLUE}Available Debug Configurations:${NC}"
echo -e " - Debug Frontend"
echo -e " - Debug Backend"
echo -e " - Debug API"
echo -e " - Debug VS Code Extension"
echo -e " - Debug WebSocket Server"
echo -e " - Run All Services (Debug)"
echo -e ""
echo -e "${YELLOW}To start debugging:${NC}"
echo -e "1. Open The New Fuse project in VS Code"
echo -e "2. Go to the 'Run and Debug' view (Ctrl+Shift+D)"
echo -e "3. Select a configuration from the dropdown"
echo -e "4. Click the green 'Start Debugging' button (or press F5)"
echo -e ""
echo -e "${YELLOW}Available Tasks (Ctrl+Shift+P -> 'Run Task'):${NC}"
echo -e " - Launch All Services"
echo -e " - Launch UI Showcase"
echo -e " - Build Chrome Extension"
echo -e " - Build VS Code Extension"
echo -e " - Kill Port Processes"
echo -e " - Check Docker Ports"
echo -e " - Build Production Pipeline"
echo -e " - Start WebSocket Server"
