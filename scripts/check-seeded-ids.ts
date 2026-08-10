import { db } from '../packages/database/src/drizzle/db.js';
import { agents } from '../packages/database/src/drizzle/schema/agents.js';
import { inArray } from 'drizzle-orm';

async function main() {
  const seededIds = ['kilo-cli', 'opencode-cli', 'pi-coding-agent', 'claude-code', 'tnf-hermes', 'jules'];
  const results = await db.select({
    id: agents.id,
    idNumber: agents.idNumber,
  }).from(agents).where(inArray(agents.id, seededIds));

  console.log('Seeded IDs:');
  console.table(results);
  process.exit(0);
}

main().catch(console.error);
