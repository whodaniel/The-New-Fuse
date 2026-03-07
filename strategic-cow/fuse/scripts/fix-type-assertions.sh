#!/bin/bash

# Fix property access patterns
find src -type f -name "*.ts" -name "*.tsx" -exec sed -i '' \
    -e 's/(this as any)\.\(([^)]*) as any\)/this.\1/g' \
    -e 's/(event as any)\.\(([^)]*) as any\)/event.\1/g' \
    -e 's/(config as any)\.\(([^)]*) as any\)/config.\1/g' \
    -e 's/(props as any)\.\(([^)]*) as any\)/props.\1/g' \
    -e 's/: any){/): void {/g' \
    -e 's/: any\[\]/: unknown\[\]/g' \
    -e 's/as any>//g' \
    -e 's/\(([^)]*) as any\)/\1/g' \
    {} \;

# Fix React component types
find src -type f -name "*.tsx" -exec sed -i '' \
    -e 's/React.FC</FC</g' \
    -e 's/: FC = () =>/: FC = (): JSX.Element =>/g' \
    -e 's/: React.ComponentType/: ComponentType/g' \
    {} \;

# Run TypeScript compiler to verify fixes
npx tsc --noEmit
