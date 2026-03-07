#!/bin/bash

# Function to convert a file to TypeScript
convert_file() {
    local file="$1"
    local dir=$(dirname "$file")
    local base=$(basename "$file")
    local new_ext=""
    
    # Skip if file doesn't exist
    [ ! -f "$file" ] && return
    
    # Determine new extension based on content and path
    if grep -l "React" "$file" > /dev/null 2>&1 || [[ "$file" == *"/components/"* ]]; then
        new_ext="tsx"
    else
        new_ext="ts"
    fi
    
    # Convert file
    local new_file="${dir}/${base%.js}.${new_ext}"
    echo "Converting $file to $new_file"
    mv "$file" "$new_file"
}

# Find all .js files and convert them
find . -type f -name "*.js" | while read -r file; do
    # Skip node_modules and dist directories
    if [[ "$file" != *"node_modules"* ]] && [[ "$file" != *"dist"* ]]; then
        convert_file "$file"
    fi
done
