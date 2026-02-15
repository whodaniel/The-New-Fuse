## 2024-05-23 - Custom Component Wrappers and Accessibility

**Learning:** When using custom component wrappers (like `PremiumSelect` or `PremiumButton`), it's critical to verify their implementation details.
1. They may use different prop names for accessibility attributes (e.g., `ariaLabel` instead of `aria-label`).
2. They may inadvertently suppress or ignore standard React features like `children` if not explicitly handled, leading to broken UI or unexpected behavior when used in patterns different from the original intent (e.g., passing `<option>` as children instead of an `options` prop).

**Action:** Always inspect the source code of custom UI components before using them, especially for accessibility props and children rendering behavior. If a component is broken (e.g., ignores children), fix it to support standard React patterns.
