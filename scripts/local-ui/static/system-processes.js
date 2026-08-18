/* Admin-only system processes card — hidden unless the stored token grants
 * access to /api/admin/metrics/chronological-processes. */
(() => {
  const { authFetch, getToken } = window.TNFPanel;
  const card = document.getElementById('processes-card');
  const list = document.getElementById('process-list');
  if (!card || !list) return;

  async function runNow(processId, button) {
    button.disabled = true;
    try {
      const res = await authFetch(
        `/api/admin/metrics/chronological-processes/${encodeURIComponent(processId)}/run`,
        { method: 'POST' }
      );
      button.textContent = res.ok ? 'Ran ✓' : `Failed (${res.status})`;
    } catch {
      button.textContent = 'Failed';
    }
    setTimeout(() => {
      button.textContent = 'Run now';
      button.disabled = false;
    }, 4000);
  }

  function renderProcesses(processes) {
    list.innerHTML = '';
    for (const proc of processes) {
      const li = document.createElement('li');
      li.className = 'gate-row';
      const label = document.createElement('span');
      const cadence = proc.cadence || proc.schedule || '';
      label.textContent = `${proc.name || proc.id}${cadence ? ` · ${cadence}` : ''}${
        proc.enabled === false ? ' · disabled' : ''
      }`;
      li.appendChild(label);
      const canRun = proc.controls ? proc.controls.canRunNow !== false : true;
      if (canRun) {
        const button = document.createElement('button');
        button.className = 'ghost small';
        button.textContent = 'Run now';
        button.addEventListener('click', () => runNow(proc.id || proc.processId, button));
        li.appendChild(button);
      }
      list.appendChild(li);
    }
  }

  async function refresh() {
    if (!getToken()) {
      card.hidden = true;
      return;
    }
    try {
      const res = await authFetch('/api/admin/metrics/chronological-processes');
      if (!res.ok) {
        card.hidden = true;
        return;
      }
      const data = await res.json();
      const processes = Array.isArray(data) ? data : data.processes || data.items || [];
      if (!processes.length) {
        card.hidden = true;
        return;
      }
      card.hidden = false;
      renderProcesses(processes);
    } catch {
      card.hidden = true;
    }
  }

  document.addEventListener('tnf-token-changed', refresh);
  refresh();
  setInterval(refresh, 60000);
})();
