#!/bin/bash
set -e

echo "🔍 Verifying page organization..."

# Define expected locations
LOCATIONS=(
    "apps/frontend/src/pages"
    "packages/features/*/pages"
    "packages/features/*/components"
    "packages/ui-components/src"
    "packages/shared/components"
)

# Check for any remaining pages in old locations
echo "Checking for pages in deprecated locations..."
find ./apps/frontend/src/components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec grep -l "Page\|View\|Screen" {} \;

# Verify all pages have proper routing
echo "Verifying route definitions..."
find ./apps/frontend/src -type f -name "*.tsx" -exec grep -l "Route" {} \;

# Check for proper imports
echo "Checking import patterns..."
find . -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec grep -l "import.*from.*components" {} \;

# Verify component organization
echo "Verifying component organization..."
for dir in "${LOCATIONS[@]}"; do
    if [ ! -d "$dir" ]; then
        echo "❌ Missing directory: $dir"
    else
        echo "✓ Found directory: $dir"
        ls -R "$dir"
    fi
done

echo "✅ Verification complete!"