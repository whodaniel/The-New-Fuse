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
