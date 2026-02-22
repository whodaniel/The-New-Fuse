#!/bin/bash
# TNF Native Messaging Host Launcher
# Ensures the correct Node environment is used

# Set path to include common Node locations just in case
export PATH="$PATH:/usr/local/bin:/usr/bin:/bin"

# Run the host script using the absolute Node path detected during installation
"/Users/<owner>/.nvm/versions/node/v24.12.0/bin/node" "/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/chrome-extension/dist-v7/native-host/tnf-native-host.cjs" "$@"
