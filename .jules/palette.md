
## 2025-05-18 - [Form Accessibility in Reusable Components]
**Learning:** In reusable form components like `PremiumInput` that accept a combination of `label`, `error`, and `hint` props, the lack of an explicit `id` prop passed by the consumer breaks accessibility, as labels and ARIA descriptions cannot link to the input element.
**Action:** Always utilize `React.useId()` as a fallback for form inputs to automatically generate unique IDs when one is not provided, ensuring `htmlFor`, `aria-invalid`, and `aria-describedby` remain robust regardless of the consumer's implementation.

## 2025-05-18 - [Missing Accessibility on Custom Raw HTML Elements]
**Learning:** When bypassing the core design system components and writing raw custom HTML elements like `<button>` and `<input type="checkbox">` (as seen in `DataTable.tsx`), these elements are prone to missing accessibility attributes (like `aria-label`) and focus states for keyboard users (`focus-visible` ring styling). Additionally, wrapper elements like `<Tooltip>` need explicitly bound `onFocus` and `onBlur` listeners to support keyboard navigation.
**Action:** Always verify that raw HTML buttons and inputs explicitly contain `aria-label` attributes (especially when icon-only) and incorporate `focus-visible` styles to match the accessibility defaults provided by the core components.
