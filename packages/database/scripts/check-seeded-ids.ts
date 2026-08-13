import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("No DATABASE_URL found");
    process.exit(1);
  }
  
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  
  const result = await client.query(`
    SELECT id, name, id_number FROM agents 
    WHERE name IN ('kilo-cli', 'opencode-cli', 'pi-coding-agent', 'claude-code', 'tnf-hermes', 'jules')
  `);
  
  console.log('Seeded IDs:');
  console.table(result.rows);
  
  await client.end();
  process.exit(0);
}

main().catch(console.error);
