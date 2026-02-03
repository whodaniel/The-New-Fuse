import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { db } from './drizzle/client';
import { agents } from './drizzle/schema/agents';
import { users } from './drizzle/schema/users';

async function seedAgents() {
  console.log('🌱 Performing Agent Roll Call...');

  const agentsDir = path.join(process.cwd(), '../../../.agent/agents');

  // 1. Get/Create Admin User
  const adminEmail = 'admin@thenewfuse.com';
  let admin = await db.query.users.findFirst({
    where: eq(users.email, adminEmail),
  });

  if (!admin) {
    console.log('Creating admin user...');
    [admin] = await db
      .insert(users)
      .values({
        email: adminEmail,
        hashedPassword: 'system_account',
        name: 'TNF System Admin',
        role: 'ADMIN',
      })
      .returning();
  }

  const userId = admin.id;

  // 2. Scan and Sync
  if (!fs.existsSync(agentsDir)) {
    console.error('Agents directory not found:', agentsDir);
    return;
  }

  const files = fs.readdirSync(agentsDir).filter((f) => f.endsWith('.md'));
  console.log(`Found ${files.length} agents in the ecosystem.`);

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(agentsDir, file), 'utf8');
      const match = content.match(/^---\n([\s\S]*?)\n---/);
      if (!match) continue;

      const frontmatter = yaml.load(match[1]) as any;
      const body = content.replace(/^---\n[\s\S]*?\n---/, '').trim();

      const name = frontmatter.name || file.replace('.md', '');
      const type = (frontmatter.type || 'TASK').toUpperCase();

      // Assign Avatar
      let avatarUrl = '/assets/agents/base.png';
      if (type.includes('CODE') || name.toLowerCase().includes('code'))
        avatarUrl = '/assets/agents/coder.png';
      if (type.includes('DEFI') || name.toLowerCase().includes('defi'))
        avatarUrl = '/assets/agents/defi.png';

      const existing = await db.query.agents.findFirst({
        where: (a, { and, eq }) => and(eq(a.name, name), eq(a.userId, userId)),
      });

      const payload = {
        name,
        description: frontmatter.description || '',
        systemPrompt: body,
        type: type as any,
        capabilities: frontmatter.capabilities || frontmatter.tools || [],
        avatarUrl,
        userId,
        status: 'ACTIVE' as any,
      };

      if (existing) {
        await db.update(agents).set(payload).where(eq(agents.id, existing.id));
      } else {
        await db.insert(agents).values(payload);
      }
      console.log(`✅ Registered: ${name}`);
    } catch (e) {
      console.error(`❌ Failed: ${file}`, e);
    }
  }

  console.log('🏁 Agent Roll Call complete!');
  process.exit(0);
}

seedAgents().catch(console.error);
