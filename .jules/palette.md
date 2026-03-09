## 2024-05-18 - Missing ARIA Labels on Icon-only Action Buttons

**Learning:** Found an accessibility issue pattern in the `ActiveWorkspaces`
component where icon-only action buttons (like the one containing the
`UploadSimple` icon) lacked descriptive labels, making them inaccessible to
screen readers. **Action:** Always add explicit `aria-label` and `title`
attributes to all icon-only buttons to ensure they are accessible to users
relying on assistive technologies, providing both screen-reader support and
native browser tooltips.

## 2025-03-04 - Accessible tooltips and labels for hover/shortcut buttons

**Learning:** Icon-only action buttons (especially those visible only on hover
states or specific key presses like holding Control) must explicitly include
both descriptive `aria-label` attributes for screen readers and `title`
attributes for native tooltips, ensuring both accessibility compliance and good
UX. **Action:** When adding or auditing icon-only buttons, I will ensure they
have both `aria-label` and `title` attributes implemented (e.g.,
`aria-label="Restore thread" title="Restore thread"`).
## 2024-03-05 - Missing ARIA Labels on List Creation Operations
**Learning:** Core operations inside dynamically updating sections (like thread creation buttons within a list of threads) are critical targets for `aria-label` additions. Without them, screen readers may fail to distinctly identify the action or state of dynamic button components with icons. Additionally, when a creation action is happening (like creating a thread), disabling the button prevents unwanted duplicate form submissions while providing immediate UI feedback.
**Action:** Ensure dynamic buttons in list controls, especially creation and multi-deletion actions, explicitly contain `aria-label`, `title`, and handle disabled loading states correctly.
