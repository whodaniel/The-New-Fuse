import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { db, sql } from '@the-new-fuse/database';

export async function setupTestModule() {
  const moduleRef = await Test.createTestingModule({
    providers: [
      {
        provide: ConfigService,
        useValue: {
          get: // @ts-ignore
jest.fn((key: string) => {
            const config = {
              DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
              REDIS_HOST: 'localhost',
              REDIS_PORT: 6379,
            };
            return config[key];
          }),
        },
      },
    ],
  }).compile();

  return moduleRef;
}

/*
// @ts-ignore
export async function setupTestDatabase(): Promise<any> {
  // Clean up test database
  await db.execute(sql`TRUNCATE TABLE users CASCADE`);
  await db.execute(sql`TRUNCATE TABLE agents CASCADE`);

  return db;
}
*/

export async function teardownTestDatabase() {
  // Drizzle client (postgres.js) handles connection pool
  // No explicit disconnect needed usually, or use sql`DISCARD ALL`?
  // But for tests, we can just leave it or explicit close if exposed.
  // The exported 'db' is a singleton.
}
