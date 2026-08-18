/**
 * Custom Element Guard for Chrome Extension
 * Prevents the "A custom element with name ... has already been defined" error
 * by patching customElements.define to safely check existence first.
 *
 * Enhanced for Perplexity: handles sandboxed iframes where customElements may be null.
 */

// Entire guard is wrapped: only execute if customElements is available
if (typeof globalThis.customElements !== 'undefined' && globalThis.customElements !== null) {
  try {
    // GLOBAL ERROR LISTENER: Catch errors that bypass our patch (including scheduler module errors)
    window.addEventListener(
      'error',
      (event) => {
        if (
          event.message &&
          (event.message.includes('mce-autosize-textarea') ||
            event.message.includes('already been defined') ||
            event.message.includes('already been used') ||
            event.message.includes('Failed to resolve module specifier') ||
            event.message.includes('scheduler') ||
            // Catch null customElements access
            (event.message.includes('Cannot read properties of null') &&
              event.message.includes('customElements')))
        ) {
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }
      },
      true
    ); // Capture phase

    // Also catch unhandled promise rejections for module loading failures
    window.addEventListener(
      'unhandledrejection',
      (event) => {
        if (
          event.reason &&
          event.reason.message &&
          (event.reason.message.includes('Failed to resolve module specifier') ||
            event.reason.message.includes('scheduler') ||
            event.reason.message.includes('already been defined') ||
            (event.reason.message.includes('Cannot read properties of null') &&
              event.reason.message.includes('customElements')))
        ) {
          event.preventDefault();
          return;
        }
      },
      true
    );

    const originalDefine = globalThis.customElements.define;

    if (originalDefine) {
      // Only patch if not already patched (check for our marker)
      if (
        globalThis.customElements.define &&
        !(globalThis.customElements.define as any).__isSafeGuarded
      ) {
        globalThis.customElements.define = function (
          name: string,
          constructor: CustomElementConstructor,
          options?: ElementDefinitionOptions
        ) {
          // SWALLOW known problematic elements
          if (name === 'mce-autosize-textarea') {
            if (globalThis.customElements.get(name)) return;
          }

          if (globalThis.customElements.get(name)) {
            // Silently skip - already defined
            return;
          }

          try {
            originalDefine.call(this, name, constructor, options);
          } catch (e: any) {
            if (e.message && e.message.includes('already been defined')) {
              // Silently skip collision
              return;
            }
            throw e;
          }
        };
        // Mark as guarded
        (globalThis.customElements.define as any).__isSafeGuarded = true;

        // Lock the customElements object itself to prevent polyfills from replacing it
        try {
          const originalCustomElements = globalThis.customElements;
          Object.defineProperty(globalThis, 'customElements', {
            get() {
              return originalCustomElements;
            },
            set(v) {
              // Silently prevent overwriting
            },
            configurable: false,
          });
        } catch (e) {
          // Ignore if already non-configurable
        }
      }
    }
  } catch (e) {
    // Silently fail - guard is optional
  }
} // else: customElements not available (sandboxed iframe), skip guard entirely

export {};
