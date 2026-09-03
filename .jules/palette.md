## 2025-05-18 - [Form Accessibility in Reusable Components]

**Learning:** In reusable form components like `PremiumInput` that accept a
combination of `label`, `error`, and `hint` props, the lack of an explicit `id`
prop passed by the consumer breaks accessibility, as labels and ARIA
descriptions cannot link to the input element. **Action:** Always utilize
`React.useId()` as a fallback for form inputs to automatically generate unique
IDs when one is not provided, ensuring `htmlFor`, `aria-invalid`, and
`aria-describedby` remain robust regardless of the consumer's implementation.

## 2025-05-19 - [Custom Button ARIA Props Configuration]

**Learning:** The custom `PremiumButton` component in this application is
specifically configured to consume the camelCase `ariaLabel` prop rather than
standard HTML `aria-label` attribute in order to render the proper accessible
name. Using the standard attribute breaks the accessibility naming in this
specific instance. **Action:** When adding accessible names to `PremiumButton`
components across the codebase, always use the `ariaLabel` prop instead of
`aria-label`.
