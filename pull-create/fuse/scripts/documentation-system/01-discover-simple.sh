#!/bin/bash
# Stage 1: Comprehensive Document Discovery (Simplified, Compatible Version)
# Part of The Living Documentation System

set -e

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUTPUT_DIR="${PROJECT_ROOT}/.documentation-system"
MANIFEST_FILE="${OUTPUT_DIR}/manifest.json"
RAW_FILE="${OUTPUT_DIR}/raw_manifest.txt"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT%H:%M:%S)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  The New Fuse - Living Documentation System"
echo "  Stage 1: Document Discovery"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Clear output files
> "$RAW_FILE"
> "$MANIFEST_FILE"

echo "🔍 Discovering all documentation files..."
echo ""

total_files=0

# Find all documentation files and process them
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
  ! -path "*/.documentation-system/*" \
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

    # Calculate hash (try different tools)
    if command -v sha256sum &> /dev/null; then
        hash=$(sha256sum "$file" | cut -d' ' -f1)
    elif command -v shasum &> /dev/null; then
        hash=$(shasum -a 256 "$file" | cut -d' ' -f1)
    else
        hash="unknown"
    fi

    # Count lines (for text files)
    if [[ "$extension" == "md" || "$extension" == "txt" || "$extension" == "mdx" ]]; then
        line_count=$(wc -l < "$file" 2>/dev/null | tr -d ' ' || echo 0)
    else
        line_count=0
    fi

    # Write to raw file (tab-separated)
    echo -e "${rel_path}\t${size}\t${extension}\t${directory}\t${modified}\t${hash}\t${line_count}" >> "$RAW_FILE"

    echo "  ✓ $rel_path (${size} bytes)"

    total_files=$((total_files + 1))
done

echo ""
echo "📊 Processing results..."
echo ""

# Count files by type
md_count=$(grep -c $'\t'"md"$'\t' "$RAW_FILE" 2>/dev/null || echo 0)
txt_count=$(grep -c $'\t'"txt"$'\t' "$RAW_FILE" 2>/dev/null || echo 0)
json_count=$(grep -c $'\t'"json"$'\t' "$RAW_FILE" 2>/dev/null || echo 0)
yaml_count=$(grep -c $'\t'"yaml"$'\t' "$RAW_FILE" 2>/dev/null || echo 0)
yml_count=$(grep -c $'\t'"yml"$'\t' "$RAW_FILE" 2>/dev/null || echo 0)
mdx_count=$(grep -c $'\t'"mdx"$'\t' "$RAW_FILE" 2>/dev/null || echo 0)

# Calculate total YAML (yaml + yml)
total_yaml=$((yaml_count + yml_count))

# Build JSON manifest
cat > "$MANIFEST_FILE" << EOF
{
  "metadata": {
    "generated": "$TIMESTAMP",
    "total_files": $total_files,
    "by_type": {
      "markdown": $md_count,
      "text": $txt_count,
      "json": $json_count,
      "yaml": $total_yaml,
      "mdx": $mdx_count
    },
    "by_directory": {}
  },
  "files": [
EOF

# Convert raw data to JSON
first_file=true
while IFS=$'\t' read -r path size type directory modified hash lines; do
    if [ "$first_file" = true ]; then
        first_file=false
    else
        echo "," >> "$MANIFEST_FILE"
    fi

    cat >> "$MANIFEST_FILE" << EOF
    {
      "path": "$path",
      "size": $size,
      "type": "$type",
      "directory": "$directory",
      "modified": $modified,
      "hash": "$hash",
      "lines": $lines
    }
EOF
done < "$RAW_FILE"

# Close JSON
cat >> "$MANIFEST_FILE" << EOF

  ]
}
EOF

# Display summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Discovery Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Total files discovered: $total_files"
echo ""
echo "By Type:"
echo "  markdown: $md_count"
echo "  text: $txt_count"
echo "  json: $json_count"
echo "  yaml: $total_yaml"
echo "  mdx: $mdx_count"
echo ""
echo "Manifest saved to: $MANIFEST_FILE"
echo ""
echo "✅ Stage 1 Complete"
echo ""
echo "Next step: Review manifest.json and prepare for classification"
echo ""
