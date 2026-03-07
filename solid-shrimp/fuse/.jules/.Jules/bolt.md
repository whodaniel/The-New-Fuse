## 2026-03-02 - [Extract inline render function in ChatRoom]
**Learning:** Found a common performance pitfall in ChatRoom.tsx where the `renderMessage` function is defined inline within the component render body and maps over all messages. This causes O(n) re-renders of the entire message list on every keystroke in the chat input, severely degrading performance as the chat grows.
**Action:** Extract list items into standalone components and wrap them with `React.memo`. Only pass stable props or memoized callbacks to prevent unnecessary re-renders.
