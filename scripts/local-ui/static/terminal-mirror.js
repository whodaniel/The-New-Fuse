/* Spatial terminal mirror — replicates the local terminal window arrangement
 * from the unauthenticated bridge snapshot at /bridge-api/terminal-mirror. */
(() => {
  const { esc } = window.TNFPanel;
  const canvas = document.getElementById('mirror-canvas');
  const meta = document.getElementById('mirror-meta');
  if (!canvas) return;

  const POLL_MS = 5000;

  function ageLabel(iso) {
    if (!iso) return 'unknown age';
    const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
    if (seconds < 90) return `${seconds}s ago`;
    const mins = Math.round(seconds / 60);
    if (mins < 90) return `${mins}m ago`;
    return `${Math.round(mins / 60)}h ago`;
  }

  function renderOffline(reason, generatedAt) {
    canvas.className = 'mirror-canvas offline';
    canvas.innerHTML = `<div class="mirror-empty">${esc(reason)}${
      generatedAt ? ` — last seen ${esc(ageLabel(generatedAt))}` : ''
    }</div>`;
    if (meta) meta.textContent = '';
  }

  function render(data) {
    if (!data || data.available === false) {
      renderOffline(data?.reason || 'Local mirror offline', data?.generatedAt);
      return;
    }
    const windows = (data.windows || []).filter((w) => w.bounds);
    let displays = data.displays || [];
    if (!displays.length) {
      // Synthesize a display from window extents so we can still render.
      if (!windows.length) {
        renderOffline('No terminal windows with bounds', data.generatedAt);
        return;
      }
      const maxX = Math.max(...windows.map((w) => w.bounds.x + w.bounds.width));
      const maxY = Math.max(...windows.map((w) => w.bounds.y + w.bounds.height));
      displays = [{ id: 0, x: 0, y: 0, width: maxX, height: maxY }];
    }

    const minX = Math.min(...displays.map((d) => d.x));
    const minY = Math.min(...displays.map((d) => d.y));
    const maxX = Math.max(...displays.map((d) => d.x + d.width));
    const maxY = Math.max(...displays.map((d) => d.y + d.height));
    const worldW = Math.max(1, maxX - minX);
    const worldH = Math.max(1, maxY - minY);

    const cW = canvas.clientWidth || 800;
    const cH = Math.max(180, Math.round(cW * (worldH / worldW)));
    canvas.style.height = `${Math.min(cH, 420)}px`;
    const scale = Math.min(cW / worldW, (canvas.clientHeight || cH) / worldH);

    canvas.className = `mirror-canvas${data.stale ? ' stale' : ''}`;
    const parts = [];

    for (const d of displays) {
      parts.push(
        `<div class="mirror-display" style="left:${(d.x - minX) * scale}px;top:${(d.y - minY) * scale}px;width:${d.width * scale}px;height:${d.height * scale}px;"></div>`
      );
    }

    const sorted = [...windows].sort((a, b) => (b.zOrder ?? 0) - (a.zOrder ?? 0));
    sorted.forEach((w) => {
      const b = w.bounds;
      const z = Number.isFinite(w.zOrder) ? 1000 - w.zOrder : 1;
      const label = w.title || w.tty || `window ${w.windowId}`;
      parts.push(`
        <div class="mirror-window${w.busy ? ' busy' : ''}${w.agentId ? ' agent' : ''}"
             style="left:${(b.x - minX) * scale}px;top:${(b.y - minY) * scale}px;width:${Math.max(24, b.width * scale)}px;height:${Math.max(18, b.height * scale)}px;z-index:${z};"
             title="${esc(label)}${w.tty ? ` · ${esc(w.tty)}` : ''}${w.agentId ? ` · ${esc(w.agentId)}` : ''}">
          ${w.busy ? '<span class="busy-dot"></span>' : ''}
          <span class="mirror-window-title">${esc(label)}</span>
          ${w.agentId ? `<span class="mirror-agent-badge">${esc(w.agentId)}</span>` : ''}
        </div>`);
    });

    canvas.innerHTML = parts.join('');
    if (meta) {
      const busy = windows.filter((w) => w.busy).length;
      meta.textContent = `${windows.length} windows · ${busy} busy · ${ageLabel(data.generatedAt)}${data.stale ? ' · STALE' : ''}`;
    }
  }

  async function refresh() {
    try {
      const res = await fetch('/bridge-api/terminal-mirror', {
        headers: { accept: 'application/json' },
      });
      render(await res.json());
    } catch {
      renderOffline('Bridge unreachable');
    }
  }

  refresh();
  setInterval(refresh, POLL_MS);
})();
