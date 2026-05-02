import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import { sql } from 'drizzle-orm';
import { db } from '../src/drizzle';
import { llmConfigs } from '../src/drizzle/schema';

dotenv.config();

async function seed() {
  console.log('🌱 Seeding verified LLM configs to production database...');

  const configs = [
    {
      id: crypto.randomUUID(),
      name: 'Kilo AI (Minimax)',
      provider: 'kilo',
      modelName: 'minimax/minimax-m2.5:free',
      apiKey: process.env.KILO_API_KEY || '',
      enabled: true,
      priority: 5,
    },
    {
      id: crypto.randomUUID(),
      name: 'OpenCode CLI (Mimo)',
      provider: 'opencode-cli',
      modelName: 'opencode/mimo-v2-flash-free',
      apiKey: 'opencode', // CLI path
      enabled: true,
      priority: 4,
    },
    {
      id: crypto.randomUUID(),
      name: 'OpenRouter (Gemini)',
      provider: 'openrouter',
      modelName: 'google/gemini-2.0-flash-001',
      apiKey: process.env.OPENROUTER_API_KEY || '',
      enabled: true,
      priority: 7,
    },
  ];

  for (const config of configs) {
    if (!config.apiKey || config.apiKey.includes('PLACEHOLDER')) {
      console.log(`⚠️ Skipping ${config.name} (no valid key)`);
      continue;
    }

    // Upsert logic - check by name
    const existing = await db
      .select()
      .from(llmConfigs)
      .where(sql`${llmConfigs.name} = ${config.name}`);

    if (existing.length > 0) {
      await db
        .update(llmConfigs)
        .set({
          modelName: config.modelName,
          apiKey: config.apiKey,
          priority: config.priority,
          updatedAt: new Date(),
        })
        .where(sql`${llmConfigs.name} = ${config.name}`);
      console.log(`✅ Updated ${config.name}`);
    } else {
      await db.insert(llmConfigs).values(config);
      console.log(`✅ Inserted ${config.name}`);
    }
  }

  console.log('✨ Seeding complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
