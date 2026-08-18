
## 2025-05-18 - [Form Accessibility in Reusable Components]
**Learning:** In reusable form components like `PremiumInput` that accept a combination of `label`, `error`, and `hint` props, the lack of an explicit `id` prop passed by the consumer breaks accessibility, as labels and ARIA descriptions cannot link to the input element.
**Action:** Always utilize `React.useId()` as a fallback for form inputs to automatically generate unique IDs when one is not provided, ensuring `htmlFor`, `aria-invalid`, and `aria-describedby` remain robust regardless of the consumer's implementation.
