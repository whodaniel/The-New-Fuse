# Bolt's Journal

## 2026-02-20 - Broken Dependencies Block Testing
**Learning:** `apps/frontend/src/hooks/useWebSocket.ts` imports `@your-org/security/react` which is missing, and `../services/websocket.service` which doesn't exist (should be `WebSocketService`). This prevents `vitest` from running tests even if the hook is mocked, due to import analysis.
**Action:** When testing components using this hook, `vi.mock` alone is insufficient if the file is parsed. A temporary fix or environment alias is needed. The optimization can be verified by temporarily fixing the import, then reverting.

## 2026-02-20 - Inline Component Re-renders in Long Lists
**Learning:** Defining inline components like `MessageBubble` inside the parent component `MultiAgentChatUI` causes O(n) re-renders. Every keystroke triggers a render of the parent, which creates a new reference for the inline component, invalidating all existing rendered instances in the list even if their props didn't change.
**Action:** Extract list item components outside of their parent component and wrap them with `React.memo` to ensure list items only re-render when their explicit props (like `msg` and `agents`) change, vastly improving performance in input-heavy parent components.
