/**
 * MAIN-world console hook.
 *
 * Content scripts run in an "isolated world" — a separate JS environment
 * that shares the DOM with the page but NOT its JS objects. Wrapping
 * `console.log` from the isolated world (as ConsoleCapture.ts originally
 * did) only ever sees the content script's own internal logging, never the
 * real page's console activity — confirmed by testing: calling
 * `console.log(...)` from the page returned nothing from GET_CONSOLE_LOGS,
 * only the content script's own startup warning came back.
 *
 * This file is declared in manifest.json's content_scripts with
 * `"world": "MAIN"`, so it runs injected directly into the page's own JS
 * context and wraps the REAL `console` object. It has no access to
 * `chrome.*` APIs (MAIN world scripts don't) — it can only reach the
 * isolated-world content script via a DOM CustomEvent, the same
 * cross-world bridge mechanism the page-world test bridge
 * (fuse-connect:request/response) already proves works.
 * ConsoleCapture.ts listens for 'fuse-connect:console-entry' and buffers
 * whatever arrives here.
 */

(function installMainWorldConsoleHook() {
  if ((window as any).__fuseConsoleHookInstalled) return;
  (window as any).__fuseConsoleHookInstalled = true;

  const LEVELS: Array<'log' | 'info' | 'warn' | 'error' | 'debug'> = [
    'log',
    'info',
    'warn',
    'error',
    'debug',
  ];

  const stringifyArg = (arg: unknown): string => {
    if (typeof arg === 'string') return arg;
    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  };

  LEVELS.forEach((level) => {
    const original = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      try {
        document.dispatchEvent(
          new CustomEvent('fuse-connect:console-entry', {
            detail: { level, args: args.map(stringifyArg), timestamp: Date.now() },
          })
        );
      } catch {
        // Never let capture failures break the page's own console.
      }
      original(...args);
    };
  });

  window.addEventListener('error', (event) => {
    document.dispatchEvent(
      new CustomEvent('fuse-connect:console-entry', {
        detail: {
          level: 'error',
          args: [`Uncaught ${event.message}`, `at ${event.filename}:${event.lineno}`],
          timestamp: Date.now(),
        },
      })
    );
  });
  window.addEventListener('unhandledrejection', (event) => {
    document.dispatchEvent(
      new CustomEvent('fuse-connect:console-entry', {
        detail: {
          level: 'error',
          args: [`Unhandled promise rejection: ${String(event.reason)}`],
          timestamp: Date.now(),
        },
      })
    );
  });
})();
