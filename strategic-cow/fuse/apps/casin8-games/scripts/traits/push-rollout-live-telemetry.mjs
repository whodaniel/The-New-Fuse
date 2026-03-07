import http from 'node:http';

function arg(name, fallback = null) {
  const ix = process.argv.indexOf(name);
  if (ix < 0 || ix + 1 >= process.argv.length) return fallback;
  return process.argv[ix + 1];
}

function postJson(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = Buffer.from(JSON.stringify(body));
    const u = new URL(url);
    const req = http.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port,
        path: `${u.pathname}${u.search}`,
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'content-length': String(data.length),
          ...headers,
        },
      },
      (res) => {
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
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const baseUrl = String(arg('--base-url', 'http://127.0.0.1:3000')).replace(/\/+$/, '');
const rolloutId = String(arg('--rollout-id', '')).trim();
if (!rolloutId) {
  console.error('Missing --rollout-id');
  process.exit(2);
}
const token = String(arg('--token', process.env.CASIN8_API_TOKEN || '')).trim();
const headers = token ? { Authorization: `Bearer ${token}` } : {};

const lossBps = Number(arg('--loss-bps', 0));
const volatilityBps = Number(arg('--volatility-bps', 0));
const windowMinutes = Number(arg('--window-minutes', 60));

const out = await postJson(
  `${baseUrl}/api/strategy/traits/rollout/evaluate-live`,
  { rolloutId, lossBps, volatilityBps, windowMinutes },
  headers
);

process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
if (out.status !== 200) process.exit(1);
