#!/bin/bash
set -e

OUTPUT_FILE="./analysis/component-analysis.txt"
mkdir -p ./analysis

echo "🔍 Component Analysis" | tee "$OUTPUT_FILE"

# Analyze component directories
echo -e "\n📁 Component Directory Structure:" | tee -a "$OUTPUT_FILE"
find ./apps/frontend/src/components -type d | tee -a "$OUTPUT_FILE"

# Count components by type
echo -e "\n📊 Component Types:" | tee -a "$OUTPUT_FILE"
echo "UI Components: $(find ./apps/frontend/src/components/ui -type f -name "*.tsx" -o -name "*.jsx" 2>/dev/null | wc -l)" | tee -a "$OUTPUT_FILE"
echo "Feature Components: $(find ./apps/frontend/src/components/features -type f -name "*.tsx" -o -name "*.jsx" 2>/dev/null | wc -l)" | tee -a "$OUTPUT_FILE"
echo "Shared Components: $(find ./apps/frontend/src/components/shared -type f -name "*.tsx" -o -name "*.jsx" 2>/dev/null | wc -l)" | tee -a "$OUTPUT_FILE"

# List all unique component directories
echo -e "\n📋 Component Categories:" | tee -a "$OUTPUT_FILE"
find ./apps/frontend/src/components -type d -mindepth 1 -maxdepth 1 | sort | tee -a "$OUTPUT_FILE"

echo -e "\n✅ Analysis complete! Check $OUTPUT_FILE for details"
