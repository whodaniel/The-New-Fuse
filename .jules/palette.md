
## 2025-05-18 - [Form Accessibility in Reusable Components]
**Learning:** In reusable form components like `PremiumInput` that accept a combination of `label`, `error`, and `hint` props, the lack of an explicit `id` prop passed by the consumer breaks accessibility, as labels and ARIA descriptions cannot link to the input element.
**Action:** Always utilize `React.useId()` as a fallback for form inputs to automatically generate unique IDs when one is not provided, ensuring `htmlFor`, `aria-invalid`, and `aria-describedby` remain robust regardless of the consumer's implementation.

## 2025-05-19 - [Icon-only Actions in Admin Tables]
**Learning:** Icon-only action buttons in dense administrative tables (like Agent Management) are frequently missed by screen readers and keyboard users if they lack `aria-label` attributes and visible focus rings. Providing contextual `aria-labels` (e.g., `Delete agent [Name]`) improves clarity for assistive technology.
**Action:** Always provide explicit `aria-label` attributes for icon-only buttons detailing the action and the specific item it affects. Additionally, ensure they have `focus-visible:ring-2` styles to make them keyboard accessible.
## 2025-05-18 - [Add ARIA Labels to MemoryVisualizer Actions]
**Learning:** Found that custom small icon button components without text sometimes slip through standard accessibility checks if they aren't properly configured to require an ARIA label from the start.
**Action:** When creating local, non-reusable icon buttons inside complex visualizations, ensure they always mandate an `ariaLabel` prop.
