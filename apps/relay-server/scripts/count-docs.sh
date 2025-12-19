#!/bin/bash

echo "📊 Counting documentation files..."

# Count .md files
md_files=$(find . -type f -name "*.md" \
    ! -path "*/node_modules/*" \
    ! -path "*/dist/*" \
    ! -path "*/build/*" \
    | wc -l)

# Count .txt files
txt_files=$(find . -type f -name "*.txt" \
    ! -path "*/node_modules/*" \
    ! -path "*/dist/*" \
    ! -path "*/build/*" \
    | wc -l)

echo "Markdown files (.md): $md_files"
echo "Text files (.txt): $txt_files"
echo "Total documentation files: $((md_files + txt_files))"