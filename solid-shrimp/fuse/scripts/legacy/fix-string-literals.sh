#!/bin/bash

echo "Fixing malformed string literals in core package..."

# Fix malformed 'EX' strings
find packages/core/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/EX'"'"'/'"'"'EX'"'"'/g'

# Fix malformed boolean types
find packages/core/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' "s/'boolean'//g"

# Fix malformed complexity enums
find packages/core/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' "s/complexityLevel:SIMPLE'/complexityLevel: 'SIMPLE'/g"
find packages/core/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' "s/| MODERATE'/| 'MODERATE'/g"
find packages/core/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' "s/| COMPLEX'/| 'COMPLEX'/g"
find packages/core/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' "s/| EXPERT'/| 'EXPERT'/g"

# Fix malformed hex strings
find packages/core/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' "s/hex'/'"'"'hex'"'"'/g"

# Fix request structure types
find packages/core/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' "s/requestStructure:simple'/requestStructure: 'simple'/g"
find packages/core/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' "s/| medium'/| 'medium'/g"
find packages/core/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' "s/| complex'/| 'complex'/g"

# Fix malformed property keys
find packages/core/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' "s/COMPLEX':/'"'"'COMPLEX'"'"':/g"
find packages/core/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' "s/EXPERT':/'"'"'EXPERT'"'"':/g"

echo "String literal fixes complete."
