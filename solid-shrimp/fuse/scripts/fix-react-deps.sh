#!/bin/bash
set -e

echo "🔧 Fixing React peer dependencies..."

# Add React as direct dependencies to packages that need it
yarn workspace @the-new-fuse/database add react react-dom
yarn workspace @the-new-fuse/ui add react react-dom
yarn workspace @the-new-fuse/shared add react react-dom

# Add React types
yarn workspace @the-new-fuse/database add -D @types/react @types/react-dom
yarn workspace @the-new-fuse/ui add -D @types/react @types/react-dom
yarn workspace @the-new-fuse/shared add -D @types/react @types/react-dom