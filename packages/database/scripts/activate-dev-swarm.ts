import * as dotenv from 'dotenv';
import * as path from 'path';
import postgres from 'postgres';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env.local') });

// specialist swarm details
const SWARM_COUNT = 5;
const SWARM_PASSWORD_HASH = '$2b$10$Ep76J5K95LpUAUPatLyzheW8Sbef3hcbe.85clS.L9ImZdtWAsZpG'; // 'tnf-dev-testing-2026'

async function activateSwarm() {
  console.log('🐝 Activating Specialist Web Dev Swarm (Final Push Mode)...');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ ERROR: DATABASE_URL not found');
    process.exit(1);
  }

  const sql = postgres(connectionString);

  try {
    for (let i = 1; i <= SWARM_COUNT; i++) {
      const email = `web-dev-${i.toString().padStart(2, '0')}@thenewfuse.com`;
      const username = `web_dev_swarm_${i.toString().padStart(2, '0')}`;
      const name = `Web Dev Specialist #${i}`;

      console.log(`\n🔍 Processing agent: ${email}`);

      const existing = await sql`SELECT id FROM users WHERE email = ${email}`;

      if (existing.length > 0) {
        console.log(`Updating existing agent to SUPER_ADMIN...`);
        await sql`
          UPDATE users 
          SET role = 'SUPER_ADMIN', 
              roles = '["SUPER_ADMIN"]'::jsonb,
              "isActive" = true,
              is_active = true,
              email_verified = true,
              "updatedAt" = NOW()
          WHERE email = ${email}
        `;
      } else {
        console.log(`Creating new specialist agent with SUPER_ADMIN access...`);
        const id = `user_webdev${i}_${Date.now()}`;

        await sql`
          INSERT INTO users (
            id, email, username, name, "passwordHash", hashed_password, role, roles, "isActive", is_active, email_verified, "createdAt", "updatedAt"
          ) VALUES (
            ${id}, ${email}, ${username}, ${name}, ${SWARM_PASSWORD_HASH}, ${SWARM_PASSWORD_HASH}, 'SUPER_ADMIN', '["SUPER_ADMIN"]'::jsonb, true, true, true, NOW(), NOW()
          )
        `;
      }
      console.log(`✅ ${name} (${username}) is active with all-access permissions.`);
    }

    console.log('\n✨ Swarm activation complete.');
  } catch (error) {
    console.error('❌ ERROR:', error);
  } finally {
    await sql.end();
  }
}

activateSwarm();
