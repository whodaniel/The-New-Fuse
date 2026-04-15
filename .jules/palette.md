
## 2025-04-12 - Accessibility improvement for dynamic state component
**Learning:** For dynamic real-time status components (like `TypingIndicator`), always include `role="status"` and `aria-live="polite"`. Use `aria-hidden="true"` to hide decorative animations and add a screen-reader-only text node (`<span className="sr-only"></span>`) so screen readers accurately announce the state transition.
**Action:** Always verify decorative animations and real-time status updates properly incorporate semantic `aria` roles or screen-reader-only elements to communicate state effectively.
