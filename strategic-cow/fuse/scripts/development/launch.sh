#!/bin/bash
# Launch VS Code with the extension
CODE_PATH="code" # or full path on macOS
"$CODE_PATH" --new-window --extensionDevelopmentPath="$(pwd)"
