#!/bin/bash
set -e

echo "🔧 Fixing React peer dependencies..."

# Add React as direct dependencies to packages that need it
bun --filter @the-new-fuse/database run add react react-dom
bun --filter @the-new-fuse/ui run add react react-dom
bun --filter @the-new-fuse/shared run add react react-dom

# Add React types
bun --filter @the-new-fuse/database run add -D @types/react @types/react-dom
bun --filter @the-new-fuse/ui run add -D @types/react @types/react-dom
bun --filter @the-new-fuse/shared run add -D @types/react @types/react-dom