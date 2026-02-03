import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { db } from './drizzle/client';
import { agents } from './drizzle/schema/agents';
import { users } from './drizzle/schema/users';

async function seedAgents() {
  console.log('🌱 Performing Agent Roll Call...');

  const agentsDir = path.join(__dirname, '../../../.agent/agents');

  // 1. Get/Create Admin User
  const adminEmail = 'admin@thenewfuse.com';
  let admin = await db.query.users.findFirst({
    where: eq(users.email, adminEmail),
  });

  if (!admin) {
    console.log('Creating admin user...');
    const adminId = Math.random().toString(36).substring(2, 15);
    [admin] = await db
      .insert(users)
      .values({
        id: adminId,
        email: adminEmail,
        hashedPassword: 'system_account',
        name: 'TNF System Admin',
        role: 'ADMIN',
        updatedAt: new Date(),
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
      const nameLower = name.toLowerCase();
      const descLower = (frontmatter.description || '').toLowerCase();
      let avatarUrl = '/assets/agents/base.png';

      // 1. SEO & Traffic (New: seo.png)
      if (
        nameLower.includes('seo') ||
        nameLower.includes('keyword') ||
        nameLower.includes('link') ||
        nameLower.includes('traffic') ||
        nameLower.includes('search')
      ) {
        avatarUrl = '/assets/agents/seo.png';
      }
      // 2. Podcast & Audio (New: audio.png)
      else if (
        nameLower.includes('podcast') ||
        nameLower.includes('audio') ||
        nameLower.includes('episode') ||
        nameLower.includes('guest') ||
        nameLower.includes('voice')
      ) {
        avatarUrl = '/assets/agents/audio.png';
      }
      // 3. Sales & Funnel (New: sales.png)
      else if (
        nameLower.includes('sales') ||
        nameLower.includes('funnel') ||
        nameLower.includes('deal') ||
        nameLower.includes('negotiat') ||
        nameLower.includes('monetiz') ||
        nameLower.includes('revenue') ||
        nameLower.includes('value') ||
        nameLower.includes('business') ||
        nameLower.includes('oto')
      ) {
        avatarUrl = '/assets/agents/sales.png';
      }
      // 4. Creative & Design (New: creative.png)
      else if (
        nameLower.includes('visual') ||
        nameLower.includes('video') ||
        nameLower.includes('storyboard') ||
        nameLower.includes('design') ||
        nameLower.includes('creative') ||
        nameLower.includes('product-creator') ||
        nameLower.includes('product-factory')
      ) {
        avatarUrl = '/assets/agents/creative.png';
      }
      // 5. Strategy & Psychology (New: strategy.png)
      else if (
        nameLower.includes('strategy') ||
        nameLower.includes('psycholog') ||
        nameLower.includes('bias') ||
        nameLower.includes('logic') ||
        nameLower.includes('reasoning') ||
        nameLower.includes('persona') ||
        nameLower.includes('journey') ||
        nameLower.includes('feedback') ||
        nameLower.includes('intent') ||
        nameLower.includes('intelligence')
      ) {
        avatarUrl = '/assets/agents/strategy.png';
      }
      // 6. Social Media (New: social.png)
      else if (
        nameLower.includes('social') ||
        nameLower.includes('instagram') ||
        nameLower.includes('tiktok') ||
        nameLower.includes('facebook') ||
        nameLower.includes('twitter') ||
        nameLower.includes('linkedin') ||
        nameLower.includes('influencer') ||
        nameLower.includes('brand') ||
        nameLower.includes('reputation') ||
        nameLower.includes('community') ||
        nameLower.includes('sponsorship') ||
        nameLower.includes('media-kit')
      ) {
        avatarUrl = '/assets/agents/social.png';
      }
      // 7. Technical & Dev (Existing: coder.png)
      else if (
        type.includes('CODE') ||
        nameLower.includes('code') ||
        nameLower.includes('program') ||
        nameLower.includes('dev') ||
        nameLower.includes('backend') ||
        nameLower.includes('frontend') ||
        nameLower.includes('debug') ||
        nameLower.includes('test') ||
        nameLower.includes('penetration') ||
        nameLower.includes('protocol') ||
        nameLower.includes('setup') ||
        nameLower.includes('cli') ||
        nameLower.includes('gemini')
      ) {
        avatarUrl = '/assets/agents/coder.png';
      }
      // 8. Optimization & Analytics (Existing: analytics.png)
      else if (
        nameLower.includes('analytic') ||
        nameLower.includes('report') ||
        nameLower.includes('optimiz') ||
        nameLower.includes('sourcer') ||
        nameLower.includes('retrieval') ||
        nameLower.includes('testing') ||
        nameLower.includes('cro')
      ) {
        avatarUrl = '/assets/agents/analytics.png';
      }
      // 9. Finance & Crypto (Existing: defi.png)
      else if (
        type.includes('DEFI') ||
        nameLower.includes('defi') ||
        nameLower.includes('crypto') ||
        nameLower.includes('wallet') ||
        nameLower.includes('financial')
      ) {
        avatarUrl = '/assets/agents/defi.png';
      }
      // 10. Legal (Existing: legal.png)
      else if (
        nameLower.includes('legal') ||
        nameLower.includes('compliance') ||
        nameLower.includes('contract') ||
        nameLower.includes('tax')
      ) {
        avatarUrl = '/assets/agents/legal.png';
      }
      // 11. Security (Existing: security.png)
      else if (
        nameLower.includes('security') ||
        nameLower.includes('guardian') ||
        nameLower.includes('protect')
      ) {
        avatarUrl = '/assets/agents/security.png';
      }
      // 12. Support (Existing: support.png)
      else if (
        nameLower.includes('support') ||
        nameLower.includes('assist') ||
        nameLower.includes('help')
      ) {
        avatarUrl = '/assets/agents/support.png';
      }
      // 13. System & Orchestration (Existing: director.png)
      else if (
        nameLower.includes('director') ||
        nameLower.includes('orchestrat') ||
        nameLower.includes('manager') ||
        nameLower.includes('lead') ||
        nameLower.includes('graph') ||
        nameLower.includes('tagger') ||
        nameLower.includes('meta-agent') ||
        nameLower.includes('planner') ||
        nameLower.includes('writer')
      ) {
        avatarUrl = '/assets/agents/director.png';
      }
      // 14. Marketing (Catch-all - Existing: marketing.png)
      else if (
        nameLower.includes('market') ||
        nameLower.includes('marketing') ||
        nameLower.includes('content') ||
        nameLower.includes('growth') ||
        nameLower.includes('campaign') ||
        nameLower.includes('audience') ||
        nameLower.includes('fan') ||
        nameLower.includes('ad-network') ||
        nameLower.includes('affiliate')
      ) {
        avatarUrl = '/assets/agents/marketing.png';
      }
      // 15. More Technical & Dev (Catch-all)
      else if (
        nameLower.includes('database') ||
        nameLower.includes('algorithm') ||
        nameLower.includes('platform') ||
        nameLower.includes('slash') ||
        nameLower.includes('command') ||
        nameLower.includes('tech')
      ) {
        avatarUrl = '/assets/agents/coder.png';
      }
      // 16. More Strategy & Analysis (Catch-all)
      else if (
        nameLower.includes('explorer') ||
        nameLower.includes('niche') ||
        nameLower.includes('temporal') ||
        nameLower.includes('productivity') ||
        nameLower.includes('equipment') ||
        nameLower.includes('recommendation')
      ) {
        avatarUrl = '/assets/agents/strategy.png';
      }

      // Force unique avatar path (Generated by generate-unique-avatars.ts)
      avatarUrl = `/assets/agents/unique/${name}.png`;

      const existing = await db.query.agents.findFirst({
        where: (a, { and, eq }) => and(eq(a.name, name), eq(a.userId, userId)),
      });

      const caps = frontmatter.capabilities || frontmatter.tools || [];
      const capabilities = Array.isArray(caps) ? caps : [caps];

      const payload = {
        name,
        description: frontmatter.description || '',
        systemPrompt: body,
        type: (type === 'CODER' ? 'CODER' : type === 'ANALYSIS' ? 'ANALYZER' : 'GENERIC') as any,
        capabilities,
        avatarUrl,
        userId,
        status: 'IDLE' as any,
        updatedAt: new Date(),
        provider: 'default',
      };

      if (existing) {
        await db.update(agents).set(payload).where(eq(agents.id, existing.id));
      } else {
        const agentId = Math.random().toString(36).substring(2, 15);
        await db.insert(agents).values({ ...payload, id: agentId });
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
