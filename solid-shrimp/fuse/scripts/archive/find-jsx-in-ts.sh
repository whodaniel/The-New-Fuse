#!/bin/bash

# Find all .ts files that contain JSX syntax
find . -name "*.ts" -type f -not -path "*/node_modules/*" -not -path "*/dist/*" -exec grep -l "<.*>" {} \; | grep -v ".d.ts" > jsx-in-ts-files.txt

echo "Files with JSX syntax that should be renamed to .tsx:"
cat jsx-in-ts-files.txt
