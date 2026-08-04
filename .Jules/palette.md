## 2024-08-04 - Ensure ARIA Labels for UI Button Component

**Learning:** The UI `Button` component in this codebase (`@/components/ui`) does not automatically enforce or generate `aria-label` attributes for icon-only usage.
**Action:** When using the `Button` component with only an icon (e.g., `lucide-react` icons) inside, always manually add an `aria-label` attribute to the `Button` element to ensure accessibility for screen readers.