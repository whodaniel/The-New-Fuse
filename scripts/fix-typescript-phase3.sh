#!/bin/bash
set -e

echo "Starting TypeScript Phase 3 fixes..."

# Fix specific React component issues
fix_specific_react_issues() {
    find src packages -type f -name "*.tsx" -exec sed -i'' -e '
        # Add proper type imports
        1i\import type { FC, ReactNode } from '\''react'\'';
        # Fix component declarations
        s/const \([A-Za-z]\+\) = (/const \1: FC<\1Props> = (/g;
        # Add proper return types
        s/=> {/): JSX.Element => {/g;
    ' {} \;
}

# Fix import paths
fix_import_paths() {
    find src packages -type f -name "*.ts" -o -name "*.tsx" -exec sed -i'' -e '
        s/from '\''\.\.\/\([^'\'']*\)'\''/from '\''@the-new-fuse\/\1'\''/g;
        s/from '\''\.\/\([^'\'']*\)'\''/from '\''@the-new-fuse\/\1'\''/g;
    ' {} \;
}

# Create specific types
create_specific_types() {
    mkdir -p src/types
    cat > src/types/common.d.ts << 'EOL'
    export interface BaseProps {
        className?: string;
        children?: ReactNode;
    }
    
    export interface ServiceResponse<T> {
        data?: T;
        error?: string;
        status: 'success' | 'error';
    }
EOL
}

# Main execution
main() {
    fix_specific_react_issues
    fix_import_paths
    create_specific_types
    
    echo "Running final verification..."
    yarn tsc --noEmit
}

main
