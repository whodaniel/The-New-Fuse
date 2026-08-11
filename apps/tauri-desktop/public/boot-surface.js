// Surface boot failures when the module graph never mounts React (Tauri asset CORS, etc.).
window.addEventListener('error', function (event) {
  var el = document.getElementById('boot-error');
  var spin = document.getElementById('boot-spinner');
  if (!el) return;
  el.style.display = 'block';
  el.textContent =
    'Desktop UI failed to start: ' +
    (event.message || 'unknown error') +
    (event.filename ? ' (' + event.filename + ')' : '');
  if (spin) spin.style.display = 'none';
});
window.addEventListener('unhandledrejection', function (event) {
  var el = document.getElementById('boot-error');
  var spin = document.getElementById('boot-spinner');
  if (!el) return;
  var reason = event.reason;
  var message =
    reason && reason.message
      ? reason.message
      : typeof reason === 'string'
        ? reason
        : 'Unhandled promise rejection';
  el.style.display = 'block';
  el.textContent = 'Desktop UI failed to start: ' + message;
  if (spin) spin.style.display = 'none';
});
setTimeout(function () {
  var root = document.getElementById('root');
  var el = document.getElementById('boot-error');
  var spin = document.getElementById('boot-spinner');
  if (!root || !el) return;
  // Splash still present → React never mounted.
  if (root.querySelector('.loading') && !root.querySelector('.app-container')) {
    el.style.display = 'block';
    el.textContent =
      'Desktop UI is stuck on splash. Module assets likely failed to load under Tauri — rebuild with the crossorigin strip fix.';
    if (spin) spin.style.display = 'none';
  }
}, 8000);
