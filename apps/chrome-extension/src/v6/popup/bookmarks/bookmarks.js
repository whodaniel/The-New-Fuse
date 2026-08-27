/**
 * Fuse Bookmarks Manager — dedicated full-tab page for the AI Bookmark Organizer.
 * Structurally mirrors FuseConnectPopup (own state, own chrome.runtime.sendMessage/
 * onMessage wiring) but talks to the exact same BOOKMARKS_* messages the popup's
 * Bookmarks tab uses, so background/index.ts is the single source of truth for
 * both surfaces — nothing bookmark-related is duplicated in the background layer
 * per-surface.
 */

class BookmarksManagerPage {
  constructor() {
    this.state = {
      summary: null,
      settings: null,
      plan: null,
      analyzing: false,
      activeTagFilter: null,
      searchResults: [],
    };
    this.init();
  }

  init() {
    this.setupSubtabs();
    this.setupControls();
    this.setupMessageListener();
    this.refreshAll();
  }

  setupSubtabs() {
    const tabs = document.querySelectorAll('.subtab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.subtab-panel').forEach((p) => p.classList.remove('active'));
        document.getElementById(`panel-${tab.dataset.subtab}`)?.classList.add('active');
      });
    });
  }

  setupControls() {
    document.getElementById('mgr-analyze-btn')?.addEventListener('click', () => this.runAnalyze());
    document.getElementById('mgr-cancel-btn')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'BOOKMARKS_CANCEL_ANALYZE' });
    });
    document.getElementById('mgr-apply-btn')?.addEventListener('click', () => this.applyPlan());
    document.getElementById('mgr-undo-btn')?.addEventListener('click', () => this.undoLast());
    document.getElementById('mgr-search-btn')?.addEventListener('click', () => this.runSearch());
    document.getElementById('mgr-search-input')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.runSearch();
    });

    document.getElementById('mgr-granularity')?.addEventListener('change', (e) => {
      this.saveSetting({ granularity: e.target.value });
    });
    document.getElementById('mgr-zero-folder')?.addEventListener('change', (e) => {
      this.saveSetting({ zeroFolderMode: e.target.checked });
    });
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'BOOKMARKS_ANALYZE_PROGRESS') {
        this.updateProgress(message.data);
      }
    });
  }

  saveSetting(partial) {
    chrome.runtime.sendMessage(
      { type: 'BOOKMARKS_SET_SETTINGS', data: { settings: partial } },
      (response) => {
        if (response?.success) this.state.settings = response.data;
      }
    );
  }

  refreshAll() {
    chrome.runtime.sendMessage({ type: 'BOOKMARKS_GET_SUMMARY' }, (response) => {
      if (response?.success) {
        this.state.summary = response.data;
        this.renderSummary();
      }
    });
    chrome.runtime.sendMessage({ type: 'BOOKMARKS_GET_SETTINGS' }, (response) => {
      if (response?.success) {
        this.state.settings = response.data;
        const granularityEl = document.getElementById('mgr-granularity');
        const zeroFolderEl = document.getElementById('mgr-zero-folder');
        if (granularityEl) granularityEl.value = response.data.granularity || 'balanced';
        if (zeroFolderEl) zeroFolderEl.checked = !!response.data.zeroFolderMode;
      }
    });
    chrome.runtime.sendMessage({ type: 'BOOKMARKS_GET_PLAN' }, (response) => {
      if (response?.success && response.data) {
        this.state.plan = response.data;
        this.renderPlan();
      }
    });
  }

  renderSummary() {
    const s = this.state.summary;
    if (!s) return;
    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(value ?? '–');
    };
    set('stat-bookmarks', s.totalBookmarks);
    set('stat-folders', s.totalFolders);
    set('stat-duplicates', s.duplicateCount);
    set(
      'stat-lastrun',
      s.lastAnalyzedAt
        ? new Date(s.lastAnalyzedAt).toLocaleString([], { hour: '2-digit', minute: '2-digit' })
        : 'Never'
    );
  }

  runAnalyze() {
    if (this.state.analyzing) return;
    this.state.analyzing = true;

    const analyzeBtn = document.getElementById('mgr-analyze-btn');
    const cancelBtn = document.getElementById('mgr-cancel-btn');
    const progressBar = document.getElementById('mgr-progress-bar');
    if (analyzeBtn) {
      analyzeBtn.disabled = true;
      analyzeBtn.textContent = 'Analyzing…';
    }
    if (cancelBtn) cancelBtn.style.display = '';
    if (progressBar) progressBar.style.display = '';

    const granularity = document.getElementById('mgr-granularity')?.value;

    chrome.runtime.sendMessage({ type: 'BOOKMARKS_ANALYZE', data: { granularity } }, (response) => {
      this.state.analyzing = false;
      if (cancelBtn) cancelBtn.style.display = 'none';
      if (analyzeBtn) {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = '✨ Analyze';
      }

      if (response?.success) {
        this.state.plan = response.data;
        this.renderPlan();
        this.refreshAll();
      } else {
        alert(`Analyze failed: ${response?.error || 'no agent responded on the relay'}`);
      }
    });
  }

  updateProgress(data) {
    if (!data) return;
    const fill = document.getElementById('mgr-progress-fill');
    if (!fill) return;
    const pct = data.total > 0 ? Math.min(100, Math.round((data.cursor / data.total) * 100)) : 0;
    fill.style.width = `${pct}%`;
  }

  renderPlan() {
    const plan = this.state.plan;
    const applyBtn = document.getElementById('mgr-apply-btn');
    const movable = plan?.items?.filter((i) => i.proposedPath) || [];
    if (applyBtn) applyBtn.disabled = movable.length === 0;

    this.renderTree(plan);
    this.renderTagCloud(plan);
    this.renderDuplicates(plan);
  }

  renderTree(plan) {
    const container = document.getElementById('tree-container');
    if (!container) return;
    const movable = plan?.items?.filter((i) => i.proposedPath) || [];
    if (movable.length === 0) {
      container.innerHTML =
        '<div class="empty-note">Run Analyze to see a proposed folder tree.</div>';
      return;
    }

    const byPath = new Map();
    for (const item of movable) {
      const list = byPath.get(item.proposedPath) || [];
      list.push(item);
      byPath.set(item.proposedPath, list);
    }

    container.innerHTML = Array.from(byPath.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([path, items]) => {
        const rows = items
          .map(
            (item) => `
          <label class="plan-item">
            <input type="checkbox" data-bookmark-id="${item.bookmarkId}" ${item.selected !== false ? 'checked' : ''} />
            <span>
              <span class="item-title">${this.esc(item.title)}</span><br />
              <span class="item-path">${this.esc(item.currentPath || '(unfiled)')} → ${this.esc(path)}</span>
            </span>
          </label>
        `
          )
          .join('');
        return `<div class="folder-group"><h3>📁 ${this.esc(path)} (${items.length})</h3>${rows}</div>`;
      })
      .join('');

    container.querySelectorAll('input[type="checkbox"][data-bookmark-id]').forEach((cb) => {
      cb.addEventListener('change', (e) => {
        const id = e.target.dataset.bookmarkId;
        const item = this.state.plan.items.find((i) => i.bookmarkId === id);
        if (item) item.selected = e.target.checked;
      });
    });
  }

  renderTagCloud(plan) {
    const container = document.getElementById('tag-cloud-container');
    if (!container) return;
    const counts = new Map();
    for (const item of plan?.items || []) {
      for (const tag of item.tags || []) {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      }
    }
    if (counts.size === 0) {
      container.innerHTML = '<div class="empty-note">No tags yet — run Analyze first.</div>';
      return;
    }
    container.innerHTML = `<div class="tag-cloud">${Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(
        ([tag, count]) =>
          `<button class="tag-chip" data-tag="${this.esc(tag)}">${this.esc(tag)} (${count})</button>`
      )
      .join('')}</div>`;

    container.querySelectorAll('.tag-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const tag = chip.dataset.tag;
        this.state.activeTagFilter = this.state.activeTagFilter === tag ? null : tag;
        container
          .querySelectorAll('.tag-chip')
          .forEach((c) =>
            c.classList.toggle('active', c.dataset.tag === this.state.activeTagFilter)
          );
        this.renderTagFilteredResults(plan);
      });
    });
    this.renderTagFilteredResults(plan);
  }

  renderTagFilteredResults(plan) {
    const container = document.getElementById('tag-filtered-results');
    if (!container) return;
    if (!this.state.activeTagFilter) {
      container.innerHTML = '';
      return;
    }
    const matches = (plan?.items || []).filter((i) =>
      (i.tags || []).includes(this.state.activeTagFilter)
    );
    container.innerHTML = matches
      .map(
        (i) => `
      <div class="result-card">
        <a href="${i.url}" target="_blank" rel="noopener">${this.esc(i.title)}</a>
        ${i.summary ? `<div class="summary">${this.esc(i.summary)}</div>` : ''}
      </div>
    `
      )
      .join('');
  }

  renderDuplicates(plan) {
    const container = document.getElementById('duplicates-container');
    if (!container) return;
    const groups = plan?.duplicates || [];
    if (groups.length === 0) {
      container.innerHTML = '<div class="empty-note">No duplicates found yet.</div>';
      return;
    }
    container.innerHTML = groups
      .map(
        (g) => `
      <div class="dup-group">
        <div class="url">${this.esc(g.url)}</div>
        <div style="color: var(--text-muted)">${g.bookmarkIds.length} copies</div>
      </div>
    `
      )
      .join('');
  }

  applyPlan() {
    if (
      !confirm(
        'Apply the selected folder moves? Everything created lives under "AI Organized" and can be undone.'
      )
    )
      return;
    chrome.runtime.sendMessage(
      { type: 'BOOKMARKS_APPLY_PLAN', data: { plan: this.state.plan } },
      (response) => {
        if (response?.success) {
          alert(`Applied — ${response.data.moved} moved, ${response.data.skipped} skipped.`);
          const undoBtn = document.getElementById('mgr-undo-btn');
          if (undoBtn) undoBtn.disabled = false;
          const applyBtn = document.getElementById('mgr-apply-btn');
          if (applyBtn) applyBtn.disabled = true;
          this.refreshAll();
        } else {
          alert(`Apply failed: ${response?.error || 'unknown error'}`);
        }
      }
    );
  }

  undoLast() {
    chrome.runtime.sendMessage({ type: 'BOOKMARKS_UNDO_LAST' }, (response) => {
      if (response?.success) {
        alert(`Restored ${response.data.restored} bookmark(s).`);
        const undoBtn = document.getElementById('mgr-undo-btn');
        if (undoBtn) undoBtn.disabled = true;
        this.refreshAll();
      } else {
        alert('Nothing to undo.');
      }
    });
  }

  runSearch() {
    const query = document.getElementById('mgr-search-input')?.value?.trim();
    if (!query) return;
    chrome.runtime.sendMessage({ type: 'BOOKMARKS_SEARCH', data: { query } }, (response) => {
      const container = document.getElementById('search-results-container');
      if (!container) return;
      if (!response?.success || !response.data?.length) {
        container.innerHTML = '<div class="empty-note">No matches</div>';
        return;
      }
      container.innerHTML = response.data
        .map(
          (r) => `
        <div class="result-card">
          <a href="${r.bookmark.url}" target="_blank" rel="noopener">${this.esc(r.bookmark.title)}</a>
          ${r.summary ? `<div class="summary">${this.esc(r.summary)}</div>` : ''}
          ${(r.tags || []).map((t) => `<span class="tag-chip" style="cursor: default; padding: 2px 8px; font-size: 11px">${this.esc(t)}</span>`).join(' ')}
        </div>
      `
        )
        .join('');
    });
  }

  esc(text) {
    const div = document.createElement('div');
    div.textContent = text == null ? '' : String(text);
    return div.innerHTML;
  }
}

function bootManager() {
  if (window.__fuseBookmarksManagerBooted) return;
  window.__fuseBookmarksManagerBooted = true;
  new BookmarksManagerPage();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootManager, { once: true });
} else {
  bootManager();
}
