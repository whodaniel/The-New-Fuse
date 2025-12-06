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

    # Check if schema exists in apps/api/prisma
    # Run Prisma migrations for api service
    # Prioritize shared database package schema
    if [ -f "/app/packages/database/prisma/schema.prisma" ]; then
      echo "Found schema at /app/packages/database/prisma/schema.prisma"
      echo "Listing migrations available:"
      ls -R /app/packages/database/prisma/migrations

      echo "Executing: npx prisma migrate deploy --schema=/app/packages/database/prisma/schema.prisma"
      npx prisma migrate deploy --schema=/app/packages/database/prisma/schema.prisma || echo "Prisma migration failed, proceeding to emergency DB repair..."

      echo "Migration attempt completed."
    # Fallback to local schema if shared one not found (unlikely for api)
    elif [ -f "/app/apps/api/prisma/schema.prisma" ]; then
      echo "Found schema at /app/apps/api/prisma/schema.prisma"
      npx prisma migrate deploy --schema=/app/apps/api/prisma/schema.prisma || echo "Prisma migration failed, proceeding to emergency DB repair..."
    else
      echo "WARNING: No Prisma schema found in expected locations"
      ls -la /app/apps/api/ || echo "No /app/apps/api directory"
      ls -la /app/packages/database/prisma/ || echo "No /app/packages/database/prisma directory"
    fi

    # Emergency DB Repair Script - Ensures explicit table creation regardless of migration state
    echo "Generating DB repair script..."
    cat > db-repair.js << 'EOF'
const { Client } = require('pg');
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
    node db-repair.js

    echo "Migration check complete, continuing with service start..."
  fi

  # Try to find main.js in various possible locations
  if [ -f "dist/main.js" ]; then
    echo "Found dist/main.js in current directory"
    exec node dist/main.js
  elif [ -f "dist/src/main.js" ]; then
    echo "Found dist/src/main.js in current directory"
    exec node dist/src/main.js
  elif [ -f "/app/apps/${SERVICE_PATH}/dist/main.js" ]; then
    echo "Found main.js at /app/apps/${SERVICE_PATH}/dist/main.js"
    exec node /app/apps/${SERVICE_PATH}/dist/main.js
  else
    echo "ERROR: Cannot find main.js in any expected location"
    echo "Contents of dist directory:"
    ls -la dist/ || echo "No dist directory"
    exit 1
  fi
fi
