## 2024-05-18 - Missing ARIA Labels on Icon-only Action Buttons
**Learning:** Found an accessibility issue pattern in the `ActiveWorkspaces` component where icon-only action buttons (like the one containing the `UploadSimple` icon) lacked descriptive labels, making them inaccessible to screen readers.
**Action:** Always add explicit `aria-label` and `title` attributes to all icon-only buttons to ensure they are accessible to users relying on assistive technologies, providing both screen-reader support and native browser tooltips.
