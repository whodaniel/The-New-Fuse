#!/bin/bash

set -e

echo "=== Fixing JavaScript to TypeScript Conversion Script ==="

# Make a backup of the original script
cp convert-js-to-ts.sh convert-js-to-ts.sh.bak
echo "Backup created: convert-js-to-ts.sh.bak"

# Fix the sed command in the script
sed -i '' 's/sed -i.bak \'1i\\\/\/ @ts-check\\n\' "$new_file"/sed -i "" "1i\\\// @ts-check\\n" "$new_file"/' convert-js-to-ts.sh

# Make the script executable
chmod +x convert-js-to-ts.sh

echo "=== Fixed JavaScript to TypeScript Conversion Script ==="
echo "You can now run ./convert-js-to-ts.sh to convert your JavaScript files to TypeScript."