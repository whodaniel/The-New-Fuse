#\!/bin/bash

# Counter for tracking fixes
declare -i total_fixes=0
declare -i files_processed=0

# Function to add .js extension to relative imports
fix_imports_in_file() {
    local file="$1"
    local temp_file=$(mktemp)
    local fixes_in_file=0
    
    echo "Processing: $file"
    
    # Copy original file to temp
    cp "$file" "$temp_file"
    
    # Fix different import patterns
    # Pattern 1: from './something' -> from './something.js'
    sed -i.bak "s|from '\(\./[^']*[^s]\)'|from '\1.js'|g" "$temp_file"
    fixes_in_file=$((fixes_in_file + $(diff "$file" "$temp_file" | grep -c "^<")))
    
    # Pattern 2: from "../something" -> from "../something.js"
    sed -i.bak "s|from \"\(\.\./[^\"]*[^s]\)\"|from \"\1.js\"|g" "$temp_file"
    fixes_in_file=$((fixes_in_file + $(diff "$file.bak" "$temp_file" | grep -c "^<")))
    
    # Pattern 3: from './something' -> from './something.js' (double quotes)
    sed -i.bak "s|from \"\(\./[^\"]*[^s]\)\"|from \"\1.js\"|g" "$temp_file"
    fixes_in_file=$((fixes_in_file + $(diff "$file.bak" "$temp_file" | grep -c "^<")))
    
    # Pattern 4: from '../something' -> from '../something.js' (single quotes)
    sed -i.bak "s|from '\(\.\./[^']*[^s]\)'|from '\1.js'|g" "$temp_file"
    fixes_in_file=$((fixes_in_file + $(diff "$file.bak" "$temp_file" | grep -c "^<")))
    
    # Only replace if changes were made
    if \! cmp -s "$file" "$temp_file"; then
        cp "$temp_file" "$file"
        echo "  Fixed $fixes_in_file imports in $file"
        total_fixes=$((total_fixes + fixes_in_file))
    else
        echo "  No changes needed in $file"
    fi
    
    # Cleanup
    rm -f "$temp_file" "$file.bak"
    files_processed=$((files_processed + 1))
}

# Process all files from our list
while IFS= read -r file; do
    if [ -f "$file" ]; then
        fix_imports_in_file "$file"
    fi
done < /tmp/files_with_imports.txt

echo ""
echo "Summary:"
echo "Files processed: $files_processed"
echo "Total fixes applied: $total_fixes"
