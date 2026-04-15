    #!/bin/bash
set -e

echo "Verifying remaining TypeScript errors..."

# Run TypeScript compiler and save output
npx tsc --noEmit > tmp/ts-errors.txt 2>&1 || true

# Analyze error patterns
echo "Analyzing error patterns..."
cat tmp/ts-errors.txt | grep -E "error TS[0-9]+" | sed 's/.*error \(TS[0-9]\+\).*/\1/' | sort | uniq -c | sort -nr > tmp/error-patterns.txt

# Create targeted fixes based on error types
function fix_type_errors() {
    # Fix missing type declarations
    find src packages -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i'' -e 's/: any/: unknown/g'
    
    # Fix React component types
    find src packages -type f -name "*.tsx" | xargs sed -i'' -e 's/React.FC</FC</g'
    
    # Fix Promise return types
    find src packages -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i'' -e 's/async \([^:]*\)(/async \1(): Promise<void> (/g'
    
    # Fix module declarations
    find src packages -type f -name "*.ts" -o -name "*.tsx" | while read file; do
        if ! grep -q "export " "$file"; then
            echo "export {};" >> "$file"
        fi
    done
}

# Run fixes
fix_type_errors

# Verify fixes worked
echo "Running final verification..."
if npx tsc --noEmit; then
    echo "All TypeScript errors have been fixed!"
else
    echo "Some errors remain. Check typescript-errors.log for details."
    npx tsc --noEmit > typescript-errors.log 2>&1
fi