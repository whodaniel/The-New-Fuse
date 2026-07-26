/* Mission strip — goals, next cron fires, terminal counts, and service health,
 * via the same-origin proxies in serve-browser-control.cjs. */
(() => {
  const { esc, authFetch, getToken, setToken, promptForToken } = window.TNFPanel;

  const goalsEl = document.getElementById('mission-goals-body');
  const cronEl = document.getElementById('mission-cron-body');
  const terminalsEl = document.getElementById('mission-terminals-body');
  const servicesEl = document.getElementById('mission-services-body');
  const drilldown = document.getElementById('mission-drilldown');
  const drilldownTitle = document.getElementById('drilldown-title');
  const drilldownBody = document.getElementById('drilldown-body');
  const tokenBtn = document.getElementById('token-btn');
  const tokenClearBtn = document.getElementById('token-clear-btn');
  if (!goalsEl || !cronEl || !terminalsEl) return;

  function relative(iso) {
    if (!iso) return '';
    const delta = new Date(iso).getTime() - Date.now();
    if (Number.isNaN(delta)) return '';
    if (delta <= 30000) return 'due now';
    const mins = Math.round(delta / 60000);
    if (mins < 60) return `in ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `in ${hours}h ${mins % 60}m`;
    return `in ${Math.floor(hours / 24)}d`;
  }

  function offline(reason, needsToken) {
    const msg = needsToken
      ? `<span class="mission-muted">${esc(reason)}</span><button class="ghost small" id="strip-token-btn">Set token</button>`
      : `<span class="mission-muted">${esc(reason)}</span>`;
    goalsEl.innerHTML = msg;
    cronEl.innerHTML = `<span class="mission-muted">${esc(reason)}</span>`;
    terminalsEl.innerHTML = `<span class="mission-muted">${esc(reason)}</span>`;
    const btn = document.getElementById('strip-token-btn');
    if (btn) btn.addEventListener('click', promptForToken);
  }

  function renderGoals(goals) {
    if (!goals || goals.available === false) {
      goalsEl.innerHTML = `<span class="mission-muted">${esc(goals?.reason || 'unavailable')}</span>`;
      return;
    }
    const list = goals.goals || [];
    const active = list.filter((g) => g.status === 'active');
    const top = list.find((g) => g.id === goals.activeGoalId) || active[0] || list[0];
    goalsEl.innerHTML = `
      <div class="mission-stat">${list.length} <small>total</small> · ${active.length} <small>active</small></div>
      ${top ? `<div class="mission-line">${esc(top.title)} <em>${Math.round(top.progress || 0)}%</em></div>` : ''}
    `;
  }

  function renderCron(cron) {
    if (!cron || cron.available === false) {
      cronEl.innerHTML = `<span class="mission-muted">${esc(cron?.reason || 'unavailable')}</span>`;
      return;
    }
    const jobs = [...(cron.jobs || [])]
      .filter((j) => j.nextRunAt)
      .sort((a, b) => new Date(a.nextRunAt) - new Date(b.nextRunAt))
      .slice(0, 3);
    if (jobs.length === 0) {
      cronEl.innerHTML = '<span class="mission-muted">No scheduled jobs</span>';
      return;
    }
    cronEl.innerHTML = jobs
      .map(
        (j) =>
          `<div class="mission-line">${esc(j.label)} <em>${esc(relative(j.nextRunAt))}</em></div>`
      )
      .join('');
  }

  function renderTerminals(mirror) {
    if (!mirror || mirror.available === false) {
      terminalsEl.innerHTML = `<span class="mission-muted">${esc(mirror?.reason || 'unavailable')}</span>`;
      return;
    }
    terminalsEl.innerHTML = `
      <div class="mission-stat">${mirror.windowCount ?? 0} <small>windows</small> · ${mirror.busyCount ?? 0} <small>busy</small></div>
      ${mirror.stale ? '<span class="mission-muted">stale snapshot</span>' : ''}
    `;
  }

  function servicePill(name, probe) {
    const up = Boolean(probe && probe.up);
    const detail = up ? `${probe.latencyMs}ms` : probe?.error || 'down';
    return `<div class="mission-line">${esc(name)} <em class="${up ? 'svc-up' : 'svc-down'}">${up ? 'UP' : 'DOWN'} · ${esc(detail)}</em></div>`;
  }

  async function refreshServices() {
    if (!servicesEl) return;
    try {
      const res = await fetch('/panel/health', { headers: { accept: 'application/json' } });
      const data = await res.json();
      servicesEl.innerHTML =
        servicePill('Relay :3000', data.relay) +
        servicePill('Bridge :3005', data.bridge) +
        servicePill('API :3001', data.api);
    } catch {
      servicesEl.innerHTML = '<span class="mission-muted">panel server offline</span>';
    }
  }

  async function refresh() {
    try {
      const res = await authFetch('/api/local-runtime/summary');
      if (res.status === 401 || res.status === 403) {
        offline('Sign-in required', true);
        return;
      }
      const data = await res.json();
      if (data && data.available === false) {
        offline(data.reason || 'Local API offline');
        return;
      }
      renderGoals(data.goals);
      renderCron(data.cron);
      renderTerminals(data.terminalMirror);
    } catch {
      offline('Local API offline');
    }
  }

  function closeDrilldown() {
    drilldown.hidden = true;
    drilldownBody.innerHTML = '';
  }

  async function openGoalsDrilldown(event) {
    event.preventDefault();
    drilldownTitle.textContent = 'All Goals';
    drilldownBody.innerHTML = '<span class="mission-muted">Loading…</span>';
    drilldown.hidden = false;
    try {
      const res = await authFetch('/api/local-runtime/goals');
      const data = await res.json();
      if (res.status === 401 || res.status === 403) {
        drilldownBody.innerHTML =
          '<span class="mission-muted">Sign-in required — set an API token.</span>';
        return;
      }
      if (!data || data.available === false || !(data.goals || []).length) {
        drilldownBody.innerHTML = `<span class="mission-muted">${esc(data?.reason || 'No goals')}</span>`;
        return;
      }
      drilldownBody.innerHTML = data.goals
        .map((g) => {
          const pct = Math.max(0, Math.min(100, Math.round(g.progress || 0)));
          return `
            <div class="drill-row">
              <div class="drill-main">
                <strong>${esc(g.title)}</strong>
                <span class="meta">${esc(g.status || '')}${g.priority ? ` · ${esc(g.priority)}` : ''}</span>
              </div>
              <div class="progress"><div class="progress-fill" style="width:${pct}%"></div></div>
              <em>${pct}%</em>
            </div>`;
        })
        .join('');
    } catch {
      drilldownBody.innerHTML = '<span class="mission-muted">Local API offline</span>';
    }
  }

  async function openCronDrilldown(event) {
    event.preventDefault();
    drilldownTitle.textContent = 'All Cron Jobs';
    drilldownBody.innerHTML = '<span class="mission-muted">Loading…</span>';
    drilldown.hidden = false;
    try {
      const res = await authFetch('/api/local-runtime/cron');
      const data = await res.json();
      if (res.status === 401 || res.status === 403) {
        drilldownBody.innerHTML =
          '<span class="mission-muted">Sign-in required — set an API token.</span>';
        return;
      }
      if (!data || data.available === false || !(data.jobs || []).length) {
        drilldownBody.innerHTML = `<span class="mission-muted">${esc(data?.reason || 'No cron jobs')}</span>`;
        return;
      }
      const jobs = [...data.jobs].sort(
        (a, b) =>
          new Date(a.nextRunAt || 8640000000000000) - new Date(b.nextRunAt || 8640000000000000)
      );
      drilldownBody.innerHTML = jobs
        .map(
          (j) => `
            <div class="drill-row">
              <div class="drill-main">
                <strong>${esc(j.label)}</strong>
                <span class="meta">${esc(j.scheduleHuman || j.schedule || '')}${j.enabled === false ? ' · disabled' : ''}</span>
              </div>
              <em>${esc(j.nextRunAt ? relative(j.nextRunAt) : '—')}</em>
            </div>`
        )
        .join('');
    } catch {
      drilldownBody.innerHTML = '<span class="mission-muted">Local API offline</span>';
    }
  }

  function syncTokenButtons() {
    const has = Boolean(getToken());
    if (tokenBtn) tokenBtn.textContent = has ? 'Update API token' : 'Set API token';
    if (tokenClearBtn) tokenClearBtn.hidden = !has;
  }

  if (tokenBtn) tokenBtn.addEventListener('click', promptForToken);
  if (tokenClearBtn) tokenClearBtn.addEventListener('click', () => setToken(''));
  document.addEventListener('tnf-token-changed', () => {
    syncTokenButtons();
    refresh();
  });
  document.getElementById('goals-expand')?.addEventListener('click', openGoalsDrilldown);
  document.getElementById('cron-expand')?.addEventListener('click', openCronDrilldown);
  document.getElementById('drilldown-close')?.addEventListener('click', closeDrilldown);

  syncTokenButtons();
  refresh();
  refreshServices();
  setInterval(refresh, 15000);
  setInterval(refreshServices, 15000);
})();
