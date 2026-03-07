const https = require('https');

const targets = [
  'https://ai-arcade.xyz',
  'https://open-audio-deck-production.up.railway.app'
];

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    }).on('error', reject);
  });
}

function absolute(base, src) {
  if (src.startsWith('http')) return src;
  return new URL(src, base).toString();
}

(async () => {
  const patterns = [
    /sk-[A-Za-z0-9]{20,}/g,
    /api[_-]?key\s*[:=]\s*['"][^'"\n]{12,}/gi,
    /secret\s*[:=]\s*['"][^'"\n]{8,}/gi,
    /BEGIN\s+PRIVATE\s+KEY/g,
    /xox[baprs]-[A-Za-z0-9-]{10,}/g,
    /ghp_[A-Za-z0-9]{20,}/g
  ];

  for (const site of targets) {
    const home = await fetch(site);
    const scripts = [...home.body.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m => absolute(site, m[1]));
    console.log('\nSITE', site, 'scripts', scripts.length);
    for (const s of scripts) {
      const js = await fetch(s);
      const findings = [];
      for (const p of patterns) {
        const m = js.body.match(p);
        if (m && m.length) findings.push({ pattern: p.toString(), count: m.length });
      }
      if (findings.length) console.log('POTENTIAL', s, findings);
    }
  }
})();
