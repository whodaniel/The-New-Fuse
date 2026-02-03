import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as fs from 'fs';
import * as path from 'path';
import postgres from 'postgres';
import sharp from 'sharp';
import * as schema from './drizzle/schema';

// DB Connection
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

const PUBLIC_ASSETS_DIR = path.resolve(__dirname, '../../../apps/frontend/public/assets/agents');
const OUTPUT_DIR = path.join(PUBLIC_ASSETS_DIR, 'unique');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Reuse logic to determine base avatar
function getBaseAvatar(name: string, type: string, description: string = ''): string {
  const nameLower = name.toLowerCase();

  if (
    nameLower.includes('seo') ||
    nameLower.includes('keyword') ||
    nameLower.includes('link') ||
    nameLower.includes('traffic') ||
    nameLower.includes('search')
  )
    return 'seo.png';
  if (
    nameLower.includes('podcast') ||
    nameLower.includes('audio') ||
    nameLower.includes('episode') ||
    nameLower.includes('guest') ||
    nameLower.includes('voice')
  )
    return 'audio.png';
  if (
    nameLower.includes('sales') ||
    nameLower.includes('funnel') ||
    nameLower.includes('deal') ||
    nameLower.includes('negotiat') ||
    nameLower.includes('monetiz') ||
    nameLower.includes('revenue') ||
    nameLower.includes('value') ||
    nameLower.includes('business') ||
    nameLower.includes('oto')
  )
    return 'sales.png';
  if (
    nameLower.includes('visual') ||
    nameLower.includes('video') ||
    nameLower.includes('storyboard') ||
    nameLower.includes('design') ||
    nameLower.includes('creative') ||
    nameLower.includes('product-creator') ||
    nameLower.includes('product-factory')
  )
    return 'creative.png';
  if (
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
  )
    return 'strategy.png';
  if (
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
  )
    return 'social.png';
  if (
    nameLower.includes('director') ||
    nameLower.includes('orchestrat') ||
    nameLower.includes('manager') ||
    nameLower.includes('lead') ||
    nameLower.includes('graph') ||
    nameLower.includes('tagger') ||
    nameLower.includes('meta-agent') ||
    nameLower.includes('planner') ||
    nameLower.includes('writer')
  )
    return 'director.png';
  if (
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
  )
    return 'coder.png';
  if (
    nameLower.includes('analytic') ||
    nameLower.includes('report') ||
    nameLower.includes('optimiz') ||
    nameLower.includes('sourcer') ||
    nameLower.includes('retrieval') ||
    nameLower.includes('testing') ||
    nameLower.includes('cro')
  )
    return 'analytics.png';
  if (
    type.includes('DEFI') ||
    nameLower.includes('defi') ||
    nameLower.includes('crypto') ||
    nameLower.includes('wallet') ||
    nameLower.includes('financial')
  )
    return 'defi.png';
  if (
    nameLower.includes('legal') ||
    nameLower.includes('compliance') ||
    nameLower.includes('contract') ||
    nameLower.includes('tax')
  )
    return 'legal.png';
  if (
    nameLower.includes('security') ||
    nameLower.includes('guardian') ||
    nameLower.includes('protect')
  )
    return 'security.png';
  if (nameLower.includes('support') || nameLower.includes('assist') || nameLower.includes('help'))
    return 'support.png';

  // Catch-alls
  if (
    nameLower.includes('market') ||
    nameLower.includes('marketing') ||
    nameLower.includes('content') ||
    nameLower.includes('growth') ||
    nameLower.includes('campaign') ||
    nameLower.includes('audience') ||
    nameLower.includes('fan') ||
    nameLower.includes('ad-network') ||
    nameLower.includes('affiliate')
  )
    return 'marketing.png';
  if (
    nameLower.includes('database') ||
    nameLower.includes('algorithm') ||
    nameLower.includes('platform') ||
    nameLower.includes('slash') ||
    nameLower.includes('command') ||
    nameLower.includes('tech')
  )
    return 'coder.png';
  if (
    nameLower.includes('explorer') ||
    nameLower.includes('niche') ||
    nameLower.includes('temporal') ||
    nameLower.includes('productivity') ||
    nameLower.includes('equipment') ||
    nameLower.includes('recommendation')
  )
    return 'strategy.png';

  return 'base.png';
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

async function main() {
  console.log('🎨 Generating Unique Avatars...');

  const agents = await db.query.agents.findMany();
  console.log(`Found ${agents.length} agents to process.`);

  for (const agent of agents) {
    const baseImageName = getBaseAvatar(agent.name, agent.type, agent.description || '');
    const baseImagePath = path.join(PUBLIC_ASSETS_DIR, baseImageName);

    // Hash -> Hue Rotation (0-360)
    const hash = simpleHash(agent.name);
    const hueRotation = hash % 360;

    const uniqueFilename = `${agent.name}.png`;
    const outputPath = path.join(OUTPUT_DIR, uniqueFilename);

    try {
      await sharp(baseImagePath)
        .modulate({
          hue: hueRotation,
        })
        .toFile(outputPath);

      const uniqueUrl = `/assets/agents/unique/${uniqueFilename}`;
      await db
        .update(schema.agents)
        .set({ avatarUrl: uniqueUrl })
        .where(eq(schema.agents.id, agent.id));
    } catch (e) {
      console.error(`❌ Error processing ${agent.name}:`, e);
    }
  }

  console.log('✨ Completed generating unique avatars for all agents.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
