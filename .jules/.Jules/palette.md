## 2025-04-13 - Real-time Status Component Accessibility
**Learning:** Dynamic real-time status components (like typing indicators and connection states) often lack proper accessibility attributes to announce state transitions to screen readers. Relying solely on visual changes leaves visually impaired users unaware of updates.
**Action:** For dynamic real-time status components, always include `role="status"` and `aria-live="polite"` to ensure screen readers narrate connection state transitions. Decorative animations and redundant visual elements should be hidden via `aria-hidden="true"`.
