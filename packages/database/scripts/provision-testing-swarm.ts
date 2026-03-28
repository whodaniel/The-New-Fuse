import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
import { boolean, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as path from 'path';
import postgres from 'postgres';

// Define minimal schema locally
const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  username: varchar('username', { length: 255 }).unique(),
  name: varchar('name', { length: 255 }),
  hashedPassword: varchar('hashed_password', { length: 255 }).notNull(),
  role: varchar('role').default('USER').notNull(),
  roles: jsonb('roles').$type<string[]>().default(['USER']).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env.local') });

// specialist swarm details
const SWARM_COUNT = 5;
const SWARM_PASSWORD_HASH = '$2b$10$Ep76J5K95LpUAUPatLyzheW8Sbef3hcbe.85clS.L9ImZdtWAsZpG'; // 'tnf-dev-testing-2026'

async function provisionSwarm() {
  console.log('🐝 Provisioning Specialist Web Dev Swarm...');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ ERROR: DATABASE_URL not found');
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    for (let i = 1; i <= SWARM_COUNT; i++) {
      const email = `web-dev-${i.toString().padStart(2, '0')}@thenewfuse.com`;
      const username = `web_dev_swarm_${i.toString().padStart(2, '0')}`;
      const name = `Web Dev Specialist #${i}`;

      console.log(`\n🔍 Checking agent: ${email}`);
      const existing = await db.select().from(users).where(eq(users.email, email));

      if (existing.length > 0) {
        console.log(`Updating existing agent to SUPER_ADMIN...`);
        await db
          .update(users)
          .set({
            role: 'SUPER_ADMIN',
            roles: ['SUPER_ADMIN'],
            isActive: true,
            emailVerified: true,
            updatedAt: new Date(),
          })
          .where(eq(users.email, email));
      } else {
        console.log(`Creating new specialist agent with SUPER_ADMIN access...`);
        await db.insert(users).values({
          email,
          username,
          name,
          hashedPassword: SWARM_PASSWORD_HASH,
          role: 'SUPER_ADMIN',
          roles: ['SUPER_ADMIN'],
          isActive: true,
          emailVerified: true,
        });
      }
      console.log(`✅ ${name} is ready for all-access testing.`);
    }

    console.log('\n✨ Swarm provisioning complete.');
  } catch (error) {
    console.error('❌ ERROR:', error);
  } finally {
    await client.end();
  }
}

provisionSwarm();
