/* Shared helpers for the browser-control panel: token storage, authed fetch, escaping. */
(() => {
  const TOKEN_KEY = 'tnf_panel_token';

  function getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || '';
    } catch {
      return '';
    }
  }

  function setToken(value) {
    try {
      if (value) localStorage.setItem(TOKEN_KEY, value);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {}
    document.dispatchEvent(new CustomEvent('tnf-token-changed'));
  }

  function authHeaders(extra = {}) {
    const headers = { accept: 'application/json', ...extra };
    const token = getToken();
    if (token) headers.authorization = `Bearer ${token}`;
    return headers;
  }

  function authFetch(url, options = {}) {
    return fetch(url, { ...options, headers: authHeaders(options.headers || {}) });
  }

  function esc(value) {
    const div = document.createElement('div');
    div.textContent = String(value ?? '');
    return div.innerHTML;
  }

  function promptForToken() {
    const current = getToken();
    const value = window.prompt(
      'Paste a TNF API bearer token (stored locally in this browser only):',
      current
    );
    if (value === null) return;
    setToken(value.trim());
  }

  window.TNFPanel = { getToken, setToken, authHeaders, authFetch, esc, promptForToken };
})();
