const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/thenewfuse' });
async function run() {
  try {
    const res = await pool.query('SELECT * FROM public.timeline_events LIMIT 1');
    console.log(res.rows);
  } catch (e) {
    console.error(e.message);
  } finally {
    pool.end();
  }
}
run();
