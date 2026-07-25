import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          action?: string;
          theme?: 'light' | 'dark' | 'auto';
        }
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

type TurnstileWidgetProps = {
  siteKey: string;
  onTokenChange: (token: string | null) => void;
  action?: string;
  theme?: 'light' | 'dark' | 'auto';
};

const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script';
const TURNSTILE_SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const TURNSTILE_LOAD_TIMEOUT_MS = 10000;

export default function TurnstileWidget({
  siteKey,
  onTokenChange,
  action = 'auth',
  theme = 'dark',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const renderWidget = () => {
      if (cancelled || !window.turnstile || !containerRef.current) return;

      try {
        setIsLoading(false);
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          theme,
          callback: (token: string) => onTokenChange(token),
          'expired-callback': () => onTokenChange(null),
          'error-callback': () => onTokenChange(null),
        });
      } catch (err) {
        console.error('[TurnstileWidget] Failed to render widget:', err);
        handleScriptError();
      }
    };

    const handleScriptError = () => {
      if (cancelled) return;
      console.error('[TurnstileWidget] Failed to load Cloudflare Turnstile script');
      setLoadError(true);
      setIsLoading(false);
      onTokenChange(' bypass');
    };

    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;

    if (window.turnstile) {
      renderWidget();
    } else {
      if (existingScript) {
        if (existingScript.dataset.status === 'error') {
          handleScriptError();
        } else {
          existingScript.addEventListener('load', renderWidget, { once: true });
          existingScript.addEventListener('error', handleScriptError, { once: true });
        }
      } else {
        const script = document.createElement('script');
        script.id = TURNSTILE_SCRIPT_ID;
        script.src = TURNSTILE_SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        script.dataset.status = 'loading';
        script.addEventListener(
          'load',
          () => {
            script.dataset.status = 'loaded';
            renderWidget();
          },
          { once: true }
        );
        script.addEventListener(
          'error',
          () => {
            script.dataset.status = 'error';
            handleScriptError();
          },
          { once: true }
        );
        document.head.appendChild(script);
      }

      timeoutId = setTimeout(() => {
        if (cancelled || window.turnstile) return;
        console.warn('[TurnstileWidget] Turnstile load timeout - allowing bypass');
        if (existingScript) existingScript.dataset.status = 'error';
        setLoadError(true);
        setIsLoading(false);
        onTokenChange(' bypass');
      }, TURNSTILE_LOAD_TIMEOUT_MS);
    }

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // ignore removal errors
        }
      }
      widgetIdRef.current = null;
    };
  }, [action, onTokenChange, siteKey, theme]);

  if (loadError) {
    return (
      <div className="rounded-md border border-yellow-600 bg-yellow-900/20 p-3 text-sm text-yellow-200">
        Verification temporarily unavailable. You may continue.
      </div>
    );
  }

  // Container must ALWAYS render so the useEffect can attach the ref
  // on first mount and load the Turnstile script. Showing the spinner
  // conditionally via a sibling/overlay avoids the containerRef-vs-isLoading
  // deadlock where ref.current is null when the effect runs.
  return (
    <div className="relative">
      {isLoading && (
        <div className="flex items-center justify-center rounded-md border border-slate-700 bg-slate-800 p-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          <span className="ml-2 text-sm text-slate-400">Loading verification...</span>
        </div>
      )}
      <div ref={containerRef} style={{ display: isLoading ? 'none' : 'block' }} />
    </div>
  );
}
