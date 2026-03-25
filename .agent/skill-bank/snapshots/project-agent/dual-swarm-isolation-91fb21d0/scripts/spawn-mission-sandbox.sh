#!/bin/bash

# TNF MISSION ISOLATION SPRAWNER
# Purpose: Spawns an entirely new Terminal process group for isolated missions.

MISSION_NAME=${1:-"Experimental-Sandbox"}
PLANE=${2:-"B"}

echo "Spawning isolated Terminal process for mission: $MISSION_NAME (Plane $PLANE)"

# 1. Open a new Terminal instance (-n flag is key)
open -n -a Terminal

# 2. Give it a moment to initialize
sleep 2

# 3. Use AppleScript to target the NEWEST instance and set its identity
osascript <<EOF
tell application "System Events"
    set terminalProc to (last process whose name is "Terminal")
    tell terminalProc
        set frontmost to true
        -- Create a uniquely named window to help with routing
        keystroke "n" using command down
        delay 0.5
        -- Set environment and identity
        keystroke "export TNF_PLANE=$PLANE && export MISSION_NAME=$MISSION_NAME"
        key code 36 -- Enter
        keystroke "clear"
        key code 36 -- Enter
        keystroke "echo 'PLANE $PLANE INITIALIZED FOR MISSION: $MISSION_NAME'"
        key code 36 -- Enter
    end tell
end tell
EOF

echo "Isolation complete. Plane $PLANE is now active."
