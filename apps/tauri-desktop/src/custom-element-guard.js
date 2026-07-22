/**
 * Custom Element Guard: Prevents crashes from duplicate definitions.
 * Moved from inline script in index.html to comply with CSP (no unsafe-inline).
 */
(function() {
  try {
    const originalDefine = customElements.define;
    customElements.define = function(name, constructor, options) {
      if (customElements.get(name)) {
        console.warn(`[TNF] Custom element '${name}' is already defined. Ignoring duplicate.`);
        return;
      }
      try {
        originalDefine.call(this, name, constructor, options);
      } catch (e) {
        if (e.message.includes('already been defined')) {
          console.warn(`[TNF] Custom element '${name}' collision caught.`);
          return;
        }
        throw e;
      }
    };
  } catch(e) {
    console.error('[TNF] Failed to activate Custom Element Guard', e);
  }
})();
