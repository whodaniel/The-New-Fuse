#!/bin/bash

# Wait for VS Code to start up
sleep 5

# Run the test commands
code --command "theNewFuse.monitoring.toggleLLMMonitoring"
sleep 1
code --command "theNewFuse.test.sendChatMessage"
sleep 1
code --command "theNewFuse.monitoring.showSessionMetrics"
