const apiBase = 'https://mcp-drs-api-production.up.railway.app';

const qEl = document.getElementById('q');
const surfaceEl = document.getElementById('surface');
const kindEl = document.getElementById('kind');
const pubEl = document.getElementById('pub');
const gridEl = document.getElementById('grid');
const statsEl = document.getElementById('stats');
const statusEl = document.getElementById('status');
const refreshEl = document.getElementById('refresh');

const experienceFormEl = document.getElementById('submit-experience-form');
const primitiveFormEl = document.getElementById('submit-primitive-form');
const experienceStatusEl = document.getElementById('submit-experience-status');
const primitiveStatusEl = document.getElementById('submit-primitive-status');

const primitiveKinds = new Set(['workflow', 'mcp_server', 'skill', 'prompt', 'agent_template', 'agent', 'model']);

async function loadCatalog() {
  statusEl.textContent = 'Loading...';
  const params = new URLSearchParams();
  params.set('limit', '200');
  if (qEl.value.trim()) params.set('q', qEl.value.trim());
  if (kindEl.value) params.set('kind', kindEl.value);
  if (pubEl.value) params.set('status', pubEl.value);

  const res = await fetch(`${apiBase}/marketplace/catalog?${params.toString()}`);
  if (!res.ok) throw new Error(`Catalog request failed: ${res.status}`);

  const data = await res.json();
  const allItems = Array.isArray(data.items) ? data.items : [];
  const surface = surfaceEl.value;

  const items = allItems.filter((item) => {
    if (surface === 'arcade') return item.kind === 'experience';
    if (surface === 'marketplace') return primitiveKinds.has(String(item.kind));
    return true;
  });

  render(items);
  statusEl.textContent = `${items.length} item(s) shown`;
}

function render(items) {
  const counts = {};
  for (const item of items) {
    const k = String(item.kind || 'unknown');
    counts[k] = (counts[k] || 0) + 1;
  }

  statsEl.innerHTML = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `<div class="stat"><small>${escapeHtml(k)}</small><b>${v}</b></div>`)
    .join('');

  gridEl.innerHTML = items
    .map((item) => {
      const tags = (item.tags || []).slice(0, 6).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('');
      const caps = (item.capabilities || []).slice(0, 3).map((c) => `<span class="cap">${escapeHtml(c)}</span>`).join('');
      const launch = item.launchUrl ? `<a class="launch" href="${escapeHtml(item.launchUrl)}" target="_blank" rel="noreferrer">Launch</a>` : '';

      return `
        <article class="card ${item.kind === 'experience' ? 'card-experience' : 'card-primitive'}">
          <div class="kind">${escapeHtml(item.kind || 'unknown')}</div>
          <h3>${escapeHtml(item.name || 'Untitled')}</h3>
          <p class="desc">${escapeHtml(item.description || '')}</p>
          <div class="tags">${tags}</div>
          <div class="caps">${caps}</div>
          <div class="meta">
            <span>${escapeHtml(item.category || '')}</span>
            <span>${escapeHtml(item.publicationStatus || '')}</span>
            ${launch}
          </div>
        </article>
      `;
    })
    .join('');
}

async function submitExperience(event) {
  event.preventDefault();
  experienceStatusEl.textContent = 'Submitting...';

  const fd = new FormData(experienceFormEl);
  const payload = {
    name: String(fd.get('name') || '').trim(),
    description: String(fd.get('description') || '').trim(),
    category: String(fd.get('category') || '').trim(),
    launchUrl: String(fd.get('launchUrl') || '').trim() || undefined,
    tags: csv(fd.get('tags')),
  };

  try {
    const res = await fetch(`${apiBase}/marketplace/experiences/submit`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.text();
    if (!res.ok) throw new Error(body || `submit failed (${res.status})`);

    experienceStatusEl.textContent = 'Submitted to review queue.';
    experienceFormEl.reset();
    await loadCatalog();
  } catch (err) {
    experienceStatusEl.textContent = `Error: ${String(err.message || err)}`;
  }
}

async function submitPrimitive(event) {
  event.preventDefault();
  primitiveStatusEl.textContent = 'Submitting...';

  const fd = new FormData(primitiveFormEl);
  const payload = {
    kind: String(fd.get('kind') || '').trim(),
    name: String(fd.get('name') || '').trim(),
    description: String(fd.get('description') || '').trim(),
    category: String(fd.get('category') || '').trim(),
    launchUrl: String(fd.get('launchUrl') || '').trim() || undefined,
    tags: csv(fd.get('tags')),
    capabilities: csv(fd.get('capabilities')),
  };

  try {
    const res = await fetch(`${apiBase}/marketplace/catalog/submit`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.text();
    if (!res.ok) throw new Error(body || `submit failed (${res.status})`);

    primitiveStatusEl.textContent = 'Submitted to review queue.';
    primitiveFormEl.reset();
    await loadCatalog();
  } catch (err) {
    primitiveStatusEl.textContent = `Error: ${String(err.message || err)}`;
  }
}

function csv(raw) {
  return String(raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function showError(err) {
  statusEl.textContent = `Error: ${String(err.message || err)}`;
}

refreshEl.addEventListener('click', () => loadCatalog().catch(showError));
qEl.addEventListener('input', debounce(() => loadCatalog().catch(showError), 250));
kindEl.addEventListener('change', () => loadCatalog().catch(showError));
surfaceEl.addEventListener('change', () => loadCatalog().catch(showError));
pubEl.addEventListener('change', () => loadCatalog().catch(showError));
experienceFormEl.addEventListener('submit', submitExperience);
primitiveFormEl.addEventListener('submit', submitPrimitive);

loadCatalog().catch(showError);
