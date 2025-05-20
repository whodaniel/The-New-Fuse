#!/bin/bash
set -e

echo "🔧 Phase 2: Fixing intermediate TypeScript issues..."

# Create necessary directories
mkdir -p src/types/react
mkdir -p tmp

# Create React component types file
cat > src/types/react/index.ts << 'EOL'
import { ReactNode } from 'react';

export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  icon?: ReactNode;
}

export interface CardProps extends BaseComponentProps {
  title?: string;
  footer?: ReactNode;
}

export interface InputProps extends BaseComponentProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
}
EOL

# Fix React component issues
echo "Fixing React component issues..."
find packages -type f -name "*.tsx" -exec sed -i '' \
    -e 's/React\.FC</FC</g' \
    -e 's/: FC = /: FC = (): JSX.Element => /g' \
    -e 's/: React\.FC/: FC/g' \
    -e 's/: FC<{}/: FC/g' \
    -e 's/: FC<Props>/: FC<Props>/g' \
    -e 's/React\.useEffect/useEffect/g' \
    -e 's/React\.useState/useState/g' \
    -e 's/React\.useRef/useRef/g' \
    -e 's/React\.useCallback/useCallback/g' \
    -e 's/React\.useMemo/useMemo/g' \
    -e 's/React\.useContext/useContext/g' {} \;

# Add missing React imports
find packages -type f -name "*.tsx" | while read -r file; do
    if grep -q "FC" "$file" && ! grep -q "import.*FC" "$file"; then
        if grep -q "import.*React" "$file"; then
            sed -i '' -e 's/import React.*/import React, { FC } from "react";/' "$file"
        elif grep -q "import.*from.*react" "$file"; then
            sed -i '' -e 's/import {\(.*\)} from "react"/import { FC, \1 } from "react"/' "$file"
        else
            sed -i '' -e '1i\
import { FC } from "react";' "$file"
        fi
    fi
    
    # Add JSX import if needed
    if grep -q "JSX\.Element" "$file" && ! grep -q "import.*JSX" "$file"; then
        if grep -q "import.*FC.*from.*react" "$file"; then
            sed -i '' -e 's/import { FC\(.*\)} from "react"/import { FC, JSX\1 } from "react"/' "$file"
        elif grep -q "import.*from.*react" "$file"; then
            sed -i '' -e 's/import {\(.*\)} from "react"/import { JSX, \1 } from "react"/' "$file"
        else
            sed -i '' -e '1i\
import { JSX } from "react";' "$file"
        fi
    fi
done

# Fix common type issues
echo "Fixing common type issues..."
find packages -type f -name "*.ts" -o -name "*.tsx" -exec sed -i '' \
    -e 's/: any;/: unknown;/g' \
    -e 's/: any>/: unknown>/g' \
    -e 's/as any/as unknown/g' \
    -e 's/Promise<any>/Promise<unknown>/g' \
    -e 's/: object;/: Record<string, unknown>;/g' \
    -e 's/\[key: string\]: any;/\[key: string\]: unknown;/g' \
    -e 's/Array<any>/unknown\[\]/g' \
    -e 's/: Function;/: (...args: unknown\[\]) => unknown;/g' \
    -e 's/: Function)/: (...args: unknown\[\]) => unknown)/g' {} \;

# Fix async function return types
echo "Fixing async function return types..."
find packages -type f -name "*.ts" -o -name "*.tsx" -exec sed -i '' \
    -e 's/async \([a-zA-Z0-9_]*\)(\([^)]*\))\s*{/async \1(\2): Promise<void> {/g' \
    -e 's/async function \([a-zA-Z0-9_]*\)(\([^)]*\))\s*{/async function \1(\2): Promise<void> {/g' {} \;

# Fix missing exports
echo "Fixing missing exports..."
find packages -type f -name "*.ts" | while read -r file; do
    if ! grep -q "export " "$file"; then
        echo "export {};" >> "$file"
    fi
done

# Fix declaration or statement expected errors
echo "Fixing declaration or statement expected errors..."
find packages -type f -name "*.ts" | xargs grep -l "error TS1128" 2>/dev/null || true | while read -r file; do
    sed -i '' -e 's/}\s*$/};/g' "$file"
    sed -i '' -e 's/}\s*\n\s*$/};\n/g' "$file"
done

# Fix destructuring assignment issues
echo "Fixing destructuring assignment issues..."
find packages -type f -name "*.ts" | xargs grep -l "error TS2809" 2>/dev/null || true | while read -r file; do
    sed -i '' -e 's/\([a-zA-Z0-9_]*\)\s*=\s*{/const \1 = {/g' "$file"
    sed -i '' -e 's/}\s*=\s*{/(\1) = {/g' "$file"
done

# Fix JSX parent element errors
echo "Fixing JSX parent element errors..."
find packages -type f -name "*.tsx" | xargs grep -l "error TS2657" 2>/dev/null || true | while read -r file; do
    sed -i '' -e 's/return (\([^<]\)/return (<>\1<\/>)/g' "$file"
    sed -i '' -e 's/return (\([^(].*\)\([^>]\))/return (<>\1\2<\/>)/g' "$file"
done

# Create missing type definitions
echo "Creating missing type definitions..."
cat > src/types/global.d.ts << 'EOL'
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.json' {
  const content: any;
  export default content;
}

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}
EOL

# Run TypeScript check
echo "✅ Phase 2 fixes complete. Running TypeScript check..."
npx tsc --noEmit || {
    echo "⚠️ TypeScript errors remain. Check tmp/ts-errors.txt for details."
    npx tsc --noEmit > tmp/ts-errors.txt 2>&1 || true
    echo "Most common error types:"
    grep -E "error TS[0-9]+" tmp/ts-errors.txt | sed 's/.*error \(TS[0-9]\+\).*/\1/' | sort | uniq -c | sort -nr | head -10
    exit 1
}