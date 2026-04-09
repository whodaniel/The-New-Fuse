#!/bin/bash
set -e

echo "🔄 Starting Drizzle Schema Consolidation"

# Create timestamp for backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/drizzle_schemas_${TIMESTAMP}"

# 1. Create backups
echo "📦 Creating backups..."
mkdir -p "${BACKUP_DIR}"

# Array of schema locations to backup
SCHEMA_LOCATIONS=(
    "apps/backend/drizzle/schema.drizzle"
    "packages/core/drizzle/schema.drizzle"
    "drizzle/schema.drizzle"
    "apps/api/drizzle/schema.drizzle"
    "packages/database/drizzle/schema.drizzle"
    "packages/database/src/schemas/audit-compliance.drizzle"
    "packages/database/src/schemas/feature-tracking.drizzle"
    "packages/database/src/schemas/feature-suggestions.drizzle"
    "packages/database/src/schemas/timeline.drizzle"
)

# Create temporary directory for schema consolidation
TEMP_DIR=$(mktemp -d)
CONSOLIDATED_SCHEMA="${TEMP_DIR}/consolidated.drizzle"
TEMP_MODELS="${TEMP_DIR}/models.tmp"

# Initialize consolidated schema with database connection
cat > "$CONSOLIDATED_SCHEMA" << EOL
generator client {
  provider = "drizzle-client-js"
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
mkdir -p packages/database/drizzle
cp "$CONSOLIDATED_SCHEMA" packages/database/drizzle/schema.drizzle
echo "✓ Created consolidated schema at: packages/database/drizzle/schema.drizzle"

# Clean up temporary directory
rm -rf "$TEMP_DIR"

# 3. Update imports and references
echo "🔍 Updating imports and references..."
find . -type f -name "*.ts" -o -name "*.js" | while read -r file; do
    if [[ $file == *"node_modules"* ]] || [[ $file == *"$BACKUP_DIR"* ]]; then
        continue
    fi
    sed -i.bak 's|@drizzle/client|@the-new-fuse/database/client|g' "$file"
    sed -i.bak 's|../../drizzle/generated/client|@the-new-fuse/database/client|g' "$file"
    rm -f "$file.bak"
done

echo "✅ Schema consolidation complete!"
echo "📁 Backups stored in: $BACKUP_DIR"
echo "⚠️  Please review the consolidated schema at packages/database/drizzle/schema.drizzle"
echo "⚠️  After reviewing, run: bun --filter @the-new-fuse/database run drizzle migrate dev --name schema_consolidation"
echo "↩️  To rollback changes, run: $BACKUP_DIR/rollback.sh"
