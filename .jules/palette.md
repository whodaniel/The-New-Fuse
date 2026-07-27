## 2024-07-27 - Icon Button Accessibility
**Learning:** The `Button` component with `size="icon"` in this design system (at `apps/frontend/src/components/ui/button.tsx`) does not enforce or automatically provide accessibility labels.
**Action:** Always manually add descriptive `aria-label` attributes to icon-only `<Button size="icon">` components to ensure they remain accessible to screen reader users, as was missed in the Header and ChatInterface components.
