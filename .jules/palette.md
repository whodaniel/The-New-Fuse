## 2024-03-18 - A2A Agent Chat Screen Reader Updates

**Learning:** For dynamic real-time communication screens like
`A2AMultiAgentChat`, connection statuses (e.g. "Connecting...", "Connected") and
full-screen blocking UI states (like "Setting up A2A Agents...") are often
visually distinct but lack screen reader announcements, leaving users blind to
whether they can interact or why they are blocked. **Action:** When adding or
modifying real-time status badges or full-screen loading overlays in
communication components, always add `role="status"` and `aria-live="polite"` to
ensure screen readers narrate connection and setup state transitions
dynamically.
