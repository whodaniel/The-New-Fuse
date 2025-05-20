#!/bin/bash
set -e

echo "🔍 Starting TypeScript issue detection..."

# Generate error report for each phase
for phase in {1..4}; do
  echo "Analyzing Phase ${phase} errors..."
  yarn tsc -p config/tsconfig.fix.phase${phase}.json --noEmit > typescript-errors-phase${phase}.log 2>&1 || true
  error_count=$(grep -c "error TS" typescript-errors-phase${phase}.log || echo "0")
  echo "Phase ${phase} errors: ${error_count}"
done

# Generate detailed reports
yarn tsc --noEmit --generateTrace trace
yarn tsc --noEmit --listFiles > typescript-files.log

echo "✅ TypeScript issue detection complete!"
