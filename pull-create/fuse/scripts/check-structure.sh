#!/bin/bash
set -e

OUTPUT_FILE="./analysis/structure-check-results.txt"
mkdir -p ./analysis

echo "🔍 Checking current project structure..." | tee "$OUTPUT_FILE"

echo -e "\n📁 Detailed Component Structure:" | tee -a "$OUTPUT_FILE"
ls -R ./apps/frontend/src/components 2>/dev/null | tee -a "$OUTPUT_FILE"

echo -e "\n📁 Detailed Pages Structure:" | tee -a "$OUTPUT_FILE"
ls -R ./apps/frontend/src/pages 2>/dev/null | tee -a "$OUTPUT_FILE"

echo -e "\n📄 Component Files:" | tee -a "$OUTPUT_FILE"
find ./apps/frontend/src/components -type f -name "*.tsx" -o -name "*.jsx" 2>/dev/null | tee -a "$OUTPUT_FILE"

echo -e "\n📄 Page Files:" | tee -a "$OUTPUT_FILE"
find ./apps/frontend/src/pages -type f -name "*.tsx" -o -name "*.jsx" 2>/dev/null | tee -a "$OUTPUT_FILE"

echo -e "\n📊 File Count Statistics:" | tee -a "$OUTPUT_FILE"
echo "Component files: $(find ./apps/frontend/src/components -type f -name "*.tsx" -o -name "*.jsx" 2>/dev/null | wc -l)" | tee -a "$OUTPUT_FILE"
echo "Page files: $(find ./apps/frontend/src/pages -type f -name "*.tsx" -o -name "*.jsx" 2>/dev/null | wc -l)" | tee -a "$OUTPUT_FILE"

echo -e "\n✅ Check complete! Results written to $OUTPUT_FILE"
