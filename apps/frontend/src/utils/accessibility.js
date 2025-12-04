export function handleKeyboardSubmit(event, callback) {
    var isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    var submitModifier = isMac ? event.metaKey : event.ctrlKey;
    if (event.key === 'Enter' && !event.shiftKey && submitModifier) {
        event.preventDefault();
        callback();
    }
}
export function handleEscapeKey(event, callback) {
    if (event.key === 'Escape') {
        event.preventDefault();
        callback();
    }
}
export function createFocusTrap(containerElement, options) {
    if (options === void 0) { options = {}; }
    var focusableElements = containerElement.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    var firstFocusable = focusableElements[0];
    var lastFocusable = focusableElements[focusableElements.length - 1];
    if (options.initialFocus) {
        var initialElement = containerElement.querySelector(options.initialFocus);
        if (initialElement) {
            initialElement.focus();
        }
    }
    else {
        firstFocusable === null || firstFocusable === void 0 ? void 0 : firstFocusable.focus();
    }
    function handleKeyDown(event) {
        if (event.key === 'Escape' && options.onEscape) {
            options.onEscape();
            return;
        }
        if (event.key !== 'Tab')
            return;
        if (event.shiftKey) {
            if (document.activeElement === firstFocusable) {
                event.preventDefault();
                lastFocusable === null || lastFocusable === void 0 ? void 0 : lastFocusable.focus();
            }
        }
        else {
            if (document.activeElement === lastFocusable) {
                event.preventDefault();
                firstFocusable === null || firstFocusable === void 0 ? void 0 : firstFocusable.focus();
            }
        }
    }
    containerElement.addEventListener('keydown', handleKeyDown);
    return function () {
        containerElement.removeEventListener('keydown', handleKeyDown);
    };
}
export function setAriaLabel(element, label) {
    element.setAttribute('aria-label', label);
}
export function setAriaExpanded(element, expanded) {
    element.setAttribute('aria-expanded', String(expanded));
}
export function setAriaHidden(element, hidden) {
    element.setAttribute('aria-hidden', String(hidden));
}
export function setAriaSelected(element, selected) {
    element.setAttribute('aria-selected', String(selected));
}
export function announceToScreenReader(message) {
    var announcement = document.createElement('div');
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
    setTimeout(function () {
        document.body.removeChild(announcement);
    }, 1000);
}
export function setupA11yTestId(component, element) {
    if (process.env.NODE_ENV !== 'production') {
        element.setAttribute('data-testid', "".concat(component, "-a11y"));
    }
}
