export interface KeyboardEvent {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  preventDefault: () => void;
}

export function handleKeyboardSubmit(event: KeyboardEvent, callback: (): any => void): void {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const submitModifier = isMac ? event.metaKey : event.ctrlKey;

  if (event.key === 'Enter' && !event.shiftKey && submitModifier) {
    event.preventDefault();
    callback();
  }
}

export function handleEscapeKey(event: KeyboardEvent, callback: (): any => void): void {
  if (event.key === 'Escape') {
    event.preventDefault();
    callback();
  }
}

interface FocusTrapOptions {
  onEscape?: () => void;
  initialFocus?: string;
}

export function createFocusTrap(
  containerElement: HTMLElement,
  options: FocusTrapOptions = {}
): () => void {
  const focusableElements = containerElement.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstFocusable = focusableElements[0] as HTMLElement;
  const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

  if (options.initialFocus) {
    const initialElement = containerElement.querySelector(options.initialFocus) as HTMLElement;
    if (initialElement) {
      initialElement.focus();
    }
  } else {
    firstFocusable?.focus();
  }

  function handleKeyDown(event: KeyboardEvent): any {
    if (event.key === 'Escape' && options.onEscape) {
      options.onEscape();
      return;
    }

    if (event.key !== 'Tab') return;

    if (event.shiftKey) {
      if (document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable?.focus();
      }
    }
  }

  containerElement.addEventListener('keydown', handleKeyDown as any);
  return () => {
    containerElement.removeEventListener('keydown', handleKeyDown as any);
  };
}

export function setAriaLabel(element: HTMLElement, label: string): void {
  element.setAttribute('aria-label', label);
}

export function setAriaExpanded(element: HTMLElement, expanded: boolean): void {
  element.setAttribute('aria-expanded', String(expanded));
}

export function setAriaHidden(element: HTMLElement, hidden: boolean): void {
  element.setAttribute('aria-hidden', String(hidden));
}

export function setAriaSelected(element: HTMLElement, selected: boolean): void {
  element.setAttribute('aria-selected', String(selected));
}

export function announceToScreenReader(message: string): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'alert');
  announcement.setAttribute('aria-live', 'polite');
  announcement.style.position = 'absolute';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.padding = '0';
  announcement.style.margin = '-1px';
  announcement.style.overflow = 'hidden';
  announcement.style.clip = 'rect(0, 0, 0, 0)';
  announcement.style.whiteSpace = 'nowrap';
  announcement.style.border = '0';
  
  announcement.textContent = message;
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

export function setupA11yTestId(component: string, element: HTMLElement): void {
  if (process.env.NODE_ENV !== 'production') {
    element.setAttribute('data-testid', `${component}-a11y`);
  }
}