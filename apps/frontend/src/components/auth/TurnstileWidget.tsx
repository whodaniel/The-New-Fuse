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
    if (!siteKey) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let verifyTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let retryId: ReturnType<typeof setTimeout> | null = null;
    let tokenReceived = false;

    const finishWithBypass = (reason: string, force = false) => {
      if (cancelled || (tokenReceived && !force)) return;
      console.warn(`[TurnstileWidget] ${reason} - allowing bypass`);
      const existing = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
      if (existing) existing.dataset.status = 'error';
      setLoadError(true);
      setIsLoading(false);
      tokenReceived = true;
      onTokenChange('bypass');
    };

    const onWindowError = (event: ErrorEvent) => {
      const msg = (event.message || '').toLowerCase();
      if (
        msg.includes('turnstile') ||
        msg.includes('challenges.cloudflare.com') ||
        msg.includes('postmessage') ||
        msg.includes('no available adapters')
      ) {
        finishWithBypass('Turnstile runtime origin/adapter error', true);
      }
    };
    window.addEventListener('error', onWindowError);

    const renderWidget = () => {
      if (cancelled || tokenReceived || !window.turnstile) return;

      // Turnstile will not reliably mount into display:none / zero-size nodes.
      // Retry briefly until the visible container is attached.
      if (!containerRef.current) {
        retryId = setTimeout(renderWidget, 50);
        return;
      }

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          theme,
          callback: (token: string) => {
            tokenReceived = true;
            setIsLoading(false);
            onTokenChange(token);
          },
          'expired-callback': () => onTokenChange(null),
          'error-callback': () => {
            console.warn('[TurnstileWidget] Cloudflare Turnstile error-callback fired');
            finishWithBypass('Turnstile verification error', true);
          },
        });
        setIsLoading(false);

        // Verification timeout: If no token received within 4 seconds after render, bypass
        verifyTimeoutId = setTimeout(() => {
          if (cancelled || tokenReceived) return;
          finishWithBypass('Turnstile token receipt timeout', true);
        }, 4000);
      } catch (err) {
        console.error('[TurnstileWidget] Failed to render widget:', err);
        finishWithBypass('Failed to render widget', true);
      }
    };

    const handleScriptError = () => {
      if (cancelled) return;
      console.error('[TurnstileWidget] Failed to load Cloudflare Turnstile script');
      finishWithBypass('Failed to load Cloudflare Turnstile script', true);
    };

    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;

    if (window.turnstile) {
      renderWidget();
    } else if (existingScript) {
      if (existingScript.dataset.status === 'error') {
        handleScriptError();
      } else if (existingScript.dataset.status === 'loaded' && window.turnstile) {
        renderWidget();
      } else {
        existingScript.addEventListener('load', renderWidget, { once: true });
        existingScript.addEventListener('error', handleScriptError, { once: true });
        // Script may have finished before listeners attached.
        if (window.turnstile) renderWidget();
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

    // Always clear the spinner — even if window.turnstile exists but never rendered.
    timeoutId = setTimeout(() => {
      if (cancelled || tokenReceived) return;
      finishWithBypass('Turnstile load timeout', true);
    }, 5000);

    return () => {
      cancelled = true;
      window.removeEventListener('error', onWindowError);
      if (timeoutId) clearTimeout(timeoutId);
      if (verifyTimeoutId) clearTimeout(verifyTimeoutId);
      if (retryId) clearTimeout(retryId);
      if (window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
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

  // Keep the Turnstile host visible while loading. Hiding it with display:none
  // prevents Cloudflare from mounting the challenge iframe.
  return (
    <div className="relative min-h-[65px]">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md border border-slate-700 bg-slate-800">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          <span className="ml-2 text-sm text-slate-400">Loading verification...</span>
        </div>
      )}
      <div ref={containerRef} className="flex justify-center" />
    </div>
  );
}
