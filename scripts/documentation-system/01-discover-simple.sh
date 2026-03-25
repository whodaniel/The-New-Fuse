#!/usr/bin/env bash
# Stage 1: Comprehensive Document Discovery (Robust)
# Part of The Living Documentation System

set -euo pipefail

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUTPUT_DIR="${PROJECT_ROOT}/.documentation-system"
MANIFEST_FILE="${OUTPUT_DIR}/manifest.json"
RAW_FILE="${OUTPUT_DIR}/raw_manifest.txt"
TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT%H:%M:%S)"
VERBOSE="${DOC_DISCOVERY_VERBOSE:-0}"
INCLUDE_PULL_CREATE="${DOC_DISCOVERY_INCLUDE_PULL_CREATE:-0}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  The New Fuse - Living Documentation System"
echo "  Stage 1: Document Discovery"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

mkdir -p "$OUTPUT_DIR"
> "$RAW_FILE"
> "$MANIFEST_FILE"

echo "🔍 Discovering documentation files..."
echo ""

EXCLUDES=(
  "*/node_modules/*"
  "*/.git/*"
  "*/dist/*"
  "*/build/*"
  "*/coverage/*"
  "*/.next/*"
  "*/venv/*"
  "*/.venv/*"
  "*/.venv_*/*"
  "*/.venv-*/*"
  "*/__pycache__/*"
  "*/.documentation-system/*"
  "*/.turbo/*"
  "*/.tmp/*"
)

if [[ "$INCLUDE_PULL_CREATE" != "1" ]]; then
  EXCLUDES+=("*/pull-create/*")
fi

find_cmd=(
  find "$PROJECT_ROOT" -type f
  \( -name "*.md" -o -name "*.txt" -o -name "*.json" -o -name "*.yaml" -o -name "*.yml" -o -name "*.mdx" \)
)

for pattern in "${EXCLUDES[@]}"; do
  find_cmd+=( ! -path "$pattern" )
done
find_cmd+=( -print0 )

while IFS= read -r -d '' file; do
  rel_path="${file#$PROJECT_ROOT/}"
  extension="${file##*.}"
  directory="$(dirname -- "$rel_path")"

  if [[ "$OSTYPE" == "darwin"* ]]; then
    size="$(stat -f%z "$file" 2>/dev/null || echo 0)"
    modified="$(stat -f%m "$file" 2>/dev/null || echo 0)"
  else
    size="$(stat -c%s "$file" 2>/dev/null || echo 0)"
    modified="$(stat -c%Y "$file" 2>/dev/null || echo 0)"
  fi

  if command -v sha256sum >/dev/null 2>&1; then
    hash="$(sha256sum "$file" | cut -d' ' -f1)"
  elif command -v shasum >/dev/null 2>&1; then
    hash="$(shasum -a 256 "$file" | cut -d' ' -f1)"
  else
    hash="unknown"
  fi

  if [[ "$extension" == "md" || "$extension" == "txt" || "$extension" == "mdx" ]]; then
    line_count="$(wc -l < "$file" 2>/dev/null | tr -d ' ' || echo 0)"
  else
    line_count=0
  fi

  printf "%s\t%s\t%s\t%s\t%s\t%s\t%s\n" \
    "$rel_path" "$size" "$extension" "$directory" "$modified" "$hash" "$line_count" >> "$RAW_FILE"

  if [[ "$VERBOSE" == "1" ]]; then
    echo "  ✓ $rel_path (${size} bytes)"
  fi
done < <("${find_cmd[@]}")

total_files="$(wc -l < "$RAW_FILE" | tr -d ' ')"
md_count="$(awk -F '\t' '$3=="md"{c++} END{print c+0}' "$RAW_FILE")"
txt_count="$(awk -F '\t' '$3=="txt"{c++} END{print c+0}' "$RAW_FILE")"
json_count="$(awk -F '\t' '$3=="json"{c++} END{print c+0}' "$RAW_FILE")"
yaml_count="$(awk -F '\t' '$3=="yaml" || $3=="yml"{c++} END{print c+0}' "$RAW_FILE")"
mdx_count="$(awk -F '\t' '$3=="mdx"{c++} END{print c+0}' "$RAW_FILE")"

declare -A dir_counts=()
while IFS=$'\t' read -r _path _size _type directory _modified _hash _lines; do
  top="${directory%%/*}"
  [[ -z "$top" ]] && top="."
  dir_counts["$top"]=$(( ${dir_counts["$top"]:-0} + 1 ))
done < "$RAW_FILE"

{
  echo "{"
  echo "  \"metadata\": {"
  echo "    \"generated\": \"$TIMESTAMP\","
  echo "    \"total_files\": $total_files,"
  echo "    \"by_type\": {"
  echo "      \"markdown\": $md_count,"
  echo "      \"text\": $txt_count,"
  echo "      \"json\": $json_count,"
  echo "      \"yaml\": $yaml_count,"
  echo "      \"mdx\": $mdx_count"
  echo "    },"
  echo "    \"by_directory\": {"
} > "$MANIFEST_FILE"

first=true
for key in "${!dir_counts[@]}"; do
  if [[ "$first" == true ]]; then
    first=false
  else
    echo "," >> "$MANIFEST_FILE"
  fi
  printf "      \"%s\": %s" "$key" "${dir_counts[$key]}" >> "$MANIFEST_FILE"
done

{
  echo ""
  echo "    }"
  echo "  },"
  echo "  \"files\": ["
} >> "$MANIFEST_FILE"

first=true
while IFS=$'\t' read -r path size type directory modified hash lines; do
  if [[ "$first" == true ]]; then
    first=false
  else
    echo "," >> "$MANIFEST_FILE"
  fi

  cat >> "$MANIFEST_FILE" <<EOF
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

cat >> "$MANIFEST_FILE" <<EOF

  ]
}
EOF

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
echo "  yaml: $yaml_count"
echo "  mdx: $mdx_count"
echo ""
echo "Manifest saved to: $MANIFEST_FILE"
echo "Raw manifest saved to: $RAW_FILE"
echo ""
echo "✅ Stage 1 Complete"
echo ""
