// Read Supabase credentials from the local frontend env and run read-only
// probes against the project's auth endpoints. Print everything to stdout;
// never persist tokens.

const fs = require('fs');
const path = require('path');

// Walk up from this script to the repo root, regardless of where node was invoked.
const repoRoot = path.resolve(__dirname, '..', '..');
const envPath = path.join(repoRoot, 'apps', 'frontend', '.env.local');
const env = fs.readFileSync(envPath, 'utf8');

const get = (k) => {
  const m = env.match(new RegExp('^' + k + '=(.*)$', 'm'));
  return m ? m[1].trim().replace(/^['"]|['"]$/g, '') : null;
};

const url = get('VITE_SUPABASE_URL');
const key = get('VITE_SUPABASE_ANON_KEY');

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in apps/frontend/.env.local');
  process.exit(1);
}

const https = require('https');

function probe(p, opts = {}) {
  return new Promise((resolve) => {
    const u = new URL(p, url);
    const req = https.request(
      {
        method: opts.method || 'GET',
        hostname: u.hostname,
        port: 443,
        path: u.pathname + u.search,
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Accept: 'application/json',
          ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
          ...(opts.headers || {}),
        },
      },
      (res) => {
        let buf = '';
        res.on('data', (d) => (buf += d));
        res.on('end', () =>
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: buf,
          })
        );
      }
    );
    req.on('error', (e) => resolve({ error: String(e) }));
    if (opts.body) req.write(JSON.stringify(opts.body));
    req.end();
  });
}

(async () => {
  console.log('Project URL:', url);
  console.log('');

  // 1. Public /auth/v1/settings — exposes which providers are enabled,
  //    whether email confirm is required, password min length, etc.
  console.log('=== /auth/v1/settings ===');
  const settings = await probe('/auth/v1/settings');
  console.log('HTTP', settings.status);
  if (settings.status === 200) {
    const j = JSON.parse(settings.body);
    console.log(JSON.stringify(j, null, 2));
  } else {
    console.log(settings.body.slice(0, 500));
  }
  console.log('');

  // 2. Public health probe
  console.log('=== /auth/v1/health (if available) ===');
  const health = await probe('/auth/v1/health');
  console.log('HTTP', health.status, health.body.slice(0, 200));
  console.log('');

  // 3. Attempting to land on /authorize with Google provider — this returns
  //    either a 302 redirect to Google consent screen (project has Google
  //    OAuth configured) or a 400/403 with error info (provider not enabled,
  //    callback URL mismatch, etc).
  const callbackHost = 'app.thenewfuse.com';
  const redirectTo = encodeURIComponent(
    `https://${callbackHost}/auth/callback`
  );
  console.log(
    `=== /auth/v1/authorize?provider=google (callback=${callbackHost}/auth/callback) ===`
  );
  const auth = await probe(
    `/auth/v1/authorize?provider=google&redirect_to=${redirectTo}`,
    { method: 'GET', headers: { 'x-forwarded-host': callbackHost } }
  );
  console.log('HTTP', auth.status);
  if (auth.headers.location) {
    console.log('Redirect ->', auth.headers.location.slice(0, 300));
  }
  console.log('Body (first 500):', auth.body.slice(0, 500));
  console.log('');

  // 4. Try the local-dev redirect target that the SPA uses
  const devRedirect = encodeURIComponent(
    `http://localhost:5173/auth/callback`
  );
  console.log(
    '=== /auth/v1/authorize?provider=google (callback=http://localhost:5173/auth/callback) ==='
  );
  const authDev = await probe(
    `/auth/v1/authorize?provider=google&redirect_to=${devRedirect}`,
    { method: 'GET' }
  );
  console.log('HTTP', authDev.status);
  if (authDev.headers.location) {
    console.log('Redirect ->', authDev.headers.location.slice(0, 300));
  }
  console.log('Body (first 500):', authDev.body.slice(0, 500));
})();
