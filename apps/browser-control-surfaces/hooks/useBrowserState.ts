import { useCallback, useEffect, useState } from 'react';

interface BrowserState {
  currentUrl: string | null;
  targetElement: string | null;
  isControlling: boolean;
  controlState: 'idle' | 'connecting' | 'connected' | 'detached';
  currentPageInfo: {
    title?: string;
    url?: string;
    domain?: string;
  } | null;
}

export function useBrowserState() {
  const [state, setState] = useState<BrowserState>({
    currentUrl: null,
    targetElement: null,
    isControlling: false,
    controlState: 'idle',
    currentPageInfo: null,
  });

  const detectPlatform = useCallback(() => {
    const platforms = [
      { name: 'claude.ai', detect: () => window.location.hostname.includes('claude.ai') },
      {
        name: 'chatgpt.com',
        detect: () =>
          window.location.hostname.includes('chatgpt.com') ||
          window.location.hostname.includes('openai.com'),
      },
      {
        name: 'gemini.ai',
        detect: () =>
          window.location.hostname.includes('gemini.ai') ||
          window.location.hostname.includes('google.com'),
      },
      { name: 'perplexity.ai', detect: () => window.location.hostname.includes('perplexity.ai') },
      { name: 'qwen.ai', detect: () => window.location.hostname.includes('qwen.ai') },
      {
        name: 'kimi.com',
        detect: () =>
          window.location.hostname.includes('kimi.com') ||
          window.location.hostname.includes('moonshot.cn'),
      },
    ];

    for (const platform of platforms) {
      if (platform.detect()) {
        return platform.name;
      }
    }

    return 'generic';
  }, []);

  const getCurrentPageInfo = useCallback(() => {
    return {
      title: document.title,
      url: window.location.href,
      domain: window.location.hostname,
    };
  }, []);

  const startControl = useCallback(async () => {
    if (state.isControlling) return;

    setState((prev) => ({ ...prev, controlState: 'connecting', isControlling: true }));

    try {
      const platform = detectPlatform();
      const pageInfo = getCurrentPageInfo();

      setState((prev) => ({
        ...prev,
        controlState: 'connected',
        currentUrl: window.location.href,
        currentPageInfo: pageInfo,
        targetElement: document.querySelector('body')?.toString() || null,
      }));

      return { success: true, platform, pageInfo };
    } catch (error) {
      console.error('[BrowserState] Failed to start control:', error);
      setState((prev) => ({ ...prev, controlState: 'idle', isControlling: false }));
      return { success: false, error };
    }
  }, [state.isControlling, detectPlatform, getCurrentPageInfo]);

  const stopControl = useCallback(() => {
    if (!state.isControlling) return;

    setState((prev) => ({ ...prev, controlState: 'idle', isControlling: false }));
  }, [state.isControlling]);

  const executeAction = useCallback(
    async (action: any) => {
      if (!state.isControlling) {
        throw new Error('Browser control not active');
      }

      try {
        switch (action.type) {
          case 'navigate':
            if (action.url) {
              window.location.href = action.url;
            }
            break;
          case 'click':
            if (action.selector) {
              const element =
                action.selector === 'body'
                  ? document.body
                  : document.querySelector(action.selector);
              element?.click();
            }
            break;
          case 'type':
            if (action.text) {
              const textarea = document.querySelector(
                'textarea, input[type="text"]'
              ) as HTMLInputElement | null;
              if (textarea) {
                textarea.focus();
                textarea.value = action.text;
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
              }
            }
            break;
          case 'extract':
            return {
              type: 'text',
              content: document.body.innerText,
              html: document.body.innerHTML,
            };
          default:
            console.warn('[BrowserState] Unknown action type:', action.type);
        }

        return { success: true };
      } catch (error) {
        console.error('[BrowserState] Action execution failed:', error);
        return { success: false, error };
      }
    },
    [state.isControlling]
  );

  useEffect(() => {
    const handleUrlChange = () => {
      setState((prev) => ({
        ...prev,
        currentUrl: window.location.href,
        currentPageInfo: getCurrentPageInfo(),
      }));
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('load', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('load', handleUrlChange);
    };
  }, [getCurrentPageInfo]);

  return {
    ...state,
    detectPlatform,
    getCurrentPageInfo,
    startControl,
    stopControl,
    executeAction,
  };
}
