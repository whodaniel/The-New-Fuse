## 2024-03-24 - Initialization
**Learning:** Initializing Palette journal.
**Action:** Keep records of only critical UI/UX learnings.

## 2024-03-24 - Form Control Pattern Standardization
**Learning:** Found that basic standard inputs like `Textarea` lacked built-in accessibility (auto-generated IDs linking `label`, `aria-describedby`, and `aria-invalid`) compared to the `Input` component. This indicates a pattern where complex components implicitly rely on the underlying basic elements to handle their own accessibility, leading to failures if the base component is not self-contained.
**Action:** Always ensure that fundamental form components (Inputs, Textareas, Selects) abstract their labeling and ARIA state management internally using `React.useId()` and explicit associations to prevent downstream accessibility gaps.

## 2024-03-24 - Icon Button Accessibility
**Learning:** `IconButton` components, particularly in high-traffic interactive areas like `ChatRoom`, frequently lack `aria-label` definitions, making them inaccessible to screen reader users. The abstract nature of an `icon` prop obscures the component's intent if an explicit label is not enforced or required.
**Action:** When implementing or modifying `IconButton` components that do not have visible text, always check for and explicitly pass an `aria-label` attribute describing the button's action.
