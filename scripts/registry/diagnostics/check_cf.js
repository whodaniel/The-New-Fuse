const https = require('https');

const TOKEN = 'fpX3SUxktWBIgDgb1sm29x5G8G9YmlaKyzE0uReM';
const ACCOUNT_ID = '7a340d098bbe253ce909af4ca6870ff0';
const BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}`;

const req = (path) =>
  new Promise((resolve, reject) => {
    https
      .get(
        `${BASE_URL}${path}`,
        {
          headers: { Authorization: `Bearer ${TOKEN}` },
        },
        (res) => {
          let raw = '';
          res.on('data', (chunk) => (raw += chunk));
          res.on('end', () => {
            try {
              resolve(JSON.parse(raw));
            } catch (e) {
              reject(e);
            }
          });
        }
      )
      .on('error', reject);
  });

async function main() {
  const pages = await req('/pages/projects');
  console.log('--- Pages Projects ---\n' + (pages.result?.map((p) => p.name).join('\n') || 'None'));

  const workers = await req('/workers/scripts');
  console.log('--- Workers ---\n' + (workers.result?.map((w) => w.id).join('\n') || 'None'));

  const kv = await req('/storage/kv/namespaces');
  console.log('--- KV Namespaces ---\n' + (kv.result?.map((k) => k.title).join('\n') || 'None'));

  const d1 = await req('/d1/database');
  console.log('--- D1 Databases ---\n' + (d1.result?.map((d) => d.name).join('\n') || 'None'));

  const r2 = await req('/r2/buckets');
  console.log('--- R2 Buckets ---\n' + (r2.result?.map((r) => r.name).join('\n') || 'None'));
}

main().catch(console.error);
