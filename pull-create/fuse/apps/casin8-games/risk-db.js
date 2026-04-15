const fs = require('fs');
const path = require('path');

const CURRENT_SCHEMA_VERSION = 4;

function nowIso() {
  return new Date().toISOString();
}

function deepClone(value) {
  return decodeBigInts(encodeBigInts(value));
}

function encodeBigInts(value) {
  if (typeof value === 'bigint') return { __type: 'bigint', value: value.toString() };
  if (Array.isArray(value)) return value.map(encodeBigInts);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = encodeBigInts(v);
    return out;
  }
  return value;
}

function decodeBigInts(value) {
  if (Array.isArray(value)) return value.map(decodeBigInts);
  if (value && typeof value === 'object') {
    if (value.__type === 'bigint') return BigInt(String(value.value || '0'));
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = decodeBigInts(v);
    return out;
  }
  return value;
}

function ensureTablesShape(data) {
  const tables = data.tables && typeof data.tables === 'object' ? data.tables : {};
  const required = [
    'compliance_profiles',
    'payment_orders',
    'webhook_events',
    'velocity_events',
    'risk_alerts',
    'sponsorship_positions',
    'funding_attempts',
    'trait_rollouts',
    'trait_observations',
    'trait_recommendations',
    'trait_policy_events',
  ];
  for (const name of required) {
    if (!Array.isArray(tables[name])) tables[name] = [];
  }
  data.tables = tables;
  if (!Array.isArray(data.migrations)) data.migrations = [];
  if (!Number.isInteger(data.schemaVersion)) data.schemaVersion = 0;
  return data;
}

function migrationSteps() {
  return [
    {
      version: 1,
      name: 'init-risk-tables',
      apply(data) {
        ensureTablesShape(data);
        return data;
      },
    },
    {
      version: 2,
      name: 'add-funding-attempts',
      apply(data) {
        ensureTablesShape(data);
        if (!Array.isArray(data.tables.funding_attempts)) data.tables.funding_attempts = [];
        return data;
      },
    },
    {
      version: 3,
      name: 'normalize-provider-fraud-signals',
      apply(data) {
        ensureTablesShape(data);
        data.tables.payment_orders = data.tables.payment_orders.map((row) => ({
          ...row,
          providerFraudSignals:
            row && typeof row.providerFraudSignals === 'object' ? row.providerFraudSignals : {},
        }));
        return data;
      },
    },
    {
      version: 4,
      name: 'add-trait-control-plane-tables',
      apply(data) {
        ensureTablesShape(data);
        if (!Array.isArray(data.tables.trait_rollouts)) data.tables.trait_rollouts = [];
        if (!Array.isArray(data.tables.trait_observations)) data.tables.trait_observations = [];
        if (!Array.isArray(data.tables.trait_recommendations))
          data.tables.trait_recommendations = [];
        if (!Array.isArray(data.tables.trait_policy_events)) data.tables.trait_policy_events = [];
        return data;
      },
    },
  ];
}

class RiskDb {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = this._loadOrCreate();
  }

  _loadOrCreate() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    let loaded = null;
    if (fs.existsSync(this.filePath)) {
      try {
        loaded = decodeBigInts(JSON.parse(fs.readFileSync(this.filePath, 'utf8')));
      } catch {
        loaded = null;
      }
    }
    const data = ensureTablesShape(
      loaded || {
        schemaVersion: 0,
        migrations: [],
        createdAt: nowIso(),
        updatedAt: nowIso(),
        tables: {},
      }
    );
    this._migrate(data);
    this._persist(data);
    return data;
  }

  _migrate(data) {
    const steps = migrationSteps().sort((a, b) => a.version - b.version);
    let current = data.schemaVersion || 0;
    for (const step of steps) {
      if (step.version <= current) continue;
      step.apply(data);
      data.migrations.push({
        version: step.version,
        name: step.name,
        at: nowIso(),
      });
      current = step.version;
    }
    data.schemaVersion = Math.max(current, CURRENT_SCHEMA_VERSION);
    data.updatedAt = nowIso();
  }

  _persist(data = this.data) {
    data.updatedAt = nowIso();
    const tmp = `${this.filePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(encodeBigInts(data), null, 2), 'utf8');
    fs.renameSync(tmp, this.filePath);
  }

  stats() {
    const out = {};
    for (const [k, rows] of Object.entries(this.data.tables)) {
      out[k] = Array.isArray(rows) ? rows.length : 0;
    }
    return {
      schemaVersion: this.data.schemaVersion,
      updatedAt: this.data.updatedAt,
      tables: out,
    };
  }

  _upsert(tableName, keyField, row) {
    const table = this.data.tables[tableName];
    const key = String(row[keyField] || '').trim();
    if (!key) throw new Error(`Missing key field ${keyField} for table ${tableName}`);
    const idx = table.findIndex((x) => String(x[keyField] || '') === key);
    const nextRow = decodeBigInts(encodeBigInts({ ...row }));
    if (idx >= 0) table[idx] = nextRow;
    else table.push(nextRow);
    this._persist();
    return deepClone(nextRow);
  }

  _get(tableName, keyField, key) {
    const table = this.data.tables[tableName];
    const found = table.find((x) => String(x[keyField] || '') === String(key || ''));
    return found ? deepClone(found) : null;
  }

  _list(tableName) {
    return deepClone(this.data.tables[tableName] || []);
  }

  upsertComplianceProfile(profile) {
    return this._upsert('compliance_profiles', 'playerId', profile);
  }

  getComplianceProfile(playerId) {
    return this._get('compliance_profiles', 'playerId', playerId);
  }

  listComplianceProfiles() {
    return this._list('compliance_profiles');
  }

  upsertPaymentOrder(order) {
    return this._upsert('payment_orders', 'orderId', order);
  }

  getPaymentOrder(orderId) {
    return this._get('payment_orders', 'orderId', orderId);
  }

  listPaymentOrders() {
    return this._list('payment_orders');
  }

  addWebhookEvent(event) {
    const table = this.data.tables.webhook_events;
    const eventId = String(event.eventId || '').trim();
    if (!eventId) throw new Error('eventId is required');
    if (!table.some((x) => String(x.eventId || '') === eventId)) {
      table.push(decodeBigInts(encodeBigInts(event)));
      this._persist();
      return { inserted: true };
    }
    return { inserted: false };
  }

  hasWebhookEvent(eventId) {
    return this.data.tables.webhook_events.some(
      (x) => String(x.eventId || '') === String(eventId || '')
    );
  }

  listWebhookEvents() {
    return this._list('webhook_events');
  }

  addVelocityEvent(event, maxRows = 50000) {
    const row = decodeBigInts(encodeBigInts(event));
    const table = this.data.tables.velocity_events;
    table.push(row);
    if (table.length > maxRows) {
      table.splice(0, table.length - maxRows);
    }
    this._persist();
  }

  velocitySummary(playerId, sinceMs) {
    const pid = String(playerId || '').trim();
    const since = Number(sinceMs || 0);
    let txCount = 0;
    let totalUnits = 0n;
    for (const row of this.data.tables.velocity_events) {
      if (String(row.playerId || '') !== pid) continue;
      if (Number(row.tsMs || 0) < since) continue;
      txCount += 1;
      totalUnits += BigInt(String(row.amountUnits || '0'));
    }
    return { txCount, totalUnits };
  }

  addRiskAlert(alert, maxRows = 2000) {
    const table = this.data.tables.risk_alerts;
    table.unshift(decodeBigInts(encodeBigInts(alert)));
    if (table.length > maxRows) table.length = maxRows;
    this._persist();
  }

  listRiskAlerts(limit = 100) {
    return this._list('risk_alerts').slice(0, limit);
  }

  upsertSponsorshipPosition(position) {
    return this._upsert('sponsorship_positions', 'positionId', position);
  }

  getSponsorshipPosition(positionId) {
    return this._get('sponsorship_positions', 'positionId', positionId);
  }

  listSponsorshipPositions() {
    return this._list('sponsorship_positions');
  }

  upsertFundingAttempt(row) {
    return this._upsert('funding_attempts', 'id', row);
  }

  getFundingAttempt(id) {
    return this._get('funding_attempts', 'id', id);
  }

  listFundingAttempts() {
    return this._list('funding_attempts');
  }

  upsertTraitRollout(row) {
    return this._upsert('trait_rollouts', 'rolloutId', row);
  }

  getTraitRollout(rolloutId) {
    return this._get('trait_rollouts', 'rolloutId', rolloutId);
  }

  listTraitRollouts() {
    return this._list('trait_rollouts');
  }

  upsertTraitObservation(row) {
    return this._upsert('trait_observations', 'agentId', row);
  }

  getTraitObservation(agentId) {
    return this._get('trait_observations', 'agentId', agentId);
  }

  listTraitObservations() {
    return this._list('trait_observations');
  }

  upsertTraitRecommendation(row) {
    return this._upsert('trait_recommendations', 'agentId', row);
  }

  getTraitRecommendation(agentId) {
    return this._get('trait_recommendations', 'agentId', agentId);
  }

  listTraitRecommendations() {
    return this._list('trait_recommendations');
  }

  addTraitPolicyEvent(row, maxRows = 5000) {
    const table = this.data.tables.trait_policy_events;
    table.unshift(decodeBigInts(encodeBigInts(row)));
    if (table.length > maxRows) table.length = maxRows;
    this._persist();
  }

  listTraitPolicyEvents(limit = 200) {
    return this._list('trait_policy_events').slice(0, limit);
  }
}

function createRiskDb(filePath) {
  const db = new RiskDb(filePath);
  return db;
}

module.exports = {
  createRiskDb,
  CURRENT_SCHEMA_VERSION,
};
