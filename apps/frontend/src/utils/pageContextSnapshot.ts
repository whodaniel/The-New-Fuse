/**
 * Capture visible page content for AI Assist context.
 * Excludes the AI Assist dialog itself and noisy chrome.
 */

const SKIP_SELECTORS = [
  '[role="dialog"]',
  '[aria-modal="true"]',
  'script',
  'style',
  'noscript',
  'svg',
  'nav[aria-label="Main"]',
  '.sr-only',
];

const MAX_CHARS = 12_000;

function isVisible(el: HTMLElement): boolean {
  if (el.hidden || el.getAttribute('aria-hidden') === 'true') return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function shouldSkip(el: Element): boolean {
  return SKIP_SELECTORS.some((sel) => el.matches?.(sel) || el.closest?.(sel));
}

export interface PageContentSnapshot {
  title: string;
  path: string;
  headings: string[];
  text: string;
  charCount: number;
  capturedAt: string;
}

/**
 * Snapshot the main app surface (prefer #root / main) as plain text + headings.
 */
export function capturePageContentSnapshot(options?: {
  maxChars?: number;
  root?: ParentNode | null;
}): PageContentSnapshot {
  const maxChars = options?.maxChars ?? MAX_CHARS;
  const root =
    (options?.root as HTMLElement | null) ||
    (document.querySelector('main') as HTMLElement | null) ||
    (document.getElementById('root') as HTMLElement | null) ||
    document.body;

  const headings: string[] = [];
  const chunks: string[] = [];

  if (root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          if (shouldSkip(el) || !isVisible(el)) return NodeFilter.FILTER_REJECT;
          const tag = el.tagName.toLowerCase();
          if (/^h[1-3]$/.test(tag)) {
            const t = (el.innerText || '').trim();
            if (t) headings.push(t.slice(0, 200));
          }
          return NodeFilter.FILTER_SKIP;
        }
        // TEXT
        const parent = node.parentElement;
        if (!parent || shouldSkip(parent) || !isVisible(parent)) return NodeFilter.FILTER_REJECT;
        const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
        if (!text || text.length < 2) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let node: Node | null = walker.nextNode();
    let total = 0;
    while (node && total < maxChars) {
      const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
      if (text) {
        chunks.push(text);
        total += text.length + 1;
      }
      node = walker.nextNode();
    }
  }

  // Dedupe adjacent identical chunks
  const deduped: string[] = [];
  for (const chunk of chunks) {
    if (deduped[deduped.length - 1] === chunk) continue;
    deduped.push(chunk);
  }

  let text = deduped.join('\n');
  if (text.length > maxChars) {
    text = `${text.slice(0, maxChars)}\n…[truncated]`;
  }

  return {
    title: document.title || '',
    path: typeof window !== 'undefined' ? window.location.pathname : '',
    headings: headings.slice(0, 20),
    text,
    charCount: text.length,
    capturedAt: new Date().toISOString(),
  };
}
