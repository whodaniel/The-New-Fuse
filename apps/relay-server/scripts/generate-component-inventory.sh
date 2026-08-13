
#!/bin/bash
set -e

echo "📊 Generating detailed component inventory..."

# Create inventory directory
INVENTORY_DIR="./component-inventory"
mkdir -p "$INVENTORY_DIR"

# Function to detect component type
detect_component_type() {
    local file=$1
    if [[ $file =~ /atoms/ ]]; then
        echo "Atomic"
    elif [[ $file =~ /molecules/ ]]; then
        echo "Molecular"
    elif [[ $file =~ /organisms/ ]]; then
        echo "Organism"
    elif [[ $file =~ /features/ ]]; then
        echo "Feature"
    elif [[ $file =~ /pages/ || $file =~ /views/ ]]; then
        echo "Page"
    elif [[ $file =~ /layout/ ]]; then
        echo "Layout"
    else
        echo "Uncategorized"
    fi
}

# Function to extract feature domain
extract_feature_domain() {
    local file=$1
    if [[ $file =~ /features/([^/]+) ]]; then
        echo "${BASH_REMATCH[1]}"
    elif [[ $file =~ /components/([^/]+) ]]; then
        echo "${BASH_REMATCH[1]}"
    else
        echo "core"
    fi
}

echo "Generating inventory markdown..."
cat > "$INVENTORY_DIR/INVENTORY.md" << EOL
# Component Inventory

Generated on $(date)

## Overview

This inventory is auto-generated from the codebase analysis.

## Component Categories

EOL

# Process all UI files and categorize them
while IFS= read -r file; do
    type=$(detect_component_type "$file")
    domain=$(extract_feature_domain "$file")
    echo "Processing: $file (Type: $type, Domain: $domain)"
    
    # Add to the appropriate section in the markdown
    echo "### $type Components - $domain" >> "$INVENTORY_DIR/INVENTORY.md"
    echo "- \`$file\`" >> "$INVENTORY_DIR/INVENTORY.md"
    
    # Extract exports
    echo "  Exports:" >> "$INVENTORY_DIR/INVENTORY.md"
    grep -h "^export" "$file" 2>/dev/null | sed 's/^/    - /' >> "$INVENTORY_DIR/INVENTORY.md"
    echo "" >> "$INVENTORY_DIR/INVENTORY.md"
done < "./ui-audit-results/all-ui-files.txt"

# Add Routes section
echo "## Routes" >> "$INVENTORY_DIR/INVENTORY.md"
if [ -f "./ui-audit-results/routes.txt" ]; then
    cat "./ui-audit-results/routes.txt" | sed 's/^/- /' >> "$INVENTORY_DIR/INVENTORY.md"
fi

# Add Dependency Analysis
echo "## Dependency Analysis" >> "$INVENTORY_DIR/INVENTORY.md"
echo "\`\`\`" >> "$INVENTORY_DIR/INVENTORY.md"
cat "./ui-audit-results/dependency-tree.txt" >> "$INVENTORY_DIR/INVENTORY.md"
echo "\`\`\`" >> "$INVENTORY_DIR/INVENTORY.md"

# Generate Statistics
echo "## Statistics" >> "$INVENTORY_DIR/INVENTORY.md"
echo "- Total Components: $(wc -l < ./ui-audit-results/all-ui-files.txt)" >> "$INVENTORY_DIR/INVENTORY.md"
echo "- Routes: $(wc -l < ./ui-audit-results/routes.txt)" >> "$INVENTORY_DIR/INVENTORY.md"
echo "- Feature Components: $(grep -c "/features/" ./ui-audit-results/all-ui-files.txt)" >> "$INVENTORY_DIR/INVENTORY.md"

echo "## Recommendations" >> "$INVENTORY_DIR/INVENTORY.md"
echo "
1. Component Consolidation:
   - Merge duplicate components (especially in UI and core packages)
   - Standardize component APIs
   
2. Feature Organization:
   - Group related features into domains
   - Create shared components for common patterns

3. Next Steps:
   - Review duplicate implementations
   - Standardize naming conventions
   - Implement consistent prop interfaces
" >> "$INVENTORY_DIR/INVENTORY.md"

echo "✅ Component inventory generated in $INVENTORY_DIR/INVENTORY.md"
