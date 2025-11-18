#!/bin/bash

# Fix malformed string literals in TypeScript files
cd "./packages/core"

echo "Fixing malformed string literals..."

# Fix patterns like "purposeNAME' | other'" to "purpose: 'NAME' | 'other'"
find src -name "*.ts" -type f -exec sed -i '' 's/:system'"'"' | user'"'"' | function'"'"' | response'"'"'/: '"'"'system'"'"' | '"'"'user'"'"' | '"'"'function'"'"' | '"'"'response'"'"'/g' {} \;

# Fix patterns like "formattext' | json'" to "format: 'text' | 'json'"  
find src -name "*.ts" -type f -exec sed -i '' 's/:text'"'"' | json'"'"' | markdown'"'"' | code'"'"'/: '"'"'text'"'"' | '"'"'json'"'"' | '"'"'markdown'"'"' | '"'"'code'"'"'/g' {} \;

# Fix patterns like "aggregationavg' | sum'" to "aggregation: 'avg' | 'sum'"
find src -name "*.ts" -type f -exec sed -i '' 's/:avg'"'"' | sum'"'"' | count'"'"'/: '"'"'avg'"'"' | '"'"'sum'"'"' | '"'"'count'"'"'/g' {} \;

# Fix patterns like "groupByhour' | day'" to "groupBy: 'hour' | 'day'"
find src -name "*.ts" -type f -exec sed -i '' 's/:hour'"'"' | day'"'"' | month'"'"'/: '"'"'hour'"'"' | '"'"'day'"'"' | '"'"'month'"'"'/g' {} \;

# Fix patterns like "complexityLevelSIMPLE'" to "complexityLevel: 'SIMPLE'"
find src -name "*.ts" -type f -exec sed -i '' 's/:SIMPLE'"'"' | MODERATE'"'"' | COMPLEX'"'"' | EXPERT'"'"'/: '"'"'SIMPLE'"'"' | '"'"'MODERATE'"'"' | '"'"'COMPLEX'"'"' | '"'"'EXPERT'"'"'/g' {} \;

# Fix patterns like "skillLevelBEGINNER'" to "skillLevel: 'BEGINNER'"
find src -name "*.ts" -type f -exec sed -i '' 's/:BEGINNER'"'"' | INTERMEDIATE'"'"' | ADVANCED'"'"' | EXPERT'"'"'/: '"'"'BEGINNER'"'"' | '"'"'INTERMEDIATE'"'"' | '"'"'ADVANCED'"'"' | '"'"'EXPERT'"'"'/g' {} \;

# Fix patterns like "prioritylow'" to "priority: 'low'"
find src -name "*.ts" -type f -exec sed -i '' 's/:low'"'"' | medium'"'"' | high'"'"'/: '"'"'low'"'"' | '"'"'medium'"'"' | '"'"'high'"'"'/g' {} \;

# Fix missing opening quotes
find src -name "*.ts" -type f -exec sed -i '' 's/= running'"'"' | completed'"'"' | failed'"'"' | cancelled'"'"'/= '"'"'running'"'"' | '"'"'completed'"'"' | '"'"'failed'"'"' | '"'"'cancelled'"'"'/g' {} \;

# Fix missing opening quotes for status types
find src -name "*.ts" -type f -exec sed -i '' 's/= error'"'"' | warn'"'"' | info'"'"' | debug'"'"'/= '"'"'error'"'"' | '"'"'warn'"'"' | '"'"'info'"'"' | '"'"'debug'"'"'/g' {} \;

# Fix double quotes in imports
find src -name "*.ts" -type f -exec sed -i '' "s/from '''/from '/g" {} \;

# Fix missing quotes before |
find src -name "*.ts" -type f -exec sed -i '' "s/performance'/'"'"'performance'"'"'/g" {} \;
find src -name "*.ts" -type f -exec sed -i '' "s/error'/'"'"'error'"'"'/g" {} \;

echo "Fixed malformed string literals in TypeScript files."
