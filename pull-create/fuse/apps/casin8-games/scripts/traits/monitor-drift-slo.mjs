import http from 'node:http';

function arg(name, fallback = null) {
  const ix = process.argv.indexOf(name);
  if (ix < 0 || ix + 1 >= process.argv.length) return fallback;
  return process.argv[ix + 1];
}

function getJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { headers }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try {
          const json = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
          resolve({ status: res.statusCode || 0, json });
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
  });
}

const baseUrl = String(arg('--base-url', 'http://127.0.0.1:3000')).replace(/\/+$/, '');
const token = String(arg('--token', process.env.CASIN8_API_TOKEN || '')).trim();
const agentId = String(arg('--agent-id', '')).trim();
const headers = token ? { Authorization: `Bearer ${token}` } : {};

const slo = await getJson(`${baseUrl}/api/strategy/traits/slo`, headers);
if (slo.status !== 200) {
  console.error(JSON.stringify({ ok: false, error: 'Unable to fetch trait SLO', status: slo.status }, null, 2));
  process.exit(2);
}

let drift = null;
if (agentId) {
  const driftRes = await getJson(
    `${baseUrl}/api/strategy/traits/drift?agentId=${encodeURIComponent(agentId)}`,
    headers
  );
  if (driftRes.status === 200) drift = driftRes.json.drift;
}

const unhealthy = slo.json.status === 'unhealthy';
const severeDrift = drift && Number(drift.driftBps || 0) > 1800;

const report = {
  ok: !unhealthy && !severeDrift,
  slo: slo.json,
  drift,
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (unhealthy || severeDrift) process.exit(1);
