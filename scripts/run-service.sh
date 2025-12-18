#!/bin/sh

set -e

# SERVICE_PATH should be just the service name (e.g., 'api', 'frontend', 'backend')
# The Dockerfile copies built files to /app/apps/${SERVICE_PATH}/dist

echo "Current directory: $(pwd)"
echo "SERVICE_PATH: ${SERVICE_PATH}"
echo "Listing current directory:"
ls -la

if [ "$SERVICE_PATH" = "frontend" ]; then
  echo "Starting frontend service..."
  # Use http-server for production serving of static files (avoids Vite preview permission issues)
  exec npx --yes http-server dist -p ${PORT:-3000} -a 0.0.0.0 --cors
else
  echo "Starting backend service: $SERVICE_PATH..."

  # Run Prisma migrations for api service (has its own prisma schema)
  if [ "$SERVICE_PATH" = "api" ] && [ -n "$DATABASE_URL" ]; then
    echo "Running Prisma migrations..."
    echo "Current directory before migration: $(pwd)"
    echo "DATABASE_URL is set: ${DATABASE_URL:0:50}..."

    # Define paths with fallbacks
    SCHEMA_PATH=""
    CONFIG_PATH=""

    # 1. Find Schema
    if [ -f "/app/packages/database/prisma/schema.prisma" ]; then
      SCHEMA_PATH="/app/packages/database/prisma/schema.prisma"
    elif [ -f "../../packages/database/prisma/schema.prisma" ]; then
      SCHEMA_PATH="../../packages/database/prisma/schema.prisma"
    fi

    # 2. Find Config
    if [ -f "/app/apps/api/prisma.config.ts" ]; then
      CONFIG_PATH="/app/apps/api/prisma.config.ts"
    elif [ -f "./prisma.config.ts" ]; then
      CONFIG_PATH="./prisma.config.ts"
    fi

    if [ -n "$SCHEMA_PATH" ]; then
      echo "Found schema at $SCHEMA_PATH"

      # Extract host and port from DATABASE_URL for health check
      DB_HOST=$(echo $DATABASE_URL | sed -n 's|.*@\([^:/]*\).*|\1|p')
      DB_PORT=$(echo $DATABASE_URL | sed -n 's|.*:\([0-9]*\)\/.*|\1|p')

      if [ -z "$DB_PORT" ]; then DB_PORT=5432; fi

      if [ -n "$DB_HOST" ]; then
        echo "Waiting for database at $DB_HOST:$DB_PORT..."
        i=0
        while ! nc -z $DB_HOST $DB_PORT; do
          i=$((i+1))
          if [ $i -ge 30 ]; then
             echo "Timeout waiting for database"
             break
          fi
          echo "Waiting for database... ($i/30)"
          sleep 2
        done
        echo "Database is reachable or timeout reached."
      fi

      MIGRATE_CMD="npx prisma migrate deploy --schema=$SCHEMA_PATH"
      if [ -n "$CONFIG_PATH" ]; then
        echo "Using config at $CONFIG_PATH"
        MIGRATE_CMD="$MIGRATE_CMD --config=$CONFIG_PATH"
      fi

      echo "Executing: $MIGRATE_CMD"
      $MIGRATE_CMD || echo "Prisma migration failed, proceeding to emergency DB repair..."

      echo "Migration attempt completed."

    # Fallback check for local api schema (legacy/backup)
    elif [ -f "/app/apps/api/prisma/schema.prisma" ] || [ -f "prisma/schema.prisma" ]; then
       FALLBACK_SCHEMA=""
       if [ -f "/app/apps/api/prisma/schema.prisma" ]; then
         FALLBACK_SCHEMA="/app/apps/api/prisma/schema.prisma"
       else
         FALLBACK_SCHEMA="prisma/schema.prisma"
       fi
       echo "Found schema at $FALLBACK_SCHEMA"
       npx prisma migrate deploy --schema=$FALLBACK_SCHEMA || echo "Prisma migration failed, proceeding to emergency DB repair..."
    else
      echo "WARNING: No Prisma schema found in expected locations"
      ls -la . || echo "Cannot list current dir"
      ls -la ../../packages/database/prisma/ || echo "Cannot list packages dir"
    fi

    # Emergency DB Repair Script - Ensures explicit table creation regardless of migration state
    echo "Generating DB repair script..."
    REPAIR_SCRIPT=$(mktemp)
    echo "Generating DB repair script at $REPAIR_SCRIPT..."
    cat > "$REPAIR_SCRIPT" << 'EOF'
const { createRequire } = require('module');
// Create a require function that resolves modules from the project root (process.cwd())
// We add a trailing slash to force it to treat it as a directory
const requireApp = createRequire(process.cwd() + '/');
const { Client } = requireApp('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function repair() {
  try {
    console.log('Connecting to DB for repair...');
    await client.connect();

    // Create Types (idempotent)
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "WalletType" AS ENUM ('SMART_ACCOUNT', 'EOA', 'MULTI_SIG');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
      DO $$ BEGIN
        CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
      DO $$ BEGIN
        CREATE TYPE "TransactionType" AS ENUM ('TRANSFER', 'CONTRACT_CALL', 'CONTRACT_DEPLOYMENT', 'NFT_MINT', 'NFT_TRANSFER');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    console.log('Verifying/Creating Wallets table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "wallets" (
        "id" TEXT NOT NULL,
        "address" TEXT NOT NULL,
        "agentId" TEXT,
        "type" "WalletType" NOT NULL DEFAULT 'SMART_ACCOUNT',
        "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
        "nonce" INTEGER NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "lastActivity" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
      );

      CREATE UNIQUE INDEX IF NOT EXISTS "wallets_address_key" ON "wallets"("address");
      CREATE UNIQUE INDEX IF NOT EXISTS "wallets_agentId_key" ON "wallets"("agentId");
    `);

    console.log('Verifying/Creating Transactions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "transactions" (
        "id" TEXT NOT NULL,
        "hash" TEXT NOT NULL,
        "walletId" TEXT NOT NULL,
        "fromAddress" TEXT NOT NULL,
        "toAddress" TEXT NOT NULL,
        "value" DECIMAL(65,30) NOT NULL,
        "gasPrice" DECIMAL(65,30) NOT NULL,
        "gasUsed" INTEGER NOT NULL,
        "gasLimit" INTEGER NOT NULL,
        "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
        "blockNumber" INTEGER,
        "blockHash" TEXT,
        "type" "TransactionType" NOT NULL DEFAULT 'TRANSFER',
        "data" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "confirmedAt" TIMESTAMP(3),
        CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
      );

      CREATE UNIQUE INDEX IF NOT EXISTS "transactions_hash_key" ON "transactions"("hash");
      CREATE INDEX IF NOT EXISTS "transactions_walletId_idx" ON "transactions"("walletId");
      CREATE INDEX IF NOT EXISTS "transactions_hash_idx" ON "transactions"("hash");
      CREATE INDEX IF NOT EXISTS "transactions_status_idx" ON "transactions"("status");
      CREATE INDEX IF NOT EXISTS "transactions_createdAt_idx" ON "transactions"("createdAt");
    `);

    // Add ForeignKey constraint separately to handle IF NOT EXISTS gracefully
    try {
      await client.query(`
        ALTER TABLE "transactions"
        ADD CONSTRAINT "transactions_walletId_fkey"
        FOREIGN KEY ("walletId") REFERENCES "wallets"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
      `);
    } catch (e) {
      if (!e.message.includes('already exists')) console.log('Note: FK constraint might already exist or failed:', e.message);
    }

    // Add ForeignKey for agents separately
    try {
      await client.query(`
        ALTER TABLE "wallets"
        ADD CONSTRAINT "wallets_agentId_fkey"
        FOREIGN KEY ("agentId") REFERENCES "agents"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
      `);
    } catch (e) {
      if (!e.message.includes('already exists')) console.log('Note: FK constraint (agentId) might already exist or failed:', e.message);
    }

    console.log('DB Repair script completed successfully.');
  } catch (err) {
    console.error('DB Repair CRITICAL FAILURE:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

repair();
EOF

    echo "Executing DB Repair..."
    node "$REPAIR_SCRIPT"

    echo "Migration check complete, continuing with service start..."
  fi

  # Try to find the main entry point in various possible locations
  if [ -f "dist/main.js" ]; then
    echo "Found dist/main.js in current directory"
    exec node dist/main.js
  elif [ -f "dist/server.js" ]; then
    echo "Found dist/server.js in current directory"
    exec node dist/server.js
  elif [ -f "dist/src/main.js" ]; then
    echo "Found dist/src/main.js in current directory"
    exec node dist/src/main.js
  elif [ -f "/app/apps/${SERVICE_PATH}/dist/main.js" ]; then
    echo "Found main.js at /app/apps/${SERVICE_PATH}/dist/main.js"
    exec node /app/apps/${SERVICE_PATH}/dist/main.js
  elif [ -f "/app/apps/${SERVICE_PATH}/dist/server.js" ]; then
    echo "Found server.js at /app/apps/${SERVICE_PATH}/dist/server.js"
    exec node /app/apps/${SERVICE_PATH}/dist/server.js
  elif [ -f "package.json" ]; then
    echo "Falling back to npm start"
    exec npm start
  else
    echo "ERROR: Cannot find main.js or server.js in any expected location"
    echo "Contents of dist directory:"
    ls -la dist/ || echo "No dist directory"
    exit 1
  fi
fi
