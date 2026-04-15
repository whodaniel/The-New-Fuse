#!/bin/bash
echo "Finding files with most TypeScript errors..."
npx tsc --noEmit --skipLibCheck 2>&1 | grep -E "^(apps|packages)/" | cut -d'(' -f1 | sort | uniq -c | sort -nr | head -20
