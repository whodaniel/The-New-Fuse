#!/bin/bash
# Stage 1: Comprehensive Document Discovery
# Part of The Living Documentation System

set -e

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUTPUT_DIR="${PROJECT_ROOT}/.documentation-system"
MANIFEST_FILE="${OUTPUT_DIR}/manifest.json"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  The New Fuse - Living Documentation System${NC}"
echo -e "${BLUE}  Stage 1: Document Discovery${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Initialize counters
declare -A type_counts
declare -A dir_counts
total_files=0

# Temporary files for processing
TEMP_FILE_LIST="${OUTPUT_DIR}/temp_files.txt"
> "$TEMP_FILE_LIST"

echo -e "${YELLOW}🔍 Discovering all documentation files...${NC}"
echo ""

# Find all documentation files
find "$PROJECT_ROOT" -type f \
  \( -name "*.md" -o -name "*.txt" -o -name "*.json" -o -name "*.yaml" -o -name "*.yml" -o -name "*.mdx" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/dist/*" \
  ! -path "*/build/*" \
  ! -path "*/coverage/*" \
  ! -path "*/.next/*" \
  ! -path "*/venv/*" \
  ! -path "*/__pycache__/*" \
  ! -path "*/\.documentation-system/*" \
  -print0 | while IFS= read -r -d '' file; do
    # Get relative path
    rel_path="${file#$PROJECT_ROOT/}"

    # Get file extension
    extension="${file##*.}"

    # Get directory
    directory=$(dirname "$rel_path")

    # Get file size (cross-platform)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        size=$(stat -f%z "$file" 2>/dev/null || echo 0)
        modified=$(stat -f%m "$file" 2>/dev/null || echo 0)
    else
        size=$(stat -c%s "$file" 2>/dev/null || echo 0)
        modified=$(stat -c%Y "$file" 2>/dev/null || echo 0)
    fi

    # Calculate hash
    if command -v sha256sum &> /dev/null; then
        hash=$(sha256sum "$file" | cut -d' ' -f1)
    elif command -v shasum &> /dev/null; then
        hash=$(shasum -a 256 "$file" | cut -d' ' -f1)
    else
        hash="unknown"
    fi

    # Count lines
    if [[ "$extension" == "md" || "$extension" == "txt" || "$extension" == "mdx" ]]; then
        line_count=$(wc -l < "$file" | tr -d ' ')
    else
        line_count=0
    fi

    # Output to temp file in JSON format
    echo "{\"path\":\"$rel_path\",\"size\":$size,\"type\":\"$extension\",\"directory\":\"$directory\",\"modified\":$modified,\"hash\":\"$hash\",\"lines\":$line_count}" >> "$TEMP_FILE_LIST"

    echo -e "  ${GREEN}✓${NC} $rel_path (${size} bytes)"
done

echo ""
echo -e "${YELLOW}📊 Analyzing discovered files...${NC}"

# Count files by type and directory
while IFS= read -r line; do
    total_files=$((total_files + 1))

    # Extract type
    type=$(echo "$line" | grep -o '"type":"[^"]*"' | cut -d'"' -f4)
    type_counts[$type]=$((${type_counts[$type]:-0} + 1))

    # Extract directory (first level)
    dir=$(echo "$line" | grep -o '"directory":"[^"]*"' | cut -d'"' -f4 | cut -d'/' -f1)
    dir_counts[$dir]=$((${dir_counts[$dir]:-0} + 1))
done < "$TEMP_FILE_LIST"

# Build JSON manifest
cat > "$MANIFEST_FILE" << EOF
{
  "metadata": {
    "generated": "$TIMESTAMP",
    "total_files": $total_files,
    "by_type": {
EOF

# Add type counts
first=true
for type in "${!type_counts[@]}"; do
    if [ "$first" = true ]; then
        first=false
    else
        echo "," >> "$MANIFEST_FILE"
    fi
    echo -n "      \"$type\": ${type_counts[$type]}" >> "$MANIFEST_FILE"
done

cat >> "$MANIFEST_FILE" << EOF

    },
    "by_directory": {
EOF

# Add directory counts
first=true
for dir in "${!dir_counts[@]}"; do
    if [ "$first" = true ]; then
        first=false
    else
        echo "," >> "$MANIFEST_FILE"
    fi
    echo -n "      \"$dir\": ${dir_counts[$dir]}" >> "$MANIFEST_FILE"
done

cat >> "$MANIFEST_FILE" << EOF

    }
  },
  "files": [
EOF

# Add all files
awk '{print "    " $0 ","}' "$TEMP_FILE_LIST" | sed '$ s/,$//' >> "$MANIFEST_FILE"

cat >> "$MANIFEST_FILE" << EOF

  ]
}
EOF

# Clean up temp file
rm "$TEMP_FILE_LIST"

# Display summary
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Discovery Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Total files discovered: ${BLUE}${total_files}${NC}"
echo ""
echo "By Type:"
for type in "${!type_counts[@]}"; do
    echo -e "  ${type}: ${BLUE}${type_counts[$type]}${NC}"
done
echo ""
echo "By Directory:"
for dir in "${!dir_counts[@]}"; do
    echo -e "  ${dir}: ${BLUE}${dir_counts[$dir]}${NC}"
done
echo ""
echo -e "Manifest saved to: ${YELLOW}${MANIFEST_FILE}${NC}"
echo ""
echo -e "${GREEN}✅ Stage 1 Complete${NC}"
echo ""
echo -e "${YELLOW}Next step: Run ./02-classify.sh to classify all documents${NC}"
echo ""
