#!/bin/bash

# Drizzle to Drizzle Migration Script
# This script systematically replaces all Drizzle imports with Drizzle equivalents

set -e

echo "🔄 Starting Drizzle → Drizzle Migration..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="${TNF_ROOT_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
cd "$ROOT_DIR"

# Counter
FILES_MODIFIED=0

# Function to migrate a single file
migrate_file() {
    local file="$1"
    local modified=false

    # Skip if file doesn't exist or is in node_modules/dist
    if [[ ! -f "$file" ]] || [[ "$file" == *"/node_modules/"* ]] || [[ "$file" == *"/dist/"* ]] || [[ "$file" == *".spec.ts"* ]] || [[ "$file" == *".test.ts"* ]]; then
        return
    fi

    # Create backup
    cp "$file" "$file.bak"

    # Replace DrizzleService with DRIZZLE_CLIENT injection pattern
    if grep -q "DrizzleService" "$file"; then
        # Replace import
        sed -i '' "s/import { DrizzleService } from '@the-new-fuse\/database';/import { DRIZZLE_CLIENT, type DrizzleClient } from '@the-new-fuse\/database';\nimport { Inject } from '@nestjs\/common';/g" "$file"

        # Replace constructor injection
        sed -i '' "s/private readonly drizzle: DrizzleService/@Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient/g" "$file"
        sed -i '' "s/private drizzle: DrizzleService/@Inject(DRIZZLE_CLIENT) private db: DrizzleClient/g" "$file"

        modified=true
    fi

    # Replace DrizzleClient with DrizzleClient
    if grep -q "DrizzleClient" "$file"; then
        sed -i '' "s/import { DrizzleClient } from '@the-new-fuse\/database';/import { type DrizzleClient, db } from '@the-new-fuse\/database';/g" "$file"
        sed -i '' "s/import { DrizzleClient } from '@drizzle\/client';/import { type DrizzleClient, db } from '@the-new-fuse\/database';/g" "$file"
        sed -i '' "s/new DrizzleClient()/db/g" "$file"
        sed -i '' "s/: DrizzleClient/: DrizzleClient/g" "$file"
        modified=true
    fi

    # Replace Drizzle namespace with drizzle-orm imports
    if grep -q "import.*Drizzle.*from '@drizzle/client'" "$file"; then
        sed -i '' "s/import.*Drizzle.*from '@drizzle\/client';/import { eq, and, or, sql } from 'drizzle-orm';/g" "$file"
        modified=true
    fi

    # Replace common Drizzle method patterns with Drizzle (note: these are simplifications)
    # This will need manual review but gives a starting point
    if grep -q "this\.drizzle\." "$file"; then
        # For now, just replace the reference - actual queries will need manual migration
        sed -i '' "s/this\.drizzle\./this.db./g" "$file"
        modified=true
    fi

    # Replace DrizzleModule with DrizzleModule
    if grep -q "DrizzleModule" "$file"; then
        sed -i '' "s/import.*DrizzleModule.*from.*;/import { DrizzleModule } from '@the-new-fuse\/database';/g" "$file"
        sed -i '' "s/DrizzleModule/DrizzleModule.forRoot()/g" "$file"
        modified=true
    fi

    if [ "$modified" = true ]; then
        echo -e "${GREEN}✓${NC} Migrated: $file"
        ((FILES_MODIFIED++))
        # Keep backup for now
    else
        # Remove backup if no changes
        rm "$file.bak"
    fi
}

# Find and migrate all TypeScript files
echo -e "\n${YELLOW}Finding TypeScript files...${NC}"

# Migrate apps
find "$ROOT_DIR/apps" -name "*.ts" -type f | while read file; do
    migrate_file "$file"
done

# Migrate packages (except database package itself)
find "$ROOT_DIR/packages" -name "*.ts" -type f ! -path "*/database/*" ! -path "*/generated/*" | while read file; do
    migrate_file "$file"
done

echo -e "\n${GREEN}✓ Migration complete!${NC}"
echo -e "${YELLOW}Files modified: $FILES_MODIFIED${NC}"
echo -e "\n${YELLOW}⚠️  IMPORTANT:${NC}"
echo -e "1. Review changes - Drizzle queries need manual migration to Drizzle syntax"
echo -e "2. Backup files saved with .bak extension"
echo -e "3. Test thoroughly before committing"
echo -e "\nNext steps:"
echo -e "  - Remove Drizzle dependencies from package.json files"
echo -e "  - Delete Drizzle schema and generated files"
echo -e "  - Update repository method calls"
