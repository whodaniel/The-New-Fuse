## 2026-07-28 - Added Accessibility Attributes to Media Toggle Buttons
**Learning:** Found an accessibility issue pattern in media controls where icon-only buttons lacked proper screen reader text (ARIA labels) and toggle state indicators (aria-pressed). Screen readers would not be able to identify the purpose or state of the microphone and camera toggle buttons.
**Action:** Always ensure icon-only toggle buttons have descriptive, dynamic `aria-label` attributes and boolean `aria-pressed` states to communicate both function and current status to assistive technologies.
