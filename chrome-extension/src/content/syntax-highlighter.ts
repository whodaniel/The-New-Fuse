import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
// Also include dark theme
import 'highlight.js/styles/github-dark.css';

/**
 * Apply syntax highlighting to code blocks
 * @param element - Code block element to highlight
 * @returns Whether highlighting was successful
 */
export function applySyntaxHighlighting(element: HTMLElement): boolean {
  try {
    // Skip if already highlighted
    if (element.classList.contains('hljs')) {
      return false;
    }

    // Get the code content
    const code = element.textContent || '';
    
    // Try to detect language if not specified
    const language = element.className.match(/language-(\w+)/)?.[1];
    
    // Apply highlighting
    let result;
    if (language) {
      result = hljs.highlight(code, { language, ignoreIllegals: true });
    } else {
      result = hljs.highlightAuto(code);
    }

    // Update element with highlighted code
    element.innerHTML = result.value;
    element.classList.add('hljs');

    // Add detected language class if not already present
    if (result.language && !element.classList.contains(`language-${result.language}`)) {
      element.classList.add(`language-${result.language}`);
    }

    return true;
  } catch (error) {
    console.error('Error applying syntax highlighting:', error);
    return false;
  }
}

/**
 * Add dark mode support for syntax highlighting
 */
export function setupDarkModeSupport(): void {
  // Watch for dark mode changes
  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  function updateTheme(e: MediaQueryListEvent | MediaQueryList) {
    const themeLink = document.querySelector('link[data-highlight-theme]');
    if (!themeLink) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.setAttribute('data-highlight-theme', 'true');
      link.href = e.matches ? 
        chrome.runtime.getURL('github-dark.css') :
        chrome.runtime.getURL('github.css');
      document.head.appendChild(link);
    } else {
      (themeLink as HTMLLinkElement).href = e.matches ?
        chrome.runtime.getURL('github-dark.css') :
        chrome.runtime.getURL('github.css');
    }
  }

  // Initial setup
  updateTheme(darkModeQuery);
  
  // Listen for changes
  darkModeQuery.addListener(updateTheme);
}