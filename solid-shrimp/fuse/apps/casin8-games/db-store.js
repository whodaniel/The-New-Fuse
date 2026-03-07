const fs = require('fs');
const path = require('path');

function nowIso() {
  return new Date().toISOString();
}

function safeJson(value) {
  return JSON.parse(JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));
}

function toStateShape(raw) {
  const parsed = raw && typeof raw === 'object' ? raw : {};
  return {
    sessions: parsed.sessions && typeof parsed.sessions === 'object' ? parsed.sessions : {},
    tables: parsed.tables && typeof parsed.tables === 'object' ? parsed.tables : {},
  };
}

const MIGRATIONS = [
  {
    version: 1,
    name: 'init_core_tables',
    sql: `
CREATE TABLE IF NOT EXISTS app_meta (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
  id text PRIMARY KEY,
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tables_state (
  id text PRIMARY KEY,
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS table_events (
  event_id bigserial PRIMARY KEY,
  table_id text NOT NULL,
  event_ts timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_table_events_table_ts ON table_events(table_id, event_ts DESC);
CREATE TABLE IF NOT EXISTS table_snapshots (
  table_id text PRIMARY KEY,
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS hand_actions (
  action_id bigserial PRIMARY KEY,
  table_id text NOT NULL,
  hand_id text NOT NULL,
  action_seq integer NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_hand_actions_unique ON hand_actions(table_id, hand_id, action_seq);
CREATE TABLE IF NOT EXISTS session_ledger (
  row_id bigserial PRIMARY KEY,
  session_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_session_ledger_session_ts ON session_ledger(session_id, created_at DESC);
CREATE TABLE IF NOT EXISTS sponsorship_positions (
  position_id text PRIMARY KEY,
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS payment_orders (
  order_id text PRIMARY KEY,
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS compliance_profiles (
  player_id text PRIMARY KEY,
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS webhook_events (
  event_id text PRIMARY KEY,
  provider text NOT NULL,
  order_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS retention_archives (
  archive_id text PRIMARY KEY,
  kind text NOT NULL,
  storage_path text NOT NULL,
  from_ts timestamptz,
  to_ts timestamptz,
  row_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
`,
  },
];

class DbStore {
  constructor({ dataDir, statePath }) {
    this.dataDir = dataDir;
    this.statePath = statePath;
    this.mode = process.env.CASIN8_DB_URL ? 'postgres' : 'file';
    this.pool = null;
  }

  async init() {
    if (this.mode !== 'postgres') return;
    // Lazy require keeps local dev/tests working without pg installed.
    let Pool;
    try {
      ({ Pool } = require('pg'));
    } catch {
      throw new Error('CASIN8_DB_URL is set but dependency "pg" is not installed');
    }
    this.pool = new Pool({
      connectionString: process.env.CASIN8_DB_URL,
      max: Number(process.env.CASIN8_DB_POOL_MAX || 10),
      ssl: process.env.CASIN8_DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });
    await this.runMigrations();
  }

  async close() {
    if (this.pool) await this.pool.end();
  }

  async runMigrations() {
    if (this.mode !== 'postgres') return;
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`
CREATE TABLE IF NOT EXISTS schema_migrations (
  version integer PRIMARY KEY,
  name text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now()
);
`);
      const existing = await client.query('SELECT version FROM schema_migrations');
      const done = new Set(existing.rows.map((r) => Number(r.version)));
      for (const mig of MIGRATIONS) {
        if (done.has(mig.version)) continue;
        await client.query(mig.sql);
        await client.query(
          'INSERT INTO schema_migrations(version,name,applied_at) VALUES ($1,$2,now())',
          [mig.version, mig.name]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  loadFileState() {
    try {
      if (!fs.existsSync(this.statePath)) return { sessions: {}, tables: {} };
      const raw = fs.readFileSync(this.statePath, 'utf8');
      return toStateShape(JSON.parse(raw));
    } catch {
      return { sessions: {}, tables: {} };
    }
  }

  saveFileState(state) {
    const tmp = `${this.statePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(safeJson(state)), 'utf8');
    fs.renameSync(tmp, this.statePath);
  }

  async loadBootstrapState() {
    if (this.mode !== 'postgres') return this.loadFileState();
    const client = await this.pool.connect();
    try {
      const [sessions, tables] = await Promise.all([
        client.query('SELECT id, payload FROM sessions'),
        client.query('SELECT id, payload FROM tables_state'),
      ]);
      const out = { sessions: {}, tables: {} };
      for (const row of sessions.rows) out.sessions[String(row.id)] = row.payload;
      for (const row of tables.rows) out.tables[String(row.id)] = row.payload;
      return out;
    } finally {
      client.release();
    }
  }

  async persistState(state) {
    if (this.mode !== 'postgres') {
      this.saveFileState(state);
      return;
    }
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const sessions = state.sessions && typeof state.sessions === 'object' ? state.sessions : {};
      const tables = state.tables && typeof state.tables === 'object' ? state.tables : {};
      await client.query('DELETE FROM sessions');
      await client.query('DELETE FROM tables_state');
      for (const [id, payload] of Object.entries(sessions)) {
        await client.query('INSERT INTO sessions(id,payload,updated_at) VALUES ($1,$2,now())', [
          id,
          safeJson(payload),
        ]);
      }
      for (const [id, payload] of Object.entries(tables)) {
        await client.query('INSERT INTO tables_state(id,payload,updated_at) VALUES ($1,$2,now())', [
          id,
          safeJson(payload),
        ]);
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async appendTableEvent(tableId, event) {
    if (this.mode !== 'postgres') return;
    await this.pool.query(
      'INSERT INTO table_events(table_id,event_ts,payload) VALUES ($1,now(),$2)',
      [String(tableId), safeJson(event)]
    );
  }

  async upsertTableSnapshot(tableId, snapshot) {
    if (this.mode !== 'postgres') return;
    await this.pool.query(
      `INSERT INTO table_snapshots(table_id,payload,updated_at)
       VALUES ($1,$2,now())
       ON CONFLICT (table_id) DO UPDATE SET payload=EXCLUDED.payload, updated_at=now()`,
      [String(tableId), safeJson(snapshot)]
    );
  }

  async appendHandAction({ tableId, handId, actionSeq, payload }) {
    if (this.mode !== 'postgres') return;
    await this.pool.query(
      `INSERT INTO hand_actions(table_id,hand_id,action_seq,payload)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (table_id, hand_id, action_seq) DO NOTHING`,
      [String(tableId), String(handId), Number(actionSeq), safeJson(payload)]
    );
  }

  async appendSessionLedger(sessionId, entry) {
    if (this.mode !== 'postgres') return;
    await this.pool.query(
      'INSERT INTO session_ledger(session_id,created_at,payload) VALUES ($1,now(),$2)',
      [String(sessionId), safeJson(entry)]
    );
  }

  async upsertSponsorshipPosition(position) {
    if (this.mode !== 'postgres' || !position?.positionId) return;
    await this.pool.query(
      `INSERT INTO sponsorship_positions(position_id,payload,updated_at)
       VALUES ($1,$2,now())
       ON CONFLICT (position_id) DO UPDATE SET payload=EXCLUDED.payload, updated_at=now()`,
      [String(position.positionId), safeJson(position)]
    );
  }

  async upsertPaymentOrder(order) {
    if (this.mode !== 'postgres' || !order?.orderId) return;
    await this.pool.query(
      `INSERT INTO payment_orders(order_id,payload,updated_at)
       VALUES ($1,$2,now())
       ON CONFLICT (order_id) DO UPDATE SET payload=EXCLUDED.payload, updated_at=now()`,
      [String(order.orderId), safeJson(order)]
    );
  }

  async upsertComplianceProfile(profile) {
    if (this.mode !== 'postgres' || !profile?.playerId) return;
    await this.pool.query(
      `INSERT INTO compliance_profiles(player_id,payload,updated_at)
       VALUES ($1,$2,now())
       ON CONFLICT (player_id) DO UPDATE SET payload=EXCLUDED.payload, updated_at=now()`,
      [String(profile.playerId), safeJson(profile)]
    );
  }

  async insertWebhookEvent(event) {
    if (this.mode !== 'postgres' || !event?.eventId) return;
    await this.pool.query(
      `INSERT INTO webhook_events(event_id,provider,order_id,created_at,payload)
       VALUES ($1,$2,$3,now(),$4)
       ON CONFLICT (event_id) DO NOTHING`,
      [
        String(event.eventId),
        String(event.provider || ''),
        String(event.orderId || ''),
        safeJson(event),
      ]
    );
  }

  async archiveAndPrune({ retentionDays = 30, outputDir }) {
    if (this.mode !== 'postgres') {
      return { archived: [], pruned: [] };
    }
    const outDir = outputDir || path.join(this.dataDir, 'archive');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const client = await this.pool.connect();
    const archived = [];
    const pruned = [];
    const cutoff = new Date(Date.now() - Number(retentionDays) * 24 * 60 * 60 * 1000);
    try {
      const snapshot = await client.query(
        'SELECT row_id, session_id, created_at, payload FROM session_ledger WHERE created_at < $1 ORDER BY row_id ASC',
        [cutoff.toISOString()]
      );
      if (snapshot.rows.length > 0) {
        const archiveId = `session_ledger_${Date.now()}`;
        const filePath = path.join(outDir, `${archiveId}.jsonl`);
        const lines = snapshot.rows.map((r) => JSON.stringify(r));
        fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8');
        await client.query(
          'INSERT INTO retention_archives(archive_id,kind,storage_path,from_ts,to_ts,row_count,created_at) VALUES ($1,$2,$3,$4,$5,$6,now())',
          [
            archiveId,
            'session_ledger',
            filePath,
            snapshot.rows[0].created_at,
            snapshot.rows[snapshot.rows.length - 1].created_at,
            snapshot.rows.length,
          ]
        );
        await client.query('DELETE FROM session_ledger WHERE row_id = ANY($1)', [
          snapshot.rows.map((r) => r.row_id),
        ]);
        archived.push({ archiveId, kind: 'session_ledger', filePath, rows: snapshot.rows.length });
        pruned.push({ kind: 'session_ledger', rows: snapshot.rows.length });
      }

      const handRows = await client.query(
        'SELECT action_id, table_id, hand_id, created_at, payload FROM hand_actions WHERE created_at < $1 ORDER BY action_id ASC',
        [cutoff.toISOString()]
      );
      if (handRows.rows.length > 0) {
        const archiveId = `hand_actions_${Date.now()}`;
        const filePath = path.join(outDir, `${archiveId}.jsonl`);
        const lines = handRows.rows.map((r) => JSON.stringify(r));
        fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8');
        await client.query(
          'INSERT INTO retention_archives(archive_id,kind,storage_path,from_ts,to_ts,row_count,created_at) VALUES ($1,$2,$3,$4,$5,$6,now())',
          [
            archiveId,
            'hand_actions',
            filePath,
            handRows.rows[0].created_at,
            handRows.rows[handRows.rows.length - 1].created_at,
            handRows.rows.length,
          ]
        );
        await client.query('DELETE FROM hand_actions WHERE action_id = ANY($1)', [
          handRows.rows.map((r) => r.action_id),
        ]);
        archived.push({ archiveId, kind: 'hand_actions', filePath, rows: handRows.rows.length });
        pruned.push({ kind: 'hand_actions', rows: handRows.rows.length });
      }
      return { archived, pruned, cutoff: cutoff.toISOString() };
    } finally {
      client.release();
    }
  }
}

function createDbStore(opts) {
  return new DbStore(opts);
}

module.exports = {
  createDbStore,
};
