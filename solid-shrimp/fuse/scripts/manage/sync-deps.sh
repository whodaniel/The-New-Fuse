#!/bin/bash
set -e

echo "🔄 Synchronizing dependencies..."

# Install root dependencies
yarn add -D \
    typescript \
    @types/node \
    eslint \
    prettier \
    @typescript-eslint/parser \
    @typescript-eslint/eslint-plugin \
    eslint-config-prettier \
    eslint-plugin-prettier \
    jest \
    @types/jest \
    ts-jest

# Run package-specific setup
./scripts/manage/setup-packages.sh

# Create necessary directories if they don't exist
mkdir -p packages/{agent,db,features,integrations,layout,monitoring,security,shared}/src

# Initialize example files
for dir in packages/*/src; do
    if [ ! -f "$dir/index.ts" ]; then
        echo "export * from './types';
export * from './constants';
export * from './utils';" > "$dir/index.ts"
        
        mkdir -p "$dir/types" "$dir/constants" "$dir/utils"
        echo "export const VERSION = '1.0.0';" > "$dir/constants/index.ts"
        echo "export type Config = {
    enabled: boolean;
    version: string;
};" > "$dir/types/index.ts"
        echo "export const isEnabled = (config: Config): boolean => config.enabled;" > "$dir/utils/index.ts"
    fi
done

echo "✅ Dependencies synchronized"
