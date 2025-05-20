#!/bin/bash
set -e

echo "🔄 Starting Prisma Schema Consolidation"

# Create timestamp for backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/prisma_schemas_${TIMESTAMP}"

# 1. Create backups
echo "📦 Creating backups..."
mkdir -p "${BACKUP_DIR}"

# Array of schema locations to backup
SCHEMA_LOCATIONS=(
    "apps/backend/prisma/schema.prisma"
    "packages/core/prisma/schema.prisma"
    "prisma/schema.prisma"
    "apps/api/prisma/schema.prisma"
    "packages/database/prisma/schema.prisma"
    "packages/database/src/schemas/audit-compliance.prisma"
    "packages/database/src/schemas/feature-tracking.prisma"
    "packages/database/src/schemas/feature-suggestions.prisma"
    "packages/database/src/schemas/timeline.prisma"
)

# Create temporary directory for schema consolidation
TEMP_DIR=$(mktemp -d)
CONSOLIDATED_SCHEMA="${TEMP_DIR}/consolidated.prisma"
TEMP_MODELS="${TEMP_DIR}/models.tmp"

# Initialize consolidated schema with database connection
cat > "$CONSOLIDATED_SCHEMA" << EOL
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["tracing"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

EOL

# Initialize empty temporary file for models
touch "$TEMP_MODELS"

echo "📝 Consolidating schemas..."
for schema in "${SCHEMA_LOCATIONS[@]}"; do
    if [ -f "$schema" ]; then
        # Create directory structure in backup
        mkdir -p "${BACKUP_DIR}/$(dirname $schema)"
        cp "$schema" "${BACKUP_DIR}/$schema"
        echo "✓ Backed up: $schema"
        
        # Extract models and enums, excluding generator and datasource blocks
        awk '
        BEGIN { in_block = 0; current_block = ""; }
        /^(model|enum)/ {
            in_block = 1;
            current_block = $0;
            next;
        }
        in_block {
            current_block = current_block "\n" $0;
            if ($0 ~ /^}/) {
                print current_block;
                in_block = 0;
                current_block = "";
            }
        }' "$schema" >> "$TEMP_MODELS"
    fi
done

# Remove duplicates and sort
awk '
BEGIN { RS = "\n\n+"; ORS = "\n\n" }
!seen[$0]++
' "$TEMP_MODELS" | sort > "${TEMP_DIR}/sorted_unique_models.tmp"

# Append unique models to consolidated schema
cat "${TEMP_DIR}/sorted_unique_models.tmp" >> "$CONSOLIDATED_SCHEMA"

# Create rollback script
cat > "${BACKUP_DIR}/rollback.sh" << EOL
#!/bin/bash
set -e
echo "🔄 Rolling back schema changes..."
for schema in "${SCHEMA_LOCATIONS[@]}"; do
    if [ -f "${BACKUP_DIR}/\$schema" ]; then
        mkdir -p \$(dirname \$schema)
        cp "${BACKUP_DIR}/\$schema" "\$schema"
        echo "✓ Restored: \$schema"
    fi
done
echo "✅ Rollback complete!"
EOL
chmod +x "${BACKUP_DIR}/rollback.sh"

# 2. Place new consolidated schema
echo "📝 Installing new consolidated schema..."
mkdir -p packages/database/prisma
cp "$CONSOLIDATED_SCHEMA" packages/database/prisma/schema.prisma
echo "✓ Created consolidated schema at: packages/database/prisma/schema.prisma"

# Clean up temporary directory
rm -rf "$TEMP_DIR"

# 3. Update imports and references
echo "🔍 Updating imports and references..."
find . -type f -name "*.ts" -o -name "*.js" | while read -r file; do
    if [[ $file == *"node_modules"* ]] || [[ $file == *"$BACKUP_DIR"* ]]; then
        continue
    fi
    sed -i.bak 's|@prisma/client|@the-new-fuse/database/client|g' "$file"
    sed -i.bak 's|../../prisma/generated/client|@the-new-fuse/database/client|g' "$file"
    rm -f "$file.bak"
done

echo "✅ Schema consolidation complete!"
echo "📁 Backups stored in: $BACKUP_DIR"
echo "⚠️  Please review the consolidated schema at packages/database/prisma/schema.prisma"
echo "⚠️  After reviewing, run: yarn workspace @the-new-fuse/database prisma migrate dev --name schema_consolidation"
echo "↩️  To rollback changes, run: $BACKUP_DIR/rollback.sh"
