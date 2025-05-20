#!/bin/bash
set -e

echo "Fixing React component TypeScript errors..."

# Fix React component files
function fix_react_components() {
    find packages/core/components -type f -name "*.tsx" -exec sed -i'' -e '
        # Add proper React imports
        1i\
import { FC, ReactNode, useCallback, useEffect, useState } from '\''react'\'';
        # Fix component type declarations
        s/function \([A-Za-z]\+\)(/const \1: FC = (/g;
        # Add return type annotations
        s/=> (/): JSX.Element => (/g;
        # Fix event handler types
        s/onChange={(/onChange={(e: React.ChangeEvent<HTMLInputElement>) => (/g;
        s/onClick={(/onClick={(e: React.MouseEvent) => (/g;
        # Fix children prop types
        s/children: any/children: ReactNode/g;
        # Fix state types
        s/useState(/useState<string>(/g;
        s/useState<any>/useState<unknown>/g;
    ' {} \;
}

# Fix specific component files
function fix_specific_components() {
    # AgentCard
    sed -i'' -e '
        s/interface AgentCardProps {/interface AgentCardProps {\n  agent: Agent;\n  onDelete?: (id: string) => void;/g
    ' packages/core/components/agents/AgentCard.tsx

    # WorkflowCanvas
    sed -i'' -e '
        s/interface WorkflowCanvasProps {/interface WorkflowCanvasProps {\n  workflow: Workflow;\n  onUpdate: (workflow: Workflow) => void;/g
    ' packages/core/components/workflow/WorkflowCanvas.tsx

    # Add proper type imports
    find packages/core/components -type f -name "*.tsx" -exec sed -i'' -e '
        /^import/i\
import type { Agent, Workflow } from '\''../../types'\'';
    ' {} \;
}

# Clean up dist directory
function clean_dist() {
    echo "Cleaning dist directory..."
    rm -rf packages/core/dist
    yarn build
}

# Main execution
fix_react_components
fix_specific_components
clean_dist

echo "Running type check..."
npx tsc --noEmit