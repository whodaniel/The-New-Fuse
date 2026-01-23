/**
 * Custom Element Guard for Chrome Extension
 * Prevents the "A custom element with name ... has already been defined" error
 * by patching customElements.define to safely check existence first.
 */

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
          event.message.includes('scheduler'))
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
          event.reason.message.includes('already been defined'))
      ) {
        event.preventDefault();
        return;
      }
    },
    true
  );

  const originalDefine =
    typeof customElements !== 'undefined' && customElements ? customElements.define : undefined;

  if (originalDefine) {
    // Only patch if not already patched (check for our marker)
    if (
      typeof customElements !== 'undefined' &&
      customElements &&
      customElements.define &&
      !(customElements.define as any).__isSafeGuarded
    ) {
      customElements.define = function (
        name: string,
        constructor: CustomElementConstructor,
        options?: ElementDefinitionOptions
      ) {
        // SWALLOW known problematic elements
        if (name === 'mce-autosize-textarea') {
          if (customElements.get(name)) return;
        }

        if (customElements.get(name)) {
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
      (customElements.define as any).__isSafeGuarded = true;

      // Lock the customElements object itself to prevent polyfills from replacing it
      try {
        const originalCustomElements = window.customElements;
        Object.defineProperty(window, 'customElements', {
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

export {};
