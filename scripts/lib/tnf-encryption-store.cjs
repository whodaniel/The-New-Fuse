#!/usr/bin/env node

/**
 * Postgres store adapter for the ENCRYPTION_KEY rotation migration.
 *
 * Thin, operator-run plumbing kept OUT of the tested core so the rotation logic
 * never depends on a DB driver. It reads DATABASE_URL from the environment,
 * fetches the (id, encrypted-column) pairs, and writes re-encrypted values back
 * with parameterized queries.
 *
 * The rotation core (scripts/tnf-encryption-key-rotate.cjs) does all the crypto,
 * classification, and round-trip verification; this file only moves rows.
 */

'use strict';

// Identifiers come from the migration's own DEFAULT_TARGETS (verified against
// the schema), not user input — but validate anyway so a bad config can never
// become SQL injection. Postgres identifiers: letters, digits, underscore.
const IDENT = /^[a-z_][a-z0-9_]*$/i;
function ident(name) {
  if (!IDENT.test(String(name))) {
    throw new Error(`unsafe SQL identifier: ${JSON.stringify(name)}`);
  }
  return `"${name}"`;
}

/**
 * @returns a store with fetchRows(table, column) and updateRow(table, column, id, value).
 * Requires `pg` and DATABASE_URL. Throws if either is missing so the caller can
 * report it cleanly.
 */
function makePostgresStore() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  let Client;
  try {
    ({ Client } = require('pg'));
  } catch {
    throw new Error('the "pg" package is not installed in this context');
  }

  let client = null;
  async function connect() {
    if (client) return client;
    client = new Client({ connectionString: url });
    await client.connect();
    return client;
  }

  return {
    async fetchRows(table, column) {
      const c = await connect();
      const t = ident(table);
      const col = ident(column);
      // Only rows that actually have a value to migrate.
      const res = await c.query(`SELECT id, ${col} AS value FROM ${t} WHERE ${col} IS NOT NULL`);
      return res.rows.map((r) => ({ id: r.id, value: r.value }));
    },
    async updateRow(table, column, id, newValue) {
      const c = await connect();
      const t = ident(table);
      const col = ident(column);
      await c.query(`UPDATE ${t} SET ${col} = $1 WHERE id = $2`, [newValue, id]);
    },
    async close() {
      if (client) {
        await client.end();
        client = null;
      }
    },
  };
}

module.exports = { makePostgresStore, _ident: ident };
