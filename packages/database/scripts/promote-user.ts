/**
 * Script to promote any user to SUPER_ADMIN
 *
 * Usage:
 *   pnpm tsx packages/database/scripts/promote-user.ts <email>
 *
 * Example:
 *   pnpm tsx packages/database/scripts/promote-user.ts user@example.com
 */

import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
import { jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as path from 'path';
import postgres from 'postgres';

// Define minimal schema locally to avoid sync issues
const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  role: varchar('role').default('USER').notNull(),
  roles: jsonb('roles').$type<string[]>().default(['USER']).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env.local') });

async function promoteUser() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ ERROR: Please provide an email address as an argument.');
    console.error('Usage: pnpm tsx packages/database/scripts/promote-user.ts <email>');
    process.exit(1);
  }

  console.log('🔧 Promoting user to SUPER_ADMIN:', email);

  // Get database connection string
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ ERROR: DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    // Check if user exists
    console.log('🔍 Looking for user:', email);
    const existingUsers = await db.select().from(users).where(eq(users.email, email));

    if (existingUsers.length === 0) {
      console.log(`⚠️  User ${email} not found. Please register this email first.`);
      await client.end();
      process.exit(1);
    }

    const user = existingUsers[0];
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      currentRole: user.role,
    });

    // Update user to SUPER_ADMIN
    console.log('🔄 Updating user role to SUPER_ADMIN...');
    await db
      .update(users)
      .set({
        role: 'SUPER_ADMIN',
        roles: ['SUPER_ADMIN'],
        updatedAt: new Date(),
      })
      .where(eq(users.email, email));

    console.log('✅ SUCCESS! User promoted to SUPER_ADMIN');
  } catch (error) {
    console.error('❌ ERROR:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

promoteUser()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
