/**
 * Custom Element Guard for Chrome Extension
 * Prevents the "A custom element with name ... has already been defined" error
 * by patching customElements.define to safely check existence first.
 */

try {
  const originalDefine = customElements.define;

  // Only patch if not already patched (check for our marker)
  if (!(customElements.define as any).__isSafeGuarded) {
    customElements.define = function (
      name: string,
      constructor: CustomElementConstructor,
      options?: ElementDefinitionOptions
    ) {
      if (customElements.get(name)) {
        // If in development, log a warning, otherwise fail silently to prevent crash
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `[FuseConnect Guard] Custom element '${name}' is already defined. Skipping definition.`
          );
        }
        return;
      }

      try {
        originalDefine.call(this, name, constructor, options);
      } catch (e: any) {
        if (e.message && e.message.includes('already been defined')) {
          console.warn(`[FuseConnect Guard] Collision caught for '${name}'.`);
          return;
        }
        throw e;
      }
    };

    // Mark as guarded
    (customElements.define as any).__isSafeGuarded = true;
    console.log('[FuseConnect] Custom Element Guard activated');
  }
} catch (e) {
  console.error('[FuseConnect] Failed to activate Custom Element Guard', e);
}

export {};
