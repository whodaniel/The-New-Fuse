#!/bin/bash
set -e

echo "Fixing compiled TypeScript errors..."

# Remove all compiled files
rm -rf packages/core/dist

# Add missing type declarations
function add_type_declarations() {
    mkdir -p packages/core/types
    
    # Create index.d.ts
    cat > packages/core/types/index.d.ts << EOL
export interface Agent {
    id: string;
    name: string;
    type: string;
    status: 'active' | 'inactive';
    config: Record<string, unknown>;
}

export interface Workflow {
    id: string;
    name: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
}

export interface WorkflowNode {
    id: string;
    type: string;
    position: { x: number; y: number };
    data: Record<string, unknown>;
}

export interface WorkflowEdge {
    id: string;
    source: string;
    target: string;
}
EOL
}

# Update tsconfig.json
function update_tsconfig() {
    cat > packages/core/tsconfig.json << EOL
{
    "extends": "../../tsconfig.json",
    "compilerOptions": {
        "outDir": "./dist",
        "rootDir": "./src",
        "declaration": true,
        "declarationMap": true,
        "sourceMap": true,
        "strict": true
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
EOL
}

# Main execution
add_type_declarations
update_tsconfig

# Rebuild the project
echo "Rebuilding project..."
yarn build

echo "Running type check..."
npx tsc --noEmit