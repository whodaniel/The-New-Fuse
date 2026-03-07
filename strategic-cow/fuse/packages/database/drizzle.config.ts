import * as dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Load environment from root .env file
dotenv.config({ path: '../../.env' });

const dbUrl = process.env.DATABASE_URL ?? 'postgresql://localhost:5432/fuse';

export default defineConfig({
  schema: './src/drizzle/schema/*.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: dbUrl,
  },
  verbose: true,
  strict: true,
  // Include pg_vector extension support
  extensionsFilters: ['postgis'],
});
