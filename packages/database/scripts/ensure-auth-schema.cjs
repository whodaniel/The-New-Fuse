#!/usr/bin/env node

const { Client } = require('pg');

const REQUIRED_COLUMNS = ['verification_token', 'verification_expires'];

function resolveSsl(connectionString) {
  if (!connectionString) return false;
  if (connectionString.includes('cloud_runtime.internal')) return false;
  if (connectionString.includes('sslmode=disable')) return false;
  return { rejectUnauthorized: false };
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }

  const client = new Client({
    connectionString,
    ssl: resolveSsl(connectionString),
  });

  await client.connect();

  try {
    console.log('Ensuring critical auth schema columns...');

    await client.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "verification_token" varchar(255),
        ADD COLUMN IF NOT EXISTS "verification_expires" timestamp;
    `);

    const result = await client.query(
      `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = ANY($1::text[])
      `,
      [REQUIRED_COLUMNS]
    );

    const present = new Set(result.rows.map((row) => row.column_name));
    const missing = REQUIRED_COLUMNS.filter((column) => !present.has(column));

    if (missing.length > 0) {
      throw new Error(`Missing required auth columns after repair: ${missing.join(', ')}`);
    }

    console.log(`Verified auth schema columns: ${REQUIRED_COLUMNS.join(', ')}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Critical auth schema verification failed.');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
