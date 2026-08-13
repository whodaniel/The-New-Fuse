import { DatabaseService, sql } from '@the-new-fuse/database';

async function run() {
  const db = new DatabaseService();
  try {
    const res = await db.client.execute(
      sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    );
    console.log(res.map((r: any) => r.table_name));
  } catch (e) {
    console.error(e);
  }
}
run();
