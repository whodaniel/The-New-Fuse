#!/bin/bash
set -e

echo "🏗️ Component Reorganization Plan"

# 1. Core UI Components (/packages/ui-components/src/)
mkdir -p packages/ui-components/src/core
echo "Moving core UI components..."
# Most reused components from /components/ui/
mv apps/frontend/src/components/ui/* packages/ui-components/src/core/

# 2. Feature Modules (/packages/features/)
declare -a features=("dashboard" "agents" "auth")
for feature in "${features[@]}"; do
    echo "Setting up $feature feature..."
    mkdir -p "packages/features/$feature"/{components,hooks,utils}
    
    # Move components
    mv "apps/frontend/src/components/$feature"/* "packages/features/$feature/components/"
    # Move related hooks and utils if they exist
    [ -d "apps/frontend/src/hooks/$feature" ] && mv "apps/frontend/src/hooks/$feature"/* "packages/features/$feature/hooks/"
done

# 3. Page Components (/apps/frontend/src/pages)
echo "Organizing pages..."
mkdir -p apps/frontend/src/pages/{workspace,dashboard,auth}

# 4. Shared Utils (/packages/shared/utils)
echo "Consolidating shared utilities..."
mkdir -p packages/shared/utils
mv apps/frontend/src/utils/{toast,paths}.ts packages/shared/utils/

# 5. Create index files
echo "Creating index exports..."
for dir in $(find packages -type d -name "components"); do
    echo "export * from './';" > "$dir/index.ts"
done

echo "
📋 Reorganization Summary:
1. Core UI: packages/ui-components/src/core/
2. Features: packages/features/{dashboard,agents,auth}/
3. Pages: apps/frontend/src/pages/
4. Shared: packages/shared/utils/

Next steps:
1. Update import statements
2. Create component documentation
3. Add type definitions
4. Update build configuration
"

# Create documentation
cat > docs/COMPONENT_STRUCTURE.md << EOL
# Component Structure

## Core UI Components
Located in \`packages/ui-components/src/core\`
- Reusable UI primitives
- Design system components
- Layout components

## Feature Modules
Located in \`packages/features\`
- Dashboard (\`/dashboard\`)
- Agents (\`/agents\`)
- Auth (\`/auth\`)

## Pages
Located in \`apps/frontend/src/pages\`
- Workspace views
- Dashboard views
- Auth pages

## Shared Utilities
Located in \`packages/shared/utils\`
- Toast notifications
- Path utilities
EOL

echo "✅ Plan generated! Review docs/COMPONENT_STRUCTURE.md for details."