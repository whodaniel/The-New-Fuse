/**
 * Script to set bisynth@gmail.com as SUPER_ADMIN
 *
 * Usage:
 *   pnpm tsx packages/database/scripts/set-super-admin.ts
 *
 * Or from the database package:
 *   cd packages/database
 *   pnpm tsx scripts/set-super-admin.ts
 */

import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as path from 'path';
import postgres from 'postgres';
import { users } from '../src/drizzle/schema/users';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env.local') });

const MASTER_ADMIN_EMAIL = 'bisynth@gmail.com';

async function setSuperAdmin() {
  console.log('🔧 Setting SUPER_ADMIN role for', MASTER_ADMIN_EMAIL);

  // Get database connection string
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ ERROR: DATABASE_URL not found in environment variables');
    console.log('\nPlease ensure you have a .env file with DATABASE_URL set.');
    console.log('Example: DATABASE_URL=postgresql://user:password@localhost:5433/thenewfuse');
    process.exit(1);
  }

  console.log('📊 Connecting to database...');
  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    // Check if user exists
    console.log('🔍 Looking for user:', MASTER_ADMIN_EMAIL);
    const existingUsers = await db.select().from(users).where(eq(users.email, MASTER_ADMIN_EMAIL));

    if (existingUsers.length === 0) {
      console.log('⚠️  User not found. Please register this email first.');
      console.log('\nOptions:');
      console.log('1. Register via the frontend at /register');
      console.log('2. Create user via API');
      console.log('3. Use a database seed script');
      await client.end();
      process.exit(1);
    }

    const user = existingUsers[0];
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      currentRole: user.role,
      currentRoles: user.roles,
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
      .where(eq(users.email, MASTER_ADMIN_EMAIL));

    console.log('✅ SUCCESS! User updated to SUPER_ADMIN');

    // Verify the update
    const updatedUsers = await db.select().from(users).where(eq(users.email, MASTER_ADMIN_EMAIL));

    const updatedUser = updatedUsers[0];
    console.log('\n📋 Updated user details:');
    console.log({
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      roles: updatedUser.roles,
      isActive: updatedUser.isActive,
      updatedAt: updatedUser.updatedAt,
    });

    console.log('\n🎉 All done! You can now log in as SUPER_ADMIN');
    console.log('   Email:', MASTER_ADMIN_EMAIL);
    console.log('   Access: Full admin dashboard at /admin');
  } catch (error) {
    console.error('❌ ERROR:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
setSuperAdmin()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
