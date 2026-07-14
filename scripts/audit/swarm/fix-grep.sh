#!/bin/bash
# Fix all agent scripts to use grep -E instead of grep -P
DIR="$HOME/tnf-swarm-audit"
for script in "$DIR"/agent-*.sh; do
    if [ -f "$script" ]; then
        echo "Fixing $script..."
        sed -i '' 's/grep -P/grep -E/g' "$script" 2>/dev/null || sed -i 's/grep -P/grep -E/g' "$script"
    fi
done
echo "Fixed all scripts."
