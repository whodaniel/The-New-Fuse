#!/bin/bash

echo "🧹 Cleaning up .js files that were generated alongside .ts source files..."

# Function to check if a .js file has a corresponding .ts file
cleanup_js_files() {
    local dir="$1"
    
    find "$dir" -name "*.js" -type f | while read -r js_file; do
        # Get the corresponding .ts file path
        ts_file="${js_file%.js}.ts"
        tsx_file="${js_file%.js}.tsx"
        
        # Check if this .js file has a corresponding .ts or .tsx file
        if [[ -f "$ts_file" || -f "$tsx_file" ]]; then
            echo "🗑️  Removing: $js_file (has corresponding TypeScript source)"
            rm "$js_file"
        fi
    done
}

# Clean up .js files in source directories
echo "Cleaning packages..."
cleanup_js_files "packages"

echo "Cleaning apps..."
cleanup_js_files "apps"

echo "Cleaning src..."
if [[ -d "src" ]]; then
    cleanup_js_files "src"
fi

# Also clean up .js.map files
echo "Cleaning up .js.map files..."
find . -name "*.js.map" -type f | while read -r map_file; do
    # Check if there's a corresponding .ts file
    base_name="${map_file%.js.map}"
    if [[ -f "${base_name}.ts" || -f "${base_name}.tsx" ]]; then
        echo "🗑️  Removing: $map_file"
        rm "$map_file"
    fi
done

# Clean up .d.ts files that were generated alongside source files
echo "Cleaning up generated .d.ts files in source directories..."
find packages apps src -name "*.d.ts" -type f 2>/dev/null | while read -r dts_file; do
    # Skip if it's in a dist or build directory
    if [[ "$dts_file" == *"/dist/"* || "$dts_file" == *"/build/"* || "$dts_file" == *"/lib/"* ]]; then
        continue
    fi
    
    # Check if there's a corresponding .ts file
    base_name="${dts_file%.d.ts}"
    if [[ -f "${base_name}.ts" || -f "${base_name}.tsx" ]]; then
        echo "🗑️  Removing: $dts_file"
        rm "$dts_file"
    fi
done

echo "✅ Cleanup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Run 'bun run build' to compile TypeScript properly to dist directories"
echo "2. Make sure your build scripts use the correct output directories"
echo "3. Update any imports that might reference .js files directly"