
## $(date +%Y-%m-%d) - Dynamic Status Announcements in Chat
**Learning:** Screen readers cannot automatically announce when a purely visual animation (like a typing indicator) appears or disappears, meaning visually impaired users lose context of when a chat agent is thinking or responding.
**Action:** Always wrap dynamic, transient status components (like typing dots or loading spinners) with `role="status"` and `aria-live="polite"` to ensure the UI announces changes naturally without interrupting the user. Additionally, hide visual-only animation DOM nodes using `aria-hidden="true"` to prevent screen reader noise.
