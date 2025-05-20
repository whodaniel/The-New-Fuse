#!/bin/bash
set -e

echo "🔍 Analyzing TypeScript errors by phase..."
mkdir -p logs

for phase in {1..4}; do
    echo "Phase ${phase} analysis:"
    yarn tsc -p config/tsconfig.fix.phase${phase}.json --noEmit > logs/phase${phase}-errors.log 2>&1 || true
    
    error_count=$(grep -c "error TS" logs/phase${phase}-errors.log || echo "0")
    echo "- Found ${error_count} errors"
    
    if [ $error_count -gt 0 ]; then
        echo "Most common errors in Phase ${phase}:"
        grep -E "error TS[0-9]+" logs/phase${phase}-errors.log | \
            sed 's/.*error \(TS[0-9]\+\).*/\1/' | \
            sort | uniq -c | sort -nr | head -5
    fi
    echo ""
done

echo "Detailed error logs are available in the logs directory"