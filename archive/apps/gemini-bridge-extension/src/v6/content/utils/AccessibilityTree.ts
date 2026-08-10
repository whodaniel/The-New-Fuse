/**
 * Fuse Connect v7 - Accessibility Tree Generator
 * Generates a structured tree of interactive elements on any page
 * Inspired by Claude extension's accessibility-tree.js
 */

interface ElementRef {
  ref: WeakRef<HTMLElement>;
  role: string;
  label: string;
}

interface AccessibilityNode {
  role: string;
  label: string;
  refId: string;
  depth: number;
  attributes: Record<string, string>;
}

interface AccessibilityTreeResult {
  tree: string;
  nodes: AccessibilityNode[];
  viewport: { width: number; height: number };
  error?: string;
}

// Role mapping based on HTML elements
const ROLE_MAP: Record<string, string> = {
  a: 'link',
  button: 'button',
  input: 'textbox',
  select: 'combobox',
  textarea: 'textbox',
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  h5: 'heading',
  h6: 'heading',
  img: 'image',
  nav: 'navigation',
  main: 'main',
  header: 'banner',
  footer: 'contentinfo',
  section: 'region',
  article: 'article',
  aside: 'complementary',
  form: 'form',
  table: 'table',
  ul: 'list',
  ol: 'list',
  li: 'listitem',
  label: 'label',
};

// Elements to skip
const SKIP_ELEMENTS = ['script', 'style', 'meta', 'link', 'title', 'noscript'];

// Interactive elements
const INTERACTIVE_ELEMENTS = ['a', 'button', 'input', 'select', 'textarea', 'details', 'summary'];

// Landmark elements
const LANDMARK_ELEMENTS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'nav',
  'main',
  'header',
  'footer',
  'section',
  'article',
  'aside',
];

export class AccessibilityTreeGenerator {
  private elementMap: Map<string, ElementRef> = new Map();
  private refCounter = 0;

  constructor() {
    // Initialize global map for cross-session persistence
    if (!window.__fuseElementMap) {
      window.__fuseElementMap = new Map();
    }
    if (!window.__fuseRefCounter) {
      window.__fuseRefCounter = 0;
    }
    this.elementMap = window.__fuseElementMap;
    this.refCounter = window.__fuseRefCounter;
  }

  /**
   * Generate accessibility tree
   */
  generateTree(
    options: {
      filter?: 'all' | 'interactive' | 'landmarks';
      maxDepth?: number;
      refId?: string;
    } = {}
  ): AccessibilityTreeResult {
    const { filter = 'all', maxDepth = 15, refId } = options;
    const lines: string[] = [];
    const nodes: AccessibilityNode[] = [];

    try {
      // If refId provided, start from that element
      if (refId) {
        const ref = this.elementMap.get(refId);
        if (!ref) {
          return {
            tree: '',
            nodes: [],
            viewport: this.getViewport(),
            error: `Element with ref_id '${refId}' not found. It may have been removed from the page.`,
          };
        }
        const element = ref.ref.deref();
        if (!element) {
          this.elementMap.delete(refId);
          return {
            tree: '',
            nodes: [],
            viewport: this.getViewport(),
            error: `Element with ref_id '${refId}' no longer exists in the DOM.`,
          };
        }
        this.processElement(element, 0, maxDepth, filter, refId !== undefined, lines, nodes);
      } else {
        // Start from body
        if (document.body) {
          this.processElement(document.body, 0, maxDepth, filter, false, lines, nodes);
        }
      }

      // Cleanup stale refs
      this.cleanupRefs();

      // Update global counter
      window.__fuseRefCounter = this.refCounter;

      const tree = lines.join('\n');

      // Check size limit
      if (tree.length > 50000) {
        return {
          tree: '',
          nodes: [],
          viewport: this.getViewport(),
          error: `Output exceeds 50000 character limit (${tree.length} characters). Try using a smaller depth or focusing on a specific element.`,
        };
      }

      return { tree, nodes, viewport: this.getViewport() };
    } catch (error) {
      return {
        tree: '',
        nodes: [],
        viewport: this.getViewport(),
        error: `Error generating accessibility tree: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Process a single element
   */
  private processElement(
    element: HTMLElement,
    depth: number,
    maxDepth: number,
    filter: 'all' | 'interactive' | 'landmarks',
    hasRefId: boolean,
    lines: string[],
    nodes: AccessibilityNode[]
  ): void {
    if (depth > maxDepth) return;
    if (!element || !element.tagName) return;

    const tagName = element.tagName.toLowerCase();
    if (SKIP_ELEMENTS.includes(tagName)) return;

    const shouldInclude = this.shouldIncludeElement(element, filter, hasRefId);

    if (shouldInclude) {
      const role = this.getRole(element);
      const label = this.getLabel(element);
      const refId = this.getOrCreateRefId(element);

      // Build tree line
      let line = '  '.repeat(depth) + role;
      if (label) {
        const cleanLabel = label.replace(/\s+/g, ' ').substring(0, 100).replace(/"/g, '\\"');
        line += ` "${cleanLabel}"`;
      }
      line += ` [${refId}]`;

      // Add important attributes
      const attrs = this.getImportantAttributes(element);
      for (const [key, value] of Object.entries(attrs)) {
        line += ` ${key}="${value}"`;
      }

      lines.push(line);
      nodes.push({
        role,
        label,
        refId,
        depth,
        attributes: attrs,
      });
    }

    // Process children
    if (element.children && depth < maxDepth) {
      for (let i = 0; i < element.children.length; i++) {
        const child = element.children[i] as HTMLElement;
        this.processElement(
          child,
          shouldInclude ? depth + 1 : depth,
          maxDepth,
          filter,
          hasRefId,
          lines,
          nodes
        );
      }
    }
  }

  /**
   * Determine if element should be included
   */
  private shouldIncludeElement(
    element: HTMLElement,
    filter: 'all' | 'interactive' | 'landmarks',
    hasRefId: boolean
  ): boolean {
    const tagName = element.tagName.toLowerCase();

    // Skip hidden elements unless we have a specific refId
    if (filter !== 'all' && !hasRefId) {
      if (element.getAttribute('aria-hidden') === 'true') return false;
      if (!this.isVisible(element)) return false;
      if (!this.isInViewport(element)) return false;
    }

    // Interactive filter
    if (filter === 'interactive') {
      return this.isInteractive(element);
    }

    // Include interactive elements
    if (this.isInteractive(element)) return true;

    // Include landmarks
    if (this.isLandmark(element)) return true;

    // Include elements with labels
    if (this.getLabel(element).length > 0) return true;

    // Include elements with explicit roles
    const role = this.getRole(element);
    return role !== 'generic' && role !== 'image';
  }

  /**
   * Get element role
   */
  private getRole(element: HTMLElement): string {
    // Check for explicit role
    const ariaRole = element.getAttribute('role');
    if (ariaRole) return ariaRole;

    const tagName = element.tagName.toLowerCase();
    const type = element.getAttribute('type');

    // Special handling for input types
    if (tagName === 'input') {
      if (type === 'submit' || type === 'button') return 'button';
      if (type === 'checkbox') return 'checkbox';
      if (type === 'radio') return 'radio';
      if (type === 'file') return 'button';
      return 'textbox';
    }

    return ROLE_MAP[tagName] || 'generic';
  }

  /**
   * Get element label
   */
  private getLabel(element: HTMLElement): string {
    const tagName = element.tagName.toLowerCase();

    // Select elements - use selected option
    if (tagName === 'select') {
      const select = element as HTMLSelectElement;
      const option =
        select.querySelector('option[selected]') || select.options[select.selectedIndex];
      if (option?.textContent?.trim()) return option.textContent.trim();
    }

    // Aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel?.trim()) return ariaLabel.trim();

    // Placeholder
    const placeholder = element.getAttribute('placeholder');
    if (placeholder?.trim()) return placeholder.trim();

    // Title
    const title = element.getAttribute('title');
    if (title?.trim()) return title.trim();

    // Alt (for images)
    const alt = element.getAttribute('alt');
    if (alt?.trim()) return alt.trim();

    // Associated label
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label?.textContent?.trim()) return label.textContent.trim();
    }

    // Input value
    if (tagName === 'input') {
      const input = element as HTMLInputElement;
      const type = element.getAttribute('type') || '';
      const value = element.getAttribute('value');
      if (type === 'submit' && value?.trim()) return value.trim();
      if (input.value && input.value.length < 50 && input.value.trim()) return input.value.trim();
    }

    // Text content for buttons/links
    if (['button', 'a', 'summary'].includes(tagName)) {
      let text = '';
      for (let i = 0; i < element.childNodes.length; i++) {
        const node = element.childNodes[i];
        if (node.nodeType === Node.TEXT_NODE) {
          text += node.textContent || '';
        }
      }
      if (text.trim()) return text.trim();
    }

    // Headings - full text content
    if (tagName.match(/^h[1-6]$/)) {
      const text = element.textContent;
      if (text?.trim()) return text.trim().substring(0, 100);
    }

    // Direct text nodes
    let directText = '';
    for (let i = 0; i < element.childNodes.length; i++) {
      const node = element.childNodes[i];
      if (node.nodeType === Node.TEXT_NODE) {
        directText += node.textContent || '';
      }
    }
    if (directText.trim() && directText.trim().length >= 3) {
      const text = directText.trim();
      return text.length > 100 ? text.substring(0, 100) + '...' : text;
    }

    return '';
  }

  /**
   * Get or create a reference ID for an element
   */
  private getOrCreateRefId(element: HTMLElement): string {
    // Check if already mapped
    for (const [id, ref] of this.elementMap.entries()) {
      if (ref.ref.deref() === element) {
        return id;
      }
    }

    // Create new ref
    const refId = `gemini_bridge_ref_${++this.refCounter}`;
    this.elementMap.set(refId, {
      ref: new WeakRef(element),
      role: this.getRole(element),
      label: this.getLabel(element),
    });

    return refId;
  }

  /**
   * Get element by ref ID
   */
  getElementByRefId(refId: string): HTMLElement | null {
    const ref = this.elementMap.get(refId);
    if (!ref) return null;
    const element = ref.ref.deref();
    if (!element) {
      this.elementMap.delete(refId);
      return null;
    }
    return element;
  }

  /**
   * Get important attributes for an element
   */
  private getImportantAttributes(element: HTMLElement): Record<string, string> {
    const attrs: Record<string, string> = {};

    // Href for links
    const href = element.getAttribute('href');
    if (href) attrs.href = href;

    // Type for inputs
    const type = element.getAttribute('type');
    if (type) attrs.type = type;

    // Placeholder
    const placeholder = element.getAttribute('placeholder');
    if (placeholder) attrs.placeholder = placeholder;

    // Disabled state
    if (element.hasAttribute('disabled')) attrs.disabled = 'true';

    // Checked state
    if ((element as HTMLInputElement).checked) attrs.checked = 'true';

    return attrs;
  }

  /**
   * Check if element is visible
   */
  private isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    if (style.display === 'none') return false;
    if (style.visibility === 'hidden') return false;
    if (style.opacity === '0') return false;
    return element.offsetWidth > 0 && element.offsetHeight > 0;
  }

  /**
   * Check if element is in viewport
   */
  private isInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top < window.innerHeight &&
      rect.bottom > 0 &&
      rect.left < window.innerWidth &&
      rect.right > 0
    );
  }

  /**
   * Check if element is interactive
   */
  private isInteractive(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    if (INTERACTIVE_ELEMENTS.includes(tagName)) return true;
    if (element.getAttribute('onclick')) return true;
    if (element.getAttribute('tabindex') !== null) return true;
    if (element.getAttribute('role') === 'button') return true;
    if (element.getAttribute('role') === 'link') return true;
    if (element.getAttribute('contenteditable') === 'true') return true;
    return false;
  }

  /**
   * Check if element is a landmark
   */
  private isLandmark(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    return LANDMARK_ELEMENTS.includes(tagName) || element.getAttribute('role') !== null;
  }

  /**
   * Get viewport dimensions
   */
  private getViewport(): { width: number; height: number } {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  /**
   * Cleanup stale references
   */
  private cleanupRefs(): void {
    for (const [id, ref] of this.elementMap.entries()) {
      if (!ref.ref.deref()) {
        this.elementMap.delete(id);
      }
    }
  }

  /**
   * Click an element by ref ID
   */
  async clickElement(refId: string): Promise<boolean> {
    const element = this.getElementByRefId(refId);
    if (!element) return false;

    try {
      element.focus();
      element.click();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Type into an element by ref ID
   */
  async typeIntoElement(
    refId: string,
    text: string,
    options: { clear?: boolean } = {}
  ): Promise<boolean> {
    const element = this.getElementByRefId(refId);
    if (!element) return false;

    try {
      element.focus();

      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        if (options.clear) {
          element.value = '';
        }
        element.value += text;
        element.dispatchEvent(new InputEvent('input', { bubbles: true, data: text }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (element.getAttribute('contenteditable') === 'true') {
        if (options.clear) {
          element.innerHTML = '';
        }
        element.textContent = (element.textContent || '') + text;
        element.dispatchEvent(new InputEvent('input', { bubbles: true }));
      }

      return true;
    } catch {
      return false;
    }
  }
}

// Type declarations for global state
declare global {
  interface Window {
    __fuseElementMap: Map<string, ElementRef>;
    __fuseRefCounter: number;
  }
}

// Export singleton
export const accessibilityTree = new AccessibilityTreeGenerator();
