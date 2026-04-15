#!/bin/bash

echo "Fixing malformed template literals in core package..."

# Fix malformed template literals with nested backticks
find packages/core/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/`\${/\${/g'
find packages/core/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/}\`/}/g'

# Fix specific template literal patterns that are malformed
find packages/core/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' "s/\`\${index}\`/\${index}/g"
find packages/core/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' "s/\`\${step\.id}\`/\${step.id}/g"
find packages/core/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' "s/\`\${step\.type}\`/\${step.type}/g"
find packages/core/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' "s/\`\${depId}\`/\${depId}/g"

# Fix malformed array/object syntax
find packages/core/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' "s/{ stepIndex: 'index' }/{ stepIndex: index }/g"

echo "Template literal fixes complete."
